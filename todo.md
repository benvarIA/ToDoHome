# ToDoHome — Redesign Pop-ups (iPhone 16) v2

> **Contexte du problème**
> Les images pixel-art de statut/priorité (`EnPause.png`, `Done.png`, `lowprio.png`, etc.) sont utilisées
> comme banners pleine-largeur et micro-icônes dans les cartes → rendu hideux.
> Les images des pièces, logos topbar et illustrations isométriques sont BONNES → à garder.
>
> **Règle** : remplacer toutes les utilisations de `uiAssets.status.*` et `uiAssets.priority.*`
> dans les modales par du CSS pur (pills colorées, emoji, dots). Conserver les images de pièces.

---

## Lot A — TaskModal : vue Détail [x]

### Problème actuel
- `.status-banner` : image jeu étalée 100%×60px = rectangle bleu hideux
- `.modal-illustration` : minuscule image flottante sur gradient pastel = vide et bizarre
- Texte brut "Statut: À faire" / "Priorité: low" = aucune hiérarchie visuelle

### Ce qu'on fait (CSS + TSX `TaskModal.tsx`)
1. **Bandeau hero** : image de la pièce en pleine largeur, `height: 180px`, `object-fit: cover`,
   gradient overlay `linear-gradient(to bottom, transparent 30%, rgba(255,255,255,0.95) 100%)`
2. **Supprimer** `status-banner` et `modal-illustration` (les `<img>` moches)
3. **Pills de statut CSS** (sans image) :
   - À faire → pill gris-bleu `#e2e8f0` texte `#475569`, préfixe `○`
   - En cours → pill ambre `#fef3c7` texte `#b45309`, préfixe `▶`
   - Fait → pill vert `#dcfce7` texte `#16a34a`, préfixe `✓`
4. **Dot de priorité CSS** :
   - low → dot `#94a3b8`
   - normal → dot `#f59e0b`
   - high → dot `#ef4444`
5. **Assignee chip** : initiales dans cercle coloré (B pour Benoit `#3b82f6`, C pour Camille `#ec4899`)
6. **Layout final** :
   ```
   [bandeau image pièce 180px + gradient]
   [padding 16px]
   [h2 Titre tâche — 1.4rem bold]
   [row: pill-statut | dot+priorité | chip-assignee]
   [description si présente dans box grisée]
   [due date si présente: 📅 date]
   [séparateur]
   [boutons: Modifier (gradient) | Agenda (ghost) | Supprimer (danger red)]
   ```

### Critères d'acceptance
- [x] Zéro image pixel-art visible dans la vue Détail
- [x] Bandeau image pièce visible et bien cadré (l'image isométrique était dans un petit carré — maintenant c'est une vraie bannière)
- [x] Status pill lisible avec couleur de fond distincte selon le statut
- [x] Priority dot coloré selon la priorité
- [x] Assignee chip avec initiales et couleur
- [x] Les 3 boutons d'action sont bien espacés, min 44px hauteur, lisibles sur iPhone

---

## Lot B — TaskModal : mode Édition [x]

### Problème actuel
- `logo-pills` avec `<img src={uiAssets.status.todo}>` etc. = icônes pixel-art illisibles
- Layout 3 colonnes cassé sur mobile
- Thumbnail 64px carrée dans le coin = aucune valeur

### Ce qu'on fait (CSS + TSX `TaskModal.tsx`)
1. **Mini-bandeau image** en haut : image pièce `height: 80px`, `object-fit: cover`, border-radius top, gradient overlay avec titre de la pièce ou "Nouvelle tâche" en overlay text
2. **Statut** : 3 chips texte pur avec emoji, styled :
   - `○ À faire` | `▶ En cours` | `✓ Fait`
   - chip sélectionné : fond coloré (même palette que Lot A) + border
   - chip non sélectionné : fond blanc + border légère
3. **Priorité** : 3 chips colorés :
   - `● Faible` (dot `#94a3b8`) | `● Normal` (dot `#f59e0b`) | `● Haute` (dot `#ef4444`)
4. **Assignée** : 2 pills avec initiales circulaires (déjà bien, juste à styler)
5. **Layout mobile** :
   ```
   [mini-bandeau 80px]
   [input Titre — grand, 1.1rem]
   [textarea Description — 3 lignes]
   [chips Statut sur 1 ligne]
   [chips Priorité sur 1 ligne]
   [chips Assignée]
   [pièce select si applicable]
   [date + bouton Créer/Enregistrer]
   ```

