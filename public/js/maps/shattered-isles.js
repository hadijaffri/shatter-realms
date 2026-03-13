/**
 * Shattered Isles Map Configuration
 * Sandy island terrain with moderate hills and coastal atmosphere
 */

export const config = {
  id: 'shattered-isles',
  name: 'Shattered Isles',
  roomId: 'arena-isles',
  description: 'A fragmented archipelago with sandy terrain and coastal fog.',
  terrain: { hillScale: 1.0, hillAmp: 1.2, detailAmp: 0.7 },
  fogColor: 0x6699bb,
  skyColor: 0x88bbdd,
  treeDensity: 15,
  rockDensity: 25,
  hasPlaza: false,
  hasBuildings: false,
  groundTint: { base: 0x8b7355, dark: 0x6a5540, light: 0xaa9068, dirt: 0x7a6548 },
  spawnPoints: [
    { x: 50, y: 10, z: 50 },
    { x: -50, y: 10, z: -50 },
    { x: 50, y: 10, z: -50 },
    { x: -50, y: 10, z: 50 },
  ],
};

export default config;
