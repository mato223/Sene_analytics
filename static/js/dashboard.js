

/**
 * TCHIA Analytics - JavaScript pour la page Vue d'ensemble
 */

// Variables spécifiques au dashboard
let chartEvolution = null;
let chartZones = null;
let chartComparaison = null;
let chartTendances = null;

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Initialisation Dashboard');
    
    // Configuration du sélecteur de fichier
    TchiaUtils.setupFileUpload('file-selector', onFileUploaded);
    
    // Écouter les événements de données
    document.addEventListener('donneesChargees', onDonneesChargees);
    document.addEventListener('donneesFiltrees', onDonneesFiltrees);
    
    // Si des données sont déjà disponibles, les afficher
    if (donneesBrutes.length > 0) {
        mettreAJourTableauPerformance();
        creerGraphiques();
    }
});

// Callback après upload de fichier
function onFileUploaded(data) {
    console.log('✅ Fichier chargé:', data);
    
    // Masquer la zone d'upload
    const uploadRow = document.getElementById('upload-row');
    if (uploadRow) uploadRow.style.display = 'none';
    
    // Les données seront chargées via l'événement 'donneesChargees'
}

// Callback quand les données sont chargées
function onDonneesChargees(event) {
    const { donnees } = event.detail;
    console.log('📊 Données chargées dans le dashboard:', donnees.length);
    
    mettreAJourTableauPerformance();
    creerGraphiques();
    genererInsights();
}

// Callback quand les données sont filtrées
function onDonneesFiltrees(event) {
    const { donnees, metrics } = event.detail;
    console.log('🔍 Données filtrées:', donnees.length);
    
    mettreAJourTableauPerformance();
    mettreAJourGraphiques();
    genererInsights();
}

// Mise à jour du tableau de performance
function mettreAJourTableauPerformance() {
    const tbody = document.getElementById('performance-tbody');
    if (!tbody || donneesFilrees.length === 0) return;
    
    tbody.innerHTML = '';
    
    // Grouper les données par zone
    const donneesParZone = {};
    donneesFilrees.forEach(row => {
        if (!donneesParZone[row.zones]) {
            donneesParZone[row.zones] = [];
        }
        donneesParZone[row.zones].push(row);
    });
    
    // Créer les lignes du tableau
    Object.entries(donneesParZone).forEach(([zone, donnees]) => {
        const productionTotale = donnees.reduce((sum, row) => sum + (parseFloat(row.production) || 0), 0);
        const superficieTotale = donnees.reduce((sum, row) => sum + (parseFloat(row.superficie) || 0), 0);
        const rendement = superficieTotale > 0 ? productionTotale / superficieTotale : 0;
        const tempMoyenne = donnees.reduce((sum, row) => sum + (parseFloat(row.temperature_2m_mean_saison) || 0), 0) / donnees.length;
        const precipMoyenne = donnees.reduce((sum, row) => sum + (parseFloat(row.precipitation_sum_saison) || 0), 0) / donnees.length;
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${zone}</strong></td>
            <td>${TchiaUtils.formatNombre(productionTotale, 't')}</td>
            <td>${TchiaUtils.formatNombre(superficieTotale, 'ha')}</td>
            <td>${TchiaUtils.formatNombre(rendement, 't/ha')}</td>
            <td>${TchiaUtils.formatNombre(tempMoyenne, '°C')}</td>
            <td>${TchiaUtils.formatNombre(precipMoyenne, 'mm')}</td>
            <td>
                <span class="status-badge ${getStatutClasse(rendement)}">
                    ${getStatutTexte(rendement)}
                </span>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    // Ajouter une ligne de total
    const totalProduction = donneesFilrees.reduce((sum, row) => sum + (parseFloat(row.production) || 0), 0);
    const totalSuperficie = donneesFilrees.reduce((sum, row) => sum + (parseFloat(row.superficie) || 0), 0);
    const rendementGlobal = totalSuperficie > 0 ? totalProduction / totalSuperficie : 0;
    
    const trTotal = document.createElement('tr');
    trTotal.className = 'table-active fw-bold';
    trTotal.innerHTML = `
        <td>TOTAL</td>
        <td>${TchiaUtils.formatNombre(totalProduction, 't')}</td>
        <td>${TchiaUtils.formatNombre(totalSuperficie, 'ha')}</td>
        <td>${TchiaUtils.formatNombre(rendementGlobal, 't/ha')}</td>
        <td colspan="3">-</td>
    `;
    tbody.appendChild(trTotal);
}

// Création des graphiques
function creerGraphiques() {
    TchiaUtils.chargerDonneesGraphique('evolution', data => creerGraphiqueEvolution(data));
    TchiaUtils.chargerDonneesGraphique('zones', data => creerGraphiqueZones(data));
    creerGraphiqueComparaison();
    creerGraphiqueTendances();
}

// Graphique d'évolution
function creerGraphiqueEvolution(data) {
    const ctx = document.getElementById('chart-evolution');
    if (!ctx) return;
    
    // Détruire le graphique existant
    if (chartEvolution) {
        TchiaUtils.detruireGraphique(chartEvolution);
    }
    
    chartEvolution = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Production (t)',
                data: data.production,
                borderColor: '#2d5016',
                backgroundColor: 'rgba(45, 80, 22, 0.1)',
                tension: 0.4,
                yAxisID: 'y',
                borderWidth: 3,
                pointBackgroundColor: '#2d5016',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }, {
                label: 'Précipitations (mm)',
                data: data.precipitation,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                yAxisID: 'y1',
                borderWidth: 3,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            ...TchiaUtils.defaultChartOptions,
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Production (tonnes)',
                        color: '#64748b'
                    },
                    grid: {
                        color: 'rgba(148, 163, 184, 0.2)'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Précipitations (mm)',
                        color: '#64748b'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(148, 163, 184, 0.2)'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed.y !== null) {
                                label += TchiaUtils.formatNombre(context.parsed.y);
                            }
                            return label;
                        }
                    }
                }
            }
        }
    });
}

