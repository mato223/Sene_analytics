/**
 * TCHIA Analytics - Dashboard amélioré avec IA
 * Expert IA en gestion des risques agricoles
 */

// Variables globales
let chartEvolution = null;
let chartZones = null;
let chartCorrelations = null;
let chartHeatmap = null;
let chartHydro = null;
let chartEfficience = null;
let chartObjectifs = null;
let chartPredictions = null;

// Module IA
const TchiaAI = {
    // Modèle TensorFlow.js pour les prédictions
    model: null,
    isReady: false,
    
    // Initialisation du modèle IA
    async init() {
        try {
            // Créer un modèle simple pour la démonstration
            this.model = tf.sequential({
                layers: [
                    tf.layers.dense({inputShape: [5], units: 32, activation: 'relu'}),
                    tf.layers.dropout({rate: 0.2}),
                    tf.layers.dense({units: 16, activation: 'relu'}),
                    tf.layers.dense({units: 3}) // Production, Risque, Rendement
                ]
            });
            
            // Compiler le modèle
            this.model.compile({
                optimizer: 'adam',
                loss: 'meanSquaredError'
            });
            
            this.isReady = true;
            console.log('🤖 IA initialisée avec succès');
        } catch (error) {
            console.error('Erreur initialisation IA:', error);
        }
    },
    
    // Analyse des risques agricoles
    analyserRisques(donnees) {
        const risques = {
            climatique: this.calculerRisqueClimatique(donnees),
            hydrique: this.calculerRisqueHydrique(donnees),
            productivite: this.calculerRisqueProductivite(donnees),
            economique: this.calculerRisqueEconomique(donnees)
        };
        
        // Score global de risque
        risques.global = (risques.climatique + risques.hydrique + 
                         risques.productivite + risques.economique) / 4;
        
        return risques;
    },
    
    // Calcul du risque climatique
    calculerRisqueClimatique(donnees) {
        let score = 0;
        const tempMoyenne = donnees.reduce((sum, d) => sum + (d.temperature_2m_mean_saison || 0), 0) / donnees.length;
        
        // Température critique
        if (tempMoyenne > 35) score += 40;
        else if (tempMoyenne > 32) score += 25;
        else if (tempMoyenne > 30) score += 15;
        
        // Variabilité
        const tempStd = this.calculerEcartType(donnees.map(d => d.temperature_2m_mean_saison));
        if (tempStd > 5) score += 30;
        else if (tempStd > 3) score += 20;
        else if (tempStd > 2) score += 10;
        
        // Tendance
        const tendance = this.calculerTendance(donnees, 'temperature_2m_mean_saison');
        if (tendance > 0.5) score += 30;
        else if (tendance > 0.3) score += 20;
        
        return Math.min(100, score);
    },
    
    // Calcul du risque hydrique
    calculerRisqueHydrique(donnees) {
        let score = 0;
        const precipMoyenne = donnees.reduce((sum, d) => sum + (d.precipitation_sum_saison || 0), 0) / donnees.length;
        
        // Déficit pluviométrique
        if (precipMoyenne < 400) score += 40;
        else if (precipMoyenne < 500) score += 25;
        else if (precipMoyenne < 600) score += 15;
        
        // Variabilité
        const precipStd = this.calculerEcartType(donnees.map(d => d.precipitation_sum_saison));
        const cv = (precipStd / precipMoyenne) * 100; // Coefficient de variation
        if (cv > 40) score += 30;
        else if (cv > 30) score += 20;
        else if (cv > 20) score += 10;
        
        // Humidité du sol
        const humidMoyenne = donnees.reduce((sum, d) => sum + (d.soil_moisture_saison || 0), 0) / donnees.length;
        if (humidMoyenne < 0.2) score += 30;
        else if (humidMoyenne < 0.3) score += 20;
        
        return Math.min(100, score);
    },
    
    // Calcul du risque de productivité
    calculerRisqueProductivite(donnees) {
        let score = 0;
        
        // Grouper par année pour analyser les tendances
        const parAnnee = {};
        donnees.forEach(d => {
            if (!parAnnee[d.annee]) parAnnee[d.annee] = [];
            parAnnee[d.annee].push(d);
        });
        
        // Analyser le rendement
        const rendements = Object.values(parAnnee).map(annee => {
            const prod = annee.reduce((sum, d) => sum + (d.production || 0), 0);
            const sup = annee.reduce((sum, d) => sum + (d.superficie || 0), 0);
            return sup > 0 ? prod / sup : 0;
        });
        
        // Rendement faible
        const rendMoyen = rendements.reduce((a, b) => a + b, 0) / rendements.length;
        if (rendMoyen < 3) score += 40;
        else if (rendMoyen < 4) score += 25;
        else if (rendMoyen < 5) score += 15;
        
        // Baisse tendancielle
        const tendanceRend = this.calculerTendanceArray(rendements);
        if (tendanceRend < -0.1) score += 30;
        else if (tendanceRend < 0) score += 20;
        
        // Variabilité
        const rendStd = this.calculerEcartType(rendements);
        const cvRend = (rendStd / rendMoyen) * 100;
        if (cvRend > 30) score += 30;
        else if (cvRend > 20) score += 20;
        
        return Math.min(100, score);
    },
    
    // Calcul du risque économique
    calculerRisqueEconomique(donnees) {
        let score = 0;
        
        // Analyse de la concentration géographique
        const zonesProduction = {};
        donnees.forEach(d => {
            if (!zonesProduction[d.zones]) zonesProduction[d.zones] = 0;
            zonesProduction[d.zones] += d.production || 0;
        });
        
        const productions = Object.values(zonesProduction);
        const totalProd = productions.reduce((a, b) => a + b, 0);
        
        // Indice de concentration (Herfindahl)
        const hhi = productions.reduce((sum, prod) => {
            const part = prod / totalProd;
            return sum + (part * part);
        }, 0);
        
        if (hhi > 0.5) score += 30;
        else if (hhi > 0.3) score += 20;
        else if (hhi > 0.2) score += 10;
        
        // Dépendance climatique
        const correlation = this.calculerCorrelation(
            donnees.map(d => d.production),
            donnees.map(d => d.precipitation_sum_saison)
        );
        
        if (Math.abs(correlation) > 0.7) score += 40;
        else if (Math.abs(correlation) > 0.5) score += 25;
        else if (Math.abs(correlation) > 0.3) score += 15;
        
        // Volatilité de la production
        const volatilite = this.calculerVolatilite(donnees.map(d => d.production));
        if (volatilite > 0.4) score += 30;
        else if (volatilite > 0.3) score += 20;
        
        return Math.min(100, score);
    },
    
    // Générer des recommandations basées sur l'analyse
    genererRecommandations(donnees, risques) {
        const recommendations = [];
        
        // Recommandations selon le risque climatique
        if (risques.climatique > 70) {
            recommendations.push({
                type: 'urgent',
                categorie: 'Risque Climatique Élevé',
                titre: 'Adaptation urgente aux changements climatiques',
                actions: [
                    'Installer des systèmes d\'irrigation goutte-à-goutte pour optimiser l\'eau',
                    'Introduire des variétés résistantes à la chaleur (ex: NERICA pour le riz)',
                    'Mettre en place des brise-vents pour réduire l\'évapotranspiration',
                    'Développer l\'agroforesterie pour créer des microclimats favorables'
                ],
                impact: 'Réduction potentielle du risque de 40% en 2 saisons',
                investissement: 'Moyen à élevé',
                delai: '3-6 mois'
            });
        } else if (risques.climatique > 40) {
            recommendations.push({
                type: 'important',
                categorie: 'Risque Climatique Modéré',
                titre: 'Renforcement de la résilience climatique',
                actions: [
                    'Diversifier les dates de semis pour répartir les risques',
                    'Améliorer la gestion de l\'eau avec des bassins de rétention',
                    'Former les agriculteurs aux techniques d\'agriculture de conservation'
                ],
                impact: 'Stabilisation des rendements de 20%',
                investissement: 'Modéré',
                delai: '2-4 mois'
            });
        }
        
        // Recommandations selon le risque hydrique
        if (risques.hydrique > 70) {
            recommendations.push({
                type: 'urgent',
                categorie: 'Crise Hydrique Critique',
                titre: 'Plan d\'urgence pour la gestion de l\'eau',
                actions: [
                    'Réhabiliter d\'urgence les canaux d\'irrigation existants',
                    'Installer des capteurs d\'humidité du sol pour irrigation de précision',
                    'Créer des comités de gestion de l\'eau par zone',
                    'Développer la récupération des eaux de pluie'
                ],
                impact: 'Économie d\'eau de 30-40%',
                investissement: 'Élevé',
                delai: '1-3 mois'
            });
        }
        
        // Recommandations selon le risque de productivité
        if (risques.productivite > 60) {
            recommendations.push({
                type: 'important',
                categorie: 'Productivité en Déclin',
                titre: 'Programme d\'intensification agricole durable',
                actions: [
                    'Analyser les sols et ajuster la fertilisation',
                    'Introduire la rotation des cultures avec légumineuses',
                    'Mécaniser partiellement les opérations culturales',
                    'Renforcer l\'encadrement technique des producteurs'
                ],
                impact: 'Augmentation des rendements de 25-35%',
                investissement: 'Moyen',
                delai: '1 saison'
            });
        }
        
        // Recommandations économiques
        if (risques.economique > 50) {
            recommendations.push({
                type: 'strategique',
                categorie: 'Vulnérabilité Économique',
                titre: 'Diversification et création de valeur',
                actions: [
                    'Développer des cultures de contre-saison à haute valeur',
                    'Créer des unités de transformation locales',
                    'Établir des contrats avec des acheteurs garantis',
                    'Mettre en place un système d\'assurance agricole'
                ],
                impact: 'Augmentation des revenus de 40%',
                investissement: 'Variable',
                delai: '6-12 mois'
            });
        }
        
        // Recommandations générales basées sur l'IA
        recommendations.push({
            type: 'innovation',
            categorie: 'Optimisation par l\'IA',
            titre: 'Agriculture de précision guidée par l\'intelligence artificielle',
            actions: [
                'Déployer des drones pour la surveillance des cultures',
                'Utiliser l\'IA pour prédire les besoins en intrants',
                'Installer des stations météo connectées par zone',
                'Développer une application mobile pour les alertes précoces'
            ],
            impact: 'Optimisation globale de 30%',
            investissement: 'Progressif',
            delai: 'Déploiement sur 1 an'
        });
        
        return recommendations;
    },
    
    // Prédictions avec le modèle IA
    async predire(features) {
        if (!this.isReady) return null;
        
        try {
            const input = tf.tensor2d([features]);
            const prediction = await this.model.predict(input).data();
            input.dispose();
            
            return {
                production: prediction[0],
                risque: prediction[1],
                rendement: prediction[2]
            };
        } catch (error) {
            console.error('Erreur prédiction:', error);
            return null;
        }
    },
    
    // Simulation de scénarios
    simulerScenario(donnees, variations) {
        const resultats = [];
        const annees = [...new Set(donnees.map(d => d.annee))].sort();
        const derniereAnnee = Math.max(...annees);
        
        // Simuler les 3 prochaines années
        for (let i = 1; i <= 3; i++) {
            const annee = derniereAnnee + i;
            
            // Calculer les moyennes de base
            const moyennes = this.calculerMoyennes(donnees);
            
            // Appliquer les variations
            const tempSimulee = moyennes.temperature * (1 + variations.temperature / 100);
            const precipSimulee = moyennes.precipitation * (1 + variations.precipitation / 100);
            const superficieSimulee = moyennes.superficie * (1 + variations.superficie / 100);
            
            // Modèle de production simplifié
            // Production = f(superficie, precipitation, temperature)
            let productionSimulee = superficieSimulee * 5.5; // Rendement de base
            
            // Impact température
            if (tempSimulee > 35) productionSimulee *= 0.7;
            else if (tempSimulee > 32) productionSimulee *= 0.85;
            else if (tempSimulee > 30) productionSimulee *= 0.95;
            
            // Impact précipitations
            if (precipSimulee < 400) productionSimulee *= 0.6;
            else if (precipSimulee < 500) productionSimulee *= 0.8;
            else if (precipSimulee > 800) productionSimulee *= 1.1;
            
            resultats.push({
                annee,
                production: productionSimulee,
                superficie: superficieSimulee,
                rendement: productionSimulee / superficieSimulee,
                temperature: tempSimulee,
                precipitation: precipSimulee,
                confiance: 0.95 - (i * 0.1) // Diminue avec le temps
            });
        }
        
        return resultats;
    },
    
    // Utilitaires statistiques
    calculerEcartType(valeurs) {
        const moyenne = valeurs.reduce((a, b) => a + b, 0) / valeurs.length;
        const variance = valeurs.reduce((sum, val) => sum + Math.pow(val - moyenne, 2), 0) / valeurs.length;
        return Math.sqrt(variance);
    },
    
    calculerTendance(donnees, variable) {
        const valeurs = donnees.map(d => d[variable] || 0);
        return this.calculerTendanceArray(valeurs);
    },
    
    calculerTendanceArray(valeurs) {
        const n = valeurs.length;
        const x = Array.from({length: n}, (_, i) => i);
        const y = valeurs;
        
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
        
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        return slope;
    },
    
    calculerCorrelation(x, y) {
        const n = x.length;
        const sumX = x.reduce((a, b) => a + b, 0);
        const sumY = y.reduce((a, b) => a + b, 0);
        const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
        const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
        const sumY2 = y.reduce((sum, yi) => sum + yi * yi, 0);
        
        const num = n * sumXY - sumX * sumY;
        const den = Math.sqrt((n * sumX2 - sumX * sumX) * (n * sumY2 - sumY * sumY));
        
        return den === 0 ? 0 : num / den;
    },
    
    calculerVolatilite(valeurs) {
        const rendements = [];
        for (let i = 1; i < valeurs.length; i++) {
            if (valeurs[i-1] !== 0) {
                rendements.push((valeurs[i] - valeurs[i-1]) / valeurs[i-1]);
            }
        }
        return this.calculerEcartType(rendements);
    },
    
    calculerMoyennes(donnees) {
        const n = donnees.length;
        return {
            production: donnees.reduce((sum, d) => sum + (d.production || 0), 0) / n,
            superficie: donnees.reduce((sum, d) => sum + (d.superficie || 0), 0) / n,
            temperature: donnees.reduce((sum, d) => sum + (d.temperature_2m_mean_saison || 0), 0) / n,
            precipitation: donnees.reduce((sum, d) => sum + (d.precipitation_sum_saison || 0), 0) / n
        };
    }
};

