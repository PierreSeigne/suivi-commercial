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

function getDefaultData() {
  return {
    donneesParMois: {},
    moisActuel: new Date().getMonth(),
    anneeActuelle: new Date().getFullYear(),
    version: 'blob-1',
    lastUpdate: new Date().toISOString()
  };
}

export default async function handler(req, res) {
  try {
    const key = pickKey(req);
    console.log('Processing request:', req.method, 'for key:', key);

    // Ajouter les headers CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }

    if (req.method === 'GET') {
      try {
        // Lister tous les blobs pour trouver le bon
        const { blobs } = await list({ prefix: key });
        
        if (blobs.length === 0) {
          console.log('No blob found, returning default data');
          return res.status(200).json(getDefaultData());
        }

        // Prendre le premier blob trouvé
        const blob = blobs[0];
        console.log('Found blob:', blob.pathname);
        
        const response = await fetch(blob.url);
        if (!response.ok) {
          throw new Error(`Failed to fetch blob: ${response.statusText}`);
        }
        
        const data = await response.json();
        
        // Validation et nettoyage des données
        if (!data.donneesParMois) {
          data.donneesParMois = {};
        }
        
        return res.status(200).json(data);

      } catch (fetchError) {
        console.error('Error fetching blob:', fetchError);
        return res.status(200).json({
          ...getDefaultData(),
          error: fetchError.message
        });
      }
    }

    if (req.method === 'POST') {
      try {
        const bodyData = req.body;
        
        // Validation des données reçues
        if (!bodyData || typeof bodyData !== 'object') {
          return res.status(400).json({ 
            ok: false, 
            error: 'Données invalides'
          });
        }

        // Enrichir les données avec des métadonnées
        const dataToSave = {
          ...bodyData,
          lastUpdate: new Date().toISOString(),
          version: 'blob-1'
        };
        
        console.log('Saving data to blob:', key);
        
        const blob = await put(key, JSON.stringify(dataToSave, null, 2), {
          access: 'public',
          contentType: 'application/json',
          addRandomSuffix: false
        });

        console.log('Blob saved successfully:', blob.url);
        
        return res.status(200).json({ 
          ok: true, 
          url: blob.url,
          key: key,
          timestamp: dataToSave.lastUpdate
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

    res.setHeader('Allow', ['GET', 'POST', 'OPTIONS']);
    return res.status(405).json({ 
      ok: false, 
      error: `Method ${req.method} Not Allowed` 
    });

  } catch (err) {
    console.error('API Error:', err);
    return res.status(500).json({ 
      ok: false, 
      error: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
}
