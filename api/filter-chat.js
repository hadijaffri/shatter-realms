import { setCorsHeaders, handleOptions } from './_lib/cors.js';

const MAX_MESSAGE_LENGTH = 200;

// Core banned words
const BANNED_WORDS = [
  'fuck',
  'shit',
  'ass',
  'bitch',
  'damn',
  'dick',
  'pussy',
  'cock',
  'cunt',
  'fag',
  'faggot',
  'nigger',
  'nigga',
  'retard',
  'whore',
  'slut',
  'bastard',
  'twat',
  'wanker',
  'piss',
  'crap',
  'douche',
  'dildo',
  'penis',
  'vagina',
  'anus',
  'anal',
  'rape',
  'molest',
  'pedo',
  'kys',
  'kms',
  'stfu',
  'gtfo',
  'thot',
  'hoe',
  'chink',
  'spic',
  'wetback',
  'kike',
  'dyke',
  'tranny',
  'tard',
  'nazi',
  'porn',
  'hentai',
  'suck',
  'blowjob',
  'handjob',
  'jizz',
  'cum',
  'orgasm',
  'erect',
  'horny',
  'tits',
  'boob',
  'nudes',
];

// Toxic phrases that should be caught as multi-word patterns
const BANNED_PHRASES = [
  'kill yourself',
  'kill urself',
  'go die',
  'neck yourself',
  'drink bleach',
  'slit your',
  'hang yourself',
  'hang urself',
  'unalive yourself',
  'end yourself',
  'end urself',
  'ur trash',
  'you suck',
  'u suck',
  'get rekt',
  'get cancer',
  'hope you die',
  'hope u die',
];

// L33t speak character map (expanded)
const LEET_MAP = {
  0: 'o',
  1: 'i',
  3: 'e',
  4: 'a',
  5: 's',
  7: 't',
  8: 'b',
  9: 'g',
  '@': 'a',
  $: 's',
  '!': 'i',
  '+': 't',
  '(': 'c',
  '|': 'l',
  '><': 'x',
  '}{': 'h',
  '/\\': 'a',
};

// Phonetic substitution patterns
const PHONETIC_MAP = {
  ph: 'f',
  ck: 'k',
  kk: 'k',
  cc: 'k',
  xx: 'x',
  ss: 's',
  ff: 'f',
  ll: 'l',
  tt: 't',
  nn: 'n',
  mm: 'm',
  pp: 'p',
  bb: 'b',
  dd: 'd',
  gg: 'g',
  zz: 'z',
};

/**
 * Normalize a string by converting l33t speak, phonetic subs, and removing separators
 */
export function normalize(text) {
  let normalized = text.toLowerCase();

  // Replace l33t speak characters
  for (const [leet, letter] of Object.entries(LEET_MAP)) {
    normalized = normalized.split(leet).join(letter);
  }

  // Remove common separator bypass characters
  normalized = normalized.replace(/[\s.\-_*~`'"^#%&,;:!/\\|(){}[\]<>]/g, '');

  // Collapse repeated characters (e.g., "fuuuuck" -> "fuck")
  normalized = normalized.replace(/(.)\1{2,}/g, '$1');

  // Apply phonetic substitutions
  for (const [pattern, replacement] of Object.entries(PHONETIC_MAP)) {
    normalized = normalized.split(pattern).join(replacement);
  }

  return normalized;
}

/**
 * Check if text contains banned phrases (multi-word)
 */
function containsBannedPhrase(text) {
  const lower = text.toLowerCase();
  for (const phrase of BANNED_PHRASES) {
    // Allow flexible whitespace/separators between phrase words
    const pattern = phrase
      .split(/\s+/)
      .map(w => w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join('[\\s.\\-_*~]*');
    if (new RegExp(pattern, 'i').test(lower)) {
      return true;
    }
  }
  return false;
}

/**
 * Check if text contains banned words and censor them
 */
export function filterText(text) {
  if (!text || typeof text !== 'string') {
    return { original: '', filtered: '', wasCensored: false };
  }

  // Truncate to max length
  const original = text.slice(0, MAX_MESSAGE_LENGTH);
  const normalizedFull = normalize(original);

  let wasCensored = false;

  // Check for banned phrases first (multi-word)
  if (containsBannedPhrase(original)) {
    wasCensored = true;
  }

  // Check normalized text against banned words
  if (!wasCensored) {
    for (const word of BANNED_WORDS) {
      if (normalizedFull.includes(word)) {
        wasCensored = true;
        break;
      }
    }
  }

  if (!wasCensored) {
    return { original, filtered: original, wasCensored: false };
  }

  // Build censored version word-by-word
  const words = original.split(/(\s+)/);
  const filtered = words
    .map(segment => {
      // Preserve whitespace segments
      if (/^\s+$/.test(segment)) return segment;

      const normalizedWord = normalize(segment);
      for (const banned of BANNED_WORDS) {
        if (normalizedWord.includes(banned)) {
          return '*'.repeat(segment.length);
        }
      }
      return segment;
    })
    .join('');

  // If banned phrase was detected but individual words weren't caught, censor whole message
  if (containsBannedPhrase(original) && filtered === original) {
    return { original, filtered: '*'.repeat(original.length), wasCensored: true };
  }

  return { original, filtered, wasCensored: true };
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
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid message' });
    }

    const result = filterText(message);
    return res.status(200).json(result);
  } catch (error) {
    console.error('Filter chat error:', error);
    return res.status(500).json({ error: 'Filter processing failed' });
  }
}
