// frontend-data.js - Compatible avec votre HTML existant
// Ce fichier remplace la logique localStorage par des appels à votre API Blob

console.log('🚀 Chargement frontend-data.js - Version API Blob');

// Configuration
const API_ENDPOINT = '/api/data';
const DATASET = new URLSearchParams(location.search).get('d') || 'default';
const MOIS_NOMS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'];

// Variables globales - compatibles avec votre code existant
let moisActuel = new Date().getMonth();
let anneeActuelle = new Date().getFullYear();
let donneesParMois = {};
let isLoading = false;

// Fonction pour obtenir la clé du mois (compatible avec votre code)
function getMoisKey(mois = moisActuel, annee = anneeActuelle) {
    return `${annee}-${mois}`;
}

// Fonction pour obtenir les données actuelles (compatible avec votre code)
function getDonneesActuelles() {
    const key = getMoisKey();
    if (!donneesParMois[key]) {
        donneesParMois[key] = vendeurDefaults();
    }
    return donneesParMois[key];
}

// Fonction pour les valeurs par défaut (compatible avec votre code)
function vendeurDefaults() {
    return {
        'Vincent': { prospects: 0, ventes: 0, ca: 0, objectif: 80000, margeValeur: 2500 },
        'Raphael': { prospects: 0, ventes: 0, ca: 0, objectif: 100000, margeValeur: 2600 },
        'Léo': { prospects: 0, ventes: 0, ca: 0, objectif: 75000, margeValeur: 2200 },
        'Pablo': { prospects: 0, ventes: 0, ca: 0, objectif: 90000, margeValeur: 2400 },
        'Nathan': { prospects: 0, ventes: 0, ca: 0, objectif: 85000, margeValeur: 2300 }
    };
}

// 📡 NOUVEAU : Charger les données depuis votre API Blob
async function chargerDepuisServeurAuto() {
    if (isLoading) return;
    isLoading = true;
    
    try {
        console.log('📡 Chargement automatique depuis API Blob...');
        
        const response = await fetch(`${API_ENDPOINT}?d=${encodeURIComponent(DATASET)}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('📦 Données reçues depuis Blob:', data);
        
        // Intégrer les données reçues
        if (data && data.donneesParMois) {
            donneesParMois = data.donneesParMois;
            
            // Mettre à jour les variables globales si présentes
            if (typeof data.moisActuel === 'number') moisActuel = data.moisActuel;
            if (typeof data.anneeActuelle === 'number') anneeActuelle = data.anneeActuelle;
            
            console.log('✅ Données intégrées depuis le serveur');
        } else {
            console.log('📝 Aucune donnée serveur - utilisation des défauts');
            initialiserDonnees();
        }

    } catch (error) {
        console.error('❌ Erreur lors du chargement auto:', error);
        // Utiliser les données par défaut en cas d'erreur
        initialiserDonnees();
    } finally {
        isLoading = false;
    }
}

// 💾 NOUVEAU : Sauvegarder automatiquement vers votre API Blob
async function sauvegarderVersServeurAuto() {
    try {
        console.log('💾 Sauvegarde automatique vers API Blob...');
        
        const payload = {
            donneesParMois,
            moisActuel,
            anneeActuelle,
            dateExport: new Date().toISOString(),
            version: '2.5-blob-integration'
        };

        const response = await fetch(`${API_ENDPOINT}?d=${encodeURIComponent(DATASET)}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.ok) {
            console.log('✅ Sauvegarde automatique réussie');
            console.log('🔗 URL Blob:', result.url);
            return true;
        } else {
            throw new Error(result.error || 'Erreur de sauvegarde');
        }

    } catch (error) {
        console.error('❌ Erreur sauvegarde automatique:', error);
        return false;
    }
}

// Fonction pour initialiser les données (compatible avec votre code)
function initialiserDonnees() {
    console.log('🔧 Initialisation des données par défaut');
    for (let mois = 0; mois < 12; mois++) {
        const key = `${anneeActuelle}-${mois}`;
        if (!donneesParMois[key]) {
            donneesParMois[key] = vendeurDefaults();
        }
    }
}

// 🔄 MODIFICATION : Votre fonction chargerDepuisServeur existante - avec intégration Blob
async function chargerDepuisServeur() {
    console.log('⬇️ Chargement manuel depuis serveur');
    
    const originalText = 'Charger depuis serveur';
    const loadBtn = document.getElementById('load-btn');
    
    if (loadBtn) {
        loadBtn.textContent = '⏳ Chargement...';
        loadBtn.disabled = true;
    }
    
    try {
        await chargerDepuisServeurAuto();
        
        // Mettre à jour l'affichage après le chargement
        updateMoisAffichage();
        updateActiveTab();
        updateSaisieFields();
        
        showNotification('✅ Données chargées avec succès depuis le serveur');
        
    } catch (error) {
        console.error('Erreur chargement manuel:', error);
        showNotification('❌ Erreur de chargement', 'warning');
    } finally {
        if (loadBtn) {
            loadBtn.textContent = '⬇️ Charger depuis serveur';
            loadBtn.disabled = false;
        }
    }
}

