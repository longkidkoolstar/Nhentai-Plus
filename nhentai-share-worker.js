// Cloudflare Worker to support NHentai Share feature
// Routes:
//  - POST /send     -> store a share message for a recipient UUID in KV
//  - GET  /inbox    -> retrieve (and optionally drain) inbox messages for a UUID
//  - POST /share    -> returns a shareable URL (legacy/back-compat)
//  - GET  /g/:id    -> redirects to https://nhentai.net/g/:id/
// Requires KV binding: INBOX

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

      const toUUID = (payload && String(payload.toUUID || '').trim()) || '';
      const id = (payload && payload.id) || '';
      const galleryUrl = (payload && payload.url) || '';
      const fromUUID = (payload && payload.fromUUID) || '';

      if (!toUUID) return json({ error: 'Missing toUUID' }, 400);
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

      const key = `inbox:${toUUID}`;
      const existing = await env.INBOX.get(key);
      const messages = existing ? JSON.parse(existing) : [];
      messages.push({ toUUID, fromUUID, id: finalId, url: finalUrl, ts: Date.now() });
      await env.INBOX.put(key, JSON.stringify(messages), { expirationTtl: 60 * 60 * 24 }); // 24h TTL

      return json({ status: 'ok' });
    }

    // GET /inbox?uuid=...&drain=true -> fetch and optionally drain messages
    if (method === 'GET' && path === '/inbox') {
      const uuid = (url.searchParams.get('uuid') || '').trim();
      const drain = (url.searchParams.get('drain') || '').toLowerCase() === 'true';
      if (!uuid) return json({ error: 'Missing uuid' }, 400);

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

    // Default help route
    const help = 'NHentai Share Worker\n\nPOST /send with {toUUID, id|url, fromUUID?}.\nGET /inbox?uuid=...&drain=true to retrieve messages.\nPOST /share (legacy) and GET /g/:id available.';
    return new Response(help, { status: 200, headers: { ...corsHeaders(), 'Content-Type': 'text/plain' } });
  }
};

function corsHeaders() {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
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