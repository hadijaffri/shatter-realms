# ShatterRealms Map System

Map definitions for the ShatterRealms multiplayer arena.

## Architecture

Maps are configured via the inline `mapCatalog` array in `public/index.html`. The game engine reads `activeMapConfig` properties to control terrain shape, ground colors, fog/sky, and environment density.

Each map module in this directory exports a matching config object for use outside the inline catalog (e.g. tooling, tests).

## Map Properties

| Property            | Type   | Description                                      |
| ------------------- | ------ | ------------------------------------------------ |
| `terrain.hillScale` | number | Frequency of terrain sine waves                  |
| `terrain.hillAmp`   | number | Amplitude of major hills                         |
| `terrain.detailAmp` | number | Amplitude of fine terrain detail                 |
| `fogColor`          | hex    | Scene fog color                                  |
| `skyColor`          | hex    | Sky gradient top color                           |
| `treeDensity`       | number | Number of trees to spawn                         |
| `rockDensity`       | number | Number of rocks to spawn                         |
| `hasPlaza`          | bool   | Whether to generate the stone plaza slab         |
| `hasBuildings`      | bool   | Whether to generate village buildings            |
| `groundTint`        | object | Vertex color palette `{base, dark, light, dirt}` |

## Available Maps (14)

### Original (3)

1. **Village Arena** - Default green village with buildings and plaza
2. **Mountain Fortress** - Tall peaks, heavy rocks, plaza but no buildings
3. **Desert Ruins** - Flat sandy terrain, sparse vegetation

### New (11)

4. **Inferno Peaks** - Volcanic terrain, dark brown/red ground, very few trees, heavy rocks
5. **Crystalline Cavern** - Flat with jagged detail, blue-grey ground, no trees, dense rocks
6. **Frozen Tundra** - Moderate rolling hills, white/ice-blue ground, sparse trees
7. **Shadow Abyss** - Deep valleys, dark purple ground, sparse vegetation
8. **Sky Fortress** - Nearly flat terrain, white/gold ground, plaza, minimal vegetation
9. **Toxic Marsh** - Low terrain, sickly green ground, dense trees
10. **Ancient Temple** - Moderate hills, sandstone/gold ground, plaza and buildings
11. **Shattered Isles** - Standard hills, sandy brown ground, moderate vegetation
12. **Neon Wasteland** - Low detail terrain, dark grey ground, no trees, moderate rocks
13. **Void Sanctum** - Extreme terrain, near-black purple ground, no trees, sparse rocks
14. **Dragon's Roost** - Steep hills, dark gold/brown ground, heavy rocks

## Files

- `maps.js` - Central catalog (mirrors inline `mapCatalog`)
- `*.js` - Individual map config exports
