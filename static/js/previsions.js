/**
 * TCHIA Analytics - JavaScript pour la page Prévisions IA
 */

// Variables spécifiques à la page prévisions
let chartPrevisions = null;
let chartScenarios = null;
let chartRisques = null;
let chartModelRegression = null;
let chartModelArima = null;
let chartModelNeural = null;
let chartModelEnsemble = null;

// Configuration des prévisions
let horizonPrevision = 6; // mois
let zonePrevision = '';
let typeCulture = '';
let scenarioClimat = 'normal';
let vuePrevision = 'production';

// Données simulées pour les modèles
const modelesPerformance = {
    regression: { r2: 0.82, rmse: 125.4, mae: 98.2, temps: 0.3 },
    arima: { r2: 0.87, rmse: 102.1, mae: 84.5, temps: 1.2 },
    neural: { r2: 0.91, rmse: 87.3, mae: 71.2, temps: 5.8 },
    ensemble: { r2: 0.93, rmse: 76.8, mae: 62.4, temps: 8.2 }
};

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    console.log('🤖 Initialisation page Prévisions IA');
    
    // Écouter les événements de données
    document.addEventListener('donneesChargees', onDonneesChargees);
    document.addEventListener('donneesFiltrees', onDonneesFiltrees);
    
    // Initialiser les tabs
    initialiserTabs();
    
    // Si des données sont déjà disponibles
    if (donneesBrutes.length > 0) {
        analyserPrevisions();
    }
});

// Initialisation des tabs
function initialiserTabs() {
    const tabElements = document.querySelectorAll('#modelesTab button[data-bs-toggle="tab"]');
    tabElements.forEach(tab => {
        tab.addEventListener('shown.bs.tab', function (event) {
            const targetId = event.target.getAttribute('data-bs-target');
            switch(targetId) {
                case '#regression-model':
                    creerGraphiqueModelRegression();
                    break;
                case '#arima-model':
                    creerGraphiqueModelArima();
                    break;
                case '#neural-model':
                    creerGraphiqueModelNeural();
                    break;
                case '#ensemble-model':
                    creerGraphiqueModelEnsemble();
                    break;
            }
        });
    });
}

// Callback données chargées
function onDonneesChargees(event) {
    console.log('📊 Données chargées pour prévisions');
    analyserPrevisions();
}

// Callback données filtrées
function onDonneesFiltrees(event) {
    console.log('🔍 Données filtrées pour prévisions');
    analyserPrevisions();
}

// Analyse principale des prévisions
function analyserPrevisions() {
    if (!donneesFilrees || donneesFilrees.length === 0) return;
    
    // Remplir les sélecteurs
    remplirSelecteurs();
    
    // Calculer les métriques
    calculerMetriquesPrevisions();
    
    // Créer les graphiques
    creerGraphiquesPrevisions();
    
    // Analyser les risques
    analyserRisques();
    
    // Générer les recommandations
    genererRecommandationsIA();
    
    // Mettre à jour le calendrier
    mettreAJourCalendrier();
}

// Remplir les sélecteurs
function remplirSelecteurs() {
    // Zones
    const selectZone = document.getElementById('zone-prevision');
    if (selectZone) {
        const zones = [...new Set(donneesFilrees.map(row => row.zones))].sort();
        selectZone.innerHTML = '<option value="">Toutes les zones</option>';
        zones.forEach(zone => {
            const option = document.createElement('option');
            option.value = zone;
            option.textContent = zone;
            selectZone.appendChild(option);
        });
    }
}

