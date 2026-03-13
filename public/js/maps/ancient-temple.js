/**
 * Ancient Temple Map Configuration
 * Sandstone terrain with warm golden tones and temple structures
 */

export const config = {
  id: 'ancient-temple',
  name: 'Ancient Temple',
  roomId: 'arena-temple',
  description: 'A sacred temple with sandstone terrain and golden light.',
  terrain: { hillScale: 0.7, hillAmp: 0.6, detailAmp: 0.5 },
  fogColor: 0xcc9966,
  skyColor: 0xddaa77,
  treeDensity: 12,
  rockDensity: 35,
  hasPlaza: true,
  hasBuildings: true,
  groundTint: { base: 0xb89860, dark: 0x8a7040, light: 0xd4b878, dirt: 0xa08050 },
  spawnPoints: [
    { x: 55, y: 8, z: 55 },
    { x: -55, y: 8, z: -55 },
    { x: 55, y: 8, z: -55 },
    { x: -55, y: 8, z: 55 },
  ],
};

export default config;