// Graphique des zones
function creerGraphiqueZones(data) {
    const ctx = document.getElementById('chart-zones');
    if (!ctx) return;
    
    if (chartZones) {
        TchiaUtils.detruireGraphique(chartZones);
    }
    
    const colors = [
        '#2d5016', '#3a6b1c', '#4a7c59', '#1e3a8a', 
        '#d97706', '#7c3aed', '#059669', '#dc2626'
    ];
    
    chartZones = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: data.labels,
            datasets: [{
                data: data.data,
                backgroundColor: colors.slice(0, data.labels.length),
                borderWidth: 3,
                borderColor: '#ffffff',
                hoverBorderWidth: 5
            }]
        },
        options: {
            ...TchiaUtils.defaultChartOptions,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: {
                        padding: 15,
                        usePointStyle: true
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = TchiaUtils.formatNombre(context.parsed, 't');
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Graphique de comparaison annuelle
function creerGraphiqueComparaison() {
    const ctx = document.getElementById('chart-comparaison');
    if (!ctx || donneesFilrees.length === 0) return;
    
    // Préparer les données
    const donneesParAnnee = {};
    donneesFilrees.forEach(row => {
        const annee = row.annee;
        if (!donneesParAnnee[annee]) {
            donneesParAnnee[annee] = {
                production: 0,
                superficie: 0
            };
        }
        donneesParAnnee[annee].production += parseFloat(row.production) || 0;
        donneesParAnnee[annee].superficie += parseFloat(row.superficie) || 0;
    });
    
    const annees = Object.keys(donneesParAnnee).sort();
    const productions = annees.map(a => donneesParAnnee[a].production);
    const superficies = annees.map(a => donneesParAnnee[a].superficie);
    
    if (chartComparaison) {
        TchiaUtils.detruireGraphique(chartComparaison);
    }
    
    chartComparaison = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: annees,
            datasets: [{
                label: 'Production (t)',
                data: productions,
                backgroundColor: 'rgba(45, 80, 22, 0.8)',
                borderColor: '#2d5016',
                borderWidth: 2,
                borderRadius: 8,
                yAxisID: 'y'
            }, {
                label: 'Superficie (ha)',
                data: superficies,
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderColor: '#3b82f6',
                borderWidth: 2,
                borderRadius: 8,
                yAxisID: 'y1'
            }]
        },
        options: {
            ...TchiaUtils.defaultChartOptions,
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
                        text: 'Superficie (hectares)'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}

// Graphique des tendances climatiques
function creerGraphiqueTendances() {
    const ctx = document.getElementById('chart-tendances');
    if (!ctx || donneesFilrees.length === 0) return;
    
    // Préparer les données
    const donneesParAnnee = {};
    donneesFilrees.forEach(row => {
        const annee = row.annee;
        if (!donneesParAnnee[annee]) {
            donneesParAnnee[annee] = {
                temperature: [],
                precipitation: []
            };
        }
        donneesParAnnee[annee].temperature.push(parseFloat(row.temperature_2m_mean_saison) || 0);
        donneesParAnnee[annee].precipitation.push(parseFloat(row.precipitation_sum_saison) || 0);
    });
    
    const annees = Object.keys(donneesParAnnee).sort();
    const tempMoyennes = annees.map(a => {
        const temps = donneesParAnnee[a].temperature;
        return temps.reduce((sum, t) => sum + t, 0) / temps.length;
    });
    const precipMoyennes = annees.map(a => {
        const precips = donneesParAnnee[a].precipitation;
        return precips.reduce((sum, p) => sum + p, 0) / precips.length;
    });
    
    if (chartTendances) {
        TchiaUtils.detruireGraphique(chartTendances);
    }
    
    chartTendances = new Chart(ctx, {
        type: 'line',
        data: {
            labels: annees,
            datasets: [{
                label: 'Température moyenne (°C)',
                data: tempMoyennes,
                borderColor: '#dc2626',
                backgroundColor: 'rgba(220, 38, 38, 0.1)',
                tension: 0.4,
                yAxisID: 'y',
                borderWidth: 3
            }, {
                label: 'Précipitations moyennes (mm)',
                data: precipMoyennes,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                yAxisID: 'y1',
                borderWidth: 3
            }]
        },
        options: {
            ...TchiaUtils.defaultChartOptions,
            scales: {
                y: {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Température (°C)'
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    title: {
                        display: true,
                        text: 'Précipitations (mm)'
                    },
                    grid: {
                        drawOnChartArea: false
                    }
                }
            }
        }
    });
}

// Mise à jour des graphiques
function mettreAJourGraphiques() {
    TchiaUtils.chargerDonneesGraphique('evolution', data => creerGraphiqueEvolution(data));
    TchiaUtils.chargerDonneesGraphique('zones', data => creerGraphiqueZones(data));
    creerGraphiqueComparaison();
    creerGraphiqueTendances();
}

// Générer des insights
function genererInsights() {
    const container = document.getElementById('insights-container');
    if (!container || donneesFilrees.length === 0) return;
    
    container.innerHTML = '';
    const insights = [];
    
    // Analyser les données
    const productionTotale = donneesFilrees.reduce((sum, row) => sum + (parseFloat(row.production) || 0), 0);
    const superficieTotale = donneesFilrees.reduce((sum, row) => sum + (parseFloat(row.superficie) || 0), 0);
    const rendementGlobal = superficieTotale > 0 ? productionTotale / superficieTotale : 0;
    
    // Température moyenne
    const tempMoyenne = donneesFilrees.reduce((sum, row) => sum + (parseFloat(row.temperature_2m_mean_saison) || 0), 0) / donneesFilrees.length;
    
    // Précipitations moyennes
    const precipMoyenne = donneesFilrees.reduce((sum, row) => sum + (parseFloat(row.precipitation_sum_saison) || 0), 0) / donneesFilrees.length;
    
    // Générer les insights
    if (rendementGlobal > 5) {
        insights.push({
            type: 'success',
            icon: 'check-circle',
            message: `Excellent rendement global de ${rendementGlobal.toFixed(2)} t/ha. Les conditions sont optimales pour la production.`
        });
    } else if (rendementGlobal < 3) {
        insights.push({
            type: 'warning',
            icon: 'exclamation-triangle',
            message: `Rendement faible de ${rendementGlobal.toFixed(2)} t/ha. Une analyse approfondie des pratiques agricoles est recommandée.`
        });
    }
    
    if (tempMoyenne > 30) {
        insights.push({
            type: 'warning',
            icon: 'thermometer-high',
            message: `Température moyenne élevée (${tempMoyenne.toFixed(1)}°C). Augmentez l'irrigation et envisagez des cultures résistantes à la chaleur.`
        });
    }
    
    if (precipMoyenne < 500) {
        insights.push({
            type: 'info',
            icon: 'cloud-rain',
            message: `Précipitations faibles (${precipMoyenne.toFixed(0)} mm). Optimisez la gestion de l'eau et préparez des systèmes d'irrigation supplémentaires.`
        });
    }
    
    // Trouver la zone la plus performante
    const zonesPerformance = {};
    donneesFilrees.forEach(row => {
        if (!zonesPerformance[row.zones]) {
            zonesPerformance[row.zones] = { production: 0, superficie: 0 };
        }
        zonesPerformance[row.zones].production += parseFloat(row.production) || 0;
        zonesPerformance[row.zones].superficie += parseFloat(row.superficie) || 0;
    });
    
    let meilleureZone = null;
    let meilleurRendement = 0;
    Object.entries(zonesPerformance).forEach(([zone, data]) => {
        const rendement = data.superficie > 0 ? data.production / data.superficie : 0;
        if (rendement > meilleurRendement) {
            meilleurRendement = rendement;
            meilleureZone = zone;
        }
    });
    
    if (meilleureZone) {
        insights.push({
            type: 'success',
            icon: 'trophy',
            message: `La zone ${meilleureZone} affiche les meilleures performances avec un rendement de ${meilleurRendement.toFixed(2)} t/ha.`
        });
    }
    
    // Afficher les insights
    insights.forEach(insight => {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${insight.type} mb-3 fade-in`;
        alertDiv.innerHTML = `
            <i class="bi bi-${insight.icon} me-2"></i>
            ${insight.message}
        `;
        container.appendChild(alertDiv);
    });
    
    // Ajouter des recommandations générales
    const recoDiv = document.createElement('div');
    recoDiv.className = 'mt-4';
    recoDiv.innerHTML = `
        <h5>Recommandations générales :</h5>
        <ul class="list-unstyled">
            <li class="mb-2"><i class="bi bi-check2 text-success me-2"></i>Continuez le suivi régulier des données météorologiques</li>
            <li class="mb-2"><i class="bi bi-check2 text-success me-2"></i>Optimisez l'utilisation des ressources en eau</li>
            <li class="mb-2"><i class="bi bi-check2 text-success me-2"></i>Adaptez les cultures aux conditions climatiques locales</li>
            <li class="mb-2"><i class="bi bi-check2 text-success me-2"></i>Investissez dans des technologies d'agriculture de précision</li>
        </ul>
    `;
    container.appendChild(recoDiv);
}

// Export des graphiques
window.exporterGraphique = function(type) {
    let chart;
    switch(type) {
        case 'evolution': chart = chartEvolution; break;
        case 'zones': chart = chartZones; break;
        case 'comparaison': chart = chartComparaison; break;
        case 'tendances': chart = chartTendances; break;
    }
    
    if (chart) {
        const url = chart.toBase64Image();
        const link = document.createElement('a');
        link.download = `tchia_${type}_${new Date().getTime()}.png`;
        link.href = url;
        link.click();
    }
};

// Redimensionnement des graphiques
window.addEventListener('resize', function() {
    if (chartEvolution) chartEvolution.resize();
    if (chartZones) chartZones.resize();
    if (chartComparaison) chartComparaison.resize();
    if (chartTendances) chartTendances.resize();
});