// Calculer les métriques de prévisions
function calculerMetriquesPrevisions() {
    // Calculer la précision du modèle (simulé)
    const precision = 85 + Math.random() * 10; // Entre 85% et 95%
    document.getElementById('precision-modele').textContent = `${precision.toFixed(1)}%`;
    
    // Calculer la production prévue
    const productionActuelle = donneesFilrees.reduce((sum, row) => 
        sum + (parseFloat(row.production) || 0), 0);
    const facteurCroissance = 1.15; // +15%
    const productionPrevue = productionActuelle * facteurCroissance;
    
    document.getElementById('prevision-production').textContent = 
        TchiaUtils.formatNombre(productionPrevue, 't');
    
    // Période optimale de semis (basée sur les données historiques)
    const moisOptimal = determinerPeriodeOptimale();
    document.getElementById('periode-optimale').textContent = moisOptimal;
    
    // Niveau de risque global
    const risqueGlobal = calculerRisqueGlobal();
    document.getElementById('risque-global').textContent = risqueGlobal.niveau;
    
    // Mettre à jour les classes CSS
    const risqueElement = document.getElementById('risque-global').parentElement.parentElement;
    risqueElement.querySelector('.metric-icon').style.background = 
        risqueGlobal.niveau === 'Faible' ? 'linear-gradient(135deg, #10b981, #059669)' :
        risqueGlobal.niveau === 'Moyen' ? 'linear-gradient(135deg, #f59e0b, #d97706)' :
        'linear-gradient(135deg, #dc2626, #b91c1c)';
}

// Déterminer la période optimale
function determinerPeriodeOptimale() {
    // Analyser les meilleures performances historiques
    const performancesParMois = {};
    
    donneesFilrees.forEach(row => {
        const mois = row.saison === 'hivernage' ? 'Juin' : 'Novembre';
        const rendement = row.superficie > 0 ? row.production / row.superficie : 0;
        
        if (!performancesParMois[mois]) {
            performancesParMois[mois] = [];
        }
        performancesParMois[mois].push(rendement);
    });
    
    // Trouver le mois avec le meilleur rendement moyen
    let meilleurMois = 'Juin';
    let meilleurRendement = 0;
    
    Object.entries(performancesParMois).forEach(([mois, rendements]) => {
        const moyenneRendement = rendements.reduce((a, b) => a + b, 0) / rendements.length;
        if (moyenneRendement > meilleurRendement) {
            meilleurRendement = moyenneRendement;
            meilleurMois = mois;
        }
    });
    
    return `${meilleurMois} 2024`;
}

// Calculer le risque global
function calculerRisqueGlobal() {
    const risques = {
        climat: 60,
        rendement: 30,
        hydrique: 80,
        phyto: 45
    };
    
    const moyenneRisque = Object.values(risques).reduce((a, b) => a + b, 0) / 4;
    
    return {
        valeur: moyenneRisque,
        niveau: moyenneRisque < 40 ? 'Faible' : moyenneRisque < 60 ? 'Moyen' : 'Élevé',
        risques: risques
    };
}

// Créer les graphiques de prévisions
function creerGraphiquesPrevisions() {
    TchiaUtils.chargerDonneesGraphique('previsions', data => {
        creerGraphiquePrevisionsPrincipales(data);
    });
    
    creerGraphiqueScenarios();
    creerGraphiqueRisques();
    creerGraphiqueModelRegression();
}

