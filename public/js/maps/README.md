# ShatterRealms Map System

This directory contains map definitions and modules for ShatterRealms multiplayer arena.

## Map Files

### Central Catalog

- **maps.js** - Central map catalog with all map definitions and helper functions

### Individual Map Modules

Each map has a dedicated class module with environmental mechanics and hazard systems.

## Available Maps

### Original Maps (3)

1. **Ridge Plaza** (`ridge-plaza`)
   - Id: `arena-ridge`
   - Standard arena terrain

2. **Stone Shelf** (`stone-shelf`)
   - Id: `arena-shelf`
   - Elevated platform arena

3. **Valley Run** (`valley-run`)
   - Id: `arena-valley`
   - Valley terrain with varied elevation

### New Maps (11)

#### 4. **Inferno Peaks** (`inferno-peaks`)

- **File**: `inferno-peaks.js`
- **Environment**: Volcanic landscape
- **Key Features**:
  - Active lava flows that damage players
  - Geysers that erupt periodically
  - Falling ash particle effects
  - Hot environment affects movement speed
- **Spawn Points**: 4 teams at cardinal positions

#### 5. **Crystalline Cavern** (`crystalline-cavern`)

- **File**: `crystalline-cavern.js`
- **Environment**: Underground crystal-filled cavern
- **Key Features**:
  - Reflective crystal surfaces mirror damage
  - Unstable crystals that explode
  - Magical resonance fields
  - Weapon damage amplification (+10%)
- **Spawn Points**: 4 teams at varied heights

#### 6. **Frozen Tundra** (`frozen-tundra`)

- **File**: `frozen-tundra.js`
- **Environment**: Arctic ice plains
- **Key Features**:
  - Slippery ice surfaces (50% friction)
  - Blizzard wind currents push players
  - Thin ice patches that break
  - Cold damage zones
- **Spawn Points**: 4 teams spread across tundra

#### 7. **Shadow Abyss** (`shadow-abyss`)

- **File**: `shadow-abyss.js`
- **Environment**: Dark void with floating platforms
- **Key Features**:
  - Falling into abyss = instant death
  - Shadow creatures phase through terrain
  - Reality tears cause area damage
  - Lower gravity modifier
  - Night mode lighting
- **Spawn Points**: 4 teams on isolated platforms

#### 8. **Sky Fortress** (`sky-fortress`)

- **File**: `sky-fortress.js`
- **Environment**: Castle suspended in clouds
- **Key Features**:
  - Narrow bridge walkways with fall risk
  - Wind currents affect movement and projectiles
  - Lightning strikes during storms
  - Falling cloud debris
- **Spawn Points**: 4 teams on fortress towers

#### 9. **Toxic Marsh** (`toxic-marsh`)

- **File**: `toxic-marsh.js`
- **Environment**: Poisonous swamp
- **Key Features**:
  - Toxic gas clouds cause damage over time
  - Quicksand pools restrict movement
  - Acid splash zones
  - Constant low environmental damage
- **Spawn Points**: 4 teams on safer ground patches

#### 10. **Ancient Temple** (`ancient-temple`)

- **File**: `ancient-temple.js`
- **Environment**: Mystical ruins with ritual circles
- **Key Features**:
  - Ritual circles provide power-ups
  - Ancient curses debuff players
  - Temporal distortion zones
  - Guardian constructs defend areas
- **Spawn Points**: 4 teams around temple perimeter

#### 11. **Shattered Isles** (`shattered-isles`)

- **File**: `shattered-isles.js`
- **Environment**: Archipelago with water hazards
- **Key Features**:
  - Multiple island platforms
  - Deep water deals damage/instant kill
  - Sea creatures attack players
  - Whirlpools and currents
  - Bridges connect islands
- **Spawn Points**: 4 teams on separate islands

#### 12. **Neon Wasteland** (`neon-wasteland`)

- **File**: `neon-wasteland.js`
- **Environment**: Post-apocalyptic futuristic ruins
- **Key Features**:
  - Glowing neon structures
  - Radiation zones cause damage
  - Explosive debris fields
  - Electromagnetic pulses disable systems
- **Spawn Points**: 4 teams in safe zones

#### 13. **Void Sanctum** (`void-sanctum`)

- **File**: `void-sanctum.js`
- **Environment**: Abstract dimensional space
- **Key Features**:
  - Impossible non-euclidean geometry
  - Dimension tears randomly appear
  - Reality warping distorts perception
  - Teleportation anomalies
  - Spatial paradox architecture
- **Spawn Points**: 4 teams at dimensional anchors

#### 14. **Dragon's Roost** (`dragons-roost`)

- **File**: `dragons-roost.js`
- **Environment**: Ancient dragon's lair
- **Key Features**:
  - Massive dragon statues as landmarks
  - Gold hoard piles provide cover
  - Dragon breath fire hazards
  - Fire pits with lava
  - Unstable treasure piles collapse
- **Spawn Points**: 4 teams around roost perimeter

## Map Properties

### Shared Properties

- **width**: Terrain width in units
- **height**: Terrain height in units
- **texture**: Base terrain color and materials
- **spawnPoints**: Array of team spawn locations with coordinates
- **hazards**: Array of environmental hazards (TODO: implement)
- **landmarks**: Array of notable structures (TODO: implement)
- **environmentalEffects**: Visual and physics modifiers

### Hazard Types

- Damage zones (lava, acid, radiation, cold)
- Movement restrictions (quicksand, ice, wind)
- Falling hazards (pits, chasms, abyss)
- Time-based effects (poison, curse, cold)
- Reality distortions (teleports, warping)

## Implementation Structure

Each map module includes:

- Constructor for initialization
- Terrain generation method
- Hazard setup methods
- Physics/environmental update methods
- Collision detection methods
- Utility helper methods

All methods currently contain TODO comments indicating implementation tasks.

## Helper Functions (maps.js)

- `getMapById(mapId)` - Retrieve map configuration
- `validateMapSpawnPoints(map)` - Validate spawn configuration
- `getMapHazards(mapId)` - Get hazard array for map
- `getMapLandmarks(mapId)` - Get landmark array for map

## Usage

```javascript
import { mapCatalog, getMapById } from './maps.js';
import InfernoPeaksMap from './maps/inferno-peaks.js';

// Get map config
const config = getMapById('inferno-peaks');

// Create map instance
const map = new InfernoPeaksMap(config);

// Initialize map systems
map.generateTerrain();
map.initializeLavaFlows();
map.initializeGeysers();
```

## Future Implementation

Maps are scaffolded with TODO comments marking implementation requirements:

1. **Terrain Generation** - HeightMap-based terrain creation
2. **Hazard Systems** - Damage zones, movement effects, particle effects
3. **Physics** - Collision, gravity, friction modifiers
4. **Visuals** - Textures, particles, lighting effects
5. **Audio** - Environmental ambience, hazard sounds
6. **AI Creatures** - Spawning, pathfinding, combat behavior
7. **Dynamic Events** - Cyclic hazard patterns, environmental changes

## Statistics

- **Total Maps**: 14 (3 original + 11 new)
- **Module Files**: 11 individual map class modules
- **Catalog File**: 1 central maps.js
- **Lines of Code**: ~800+ lines of scaffolding
- **Implementation Status**: Unimplemented (structure only)
