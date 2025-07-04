/**
 * TCHIA Analytics - JavaScript pour la page Intelligence Météorologique
 */

// Variables spécifiques à la page météo
let chartClimat = null;
let chartTemperature = null;
let chartZoneTemperature = null;
let chartZonePrecipitation = null;
let chartEvolutionMensuelle = null;
let chartBilanHydrique = null;
let miniChartTendances = null;
let chartCorrelationMeteo = null;

// Configuration
let currentClimateView = 'temperature';
let selectedZone = '';
let selectedYear = '2023';

// Seuils d'alerte
const SEUILS = {
    temperature: { min: 15, max: 35, optimal: { min: 20, max: 30 } },
    precipitation: { min: 300, max: 1200, optimal: { min: 500, max: 800 } },
    humidite: { min: 40, max: 80, optimal: { min: 50, max: 70 } },
    vent: { max: 50, alerte: 30 }
};

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    console.log('🌤️ Initialisation page Météo');
    
    // Écouter les événements de données
    document.addEventListener('donneesChargees', onDonneesChargees);
    document.addEventListener('donneesFiltrees', onDonneesFiltrees);
    
    // Si des données sont déjà disponibles
    if (donneesBrutes.length > 0) {
        analyserDonneesMeteo();
    }
});

// Callback données chargées
function onDonneesChargees(event) {
    console.log('📊 Données météo chargées');
    analyserDonneesMeteo();
}

// Callback données filtrées
function onDonneesFiltrees(event) {
    console.log('🔍 Données météo filtrées');
    analyserDonneesMeteo();
}

// Analyse principale des données météo
function analyserDonneesMeteo() {
    if (!donneesFilrees || donneesFilrees.length === 0) return;
    
    // Calculer les métriques
    calculerMetriquesMeteo();
    
    // Générer les alertes
    genererAlertesMeteo();
    
    // Créer les graphiques
    creerGraphiquesMeteo();
    
    // Analyser les anomalies
    detecterAnomalies();
    
    // Mettre à jour les zones
    mettreAJourListeZones();
    
    // Générer les recommandations
    genererRecommandationsMeteo();
}

// Calcul des métriques météo
function calculerMetriquesMeteo() {
    // Précipitations moyennes
    const precipMoyenne = donneesFilrees.reduce((sum, row) => 
        sum + (parseFloat(row.precipitation_sum_saison) || 0), 0) / donneesFilrees.length;
    
    // Ensoleillement moyen (convertir en heures)
    const ensoleillementMoyen = donneesFilrees.reduce((sum, row) => 
        sum + (parseFloat(row.sunshine_duration_saison) || 0), 0) / donneesFilrees.length / 3600;
    
    // Humidité moyenne du sol (en pourcentage)
    const humiditeMoyenne = donneesFilrees.reduce((sum, row) => 
        sum + (parseFloat(row.soil_moisture_saison) || 0), 0) / donneesFilrees.length * 100;
    
    // Vitesse du vent moyenne
    const ventMoyen = donneesFilrees.reduce((sum, row) => 
        sum + (parseFloat(row.wind_speed_10m_max_saison) || 0), 0) / donneesFilrees.length;
    
    // Calculer les tendances (comparaison avec l'année précédente)
    const anneeCourante = Math.max(...donneesFilrees.map(r => r.annee));
    const donneesCourantes = donneesFilrees.filter(r => r.annee === anneeCourante);
    const donneesPrecedentes = donneesFilrees.filter(r => r.annee === anneeCourante - 1);
    
    let tendances = {
        precipitation: 0,
        ensoleillement: 0,
        humidite: 0,
        vent: 0
    };
    
    if (donneesPrecedentes.length > 0) {
        const precipPrec = donneesPrecedentes.reduce((sum, row) => 
            sum + (parseFloat(row.precipitation_sum_saison) || 0), 0) / donneesPrecedentes.length;
        tendances.precipitation = ((precipMoyenne - precipPrec) / precipPrec * 100).toFixed(1);
    }
    
    // Mettre à jour l'affichage
    document.getElementById('precip-totale').textContent = TchiaUtils.formatNombre(precipMoyenne, 'mm');
    document.getElementById('ensoleillement').textContent = TchiaUtils.formatNombre(ensoleillementMoyen, 'h');
    document.getElementById('humidite-sol').textContent = TchiaUtils.formatNombre(humiditeMoyenne, '%');
    document.getElementById('vitesse-vent').textContent = TchiaUtils.formatNombre(ventMoyen, 'km/h');
    
    // Mettre à jour les tendances
    updateTendance('precip-tendance', tendances.precipitation, 'precipitation');
    updateTendance('ensoleillement-tendance', tendances.ensoleillement, 'ensoleillement');
    updateTendance('humidite-tendance', tendances.humidite, 'humidite');
    updateTendance('vent-tendance', tendances.vent, 'vent');
}