// Graphique principal des prévisions
function creerGraphiquePrevisionsPrincipales(data) {
    const ctx = document.getElementById('chart-previsions');
    if (!ctx) return;
    
    if (chartPrevisions) {
        TchiaUtils.detruireGraphique(chartPrevisions);
    }
    
    // Préparer les données selon la vue
    let datasets = [];
    const anneesHistoriques = data.historique.annees;
    const anneesPrevisionnelles = data.previsions.annees;
    
    // Créer un tableau complet d'années
    const toutesAnnees = [...anneesHistoriques];
    anneesPrevisionnelles.forEach(annee => {
        if (!toutesAnnees.includes(annee)) {
            toutesAnnees.push(annee);
        }
    });
    
    // Données historiques
    const valeursHistoriques = toutesAnnees.map(annee => {
        const index = anneesHistoriques.indexOf(annee);
        return index !== -1 ? data.historique.production[index] : null;
    });
    
    // Prévisions
    const valeursPrevisions = toutesAnnees.map(annee => {
        const index = anneesPrevisionnelles.indexOf(annee);
        return index !== -1 ? data.previsions.production[index] : null;
    });
    
    // Intervalle de confiance
    const previsionMin = valeursPrevisions.map(v => v ? v * 0.9 : null);
    const previsionMax = valeursPrevisions.map(v => v ? v * 1.1 : null);
    
    datasets = [
        {
            label: 'Historique',
            data: valeursHistoriques,
            borderColor: '#2d5016',
            backgroundColor: 'rgba(45, 80, 22, 0.1)',
            borderWidth: 3,
            tension: 0.4
        },
        {
            label: 'Prévision',
            data: valeursPrevisions,
            borderColor: '#3b82f6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 3,
            borderDash: [5, 5],
            tension: 0.4
        },
        {
            label: 'Intervalle min',
            data: previsionMin,
            borderColor: 'rgba(59, 130, 246, 0.3)',
            backgroundColor: 'transparent',
            borderWidth: 1,
            borderDash: [2, 2],
            pointRadius: 0,
            fill: false
        },
        {
            label: 'Intervalle max',
            data: previsionMax,
            borderColor: 'rgba(59, 130, 246, 0.3)',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderWidth: 1,
            borderDash: [2, 2],
            pointRadius: 0,
            fill: '-1'
        }
    ];
    
    chartPrevisions = new Chart(ctx, {
        type: 'line',
        data: {
            labels: toutesAnnees,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        filter: function(item) {
                            // Masquer les intervalles dans la légende
                            return !item.text.includes('Intervalle');
                        }
                    }
                },
                annotation: {
                    annotations: {
                        line1: {
                            type: 'line',
                            xMin: anneesHistoriques.length - 0.5,
                            xMax: anneesHistoriques.length - 0.5,
                            borderColor: 'rgba(0, 0, 0, 0.3)',
                            borderWidth: 2,
                            borderDash: [5, 5]
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: false,
                    title: {
                        display: true,
                        text: vuePrevision === 'production' ? 'Production (tonnes)' :
                              vuePrevision === 'rendement' ? 'Rendement (t/ha)' :
                              'Superficie (hectares)'
                    }
                }
            }
        }
    });
}

// Graphique des scénarios
function creerGraphiqueScenarios() {
    const ctx = document.getElementById('chart-scenarios');
    if (!ctx) return;
    
    if (chartScenarios) {
        TchiaUtils.detruireGraphique(chartScenarios);
    }
    
    // Probabilités des scénarios
    const scenarios = {
        'Optimiste (+20%)': 25,
        'Normal': 50,
        'Pessimiste (-20%)': 20,
        'Critique (-40%)': 5
    };
    
    chartScenarios = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(scenarios),
            datasets: [{
                data: Object.values(scenarios),
                backgroundColor: [
                    'rgba(16, 185, 129, 0.8)',
                    'rgba(59, 130, 246, 0.8)',
                    'rgba(245, 158, 11, 0.8)',
                    'rgba(220, 38, 38, 0.8)'
                ],
                borderColor: [
                    '#10b981',
                    '#3b82f6',
                    '#f59e0b',
                    '#dc2626'
                ],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return context.label + ': ' + context.parsed + '%';
                        }
                    }
                }
            }
        }
    });
}

