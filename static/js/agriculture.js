/**
 * TCHIA Analytics - JavaScript pour la page Agriculture
 */

// Variables spécifiques à la page agriculture
let chartSuperficies = null;
let chartRendements = null;
let chartEvolutionTemporelle = null;
let chartDistributionSpatiale = null;
let chartSaisonnalite = null;
let chartEfficacite = null;

// Configuration des graphiques
let currentSuperficiesType = 'bar';
let currentRendementsTri = 'zone';

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    console.log('🌾 Initialisation page Agriculture');
    
    // Configuration du sélecteur de fichier
    TchiaUtils.setupFileUpload('file-agriculture', onFileUploaded);
    
    // Écouter les événements de données
    document.addEventListener('donneesChargees', onDonneesChargees);
    document.addEventListener('donneesFiltrees', onDonneesFiltrees);
    
    // Initialiser les tabs
    initialiserTabs();
    
    // Si des données sont déjà disponibles
    if (donneesBrutes.length > 0) {
        analyserDonneesAgricoles();
    }
});

// Initialisation des tabs
function initialiserTabs() {
    const tabElements = document.querySelectorAll('#analyseTab button[data-bs-toggle="tab"]');
    tabElements.forEach(tab => {
        tab.addEventListener('shown.bs.tab', function (event) {
            const targetId = event.target.getAttribute('data-bs-target');
            switch(targetId) {
                case '#evolution-content':
                    creerGraphiqueEvolutionTemporelle();
                    break;
                case '#distribution-content':
                    creerGraphiqueDistributionSpatiale();
                    break;
                case '#saisonnalite-content':
                    creerGraphiqueSaisonnalite();
                    break;
                case '#efficacite-content':
                    creerGraphiqueEfficacite();
                    break;
            }
        });
    });
}

// Callback après upload
function onFileUploaded(data) {
    console.log('✅ Fichier chargé pour agriculture');
}

// Callback données chargées
function onDonneesChargees(event) {
    console.log('📊 Données chargées dans agriculture');
    analyserDonneesAgricoles();
}

// Callback données filtrées
function onDonneesFiltrees(event) {
    console.log('🔍 Données filtrées dans agriculture');
    analyserDonneesAgricoles();
}

// Analyse principale des données agricoles
function analyserDonneesAgricoles() {
    if (!donneesFilrees || donneesFilrees.length === 0) return;
    
    // Calculer les métriques
    calculerMetriquesAgricoles();
    
    // Créer les graphiques principaux
    creerGraphiques();
    
    // Mettre à jour le tableau
    mettreAJourTableauAgricole();
    
    // Générer les recommandations
    genererRecommandations();
}