// Mettre à jour l'affichage des tendances
function updateTendance(elementId, valeur, type) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    const icon = valeur > 0 ? 'arrow-up' : valeur < 0 ? 'arrow-down' : 'dash';
    const classe = valeur > 0 ? 'change-positive' : valeur < 0 ? 'change-negative' : '';
    
    element.className = `metric-change ${classe}`;
    element.innerHTML = `
        <i class="bi bi-${icon}"></i>
        <span>${valeur !== 0 ? Math.abs(valeur) + '% vs année préc.' : 'Stable'}</span>
    `;
}

// Générer les alertes météo
function genererAlertesMeteo() {
    const alertesContainer = document.getElementById('alertes-meteo');
    if (!alertesContainer) return;
    
    const alertes = [];
    
    // Analyser les conditions actuelles
    const tempMoyenne = donneesFilrees.reduce((sum, row) => 
        sum + (parseFloat(row.temperature_2m_mean_saison) || 0), 0) / donneesFilrees.length;
    
    const precipTotale = donneesFilrees.reduce((sum, row) => 
        sum + (parseFloat(row.precipitation_sum_saison) || 0), 0) / donneesFilrees.length;
    
    // Alertes température
    if (tempMoyenne > SEUILS.temperature.max) {
        alertes.push({
            type: 'danger',
            icon: 'thermometer-high',
            titre: 'Alerte Canicule',
            message: `Température moyenne élevée (${tempMoyenne.toFixed(1)}°C). Risque de stress thermique pour les cultures.`
        });
    } else if (tempMoyenne < SEUILS.temperature.min) {
        alertes.push({
            type: 'warning',
            icon: 'thermometer-low',
            titre: 'Températures Basses',
            message: `Température moyenne faible (${tempMoyenne.toFixed(1)}°C). Croissance ralentie possible.`
        });
    }
    
    // Alertes précipitations
    if (precipTotale < SEUILS.precipitation.min) {
        alertes.push({
            type: 'warning',
            icon: 'cloud-slash',
            titre: 'Déficit Pluviométrique',
            message: `Précipitations insuffisantes (${precipTotale.toFixed(0)}mm). Irrigation nécessaire.`
        });
    } else if (precipTotale > SEUILS.precipitation.max) {
        alertes.push({
            type: 'info',
            icon: 'cloud-rain-heavy',
            titre: 'Excès de Précipitations',
            message: `Précipitations élevées (${precipTotale.toFixed(0)}mm). Surveiller le drainage.`
        });
    }
    
    // Si pas d'alertes, afficher conditions normales
    if (alertes.length === 0) {
        alertes.push({
            type: 'success',
            icon: 'check-circle',
            titre: 'Conditions Favorables',
            message: 'Les conditions météorologiques sont dans les normales saisonnières.'
        });
    }
    
    // Afficher les alertes
    alertesContainer.innerHTML = alertes.map(alerte => `
        <div class="alert alert-${alerte.type} mb-2">
            <h6 class="alert-heading">
                <i class="bi bi-${alerte.icon} me-2"></i>
                ${alerte.titre}
            </h6>
            <p class="mb-0">${alerte.message}</p>
        </div>
    `).join('');
}

// Créer les graphiques météo
function creerGraphiquesMeteo() {
    TchiaUtils.chargerDonneesGraphique('climat', data => creerGraphiqueClimat(data));
    TchiaUtils.chargerDonneesGraphique('temperature', data => creerGraphiqueTemperature(data));
    creerGraphiqueEvolutionMensuelle();
    creerGraphiqueBilanHydrique();
    creerMiniChartTendances();
    creerGraphiqueCorrelation();
}

