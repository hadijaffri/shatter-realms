# JavaScript Modules

This directory contains modular JavaScript files extracted from `public/index.html` to improve code organization and enable better collaboration.

## Current Modules

### ✅ constants.js
- Shop items catalog with prices (100+ items)
- Default hotbar configuration
- Inventory configuration constants

**Usage:**
```javascript
import { shopItems, defaultHotbar } from './js/constants.js';
```

### ✅ utils.js
- Cookie helpers (`setCookie`, `getCookie`)
- Device ID management (`getDeviceId`)
- Random number helper
- Rarity color mapping

**Usage:**
```javascript
import { getCookie, setCookie, getRarityColor } from './js/utils.js';
```

## Planned Modules (Future Refactoring)

### 🔲 game.js
**Purpose:** Core game engine and Three.js setup
- Scene initialization
- Renderer configuration
- Post-processing setup (bloom, FXAA, color correction)
- Lighting system
- Terrain generation
- Game loop (update/render)

**Estimated Lines:** ~800

### 🔲 player.js
**Purpose:** Player controller and state management
- Player state (position, health, energy, velocity)
- Input handling (keyboard, mouse, touch)
- Movement physics
- Jump/sprint mechanics
- Camera control

**Estimated Lines:** ~400

### 🔲 enemies.js
**Purpose:** Enemy AI and spawning system
- Enemy types and behaviors
- Wave management
- Boss spawning
- AI pathfinding
- Enemy attack logic

**Estimated Lines:** ~600

### 🔲 weapons.js
**Purpose:** Weapon system and combat mechanics
- Weapon definitions
- Attack handling
- Projectile physics
- Hit detection
- Damage calculation
- Cooldown management

**Estimated Lines:** ~700

### 🔲 particles.js
**Purpose:** Particle effects system
- Particle creation (`createParticles`, `createSparkParticles`, `createMagicParticles`)
- Particle physics and lifecycle
- Visual effects for combat
- Environmental particles

**Estimated Lines:** ~300

### 🔲 ui.js
**Purpose:** User interface and HUD
- Menu management
- HUD updates (health, energy, coins)
- Damage numbers
- Wave announcements
- Settings panel
- Mobile controls

**Estimated Lines:** ~500

### 🔲 shop.js
**Purpose:** Shop system
- Shop UI rendering
- Purchase logic
- Coin package integration
- Weapon generation integration

**Estimated Lines:** ~200

### 🔲 inventory.js
**Purpose:** Inventory management
- Inventory UI
- Item storage
- Hotbar management
- Drag-and-drop
- Save/load inventory state

**Estimated Lines:** ~300

### 🔲 multiplayer.js
**Purpose:** Multiplayer networking
- PartySocket connection
- Position synchronization
- Combat event broadcasting
- Remote player rendering
- Match timer
- Kill/death tracking

**Estimated Lines:** ~400

## Refactoring Strategy

### Phase 1: Extract Data (✅ COMPLETE)
- Constants (shop items, config)
- Utility functions (cookies, helpers)

### Phase 2: Extract Systems (🔲 TODO)
1. Particle system (self-contained, few dependencies)
2. UI system (mostly independent)
3. Shop & Inventory (uses constants, relatively independent)

### Phase 3: Extract Core (🔲 TODO)
1. Player controller
2. Weapon system
3. Enemy system

### Phase 4: Extract Engine (🔲 TODO)
1. Game initialization and loop
2. Multiplayer networking

### Phase 5: Clean HTML (🔲 TODO)
- Reduce `public/index.html` to just:
  - HTML structure
  - Module imports
  - Initialization code

**Target:** Reduce from ~5000 lines to <500 lines

## Benefits of Modularization

1. **Collaboration:** Multiple developers can work on different systems simultaneously
2. **Maintainability:** Easier to find and fix bugs
3. **Testing:** Each module can be unit tested independently
4. **Reusability:** Modules can be shared across projects
5. **Code Review:** Smaller, focused files are easier to review
6. **Performance:** Browser can cache modules separately

## Migration Notes

### Breaking Changes to Avoid
- Keep all global game state accessible
- Maintain existing save format
- Don't change API contracts
- Preserve multiplayer protocol

### Testing Checklist
After each refactoring step:
- [ ] Singleplayer mode works (waves, combat, enemies)
- [ ] Shop functions (buy items, generate weapons)
- [ ] Inventory management (add, remove, reorder)
- [ ] Multiplayer mode (connect, sync, combat)
- [ ] Mobile controls responsive
- [ ] Save/load preserves progress

## Current Status

**Extracted:** 2/11 modules (18%)
**Lines Modularized:** ~250 / ~4500 (5.5%)

The core game logic remains in `public/index.html` for now to minimize risk. Incremental extraction will continue in future updates.

## Contributing

When adding new features, consider:
1. Is this a new system? → Create a new module
2. Does it fit an existing module? → Add it there
3. Is it a constant/config? → Add to `constants.js`
4. Is it a utility? → Add to `utils.js`

See [CONTRIBUTING.md](../../CONTRIBUTING.md) for full guidelines.
