

/**
 * TCHIA Analytics - JavaScript pour la page Exports & Rapports
 */

// Variables globales pour les exports
let exportConfig = {
    format: 'csv',
    periode: { debut: '2018-01-01', fin: '2023-12-31' },
    zones: ['all'],
    variables: ['production', 'superficie', 'rendement', 'temperature', 'precipitation'],
    options: {
        formatNombres: 'standard',
        separateur: ',',
        encodage: 'utf-8',
        inclureHeaders: true,
        inclureMetadata: false
    }
};

// Historique des exports (simulé)
let historiqueExports = [
    { id: 'pdf_20250624_1430', date: '24/06/2025 14:30', type: 'PDF', taille: '2.4 MB' },
    { id: 'excel_20250623_0915', date: '23/06/2025 09:15', type: 'Excel', taille: '1.8 MB' },
    { id: 'csv_20250622_1645', date: '22/06/2025 16:45', type: 'CSV', taille: '856 KB' }
];

// Templates de rapports
let templates = [
    {
        id: 1,
        nom: 'Rapport Performance Zones',
        description: 'Analyse détaillée des performances par zone avec graphiques et recommandations',
        dateCreation: '15/06/2025',
        derniereUtilisation: '20/06/2025'
    },
    {
        id: 2,
        nom: 'Analyse Météo Détaillée',
        description: 'Focus sur les données météorologiques et leur impact sur les cultures',
        dateCreation: '10/06/2025',
        derniereUtilisation: '18/06/2025'
    }
];

// Initialisation
document.addEventListener('DOMContentLoaded', function() {
    console.log('📥 Initialisation page Exports');
    
    // Écouter les événements de données
    document.addEventListener('donneesChargees', onDonneesChargees);
    
    // Initialiser les composants
    initialiserFormulaires();
    
    // Si des données sont déjà disponibles
    if (donneesBrutes.length > 0) {
        mettreAJourOptionsExport();
    }
});

// Callback données chargées
function onDonneesChargees(event) {
    console.log('📊 Données chargées pour exports');
    mettreAJourOptionsExport();
}

// Initialiser les formulaires
function initialiserFormulaires() {
    // Date par défaut
    const dateDebut = document.getElementById('export-date-debut');
    const dateFin = document.getElementById('export-date-fin');
    
    if (dateDebut && dateFin) {
        const aujourd = new Date();
        dateFin.value = aujourd.toISOString().split('T')[0];
        
        const ilYa5Ans = new Date();
        ilYa5Ans.setFullYear(aujourd.getFullYear() - 5);
        dateDebut.value = ilYa5Ans.toISOString().split('T')[0];
    }
    
    // Événements
    document.querySelectorAll('input[type="checkbox"], select').forEach(element => {
        element.addEventListener('change', updateExportConfig);
    });
}

// Mettre à jour les options d'export
function mettreAJourOptionsExport() {
    // Remplir la liste des zones
    const selectZones = document.getElementById('export-zones');
    if (selectZones && donneesBrutes.length > 0) {
        const zones = [...new Set(donneesBrutes.map(row => row.zones))].sort();
        
        selectZones.innerHTML = '<option value="all" selected>Toutes les zones</option>';
        zones.forEach(zone => {
            const option = document.createElement('option');
            option.value = zone;
            option.textContent = zone;
            selectZones.appendChild(option);
        });
    }
    
    // Mettre à jour les statistiques
    updateExportStats();
}

// Mettre à jour la configuration d'export
function updateExportConfig() {
    // Récupérer toutes les options
    exportConfig.periode.debut = document.getElementById('export-date-debut').value;
    exportConfig.periode.fin = document.getElementById('export-date-fin').value;
    
    const zonesSelect = document.getElementById('export-zones');
    exportConfig.zones = Array.from(zonesSelect.selectedOptions).map(opt => opt.value);
    
    // Variables à exporter
    exportConfig.variables = [];
    ['production', 'superficie', 'rendement', 'temperature', 'precipitation', 'humidite'].forEach(variable => {
        if (document.getElementById(`var-${variable}`)?.checked) {
            exportConfig.variables.push(variable);
        }
    });
    
    // Options de formatage
    exportConfig.options.formatNombres = document.getElementById('export-format-nombres').value;
    exportConfig.options.separateur = document.getElementById('export-separateur').value;
    exportConfig.options.encodage = document.getElementById('export-encodage').value;
    exportConfig.options.inclureHeaders = document.getElementById('export-headers').checked;
    exportConfig.options.inclureMetadata = document.getElementById('export-metadata').checked;
    
    updateExportStats();
}

