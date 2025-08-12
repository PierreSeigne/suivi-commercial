// frontend-data.js - Version simplifiée qui complète votre code existant
console.log('🚀 Frontend-data.js - Version non-invasive');

// Attendre que le DOM et votre script principal soient chargés
function attendreInitialisation() {
    // Vérifier que les fonctions principales existent
    if (typeof chargerDepuisServeur === 'function' && typeof sauvegarderVersServeur === 'function') {
        console.log('✅ Script principal détecté - ajout de l\'auto-chargement');
        
        // Charger automatiquement les données au démarrage
        setTimeout(() => {
            console.log('📡 Chargement automatique des données...');
            chargerDepuisServeur();
        }, 2000);
        
        // Modifier la fonction de sauvegarde pour auto-sauvegarder vers le serveur
        const sauvegardeOriginale = window.sauvegarderDonnees;
        
        if (sauvegardeOriginale) {
            window.sauvegarderDonnees = function() {
                // Appeler la fonction originale
                sauvegardeOriginale();
                
                // Puis sauvegarder automatiquement vers le serveur
                setTimeout(() => {
                    console.log('💾 Auto-sauvegarde vers le serveur...');
                    sauvegarderVersServeur();
                }, 1000);
            };
            console.log('✅ Auto-sauvegarde activée');
        }
        
        showNotification('🌐 Synchronisation cloud activée');
        
    } else {
        // Réessayer dans 500ms
        setTimeout(attendreInitialisation, 500);
    }
}

// Démarrer l'initialisation
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attendreInitialisation);
} else {
    attendreInitialisation();
}

console.log('📡 Frontend-data.js - Version simplifiée chargée');
