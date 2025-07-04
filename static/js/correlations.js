

/**
 * TCHIA Analytics - JavaScript pour la page Corrélations
 */

// Variables spécifiques à la page corrélations
let chartCorrelations = null;
let chartScatter = null;
let chartMeteoProduction = null;
let chartEvolutionCorrelations = null;
let chartRegression = null;
let chartClusters = null;
let chartPCA = null;
let chartNetwork = null;

// Configuration
let currentMatrixType = 'complete';
let selectedVar1 = '';
let selectedVar2 = '';
let correlationFilter = 'all';

// Variables disponibles pour l'analyse
const variablesAnalyse = [
    'production',
    'superficie',
    'rendement',
    'temperature_2m_mean_saison',
    'precipitation_sum_saison',
    'soil_moisture_saison',
    'wind_speed_10m_max_saison',
    'sunshine_duration_saison'
];

const variableLabels = {
    'production': 'Production',
    'superficie': 'Superficie',
    'rendement': 'Rendement',
    'temperature_2m_mean_saison': 'Température',
    'precipitation_sum_saison': 'Précipitations',
    'soil_moisture_saison': 'Humidité sol',
    'wind_speed_10m_max_saison': 'Vitesse vent',
    'sunshine_duration_saison': 'Ensoleillement'
};

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    console.log('📊 Initialisation page Corrélations');
    
    // Écouter les événements de données
    document.addEventListener('donneesChargees', onDonneesChargees);
    document.addEventListener('donneesFiltrees', onDonneesFiltrees);
    
    // Initialiser les tabs
    initialiserTabs();
    
    // Si des données sont déjà disponibles
    if (donneesBrutes.length > 0) {
        analyserCorrelations();
    }
});

// Initialisation des tabs
function initialiserTabs() {
    const tabElements = document.querySelectorAll('#multivariateTab button[data-bs-toggle="tab"]');
    tabElements.forEach(tab => {
        tab.addEventListener('shown.bs.tab', function (event) {
            const targetId = event.target.getAttribute('data-bs-target');
            switch(targetId) {
                case '#regression-content':
                    creerGraphiqueRegression();
                    break;
                case '#cluster-content':
                    creerGraphiqueClusters();
                    break;
                case '#pca-content':
                    creerGraphiquePCA();
                    break;
                case '#network-content':
                    creerGraphiqueNetwork();
                    break;
            }
        });
    });
}

// Callback données chargées
function onDonneesChargees(event) {
    console.log('📊 Données chargées pour corrélations');
    analyserCorrelations();
}

// Callback données filtrées
function onDonneesFiltrees(event) {
    console.log('🔍 Données filtrées pour corrélations');
    analyserCorrelations();
}

// Analyse principale des corrélations
function analyserCorrelations() {
    if (!donneesFilrees || donneesFilrees.length === 0) return;
    
    // Calculer la matrice de corrélations
    const matriceCorrelations = calculerMatriceCorrelations();
    
    // Mettre à jour les métriques
    mettreAJourMetriques(matriceCorrelations);
    
    // Créer les graphiques
    creerGraphiques(matriceCorrelations);
    
    // Remplir les sélecteurs de variables
    remplirSelecteursVariables();
    
    // Mettre à jour le tableau
    mettreAJourTableauCorrelations(matriceCorrelations);
    
    // Générer les insights
    genererInsights(matriceCorrelations);
}

