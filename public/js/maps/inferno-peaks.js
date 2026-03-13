/**
 * Inferno Peaks Map Configuration
 * Volcanic terrain with jagged peaks and scorched earth
 */

export const config = {
  id: 'inferno-peaks',
  name: 'Inferno Peaks',
  roomId: 'arena-inferno',
  description: 'A treacherous volcanic landscape with jagged peaks and scorched earth.',
  terrain: { hillScale: 1.8, hillAmp: 2.5, detailAmp: 0.4 },
  fogColor: 0xff4400,
  skyColor: 0x331100,
  treeDensity: 3,
  rockDensity: 60,
  hasPlaza: false,
  hasBuildings: false,
  groundTint: { base: 0x5c3a2a, dark: 0x3b1f12, light: 0x7a4430, dirt: 0x8b2500 },
  spawnPoints: [
    { x: 50, y: 10, z: 50 },
    { x: -50, y: 10, z: -50 },
    { x: 50, y: 10, z: -50 },
    { x: -50, y: 10, z: 50 },
  ],
};

export default config;
