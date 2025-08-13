import { put, list } from '@vercel/blob';

export default async function handler(req, res) {
  // Headers CORS - OBLIGATOIRES
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Nom du fichier fixe et simple
  const fileName = 'dashboard-commercial.json';
  
  console.log(`[${new Date().toISOString()}] ${req.method} ${fileName}`);

  try {
    if (req.method === 'GET') {
      // LECTURE
      console.log('📖 Tentative de lecture...');
      
      const { blobs } = await list();
      const targetBlob = blobs.find(blob => blob.pathname === fileName);
      
      if (!targetBlob) {
        console.log('📝 Pas de données - retour valeurs par défaut');
        return res.status(200).json({
          donneesParMois: {},
          moisActuel: new Date().getMonth(),
          anneeActuelle: new Date().getFullYear(),
          version: 'v1.0',
          isDefault: true
        });
      }

      console.log('📥 Blob trouvé, téléchargement...');
      const response = await fetch(targetBlob.url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('✅ Données chargées avec succès');
      
      return res.status(200).json(data);
      
    } else if (req.method === 'POST') {
      // ÉCRITURE
      console.log('💾 Tentative de sauvegarde...');
      
      const requestData = req.body;
      
      if (!requestData) {
        return res.status(400).json({ 
          ok: false, 
          error: 'Aucune donnée reçue' 
        });
      }

      // Préparer les données avec timestamp
      const dataToSave = {
        ...requestData,
        lastUpdate: new Date().toISOString(),
        version: 'v1.0'
      };

      console.log('🔄 Sauvegarde vers Vercel Blob...');
      
      const blob = await put(fileName, JSON.stringify(dataToSave, null, 2), {
        access: 'public',
        contentType: 'application/json'
      });

      console.log('✅ Sauvegarde réussie:', blob.url);
      
      return res.status(200).json({ 
        ok: true, 
        url: blob.url,
        timestamp: dataToSave.lastUpdate
      });
      
    } else {
      // Méthode non supportée
      return res.status(405).json({ 
        ok: false, 
        error: `Méthode ${req.method} non supportée` 
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur API:', error);
    
    if (req.method === 'GET') {
      // En cas d'erreur de lecture, retourner des données par défaut
      return res.status(200).json({
        donneesParMois: {},
        moisActuel: new Date().getMonth(),
        anneeActuelle: new Date().getFullYear(),
        version: 'v1.0',
        error: error.message,
        isError: true
      });
    } else {
      // En cas d'erreur de sauvegarde
      return res.status(500).json({ 
        ok: false, 
        error: error.message 
      });
    }
  }
}
