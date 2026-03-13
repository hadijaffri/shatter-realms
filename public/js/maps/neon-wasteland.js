/**
 * Neon Wasteland Map Configuration
 * Dark post-apocalyptic terrain with grey earth and neon-tinted fog
 */

export const config = {
  id: 'neon-wasteland',
  name: 'Neon Wasteland',
  roomId: 'arena-neon',
  description: 'A futuristic wasteland with dark terrain and neon-tinted atmosphere.',
  terrain: { hillScale: 0.6, hillAmp: 0.5, detailAmp: 1.0 },
  fogColor: 0x112211,
  skyColor: 0x0a0a1a,
  treeDensity: 0,
  rockDensity: 50,
  hasPlaza: false,
  hasBuildings: false,
  groundTint: { base: 0x2a2a2a, dark: 0x1a1a1a, light: 0x3a3a3a, dirt: 0x222222 },
  spawnPoints: [
    { x: 50, y: 8, z: 50 },
    { x: -50, y: 8, z: -50 },
    { x: 50, y: 8, z: -50 },
    { x: -50, y: 8, z: 50 },
  ],
};

export default config;
