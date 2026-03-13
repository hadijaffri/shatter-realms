/**
 * Shadow Abyss Map Configuration
 * Dark void terrain with deep valleys and eerie purple haze
 */

export const config = {
  id: 'shadow-abyss',
  name: 'Shadow Abyss',
  roomId: 'arena-shadow',
  description: 'A mysterious dark realm with deep valleys suspended over an abyss.',
  terrain: { hillScale: 1.2, hillAmp: 1.5, detailAmp: 2.0 },
  fogColor: 0x1a0033,
  skyColor: 0x0a0015,
  treeDensity: 5,
  rockDensity: 30,
  hasPlaza: false,
  hasBuildings: false,
  groundTint: { base: 0x2a1540, dark: 0x150a25, light: 0x3f2060, dirt: 0x1a0a30 },
  spawnPoints: [
    { x: 50, y: 12, z: 50 },
    { x: -50, y: 12, z: -50 },
    { x: 50, y: 12, z: -50 },
    { x: -50, y: 12, z: 50 },
  ],
};

export default config;