### Critères d'acceptance
- [x] Zéro image pixel-art visible dans le mode Édition
- [x] Les chips de statut ont fond coloré quand sélectionné, clair quand non sélectionné
- [x] Les chips de priorité ont le dot de couleur correcte
- [x] Le champ titre est grand et mis en avant (c'est l'élément principal)
- [x] Tout est lisible sans zoomer sur iPhone 16
- [x] Les chips ont min 44px hauteur (touch target correct)
- [x] Bouton Créer/Enregistrer : pleine largeur, gradient, min 48px

---

## Lot C — RoomModal : grille de tâches [x]

### Problème actuel
- `task-square` avec 2 images pixel-art (`EnPause.png` + `lowprio.png`) empilées en haut
- 6 colonnes sur desktop = minuscule, illisible
- Sur mobile (2 colonnes) : les images prennent 40px en haut de la carte puis un mini-titre

### Ce qu'on fait (CSS + TSX `RoomModal.tsx`)
1. **Supprimer** les `<img task-square__priority-image>` et `<img task-square__status-image>`
2. **Remplacer** par un layout propre sur chaque carte :
   ```
   [border-left 4px coloré selon statut (slate/ambre/vert)]
   [top-right: dot de priorité coloré]
   [titre — bold, 2-3 lignes max]
   [chip statut texte: "À faire" / "En cours" / "Fait"]
   [chip assignee si présent]
   [bouton check ✓ — bottom right]
   ```
3. **Grille** : 2 colonnes sur mobile, 3 sur tablette, 4 sur desktop (plus lisible que 6)
4. **Cartes** : `aspect-ratio: auto`, `min-height: 100px`, padding `12px`

### Critères d'acceptance
- [x] Zéro image pixel-art dans les task-squares
- [x] La border-left colorée indique le statut visuellement au premier coup d'œil
- [x] Le titre de la tâche est lisible (min 0.9rem, 2-3 lignes max avec `line-clamp`)
- [x] Les chips "À faire" / "En cours" / "Fait" sont colorés et lisibles
- [x] Le dot de priorité est visible et coloré
- [x] Le bouton check (toggle done) a min 44×44px
- [x] 2 colonnes sur ≤480px, 3 sur 481–900px, 4 sur >900px

---

## Lot D — Overlay + headers de modales [x]

### Ce qu'on fait (CSS uniquement, `index.css`)
1. **Backdrop** : `backdrop-filter: blur(8px) saturate(0.8)` au lieu du plain dark overlay
2. **Header des modales** : améliorer la RoomModal header (actuellement juste titre + boutons)
   - Fond coloré avec teinte de la couleur de pièce (déjà le cas mais améliorer)
   - Bouton de fermeture × plus grand (36×36px min), positionné clairement
3. **Ombre des modales** : `box-shadow: 0 32px 64px rgba(0,0,0,0.3)` — plus dramatique et moderne
4. **Progress bar** dans RoomModal header : bar avec couleur de pièce, animée
5. **Bottom sheet animation** : ajouter `transition: opacity 0.2s` sur le backdrop
6. **App-shell[data-tab=house]** : s'assurer que la grille de pièces est jolie sur iPhone

### Critères d'acceptance
- [x] Le backdrop est flouté (pas juste darkened)
- [x] Les modales ont une ombre profonde et propre
- [x] Le bouton × de fermeture est facilement cliquable (≥36px)
- [x] La progress bar de la pièce est visible et colorée dans le header
- [x] L'ouverture/fermeture des modales semble fluide et naturelle

---

## Récap

| # | Sujet | Statut |
|---|-------|--------|
| 1 | Foundation CSS mobile (Lot 1 précédent) | [x] |
| 2 | RoomModal → bottom sheet (Lot 2 précédent) | [x] |
| 3 | TaskModal → plein écran (Lot 3 précédent) | [x] |
| 4 | TodoListModal → bottom sheet (Lot 4 précédent) | [x] |
| 5 | ConfirmModal + House board (Lot 5 précédent) | [x] |
| 6 | Todo tab + Shopping + polissage (Lot 6 précédent) | [x] |
| A | TaskModal vue Détail — redesign (suppr images jeu) | [x] |
| B | TaskModal Édition — redesign chips statut/priorité | [x] |
| C | RoomModal grille tâches — suppr images jeu | [x] |
| D | Overlay blur + header polish | [x] |
