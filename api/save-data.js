// api/save-data.js
import { put } from '@vercel/blob';

export default async function handler(req, res) {
  // Autoriser seulement les requêtes POST
  if (req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Méthode non autorisée. Utilisez POST.' 
    });
  }

  try {
    // Récupérer les données du body
    const data = req.body;
    
    // Validation basique
    if (!data || !data.vendeurs) {
      return res.status(400).json({ 
        success: false, 
        error: 'Données manquantes. Structure attendue: { vendeurs: {...} }' 
      });
    }

    // Ajouter des métadonnées
    const dataWithMeta = {
      ...data,
      lastUpdate: new Date().toISOString(),
      version: '1.0',
      source: 'dashboard-commercial'
    };

    console.log('💾 Sauvegarde des données:', Object.keys(dataWithMeta.vendeurs));

    // Sauvegarder dans Vercel Blob
    const blob = await put(
      'dashboard-commercial.json', 
      JSON.stringify(dataWithMeta, null, 2), 
      {
        access: 'public',
        contentType: 'application/json',
      }
    );

    console.log('✅ Données sauvegardées dans Blob:', blob.url);

    // Réponse de succès
    res.status(200).json({ 
      success: true, 
      message: 'Données sauvegardées avec succès',
      timestamp: dataWithMeta.lastUpdate,
      blobUrl: blob.url
    });

  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde:', error);
    
    res.status(500).json({ 
      success: false, 
      error: 'Erreur serveur lors de la sauvegarde',
      details: process.env.NODE_ENV === 'development' ? error.message : 'Erreur interne'
    });
  }
}