// Graphique climatique principal
function creerGraphiqueClimat(data) {
    const ctx = document.getElementById('chart-climat');
    if (!ctx) return;
    
    if (chartClimat) {
        TchiaUtils.detruireGraphique(chartClimat);
    }
    
    let datasets = [];
    
    switch(currentClimateView) {
        case 'temperature':
            datasets = [{
                label: 'Température Hivernage (°C)',
                data: data.hivernage,
                borderColor: '#dc2626',
                backgroundColor: 'rgba(220, 38, 38, 0.1)',
                tension: 0.4,
                borderWidth: 3
            }, {
                label: 'Température Contre-saison (°C)',
                data: data.contre_saison,
                borderColor: '#f59e0b',
                backgroundColor: 'rgba(245, 158, 11, 0.1)',
                tension: 0.4,
                borderWidth: 3
            }];
            break;
            
        case 'precipitation':
            // Charger les données de précipitations
            datasets = [{
                label: 'Précipitations Hivernage (mm)',
                data: data.precip_hivernage || data.hivernage.map(() => Math.random() * 1000),
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                tension: 0.4,
                borderWidth: 3
            }, {
                label: 'Précipitations Contre-saison (mm)',
                data: data.precip_contre_saison || data.contre_saison.map(() => Math.random() * 200),
                borderColor: '#06b6d4',
                backgroundColor: 'rgba(6, 182, 212, 0.1)',
                tension: 0.4,
                borderWidth: 3
            }];
            break;
            
        case 'combine':
            datasets = [{
                label: 'Température (°C)',
                data: data.hivernage,
                borderColor: '#dc2626',
                backgroundColor: 'rgba(220, 38, 38, 0.1)',
                yAxisID: 'y',
                tension: 0.4,
                borderWidth: 3
            }, {
                label: 'Précipitations (mm)',
                data: data.precip_hivernage || data.hivernage.map(() => Math.random() * 1000),
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                yAxisID: 'y1',
                tension: 0.4,
                borderWidth: 3
            }];
            break;
    }
    
    const options = {
        ...TchiaUtils.defaultChartOptions,
        scales: currentClimateView === 'combine' ? {
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
        } : {
            y: {
                beginAtZero: false,
                title: {
                    display: true,
                    text: currentClimateView === 'temperature' ? 'Température (°C)' : 'Précipitations (mm)'
                }
            }
        }
    };
    
    chartClimat = new Chart(ctx, {
        type: 'line',
        data: {
            labels: data.labels,
            datasets: datasets
        },
        options: options
    });
}

// Graphique de distribution de température
function creerGraphiqueTemperature(data) {
    const ctx = document.getElementById('chart-temperature');
    if (!ctx) return;
    
    if (chartTemperature) {
        TchiaUtils.detruireGraphique(chartTemperature);
    }
    
    // Couleurs selon la température
    const colors = data.labels.map(label => {
        const temp = parseFloat(label);
        if (temp < 20) return 'rgba(59, 130, 246, 0.8)'; // Bleu pour froid
        if (temp < 25) return 'rgba(16, 185, 129, 0.8)'; // Vert pour optimal
        if (temp < 30) return 'rgba(245, 158, 11, 0.8)'; // Orange pour chaud
        return 'rgba(220, 38, 38, 0.8)'; // Rouge pour très chaud
    });
    
    chartTemperature = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: data.labels,
            datasets: [{
                label: 'Fréquence',
                data: data.data,
                backgroundColor: colors,
                borderColor: colors.map(c => c.replace('0.8', '1')),
                borderWidth: 2,
                borderRadius: 6
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
                        text: 'Nombre d\'occurrences'
                    }
                }
            }
        }
    });
}

