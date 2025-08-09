// Runtime Node (Serverless)
export const config = { runtime: 'nodejs' };

import { put } from '@vercel/blob';

export default async function handler(req, res) {
  const pathname = 'suivi-commercial/data.json';

  if (req.method === 'GET') {
    try {
      const url = `https://blob.vercel-storage.com/${pathname}`;
      const r = await fetch(url);
      if (r.ok) {
        const text = await r.text();
        res.setHeader('content-type', 'application/json');
        return res.status(200).send(text);
      }
      res.setHeader('content-type', 'application/json');
      return res
        .status(200)
        .send(JSON.stringify({ donneesParMois: {}, version: 'init' }));
    } catch (e) {
      return res.status(500).json({ ok: false, error: String(e) });
    }
  }

  if (req.method === 'POST') {
    try {
      const raw = await new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => (data += chunk));
        req.on('end', () => resolve(data));
        req.on('error', reject);
      });
      const json = raw ? JSON.parse(raw) : {};

      const { url } = await put(pathname, JSON.stringify(json), {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
        token: process.env.BLOB_READ_WRITE_TOKEN,
      });

      res.setHeader('content-type', 'application/json');
      return res.status(200).send(JSON.stringify({ ok: true, url }));
    } catch (e) {
      return res.status(400).json({ ok: false, error: String(e) });
    }
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).send('Method Not Allowed');
}
