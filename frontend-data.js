// frontend-data.js - Compatible avec votre API data.js existante

// Configuration
const API_ENDPOINT = '/api/data';
const DEFAULT_KEY = 'default'; // Peut être changé pour avoir plusieurs environnements

// Structure des données
let vendeursData = {
    Vincent: { rdv: 0, ventes: 0, ca: 0, marge: 0, objectif: 0 },
    Raphael: { rdv: 0, ventes: 0, ca: 0, marge: 0, objectif: 0 },
    Leo: { rdv: 0, ventes: 0, ca: 0, marge: 0, objectif: 0 },
    Pablo: { rdv: 0, ventes: 0, ca: 0, marge: 0, objectif: 0 },
    Nathan: { rdv: 0, ventes: 0, ca: 0, marge: 0, objectif: 0 }
};

let currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM
let isLoading = false;

// 📡 Charger les données depuis votre API Blob existante
async function chargerDonnees(key = DEFAULT_KEY) {
    if (isLoading) return;
    isLoading = true;
    
    try {
        console.log(`📡 Chargement des données (key: ${key})...`);
        
        const response = await fetch(`${API_ENDPOINT}?d=${key}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        console.log('📦 Données reçues:', data);
        
        // Adapter les données à votre structure
        if (data.donneesParMois && data.donneesParMois[currentMonth]) {
            // Si des données existent pour ce mois
            vendeursData = data.donneesParMois[currentMonth] || vendeursData;
            console.log('✅ Données chargées pour le mois:', currentMonth);
        } else {
            // Première utilisation ou nouveau mois
            console.log('📝 Aucune donnée pour ce mois, utilisation des valeurs par défaut');
        }
        
        mettreAJourInterface();

    } catch (error) {
        console.error('❌ Erreur lors du chargement:', error);
        // Fallback vers localStorage
        chargerDepuisLocalStorage();
    } finally {
        isLoading = false;
    }
}

// 💾 Sauvegarder les données vers votre API Blob existante
async function sauvegarderDonnees(key = DEFAULT_KEY) {
    try {
        console.log(`💾 Sauvegarde des données (key: ${key})...`);
        
        // D'abord, charger les données existantes pour ne pas écraser les autres mois
        const existingResponse = await fetch(`${API_ENDPOINT}?d=${key}`);
        let existingData = { donneesParMois: {}, version: 'blob-1' };
        
        if (existingResponse.ok) {
            existingData = await existingResponse.json();
        }
        
        // Mettre à jour seulement le mois actuel
        existingData.donneesParMois = existingData.donneesParMois || {};
        existingData.donneesParMois[currentMonth] = vendeursData;
        existingData.lastUpdate = new Date().toISOString();
        existingData.version = 'blob-1';

        // Sauvegarder
        const response = await fetch(`${API_ENDPOINT}?d=${key}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(existingData)
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        
        if (result.ok) {
            console.log('✅ Données sauvegardées sur Vercel Blob');
            console.log('🔗 URL:', result.url);
            
            // Backup local aussi
            localStorage.setItem('dashboardData', JSON.stringify({
                donneesParMois: { [currentMonth]: vendeursData },
                lastUpdate: new Date().toISOString()
            }));
            
            return true;
        } else {
            throw new Error(result.error || 'Erreur de sauvegarde');
        }

    } catch (error) {
        console.error('❌ Erreur lors de la sauvegarde:', error);
        // Fallback localStorage
        localStorage.setItem('dashboardData', JSON.stringify({
            donneesParMois: { [currentMonth]: vendeursData },
            lastUpdate: new Date().toISOString()
        }));
        return false;
    }
}

// 📱 Fallback localStorage (si l'API ne fonctionne pas)
function chargerDepuisLocalStorage() {
    const savedData = localStorage.getItem('dashboardData');
    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            if (data.donneesParMois && data.donneesParMois[currentMonth]) {
                vendeursData = data.donneesParMois[currentMonth];
                console.log('📱 Données chargées depuis localStorage (fallback)');
            }
        } catch (e) {
            console.error('Erreur parsing localStorage:', e);
        }
    }
    mettreAJourInterface();
}

