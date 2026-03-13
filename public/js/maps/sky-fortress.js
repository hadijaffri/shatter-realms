/**
 * Sky Fortress Map Configuration
 * Elevated terrain in the clouds with gentle rolling hills and golden stone
 */

export const config = {
  id: 'sky-fortress',
  name: 'Sky Fortress',
  roomId: 'arena-sky',
  description: 'A majestic fortress suspended in the clouds with gentle terrain.',
  terrain: { hillScale: 0.3, hillAmp: 0.2, detailAmp: 0.1 },
  fogColor: 0xddeeff,
  skyColor: 0x88ccff,
  treeDensity: 2,
  rockDensity: 15,
  hasPlaza: true,
  hasBuildings: false,
  groundTint: { base: 0xe8dcc0, dark: 0xc8b8a0, light: 0xf5edd8, dirt: 0xbba860 },
  spawnPoints: [
    { x: 50, y: 15, z: 50 },
    { x: -50, y: 15, z: -50 },
    { x: 50, y: 15, z: -50 },
    { x: -50, y: 15, z: 50 },
  ],
};

export default config;
