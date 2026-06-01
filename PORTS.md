# Port Management System

## Overview
This document explains how ports are permanently assigned and managed across all applications in the "MAIN CODEX PROJECTS" workspace.

**Key Principle:** Ports are **NEVER** assigned dynamically. Once set, they remain fixed unless explicitly requested to change.

---

## Port Registry

The **source of truth** for all port assignments is:
`/Volumes/NAS/MAIN CODEX PROJECTS/Assistant Perso/.ports-registry.json`

```json
{
  "todohome":       { "frontend": 3001, "backend": null },
  "appmanager":     { "frontend": 3000, "backend": 8000 },
  "embymanager":    { "frontend": 3002, "backend": 8001 },
  "mixagemastering":{ "frontend": 3003, "backend": null },
  "pokequizz":      { "frontend": 3004, "backend": null },
  "scrobblervari":  { "frontend": 3007, "backend": null }
}
```

---

## Current Port Assignments

| Application | Frontend | Backend | Start Command |
|---|---|---|---|
| **App Manager** | http://localhost:3000 | http://localhost:8000 | `cd "App Manager" && npm run dev` |
| **ToDoHome** | http://localhost:3001 | — | `cd ToDoHome && npm run dev` |
| **EmbyManager** | http://localhost:3002 | http://localhost:8001 | `cd JellyFinManager && npm run dev` |
| **Mixage Mastering IA** | http://localhost:3003 | — | `cd "Mixage Mastering IA/webapp" && npm run dev` |
| **PokeQuizz** | http://localhost:3004 | — | `cd PokeQuizz && npm run dev` |
| **ScrobblerVari** | http://localhost:3007 | — | `cd ScrobblerVari && npm run dev` |

---

## How It Works

### 1. **Central Configuration**
Each application reads its port from **environment variables** defined in `.env.local`:

```env
# .env.local
VITE_PORT=3001    # Frontend port (read by vite.config)
PORT=8000         # Backend port (read by server/index.js)
API_PORT=8000     # Proxy target (read by vite.config for API calls)
```

### 2. **Frontend Configuration** (Vite)
In `vite.config.js` / `vite.config.ts`:
```javascript
server: {
  port: parseInt(process.env.VITE_PORT || '3001', 10),
  proxy: {
    "/api": {
      target: `http://localhost:${process.env.API_PORT || 8000}`,
    },
  },
}
```

### 3. **Backend Configuration** (Express/Fastify)
In `server/index.js`:
```javascript
const API_PORT = Number(process.env.PORT || 8001);
app.listen(API_PORT, host, ...);
```

---

## Adding a New Application

When adding a new app, follow this process:

### 1. Register in `.ports-registry.json`
```json
{
  "newapp": {
    "name": "New App",
    "path": "../NewApp",
    "type": "React (Vite only) | React + Express",
    "frontend": 3008,
    "backend": 8002,
    "url": "http://localhost:3008"
  }
}
```

### 2. Create `.env.local` in the app directory
```env
# Port Configuration (from central registry)
VITE_PORT=3008
PORT=8002
API_PORT=8002
```

### 3. Update `vite.config.ts`
```javascript
export default defineConfig({
  server: {
    port: parseInt(process.env.VITE_PORT || '3008', 10),
    proxy: {
      "/api": {
        target: `http://localhost:${process.env.API_PORT || 8002}`,
      },
    },
  },
});
```

### 4. Update `server/index.js` (if applicable)
```javascript
const API_PORT = Number(process.env.PORT || 8002);
```

---

## Rules & Best Practices

✅ **DO:**
- Keep `.ports-registry.json` as the source of truth
- Always use environment variables in configs
- Increment ports sequentially (3000, 3001, 3002… pour les frontends ; 8000, 8001… pour les backends)
- Document any changes to the registry

❌ **DON'T:**
- Hardcode ports directly in source code
- Change ports without updating `.ports-registry.json`
- Use dynamic or random port assignment
- Run the same app on different ports

---

## Troubleshooting

### Port Already in Use
If you get "port already in use" error:

1. Check `.ports-registry.json` to confirm the assignment
2. Verify the correct app is running with: `lsof -i :3001`
3. If conflict exists, reassign ports (update both registry and `.env.local`)

### Port Changes Not Taking Effect
1. Verify `.env.local` is updated
2. Kill the dev server and restart
3. Clear Vite cache if needed: `rm -rf node_modules/.vite`

---

## History
- **2026-04-26:** Centralized port management system implemented
- **2026-05-17:** ToDoHome déplacé vers `/Volumes/NAS/MAIN CODEX PROJECTS/ToDoHome/`, PORTS.md migré dans le dossier ToDoHome, chemins mis à jour, vite.config.ts corrigé pour lire VITE_PORT
