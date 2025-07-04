/**
 * TCHIA Analytics - JavaScript Principal
 * Fonctions communes à toutes les pages
 */

// Variables globales
let donneesBrutes = [];
let donneesFilrees = [];
let chartsInstances = {};

// Configuration AJAX pour Django
function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

// Configuration des requêtes AJAX
const ajaxConfig = {
    headers: {
        'X-CSRFToken': getCookie('csrftoken')
    }
};

// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 TCHIA Analytics - Initialisation');
    
    // Initialiser AOS
    initializeAOS();
    
    // Initialiser la navigation
    initialiserNavigation();
    
    // Initialiser le thème
    initialiserTheme();
    
    // Initialiser la recherche globale
    initialiserRechercheGlobale();
    
    // Vérifier si des données sont déjà chargées
    verifierDonneesSession();
});

// Initialisation AOS avec fallback
function initializeAOS() {
    if (typeof AOS !== 'undefined') {
        try {
            AOS.init({
                duration: 600,
                easing: 'ease-out-cubic',
                once: true,
                offset: 100,
                delay: 0
            });
            console.log('✅ AOS initialisé');
        } catch (error) {
            console.error('❌ Erreur AOS:', error);
            enableFallbackAnimations();
        }
    } else {
        console.log('⚠️ AOS non disponible, activation du fallback');
        enableFallbackAnimations();
    }
}

// Animations de fallback
function enableFallbackAnimations() {
    document.querySelectorAll('[data-aos]').forEach(el => {
        el.removeAttribute('data-aos');
        el.removeAttribute('data-aos-delay');
        el.classList.add('fallback-animate');
    });

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            }
        });
    }, { threshold: 0.1 });

    document.querySelectorAll('.fallback-animate').forEach(el => {
        observer.observe(el);
    });
}

// Navigation et sidebar
function initialiserNavigation() {
    const toggleBtn = document.getElementById('toggleSidebar');
    const sidebar = document.getElementById('sidebar');

    if (toggleBtn) {
        toggleBtn.addEventListener('click', function() {
            sidebar.classList.toggle('show');
        });
    }

    // Fermer la sidebar sur mobile lors d'un clic sur un lien
    if (window.innerWidth <= 768) {
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', function() {
                sidebar.classList.remove('show');
            });
        });
    }
}

// Gestion du thème
function initialiserTheme() {
    const themeToggle = document.getElementById('themeToggle');
    const savedTheme = localStorage.getItem('tchiaTheme');
    
    if (savedTheme === 'dark') {
        document.body.classList.add('theme-dark');
        updateThemeIcon(true);
    }
    
    themeToggle.addEventListener('click', function() {
        const isDark = document.body.classList.toggle('theme-dark');
        localStorage.setItem('tchiaTheme', isDark ? 'dark' : 'light');
        updateThemeIcon(isDark);
    });
}

function updateThemeIcon(isDark) {
    const icon = document.querySelector('#themeToggle i');
    icon.classList.toggle('bi-moon', !isDark);
    icon.classList.toggle('bi-sun', isDark);
}

// Recherche globale
function initialiserRechercheGlobale() {
    const searchInput = document.getElementById('globalSearch');
    let searchTimeout;
    
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            clearTimeout(searchTimeout);
            const terme = e.target.value.toLowerCase();
            
            if (terme.length > 2) {
                searchTimeout = setTimeout(() => {
                    effectuerRecherche(terme);
                }, 500);
            }
        });
    }
}

function effectuerRecherche(terme) {
    if (donneesBrutes.length > 0) {
        const resultats = donneesBrutes.filter(row => 
            Object.values(row).some(val => 
                val && val.toString().toLowerCase().includes(terme)
            )
        );
        console.log(`🔍 ${resultats.length} résultats pour "${terme}"`);
        // TODO: Afficher les résultats dans une dropdown
    }
}

// Gestion des fichiers CSV
function setupFileUpload(fileInputId, callback) {
    const fileInput = document.getElementById(fileInputId || 'globalFileInput');
    
    if (fileInput) {
        fileInput.addEventListener('change', function(e) {
            const file = e.target.files[0];
            if (file) {
                uploadCSV(file, callback);
            }
        });
    }
}

