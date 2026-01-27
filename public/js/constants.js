// Shop items catalog with prices
export const shopItems = [
  // Melee Weapons
  { id: 'axe', price: 150 },
  { id: 'spear', price: 120 },
  { id: 'hammer', price: 300 },
  { id: 'dagger', price: 80 },
  { id: 'katana', price: 250 },
  { id: 'scythe', price: 400 },
  { id: 'mace', price: 200 },
  { id: 'flail', price: 280 },
  { id: 'halberd', price: 350 },
  { id: 'claws', price: 180 },
  { id: 'gauntlet', price: 220 },
  { id: 'chainsaw', price: 500 },
  { id: 'pickaxe', price: 160 },
  { id: 'shovel', price: 90 },
  { id: 'sickle', price: 140 },
  { id: 'nunchucks', price: 170 },
  { id: 'bo_staff', price: 130 },
  { id: 'whip', price: 150 },
  { id: 'anchor', price: 600 },
  { id: 'wrench', price: 190 },
  // Legendary Melee
  { id: 'excalibur', price: 2500 },
  { id: 'mjolnir', price: 3000 },
  { id: 'gungnir', price: 2800 },
  { id: 'kusanagi', price: 2700 },
  // Ranged
  { id: 'bow', price: 200 },
  { id: 'crossbow', price: 350 },
  { id: 'shuriken', price: 100 },
  { id: 'javelin', price: 280 },
  { id: 'boomerang', price: 180 },
  { id: 'kunai', price: 120 },
  { id: 'chakram', price: 250 },
  { id: 'blowdart', price: 80 },
  // Magic Spells
  { id: 'iceball', price: 200 },
  { id: 'lightning', price: 350 },
  { id: 'poison', price: 250 },
  { id: 'laser', price: 500 },
  { id: 'meteor', price: 800 },
  { id: 'tornado', price: 400 },
  { id: 'earthquake', price: 550 },
  { id: 'tsunami', price: 500 },
  { id: 'vortex', price: 700 },
  { id: 'solar', price: 600 },
  { id: 'lunar', price: 550 },
  { id: 'arcane', price: 380 },
  { id: 'nature', price: 320 },
  { id: 'shadow', price: 400 },
  { id: 'holy', price: 450 },
  { id: 'plasma', price: 580 },
  { id: 'gravity', price: 520 },
  { id: 'chain_lightning', price: 360 },
  { id: 'frost_nova', price: 380 },
  { id: 'fire_storm', price: 650 },
  // Legendary Magic
  { id: 'supernova', price: 5000 },
  { id: 'apocalypse', price: 8000 },
  { id: 'genesis', price: 4500 },
  { id: 'oblivion', price: 7000 },
  // Utility
  { id: 'shield', price: 100 },
  { id: 'medkit', price: 75 },
  { id: 'megaHeal', price: 200 },
  { id: 'jumpPad', price: 125 },
  { id: 'speedBoost', price: 150 },
  { id: 'rage', price: 400 },
  { id: 'invisibility', price: 600 },
  { id: 'teleport', price: 450 },
  { id: 'reflect', price: 500 },
  { id: 'lifesteal', price: 700 },
  { id: 'timestop', price: 1500 },
  { id: 'clone', price: 550 },
  { id: 'berserk', price: 800 },
  { id: 'fortify', price: 400 },
  { id: 'regenerate', price: 600 },
  { id: 'energize', price: 300 },
  // Bombs
  { id: 'grenade', price: 250 },
  { id: 'dynamite', price: 400 },
  { id: 'molotov', price: 200 },
  { id: 'flashbang', price: 150 },
  { id: 'smoke_bomb', price: 100 },
  { id: 'cluster_bomb', price: 900 },
  { id: 'nuke', price: 5000 },
  // Summons
  { id: 'summon_wolf', price: 500 },
  { id: 'summon_dragon', price: 2000 },
  { id: 'summon_golem', price: 800 },
  { id: 'summon_phoenix', price: 1500 },
  { id: 'summon_demon', price: 2500 },
  // Elemental Weapons
  { id: 'flame_sword', price: 450 },
  { id: 'frost_axe', price: 480 },
  { id: 'thunder_hammer', price: 650 },
  { id: 'venom_dagger', price: 300 },
  { id: 'earth_mace', price: 520 },
  { id: 'wind_blade', price: 380 },
  { id: 'shadow_scythe', price: 600 },
  { id: 'holy_lance', price: 580 },
];

// Item metadata (icons, names, descriptions, etc.)
export const itemData = {
  // This would contain detailed information about each item
  // For now, it's handled inline in the HTML
  // Future: extract all item metadata here
};

// Default hotbar setup
export const defaultHotbar = ['sword', 'fireball', null, null, null, null];

// Inventory configuration
export const inventoryConfig = {
  maxSlots: 24,
  hotbarSlots: 6,
};
