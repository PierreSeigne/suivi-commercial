import { put, get } from '@vercel/blob';

export const config = { runtime: 'nodejs' }; // IMPORTANT

function pickKey(req) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const d = url.searchParams.get('d') || 'default';
  return `suivi-commercial-${d}.json`;
}

export default async function handler(req, res) {
  try {
    const key = pickKey(req);

    if (req.method === 'GET') {
      const blob = await get(key);
      if (!blob) {
        return res.status(200).json({ donneesParMois: {}, version: 'blob-1' });
      }
      const data = await fetch(blob.url).then(r => r.json());
      return res.status(200).json(data);
    }

    if (req.method === 'POST') {
      let body = '';
      for await (const chunk of req) {
        body += chunk;
      }
      await put(key, body, {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false
      });
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end('Method Not Allowed');

  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