// Graphique évolution mensuelle
function creerGraphiqueEvolutionMensuelle() {
    const ctx = document.getElementById('chart-evolution-mensuelle');
    if (!ctx || donneesFilrees.length === 0) return;
    
    // Filtrer par année sélectionnée
    const donneeAnnee = donneesFilrees.filter(r => r.annee == selectedYear);
    if (donneeAnnee.length === 0) return;
    
    // Simuler des données mensuelles (à adapter selon vos données réelles)
    const mois = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const temperatures = mois.map(() => 20 + Math.random() * 15);
    const precipitations = mois.map(() => Math.random() * 200);
    
    if (chartEvolutionMensuelle) {
        TchiaUtils.detruireGraphique(chartEvolutionMensuelle);
    }
    
    chartEvolutionMensuelle = new Chart(ctx, {
        type: 'line',
        data: {
            labels: mois,
            datasets: [{
                label: 'Température (°C)',
                data: temperatures,
                borderColor: '#dc2626',
                backgroundColor: 'rgba(220, 38, 38, 0.1)',
                yAxisID: 'y',
                tension: 0.4,
                borderWidth: 2
            }, {
                label: 'Précipitations (mm)',
                data: precipitations,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                yAxisID: 'y1',
                tension: 0.4,
                borderWidth: 2
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

// Graphique bilan hydrique
function creerGraphiqueBilanHydrique() {
    const ctx = document.getElementById('chart-bilan-hydrique');
    if (!ctx || donneesFilrees.length === 0) return;
    
    // Calculer le bilan hydrique par zone
    const bilanParZone = {};
    donneesFilrees.forEach(row => {
        if (!bilanParZone[row.zones]) {
            bilanParZone[row.zones] = {
                precipitation: 0,
                evapotranspiration: 0,
                count: 0
            };
        }
        bilanParZone[row.zones].precipitation += parseFloat(row.precipitation_sum_saison) || 0;
        // Estimer l'évapotranspiration basée sur la température
        const temp = parseFloat(row.temperature_2m_mean_saison) || 25;
        bilanParZone[row.zones].evapotranspiration += (temp * 5); // Formule simplifiée
        bilanParZone[row.zones].count++;
    });
    
    const zones = Object.keys(bilanParZone);
    const precipitations = zones.map(z => bilanParZone[z].precipitation / bilanParZone[z].count);
    const evapotranspirations = zones.map(z => bilanParZone[z].evapotranspiration / bilanParZone[z].count);
    const bilans = zones.map((z, i) => precipitations[i] - evapotranspirations[i]);
    
    if (chartBilanHydrique) {
        TchiaUtils.detruireGraphique(chartBilanHydrique);
    }
    
    chartBilanHydrique = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: zones,
            datasets: [{
                label: 'Précipitations',
                data: precipitations,
                backgroundColor: 'rgba(59, 130, 246, 0.8)',
                borderColor: '#3b82f6',
                borderWidth: 2
            }, {
                label: 'Évapotranspiration',
                data: evapotranspirations.map(e => -e), // Négatif pour visualisation
                backgroundColor: 'rgba(220, 38, 38, 0.8)',
                borderColor: '#dc2626',
                borderWidth: 2
            }, {
                label: 'Bilan net',
                data: bilans,
                type: 'line',
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                borderWidth: 3,
                tension: 0.4
            }]
        },
        options: {
            ...TchiaUtils.defaultChartOptions,
            scales: {
                y: {
                    title: {
                        display: true,
                        text: 'Volume (mm)'
                    }
                }
            }
        }
    });
}

// Mini graphique des tendances
function creerMiniChartTendances() {
    const ctx = document.getElementById('mini-chart-tendances');
    if (!ctx || donneesFilrees.length === 0) return;
    
    // Tendances simplifiées sur 12 mois
    const labels = ['J', 'F', 'M', 'A', 'M', 'J', 'J', 'A', 'S', 'O', 'N', 'D'];
    const tempTrend = labels.map((_, i) => 20 + 10 * Math.sin(i * Math.PI / 6));
    const precipTrend = labels.map((_, i) => 50 + 50 * Math.sin((i + 3) * Math.PI / 6));
    
    if (miniChartTendances) {
        TchiaUtils.detruireGraphique(miniChartTendances);
    }
    
    miniChartTendances = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Temp',
                data: tempTrend,
                borderColor: '#dc2626',
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.4
            }, {
                label: 'Précip',
                data: precipTrend,
                borderColor: '#3b82f6',
                borderWidth: 2,
                pointRadius: 0,
                tension: 0.4,
                yAxisID: 'y1'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'bottom',
                    labels: {
                        boxWidth: 10,
                        font: {
                            size: 10
                        }
                    }
                }
            },
            scales: {
                x: {
                    display: false
                },
                y: {
                    display: false
                },
                y1: {
                    display: false,
                    position: 'right'
                }
            }
        }
    });
}