// Mettre à jour les statistiques d'export
function updateExportStats() {
    // Calculer le nombre de lignes qui seront exportées
    let donneesFilrees = donneesBrutes;
    
    // Filtrer par période
    if (exportConfig.periode.debut) {
        donneesFilrees = donneesFilrees.filter(row => {
            const dateRow = `${row.annee}-01-01`;
            return dateRow >= exportConfig.periode.debut;
        });
    }
    
    if (exportConfig.periode.fin) {
        donneesFilrees = donneesFilrees.filter(row => {
            const dateRow = `${row.annee}-12-31`;
            return dateRow <= exportConfig.periode.fin;
        });
    }
    
    // Filtrer par zones
    if (!exportConfig.zones.includes('all')) {
        donneesFilrees = donneesFilrees.filter(row => 
            exportConfig.zones.includes(row.zones)
        );
    }
    
    console.log(`📊 ${donneesFilrees.length} lignes à exporter`);
}

// Export CSV
window.exporterCSV = function() {
    showExportProgress('CSV');
    
    const options = {
        allData: document.getElementById('csv-all-data')?.checked,
        filtered: document.getElementById('csv-filtered')?.checked,
        statistics: document.getElementById('csv-statistics')?.checked
    };
    
    // Simuler la progression
    let progress = 0;
    const interval = setInterval(() => {
        progress += 10;
        updateExportProgress(progress, 'Traitement des données...');
        
        if (progress >= 100) {
            clearInterval(interval);
            hideExportProgress();
            
            // Déclencher le téléchargement via l'API Django
            window.exporterCSV(); // Utiliser la fonction globale du main.js
            
            // Ajouter à l'historique
            ajouterHistorique('CSV', '1.2 MB');
            
            TchiaUtils.showNotification('success', 'Export CSV terminé avec succès');
        }
    }, 200);
};

