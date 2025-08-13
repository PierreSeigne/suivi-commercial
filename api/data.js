import { put, list } from '@vercel/blob';

export default async function handler(req, res) {
  console.log('🔧 API Request:', req.method);
  
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const key = 'dashboard-commercial-data.json';

  if (req.method === 'GET') {
    try {
      console.log('📖 Lecture des données...');
      const { blobs } = await list({ prefix: key });
      
      if (blobs.length === 0) {
        console.log('📝 Aucune donnée - retour données par défaut');
        return res.status(200).json({
          donneesParMois: {},
          moisActuel: new Date().getMonth(),
          anneeActuelle: new Date().getFullYear(),
          version: 'emergency-1.0'
        });
      }

      const response = await fetch(blobs[0].url);
      const data = await response.json();
      console.log('✅ Données chargées avec succès');
      return res.status(200).json(data);
      
    } catch (error) {
      console.error('❌ Erreur lecture:', error);
      return res.status(200).json({
        donneesParMois: {},
        moisActuel: new Date().getMonth(),
        anneeActuelle: new Date().getFullYear(),
        error: error.message
      });
    }
  }

  if (req.method === 'POST') {
    try {
      console.log('💾 Sauvegarde des données...');
      
      const dataToSave = {
        ...req.body,
        lastUpdate: new Date().toISOString(),
        version: 'emergency-1.0'
      };
      
      const blob = await put(key, JSON.stringify(dataToSave), {
        access: 'public',
        contentType: 'application/json'
      });

      console.log('✅ Données sauvegardées:', blob.url);
      return res.status(200).json({ ok: true, url: blob.url });
      
    } catch (error) {
      console.error('❌ Erreur sauvegarde:', error);
      return res.status(500).json({ ok: false, error: error.message });
    }
  }

  return res.status(405).json({ error: 'Method not allowed' });
}