// Calculer la matrice de corrélations
function calculerMatriceCorrelations() {
    const matrice = {};
    
    // Préparer les données pour chaque variable
    const donneesParVariable = {};
    variablesAnalyse.forEach(variable => {
        donneesParVariable[variable] = [];
    });
    
    // Extraire les valeurs
    donneesFilrees.forEach(row => {
        variablesAnalyse.forEach(variable => {
            let valeur = row[variable];
            
            // Calculer le rendement si nécessaire
            if (variable === 'rendement') {
                valeur = row.superficie > 0 ? row.production / row.superficie : 0;
            }
            
            if (valeur !== null && valeur !== undefined && !isNaN(valeur)) {
                donneesParVariable[variable].push(parseFloat(valeur));
            }
        });
    });
    
    // Calculer les corrélations pour chaque paire
    variablesAnalyse.forEach(var1 => {
        matrice[var1] = {};
        variablesAnalyse.forEach(var2 => {
            if (donneesParVariable[var1].length > 0 && donneesParVariable[var2].length > 0) {
                const correlation = calculerCorrelation(
                    donneesParVariable[var1],
                    donneesParVariable[var2]
                );
                matrice[var1][var2] = correlation;
            } else {
                matrice[var1][var2] = 0;
            }
        });
    });
    
    return matrice;
}

// Calculer le coefficient de corrélation de Pearson
function calculerCorrelation(x, y) {
    const n = Math.min(x.length, y.length);
    if (n < 2) return 0;
    
    // Moyennes
    const meanX = x.reduce((a, b) => a + b) / n;
    const meanY = y.reduce((a, b) => a + b) / n;
    
    // Covariance et écarts-types
    let cov = 0, stdX = 0, stdY = 0;
    for (let i = 0; i < n; i++) {
        const dx = x[i] - meanX;
        const dy = y[i] - meanY;
        cov += dx * dy;
        stdX += dx * dx;
        stdY += dy * dy;
    }
    
    if (stdX === 0 || stdY === 0) return 0;
    
    return cov / Math.sqrt(stdX * stdY);
}

// Mettre à jour les métriques
function mettreAJourMetriques(matrice) {
    let fortes = 0, moyennes = 0, faibles = 0;
    
    Object.keys(matrice).forEach(var1 => {
        Object.keys(matrice[var1]).forEach(var2 => {
            if (var1 !== var2) {
                const corr = Math.abs(matrice[var1][var2]);
                if (corr > 0.7) fortes++;
                else if (corr > 0.4) moyennes++;
                else faibles++;
            }
        });
    });
    
    // Diviser par 2 car on compte chaque paire deux fois
    document.getElementById('correlations-fortes').textContent = Math.floor(fortes / 2);
    document.getElementById('correlations-moyennes').textContent = Math.floor(moyennes / 2);
    document.getElementById('correlations-faibles').textContent = Math.floor(faibles / 2);
}

// Créer les graphiques
function creerGraphiques(matriceCorrelations) {
    TchiaUtils.chargerDonneesGraphique('correlations', data => {
        creerGraphiqueMatrice(data);
    });
    
    afficherTopCorrelations(matriceCorrelations);
    creerGraphiqueMeteoProduction();
    creerGraphiqueEvolutionCorrelations();
}