// Initialisation au chargement
document.addEventListener('DOMContentLoaded', async function() {
    console.log('📊 Initialisation Dashboard Enhanced avec IA');
    
    // Initialiser l'IA
    await TchiaAI.init();
    
    // Configuration du sélecteur de fichier
    TchiaUtils.setupFileUpload('file-selector', onFileUploaded);
    
    // Écouter les événements
    document.addEventListener('donneesChargees', onDonneesChargees);
    document.addEventListener('donneesFiltrees', onDonneesFiltrees);
    
    // Initialiser les contrôles de simulation
    setupSimulationControls();
    
    // Si des données sont déjà disponibles
    if (donneesBrutes.length > 0) {
        analyserDonneesCompletes();
    }
});

// Callback après upload
function onFileUploaded(data) {
    console.log('✅ Fichier chargé:', data);
    document.getElementById('upload-row').style.display = 'none';
}

// Callback données chargées
function onDonneesChargees(event) {
    const { donnees } = event.detail;
    console.log('📊 Données chargées:', donnees.length);
    analyserDonneesCompletes();
}

// Callback données filtrées
function onDonneesFiltrees(event) {
    const { donnees, metrics } = event.detail;
    console.log('🔍 Données filtrées:', donnees.length);
    analyserDonneesCompletes();
}

