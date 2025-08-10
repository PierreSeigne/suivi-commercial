import { put, list } from '@vercel/blob';

export const config = { 
  runtime: 'nodejs',
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

function pickKey(req) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const d = url.searchParams.get('d') || 'default';
  return `suivi-commercial-${d}.json`;
}

export default async function handler(req, res) {
  try {
    const key = pickKey(req);
    console.log('Processing request:', req.method, 'for key:', key);

    if (req.method === 'GET') {
      try {
        // Lister tous les blobs pour trouver le bon
        const { blobs } = await list({ prefix: key });
        
        if (blobs.length === 0) {
          console.log('No blob found, returning default data');
          return res.status(200).json({ 
            donneesParMois: {}, 
            version: 'blob-1',
            key: key
          });
        }

        // Prendre le premier blob trouvé
        const blob = blobs[0];
        console.log('Found blob:', blob.pathname);
        
        const response = await fetch(blob.url);
        if (!response.ok) {
          throw new Error(`Failed to fetch blob: ${response.statusText}`);
        }
        
        const data = await response.json();
        return res.status(200).json(data);

      } catch (fetchError) {
        console.error('Error fetching blob:', fetchError);
        return res.status(200).json({ 
          donneesParMois: {}, 
          version: 'blob-1',
          key: key,
          error: fetchError.message
        });
      }
    }

    if (req.method === 'POST') {
      try {
        // Next.js parse automatiquement le JSON
        const bodyData = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
        
        console.log('Saving data to blob:', key);
        
        const blob = await put(key, bodyData, {
          access: 'public',
          contentType: 'application/json',
          addRandomSuffix: false
        });

        console.log('Blob saved successfully:', blob.url);
        
        return res.status(200).json({ 
          ok: true, 
          url: blob.url,
          key: key
        });

      } catch (saveError) {
        console.error('Error saving blob:', saveError);
        return res.status(500).json({ 
          ok: false, 
          error: saveError.message,
          key: key
        });
      }
    }

    res.setHeader('Allow', ['GET', 'POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);

  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ 
      ok: false, 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}
