export const config = { runtime: 'edge' };

export default async function handler(req) {
  const pathname = 'suivi-commercial/data.json';
  const { put } = await import('@vercel/blob');

  if (req.method === 'GET') {
    const url = `https://blob.vercel-storage.com/${pathname}`;
    const res = await fetch(url);
    if (res.ok) {
      const text = await res.text();
      return new Response(text, { headers: { 'content-type': 'application/json' } });
    }
    // Première fois : renvoyer un objet vide
    return new Response(JSON.stringify({ donneesParMois: {}, version: 'init' }), {
      headers: { 'content-type': 'application/json' }
    });
  }

  if (req.method === 'POST') {
    try {
      const body = await req.json();
      const { url } = await put(pathname, JSON.stringify(body), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
        token: process.env.BLOB_READ_WRITE_TOKEN
      });
      return new Response(JSON.stringify({ ok: true, url }), {
        headers: { 'content-type': 'application/json' }
      });
    } catch (e) {
      return new Response(JSON.stringify({ ok: false, error: String(e) }), {
        status: 400,
        headers: { 'content-type': 'application/json' }
      });
    }
  }

  return new Response('Method Not Allowed', { status: 405 });
}