// Analyse complète avec IA
async function analyserDonneesCompletes() {
    // Afficher l'indicateur de traitement IA
    document.getElementById('ai-processing').style.display = 'flex';
    
    // Calculer les métriques dynamiques
    calculerMetriquesDynamiques();
    
    // Analyser les risques avec l'IA
    const risques = TchiaAI.analyserRisques(donneesFilrees);
    afficherAnalyseRisques(risques);
    
    // Générer les recommandations IA
    const recommendations = TchiaAI.genererRecommandations(donneesFilrees, risques);
    afficherRecommandationsIA(recommendations);
    
    // Mettre à jour tous les graphiques
    mettreAJourTousLesGraphiques();
    
    // Mettre à jour le tableau avec scores IA
    mettreAJourTableauAvecIA(risques);
    
    // Masquer l'indicateur de traitement
    setTimeout(() => {
        document.getElementById('ai-processing').style.display = 'none';
    }, 1500);
}

// Calculer les métriques dynamiques
function calculerMetriquesDynamiques() {
    if (donneesFilrees.length === 0) return;
    
    // Grouper par année
    const parAnnee = {};
    donneesFilrees.forEach(d => {
        if (!parAnnee[d.annee]) {
            parAnnee[d.annee] = {
                production: 0,
                superficie: 0,
                temperature: [],
                precipitation: []
            };
        }
        parAnnee[d.annee].production += d.production || 0;
        parAnnee[d.annee].superficie += d.superficie || 0;
        parAnnee[d.annee].temperature.push(d.temperature_2m_mean_saison || 0);
        parAnnee[d.annee].precipitation.push(d.precipitation_sum_saison || 0);
    });
    
    const annees = Object.keys(parAnnee).sort();
    const derniereAnnee = annees[annees.length - 1];
    const avantDerniereAnnee = annees[annees.length - 2];
    
    // Production
    const productionActuelle = parAnnee[derniereAnnee].production;
    const productionPrecedente = avantDerniereAnnee ? parAnnee[avantDerniereAnnee].production : productionActuelle;
    const changeProduction = ((productionActuelle - productionPrecedente) / productionPrecedente * 100).toFixed(1);
    
    document.getElementById('total-production').textContent = TchiaUtils.formatNombre(productionActuelle, 't');
    updateMetricChange('production', changeProduction);
    
    // Superficie
    const superficieActuelle = parAnnee[derniereAnnee].superficie;
    const superficiePrecedente = avantDerniereAnnee ? parAnnee[avantDerniereAnnee].superficie : superficieActuelle;
    const changeSuperficie = ((superficieActuelle - superficiePrecedente) / superficiePrecedente * 100).toFixed(1);
    
    document.getElementById('total-superficie').textContent = TchiaUtils.formatNombre(superficieActuelle, 'ha');
    updateMetricChange('superficie', changeSuperficie);
    
    // Rendement
    const rendementActuel = superficieActuelle > 0 ? productionActuelle / superficieActuelle : 0;
    const rendementPrecedent = superficiePrecedente > 0 ? productionPrecedente / superficiePrecedente : 0;
    const changeRendement = ((rendementActuel - rendementPrecedent) / rendementPrecedent * 100).toFixed(1);
    
    document.getElementById('rendement-moyen').textContent = TchiaUtils.formatNombre(rendementActuel, 't/ha');
    updateMetricChange('rendement', changeRendement);
    
    // Température
    const tempActuelle = moyenne(parAnnee[derniereAnnee].temperature);
    const tempMoyenneHistorique = moyenne(
        Object.values(parAnnee).flatMap(a => a.temperature)
    );
    const changeTemp = (tempActuelle - tempMoyenneHistorique).toFixed(1);
    
    document.getElementById('temperature-moyenne').textContent = TchiaUtils.formatNombre(tempActuelle, '°C');
    document.getElementById('temperature-change').innerHTML = `
        <i class="bi bi-arrow-${changeTemp > 0 ? 'up' : 'down'}"></i>
        <span>${changeTemp > 0 ? '+' : ''}${changeTemp}°C vs moyenne historique</span>
    `;
    document.getElementById('temperature-change').className = `metric-change ${changeTemp > 1 ? 'change-negative' : 'change-neutral'}`;
    
    // Ajouter les mini-graphiques de tendance
    ajouterMiniTendances(parAnnee);
}

