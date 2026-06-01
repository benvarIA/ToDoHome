import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { DatabaseSync } from 'node:sqlite'
import { randomUUID } from 'node:crypto'
import type { IncomingMessage, ServerResponse } from 'node:http'

// ── Types ────────────────────────────────────────────────────────────────────

interface EnvConfig {
  TELEGRAM_BOT_TOKEN: string
  TELEGRAM_CHAT_ME: string
  TELEGRAM_CHAT_WIFE: string
}

interface TelegramUpdate {
  update_id: number
  message?: {
    message_id: number
    chat: { id: number }
    text?: string
    voice?: { file_id: string; duration: number; mime_type?: string }
    video_note?: { file_id: string; duration: number }
  }
}

interface AppState {
  version: number
  tasks: AppTask[]
  [key: string]: unknown
}

interface AppTask {
  id: string
  title: string
  description: string
  roomId: string | null
  status: string
  priority: string
  assignee: string | null
  dueDate: string | null
  color: string
  subtasks: unknown[]
  createdAt: string
  updatedAt: string
}

// ── Telegram helpers ─────────────────────────────────────────────────────────

const sendTelegramMessage = async (token: string, chatId: string, text: string) => {
  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    })
  } catch { /* non-blocking */ }
}


// ── Parsing français local (zéro API) ────────────────────────────────────────

const norm = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()

// Commandes d'ajout
const RE_ADD    = /^(?:ajoute[rz]?|rajoute[rz]?|mets?|note[rz]?|achète[rz]?|prends?|commande[rz]?|il\s+(?:nous\s+)?(?:faut|manque)|on\s+(?:manque\s+de|n['']\s*a\s+plus\s+de|a\s+besoin\s+de|a\s+plus\s+de)|j['']\s*ai\s+besoin\s+de|jai\s+besoin\s+de|pense[rz]?\s+[aà]|rappelle[\s-]moi(?:\s+d['']\s*acheter)?)\s+/i
// Commandes de suppression
const RE_REMOVE = /^(?:retire[rz]?|enlève[rz]?|supprime[rz]?|efface[rz]?|vire[rz]?|j['']\s*ai\s+(?:achet[eé]|pris|eu)|on\s+a\s+(?:achet[eé]|pris)|c['']\s*est\s+(?:fait|achet[eé]|ok)|barre[rz]?|raye[rz]?)\s+/i
const RE_SUFFIX = /\s+(?:pour|svp\.?|s['']\s*il\s+(?:te|vous)\s+pla[iî]t\.?|merci\.?).*$/i
const RE_DET    = /^(?:du\s+|de\s+la\s+|de\s+l['']\s*|des\s+|de\s+|un\s+peu\s+de\s+|une?\s+|le\s+|la\s+|les\s+|d['']\s*)/i

const splitItems = (t: string): string[] =>
  t
    .split(/\s*(?:,|;|\set\b|\+|\/)\s*/i)
    .map((p) => p.replace(RE_DET, '').replace(/[.!?]+$/, '').trim())
    .filter((p) => p.length >= 2 && p.length <= 60)

// Retourne { intent: 'add'|'remove', items }
const parseMessage = (raw: string): { intent: 'add' | 'remove'; items: string[] } => {
  let t = raw.trim()
  if (RE_REMOVE.test(t)) {
    t = t.replace(RE_REMOVE, '').replace(RE_SUFFIX, '')
    return { intent: 'remove', items: splitItems(t) }
  }
  t = t.replace(RE_ADD, '').replace(RE_SUFFIX, '')
  return { intent: 'add', items: splitItems(t) }
}

// ── Bot polling ───────────────────────────────────────────────────────────────

const startBotPolling = (
  env: EnvConfig,
  selectStmt: ReturnType<DatabaseSync['prepare']>,
  upsertStmt: ReturnType<DatabaseSync['prepare']>,
) => {
  if (!env.TELEGRAM_BOT_TOKEN) return

  const authorized = new Set([env.TELEGRAM_CHAT_ME, env.TELEGRAM_CHAT_WIFE].filter(Boolean))

  const addItems = (items: string[]) => {
    const row = selectStmt.get() as { payload?: string } | undefined
    if (!row?.payload) return
    const state = JSON.parse(row.payload) as AppState
    const now = new Date().toISOString()
    const tasks: AppTask[] = items.map((item) => ({
      id: `task-${randomUUID()}`,
      title: `🛒 ${item.charAt(0).toUpperCase()}${item.slice(1)}`,
      description: 'Liste Courses',
      roomId: null,
      status: 'todo',
      priority: 'normal',
      assignee: null,
      dueDate: null,
      color: '#f59e0b',
      subtasks: [],
      createdAt: now,
      updatedAt: now,
    }))
    state.tasks = [...tasks, ...state.tasks]
    upsertStmt.run(JSON.stringify(state))
  }

  let offset = 0

  const poll = async () => {
    for (;;) {
      try {
        const res = await fetch(
          `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/getUpdates` +
          `?offset=${offset}&timeout=30&allowed_updates=${encodeURIComponent('["message"]')}`,
          { signal: AbortSignal.timeout(40_000) },
        )
        if (!res.ok) { await new Promise((r) => setTimeout(r, 5_000)); continue }

        const data = await res.json() as { ok: boolean; result: TelegramUpdate[] }
        if (!data.ok || !data.result.length) continue

        for (const update of data.result) {
          offset = update.update_id + 1
          const msg = update.message
          if (!msg) continue

          const chatId = String(msg.chat.id)
          if (!authorized.has(chatId)) continue

          if (msg.text?.startsWith('/start')) {
            await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId,
              '👋 Envoie-moi ce qu\'il faut acheter, en texte ou en vocal !\n\n' +
              'Ex : <i>"lait, œufs et beurre"</i>')
            continue
          }

          try {
            let items: string[]

            if (msg.text && !msg.text.startsWith('/')) {
              items = itemsFromText(msg.text)

            } else if (msg.voice ?? msg.video_note) {
              await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId,
                '🎤 Les messages vocaux ne sont pas encore supportés.\nEnvoie un message texte !')
              continue

            } else {
              continue
            }

            if (!items.length) {
              await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId,
                "🤔 Pas d'articles trouvés. Essaie : <i>\"lait, œufs et beurre\"</i>")
              continue
            }

            addItems(items)
            await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId,
              `✅ Ajouté à la liste :\n\n${items.map((i) => `• ${i}`).join('\n')}`)

          } catch (err) {
            console.error('[BenvariBot]', err)
            await sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId, '❌ Erreur lors du traitement.')
          }
        }
      } catch {
        await new Promise((r) => setTimeout(r, 5_000))
      }
    }
  }

  void poll()
  console.log('[BenvariBot] Polling démarré ✓')
}