// Calcul des métriques agricoles
function calculerMetriquesAgricoles() {
    // Grouper par année pour calculer la croissance
    const productionParAnnee = {};
    const superficieParAnnee = {};
    
    donneesFilrees.forEach(row => {
        const annee = row.annee;
        if (!productionParAnnee[annee]) {
            productionParAnnee[annee] = 0;
            superficieParAnnee[annee] = 0;
        }
        productionParAnnee[annee] += parseFloat(row.production) || 0;
        superficieParAnnee[annee] += parseFloat(row.superficie) || 0;
    });
    
    const annees = Object.keys(productionParAnnee).sort();
    
    // Croissance de la production (moyenne sur 5 ans)
    let croissanceProduction = 0;
    if (annees.length >= 2) {
        const derniereAnnee = productionParAnnee[annees[annees.length - 1]];
        const anneeDebut = productionParAnnee[annees[Math.max(0, annees.length - 5)]];
        const nbAnnees = Math.min(5, annees.length - 1);
        croissanceProduction = ((derniereAnnee - anneeDebut) / anneeDebut * 100 / nbAnnees).toFixed(1);
    }
    
    // Expansion superficie
    let expansionSuperficie = 0;
    if (annees.length >= 2) {
        const derniereAnnee = superficieParAnnee[annees[annees.length - 1]];
        const anneePrec = superficieParAnnee[annees[annees.length - 2]];
        expansionSuperficie = derniereAnnee - anneePrec;
    }
    
    // Meilleur rendement par zone
    const rendementParZone = {};
    donneesFilrees.forEach(row => {
        if (!rendementParZone[row.zones]) {
            rendementParZone[row.zones] = { production: 0, superficie: 0 };
        }
        rendementParZone[row.zones].production += parseFloat(row.production) || 0;
        rendementParZone[row.zones].superficie += parseFloat(row.superficie) || 0;
    });
    
    let meilleurRendement = 0;
    let zoneMeilleurRendement = '';
    Object.entries(rendementParZone).forEach(([zone, data]) => {
        const rendement = data.superficie > 0 ? data.production / data.superficie : 0;
        if (rendement > meilleurRendement) {
            meilleurRendement = rendement;
            zoneMeilleurRendement = zone;
        }
    });
    
    // Efficacité globale (score sur 100)
    const rendementMoyen = Object.values(rendementParZone).reduce((sum, data) => {
        return sum + (data.superficie > 0 ? data.production / data.superficie : 0);
    }, 0) / Object.keys(rendementParZone).length;
    
    const efficaciteGlobale = Math.min(100, (rendementMoyen / 6) * 100); // 6 t/ha comme référence excellente
    
    // Mettre à jour l'affichage
    document.getElementById('croissance-production').textContent = `${croissanceProduction > 0 ? '+' : ''}${croissanceProduction}%`;
    document.getElementById('expansion-superficie').textContent = TchiaUtils.formatNombre(expansionSuperficie, 'ha');
    document.getElementById('meilleur-rendement').textContent = TchiaUtils.formatNombre(meilleurRendement, 't/ha');
    document.getElementById('zone-meilleur-rendement').textContent = zoneMeilleurRendement;
    document.getElementById('efficacite-globale').textContent = `${efficaciteGlobale.toFixed(0)}%`;
    
    // Mettre à jour les classes CSS pour les changements
    const croissanceElement = document.querySelector('#croissance-production').parentElement.parentElement.querySelector('.metric-change');
    if (croissanceProduction > 0) {
        croissanceElement.classList.add('change-positive');
        croissanceElement.classList.remove('change-negative');
    } else {
        croissanceElement.classList.add('change-negative');
        croissanceElement.classList.remove('change-positive');
    }
}

// Création des graphiques principaux
function creerGraphiques() {
    TchiaUtils.chargerDonneesGraphique('superficies', data => creerGraphiqueSuperficies(data));
    TchiaUtils.chargerDonneesGraphique('rendements', data => creerGraphiqueRendements(data));
    
    // Créer le premier graphique de l'onglet actif
    const activeTab = document.querySelector('#analyseTab .nav-link.active');
    if (activeTab && activeTab.id === 'evolution-tab') {
        creerGraphiqueEvolutionTemporelle();
    }
}

// Graphique des superficies
function creerGraphiqueSuperficies(data) {
    const ctx = document.getElementById('chart-superficies');
    if (!ctx) return;
    
    if (chartSuperficies) {
        TchiaUtils.detruireGraphique(chartSuperficies);
    }
    
    const config = {
        type: currentSuperficiesType,
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Superficie (ha)',
                data: data.data,
                backgroundColor: currentSuperficiesType === 'bar' ? 'rgba(45, 80, 22, 0.8)' : 'rgba(45, 80, 22, 0.1)',
                borderColor: '#2d5016',
                borderWidth: currentSuperficiesType === 'bar' ? 2 : 3,
                borderRadius: currentSuperficiesType === 'bar' ? 8 : 0,
                tension: currentSuperficiesType === 'line' ? 0.4 : 0,
                fill: currentSuperficiesType === 'line',
                pointBackgroundColor: '#2d5016',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: currentSuperficiesType === 'line' ? 6 : 0
            }]
        },
        options: {
            ...TchiaUtils.defaultChartOptions,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Superficie (hectares)'
                    }
                }
            }
        }
    };
    
    chartSuperficies = new Chart(ctx, config);
}

