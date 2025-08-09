import { put, get } from '@vercel/blob';

export const config = { runtime: 'nodejs' };

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
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const payload = Buffer.concat(chunks).toString();
      await put(key, payload, { contentType: 'application/json', access: 'public' });
      return res.status(200).json({ ok: true });
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end('Method Not Allowed');
  } catch (err) {
    console.error(err);
    return res.status(500).json({ ok: false, error: err.message });
  }
}
