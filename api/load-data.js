// api/load-data.js
import { list } from '@vercel/blob';

export default async function handler(req, res) {
  // Autoriser GET et POST
  if (req.method !== 'GET' && req.method !== 'POST') {
    return res.status(405).json({ 
      success: false, 
      error: 'Méthode non autorisée. Utilisez GET ou POST.' 
    });
  }

  try {
    console.log('📡 Tentative de chargement des données...');

    // Lister tous les blobs pour trouver notre fichier
    const { blobs } = await list({
      prefix: 'dashboard-commercial'
    });
    
    const dashboardBlob = blobs.find(blob => 
      blob.pathname === 'dashboard-commercial.json'
    );

    if (!dashboardBlob) {
      console.log('📝 Aucune donnée trouvée - première utilisation');
      
      // Structure par défaut pour la première utilisation
      const defaultData = {
        vendeurs: {
          Vincent: { rdv: 0, ventes: 0, ca: 0, marge: 0, objectif: 0 },
          Raphael: { rdv: 0, ventes: 0, ca: 0, marge: 0, objectif: 0 },
          Leo: { rdv: 0, ventes: 0, ca: 0, marge: 0, objectif: 0 },
          Pablo: { rdv: 0, ventes: 0, ca: 0, marge: 0, objectif: 0 },
          Nathan: { rdv: 0, ventes: 0, ca: 0, marge: 0, objectif: 0 }
        },
        lastUpdate: new Date().toISOString(),
        version: '1.0',
        source: 'dashboard-commercial'
      };

      return res.status(200).json({
        success: true,
        data: defaultData,
        message: 'Première utilisation - données initialisées',
        isFirstTime: true
      });
    }

    // Récupérer le contenu du blob
    console.log('📦 Blob trouvé:', dashboardBlob.url);
    
    const response = await fetch(dashboardBlob.url);
    
    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }
    
    const data = await response.json();

    // Validation des données chargées
    if (!data.vendeurs) {
      throw new Error('Structure de données invalide - vendeurs manquants');
    }

    console.log('✅ Données chargées avec succès');
    console.log('👥 Vendeurs trouvés:', Object.keys(data.vendeurs));
    console.log('📅 Dernière mise à jour:', data.lastUpdate);

    res.status(200).json({
      success: true,
      data: data,
      message: 'Données chargées avec succès',
      vendeurCount: Object.keys(data.vendeurs).length,
      lastUpdate: data.lastUpdate
    });

  } catch (error) {
    console.error('❌ Erreur lors du chargement:', error);
    
    // En cas d'erreur, retourner des données par défaut
    const fallbackData = {
      vendeurs: {
        Vincent: { rdv: 0, ventes: 0, ca: 0, marge: 0, objectif: 0 },
        Raphael: { rdv: 0, ventes: 0, ca: 0, marge: 0, objectif: 0 },
        Leo: { rdv: 0, ventes: 0, ca: 0, marge: 0, objectif: 0 },
        Pablo: { rdv: 0, ventes: 0, ca: 0, marge: 0, objectif: 0 },
        Nathan: { rdv: 0, ventes: 0, ca: 0, marge: 0, objectif: 0 }
      },
      lastUpdate: new Date().toISOString(),
      version: '1.0',
      source: 'dashboard-commercial-fallback'
    };

    res.status(200).json({
      success: true,
      data: fallbackData,
      message: 'Données par défaut (erreur de chargement)',
      error: process.env.NODE_ENV === 'development' ? error.message : 'Erreur de chargement',
      isFallback: true
    });
  }
}