function uploadCSV(file, callback) {
    if (!file.name.endsWith('.csv')) {
        showNotification('error', 'Veuillez sélectionner un fichier CSV valide');
        return;
    }
    
    const formData = new FormData();
    formData.append('file', file);
    
    showLoader('Chargement du fichier...');
    
    fetch(window.DJANGO_CONFIG.uploadUrl, {
        method: 'POST',
        body: formData,
        headers: {
            'X-CSRFToken': getCookie('csrftoken')
        }
    })
    .then(response => response.json())
    .then(data => {
        hideLoader();
        
        if (data.success) {
            showNotification('success', `${data.rows} lignes chargées avec succès`);
            donneesBrutes = data.preview; // Pour un aperçu rapide
            
            // Charger toutes les données
            chargerDonneesCompletes();
            
            if (callback) callback(data);
        } else {
            showNotification('error', data.error || 'Erreur lors du chargement');
        }
    })
    .catch(error => {
        hideLoader();
        console.error('Erreur upload:', error);
        showNotification('error', 'Erreur lors du chargement du fichier');
    });
}

// Chargement des données complètes
function chargerDonneesCompletes() {
    fetch(window.DJANGO_CONFIG.filterUrl, {
        method: 'GET',
        headers: ajaxConfig.headers
    })
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            donneesBrutes = data.data;
            donneesFilrees = [...donneesBrutes];
            
            // Initialiser les filtres
            initialiserFiltres();
            
            // Mettre à jour les métriques
            mettreAJourMetriques(data.metrics);
            
            // Déclencher un événement pour notifier les pages
            document.dispatchEvent(new CustomEvent('donneesChargees', { 
                detail: { donnees: donneesBrutes } 
            }));
        }
    })
    .catch(error => {
        console.error('Erreur chargement données:', error);
    });
}

// Vérifier la session
function verifierDonneesSession() {
    fetch(window.DJANGO_CONFIG.filterUrl, {
        method: 'GET',
        headers: ajaxConfig.headers
    })
    .then(response => response.json())
    .then(data => {
        if (data.success && data.count > 0) {
            donneesBrutes = data.data;
            donneesFilrees = [...donneesBrutes];
            initialiserFiltres();
            mettreAJourMetriques(data.metrics);
            
            document.dispatchEvent(new CustomEvent('donneesChargees', { 
                detail: { donnees: donneesBrutes } 
            }));
        }
    })
    .catch(error => {
        console.log('Pas de données en session');
    });
}

// Filtres
function initialiserFiltres() {
    // Filtrer les années
    const annees = [...new Set(donneesBrutes.map(row => row.annee))].sort();
    remplirSelect('filter-annee', annees, 'Toutes les années');
    
    // Filtrer les zones
    const zones = [...new Set(donneesBrutes.map(row => row.zones))].sort();
    remplirSelect('filter-zone', zones, 'Toutes les zones');
}

function remplirSelect(selectId, options, defaultText) {
    const select = document.getElementById(selectId);
    if (!select) return;
    
    select.innerHTML = `<option value="">${defaultText}</option>`;
    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option;
        optionElement.textContent = option;
        select.appendChild(optionElement);
    });
}

// Application des filtres (fonction globale)
window.appliquerFiltres = function() {
    const filters = {
        annee: document.getElementById('filter-annee')?.value,
        saison: document.getElementById('filter-saison')?.value,
        zone: document.getElementById('filter-zone')?.value,
        type: document.getElementById('filter-type')?.value
    };
    
    // Supprimer les filtres vides
    Object.keys(filters).forEach(key => {
        if (!filters[key]) delete filters[key];
    });
    
    showLoader('Application des filtres...');
    
    const params = new URLSearchParams(filters);
    
    fetch(`${window.DJANGO_CONFIG.filterUrl}?${params}`, {
        method: 'GET',
        headers: ajaxConfig.headers
    })
    .then(response => response.json())
    .then(data => {
        hideLoader();
        
        if (data.success) {
            donneesFilrees = data.data;
            mettreAJourMetriques(data.metrics);
            
            // Déclencher un événement pour notifier les pages
            document.dispatchEvent(new CustomEvent('donneesFiltrees', { 
                detail: { donnees: donneesFilrees, metrics: data.metrics } 
            }));
        }
    })
    .catch(error => {
        hideLoader();
        console.error('Erreur filtrage:', error);
        showNotification('error', 'Erreur lors du filtrage des données');
    });
};