// Graphique des rendements
function creerGraphiqueRendements(data) {
    const ctx = document.getElementById('chart-rendements');
    if (!ctx) return;
    
    if (chartRendements) {
        TchiaUtils.detruireGraphique(chartRendements);
    }
    
    // Trier les données si nécessaire
    let labels = [...data.labels];
    let values = [...data.data];
    
    if (currentRendementsTri === 'valeur') {
        // Créer un tableau d'indices et trier
        const indices = Array.from({length: labels.length}, (_, i) => i);
        indices.sort((a, b) => values[b] - values[a]);
        
        // Réorganiser les tableaux
        labels = indices.map(i => labels[i]);
        values = indices.map(i => values[i]);
    }
    
    chartRendements = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Rendement (t/ha)',
                data: values,
                backgroundColor: values.map(v => {
                    if (v > 5) return 'rgba(74, 124, 89, 0.8)';
                    if (v > 3) return 'rgba(217, 119, 6, 0.8)';
                    return 'rgba(220, 38, 38, 0.8)';
                }),
                borderColor: values.map(v => {
                    if (v > 5) return '#4a7c59';
                    if (v > 3) return '#d97706';
                    return '#dc2626';
                }),
                borderWidth: 2
            }]
        },
        options: {
            ...TchiaUtils.defaultChartOptions,
            indexAxis: 'y',
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed.x;
                            const status = value > 5 ? 'Excellent' : value > 3 ? 'Bon' : 'À améliorer';
                            return `${context.label}: ${value.toFixed(2)} t/ha (${status})`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Rendement (tonnes/hectare)'
                    }
                }
            }
        }
    });
}

// Graphiques des onglets
function creerGraphiqueEvolutionTemporelle() {
    const ctx = document.getElementById('chart-evolution-temporelle');
    if (!ctx || donneesFilrees.length === 0) return;
    
    // Préparer les données par année et type
    const evolutionData = {};
    donneesFilrees.forEach(row => {
        const key = `${row.annee}-${row.saison}`;
        if (!evolutionData[key]) {
            evolutionData[key] = {
                production: 0,
                superficie: 0,
                count: 0
            };
        }
        evolutionData[key].production += parseFloat(row.production) || 0;
        evolutionData[key].superficie += parseFloat(row.superficie) || 0;
        evolutionData[key].count++;
    });
    
    const labels = Object.keys(evolutionData).sort();
    const productions = labels.map(l => evolutionData[l].production);
    const rendements = labels.map(l => 
        evolutionData[l].superficie > 0 ? evolutionData[l].production / evolutionData[l].superficie : 0
    );
    
    if (chartEvolutionTemporelle) {
        TchiaUtils.detruireGraphique(chartEvolutionTemporelle);
    }
    
    chartEvolutionTemporelle = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Production (t)',
                data: productions,
                borderColor: '#2d5016',
                backgroundColor: 'rgba(45, 80, 22, 0.1)',
                yAxisID: 'y',
                tension: 0.4,
                borderWidth: 3
            }, {
                label: 'Rendement moyen (t/ha)',
                data: rendements,
                borderColor: '#d97706',
                backgroundColor: 'rgba(217, 119, 6, 0.1)',
                yAxisID: 'y1',
                tension: 0.4,
                borderWidth: 3
            }]
        },
        options: {
            ...TchiaUtils.defaultChartOptions,
            maintainAspectRatio: false,
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Production (tonnes)'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Rendement (t/ha)'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}