// 🔄 MODIFICATION : Votre fonction sauvegarderVersServeur existante - avec intégration Blob
async function sauvegarderVersServeur() {
    console.log('⬆️ Sauvegarde manuelle vers serveur');
    
    const saveBtn = document.getElementById('save-server-btn');
    const originalText = 'Sauvegarder vers serveur';
    
    if (saveBtn) {
        saveBtn.textContent = '⏳ Sauvegarde...';
        saveBtn.disabled = true;
    }
    
    try {
        const success = await sauvegarderVersServeurAuto();
        
        if (success) {
            showNotification('✅ Données sauvegardées sur le serveur');
        } else {
            showNotification('❌ Erreur de sauvegarde', 'warning');
        }
        
    } catch (error) {
        console.error('Erreur sauvegarde manuelle:', error);
        showNotification('❌ Erreur de sauvegarde', 'warning');
    } finally {
        if (saveBtn) {
            saveBtn.textContent = '⬆️ Sauvegarder vers serveur';
            saveBtn.disabled = false;
        }
    }
}

// 🔄 MODIFICATION : Votre fonction sauvegarderDonnees existante - avec auto-sauvegarde
function sauvegarderDonneesAvecBlob() {
    console.log('💾 Sauvegarde données avec intégration Blob');
    
    const v = document.getElementById('vendeur-select')?.value;
    const prospects = parseInt(document.getElementById('prospects-input')?.value) || 0;
    const ventes = parseInt(document.getElementById('ventes-input')?.value) || 0;
    const ca = parseInt(document.getElementById('ca-input')?.value) || 0;
    const margeInput = document.getElementById('marge-input')?.value;
    const objectifInput = document.getElementById('objectif-input')?.value;
    
    if (!v) {
        showNotification('Erreur: Sélectionnez un vendeur', 'warning');
        return;
    }
    
    if (prospects === 0 && ventes === 0 && ca === 0) {
        showNotification('Veuillez saisir au moins une valeur', 'warning');
        return;
    }
    
    if (ventes > prospects && prospects > 0) {
        showNotification('Erreur: Les ventes ne peuvent pas dépasser les prospects', 'warning');
        return;
    }
    
    const d = getDonneesActuelles();
    d[v].prospects += prospects;
    d[v].ventes += ventes;
    d[v].ca += ca;
    
    if (margeInput !== '') d[v].margeValeur = Math.max(0, parseFloat(margeInput));
    if (objectifInput !== '') d[v].objectif = Math.max(0, parseFloat(objectifInput));
    
    // Reset inputs
    ['prospects-input', 'ventes-input', 'ca-input'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    
    // 🆕 SAUVEGARDE AUTOMATIQUE vers Blob
    sauvegarderVersServeurAuto().then(success => {
        if (success) {
            showNotification(`✅ Données de ${v} sauvegardées et synchronisées`);
        } else {
            showNotification(`⚠️ Données de ${v} sauvegardées localement seulement`);
        }
    });
    
    updateActiveTab();
}

// 🆕 NOUVELLE FONCTION : Synchronisation périodique
function demarrerSynchronisationPeriodique() {
    console.log('🔄 Démarrage synchronisation périodique (toutes les 5 minutes)');
    
    setInterval(async () => {
        console.log('🔄 Synchronisation périodique...');
        try {
            await chargerDepuisServeurAuto();
            updateActiveTab(); // Mettre à jour l'affichage avec les nouvelles données
        } catch (error) {
            console.error('Erreur synchronisation périodique:', error);
        }
    }, 5 * 60 * 1000); // 5 minutes
}

// 🔄 REMPLACEMENT : Remplacer votre fonction sauvegarderDonnees existante
function remplacerFonctionSauvegarde() {
    // Remplacer la fonction globale existante
    if (typeof window.sauvegarderDonnees === 'function') {
        console.log('🔄 Remplacement de la fonction sauvegarderDonnees existante');
        window.sauvegarderDonnees = sauvegarderDonneesAvecBlob;
    }
}

// 🆕 NOUVELLE FONCTION : Initialisation avec chargement Blob
async function initialiserAvecBlob() {
    console.log('🚀 Initialisation avec intégration Blob');
    
    try {
        // Charger les données depuis le serveur
        await chargerDepuisServeurAuto();
        
        // Initialiser les données si nécessaire
        if (Object.keys(donneesParMois).length === 0) {
            initialiserDonnees();
        }
        
        // Démarrer la synchronisation périodique
        demarrerSynchronisationPeriodique();
        
        // Remplacer les fonctions existantes
        remplacerFonctionSauvegarde();
        
        console.log('✅ Intégration Blob terminée avec succès');
        showNotification('🌐 Dashboard synchronisé avec le cloud', 'success');
        
    } catch (error) {
        console.error('❌ Erreur initialisation Blob:', error);
        // Continuer avec les données par défaut
        initialiserDonnees();
        showNotification('⚠️ Mode hors ligne - données locales uniquement', 'warning');
    }
}

// 🚀 AUTO-INITIALISATION
console.log('⏳ Attente du chargement complet du DOM...');

// Attendre que votre script principal soit chargé
function attendreInitialisationPrincipale() {
    if (typeof donneesParMois !== 'undefined' && typeof showNotification === 'function') {
        console.log('✅ Script principal détecté - lancement intégration Blob');
        initialiserAvecBlob();
    } else {
        console.log('⏳ Script principal non encore chargé - nouvelle tentative dans 500ms');
        setTimeout(attendreInitialisationPrincipale, 500);
    }
}

// Démarrer l'attente après le chargement du DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(attendreInitialisationPrincipale, 1000);
    });
} else {
    setTimeout(attendreInitialisationPrincipale, 1000);
}

console.log('📡 Frontend-data.js chargé - Intégration Blob prête');