// Graphique des risques
function creerGraphiqueRisques() {
    const ctx = document.getElementById('chart-risques');
    if (!ctx) return;
    
    if (chartRisques) {
        TchiaUtils.detruireGraphique(chartRisques);
    }
    
    // Matrice impact/probabilité
    const risques = [
        { nom: 'Sécheresse', impact: 8, probabilite: 6, x: 6, y: 8 },
        { nom: 'Inondation', impact: 7, probabilite: 3, x: 3, y: 7 },
        { nom: 'Ravageurs', impact: 5, probabilite: 4, x: 4, y: 5 },
        { nom: 'Maladie', impact: 6, probabilite: 5, x: 5, y: 6 },
        { nom: 'Gel', impact: 4, probabilite: 2, x: 2, y: 4 },
        { nom: 'Canicule', impact: 7, probabilite: 7, x: 7, y: 7 }
    ];
    
    chartRisques = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Risques',
                data: risques,
                backgroundColor: risques.map(r => {
                    const score = r.impact * r.probabilite;
                    if (score > 40) return 'rgba(220, 38, 38, 0.8)';
                    if (score > 20) return 'rgba(245, 158, 11, 0.8)';
                    return 'rgba(16, 185, 129, 0.8)';
                }),
                borderColor: risques.map(r => {
                    const score = r.impact * r.probabilite;
                    if (score > 40) return '#dc2626';
                    if (score > 20) return '#f59e0b';
                    return '#10b981';
                }),
                borderWidth: 2,
                pointRadius: 10
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const risque = risques[context.dataIndex];
                            return `${risque.nom}: Impact ${risque.impact}/10, Probabilité ${risque.probabilite}/10`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    min: 0,
                    max: 10,
                    title: {
                        display: true,
                        text: 'Probabilité'
                    }
                },
                y: {
                    min: 0,
                    max: 10,
                    title: {
                        display: true,
                        text: 'Impact'
                    }
                }
            }
        }
    });
}

// Graphiques des modèles
function creerGraphiqueModelRegression() {
    creerGraphiqueModel('chart-model-regression', 'regression', chartModelRegression);
}

function creerGraphiqueModelArima() {
    creerGraphiqueModel('chart-model-arima', 'arima', chartModelArima);
}

function creerGraphiqueModelNeural() {
    creerGraphiqueModel('chart-model-neural', 'neural', chartModelNeural);
}

function creerGraphiqueModelEnsemble() {
    creerGraphiqueModel('chart-model-ensemble', 'ensemble', chartModelEnsemble);
}

function creerGraphiqueModel(canvasId, modelType, chartInstance) {
    const ctx = document.getElementById(canvasId);
    if (!ctx || donneesFilrees.length === 0) return;
    
    // Simuler les prédictions vs réelles
    const n = Math.min(50, donneesFilrees.length);
    const indices = Array.from({length: n}, (_, i) => i);
    const valuesReelles = indices.map(i => {
        const row = donneesFilrees[i];
        return row ? parseFloat(row.production) || 0 : 0;
    });
    
    // Ajouter du bruit selon le modèle
    const performance = modelesPerformance[modelType];
    const noise = 1 - performance.r2;
    const valuesPredites = valuesReelles.map(v => 
        v + (Math.random() - 0.5) * v * noise * 0.5
    );
    
    if (chartInstance) {
        TchiaUtils.detruireGraphique(chartInstance);
    }
    
    const newChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Prédictions vs Réelles',
                data: indices.map(i => ({
                    x: valuesReelles[i],
                    y: valuesPredites[i]
                })),
                backgroundColor: 'rgba(59, 130, 246, 0.6)',
                borderColor: '#3b82f6',
                borderWidth: 1
            }, {
                label: 'Ligne parfaite',
                data: [
                    { x: Math.min(...valuesReelles), y: Math.min(...valuesReelles) },
                    { x: Math.max(...valuesReelles), y: Math.max(...valuesReelles) }
                ],
                type: 'line',
                borderColor: '#dc2626',
                borderWidth: 2,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Valeurs réelles'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Valeurs prédites'
                    }
                }
            }
        }
    });
    
    // Stocker la référence
    switch(modelType) {
        case 'regression': chartModelRegression = newChart; break;
        case 'arima': chartModelArima = newChart; break;
        case 'neural': chartModelNeural = newChart; break;
        case 'ensemble': chartModelEnsemble = newChart; break;
    }
}