// 🔄 Actualiser les données depuis le serveur
async function actualiserDonnees() {
    const boutonActualiser = document.querySelector('[onclick*="actualiser"]');
    if (boutonActualiser) {
        const originalText = boutonActualiser.textContent;
        boutonActualiser.textContent = '🔄 Actualisation...';
        boutonActualiser.disabled = true;
        
        await chargerDonnees();
        
        boutonActualiser.textContent = originalText;
        boutonActualiser.disabled = false;
    } else {
        await chargerDonnees();
    }
}

// 🖥️ Mettre à jour l'interface utilisateur
function mettreAJourInterface() {
    // Calculs globaux
    let totalRdv = 0, totalVentes = 0, totalCA = 0, totalObjectif = 0;
    
    Object.values(vendeursData).forEach(vendeur => {
        totalRdv += vendeur.rdv || 0;
        totalVentes += vendeur.ventes || 0;
        totalCA += vendeur.ca || 0;
        totalObjectif += vendeur.objectif || 0;
    });
    
    const tauxGlobal = totalRdv > 0 ? ((totalVentes / totalRdv) * 100).toFixed(1) : 0;
    const progression = totalObjectif > 0 ? ((totalCA / totalObjectif) * 100).toFixed(1) : 0;
    
    // Mise à jour des éléments HTML
    const elements = {
        'totalRdv': totalRdv,
        'totalVentes': totalVentes,
        'tauxGlobal': tauxGlobal + '%',
        'caRealise': new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0
        }).format(totalCA),
        'objectifTotal': new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 0
        }).format(totalObjectif),
        'progression': progression + '%'
    };

    // Appliquer les mises à jour
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
    
    // Trouver le meilleur vendeur
    let meilleurVendeur = null;
    let meilleurCA = 0;
    
    for (const [nom, data] of Object.entries(vendeursData)) {
        if (data.ca > meilleurCA) {
            meilleurCA = data.ca;
            meilleurVendeur = { nom, ...data };
        }
    }
    
    // Mise à jour du meilleur vendeur
    if (meilleurVendeur) {
        const elementsVendeur = {
            'meilleurVendeurNom': meilleurVendeur.nom,
            'meilleurVendeurCA': new Intl.NumberFormat('fr-FR', {
                style: 'currency',
                currency: 'EUR',
                minimumFractionDigits: 0
            }).format(meilleurVendeur.ca),
            'meilleurVendeurTaux': (meilleurVendeur.rdv > 0 ? 
                ((meilleurVendeur.ventes / meilleurVendeur.rdv) * 100).toFixed(1) : 0) + '%',
            'meilleurVendeurProgression': (meilleurVendeur.objectif > 0 ? 
                ((meilleurVendeur.ca / meilleurVendeur.objectif) * 100).toFixed(1) : 0) + '%'
        };

        Object.entries(elementsVendeur).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.textContent = value;
            }
        });
    }
    
    // Mettre à jour les formulaires
    chargerVendeurDansFormulaire();
    
    console.log(`🔄 Interface mise à jour (${currentMonth})`);
}

// 💾 Sauvegarder les données d'un vendeur
async function sauvegarderVendeur() {
    const vendeur = document.getElementById('vendeurSelect')?.value;
    const rdv = parseInt(document.getElementById('rdvInput')?.value) || 0;
    const ventes = parseInt(document.getElementById('ventesInput')?.value) || 0;
    const ca = parseInt(document.getElementById('caInput')?.value) || 0;
    const marge = parseInt(document.getElementById('margeInput')?.value) || 0;
    const objectif = parseInt(document.getElementById('objectifInput')?.value) || 0;
    
    if (!vendeur) {
        alert('⚠️ Veuillez sélectionner un vendeur');
        return;
    }
    
    // Mise à jour des données
    vendeursData[vendeur] = { rdv, ventes, ca, marge, objectif };
    
    // Affichage temporaire de sauvegarde
    const boutonSauvegarder = document.querySelector('[onclick*="sauvegarder"]');
    if (boutonSauvegarder) {
        const originalText = boutonSauvegarder.textContent;
        boutonSauvegarder.textContent = '💾 Sauvegarde...';
        boutonSauvegarder.disabled = true;
    }
    
    // Sauvegarde
    const succes = await sauvegarderDonnees();
    
    // Restaurer le bouton
    if (boutonSauvegarder) {
        boutonSauvegarder.textContent = '💾 Sauvegarder';
        boutonSauvegarder.disabled = false;
    }
    
    if (succes) {
        alert('✅ Données sauvegardées avec succès !');
        mettreAJourInterface();
    } else {
        alert('⚠️ Données sauvegardées localement seulement (vérifiez votre connexion)');
        mettreAJourInterface();
    }
}

