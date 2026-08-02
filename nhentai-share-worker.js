// Cloudflare Worker to support NHentai Share feature
// Routes:
//  - POST /send     -> store a share message for a recipient UUID in KV
//  - GET  /inbox    -> retrieve (and optionally drain) inbox messages for a UUID
//  - POST /share    -> returns a shareable URL (legacy/back-compat)
//  - GET  /g/:id    -> redirects to https://nhentai.net/g/:id/
//  - GET/PUT /sync  -> per-user sync blobs in KV (avoids JSONStorage 64KB limit)
// Requires KV binding: INBOX

const SYNC_INDEX_KEY = 'sync:index';
const SYNC_USER_PREFIX = 'sync:user:';
const LEGACY_STORAGE_URL = 'https://api.jsonstorage.net/v1/json/d206ce58-9543-48db-a5e4-997cfc745ef3/acac021f-7bae-4492-8f3c-e90b18960dea';
const LEGACY_STORAGE_KEY = '2f9e71c8-be66-4623-a2cc-a6f05e958563';

export default {
  async fetch(request, env, ctx) {
    const { method } = request;
    const url = new URL(request.url);
    const path = url.pathname;

    // CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders() });
    }

    // POST /send -> queue a message for recipient inbox
    if (method === 'POST' && path === '/send') {
      let payload = null;
      try { payload = await request.json(); } catch (_) {}

      const toUUIDRaw = (payload && String(payload.toUUID || '').trim()) || '';
      const toUUID = toUUIDRaw.toUpperCase();
      const id = (payload && payload.id) || '';
      const galleryUrl = (payload && payload.url) || '';
      const fromUUID = (payload && payload.fromUUID) || '';

      if (!toUUID) return json({ error: 'Missing toUUID' }, 400);
      // Enforce 5-character alphanumeric UUIDs
      if (!/^[A-Z0-9]{5}$/.test(toUUID)) return json({ error: 'Invalid toUUID format (must be 5 alphanumeric)' }, 400);
      if (!id && !galleryUrl) return json({ error: 'Missing gallery id or url' }, 400);

      let finalId = id;
      let finalUrl = galleryUrl;
      if (!finalId && finalUrl) {
        const m = finalUrl.match(/\/g\/(\d+)/);
        if (m) finalId = m[1];
      }
      if (!finalUrl && finalId) {
        finalUrl = `https://nhentai.net/g/${finalId}/`;
      }

      const sourceStore = (payload && typeof payload.sourceStore === 'string' && ['public', 'private'].includes(payload.sourceStore)) ? payload.sourceStore : 'public';

      const key = `inbox:${toUUID}`;
      const existing = await env.INBOX.get(key);
      const messages = existing ? JSON.parse(existing) : [];
      messages.push({ toUUID, fromUUID, id: finalId, url: finalUrl, ts: Date.now(), sourceStore });
      await env.INBOX.put(key, JSON.stringify(messages), { expirationTtl: 60 * 60 * 24 * 30 }); // 30-day TTL

      return json({ status: 'ok' });
    }

    // GET /inbox?uuid=...&drain=true -> fetch and optionally drain messages
    if (method === 'GET' && path === '/inbox') {
      const uuidRaw = (url.searchParams.get('uuid') || '').trim();
      const uuid = uuidRaw.toUpperCase();
      const drain = (url.searchParams.get('drain') || '').toLowerCase() === 'true';
      if (!uuid) return json({ error: 'Missing uuid' }, 400);
      // Enforce 5-character alphanumeric UUIDs for inbox retrieval
      if (!/^[A-Z0-9]{5}$/.test(uuid)) return json({ error: 'Invalid uuid format (must be 5 alphanumeric)' }, 400);

      const key = `inbox:${uuid}`;
      const existing = await env.INBOX.get(key);
      const messages = existing ? JSON.parse(existing) : [];
      if (drain && messages.length) {
        await env.INBOX.delete(key);
      }
      return json(messages);
    }

    // Legacy: POST /share -> return share URL
    if (method === 'POST' && path === '/share') {
      let payload = null;
      try { payload = await request.json(); } catch (_) {}

      const galleryUrl = (payload && payload.url) || '';
      let id = (payload && payload.id) || '';
      if (!id && galleryUrl) {
        const m = galleryUrl.match(/\/g\/(\d+)/);
        if (m) id = m[1];
      }
      if (!id) return json({ error: 'Missing gallery id or url' }, 400);
      const shareUrl = `https://nhentai-share.babykoolstar.workers.dev/g/${id}`;
      return json({ shareUrl });
    }

    // GET /g/:id -> redirect to nhentai gallery
    const match = path.match(/^\/g\/(\d+)$/);
    if (method === 'GET' && match) {
      const id = match[1];
      const target = `https://nhentai.net/g/${id}/`;
      return Response.redirect(target, 302);
    }

    // /sync -> per-user KV storage (JSONStorage is capped at 64KB for the whole bin)
    if (path === '/sync' || path === '/sync/') {
      if (method === 'GET') {
        try {
          const store = await readSyncStore(env);
          return json(store);
        } catch (err) {
          return json({ error: 'Sync download failed', detail: String(err && err.message ? err.message : err) }, 502);
        }
      }

      if (method === 'POST' || method === 'PUT') {
        let payload = null;
        try { payload = await request.json(); } catch (_) {}
        if (!payload || typeof payload !== 'object') return json({ error: 'Missing payload' }, 400);

        try {
          const saved = await writeSyncStore(env, payload);
          return json(saved);
        } catch (err) {
          return json({ error: 'Sync upload failed', detail: String(err && err.message ? err.message : err) }, 502);
        }
      }
    }

    // GET /status -> Check for forced updates
    if (path === '/status') {
      return json({
        forceUpdate: false, // Set to true to enable the lock
        minVersion: "10.3.4", // Users below this version will be locked out
        message: "A critical update is required to fix data corruption issues. Please update immediately.",
        syncBackend: 'kv',
      });
    }

    // Default help route
    const help = 'NHentai Share Worker\n\nPOST /send with {toUUID, id|url, fromUUID?}.\nGET /inbox?uuid=...&drain=true to retrieve messages.\nPOST /share (legacy) and GET /g/:id available.\nPOST/GET /sync for data synchronization (KV-backed).\nGET /status for version checks.';
    return new Response(help, { status: 200, headers: { ...corsHeaders(), 'Content-Type': 'text/plain' } });
  }
};

