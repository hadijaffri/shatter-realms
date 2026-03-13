/**
 * Dragon's Roost Map Configuration
 * Dark golden terrain with steep hills and scorched earth
 */

export const config = {
  id: 'dragons-roost',
  name: "Dragon's Roost",
  roomId: 'arena-dragon',
  description: "An ancient dragon's lair with dark golden terrain and steep rocky hills.",
  terrain: { hillScale: 1.3, hillAmp: 1.6, detailAmp: 0.6 },
  fogColor: 0xaa6600,
  skyColor: 0x664400,
  treeDensity: 8,
  rockDensity: 70,
  hasPlaza: false,
  hasBuildings: false,
  groundTint: { base: 0x8a6020, dark: 0x5c3e10, light: 0xb08030, dirt: 0x6b4a18 },
  spawnPoints: [
    { x: 55, y: 10, z: 55 },
    { x: -55, y: 10, z: -55 },
    { x: 55, y: 10, z: -55 },
    { x: -55, y: 10, z: 55 },
  ],
};

export default config;
