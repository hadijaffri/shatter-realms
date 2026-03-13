/**
 * Crystalline Cavern Map Configuration
 * Underground cavern with jagged crystal formations and dim blue light
 */

export const config = {
  id: 'crystalline-cavern',
  name: 'Crystalline Cavern',
  roomId: 'arena-crystal',
  description: 'An underground cavern studded with massive crystal formations.',
  terrain: { hillScale: 0.4, hillAmp: 0.3, detailAmp: 1.5 },
  fogColor: 0x334466,
  skyColor: 0x1a2a44,
  treeDensity: 0,
  rockDensity: 90,
  hasPlaza: false,
  hasBuildings: false,
  groundTint: { base: 0x556677, dark: 0x3a4a5a, light: 0x7788aa, dirt: 0x445566 },
  spawnPoints: [
    { x: 60, y: 5, z: 60 },
    { x: -60, y: 5, z: -60 },
    { x: 60, y: 5, z: -60 },
    { x: -60, y: 5, z: 60 },
  ],
};

export default config;
