import { setCorsHeaders, handleOptions } from './_lib/cors.js';

const MAX_COMMENT_LENGTH = 280;
const MAX_NAME_LENGTH = 20;
const MAX_COMMENTS = 100;

let commentsStore = [];

function sanitizeName(name) {
  const cleaned = (name || '')
    .toString()
    .replace(/[<>]/g, '')
    .replace(/[^\w\s-]/g, '')
    .trim()
    .slice(0, MAX_NAME_LENGTH);
  return cleaned || 'Guest';
}

function sanitizeMessage(message) {
  return (message || '').toString().replace(/[<>]/g, '').trim().slice(0, MAX_COMMENT_LENGTH);
}

function parseBody(req) {
  if (!req.body) return {};
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return {};
    }
  }
  return req.body;
}

export default async function handler(req, res) {
  setCorsHeaders(res);

  if (handleOptions(req, res)) {
    return;
  }

  if (req.method === 'GET') {
    return res.status(200).json({
      comments: commentsStore.slice(0, 50),
    });
  }

  if (req.method === 'POST') {
    const payload = parseBody(req);
    const name = sanitizeName(payload.name);
    const message = sanitizeMessage(payload.message);

    if (!message) {
      return res.status(400).json({ error: 'Comment is required' });
    }

    const comment = {
      id: 'c_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7),
      name,
      message,
      createdAt: new Date().toISOString(),
    };

    commentsStore.unshift(comment);
    commentsStore = commentsStore.slice(0, MAX_COMMENTS);

    return res.status(200).json({
      success: true,
      comment,
      comments: commentsStore.slice(0, 50),
    });
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