// Générer rapport PDF
window.genererRapportPDF = function() {
    showExportProgress('PDF');
    
    const typeRapport = document.getElementById('pdf-type').value;
    const inclureGraphiques = document.getElementById('pdf-graphs').checked;
    const inclureRecommandations = document.getElementById('pdf-recommandations').checked;
    
    // Simuler la génération
    let progress = 0;
    const etapes = [
        'Collecte des données...',
        'Génération des graphiques...',
        'Création du document...',
        'Finalisation du PDF...'
    ];
    
    let etapeIndex = 0;
    const interval = setInterval(() => {
        progress += 5;
        
        if (progress % 25 === 0 && etapeIndex < etapes.length) {
            updateExportProgress(progress, etapes[etapeIndex]);
            etapeIndex++;
        }
        
        if (progress >= 100) {
            clearInterval(interval);
            hideExportProgress();
            
            // Simuler le téléchargement
            const blob = new Blob(['Contenu PDF simulé'], { type: 'application/pdf' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `rapport_tchia_${typeRapport}_${new Date().getTime()}.pdf`;
            a.click();
            
            ajouterHistorique('PDF', '2.8 MB');
            TchiaUtils.showNotification('success', 'Rapport PDF généré avec succès');
        }
    }, 100);
};

// Export Excel
window.exporterExcel = function() {
    showExportProgress('Excel');
    
    const options = {
        donnees: document.getElementById('excel-donnees').checked,
        stats: document.getElementById('excel-stats').checked,
        pivots: document.getElementById('excel-pivots').checked,
        charts: document.getElementById('excel-charts').checked
    };
    
    // Simuler la création du fichier Excel
    let progress = 0;
    const interval = setInterval(() => {
        progress += 8;
        updateExportProgress(progress, `Création des feuilles Excel... ${Math.floor(progress/25) + 1}/4`);
        
        if (progress >= 100) {
            clearInterval(interval);
            hideExportProgress();
            
            TchiaUtils.showNotification('info', 'Export Excel (fonctionnalité complète en développement)');
            ajouterHistorique('Excel', '1.5 MB');
        }
    }, 150);
};

// Générer rapport prédéfini
window.genererRapportPredefini = function(type) {
    showExportProgress(`Rapport ${type}`);
    
    const rapportConfigs = {
        mensuel: { duree: 3000, taille: '980 KB' },
        saisonnier: { duree: 5000, taille: '3.2 MB' },
        annuel: { duree: 7000, taille: '5.4 MB' },
        comparatif: { duree: 4000, taille: '2.1 MB' }
    };
    
    const config = rapportConfigs[type];
    let progress = 0;
    const increment = 100 / (config.duree / 100);
    
    const interval = setInterval(() => {
        progress += increment;
        updateExportProgress(Math.min(progress, 100), `Génération du rapport ${type}...`);
        
        if (progress >= 100) {
            clearInterval(interval);
            hideExportProgress();
            
            TchiaUtils.showNotification('success', `Rapport ${type} généré avec succès`);
            ajouterHistorique(`Rapport ${type}`, config.taille);
        }
    }, 100);
};

// Utiliser un template
window.utiliserTemplate = function(templateId) {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    
    TchiaUtils.showNotification('info', `Template "${template.nom}" chargé`);
    
    // Mettre à jour la dernière utilisation
    template.derniereUtilisation = new Date().toLocaleDateString('fr-FR');
    
    // Rediriger vers la génération avec ce template
    showExportProgress('Rapport personnalisé');
    
    setTimeout(() => {
        hideExportProgress();
        TchiaUtils.showNotification('success', 'Rapport généré à partir du template');
        ajouterHistorique(`Template: ${template.nom}`, '1.8 MB');
    }, 3000);
};

// Créer nouveau template
window.creerNouveauTemplate = function() {
    TchiaUtils.showNotification('info', 'Éditeur de template (fonctionnalité en développement)');
};

// Éditer template
window.editerTemplate = function(templateId) {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    
    TchiaUtils.showNotification('info', `Édition du template "${template.nom}" (fonctionnalité en développement)`);
};

// Dupliquer template
window.dupliquerTemplate = function(templateId) {
    const template = templates.find(t => t.id === templateId);
    if (!template) return;
    
    const nouveauTemplate = {
        ...template,
        id: templates.length + 1,
        nom: `${template.nom} (copie)`,
        dateCreation: new Date().toLocaleDateString('fr-FR'),
        derniereUtilisation: 'Jamais'
    };
    
    templates.push(nouveauTemplate);
    TchiaUtils.showNotification('success', `Template "${template.nom}" dupliqué`);
};

// Supprimer template
window.supprimerTemplate = function(templateId) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) {
        templates = templates.filter(t => t.id !== templateId);
        TchiaUtils.showNotification('success', 'Template supprimé');
    }
};

// Ajouter rapport planifié
window.ajouterRapportPlanifie = function() {
    TchiaUtils.showNotification('info', 'Configuration des rapports planifiés (fonctionnalité en développement)');
};

// Voir historique complet
window.voirHistoriqueComplet = function() {
    TchiaUtils.showNotification('info', 'Historique complet (fonctionnalité en développement)');
};

// Retélécharger un export
window.retelecharger = function(exportId) {
    const exportItem = historiqueExports.find(h => h.id === exportId);
    if (!exportItem) return;
    
    TchiaUtils.showNotification('info', `Retéléchargement de ${exportItem.type} du ${exportItem.date}`);
};

// Configuration API
window.afficherDocAPI = function() {
    TchiaUtils.showNotification('info', 'Documentation API (fonctionnalité en développement)');
    
    // Ouvrir une modal avec la doc API
    const apiDoc = `
        <h5>Endpoints disponibles:</h5>
        <pre>
GET /api/data/export?format=json&zone=all
GET /api/data/filter?annee=2023&saison=hivernage
POST /api/reports/generate
        </pre>
    `;
    
    // Afficher dans une modal (à implémenter)
};

