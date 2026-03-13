/**
 * Void Sanctum Map Configuration
 * Near-black terrain with extreme elevation and deep purple haze
 */

export const config = {
  id: 'void-sanctum',
  name: 'Void Sanctum',
  roomId: 'arena-void',
  description: 'An abstract dimension where space itself bends and warps.',
  terrain: { hillScale: 1.5, hillAmp: 1.8, detailAmp: 2.5 },
  fogColor: 0x110022,
  skyColor: 0x050010,
  treeDensity: 0,
  rockDensity: 20,
  hasPlaza: false,
  hasBuildings: false,
  groundTint: { base: 0x18082a, dark: 0x0c0418, light: 0x280e40, dirt: 0x100620 },
  spawnPoints: [
    { x: 50, y: 15, z: 50 },
    { x: -50, y: 15, z: -50 },
    { x: 50, y: 15, z: -50 },
    { x: -50, y: 15, z: 50 },
  ],
};

export default config;
