/**
 * Map Catalog and Definitions
 * Unimplemented maps for ShatterRealms
 * Each map includes environmental layout, spawn points, and environmental hazards
 */

export const mapCatalog = [
  { id: 'ridge-plaza', name: 'Ridge Plaza', roomId: 'arena-ridge' },
  { id: 'stone-shelf', name: 'Stone Shelf', roomId: 'arena-shelf' },
  { id: 'valley-run', name: 'Valley Run', roomId: 'arena-valley' },
  { id: 'inferno-peaks', name: 'Inferno Peaks', roomId: 'arena-inferno' },
  { id: 'crystalline-cavern', name: 'Crystalline Cavern', roomId: 'arena-crystal' },
  { id: 'frozen-tundra', name: 'Frozen Tundra', roomId: 'arena-frozen' },
  { id: 'shadow-abyss', name: 'Shadow Abyss', roomId: 'arena-shadow' },
  { id: 'sky-fortress', name: 'Sky Fortress', roomId: 'arena-sky' },
  { id: 'toxic-marsh', name: 'Toxic Marsh', roomId: 'arena-marsh' },
  { id: 'ancient-temple', name: 'Ancient Temple', roomId: 'arena-temple' },
];

/**
 * Map: Inferno Peaks
 * High-altitude volcanic terrain with lava flows and geysers
 */
export const infernoMap = {
  id: 'inferno-peaks',
  name: 'Inferno Peaks',
  description: 'A treacherous volcanic landscape with active lava flows and geysers',
  terrain: {
    width: 300,
    height: 300,
    baseColor: 0x8b4513, // Volcanic brown
    hasLava: true,
  },
  spawnPoints: [
    { x: 50, y: 10, z: 50, team: 1 },
    { x: 250, y: 10, z: 250, team: 2 },
    { x: 50, y: 10, z: 250, team: 3 },
    { x: 250, y: 10, z: 50, team: 4 },
  ],
  hazards: [
    // TODO: Implement lava flows that damage players
    // TODO: Implement geysers that periodically erupt
    // TODO: Add falling ash particle effects
  ],
  landmarks: [
    // TODO: Create volcanic pillars
    // TODO: Add sulfur vents
    // TODO: Create lava lakes
  ],
  environmentalEffects: {
    fogColor: 0xff6600,
    fogDensity: 0.3,
    ambientLight: 0xffaa44,
    temperature: 'high', // Affects movement speed negatively
  },
};

/**
 * Map: Crystalline Cavern
 * Underground cavern filled with crystal formations and reflective surfaces
 */
export const crystallineMap = {
  id: 'crystalline-cavern',
  name: 'Crystalline Cavern',
  description: 'An underground cavern with massive crystal formations and magical resonance',
  terrain: {
    width: 400,
    height: 400,
    baseColor: 0x6699ff, // Crystal blue
    hasReflectiveSurfaces: true,
  },
  spawnPoints: [
    { x: 75, y: 20, z: 75, team: 1 },
    { x: 325, y: 20, z: 325, team: 2 },
    { x: 75, y: 20, z: 325, team: 3 },
    { x: 325, y: 20, z: 75, team: 4 },
  ],
  hazards: [
    // TODO: Implement crystal prisms that reflect damage
    // TODO: Add unstable crystals that explode
    // TODO: Create resonance fields causing area damage
  ],
  landmarks: [
    // TODO: Create giant crystal pillars
    // TODO: Add crystal bridges
    // TODO: Implement crystal clusters as cover
  ],
  environmentalEffects: {
    fogColor: 0x3366cc,
    fogDensity: 0.15,
    ambientLight: 0x88ddff,
    specialProperty: 'magical_amplification', // Weapon damage +10%
  },
};

/**
 * Map: Frozen Tundra
 * Arctic wasteland with ice sheets, blizzards, and frozen obstacles
 */