function creerGraphiqueDistributionSpatiale() {
    const ctx = document.getElementById('chart-distribution-spatiale');
    if (!ctx || donneesFilrees.length === 0) return;
    
    // Préparer les données par zone
    const zoneData = {};
    donneesFilrees.forEach(row => {
        if (!zoneData[row.zones]) {
            zoneData[row.zones] = {
                casiers: { production: 0, superficie: 0 },
                hors_casiers: { production: 0, superficie: 0 }
            };
        }
        const type = row.type || 'casiers';
        zoneData[row.zones][type].production += parseFloat(row.production) || 0;
        zoneData[row.zones][type].superficie += parseFloat(row.superficie) || 0;
    });
    
    const zones = Object.keys(zoneData);
    const casiers = zones.map(z => zoneData[z].casiers.production);
    const horsCasiers = zones.map(z => zoneData[z].hors_casiers.production);
    
    if (chartDistributionSpatiale) {
        TchiaUtils.detruireGraphique(chartDistributionSpatiale);
    }
    
    chartDistributionSpatiale = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: zones,
            datasets: [{
                label: 'Casiers',
                data: casiers,
                backgroundColor: 'rgba(45, 80, 22, 0.8)',
                borderColor: '#2d5016',
                borderWidth: 2
            }, {
                label: 'Hors casiers',
                data: horsCasiers,
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderColor: '#3b82f6',
                borderWidth: 2
            }]
        },
        options: {
            ...TchiaUtils.defaultChartOptions,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true
                },
                y: {
                    stacked: true,
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'Production (tonnes)'
                    }
                }
            }
        }
    });
}

function creerGraphiqueSaisonnalite() {
    const ctx = document.getElementById('chart-saisonnalite');
    if (!ctx || donneesFilrees.length === 0) return;
    
    // Analyser par saison
    const saisonData = {
        hivernage: { production: 0, superficie: 0, count: 0 },
        contre_saison: { production: 0, superficie: 0, count: 0 }
    };
    
    donneesFilrees.forEach(row => {
        const saison = row.saison;
        if (saisonData[saison]) {
            saisonData[saison].production += parseFloat(row.production) || 0;
            saisonData[saison].superficie += parseFloat(row.superficie) || 0;
            saisonData[saison].count++;
        }
    });
    
    const data = {
        labels: ['Production totale', 'Superficie totale', 'Rendement moyen', 'Nombre de zones'],
        datasets: [{
            label: 'Hivernage',
            data: [
                saisonData.hivernage.production,
                saisonData.hivernage.superficie,
                saisonData.hivernage.superficie > 0 ? saisonData.hivernage.production / saisonData.hivernage.superficie : 0,
                saisonData.hivernage.count
            ],
            backgroundColor: 'rgba(45, 80, 22, 0.8)',
            borderColor: '#2d5016',
            borderWidth: 2
        }, {
            label: 'Contre-saison',
            data: [
                saisonData.contre_saison.production,
                saisonData.contre_saison.superficie,
                saisonData.contre_saison.superficie > 0 ? saisonData.contre_saison.production / saisonData.contre_saison.superficie : 0,
                saisonData.contre_saison.count
            ],
            backgroundColor: 'rgba(59, 130, 246, 0.8)',
            borderColor: '#3b82f6',
            borderWidth: 2
        }]
    };
    
    if (chartSaisonnalite) {
        TchiaUtils.detruireGraphique(chartSaisonnalite);
    }
    
    chartSaisonnalite = new Chart(ctx, {
        type: 'radar',
        data: data,
        options: {
            ...TchiaUtils.defaultChartOptions,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(148, 163, 184, 0.2)'
                    }
                }
            }
        }
    });
}

function creerGraphiqueEfficacite() {
    const ctx = document.getElementById('chart-efficacite');
    if (!ctx || donneesFilrees.length === 0) return;
    
    // Calculer l'efficacité par zone (ratio production/superficie normalisé)
    const efficaciteData = {};
    donneesFilrees.forEach(row => {
        if (!efficaciteData[row.zones]) {
            efficaciteData[row.zones] = { production: 0, superficie: 0 };
        }
        efficaciteData[row.zones].production += parseFloat(row.production) || 0;
        efficaciteData[row.zones].superficie += parseFloat(row.superficie) || 0;
    });
    
    const zones = Object.keys(efficaciteData);
    const efficacites = zones.map(z => {
        const rendement = efficaciteData[z].superficie > 0 ? 
            efficaciteData[z].production / efficaciteData[z].superficie : 0;
        return (rendement / 6) * 100; // 6 t/ha comme référence
    });
    
    // Trier par efficacité
    const sorted = zones.map((z, i) => ({ zone: z, efficacite: efficacites[i] }))
        .sort((a, b) => b.efficacite - a.efficacite);
    
    if (chartEfficacite) {
        TchiaUtils.detruireGraphique(chartEfficacite);
    }
    
    chartEfficacite = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: sorted.map(s => s.zone),
            datasets: [{
                label: 'Score d\'efficacité (%)',
                data: sorted.map(s => s.efficacite),
                backgroundColor: sorted.map(s => {
                    if (s.efficacite > 80) return 'rgba(74, 124, 89, 0.8)';
                    if (s.efficacite > 50) return 'rgba(217, 119, 6, 0.8)';
                    return 'rgba(220, 38, 38, 0.8)';
                }),
                borderColor: sorted.map(s => {
                    if (s.efficacite > 80) return '#4a7c59';
                    if (s.efficacite > 50) return '#d97706';
                    return '#dc2626';
                }),
                borderWidth: 2,
                borderRadius: 8
            }]
        },
        options: {
            ...TchiaUtils.defaultChartOptions,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100,
                    title: {
                        display: true,
                        text: 'Score d\'efficacité (%)'
                    }
                }
            }
        }
    });
}