// Mettre à jour l'affichage des changements
function updateMetricChange(metric, value) {
    const element = document.getElementById(`${metric}-change`);
    const isPositive = parseFloat(value) > 0;
    element.innerHTML = `
        <i class="bi bi-arrow-${isPositive ? 'up' : 'down'}"></i>
        <span>${isPositive ? '+' : ''}${value}% vs année précédente</span>
    `;
    element.className = `metric-change ${isPositive ? 'change-positive' : 'change-negative'}`;
}

// Ajouter les mini-graphiques de tendance
function ajouterMiniTendances(parAnnee) {
    const annees = Object.keys(parAnnee).sort();
    
    // Production
    createSparkline('production-trend', 
        annees.map(a => parAnnee[a].production),
        '#2d5016'
    );
    
    // Superficie
    createSparkline('superficie-trend',
        annees.map(a => parAnnee[a].superficie),
        '#3b82f6'
    );
    
    // Rendement
    createSparkline('rendement-trend',
        annees.map(a => parAnnee[a].superficie > 0 ? parAnnee[a].production / parAnnee[a].superficie : 0),
        '#d97706'
    );
    
    // Température
    createSparkline('temperature-trend',
        annees.map(a => moyenne(parAnnee[a].temperature)),
        '#dc2626'
    );
}

// Créer un mini-graphique sparkline
function createSparkline(elementId, data, color) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    element.innerHTML = `<canvas width="80" height="30"></canvas>`;
    const canvas = element.querySelector('canvas');
    const ctx = canvas.getContext('2d');
    
    const width = canvas.width;
    const height = canvas.height;
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();
    
    data.forEach((value, i) => {
        const x = (i / (data.length - 1)) * (width - 4) + 2;
        const y = height - ((value - min) / range) * (height - 4) - 2;
        
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    });
    
    ctx.stroke();
    
    // Point final
    const lastX = width - 2;
    const lastY = height - ((data[data.length - 1] - min) / range) * (height - 4) - 2;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(lastX, lastY, 3, 0, 2 * Math.PI);
    ctx.fill();
}

// Afficher l'analyse des risques
function afficherAnalyseRisques(risques) {
    const container = document.getElementById('ai-analysis-content');
    
    const html = `
        <div class="row">
            <div class="col-md-3">
                <div class="risk-card ${getRiskClass(risques.climatique)}">
                    <div class="risk-icon">
                        <i class="bi bi-thermometer-half"></i>
                    </div>
                    <div class="risk-score">${risques.climatique}%</div>
                    <div class="risk-label">Risque Climatique</div>
                    <div class="risk-bar">
                        <div class="risk-bar-fill" style="width: ${risques.climatique}%"></div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="risk-card ${getRiskClass(risques.hydrique)}">
                    <div class="risk-icon">
                        <i class="bi bi-droplet"></i>
                    </div>
                    <div class="risk-score">${risques.hydrique}%</div>
                    <div class="risk-label">Risque Hydrique</div>
                    <div class="risk-bar">
                        <div class="risk-bar-fill" style="width: ${risques.hydrique}%"></div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="risk-card ${getRiskClass(risques.productivite)}">
                    <div class="risk-icon">
                        <i class="bi bi-graph-down"></i>
                    </div>
                    <div class="risk-score">${risques.productivite}%</div>
                    <div class="risk-label">Risque Productivité</div>
                    <div class="risk-bar">
                        <div class="risk-bar-fill" style="width: ${risques.productivite}%"></div>
                    </div>
                </div>
            </div>
            <div class="col-md-3">
                <div class="risk-card ${getRiskClass(risques.economique)}">
                    <div class="risk-icon">
                        <i class="bi bi-currency-dollar"></i>
                    </div>
                    <div class="risk-score">${risques.economique}%</div>
                    <div class="risk-label">Risque Économique</div>
                    <div class="risk-bar">
                        <div class="risk-bar-fill" style="width: ${risques.economique}%"></div>
                    </div>
                </div>
            </div>
        </div>
        <div class="risk-summary mt-3">
            <h5>Score Global de Risque: <span class="${getRiskClass(risques.global)}">${risques.global.toFixed(0)}%</span></h5>
            <p class="mb-0">L'IA a analysé ${donneesFilrees.length} enregistrements pour évaluer les risques agricoles.</p>
        </div>
    `;
    
    container.innerHTML = html;
}

// Déterminer la classe CSS selon le niveau de risque
function getRiskClass(score) {
    if (score >= 70) return 'risk-high';
    if (score >= 40) return 'risk-medium';
    return 'risk-low';
}