export const frozenMap = {
  id: 'frozen-tundra',
  name: 'Frozen Tundra',
  description: 'An icy arctic landscape where players must manage slippery surfaces and cold',
  terrain: {
    width: 350,
    height: 350,
    baseColor: 0xccddff, // Icy blue
    hasIce: true,
    frictionCoefficient: 0.5, // Slippery
  },
  spawnPoints: [
    { x: 60, y: 15, z: 60, team: 1 },
    { x: 290, y: 15, z: 290, team: 2 },
    { x: 60, y: 15, z: 290, team: 3 },
    { x: 290, y: 15, z: 60, team: 4 },
  ],
  hazards: [
    // TODO: Implement blizzard wind that pushes players
    // TODO: Add thin ice patches that break
    // TODO: Create cold damage zones
  ],
  landmarks: [
    // TODO: Create ice formations and glaciers
    // TODO: Add frozen trees
    // TODO: Implement ice bridges
  ],
  environmentalEffects: {
    fogColor: 0xaabbcc,
    fogDensity: 0.4,
    ambientLight: 0xddddff,
    temperature: 'frozen', // Reduces movement speed by 15%
    blizzardIntensity: 0.7,
  },
};

/**
 * Map: Shadow Abyss
 * Dark void-like arena with floating platforms and reality distortions
 */
export const shadowMap = {
  id: 'shadow-abyss',
  name: 'Shadow Abyss',
  description: 'A mysterious dark realm with floating islands suspended over an abyss',
  terrain: {
    width: 400,
    height: 400,
    baseColor: 0x1a1a2e, // Dark purple-black
    hasFloatingPlatforms: true,
  },
  spawnPoints: [
    { x: 100, y: 50, z: 100, team: 1 },
    { x: 300, y: 50, z: 300, team: 2 },
    { x: 100, y: 50, z: 300, team: 3 },
    { x: 300, y: 50, z: 100, team: 4 },
  ],
  hazards: [
    // TODO: Implement falling into the abyss (instant death)
    // TODO: Add shadow creatures that phase through
    // TODO: Create reality tears that damage
  ],
  landmarks: [
    // TODO: Create floating stone islands
    // TODO: Add dark energy pillars
    // TODO: Implement void rifts
  ],
  environmentalEffects: {
    fogColor: 0x2d2d3d,
    fogDensity: 0.8,
    ambientLight: 0x6655aa,
    nightMode: true,
    gravityModifier: 0.8, // Slightly lower gravity
  },
};

/**
 * Map: Sky Fortress
 * Elevated castle in the clouds with narrow walkways and wind currents
 */
export const skyMap = {
  id: 'sky-fortress',
  name: 'Sky Fortress',
  description: 'A majestic castle suspended in the clouds with narrow bridges and wind hazards',
  terrain: {
    width: 320,
    height: 320,
    baseColor: 0xf0f0ff, // Cloud white
    hasNarrowPaths: true,
  },
  spawnPoints: [
    { x: 80, y: 100, z: 80, team: 1 },
    { x: 240, y: 100, z: 240, team: 2 },
    { x: 80, y: 100, z: 240, team: 3 },
    { x: 240, y: 100, z: 80, team: 4 },
  ],
  hazards: [
    // TODO: Implement wind currents that push players
    // TODO: Add lightning strikes during storms
    // TODO: Create falling cloud debris
  ],
  landmarks: [
    // TODO: Create castle towers and walls
    // TODO: Add narrow bridge walkways
    // TODO: Implement battlement walls as cover
  ],
  environmentalEffects: {
    fogColor: 0xeeeeff,
    fogDensity: 0.2,
    ambientLight: 0xffffe0,
    skyColor: 0x87ceeb, // Sky blue
    wind: { x: 0.5, z: 0 }, // Affects projectiles
  },
};

/**
 * Map: Toxic Marsh
 * Swampy toxic terrain with poisonous gas and mutated creatures
 */