// Mise à jour du tableau
function mettreAJourTableauAgricole() {
    const tbody = document.getElementById('agriculture-tbody');
    if (!tbody || donneesFilrees.length === 0) return;
    
    tbody.innerHTML = '';
    
    // Préparer les données avec calcul de rang et variation
    const donneesPourTableau = donneesFilrees.map(row => {
        const rendement = row.superficie > 0 ? row.production / row.superficie : 0;
        return {
            ...row,
            rendement: rendement
        };
    });
    
    // Trier par rendement pour calculer le rang
    donneesPourTableau.sort((a, b) => b.rendement - a.rendement);
    donneesPourTableau.forEach((row, index) => {
        row.rang = index + 1;
    });
    
    // Retrier selon l'ordre original ou le tri demandé
    donneesPourTableau.forEach(row => {
        // Calculer la variation (simulation)
        const variation = (Math.random() - 0.5) * 20; // -10% à +10%
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${row.zones}</strong></td>
            <td>${row.annee}</td>
            <td><span class="badge bg-${row.saison === 'hivernage' ? 'primary' : 'info'}">${row.saison}</span></td>
            <td>${TchiaUtils.formatNombre(row.superficie, '')}</td>
            <td>${TchiaUtils.formatNombre(row.production, '')}</td>
            <td>${TchiaUtils.formatNombre(row.rendement, '')}</td>
            <td class="${variation > 0 ? 'text-success' : 'text-danger'}">
                <i class="bi bi-arrow-${variation > 0 ? 'up' : 'down'}"></i> 
                ${Math.abs(variation).toFixed(1)}%
            </td>
            <td>
                <span class="badge bg-${row.rang <= 3 ? 'success' : row.rang <= 10 ? 'warning' : 'secondary'}">
                    #${row.rang}
                </span>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Générer les recommandations
function genererRecommandations() {
    const recoContainer = document.getElementById('recommandations-agricoles');
    const oppoContainer = document.getElementById('opportunites-amelioration');
    
    if (!recoContainer || !oppoContainer) return;
    
    // Analyser les données pour générer des recommandations
    const rendementMoyen = donneesFilrees.reduce((sum, row) => {
        return sum + (row.superficie > 0 ? row.production / row.superficie : 0);
    }, 0) / donneesFilrees.length;
    
    // Recommandations
    const recommandations = [];
    
    if (rendementMoyen < 3) {
        recommandations.push({
            type: 'danger',
            icon: 'exclamation-triangle',
            message: 'Rendements faibles détectés. Envisagez une révision des pratiques culturales.'
        });
    }
    
    // Identifier les zones sous-performantes
    const zonesRendements = {};
    donneesFilrees.forEach(row => {
        if (!zonesRendements[row.zones]) {
            zonesRendements[row.zones] = { production: 0, superficie: 0 };
        }
        zonesRendements[row.zones].production += parseFloat(row.production) || 0;
        zonesRendements[row.zones].superficie += parseFloat(row.superficie) || 0;
    });
    
    const zonesFaibles = Object.entries(zonesRendements)
        .filter(([zone, data]) => {
            const rendement = data.superficie > 0 ? data.production / data.superficie : 0;
            return rendement < 3;
        })
        .map(([zone]) => zone);
    
    if (zonesFaibles.length > 0) {
        recommandations.push({
            type: 'warning',
            icon: 'geo-alt',
            message: `Zones nécessitant une attention particulière : ${zonesFaibles.join(', ')}`
        });
    }
    
    recommandations.push({
        type: 'info',
        icon: 'lightbulb',
        message: 'Optimisez l\'utilisation des intrants en fonction des analyses de sol'
    });
    
    // Afficher les recommandations
    recoContainer.innerHTML = recommandations.map(reco => `
        <div class="alert alert-${reco.type} mb-2">
            <i class="bi bi-${reco.icon} me-2"></i>
            ${reco.message}
        </div>
    `).join('');
    
    // Opportunités d'amélioration
    const opportunites = [
        {
            titre: 'Diversification des cultures',
            description: 'Introduire des cultures à haute valeur ajoutée',
            potentiel: '+15% revenus'
        },
        {
            titre: 'Agriculture de précision',
            description: 'Utiliser des technologies GPS et drones',
            potentiel: '+20% efficacité'
        },
        {
            titre: 'Irrigation optimisée',
            description: 'Système de goutte-à-goutte dans les zones sèches',
            potentiel: '-30% eau'
        }
    ];
    
    oppoContainer.innerHTML = opportunites.map(opp => `
        <div class="mb-3 p-3 bg-light rounded">
            <h6 class="mb-1">${opp.titre}</h6>
            <p class="mb-1 small text-muted">${opp.description}</p>
            <span class="badge bg-success">${opp.potentiel}</span>
        </div>
    `).join('');
}

// Fonctions d'interface
window.changerTypeGraphique = function(graphique, type, event) { // Ajoutez event comme paramètre
    if (graphique === 'superficies') {
        currentSuperficiesType = type;
        
        // Correction: Utilisez querySelector pour un seul élément
        const container = document.querySelector('#chart-superficies').closest('.chart-container');
        const buttons = container.querySelectorAll('.btn-group button');
        
        buttons.forEach(btn => btn.classList.remove('active'));
        event.target.classList.add('active');
        
        TchiaUtils.chargerDonneesGraphique('superficies', data => creerGraphiqueSuperficies(data));
    }
};

window.changerTriRendements = function(tri, event) { // Ajoutez event comme paramètre
    currentRendementsTri = tri;
    
    // Correction: Utilisez querySelector pour un seul élément
    const container = document.querySelector('#chart-rendements').closest('.chart-container');
    const buttons = container.querySelectorAll('.btn-group button');
    
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    TchiaUtils.chargerDonneesGraphique('rendements', data => creerGraphiqueRendements(data));
};

window.actualiserAnalyseAgricole = function() {
    TchiaUtils.showLoader('Actualisation de l\'analyse...');
    
    // Récupérer les filtres
    const filters = {
        periode: document.getElementById('filter-periode').value,
        donnees: document.getElementById('filter-donnees').value,
        comparaison: document.getElementById('filter-comparaison').value
    };
    
    // Simuler une actualisation
    setTimeout(() => {
        analyserDonneesAgricoles();
        TchiaUtils.hideLoader();
        TchiaUtils.showNotification('success', 'Analyse agricole actualisée');
    }, 1000);
};

window.trierTableau = function(critere) {
    // TODO: Implémenter le tri du tableau
    console.log('Tri par:', critere);
    TchiaUtils.showNotification('info', `Tri par ${critere} (fonctionnalité en développement)`);
};

window.exporterTableauAgricole = function() {
    // Utiliser la fonction d'export globale
    window.exporterCSV();
};

// Redimensionnement des graphiques
window.addEventListener('resize', function() {
    if (chartSuperficies) chartSuperficies.resize();
    if (chartRendements) chartRendements.resize();
    if (chartEvolutionTemporelle) chartEvolutionTemporelle.resize();
    if (chartDistributionSpatiale) chartDistributionSpatiale.resize();
    if (chartSaisonnalite) chartSaisonnalite.resize();
    if (chartEfficacite) chartEfficacite.resize();
});