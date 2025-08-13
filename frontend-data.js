// === FONCTIONS SERVEUR CORRIGÉES ===
async function sauvegarderVersServeur() {
  console.log('⬆️ Sauvegarde vers serveur');
  try {
    // Utiliser le format compatible avec data.js
    const dataToSave = {
      donneesParMois: donneesParMois,
      moisActuel: moisActuel,
      anneeActuelle: anneeActuelle,
      lastUpdate: new Date().toISOString(),
      version: '2.5-corrige',
      source: 'dashboard-commercial'
    };

    console.log('📤 Données à envoyer:', dataToSave);

    // Utiliser l'endpoint /api/data avec POST
    const response = await fetch(`/api/data?d=${DATASET}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(dataToSave)
    });

    console.log('📡 Réponse serveur:', response.status, response.statusText);

    if (response.ok) {
      const result = await response.json();
      if (result.ok) {
        showNotification('✅ Données sauvegardées sur le serveur !');
        console.log('✅ Sauvegarde réussie:', result);
      } else {
        throw new Error(result.error || 'Erreur de sauvegarde');
      }
    } else {
      const errorText = await response.text();
      console.error('❌ Erreur serveur:', response.status, errorText);
      throw new Error(`Erreur serveur: ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Erreur sauvegarde serveur:', error);
    showNotification(`❌ Erreur: ${error.message}`, 'warning');
  }
}

async function chargerDepuisServeur() {
  console.log('⬇️ Chargement depuis serveur');
  try {
    // Utiliser l'endpoint /api/data avec GET
    const response = await fetch(`/api/data?d=${DATASET}`);
    
    console.log('📡 Réponse data:', response.status, response.statusText);
    
    if (response.ok) {
      const result = await response.json();
      console.log('📥 Données reçues:', result);
      
      if (result.donneesParMois) {
        // Les données sont au bon format
        donneesParMois = result.donneesParMois;
        
        // Mise à jour du mois/année si fournis
        if (result.moisActuel !== undefined) moisActuel = result.moisActuel;
        if (result.anneeActuelle !== undefined) anneeActuelle = result.anneeActuelle;
        
        // S'assurer que les données du mois actuel existent
        const key = getMoisKey();
        if (!donneesParMois[key]) {
          donneesParMois[key] = vendeurDefaults();
        }
        
        updateMoisAffichage();
        updateActiveTab();
        showNotification('✅ Données chargées depuis le serveur !');
        console.log('✅ Chargement réussi');
      } else {
        // Première utilisation - initialiser
        showNotification('ℹ️ Première utilisation - données initialisées', 'warning');
        initialiserDonnees();
        updateActiveTab();
      }
    } else {
      throw new Error(`Erreur serveur: ${response.status}`);
    }
  } catch (error) {
    console.error('❌ Erreur chargement serveur:', error);
    showNotification(`❌ Erreur: ${error.message}`, 'warning');
    // En cas d'erreur, initialiser les données par défaut
    initialiserDonnees();
    updateActiveTab();
  }
}