// ── Vite plugin ───────────────────────────────────────────────────────────────

const createStateApiPlugin = (env: EnvConfig) => {
  const dbPath = resolve(process.cwd(), 'data', 'todohome.sqlite')
  mkdirSync(dirname(dbPath), { recursive: true })
  const db = new DatabaseSync(dbPath)
  db.exec(`
    CREATE TABLE IF NOT EXISTS app_state (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      payload TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `)

  const selectStmt = db.prepare('SELECT payload FROM app_state WHERE id = 1')
  const upsertStmt = db.prepare(`
    INSERT INTO app_state (id, payload, updated_at)
    VALUES (1, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET
      payload = excluded.payload,
      updated_at = CURRENT_TIMESTAMP
  `)

  const readBody = async (req: IncomingMessage) => {
    const chunks: Uint8Array[] = []
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
    }
    return Buffer.concat(chunks).toString('utf8')
  }

  const sendJson = (res: ServerResponse, code: number, payload: unknown) => {
    res.statusCode = code
    res.setHeader('Content-Type', 'application/json; charset=utf-8')
    res.end(JSON.stringify(payload))
  }

  const telegramChatIds: Record<string, string> = {
    me: env.TELEGRAM_CHAT_ME,
    wife: env.TELEGRAM_CHAT_WIFE,
  }

  const handler = async (req: IncomingMessage, res: ServerResponse, next: () => void) => {
    if (req.url === '/api/notify' && req.method === 'POST') {
      try {
        const body = await readBody(req)
        const parsed = JSON.parse(body) as { taskTitle?: string; assignee?: string }
        const { taskTitle, assignee } = parsed
        if (assignee && taskTitle && env.TELEGRAM_BOT_TOKEN) {
          const chatId = telegramChatIds[assignee]
          if (chatId) {
            const label = assignee === 'me' ? 'Benoit' : 'Camille'
            void sendTelegramMessage(env.TELEGRAM_BOT_TOKEN, chatId,
              `📋 <b>Nouvelle tâche assignée</b>\n\n${label}, tu as une nouvelle tâche : <b>${taskTitle}</b>`)
          }
        }
        sendJson(res, 200, { ok: true })
      } catch { sendJson(res, 400, { ok: false, error: 'invalid json' }) }
      return
    }

    if (!req.url?.startsWith('/api/state')) { next(); return }

    if (req.method === 'GET') {
      const row = selectStmt.get() as { payload?: string } | undefined
      if (!row?.payload) { sendJson(res, 200, { state: null }); return }
      try { sendJson(res, 200, { state: JSON.parse(row.payload) }) }
      catch { sendJson(res, 200, { state: null }) }
      return
    }

    if (req.method === 'POST') {
      try {
        const body = await readBody(req)
        const parsed = JSON.parse(body) as { state?: unknown }
        if (!parsed || typeof parsed !== 'object' || !('state' in parsed)) {
          sendJson(res, 400, { ok: false, error: 'invalid payload' }); return
        }
        upsertStmt.run(JSON.stringify(parsed.state))
        sendJson(res, 200, { ok: true })
      } catch { sendJson(res, 400, { ok: false, error: 'invalid json' }) }
      return
    }

    sendJson(res, 405, { ok: false, error: 'method not allowed' })
  }

  type ViteServer = { middlewares: { use: (fn: (req: IncomingMessage, res: ServerResponse, next: () => void) => void) => void } }
  let pollingStarted = false
  const startPolling = () => { if (pollingStarted) return; pollingStarted = true; startBotPolling(env, selectStmt, upsertStmt) }

  return {
    name: 'todohome-state-api',
    configureServer(server: ViteServer) {
      server.middlewares.use((req, res, next) => { void handler(req, res, next) })
      startPolling()
    },
    configurePreviewServer(server: ViteServer) {
      server.middlewares.use((req, res, next) => { void handler(req, res, next) })
      startPolling()
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '') as unknown as EnvConfig
  return {
    plugins: [react(), createStateApiPlugin(env)],
    server: {
      port: parseInt(process.env.VITE_PORT || '3001', 10),
      host: 'localhost',
    },
  }
})
