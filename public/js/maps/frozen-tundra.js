/**
 * Frozen Tundra Map Configuration
 * Arctic wasteland with icy terrain and snowdrift hills
 */

export const config = {
  id: 'frozen-tundra',
  name: 'Frozen Tundra',
  roomId: 'arena-frozen',
  description: 'An icy arctic landscape with snowdrift hills and frozen earth.',
  terrain: { hillScale: 0.8, hillAmp: 0.8, detailAmp: 0.2 },
  fogColor: 0xaabbcc,
  skyColor: 0xccddee,
  treeDensity: 8,
  rockDensity: 40,
  hasPlaza: false,
  hasBuildings: false,
  groundTint: { base: 0xd0dde8, dark: 0xa0b8cc, light: 0xeaf0f6, dirt: 0x99aabb },
  spawnPoints: [
    { x: 55, y: 8, z: 55 },
    { x: -55, y: 8, z: -55 },
    { x: 55, y: 8, z: -55 },
    { x: -55, y: 8, z: 55 },
  ],
};

export default config;