// Afficher les indicateurs de risques
function afficherIndicateursRisques(risques) {
    const container = document.getElementById('risk-indicators-container');
    
    const indicators = [
        {
            titre: 'Stress Thermique',
            valeur: risques.climatique > 60 ? 'Élevé' : risques.climatique > 30 ? 'Modéré' : 'Faible',
            icon: 'thermometer-high',
            color: risques.climatique > 60 ? 'danger' : risques.climatique > 30 ? 'warning' : 'success'
        },
        {
            titre: 'Déficit Hydrique',
            valeur: risques.hydrique > 60 ? 'Critique' : risques.hydrique > 30 ? 'Important' : 'Gérable',
            icon: 'moisture',
            color: risques.hydrique > 60 ? 'danger' : risques.hydrique > 30 ? 'warning' : 'success'
        },
        {
            titre: 'Tendance Production',
            valeur: risques.productivite > 60 ? 'Déclin' : risques.productivite > 30 ? 'Stagnation' : 'Croissance',
            icon: 'graph-up',
            color: risques.productivite > 60 ? 'danger' : risques.productivite > 30 ? 'warning' : 'success'
        },
        {
            titre: 'Stabilité Économique',
            valeur: risques.economique > 60 ? 'Instable' : risques.economique > 30 ? 'Variable' : 'Stable',
            icon: 'cash-stack',
            color: risques.economique > 60 ? 'danger' : risques.economique > 30 ? 'warning' : 'success'
        }
    ];
    
    container.innerHTML = indicators.map(ind => `
        <div class="col-md-3 mb-3">
            <div class="indicator-card ${ind.color}">
                <i class="bi bi-${ind.icon}"></i>
                <h6>${ind.titre}</h6>
                <div class="indicator-value">${ind.valeur}</div>
            </div>
        </div>
    `).join('');
}

// Afficher les recommandations IA
function afficherRecommandationsIA(recommendations) {
    const container = document.getElementById('ai-recommendations-container');
    
    const html = recommendations.map(rec => `
        <div class="recommendation-card ${rec.type}">
            <div class="recommendation-header">
                <span class="recommendation-category">${rec.categorie}</span>
                <span class="recommendation-priority">${getPriorityLabel(rec.type)}</span>
            </div>
            <h5 class="recommendation-title">${rec.titre}</h5>
            <div class="recommendation-actions">
                <h6>Actions recommandées:</h6>
                <ul>
                    ${rec.actions.map(action => `<li>${action}</li>`).join('')}
                </ul>
            </div>
            <div class="recommendation-meta">
                <div class="meta-item">
                    <i class="bi bi-graph-up"></i>
                    <span>Impact: ${rec.impact}</span>
                </div>
                <div class="meta-item">
                    <i class="bi bi-currency-dollar"></i>
                    <span>Investissement: ${rec.investissement}</span>
                </div>
                <div class="meta-item">
                    <i class="bi bi-clock"></i>
                    <span>Délai: ${rec.delai}</span>
                </div>
            </div>
        </div>
    `).join('');
    
    container.innerHTML = html;
}

// Obtenir le label de priorité
function getPriorityLabel(type) {
    const labels = {
        urgent: 'Priorité Critique',
        important: 'Priorité Haute',
        strategique: 'Stratégique',
        innovation: 'Innovation'
    };
    return labels[type] || 'Normal';
}

// Mettre à jour tous les graphiques
function mettreAJourTousLesGraphiques() {
    // Graphique évolution multi-facteurs
    creerGraphiqueEvolutionAvance();
    
    // Graphique zones dynamique
    mettreAJourGraphiqueZones();
    
    // Matrice de corrélations
    creerMatriceCorrelations();
    
    // Heatmap temporelle
    creerHeatmapTemporelle();
    
    // Graphiques analytiques
    creerGraphiqueHydrologique();
    creerGraphiqueEfficience();
    creerGraphiqueObjectifs();
    
    // Graphique prédictions
    creerGraphiquePredictions();
}

// Graphique évolution avancé
function creerGraphiqueEvolutionAvance() {
    const ctx = document.getElementById('chart-evolution');
    if (!ctx) return;
    
    if (chartEvolution) {
        TchiaUtils.detruireGraphique(chartEvolution);
    }
    
    // Préparer les données
    const parAnneeSaison = {};
    donneesFilrees.forEach(d => {
        const key = `${d.annee}-${d.saison}`;
        if (!parAnneeSaison[key]) {
            parAnneeSaison[key] = {
                production: 0,
                superficie: 0,
                temperature: [],
                precipitation: [],
                humidite: []
            };
        }
        parAnneeSaison[key].production += d.production || 0;
        parAnneeSaison[key].superficie += d.superficie || 0;
        parAnneeSaison[key].temperature.push(d.temperature_2m_mean_saison || 0);
        parAnneeSaison[key].precipitation.push(d.precipitation_sum_saison || 0);
        parAnneeSaison[key].humidite.push(d.soil_moisture_saison || 0);
    });
    
    const labels = Object.keys(parAnneeSaison).sort();
    const data = labels.map(label => {
        const d = parAnneeSaison[label];
        return {
            production: d.production,
            rendement: d.superficie > 0 ? d.production / d.superficie : 0,
            temperature: moyenne(d.temperature),
            precipitation: moyenne(d.precipitation),
            humidite: moyenne(d.humidite)
        };
    });
    
    chartEvolution = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Production (t)',
                data: data.map(d => d.production),
                borderColor: '#2d5016',
                backgroundColor: 'rgba(45, 80, 22, 0.1)',
                yAxisID: 'y-production',
                tension: 0.3,
                borderWidth: 3
            }, {
                label: 'Rendement (t/ha)',
                data: data.map(d => d.rendement),
                borderColor: '#d97706',
                backgroundColor: 'rgba(217, 119, 6, 0.1)',
                yAxisID: 'y-rendement',
                tension: 0.3,
                borderWidth: 2,
                borderDash: [5, 5]
            }, {
                label: 'Précipitations (mm)',
                data: data.map(d => d.precipitation),
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                yAxisID: 'y-precipitation',
                tension: 0.3,
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                mode: 'index',
                intersect: false
            },
            plugins: {
                legend: {
                    position: 'top',
                    labels: {
                        usePointStyle: true,
                        padding: 15
                    }
                },
                tooltip: {
                    callbacks: {
                        afterBody: function(context) {
                            const index = context[0].dataIndex;
                            return `Température: ${data[index].temperature.toFixed(1)}°C\nHumidité sol: ${(data[index].humidite * 100).toFixed(1)}%`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        display: false
                    }
                },
                'y-production': {
                    type: 'linear',
                    display: true,
                    position: 'left',
                    title: {
                        display: true,
                        text: 'Production (t)'
                    }
                },
                'y-rendement': {
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
                },
                'y-precipitation': {
                    type: 'linear',
                    display: false
                }
            }
        }
    });
}