// Graphique de la matrice de corrélations
function creerGraphiqueMatrice(data) {
    const ctx = document.getElementById('chart-correlations');
    if (!ctx) return;
    
    if (chartCorrelations) {
        TchiaUtils.detruireGraphique(chartCorrelations);
    }
    
    // Créer une heatmap avec Chart.js
    const labels = data.labels;
    const dataPoints = [];
    const backgroundColors = [];
    
    // Créer les points pour la heatmap
    for (let i = 0; i < labels.length; i++) {
        for (let j = 0; j < labels.length; j++) {
            dataPoints.push({
                x: j,
                y: i,
                v: data.data[i][j]
            });
            
            // Couleur selon la valeur
            const value = data.data[i][j];
            let color;
            if (value > 0.7) color = 'rgba(45, 80, 22, 0.9)';
            else if (value > 0.4) color = 'rgba(74, 124, 89, 0.7)';
            else if (value > 0) color = 'rgba(164, 201, 106, 0.5)';
            else if (value > -0.4) color = 'rgba(251, 191, 36, 0.5)';
            else if (value > -0.7) color = 'rgba(217, 119, 6, 0.7)';
            else color = 'rgba(220, 38, 38, 0.9)';
            
            backgroundColors.push(color);
        }
    }
    
    chartCorrelations = new Chart(ctx, {
        type: 'bubble',
        data: {
            datasets: [{
                label: 'Corrélations',
                data: dataPoints,
                backgroundColor: backgroundColors,
                borderColor: 'rgba(0, 0, 0, 0.1)',
                borderWidth: 1
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
                            const x = labels[context.parsed.x];
                            const y = labels[context.parsed.y];
                            const value = context.parsed.v;
                            return `${y} × ${x}: ${value.toFixed(3)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    min: -0.5,
                    max: labels.length - 0.5,
                    ticks: {
                        stepSize: 1,
                        callback: function(value) {
                            return labels[value] || '';
                        }
                    }
                },
                y: {
                    type: 'linear',
                    min: -0.5,
                    max: labels.length - 0.5,
                    ticks: {
                        stepSize: 1,
                        callback: function(value) {
                            return labels[value] || '';
                        }
                    }
                }
            }
        }
    });
}

// Afficher les top corrélations
function afficherTopCorrelations(matrice) {
    const correlations = [];
    
    // Extraire toutes les corrélations uniques
    Object.keys(matrice).forEach((var1, i) => {
        Object.keys(matrice[var1]).forEach((var2, j) => {
            if (i < j) { // Éviter les doublons
                correlations.push({
                    var1: var1,
                    var2: var2,
                    value: matrice[var1][var2],
                    absValue: Math.abs(matrice[var1][var2])
                });
            }
        });
    });
    
    // Trier par valeur absolue décroissante
    correlations.sort((a, b) => b.absValue - a.absValue);
    
    // Afficher le top 10
    const container = document.getElementById('top-correlations');
    container.innerHTML = correlations.slice(0, 10).map((corr, index) => {
        const type = corr.value > 0 ? 'positive' : 'negative';
        const force = corr.absValue > 0.7 ? 'forte' : corr.absValue > 0.4 ? 'moyenne' : 'faible';
        const badgeColor = corr.value > 0 ? 'success' : 'danger';
        const iconType = corr.value > 0 ? 'arrow-up-right' : 'arrow-down-right';
        
        return `
            <div class="d-flex justify-content-between align-items-center mb-2 p-2 bg-light rounded">
                <div>
                    <strong>${index + 1}.</strong>
                    <span>${variableLabels[corr.var1]} × ${variableLabels[corr.var2]}</span>
                </div>
                <div>
                    <span class="badge bg-${badgeColor}">
                        <i class="bi bi-${iconType}"></i>
                        ${corr.value.toFixed(3)}
                    </span>
                </div>
            </div>
        `;
    }).join('');
}

// Remplir les sélecteurs de variables
function remplirSelecteursVariables() {
    const select1 = document.getElementById('select-var1');
    const select2 = document.getElementById('select-var2');
    
    if (!select1 || !select2) return;
    
    const options = variablesAnalyse.map(variable => 
        `<option value="${variable}">${variableLabels[variable]}</option>`
    ).join('');
    
    select1.innerHTML = '<option value="">Variable 1</option>' + options;
    select2.innerHTML = '<option value="">Variable 2</option>' + options;
    
    // Sélectionner par défaut production vs précipitations
    select1.value = 'production';
    select2.value = 'precipitation_sum_saison';
    
    updateScatterPlot();
}

// Mettre à jour le scatter plot
window.updateScatterPlot = function() {
    selectedVar1 = document.getElementById('select-var1').value;
    selectedVar2 = document.getElementById('select-var2').value;
    
    if (!selectedVar1 || !selectedVar2 || donneesFilrees.length === 0) return;
    
    const ctx = document.getElementById('chart-scatter');
    if (!ctx) return;
    
    // Préparer les données
    const dataPoints = donneesFilrees.map(row => {
        let x = parseFloat(row[selectedVar1]) || 0;
        let y = parseFloat(row[selectedVar2]) || 0;
        
        // Gérer le rendement
        if (selectedVar1 === 'rendement') {
            x = row.superficie > 0 ? row.production / row.superficie : 0;
        }
        if (selectedVar2 === 'rendement') {
            y = row.superficie > 0 ? row.production / row.superficie : 0;
        }
        
        return { x, y };
    }).filter(point => !isNaN(point.x) && !isNaN(point.y));
    
    if (chartScatter) {
        TchiaUtils.detruireGraphique(chartScatter);
    }
    
    // Calculer la régression linéaire
    const regression = calculerRegression(dataPoints);
    
    // Points de la ligne de régression
    const minX = Math.min(...dataPoints.map(p => p.x));
    const maxX = Math.max(...dataPoints.map(p => p.x));
    const lineData = [
        { x: minX, y: regression.a * minX + regression.b },
        { x: maxX, y: regression.a * maxX + regression.b }
    ];
    
    chartScatter = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Observations',
                data: dataPoints,
                backgroundColor: 'rgba(59, 130, 246, 0.6)',
                borderColor: '#3b82f6',
                borderWidth: 1,
                pointRadius: 4
            }, {
                label: 'Régression',
                data: lineData,
                type: 'line',
                borderColor: '#dc2626',
                borderWidth: 2,
                pointRadius: 0,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: variableLabels[selectedVar1]
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: variableLabels[selectedVar2]
                    }
                }
            }
        }
    });
    
    // Mettre à jour les statistiques
    updateStatistiques(dataPoints, regression);
};

// Calculer la régression linéaire
function calculerRegression(points) {
    const n = points.length;
    if (n < 2) return { a: 0, b: 0, r: 0, r2: 0 };
    
    const sumX = points.reduce((sum, p) => sum + p.x, 0);
    const sumY = points.reduce((sum, p) => sum + p.y, 0);
    const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0);
    const sumX2 = points.reduce((sum, p) => sum + p.x * p.x, 0);
    const sumY2 = points.reduce((sum, p) => sum + p.y * p.y, 0);
    
    const a = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    const b = (sumY - a * sumX) / n;
    
    // Coefficient de corrélation
    const r = (n * sumXY - sumX * sumY) / 
              Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
    
    return { a, b, r, r2: r * r };
}

// Mettre à jour les statistiques
function updateStatistiques(dataPoints, regression) {
    document.getElementById('stat-coefficient').textContent = regression.r.toFixed(3);
    document.getElementById('stat-r2').textContent = (regression.r2 * 100).toFixed(1) + '%';
    
    // P-value approximative (simplifiée)
    const n = dataPoints.length;
    const t = regression.r * Math.sqrt((n - 2) / (1 - regression.r2));
    const pValue = n > 30 && Math.abs(t) > 2 ? '< 0.05' : '> 0.05';
    document.getElementById('stat-pvalue').textContent = pValue;
    
    // Significativité
    const significant = Math.abs(regression.r) > 0.3 && pValue === '< 0.05';
    document.getElementById('stat-significance').textContent = significant ? 'Significatif' : 'Non significatif';
    document.getElementById('stat-significance').className = significant ? 'text-success' : 'text-muted';
    
    // Type de relation
    const type = regression.r > 0 ? 'Positive' : regression.r < 0 ? 'Négative' : 'Nulle';
    document.getElementById('stat-type').textContent = type;
    
    // Force
    const absR = Math.abs(regression.r);
    const force = absR > 0.7 ? 'Forte' : absR > 0.4 ? 'Moyenne' : 'Faible';
    document.getElementById('stat-force').textContent = force;
    document.getElementById('stat-force').className = 
        force === 'Forte' ? 'text-success' : force === 'Moyenne' ? 'text-warning' : 'text-secondary';
    
    // Interprétation
    let interpretation = '';
    if (significant && absR > 0.7) {
        interpretation = `Relation ${type.toLowerCase()} forte entre ${variableLabels[selectedVar1]} et ${variableLabels[selectedVar2]}. `;
        if (regression.r > 0) {
            interpretation += `Une augmentation de ${variableLabels[selectedVar1]} est associée à une augmentation de ${variableLabels[selectedVar2]}.`;
        } else {
            interpretation += `Une augmentation de ${variableLabels[selectedVar1]} est associée à une diminution de ${variableLabels[selectedVar2]}.`;
        }
    } else if (significant) {
        interpretation = `Relation ${type.toLowerCase()} ${force.toLowerCase()} mais significative. Des facteurs supplémentaires peuvent influencer cette relation.`;
    } else {
        interpretation = `Pas de relation significative détectée entre ces variables dans les conditions actuelles.`;
    }
    
    document.getElementById('interpretation-relation').textContent = interpretation;
}

// Graphique météo-production
function creerGraphiqueMeteoProduction() {
    const ctx = document.getElementById('chart-meteo-production');
    if (!ctx || donneesFilrees.length === 0) return;
    
    // Variables météo à analyser
    const varsMeteo = ['temperature_2m_mean_saison', 'precipitation_sum_saison', 'soil_moisture_saison'];
    const correlations = [];
    
    varsMeteo.forEach(variable => {
        const dataPoints = donneesFilrees.map(row => ({
            x: parseFloat(row[variable]) || 0,
            y: parseFloat(row.production) || 0
        })).filter(p => !isNaN(p.x) && !isNaN(p.y));
        
        const regression = calculerRegression(dataPoints);
        correlations.push({
            variable: variableLabels[variable],
            correlation: regression.r
        });
    });
    
    if (chartMeteoProduction) {
        TchiaUtils.detruireGraphique(chartMeteoProduction);
    }
    
    chartMeteoProduction = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: correlations.map(c => c.variable),
            datasets: [{
                label: 'Corrélation avec Production',
                data: correlations.map(c => c.correlation),
                backgroundColor: correlations.map(c => 
                    c.correlation > 0 ? 'rgba(74, 124, 89, 0.8)' : 'rgba(220, 38, 38, 0.8)'
                ),
                borderColor: correlations.map(c => 
                    c.correlation > 0 ? '#4a7c59' : '#dc2626'
                ),
                borderWidth: 2
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
                y: {
                    beginAtZero: true,
                    min: -1,
                    max: 1,
                    title: {
                        display: true,
                        text: 'Coefficient de corrélation'
                    }
                }
            }
        }
    });
    
    // Mettre à jour l'insight
    const maxCorr = Math.max(...correlations.map(c => Math.abs(c.correlation)));
    const principalFactor = correlations.find(c => Math.abs(c.correlation) === maxCorr);
    
    document.getElementById('insight-meteo-production').innerHTML = `
        <i class="bi bi-info-circle me-2"></i>
        <span>${principalFactor.variable} est le facteur météo le plus corrélé avec la production (r = ${principalFactor.correlation.toFixed(3)})</span>
    `;
}

// Graphique évolution des corrélations
function creerGraphiqueEvolutionCorrelations() {
    const ctx = document.getElementById('chart-evolution-correlations');
    if (!ctx || donneesFilrees.length === 0) return;
    
    // Calculer les corrélations par année
    const annees = [...new Set(donneesFilrees.map(r => r.annee))].sort();
    const evolutionData = {
        'Temp × Production': [],
        'Précip × Production': [],
        'Temp × Précip': []
    };
    
    annees.forEach(annee => {
        const donneesAnnee = donneesFilrees.filter(r => r.annee === annee);
        
        // Calculer les corrélations pour cette année
        const pairs = [
            { x: 'temperature_2m_mean_saison', y: 'production', label: 'Temp × Production' },
            { x: 'precipitation_sum_saison', y: 'production', label: 'Précip × Production' },
            { x: 'temperature_2m_mean_saison', y: 'precipitation_sum_saison', label: 'Temp × Précip' }
        ];
        
        pairs.forEach(pair => {
            const dataPoints = donneesAnnee.map(row => ({
                x: parseFloat(row[pair.x]) || 0,
                y: parseFloat(row[pair.y]) || 0
            })).filter(p => !isNaN(p.x) && !isNaN(p.y));
            
            const regression = calculerRegression(dataPoints);
            evolutionData[pair.label].push(regression.r);
        });
    });
    
    if (chartEvolutionCorrelations) {
        TchiaUtils.detruireGraphique(chartEvolutionCorrelations);
    }
    
    chartEvolutionCorrelations = new Chart(ctx, {
        type: 'line',
        data: {
            labels: annees,
            datasets: Object.entries(evolutionData).map((entry, index) => ({
                label: entry[0],
                data: entry[1],
                borderColor: ['#2d5016', '#3b82f6', '#d97706'][index],
                backgroundColor: ['rgba(45, 80, 22, 0.1)', 'rgba(59, 130, 246, 0.1)', 'rgba(217, 119, 6, 0.1)'][index],
                borderWidth: 2,
                tension: 0.4
            }))
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            },
            scales: {
                y: {
                    min: -1,
                    max: 1,
                    title: {
                        display: true,
                        text: 'Coefficient de corrélation'
                    }
                }
            }
        }
    });
    
    // Analyser les tendances
    const dernierAnnee = annees[annees.length - 1];
    const tendance = Object.entries(evolutionData).map(entry => {
        const values = entry[1];
        const variation = values[values.length - 1] - values[0];
        return { label: entry[0], variation };
    }).sort((a, b) => Math.abs(b.variation) - Math.abs(a.variation))[0];
    
    document.getElementById('insight-evolution').innerHTML = `
        <i class="bi bi-exclamation-triangle me-2"></i>
        <span>La corrélation "${tendance.label}" a ${tendance.variation > 0 ? 'augmenté' : 'diminué'} de ${Math.abs(tendance.variation).toFixed(2)} points sur la période</span>
    `;
}

// Graphiques d'analyse multivariée
function creerGraphiqueRegression() {
    const ctx = document.getElementById('chart-regression');
    if (!ctx || donneesFilrees.length === 0) return;
    
    // Simulation d'une régression multiple (à remplacer par un calcul réel)
    const predictions = donneesFilrees.map((row, index) => {
        const temp = parseFloat(row.temperature_2m_mean_saison) || 25;
        const precip = parseFloat(row.precipitation_sum_saison) || 500;
        const pred = 1000 + temp * 50 + precip * 2 + (Math.random() - 0.5) * 500;
        return {
            x: index,
            y: pred,
            actual: parseFloat(row.production) || 0
        };
    });
    
    if (chartRegression) {
        TchiaUtils.detruireGraphique(chartRegression);
    }
    
    chartRegression = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Valeurs réelles',
                data: predictions.map(p => ({ x: p.x, y: p.actual })),
                backgroundColor: 'rgba(59, 130, 246, 0.6)'
            }, {
                label: 'Prédictions',
                data: predictions.map(p => ({ x: p.x, y: p.y })),
                backgroundColor: 'rgba(220, 38, 38, 0.6)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

function creerGraphiqueClusters() {
    const ctx = document.getElementById('chart-clusters');
    if (!ctx || donneesFilrees.length === 0) return;
    
    // Simulation de clusters (à remplacer par un vrai algorithme de clustering)
    const clusters = donneesFilrees.map(row => ({
        x: parseFloat(row.temperature_2m_mean_saison) || 0,
        y: parseFloat(row.precipitation_sum_saison) || 0,
        cluster: Math.floor(Math.random() * 3)
    }));
    
    if (chartClusters) {
        TchiaUtils.detruireGraphique(chartClusters);
    }
    
    const colors = ['#2d5016', '#3b82f6', '#d97706'];
    
    chartClusters = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [0, 1, 2].map(i => ({
                label: `Cluster ${i + 1}`,
                data: clusters.filter(c => c.cluster === i),
                backgroundColor: colors[i] + '99',
                borderColor: colors[i],
                borderWidth: 1
            }))
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Température moyenne'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Précipitations'
                    }
                }
            }
        }
    });
}

function creerGraphiquePCA() {
    const ctx = document.getElementById('chart-pca');
    if (!ctx || donneesFilrees.length === 0) return;
    
    // Simulation PCA (à remplacer par une vraie ACP)
    const pcaData = donneesFilrees.map(row => ({
        x: (Math.random() - 0.5) * 10,
        y: (Math.random() - 0.5) * 10,
        zone: row.zones
    }));
    
    if (chartPCA) {
        TchiaUtils.detruireGraphique(chartPCA);
    }
    
    chartPCA = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Observations',
                data: pcaData,
                backgroundColor: 'rgba(59, 130, 246, 0.6)'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return pcaData[context.dataIndex].zone;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Composante principale 1'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Composante principale 2'
                    }
                }
            }
        }
    });
}

function creerGraphiqueNetwork() {
    const ctx = document.getElementById('chart-network');
    if (!ctx) return;
    
    // Créer un réseau de corrélations (visualisation simplifiée)
    if (chartNetwork) {
        TchiaUtils.detruireGraphique(chartNetwork);
    }
    
    // Positions des nœuds en cercle
    const nodes = variablesAnalyse.slice(0, 6);
    const angleStep = (2 * Math.PI) / nodes.length;
    const radius = 100;
    const centerX = 150;
    const centerY = 150;
    
    const nodePositions = nodes.map((node, i) => ({
        x: centerX + radius * Math.cos(i * angleStep),
        y: centerY + radius * Math.sin(i * angleStep),
        label: variableLabels[node]
    }));
    
    chartNetwork = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Nœuds',
                data: nodePositions,
                backgroundColor: '#2d5016',
                borderColor: '#fff',
                borderWidth: 2,
                pointRadius: 20
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
                            return nodePositions[context.dataIndex].label;
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: false,
                    min: 0,
                    max: 300
                },
                y: {
                    display: false,
                    min: 0,
                    max: 300
                }
            }
        }
    });
}

// Mettre à jour le tableau des corrélations
function mettreAJourTableauCorrelations(matrice) {
    const tbody = document.getElementById('correlations-tbody');
    if (!tbody) return;
    
    const correlations = [];
    
    // Extraire toutes les corrélations
    Object.keys(matrice).forEach((var1, i) => {
        Object.keys(matrice[var1]).forEach((var2, j) => {
            if (i < j) {
                const r = matrice[var1][var2];
                const r2 = r * r;
                const n = donneesFilrees.length;
                
                // Filtrer selon le critère actuel
                let include = true;
                if (correlationFilter === 'strong' && Math.abs(r) <= 0.7) include = false;
                if (correlationFilter === 'significant' && Math.abs(r) <= 0.3) include = false;
                
                if (include) {
                    correlations.push({
                        var1: variableLabels[var1],
                        var2: variableLabels[var2],
                        r: r,
                        r2: r2,
                        n: n,
                        type: r > 0 ? 'Positive' : 'Négative',
                        interpretation: interpreterCorrelation(r)
                    });
                }
            }
        });
    });
    
    // Trier par valeur absolue décroissante
    correlations.sort((a, b) => Math.abs(b.r) - Math.abs(a.r));
    
    // Afficher
    tbody.innerHTML = correlations.slice(0, 20).map(corr => `
        <tr>
            <td>${corr.var1}</td>
            <td>${corr.var2}</td>
            <td class="${corr.r > 0 ? 'text-success' : 'text-danger'}">
                ${corr.r.toFixed(3)}
            </td>
            <td>${(corr.r2 * 100).toFixed(1)}%</td>
            <td>${Math.abs(corr.r) > 0.3 ? '< 0.05' : '> 0.05'}</td>
            <td>${corr.n}</td>
            <td>
                <span class="badge bg-${corr.r > 0 ? 'success' : 'danger'}">
                    ${corr.type}
                </span>
            </td>
            <td class="small">${corr.interpretation}</td>
        </tr>
    `).join('');
}

// Interpréter la corrélation
function interpreterCorrelation(r) {
    const absR = Math.abs(r);
    if (absR > 0.7) return 'Relation forte';
    if (absR > 0.4) return 'Relation modérée';
    if (absR > 0.2) return 'Relation faible';
    return 'Relation négligeable';
}

// Générer les insights
function genererInsights(matrice) {
    // Facteurs de performance
    const facteursContainer = document.getElementById('facteurs-performance');
    const facteurs = [];
    
    if (matrice.precipitation_sum_saison && matrice.precipitation_sum_saison.production > 0.5) {
        facteurs.push('Les précipitations sont un facteur clé de production');
    }
    if (matrice.temperature_2m_mean_saison && matrice.temperature_2m_mean_saison.production < -0.3) {
        facteurs.push('Les températures élevées impactent négativement la production');
    }
    if (matrice.soil_moisture_saison && matrice.soil_moisture_saison.production > 0.4) {
        facteurs.push('L\'humidité du sol est corrélée positivement avec les rendements');
    }
    
    facteursContainer.innerHTML = facteurs.map(f => 
        `<li><i class="bi bi-check2 text-success me-2"></i>${f}</li>`
    ).join('');
    
    // Points d'attention
    const attentionContainer = document.getElementById('points-attention');
    const attention = [];
    
    // Chercher des corrélations négatives fortes
    Object.keys(matrice).forEach(var1 => {
        Object.keys(matrice[var1]).forEach(var2 => {
            if (matrice[var1][var2] < -0.5 && var2 === 'production') {
                attention.push(`${variableLabels[var1]} a un impact négatif sur la production`);
            }
        });
    });
    
    attentionContainer.innerHTML = attention.slice(0, 3).map(a => 
        `<li><i class="bi bi-x text-danger me-2"></i>${a}</li>`
    ).join('');
    
    // Actions recommandées
    document.getElementById('actions-court-terme').textContent = 
        'Optimiser l\'irrigation en fonction des corrélations météo identifiées';
    document.getElementById('actions-moyen-terme').textContent = 
        'Adapter les variétés cultivées aux conditions climatiques dominantes';
    document.getElementById('actions-long-terme').textContent = 
        'Développer des modèles prédictifs basés sur les corrélations fortes';
}

// Fonctions d'interface
window.changerTypeMatrice = function(type) {
    currentMatrixType = type;
    
    // Mettre à jour les boutons
    const buttons = document.querySelectorAll('.btn-group button');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Recharger le graphique
    TchiaUtils.chargerDonneesGraphique('correlations', data => {
        creerGraphiqueMatrice(data);
    });
};

window.filtrerCorrelations = function(filtre) {
    correlationFilter = filtre;
    
    // Mettre à jour les boutons
    const buttons = event.target.parentElement.querySelectorAll('button');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Recalculer et afficher
    const matriceCorrelations = calculerMatriceCorrelations();
    mettreAJourTableauCorrelations(matriceCorrelations);
};

window.exporterCorrelations = function() {
    TchiaUtils.showNotification('info', 'Export des corrélations (fonctionnalité en développement)');
};

// Redimensionnement des graphiques
window.addEventListener('resize', function() {
    if (chartCorrelations) chartCorrelations.resize();
    if (chartScatter) chartScatter.resize();
    if (chartMeteoProduction) chartMeteoProduction.resize();
    if (chartEvolutionCorrelations) chartEvolutionCorrelations.resize();
    if (chartRegression) chartRegression.resize();
    if (chartClusters) chartClusters.resize();
    if (chartPCA) chartPCA.resize();
    if (chartNetwork) chartNetwork.resize();
});