// Configuration synchronisation cloud
window.configurerSync = function() {
    TchiaUtils.showNotification('info', 'Configuration de la synchronisation cloud (fonctionnalité en développement)');
};

// Envoi par email
window.envoyerParEmail = function() {
    TchiaUtils.showNotification('info', 'Envoi par email (fonctionnalité en développement)');
};

// Gestion de la progression
function showExportProgress(type) {
    const modal = new bootstrap.Modal(document.getElementById('progressModal'));
    document.querySelector('#progressModal .modal-title').textContent = `Export ${type} en cours...`;
    modal.show();
}

function updateExportProgress(percent, status) {
    const progressBar = document.getElementById('export-progress');
    const statusText = document.getElementById('export-status');
    
    if (progressBar) {
        progressBar.style.width = `${percent}%`;
        progressBar.textContent = `${Math.round(percent)}%`;
    }
    
    if (statusText && status) {
        statusText.textContent = status;
    }
}

function hideExportProgress() {
    const modal = bootstrap.Modal.getInstance(document.getElementById('progressModal'));
    if (modal) {
        modal.hide();
    }
}

// Ajouter à l'historique
function ajouterHistorique(type, taille) {
    const nouvelExport = {
        id: `${type.toLowerCase().replace(' ', '_')}_${new Date().getTime()}`,
        date: new Date().toLocaleString('fr-FR'),
        type: type,
        taille: taille
    };
    
    historiqueExports.unshift(nouvelExport);
    if (historiqueExports.length > 10) {
        historiqueExports.pop();
    }
    
    // Mettre à jour l'affichage
    mettreAJourHistorique();
}

// Mettre à jour l'affichage de l'historique
function mettreAJourHistorique() {
    const tbody = document.getElementById('historique-exports');
    if (!tbody) return;
    
    const icones = {
        'PDF': 'bi-file-pdf text-danger',
        'Excel': 'bi-file-excel text-success',
        'CSV': 'bi-file-text text-primary'
    };
    
    tbody.innerHTML = historiqueExports.slice(0, 5).map(item => {
        const icone = icones[item.type] || 'bi-file text-secondary';
        
        return `
            <tr>
                <td>${item.date}</td>
                <td><i class="bi ${icone}"></i> ${item.type}</td>
                <td>${item.taille}</td>
                <td>
                    <button class="btn btn-sm btn-link p-0" onclick="retelecharger('${item.id}')">
                        <i class="bi bi-download"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Validation des options
function validerOptionsExport() {
    // Vérifier qu'au moins une variable est sélectionnée
    if (exportConfig.variables.length === 0) {
        TchiaUtils.showNotification('warning', 'Veuillez sélectionner au moins une variable à exporter');
        return false;
    }
    
    // Vérifier les dates
    if (exportConfig.periode.debut > exportConfig.periode.fin) {
        TchiaUtils.showNotification('warning', 'La date de début doit être antérieure à la date de fin');
        return false;
    }
    
    return true;
}

// Export en lot
window.exporterEnLot = function() {
    const formats = [];
    if (document.getElementById('csv-all-data')?.checked) formats.push('CSV');
    if (document.getElementById('pdf-graphs')?.checked) formats.push('PDF');
    if (document.getElementById('excel-donnees')?.checked) formats.push('Excel');
    
    if (formats.length === 0) {
        TchiaUtils.showNotification('warning', 'Sélectionnez au moins un format d\'export');
        return;
    }
    
    let currentIndex = 0;
    
    function exportNext() {
        if (currentIndex < formats.length) {
            const format = formats[currentIndex];
            TchiaUtils.showNotification('info', `Export ${format} en cours... (${currentIndex + 1}/${formats.length})`);
            
            setTimeout(() => {
                currentIndex++;
                exportNext();
            }, 2000);
        } else {
            TchiaUtils.showNotification('success', `${formats.length} exports terminés avec succès`);
        }
    }
    
    exportNext();
};