// Mise à jour des métriques
function mettreAJourMetriques(metrics) {
    if (!metrics) return;
    
    // Métriques principales
    updateMetric('total-production', metrics.production_totale, 't');
    updateMetric('total-superficie', metrics.superficie_totale, 'ha');
    updateMetric('rendement-moyen', metrics.rendement_moyen, 't/ha');
    updateMetric('temperature-moyenne', metrics.temperature_moyenne, '°C');
    
    // Métriques météo
    updateMetric('precip-totale', metrics.precipitation_moyenne, 'mm');
}

function updateMetric(elementId, value, unit) {
    const element = document.getElementById(elementId);
    if (element && value !== undefined) {
        element.textContent = formatNombre(value, unit);
    }
}

// Export des données
window.exporterCSV = function() {
    const filters = {
        annee: document.getElementById('filter-annee')?.value,
        saison: document.getElementById('filter-saison')?.value,
        zone: document.getElementById('filter-zone')?.value
    };
    
    const params = new URLSearchParams(filters);
    window.location.href = `${window.DJANGO_CONFIG.exportUrl}?${params}`;
};

// Chargement des données pour les graphiques
function chargerDonneesGraphique(chartType, callback) {
    const url = window.DJANGO_CONFIG.chartDataUrl.replace('{chartType}', chartType);
    
    fetch(url, {
        method: 'GET',
        headers: ajaxConfig.headers
    })
    .then(response => response.json())
    .then(data => {
        if (callback) callback(data);
    })
    .catch(error => {
        console.error(`Erreur chargement graphique ${chartType}:`, error);
    });
}

// Fonctions utilitaires
function formatNombre(nombre, unite = '') {
    if (nombre === null || nombre === undefined || isNaN(nombre)) {
        return '--';
    }
    
    let valeur = nombre;
    let suffixe = '';
    
    if (valeur >= 1000000) {
        valeur = valeur / 1000000;
        suffixe = 'M';
    } else if (valeur >= 1000) {
        valeur = valeur / 1000;
        suffixe = 'k';
    }
    
    return `${valeur.toFixed(1)}${suffixe} ${unite}`.trim();
}

// Gestion des statuts
window.getStatutClasse = function(rendement) {
    if (rendement > 5) return 'status-success';
    if (rendement > 3) return 'status-warning';
    return 'status-danger';
};

window.getStatutTexte = function(rendement) {
    if (rendement > 5) return 'Excellent';
    if (rendement > 3) return 'Bon';
    return 'À améliorer';
};

// Notifications
function showNotification(type, message) {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type === 'error' ? 'danger' : type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
    `;
    
    const container = document.querySelector('.content-area');
    container.insertBefore(alertDiv, container.firstChild);
    
    // Auto-dismiss après 5 secondes
    setTimeout(() => {
        alertDiv.remove();
    }, 5000);
}

// Loader
function showLoader(message = 'Chargement...') {
    const loader = document.createElement('div');
    loader.id = 'globalLoader';
    loader.className = 'position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center';
    loader.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    loader.style.zIndex = '9999';
    loader.innerHTML = `
        <div class="bg-white p-4 rounded-3 text-center">
            <div class="loading-spinner mb-3"></div>
            <p class="mb-0">${message}</p>
        </div>
    `;
    document.body.appendChild(loader);
}

function hideLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) loader.remove();
}

// Gestion des graphiques
function detruireGraphique(chartInstance) {
    if (chartInstance && typeof chartInstance.destroy === 'function') {
        chartInstance.destroy();
    }
}

// Options par défaut pour les graphiques
const defaultChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'top',
            labels: {
                color: '#1e293b',
                font: {
                    weight: 600
                },
                usePointStyle: true,
                padding: 20
            }
        }
    },
    scales: {
        y: {
            grid: {
                color: 'rgba(148, 163, 184, 0.2)'
            },
            ticks: {
                color: '#64748b',
                font: {
                    weight: 500
                }
            }
        },
        x: {
            grid: {
                color: 'rgba(148, 163, 184, 0.2)'
            },
            ticks: {
                color: '#64748b',
                font: {
                    weight: 500
                }
            }
        }
    }
};

// Export des fonctions pour utilisation dans d'autres fichiers
window.TchiaUtils = {
    formatNombre,
    showNotification,
    showLoader,
    hideLoader,
    chargerDonneesGraphique,
    detruireGraphique,
    defaultChartOptions,
    uploadCSV,
    setupFileUpload
};