async function readSyncIndex(env) {
  const raw = await env.INBOX.get(SYNC_INDEX_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((u) => typeof u === 'string' && /^[A-Z0-9]{5}$/.test(u)) : [];
  } catch (_) {
    return [];
  }
}

async function writeSyncIndex(env, uuids) {
  const unique = [...new Set((uuids || []).map((u) => String(u).toUpperCase()).filter((u) => /^[A-Z0-9]{5}$/.test(u)))];
  await env.INBOX.put(SYNC_INDEX_KEY, JSON.stringify(unique));
  return unique;
}

async function migrateLegacySyncToKv(env) {
  const proxyRes = await fetch(`${LEGACY_STORAGE_URL}?apiKey=${LEGACY_STORAGE_KEY}`);
  if (!proxyRes.ok) {
    throw new Error(`Legacy sync read failed (${proxyRes.status})`);
  }
  const data = await proxyRes.json();
  if (!data || typeof data !== 'object') {
    await writeSyncIndex(env, []);
    return { users: {} };
  }

  const users = data.users && typeof data.users === 'object' ? data.users : {};
  const uuids = Object.keys(users);
  for (const uuid of uuids) {
    await env.INBOX.put(`${SYNC_USER_PREFIX}${uuid}`, JSON.stringify(users[uuid]));
  }
  await writeSyncIndex(env, uuids);
  return { users };
}

async function readSyncStore(env) {
  let index = await readSyncIndex(env);

  // First request after deploy: migrate the old JSONStorage bin into KV once.
  if (index.length === 0) {
    const legacyMarker = await env.INBOX.get('sync:migrated');
    if (!legacyMarker) {
      const migrated = await migrateLegacySyncToKv(env);
      await env.INBOX.put('sync:migrated', new Date().toISOString());
      return migrated;
    }
  }

  const users = {};
  for (const uuid of index) {
    const raw = await env.INBOX.get(`${SYNC_USER_PREFIX}${uuid}`);
    if (!raw) continue;
    try {
      users[uuid] = JSON.parse(raw);
    } catch (_) {
      // skip corrupt entry
    }
  }
  return { users };
}

async function writeSyncStore(env, payload) {
  const incomingUsers = payload.users && typeof payload.users === 'object' && !Array.isArray(payload.users)
    ? payload.users
    : null;

  if (!incomingUsers) {
    throw new Error('Payload must include a users map');
  }

  const existingIndex = await readSyncIndex(env);
  const nextIndex = new Set(existingIndex);

  for (const [uuidRaw, entry] of Object.entries(incomingUsers)) {
    const uuid = String(uuidRaw || '').toUpperCase();
    if (!/^[A-Z0-9]{5}$/.test(uuid)) continue;
    await env.INBOX.put(`${SYNC_USER_PREFIX}${uuid}`, JSON.stringify(entry));
    nextIndex.add(uuid);
  }

  const uuids = await writeSyncIndex(env, [...nextIndex]);
  // Return assembled store so clients get the same shape as before.
  const users = {};
  for (const uuid of uuids) {
    const raw = await env.INBOX.get(`${SYNC_USER_PREFIX}${uuid}`);
    if (!raw) continue;
    try { users[uuid] = JSON.parse(raw); } catch (_) {}
  }
  return { users };
}

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(), 'Content-Type': 'application/json' }
  });
}