// Analyser les risques
function analyserRisques() {
    const risqueGlobal = calculerRisqueGlobal();
    
    // Mettre à jour les barres de progression
    Object.entries(risqueGlobal.risques).forEach(([type, valeur]) => {
        const progressBar = document.getElementById(`progress-risque-${type}`);
        const niveauBadge = document.getElementById(`niveau-risque-${type}`);
        
        if (progressBar) {
            progressBar.style.width = `${valeur}%`;
            
            // Changer la couleur
            progressBar.className = 'progress-bar';
            if (valeur > 70) {
                progressBar.classList.add('bg-danger');
            } else if (valeur > 40) {
                progressBar.classList.add('bg-warning');
            } else {
                progressBar.classList.add('bg-success');
            }
        }
        
        if (niveauBadge) {
            const niveau = valeur > 70 ? 'Élevé' : valeur > 40 ? 'Moyen' : 'Faible';
            niveauBadge.textContent = niveau;
            niveauBadge.className = 'badge';
            niveauBadge.classList.add(
                valeur > 70 ? 'bg-danger' : valeur > 40 ? 'bg-warning' : 'bg-success'
            );
        }
    });
    
    // Générer les stratégies de mitigation
    genererStrategiesMitigation(risqueGlobal);
}

// Générer les stratégies de mitigation
function genererStrategiesMitigation(risqueGlobal) {
    const container = document.getElementById('strategies-mitigation');
    if (!container) return;
    
    const strategies = [];
    
    if (risqueGlobal.risques.hydrique > 70) {
        strategies.push({
            type: 'warning',
            icon: 'lightbulb',
            titre: 'Risque hydrique élevé',
            message: 'Recommandation d\'installation de systèmes d\'irrigation goutte-à-goutte dans les zones critiques'
        });
    }
    
    if (risqueGlobal.risques.climat > 60) {
        strategies.push({
            type: 'info',
            icon: 'shield-check',
            titre: 'Protection climatique',
            message: 'Utilisation de variétés résistantes à la sécheresse pour la prochaine saison'
        });
    }
    
    if (risqueGlobal.risques.phyto > 40) {
        strategies.push({
            type: 'success',
            icon: 'bug',
            titre: 'Prévention phytosanitaire',
            message: 'Mise en place d\'un programme de surveillance des ravageurs avec alertes précoces'
        });
    }
    
    container.innerHTML = strategies.map(s => `
        <div class="alert alert-${s.type}">
            <i class="bi bi-${s.icon} me-2"></i>
            <strong>${s.titre}:</strong> ${s.message}
        </div>
    `).join('');
}

// Générer les recommandations IA
function genererRecommandationsIA() {
    // Les recommandations sont déjà dans le HTML statique de l'accordéon
    // Ici on pourrait les mettre à jour dynamiquement si nécessaire
}

// Mettre à jour le calendrier
function mettreAJourCalendrier() {
    // Le calendrier est déjà dans le HTML
    // Ici on pourrait le mettre à jour selon les prévisions
}

// Fonctions d'interface
window.updatePrevisions = function() {
    horizonPrevision = parseInt(document.getElementById('horizon-prevision').value);
    zonePrevision = document.getElementById('zone-prevision').value;
    typeCulture = document.getElementById('type-culture-prevision').value;
    scenarioClimat = document.getElementById('scenario-climat').value;
    
    // Recharger les analyses
    analyserPrevisions();
};

window.changerVuePrevision = function(vue) {
    vuePrevision = vue;
    
    // Mettre à jour les boutons
    const buttons = event.target.parentElement.querySelectorAll('button');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Recharger le graphique
    TchiaUtils.chargerDonneesGraphique('previsions', data => {
        creerGraphiquePrevisionsPrincipales(data);
    });
};