// 📋 Charger les données d'un vendeur dans le formulaire
function chargerVendeurDansFormulaire() {
    const vendeurSelect = document.getElementById('vendeurSelect');
    if (vendeurSelect && vendeurSelect.value && vendeursData[vendeurSelect.value]) {
        const data = vendeursData[vendeurSelect.value];
        
        const inputs = {
            'rdvInput': data.rdv || 0,
            'ventesInput': data.ventes || 0,
            'caInput': data.ca || 0,
            'margeInput': data.marge || 0,
            'objectifInput': data.objectif || 0
        };

        Object.entries(inputs).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) {
                element.value = value;
            }
        });
    }
}

// 🗑️ Réinitialiser les données du mois actuel
async function reinitialiserMois() {
    if (confirm(`⚠️ Êtes-vous sûr de vouloir effacer toutes les données du mois ${currentMonth} ?`)) {
        vendeursData = {
            Vincent: { rdv: 0, ventes: 0, ca: 0, marge: 0, objectif: 0 },
            Raphael: { rdv: 0, ventes: 0, ca: 0, marge: 0, objectif: 0 },
            Leo: { rdv: 0, ventes: 0, ca: 0, marge: 0, objectif: 0 },
            Pablo: { rdv: 0, ventes: 0, ca: 0, marge: 0, objectif: 0 },
            Nathan: { rdv: 0, ventes: 0, ca: 0, marge: 0, objectif: 0 }
        };
        
        await sauvegarderDonnees();
        mettreAJourInterface();
        alert(`🔄 Données du mois ${currentMonth} réinitialisées`);
    }
}

// 🗑️ Tout effacer (tous les mois)
async function toutEffacer() {
    if (confirm('⚠️ ATTENTION : Êtes-vous sûr de vouloir effacer TOUTES les données (tous les mois) ?')) {
        // Effacer complètement le blob
        try {
            const response = await fetch(`${API_ENDPOINT}?d=${DEFAULT_KEY}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ donneesParMois: {}, version: 'blob-1' })
            });
            
            if (response.ok) {
                vendeursData = {
                    Vincent: { rdv: 0, ventes: 0, ca: 0, marge: 0, objectif: 0 },
                    Raphael: { rdv: 0, ventes: 0, ca: 0, marge: 0, objectif: 0 },
                    Leo: { rdv: 0, ventes: 0, ca: 0, marge: 0, objectif: 0 },
                    Pablo: { rdv: 0, ventes: 0, ca: 0, marge: 0, objectif: 0 },
                    Nathan: { rdv: 0, ventes: 0, ca: 0, marge: 0, objectif: 0 }
                };
                localStorage.removeItem('dashboardData');
                mettreAJourInterface();
                alert('🗑️ Toutes les données ont été effacées');
            }
        } catch (error) {
            console.error('Erreur lors de l\'effacement:', error);
            alert('❌ Erreur lors de l\'effacement');
        }
    }
}

// 🚀 Initialisation au chargement de la page
document.addEventListener('DOMContentLoaded', async () => {
    console.log('🚀 Initialisation du dashboard avec Vercel Blob...');
    console.log('📅 Mois actuel:', currentMonth);
    
    // Charger les données
    await chargerDonnees();
    
    // Configuration des événements
    const vendeurSelect = document.getElementById('vendeurSelect');
    if (vendeurSelect) {
        vendeurSelect.addEventListener('change', chargerVendeurDansFormulaire);
    }
    
    console.log('✅ Dashboard initialisé avec votre API Blob existante');
});

// 🌐 Export des fonctions pour usage global
window.sauvegarderVendeur = sauvegarderVendeur;
window.chargerVendeurDansFormulaire = chargerVendeurDansFormulaire;
window.reinitialiserMois = reinitialiserMois;
window.toutEffacer = toutEffacer;
window.actualiserDonnees = actualiserDonnees;