export const toxicMap = {
  id: 'toxic-marsh',
  name: 'Toxic Marsh',
  description: 'A hazardous swamp filled with toxic gas clouds and corrosive pools',
  terrain: {
    width: 380,
    height: 380,
    baseColor: 0x4d6633, // Sickly green
    hasSwampWater: true,
  },
  spawnPoints: [
    { x: 70, y: 5, z: 70, team: 1 },
    { x: 310, y: 5, z: 310, team: 2 },
    { x: 70, y: 5, z: 310, team: 3 },
    { x: 310, y: 5, z: 70, team: 4 },
  ],
  hazards: [
    // TODO: Implement toxic gas clouds that damage over time
    // TODO: Add quicksand pools that slow movement
    // TODO: Create acid splash zones
  ],
  landmarks: [
    // TODO: Create dead trees and vegetation
    // TODO: Add rotting logs for cover
    // TODO: Implement mushroom clusters
  ],
  environmentalEffects: {
    fogColor: 0x6b8e23,
    fogDensity: 0.5,
    ambientLight: 0x99cc66,
    toxicDamagePerSecond: 1, // Constant low damage in certain zones
  },
};

/**
 * Map: Ancient Temple
 * Mystical ruins with ritual circles and ancient power zones
 */
export const templeMap = {
  id: 'ancient-temple',
  name: 'Ancient Temple',
  description: 'A sacred temple with ancient power channels and ritual circles',
  terrain: {
    width: 360,
    height: 360,
    baseColor: 0xdaa520, // Gold
    hasRitualCircles: true,
  },
  spawnPoints: [
    { x: 65, y: 10, z: 65, team: 1 },
    { x: 295, y: 10, z: 295, team: 2 },
    { x: 65, y: 10, z: 295, team: 3 },
    { x: 295, y: 10, z: 65, team: 4 },
  ],
  hazards: [
    // TODO: Implement ancient curse zones
    // TODO: Add temporal distortion effects
    // TODO: Create guardian constructs
  ],
  landmarks: [
    // TODO: Create ritual circles with power-ups
    // TODO: Add temple pillars and statues
    // TODO: Implement treasure pedestals
  ],
  environmentalEffects: {
    fogColor: 0xcc9966,
    fogDensity: 0.25,
    ambientLight: 0xffdd99,
    mysticalPower: true, // Enables special abilities in certain zones
  },
};

/**
 * Map: Shattered Isles
 * Multiple smaller islands with dangerous water between them
 */
export const islesMap = {
  id: 'shattered-isles',
  name: 'Shattered Isles',
  description: 'A fragmented archipelago where players battle across separate floating islands',
  terrain: {
    width: 420,
    height: 420,
    baseColor: 0x8b7355, // Sand
    hasMultipleIslands: true,
  },
  spawnPoints: [
    { x: 40, y: 15, z: 40, team: 1, island: 1 },
    { x: 380, y: 15, z: 380, team: 2, island: 4 },
    { x: 40, y: 15, z: 380, team: 3, island: 3 },
    { x: 380, y: 15, z: 40, team: 4, island: 2 },
  ],
  hazards: [
    // TODO: Implement deep water that damages/kills
    // TODO: Add sea creatures that attack
    // TODO: Create whirlpools and currents
  ],
  landmarks: [
    // TODO: Create individual island terrain
    // TODO: Add bridges between islands
    // TODO: Implement watchtower ruins
  ],
  environmentalEffects: {
    fogColor: 0x87ceeb,
    fogDensity: 0.2,
    ambientLight: 0xffffff,
    seaLevel: -10,
  },
};

/**
 * Map: Neon Wasteland
 * Post-apocalyptic arena with neon-lit ruins and hazardous radiation
 */