window.afficherCalendrierComplet = function() {
    const modal = new bootstrap.Modal(document.getElementById('calendrierModal'));
    
    // Générer le contenu du calendrier
    const calendrierContainer = document.getElementById('calendrier-complet');
    const mois = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    
    const activites = {
        'Mai': [
            { periode: '1-15', activite: 'Préparation des sols', type: 'preparation' },
            { periode: '15-31', activite: 'Achat semences et intrants', type: 'approvisionnement' }
        ],
        'Juin': [
            { periode: '1-10', activite: 'Dernière préparation', type: 'preparation' },
            { periode: '10-20', activite: 'Semis (période optimale)', type: 'semis' },
            { periode: '20-30', activite: 'Irrigation initiale', type: 'irrigation' }
        ],
        'Juillet': [
            { periode: '1-15', activite: 'Désherbage', type: 'entretien' },
            { periode: '15-31', activite: 'Application engrais', type: 'fertilisation' }
        ],
        'Août': [
            { periode: '1-31', activite: 'Surveillance phytosanitaire', type: 'surveillance' }
        ],
        'Septembre': [
            { periode: '1-30', activite: 'Irrigation d\'appoint', type: 'irrigation' }
        ],
        'Octobre': [
            { periode: '1-15', activite: 'Préparation récolte', type: 'preparation' },
            { periode: '15-31', activite: 'Début récolte', type: 'recolte' }
        ],
        'Novembre': [
            { periode: '1-30', activite: 'Récolte principale', type: 'recolte' }
        ]
    };
    
    let html = '<div class="row">';
    mois.forEach((moisNom, index) => {
        const moisActivites = activites[moisNom] || [];
        
        html += `
            <div class="col-md-4 mb-4">
                <div class="card">
                    <div class="card-header bg-primary text-white">
                        <h6 class="mb-0">${moisNom} 2024</h6>
                    </div>
                    <div class="card-body p-2">
        `;
        
        if (moisActivites.length > 0) {
            moisActivites.forEach(act => {
                const bgClass = act.type === 'semis' ? 'bg-success' :
                               act.type === 'recolte' ? 'bg-warning' :
                               act.type === 'irrigation' ? 'bg-info' :
                               'bg-light';
                
                html += `
                    <div class="mb-2 p-2 rounded ${bgClass} ${bgClass.includes('light') ? '' : 'bg-opacity-10'}">
                        <small class="text-muted d-block">${act.periode} ${moisNom}</small>
                        <div class="${bgClass.includes('light') ? '' : 'text-' + bgClass.replace('bg-', '')}">
                            ${act.activite}
                        </div>
                    </div>
                `;
            });
        } else {
            html += '<p class="text-muted small mb-0">Pas d\'activité majeure</p>';
        }
        
        html += `
                    </div>
                </div>
            </div>
        `;
        
        if ((index + 1) % 3 === 0) {
            html += '</div><div class="row">';
        }
    });
    html += '</div>';
    
    calendrierContainer.innerHTML = html;
    modal.show();
};

window.imprimerCalendrier = function() {
    window.print();
};

window.exporterPrevisions = function(format) {
    TchiaUtils.showNotification('info', `Export ${format.toUpperCase()} des prévisions (fonctionnalité en développement)`);
};

window.configurerAlertes = function() {
    TchiaUtils.showNotification('info', 'Configuration des alertes (fonctionnalité en développement)');
};

window.testerAlerte = function() {
    TchiaUtils.showNotification('success', 'Test d\'alerte: Conditions favorables pour les semis détectées!');
};

window.partagerAnalyse = function() {
    if (navigator.share) {
        navigator.share({
            title: 'Prévisions TCHIA Analytics',
            text: 'Consultez les prévisions agricoles basées sur l\'IA',
            url: window.location.href
        });
    } else {
        TchiaUtils.showNotification('info', 'Fonction de partage (fonctionnalité en développement)');
    }
};

window.genererLien = function() {
    const link = window.location.href + '?share=' + Date.now();
    navigator.clipboard.writeText(link).then(() => {
        TchiaUtils.showNotification('success', 'Lien copié dans le presse-papiers!');
    });
};

// Redimensionnement des graphiques
window.addEventListener('resize', function() {
    if (chartPrevisions) chartPrevisions.resize();
    if (chartScenarios) chartScenarios.resize();
    if (chartRisques) chartRisques.resize();
    if (chartModelRegression) chartModelRegression.resize();
    if (chartModelArima) chartModelArima.resize();
    if (chartModelNeural) chartModelNeural.resize();
    if (chartModelEnsemble) chartModelEnsemble.resize();
});