// Matrice de corrélations
function creerMatriceCorrelations() {
    const ctx = document.getElementById('chart-correlations');
    if (!ctx) return;
    
    if (chartCorrelations) {
        TchiaUtils.detruireGraphique(chartCorrelations);
    }
    
    // Variables à analyser
    const variables = ['production', 'superficie', 'temperature_2m_mean_saison', 
                      'precipitation_sum_saison', 'soil_moisture_saison'];
    const labels = ['Production', 'Superficie', 'Température', 'Précipitations', 'Humidité Sol'];
    
    // Calculer la matrice de corrélation
    const matrix = [];
    for (let i = 0; i < variables.length; i++) {
        const row = [];
        for (let j = 0; j < variables.length; j++) {
            const x = donneesFilrees.map(d => d[variables[i]] || 0);
            const y = donneesFilrees.map(d => d[variables[j]] || 0);
            row.push(TchiaAI.calculerCorrelation(x, y));
        }
        matrix.push(row);
    }
    
    // Créer les données pour le heatmap
    const heatmapData = [];
    for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix[i].length; j++) {
            heatmapData.push({
                x: labels[j],
                y: labels[i],
                v: matrix[i][j]
            });
        }
    }
    
    chartCorrelations = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Corrélation',
                data: heatmapData,
                backgroundColor: function(context) {
                    const value = context.raw.v;
                    const alpha = Math.abs(value);
                    if (value > 0) {
                        return `rgba(45, 80, 22, ${alpha})`;
                    } else {
                        return `rgba(220, 38, 38, ${alpha})`;
                    }
                },
                borderColor: 'rgba(0,0,0,0.1)',
                borderWidth: 1,
                pointRadius: 20
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'category',
                    labels: labels,
                    grid: {
                        display: false
                    }
                },
                y: {
                    type: 'category',
                    labels: labels,
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Corrélation: ${context.raw.v.toFixed(3)}`;
                        }
                    }
                }
            }
        }
    });
}

// Heatmap temporelle
function creerHeatmapTemporelle() {
    const ctx = document.getElementById('chart-heatmap');
    if (!ctx) return;
    
    if (chartHeatmap) {
        TchiaUtils.detruireGraphique(chartHeatmap);
    }
    
    // Préparer les données par mois et zone
    const heatmapData = [];
    const zones = [...new Set(donneesFilrees.map(d => d.zones))];
    const mois = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    
    zones.forEach((zone, zoneIndex) => {
        mois.forEach((moisNom, moisIndex) => {
            const donneesZoneMois = donneesFilrees.filter(d => 
                d.zones === zone && new Date(d.date).getMonth() === moisIndex
            );
            
            if (donneesZoneMois.length > 0) {
                const rendement = donneesZoneMois.reduce((sum, d) => {
                    return sum + (d.superficie > 0 ? d.production / d.superficie : 0);
                }, 0) / donneesZoneMois.length;
                
                heatmapData.push({
                    x: moisNom,
                    y: zone,
                    v:  rendement
                });
            }
        });
    });
    
    chartHeatmap = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Rendement',
                data: heatmapData,
                backgroundColor: function(context) {
                    console.log("pop", context);
                    if (!context.raw) return 'rgba(0,0,0,0)'; // Couleur transparente par défaut
                    const value = context.raw.v;
                    const max = Math.max(...heatmapData.map(d => d.v));
                    const intensity = value / max;
                    return `rgba(45, 80, 22, ${intensity})`;
                },
                pointRadius: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    type: 'category',
                    labels: mois,
                    grid: {
                        display: false
                    }
                },
                y: {
                    type: 'category',
                    labels: zones,
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `Rendement: ${context.raw.v.toFixed(2)} t/ha`;
                        }
                    }
                }
            }
        }
    });
}

// Graphique hydrologique
function creerGraphiqueHydrologique() {
    const ctx = document.getElementById('chart-hydro');
    if (!ctx) return;
    
    if (chartHydro) {
        TchiaUtils.detruireGraphique(chartHydro);
    }
    
    // Analyser la relation eau-production
    const dataPoints = donneesFilrees.map(d => ({
        x: d.precipitation_sum_saison || 0,
        y: d.superficie > 0 ? d.production / d.superficie : 0,
        r: Math.sqrt(d.superficie || 0) / 10
    }));
    
    chartHydro = new Chart(ctx, {
        type: 'bubble',
        data: {
            datasets: [{
                label: 'Relation Eau-Rendement',
                data: dataPoints,
                backgroundColor: 'rgba(59, 130, 246, 0.6)',
                borderColor: '#3b82f6',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Précipitations (mm)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Rendement (t/ha)'
                    }
                }
            },
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return [
                                `Précipitations: ${context.raw.x.toFixed(0)} mm`,
                                `Rendement: ${context.raw.y.toFixed(2)} t/ha`,
                                `Superficie: ${(context.raw.r * 10).toFixed(0)}² ha`
                            ];
                        }
                    }
                }
            }
        }
    });
}

// Graphique efficience
function creerGraphiqueEfficience() {
    const ctx = document.getElementById('chart-efficience');
    if (!ctx) return;
    
    if (chartEfficience) {
        TchiaUtils.detruireGraphique(chartEfficience);
    }
    
    // Calculer l'efficience par zone
    const efficienceParZone = {};
    donneesFilrees.forEach(d => {
        if (!efficienceParZone[d.zones]) {
            efficienceParZone[d.zones] = {
                production: 0,
                superficie: 0,
                eau: 0
            };
        }
        efficienceParZone[d.zones].production += d.production || 0;
        efficienceParZone[d.zones].superficie += d.superficie || 0;
        efficienceParZone[d.zones].eau += (d.precipitation_sum_saison || 0) * (d.superficie || 0);
    });
    
    const zones = Object.keys(efficienceParZone);
    const efficiences = zones.map(zone => {
        const data = efficienceParZone[zone];
        const rendement = data.superficie > 0 ? data.production / data.superficie : 0;
        const eauParHa = data.superficie > 0 ? data.eau / data.superficie : 0;
        return eauParHa > 0 ? (rendement * 1000) / eauParHa : 0; // kg/m³
    });
    
    chartEfficience = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: zones,
            datasets: [{
                label: 'Efficience hydrique (kg/m³)',
                data: efficiences,
                backgroundColor: zones.map((_, i) => 
                    `hsla(${120 + i * 30}, 70%, 50%, 0.8)`
                ),
                borderRadius: 8
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
                    title: {
                        display: true,
                        text: 'Efficience (kg/m³)'
                    }
                }
            }
        }
    });
}

// Graphique objectifs
function creerGraphiqueObjectifs() {
    const ctx = document.getElementById('chart-objectifs');
    if (!ctx) return;
    
    if (chartObjectifs) {
        TchiaUtils.detruireGraphique(chartObjectifs);
    }
    
    // Définir des objectifs (simulation)
    const objectifs = {
        production: 50000,
        superficie: 10000,
        rendement: 6
    };
    
    // Calculer les réalisations
    const realisations = {
        production: donneesFilrees.reduce((sum, d) => sum + (d.production || 0), 0),
        superficie: donneesFilrees.reduce((sum, d) => sum + (d.superficie || 0), 0),
        rendement: 0
    };
    realisations.rendement = realisations.superficie > 0 ? 
        realisations.production / realisations.superficie : 0;
    
    // Calculer les pourcentages
    const pourcentages = {
        production: (realisations.production / objectifs.production) * 100,
        superficie: (realisations.superficie / objectifs.superficie) * 100,
        rendement: (realisations.rendement / objectifs.rendement) * 100
    };
    
    chartObjectifs = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Production', 'Superficie', 'Rendement'],
            datasets: [{
                label: 'Objectif (100%)',
                data: [100, 100, 100],
                borderColor: 'rgba(45, 80, 22, 0.5)',
                backgroundColor: 'rgba(45, 80, 22, 0.1)',
                borderDash: [5, 5]
            }, {
                label: 'Réalisation',
                data: Object.values(pourcentages),
                borderColor: '#d97706',
                backgroundColor: 'rgba(217, 119, 6, 0.3)',
                borderWidth: 3
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    max: 120,
                    ticks: {
                        stepSize: 20
                    }
                }
            }
        }
    });
}

// Graphique prédictions
function creerGraphiquePredictions() {
    const ctx = document.getElementById('chart-predictions');
    if (!ctx) return;
    
    if (chartPredictions) {
        TchiaUtils.detruireGraphique(chartPredictions);
    }
    
    // Données historiques
    const historique = {};
    donneesFilrees.forEach(d => {
        if (!historique[d.annee]) {
            historique[d.annee] = 0;
        }
        historique[d.annee] += d.production || 0;
    });
    
    const annees = Object.keys(historique).sort();
    const productions = annees.map(a => historique[a]);
    
    // Générer des prédictions simples
    const derniereAnnee = parseInt(annees[annees.length - 1]);
    const predictions = TchiaAI.simulerScenario(donneesFilrees, {
        temperature: 0,
        precipitation: 0,
        superficie: 5
    });
    
    chartPredictions = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [...annees, ...predictions.map(p => p.annee.toString())],
            datasets: [{
                label: 'Production historique',
                data: [...productions, ...Array(predictions.length).fill(null)],
                borderColor: '#2d5016',
                backgroundColor: 'rgba(45, 80, 22, 0.1)',
                borderWidth: 3
            }, {
                label: 'Prédiction IA',
                data: [...Array(productions.length - 1).fill(null), 
                       productions[productions.length - 1],
                       ...predictions.map(p => p.production)],
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderDash: [10, 5],
                borderWidth: 3
            }, {
                label: 'Intervalle de confiance',
                data: [...Array(productions.length - 1).fill(null),
                       productions[productions.length - 1],
                       ...predictions.map(p => p.production * 1.15)],
                borderColor: 'rgba(59, 130, 246, 0.3)',
                backgroundColor: 'rgba(59, 130, 246, 0.05)',
                borderWidth: 1,
                fill: '+1'
            }, {
                label: 'Intervalle de confiance inf',
                data: [...Array(productions.length - 1).fill(null),
                       productions[productions.length - 1],
                       ...predictions.map(p => p.production * 0.85)],
                borderColor: 'rgba(59, 130, 246, 0.3)',
                backgroundColor: 'transparent',
                borderWidth: 1,
                showLine: true,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: true,
                    labels: {
                        filter: function(item) {
                            return !item.text.includes('inf');
                        }
                    }
                }
            },
            scales: {
                y: {
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

// Mettre à jour le tableau avec scores IA
function mettreAJourTableauAvecIA(risquesGlobaux) {
    const tbody = document.getElementById('performance-tbody');
    if (!tbody || donneesFilrees.length === 0) return;
    
    tbody.innerHTML = '';
    
    // Grouper par zone
    const donneesParZone = {};
    donneesFilrees.forEach(row => {
        if (!donneesParZone[row.zones]) {
            donneesParZone[row.zones] = [];
        }
        donneesParZone[row.zones].push(row);
    });
    
    // Créer les lignes
    Object.entries(donneesParZone).forEach(([zone, donnees]) => {
        const productionTotale = donnees.reduce((sum, row) => sum + (parseFloat(row.production) || 0), 0);
        const superficieTotale = donnees.reduce((sum, row) => sum + (parseFloat(row.superficie) || 0), 0);
        const rendement = superficieTotale > 0 ? productionTotale / superficieTotale : 0;
        const tempMoyenne = donnees.reduce((sum, row) => sum + (parseFloat(row.temperature_2m_mean_saison) || 0), 0) / donnees.length;
        const precipMoyenne = donnees.reduce((sum, row) => sum + (parseFloat(row.precipitation_sum_saison) || 0), 0) / donnees.length;
        
        // Calculer le risque spécifique à la zone
        const risqueZone = TchiaAI.analyserRisques(donnees);
        const scoreIA = (100 - risqueZone.global).toFixed(0);
        
        // Calculer la tendance
        const tendance = calculerTendanceZone(donnees);
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td><strong>${zone}</strong></td>
            <td>${TchiaUtils.formatNombre(productionTotale, 't')}</td>
            <td>${TchiaUtils.formatNombre(superficieTotale, 'ha')}</td>
            <td>${TchiaUtils.formatNombre(rendement, 't/ha')}</td>
            <td>${TchiaUtils.formatNombre(tempMoyenne, '°C')}</td>
            <td>${TchiaUtils.formatNombre(precipMoyenne, 'mm')}</td>
            <td>
                <div class="risk-indicator ${getRiskClass(risqueZone.global)}">
                    ${risqueZone.global.toFixed(0)}%
                </div>
            </td>
            <td>
                <div class="trend-indicator ${tendance.class}">
                    <i class="bi bi-${tendance.icon}"></i>
                    ${tendance.value}%
                </div>
            </td>
            <td>
                <div class="ai-score ${getScoreClass(scoreIA)}">
                    ${scoreIA}/100
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Calculer la tendance d'une zone
function calculerTendanceZone(donnees) {
    const parAnnee = {};
    donnees.forEach(d => {
        if (!parAnnee[d.annee]) parAnnee[d.annee] = 0;
        parAnnee[d.annee] += d.production || 0;
    });
    
    const annees = Object.keys(parAnnee).sort();
    if (annees.length < 2) {
        return { value: 0, class: 'neutral', icon: 'dash' };
    }
    
    const productions = annees.map(a => parAnnee[a]);
    const tendance = TchiaAI.calculerTendanceArray(productions);
    const pourcentage = (tendance / productions[0] * 100).toFixed(1);
    
    if (tendance > 0.1) {
        return { value: `+${pourcentage}`, class: 'positive', icon: 'arrow-up' };
    } else if (tendance < -0.1) {
        return { value: pourcentage, class: 'negative', icon: 'arrow-down' };
    } else {
        return { value: '±0', class: 'neutral', icon: 'arrow-right' };
    }
}

// Obtenir la classe du score
function getScoreClass(score) {
    if (score >= 80) return 'score-excellent';
    if (score >= 60) return 'score-good';
    if (score >= 40) return 'score-medium';
    return 'score-low';
}

// Mettre à jour le graphique des zones
function mettreAJourGraphiqueZones() {
    const metric = document.getElementById('zone-metric-select').value;
    TchiaUtils.chargerDonneesGraphique('zones', data => {
        creerGraphiqueZonesDynamique(data, metric);
    });
}

// Créer le graphique des zones dynamique
function creerGraphiqueZonesDynamique(data, metric) {
    const ctx = document.getElementById('chart-zones');
    if (!ctx) return;
    
    if (chartZones) {
        TchiaUtils.detruireGraphique(chartZones);
    }
    
    // Calculer les données selon la métrique
    const donneesParZone = {};
    donneesFilrees.forEach(d => {
        if (!donneesParZone[d.zones]) {
            donneesParZone[d.zones] = {
                production: 0,
                superficie: 0
            };
        }
        donneesParZone[d.zones].production += d.production || 0;
        donneesParZone[d.zones].superficie += d.superficie || 0;
    });
    
    const zones = Object.keys(donneesParZone);
    let valeurs;
    
    switch(metric) {
        case 'superficie':
            valeurs = zones.map(z => donneesParZone[z].superficie);
            break;
        case 'rendement':
            valeurs = zones.map(z => 
                donneesParZone[z].superficie > 0 ? 
                donneesParZone[z].production / donneesParZone[z].superficie : 0
            );
            break;
        default:
            valeurs = zones.map(z => donneesParZone[z].production);
    }
    
    const colors = [
        '#2d5016', '#3a6b1c', '#4a7c59', '#1e3a8a', 
        '#d97706', '#7c3aed', '#059669', '#dc2626'
    ];
    
    chartZones = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: zones,
            datasets: [{
                data: valeurs,
                backgroundColor: colors.slice(0, zones.length),
                borderWidth: 3,
                borderColor: '#ffffff',
                hoverBorderWidth: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
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
                            let value;
                            switch(metric) {
                                case 'superficie':
                                    value = TchiaUtils.formatNombre(context.parsed, 'ha');
                                    break;
                                case 'rendement':
                                    value = TchiaUtils.formatNombre(context.parsed, 't/ha');
                                    break;
                                default:
                                    value = TchiaUtils.formatNombre(context.parsed, 't');
                            }
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

// Contrôles de simulation
function setupSimulationControls() {
    ['temp', 'precip', 'superficie'].forEach(param => {
        const slider = document.getElementById(`${param}-variation`);
        const valueDisplay = document.getElementById(`${param}-value`);
        
        if (slider && valueDisplay) {
            slider.addEventListener('input', function() {
                const value = this.value;
                let suffix = param === 'temp' ? '°C' : '%';
                valueDisplay.textContent = `${value > 0 ? '+' : ''}${value}${suffix}`;
            });
        }
    });
}

// Lancer la simulation
window.lancerSimulation = async function() {
    if (donneesFilrees.length === 0) {
        alert('Veuillez charger des données avant de lancer une simulation');
        return;
    }
    
    // Récupérer les paramètres
    const variations = {
        temperature: parseFloat(document.getElementById('temp-variation').value),
        precipitation: parseFloat(document.getElementById('precip-variation').value),
        superficie: parseFloat(document.getElementById('superficie-variation').value)
    };
    
    // Afficher un indicateur de chargement
    const resultsContainer = document.getElementById('simulation-results');
    resultsContainer.innerHTML = '<div class="text-center"><div class="spinner-border" role="status"></div></div>';
    
    // Simuler avec l'IA
    const resultats = TchiaAI.simulerScenario(donneesFilrees, variations);
    
    // Afficher les résultats
    let html = '<h6>Résultats de la simulation IA:</h6>';
    
    resultats.forEach(res => {
        const impact = ((res.production - donneesFilrees.reduce((sum, d) => sum + (d.production || 0), 0)) / 
                       donneesFilrees.reduce((sum, d) => sum + (d.production || 0), 0) * 100).toFixed(1);
        
        html += `
            <div class="simulation-result-item">
                <strong>Année ${res.annee}:</strong><br>
                Production: ${TchiaUtils.formatNombre(res.production, 't')}<br>
                Rendement: ${TchiaUtils.formatNombre(res.rendement, 't/ha')}<br>
                Impact: <span class="${impact > 0 ? 'text-success' : 'text-danger'}">${impact > 0 ? '+' : ''}${impact}%</span><br>
                Confiance: ${(res.confiance * 100).toFixed(0)}%
            </div>
        `;
    });
    
    resultsContainer.innerHTML = html;
    
    // Mettre à jour le graphique de prédiction
    creerGraphiquePredictions();
};

// Changer le type de graphique évolution
window.changerTypeGraphique = function(type) {
    // Alterner entre différentes visualisations
    creerGraphiqueEvolutionAvance();
};

// Utilitaire pour calculer la moyenne
function moyenne(arr) {
    return arr.reduce((a, b) => a + b, 0) / arr.length || 0;
}