export const neonMap = {
  id: 'neon-wasteland',
  name: 'Neon Wasteland',
  description: 'A futuristic wasteland with glowing neon structures and radioactive zones',
  terrain: {
    width: 340,
    height: 340,
    baseColor: 0x1a1a1a, // Black
    hasNeonLights: true,
  },
  spawnPoints: [
    { x: 55, y: 10, z: 55, team: 1 },
    { x: 285, y: 10, z: 285, team: 2 },
    { x: 55, y: 10, z: 285, team: 3 },
    { x: 285, y: 10, z: 55, team: 4 },
  ],
  hazards: [
    // TODO: Implement radiation zones that damage
    // TODO: Add explosive debris fields
    // TODO: Create electromagnetic pulses
  ],
  landmarks: [
    // TODO: Create neon-lit ruins
    // TODO: Add holographic structures
    // TODO: Implement tech debris as cover
  ],
  environmentalEffects: {
    fogColor: 0x00ff00,
    fogDensity: 0.35,
    ambientLight: 0xff00ff,
    neonGlow: true,
  },
};

/**
 * Map: Void Sanctum
 * Abstract dimensional space with warping geometry and reality breaks
 */
export const voidMap = {
  id: 'void-sanctum',
  name: 'Void Sanctum',
  description: 'An abstract dimension where space itself bends and warps',
  terrain: {
    width: 360,
    height: 360,
    baseColor: 0x0f0f0f, // Near black
    hasWarpingGeometry: true,
  },
  spawnPoints: [
    { x: 90, y: 20, z: 90, team: 1 },
    { x: 270, y: 20, z: 270, team: 2 },
    { x: 90, y: 20, z: 270, team: 3 },
    { x: 270, y: 20, z: 90, team: 4 },
  ],
  hazards: [
    // TODO: Implement dimension tears
    // TODO: Add reality warping effects
    // TODO: Create teleportation anomalies
  ],
  landmarks: [
    // TODO: Create impossible geometry
    // TODO: Add portals and rifts
    // TODO: Implement dimensional stasis fields
  ],
  environmentalEffects: {
    fogColor: 0x1a00ff,
    fogDensity: 0.6,
    ambientLight: 0x6600ff,
    dimensionalShift: true,
  },
};

/**
 * Map: Dragon's Roost
 * Draconic lair with dragon statues and treasure hoard
 */
export const roostMap = {
  id: 'dragons-roost',
  name: "Dragon's Roost",
  description: "An ancient dragon's lair filled with gold and dragon statuary",
  terrain: {
    width: 400,
    height: 400,
    baseColor: 0xb8860b, // Dark goldenrod
    hasDragonStatues: true,
  },
  spawnPoints: [
    { x: 80, y: 15, z: 80, team: 1 },
    { x: 320, y: 15, z: 320, team: 2 },
    { x: 80, y: 15, z: 320, team: 3 },
    { x: 320, y: 15, z: 80, team: 4 },
  ],
  hazards: [
    // TODO: Implement dragon breath attacks
    // TODO: Add fire pits around hoard
    // TODO: Create unstable treasure piles
  ],
  landmarks: [
    // TODO: Create massive dragon statues
    // TODO: Add gold pile formations
    // TODO: Implement dragon egg clusters
  ],
  environmentalEffects: {
    fogColor: 0xcc8800,
    fogDensity: 0.3,
    ambientLight: 0xffaa44,
    dragonicEnergy: true,
  },
};

/**
 * Helper function to get map configuration by ID
 */
export function getMapById(mapId) {
  const maps = [
    infernoMap,
    crystallineMap,
    frozenMap,
    shadowMap,
    skyMap,
    toxicMap,
    templeMap,
    islesMap,
    neonMap,
    voidMap,
    roostMap,
  ];
  return maps.find(m => m.id === mapId);
}

/**
 * Helper function to validate map spawn points
 */
export function validateMapSpawnPoints(map) {
  // TODO: Implement validation logic
  // - Check that all spawn points are within terrain bounds
  // - Verify no overlapping spawn points
  // - Ensure spawn points have proper Y height
}

/**
 * Helper function to get all hazards for a map
 */
export function getMapHazards(mapId) {
  const map = getMapById(mapId);
  if (!map) return [];
  return map.hazards || [];
}

/**
 * Helper function to get all landmarks for a map
 */
export function getMapLandmarks(mapId) {
  const map = getMapById(mapId);
  if (!map) return [];
  return map.landmarks || [];
}
