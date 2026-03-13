/**
 * Toxic Marsh Map Configuration
 * Swampy terrain with dense vegetation and sickly green haze
 */

export const config = {
  id: 'toxic-marsh',
  name: 'Toxic Marsh',
  roomId: 'arena-marsh',
  description: 'A hazardous swamp filled with dense vegetation and toxic haze.',
  terrain: { hillScale: 0.5, hillAmp: 0.4, detailAmp: 0.8 },
  fogColor: 0x445522,
  skyColor: 0x556633,
  treeDensity: 20,
  rockDensity: 20,
  hasPlaza: false,
  hasBuildings: false,
  groundTint: { base: 0x4a5a2a, dark: 0x2e3a18, light: 0x6a7a3a, dirt: 0x3a4420 },
  spawnPoints: [
    { x: 50, y: 5, z: 50 },
    { x: -50, y: 5, z: -50 },
    { x: 50, y: 5, z: -50 },
    { x: -50, y: 5, z: 50 },
  ],
};

export default config;