// Graphique de corrélation
function creerGraphiqueCorrelation() {
    const ctx = document.getElementById('chart-correlation-meteo');
    if (!ctx || donneesFilrees.length === 0) return;
    
    // Préparer les données de corrélation
    const dataPoints = donneesFilrees.map(row => ({
        x: parseFloat(row.precipitation_sum_saison) || 0,
        y: parseFloat(row.production) || 0
    }));
    
    if (chartCorrelationMeteo) {
        TchiaUtils.detruireGraphique(chartCorrelationMeteo);
    }
    
    chartCorrelationMeteo = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Production vs Précipitations',
                data: dataPoints,
                backgroundColor: 'rgba(59, 130, 246, 0.6)',
                borderColor: '#3b82f6',
                borderWidth: 1
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
                        text: 'Précipitations (mm)',
                        font: {
                            size: 10
                        }
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Production (t)',
                        font: {
                            size: 10
                        }
                    }
                }
            }
        }
    });
}

// Détecter les anomalies
function detecterAnomalies() {
    const tbody = document.getElementById('anomalies-tbody');
    if (!tbody || donneesFilrees.length === 0) return;
    
    const anomalies = [];
    
    // Calculer les moyennes et écarts-types
    const tempMoyenne = donneesFilrees.reduce((sum, row) => 
        sum + (parseFloat(row.temperature_2m_mean_saison) || 0), 0) / donneesFilrees.length;
    
    const precipMoyenne = donneesFilrees.reduce((sum, row) => 
        sum + (parseFloat(row.precipitation_sum_saison) || 0), 0) / donneesFilrees.length;
    
    // Identifier les anomalies (valeurs à plus de 2 écarts-types)
    donneesFilrees.forEach(row => {
        const temp = parseFloat(row.temperature_2m_mean_saison) || 0;
        const precip = parseFloat(row.precipitation_sum_saison) || 0;
        
        // Anomalie de température
        if (Math.abs(temp - tempMoyenne) > 5) { // Simplification : 5°C d'écart
            anomalies.push({
                date: `${row.annee} - ${row.saison}`,
                zone: row.zones,
                type: 'Température',
                valeur: temp,
                normale: tempMoyenne,
                ecart: temp - tempMoyenne,
                severite: Math.abs(temp - tempMoyenne) > 7 ? 'Élevée' : 'Modérée',
                impact: temp > tempMoyenne ? 'Stress thermique' : 'Ralentissement croissance'
            });
        }
        
        // Anomalie de précipitations
        if (Math.abs(precip - precipMoyenne) > 200) { // 200mm d'écart
            anomalies.push({
                date: `${row.annee} - ${row.saison}`,
                zone: row.zones,
                type: 'Précipitations',
                valeur: precip,
                normale: precipMoyenne,
                ecart: precip - precipMoyenne,
                severite: Math.abs(precip - precipMoyenne) > 400 ? 'Élevée' : 'Modérée',
                impact: precip > precipMoyenne ? 'Risque inondation' : 'Sécheresse'
            });
        }
    });
    
    // Afficher les anomalies
    if (anomalies.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="8" class="text-center py-4 text-success">
                    <i class="bi bi-check-circle me-2"></i>
                    Aucune anomalie climatique majeure détectée
                </td>
            </tr>
        `;
    } else {
        tbody.innerHTML = anomalies.slice(0, 10).map(anomalie => `
            <tr>
                <td>${anomalie.date}</td>
                <td><strong>${anomalie.zone}</strong></td>
                <td>${anomalie.type}</td>
                <td>${anomalie.valeur.toFixed(1)} ${anomalie.type === 'Température' ? '°C' : 'mm'}</td>
                <td>${anomalie.normale.toFixed(1)} ${anomalie.type === 'Température' ? '°C' : 'mm'}</td>
                <td class="${anomalie.ecart > 0 ? 'text-danger' : 'text-primary'}">
                    ${anomalie.ecart > 0 ? '+' : ''}${anomalie.ecart.toFixed(1)}
                </td>
                <td>
                    <span class="badge bg-${anomalie.severite === 'Élevée' ? 'danger' : 'warning'}">
                        ${anomalie.severite}
                    </span>
                </td>
                <td class="text-muted">${anomalie.impact}</td>
            </tr>
        `).join('');
    }
}

// Mettre à jour la liste des zones
function mettreAJourListeZones() {
    const select = document.getElementById('select-zone-meteo');
    if (!select) return;
    
    const zones = [...new Set(donneesFilrees.map(row => row.zones))].sort();
    
    select.innerHTML = '<option value="">Toutes les zones</option>';
    zones.forEach(zone => {
        const option = document.createElement('option');
        option.value = zone;
        option.textContent = zone;
        select.appendChild(option);
    });
}

// Générer les recommandations météo
function genererRecommandationsMeteo() {
    const container = document.getElementById('recommandations-meteo');
    if (!container) return;
    
    const recommandations = [];
    
    // Analyser les conditions
    const tempMoyenne = donneesFilrees.reduce((sum, row) => 
        sum + (parseFloat(row.temperature_2m_mean_saison) || 0), 0) / donneesFilrees.length;
    
    const precipMoyenne = donneesFilrees.reduce((sum, row) => 
        sum + (parseFloat(row.precipitation_sum_saison) || 0), 0) / donneesFilrees.length;
    
    // Générer des recommandations basées sur les conditions
    if (tempMoyenne > 30) {
        recommandations.push({
            icon: 'sun',
            type: 'warning',
            text: 'Augmenter la fréquence d\'irrigation'
        });
        recommandations.push({
            icon: 'shield',
            type: 'warning',
            text: 'Protéger les jeunes plants du soleil direct'
        });
    }
    
    if (precipMoyenne < 500) {
        recommandations.push({
            icon: 'droplet',
            type: 'info',
            text: 'Prévoir irrigation complémentaire'
        });
        recommandations.push({
            icon: 'moisture',
            type: 'info',
            text: 'Utiliser du paillage pour conserver l\'humidité'
        });
    }
    
    if (tempMoyenne >= 20 && tempMoyenne <= 30 && precipMoyenne >= 500 && precipMoyenne <= 800) {
        recommandations.push({
            icon: 'check-circle',
            type: 'success',
            text: 'Conditions favorables pour les semis'
        });
        recommandations.push({
            icon: 'seedling',
            type: 'success',
            text: 'Période optimale pour la croissance'
        });
    }
    
    // Afficher les recommandations
    container.innerHTML = `
        <ul class="list-unstyled">
            ${recommandations.map(rec => `
                <li class="mb-2">
                    <i class="bi bi-${rec.icon} text-${rec.type} me-2"></i>
                    ${rec.text}
                </li>
            `).join('')}
        </ul>
    `;
}

// Fonctions d'interface
window.changerVueClimat = function(vue) {
    currentClimateView = vue;
    
    // Mettre à jour les boutons
    const buttons = document.querySelectorAll('.btn-group button');
    buttons.forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    // Recharger le graphique
    TchiaUtils.chargerDonneesGraphique('climat', data => creerGraphiqueClimat(data));
};

window.updateZoneMeteo = function() {
    selectedZone = document.getElementById('select-zone-meteo').value;
    
    // Filtrer les données pour la zone sélectionnée
    const donneesZone = selectedZone ? 
        donneesFilrees.filter(r => r.zones === selectedZone) : 
        donneesFilrees;
    
    if (donneesZone.length === 0) return;
    
    // Créer les graphiques de zone
    creerGraphiquesZone(donneesZone);
};

function creerGraphiquesZone(donneesZone) {
    // Graphique température zone
    const ctxTemp = document.getElementById('chart-zone-temperature');
    if (ctxTemp) {
        const labelsTemp = [...new Set(donneesZone.map(r => `${r.annee}-${r.saison}`))].sort();
        const dataTemp = labelsTemp.map(label => {
            const [annee, saison] = label.split('-');
            const row = donneesZone.find(r => r.annee == annee && r.saison === saison);
            return row ? parseFloat(row.temperature_2m_mean_saison) || 0 : 0;
        });
        
        if (chartZoneTemperature) {
            TchiaUtils.detruireGraphique(chartZoneTemperature);
        }
        
        chartZoneTemperature = new Chart(ctxTemp, {
            type: 'line',
            data: {
                labels: labelsTemp,
                datasets: [{
                    label: 'Température (°C)',
                    data: dataTemp,
                    borderColor: '#dc2626',
                    backgroundColor: 'rgba(220, 38, 38, 0.1)',
                    tension: 0.4,
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: selectedZone ? `Température - ${selectedZone}` : 'Température moyenne'
                    }
                }
            }
        });
    }
    
    // Graphique précipitations zone
    const ctxPrecip = document.getElementById('chart-zone-precipitation');
    if (ctxPrecip) {
        const labelsPrecip = [...new Set(donneesZone.map(r => `${r.annee}-${r.saison}`))].sort();
        const dataPrecip = labelsPrecip.map(label => {
            const [annee, saison] = label.split('-');
            const row = donneesZone.find(r => r.annee == annee && r.saison === saison);
            return row ? parseFloat(row.precipitation_sum_saison) || 0 : 0;
        });
        
        if (chartZonePrecipitation) {
            TchiaUtils.detruireGraphique(chartZonePrecipitation);
        }
        
        chartZonePrecipitation = new Chart(ctxPrecip, {
            type: 'bar',
            data: {
                labels: labelsPrecip,
                datasets: [{
                    label: 'Précipitations (mm)',
                    data: dataPrecip,
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderColor: '#3b82f6',
                    borderWidth: 2,
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: selectedZone ? `Précipitations - ${selectedZone}` : 'Précipitations moyennes'
                    }
                }
            }
        });
    }
}

window.updateEvolutionMensuelle = function(annee) {
    selectedYear = annee;
    creerGraphiqueEvolutionMensuelle();
};

window.exporterAnomalies = function() {
    // Utiliser la fonction d'export globale avec filtre sur les anomalies
    TchiaUtils.showNotification('info', 'Export des anomalies (fonctionnalité en développement)');
};

window.ouvrirConfiguration = function() {
    // Ouvrir un modal de configuration (à implémenter)
    TchiaUtils.showNotification('info', 'Configuration des alertes (fonctionnalité en développement)');
};

window.exporterDetails = function() {
    // Exporter les détails du modal
    TchiaUtils.showNotification('info', 'Export des détails (fonctionnalité en développement)');
};

// Mise à jour des indices
function updateIndices() {
    // Calculer les indices basés sur les données
    const tempMoyenne = donneesFilrees.reduce((sum, row) => 
        sum + (parseFloat(row.temperature_2m_mean_saison) || 0), 0) / donneesFilrees.length;
    
    const precipMoyenne = donneesFilrees.reduce((sum, row) => 
        sum + (parseFloat(row.precipitation_sum_saison) || 0), 0) / donneesFilrees.length;
    
    const humiditeMoyenne = donneesFilrees.reduce((sum, row) => 
        sum + (parseFloat(row.soil_moisture_saison) || 0), 0) / donneesFilrees.length * 100;
    
    // Indice de sécheresse (basé sur précipitations et température)
    const indiceSecheresse = Math.max(0, Math.min(100, 
        ((35 - tempMoyenne) / 35 * 50) + ((800 - precipMoyenne) / 800 * 50)
    ));
    
    // Indice d'humidité
    const indiceHumidite = Math.max(0, Math.min(100, humiditeMoyenne));
    
    // Stress hydrique
    const stressHydrique = Math.max(0, Math.min(100, 
        100 - ((precipMoyenne / 1000) * (humiditeMoyenne / 100) * 100)
    ));
    
    // Mettre à jour les barres de progression
    updateProgressBar('indice-secheresse', indiceSecheresse);
    updateProgressBar('indice-humidite', indiceHumidite);
    updateProgressBar('indice-stress', stressHydrique);
}

function updateProgressBar(id, value) {
    const element = document.getElementById(id);
    if (element) {
        element.style.width = `${value}%`;
        element.textContent = `${element.textContent.split(':')[0]}: ${value.toFixed(0)}%`;
        
        // Changer la couleur selon la valeur
        element.className = 'progress-bar';
        if (value > 70) {
            element.classList.add('bg-danger');
        } else if (value > 40) {
            element.classList.add('bg-warning');
        } else {
            element.classList.add('bg-success');
        }
    }
}

// Appeler updateIndices après le chargement des données
document.addEventListener('donneesChargees', updateIndices);
document.addEventListener('donneesFiltrees', updateIndices);

// Redimensionnement des graphiques
window.addEventListener('resize', function() {
    if (chartClimat) chartClimat.resize();
    if (chartTemperature) chartTemperature.resize();
    if (chartZoneTemperature) chartZoneTemperature.resize();
    if (chartZonePrecipitation) chartZonePrecipitation.resize();
    if (chartEvolutionMensuelle) chartEvolutionMensuelle.resize();
    if (chartBilanHydrique) chartBilanHydrique.resize();
    if (miniChartTendances) miniChartTendances.resize();
    if (chartCorrelationMeteo) chartCorrelationMeteo.resize();
});