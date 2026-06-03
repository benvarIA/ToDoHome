# ToDoHome — Specs techniques, UI/UX & fonctionnelles

> Application de gestion des tâches de la maison, organisées **par pièce**, partagées dans le couple, avec agenda, listes (courses / à faire), tâches récurrentes et rappels.

**Date de rédaction :** 2026-06-03
**Statut :** Fonctionnel (en développement actif — phase de redesign des pop-ups)
**Stack :** React 19 + TypeScript + Vite · CSS pur · persistance **localStorage** · pas de backend
**Port :** 3001 (registre de ports du portfolio)

---

## 1. Contexte & Problème

Gérer les tâches domestiques à deux (ex. Benoit & Camille) est vite chaotique : qui fait quoi, dans quelle pièce, quelles tâches reviennent régulièrement. **ToDoHome** organise tout **par pièce de la maison**, avec assignation, priorités, échéances, plans récurrents, et une vue agenda — le tout sur un seul device, persisté localement.

---

## 2. Architecture

```
src/
  domain/        → types.ts, defaultData.ts, imageCatalog.ts, uiAssets.ts
  services/      → taskService, roomService, calendarService,
                   notificationService, storage (localStorage), id
  store/         → AppStore.tsx (état global React)
  components/    → RoomCard, RoomModal, TaskModal, TaskChip, AgendaView,
                   FilterBar, ShoppingListModal, TodoListModal,
                   CalendarDraftModal, AssigneeModal, RoomPieChart,
                   ColorModeToggle, ConfirmModal, Modal
  App.tsx, App.css, index.css, main.tsx
```

- **State** centralisé dans `store/AppStore.tsx`, logique métier dans `services/`.
- **Persistance** : `localStorage` via `services/storage.ts` (pas de serveur).

---

## 3. Modèle de données (`domain/types.ts`)

### Room (pièce)
`id`, `name`, `color`, `image`, `order`

### Task
`id`, `title`, `description`, `roomId`, `status` (`todo`/`in_progress`/`done`), `priority` (`low`/`normal`/`high`), `assignee` (`me`/`wife`/null), `dueDate`, `color`, `subtasks[]`, `recurringPlanId?`, `recurringDueDate?`, `createdAt`, `updatedAt`

### SubTask
`id`, `label`, `done`

### RecurringPlan (tâche récurrente)
`id`, `title`, `roomId`, `frequencyDays`, `nextDueDate`, `active`, `createdAt`

### Calendar / CalendarEvent
`Calendar { id, name, owner }` · `CalendarEvent { id, calendarId, title, description, start, end }`

### Filters
`search`, `status`, `priority`, `assignee`, `due` (`all`/`today`/`week`/`overdue`)

**Réglages d'affichage :** `ColorMode` = `room` | `assignee` | `priority` · `SortOption` = `priority` | `due` | `recent` | `alpha`

---

## 4. Specs fonctionnelles

### 4.1 Pièces (Maison)
- [ ] Création/édition d'une pièce (nom, couleur, image, ordre)
- [ ] `RoomCard` : aperçu de la pièce + camembert d'avancement (`RoomPieChart`)
- [ ] `RoomModal` : grille des tâches de la pièce

### 4.2 Tâches
- [ ] CRUD tâche (titre, description, pièce, statut, priorité, assignée, échéance, sous-tâches)
- [ ] Vue **Détail** + mode **Édition** dans `TaskModal`
- [ ] Cocher rapidement une tâche (check) ; sous-tâches cochables
- [ ] `TaskChip` : pastille de statut + dot de priorité + chip assignée (initiales colorées)

### 4.3 Tâches récurrentes
- [ ] Plan récurrent (fréquence en jours) qui régénère la tâche à `nextDueDate`
- [ ] Activation/désactivation d'un plan

### 4.4 Filtres & tri
- [ ] `FilterBar` : recherche, statut, priorité, assignée, échéance (today/week/overdue)
- [ ] Tri : priorité / échéance / récent / alphabétique
- [ ] **ColorMode** : colorier les tâches par pièce, par personne, ou par priorité

### 4.5 Agenda
- [ ] `AgendaView` : tâches & événements positionnés dans le temps
- [ ] `CalendarDraftModal` : créer un brouillon d'événement depuis une tâche (date d'échéance → agenda)
- [ ] Calendriers par propriétaire (me / wife)

### 4.6 Listes
- [ ] **Liste de courses** (`ShoppingListModal`)
- [ ] **Liste à faire** générique (`TodoListModal`)

### 4.7 Rappels
- [ ] `notificationService` : notifications pour les tâches dues / en retard

### 4.8 Onglet IA (prévu)
- [ ] Onglet `ai` (assistant) — voir roadmap

---

## 5. UI / UX

### Navigation (onglets)
```
home   → accueil / vue d'ensemble
house  → pièces de la maison
todo   → listes (courses / à faire)
ai     → assistant (à venir)
```

### Direction visuelle (redesign en cours — cible iPhone 16)
- **Bannière hero** par pièce : image isométrique en pleine largeur (180px) + overlay gradient.
- **Statuts en pills CSS** (plus d'images pixel-art) :
  - À faire → pill gris-bleu `#e2e8f0`/`#475569`, préfixe `○`
  - En cours → pill ambre `#fef3c7`/`#b45309`, préfixe `▶`
  - Fait → pill vert `#dcfce7`/`#16a34a`, préfixe `✓`
- **Priorité en dot CSS** : low `#94a3b8` · normal `#f59e0b` · high `#ef4444`.
- **Assignée** : initiales dans cercle coloré (B = Benoit `#3b82f6`, C = Camille `#ec4899`).
- **Touch targets** ≥ 44px, boutons d'action pleine largeur ≥ 48px, lisibilité sans zoom sur iPhone 16.
- **Conserver** : images des pièces, logos topbar, illustrations isométriques (bonnes). **Bannir** : `uiAssets.status.*` et `uiAssets.priority.*` (pixel-art moche) → remplacés par CSS pur.

---

## 6. Commandes

```bash
npm run dev      # Vite (port 3001)
npm run build    # tsc -b && vite build
npm run lint
```

---

## 7. Hors scope / roadmap

- Synchronisation multi-device (actuellement localStorage local uniquement)
- Backend / comptes partagés en temps réel
- Onglet IA (assistant de planification) — à spécifier
- Intégration calendrier externe (Google/Apple) au-delà des brouillons internes
