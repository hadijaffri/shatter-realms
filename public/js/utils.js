// Cookie helpers for persistent data
export function setCookie(name, value, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie =
    name + '=' + encodeURIComponent(value) + '; expires=' + expires + '; path=/; SameSite=Lax';
}

export function getCookie(name) {
  const value = document.cookie.split('; ').find(row => row.startsWith(name + '='));
  return value ? decodeURIComponent(value.split('=')[1]) : null;
}

// Generate or retrieve device ID
export function getDeviceId() {
  let deviceId = getCookie('deviceId');
  if (!deviceId) {
    deviceId = 'dev_' + Date.now().toString(36) + '_' + Math.random().toString(36).substr(2, 9);
    setCookie('deviceId', deviceId);
  }
  return deviceId;
}

// Random number helper
export function random(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Rarity color mapping
export function getRarityColor(rarity) {
  const colors = {
    common: '#888',
    uncommon: '#00ff00',
    rare: '#0088ff',
    epic: '#aa00ff',
    legendary: '#ff8800',
  };
  return colors[rarity] || '#fff';
}
