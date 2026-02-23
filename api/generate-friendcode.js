import { setCorsHeaders, handleOptions } from './_lib/cors.js';

const FRIEND_CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 chars
const FRIEND_CODE_LENGTH = 8;

function generateFriendCode() {
  const bytes = new Uint8Array(FRIEND_CODE_LENGTH);

  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
    let code = '';
    for (let i = 0; i < FRIEND_CODE_LENGTH; i++) {
      // Fast 0-31 mapping because FRIEND_CODE_CHARS length is exactly 32
      code += FRIEND_CODE_CHARS[bytes[i] & 31];
    }
    return code;
  }

  // Fallback for runtimes without Web Crypto
  let code = '';
  for (let i = 0; i < FRIEND_CODE_LENGTH; i++) {
    code += FRIEND_CODE_CHARS.charAt(Math.floor(Math.random() * FRIEND_CODE_CHARS.length));
  }
  return code;
}

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (handleOptions(req, res)) {
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { username } = req.body;

    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Username is required' });
    }

    const friendCode = generateFriendCode();
    return res.status(200).json({ friendCode });
  } catch (error) {
    console.error('Friend code generation error:', error);
    return res.status(500).json({ error: 'Failed to generate friend code' });
  }
}
