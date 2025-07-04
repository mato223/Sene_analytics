"""
Views pour l'application dashboard TCHIA Analytics
"""
import json
import pandas as pd
import numpy as np
from django.shortcuts import render
from django.http import JsonResponse, HttpResponse
from django.views.decorators.csrf import csrf_exempt
from django.core.files.storage import default_storage
from django.conf import settings
import os
from datetime import datetime
import logging

logger = logging.getLogger('dashboard')

# Variable globale pour stocker les données en session
# En production, utiliser Redis ou une autre solution de cache
DATA_CACHE = {}

def index(request):
    """Page principale - Vue d'ensemble"""
    context = {
        'page_title': 'Vue d\'ensemble',
        'active_page': 'dashboard'
    }
    return render(request, 'dashboard/index.html', context)

def agriculture(request):
    """Page d'analyse agricole"""
    context = {
        'page_title': 'Analyse Agricole',
        'active_page': 'agriculture'
    }
    return render(request, 'dashboard/agriculture.html', context)

def meteo(request):
    """Page d'intelligence météorologique"""
    context = {
        'page_title': 'Intelligence Météorologique',
        'active_page': 'meteo'
    }
    return render(request, 'dashboard/meteo.html', context)

def correlations(request):
    """Page d'analyse des corrélations"""
    context = {
        'page_title': 'Analyses de Corrélations',
        'active_page': 'correlations'
    }
    return render(request, 'dashboard/corelations.html', context)

def previsions(request):
    """Page des prévisions IA"""
    context = {
        'page_title': 'Modèles Prédictifs IA',
        'active_page': 'previsions'
    }
    return render(request, 'dashboard/previsions.html', context)

def exports(request):
    """Page d'exports et rapports"""
    context = {
        'page_title': 'Exports & Rapports',
        'active_page': 'exports'
    }
    return render(request, 'dashboard/export.html', context)


@csrf_exempt
def upload_csv(request):
    """Upload et traitement du fichier CSV"""
    if request.method == 'POST':
        try:
            if 'file' not in request.FILES:
                return JsonResponse({'error': 'Aucun fichier fourni'}, status=400)
            
            csv_file = request.FILES['file']
            
            # Vérifier l'extension
            if not csv_file.name.endswith('.csv'):
                return JsonResponse({'error': 'Le fichier doit être au format CSV'}, status=400)
            
            # Sauvegarder le fichier temporairement
            file_path = default_storage.save(f'temp/{csv_file.name}', csv_file)
            full_path = os.path.join(settings.MEDIA_ROOT, file_path)
            
            # Lire le CSV avec pandas
            try:
                df = pd.read_csv(full_path, encoding='utf-8')
            except UnicodeDecodeError:
                df = pd.read_csv(full_path, encoding='latin-1')
            
            # Stocker en cache (simple pour dev, utiliser Redis en production)
            session_id = request.session.session_key or request.session.create()
            DATA_CACHE[session_id] = df
            
            # Nettoyer le fichier temporaire
            default_storage.delete(file_path)
            
            # Retourner les informations sur les données
            return JsonResponse({
                'success': True,
                'rows': len(df),
                'columns': list(df.columns),
                'preview': df.head(5).to_dict('records')
            })
            
        except Exception as e:
            logger.error(f"Erreur upload CSV: {str(e)}")
            return JsonResponse({'error': str(e)}, status=500)
    
    return JsonResponse({'error': 'Méthode non autorisée'}, status=405)

def filter_data(request):
    """Filtrer les données selon les critères"""
    try:
        session_id = request.session.session_key
        if not session_id or session_id not in DATA_CACHE:
            return JsonResponse({'error': 'Aucune donnée chargée'}, status=400)
        
        df = DATA_CACHE[session_id].copy()
        
        # Appliquer les filtres
        filters = request.GET.dict()
        
        if filters.get('annee'):
            df = df[df['annee'] == int(filters['annee'])]
        
        if filters.get('saison'):
            df = df[df['saison'] == filters['saison']]
        
        if filters.get('zone'):
            df = df[df['zones'] == filters['zone']]
        
        if filters.get('type'):
            df = df[df['type'] == filters['type']]
        
        # Calculer les métriques
        metrics = calculate_metrics(df)
        
        def clean_value(x):
            if pd.isna(x):
                return None
            if isinstance(x, (float, np.floating)):
                return round(x, 4)
            if isinstance(x, (np.integer, np.int64)):
                return int(x)
            return x

        cleaned_data = []
        for record in df.to_dict('records'):
            cleaned_record = {k: clean_value(v) for k, v in record.items()}
            cleaned_data.append(cleaned_record)
        
        return JsonResponse({
            'success': True,
            'metrics': metrics,
            'data': cleaned_data,  # Utiliser les données nettoyées
            'count': len(df)
        })
        
    except Exception as e:
        logger.error(f"Erreur filtrage: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)

def calculate_metrics(df):
    """Calculer les métriques principales"""
    metrics = {
        'production_totale': df['production'].sum() if 'production' in df else 0,
        'superficie_totale': df['superficie'].sum() if 'superficie' in df else 0,
        'rendement_moyen': 0,
        'temperature_moyenne': df['temperature_2m_mean_saison'].mean() if 'temperature_2m_mean_saison' in df else 0,
        'precipitation_moyenne': df['precipitation_sum_saison'].mean() if 'precipitation_sum_saison' in df else 0,
    }
    
    if metrics['superficie_totale'] > 0:
        metrics['rendement_moyen'] = metrics['production_totale'] / metrics['superficie_totale']
    
    # Arrondissement
    for key in metrics:
        if isinstance(metrics[key], (int, float)):
            metrics[key] = round(metrics[key], 2)
    
    return metrics

def get_chart_data(request, chart_type):
    """Obtenir les données pour les graphiques"""
    try:
        session_id = request.session.session_key
        if not session_id or session_id not in DATA_CACHE:
            return JsonResponse({'error': 'Aucune donnée chargée'}, status=400)
        
        df = DATA_CACHE[session_id].copy()
        
        # Appliquer les filtres si présents
        filters = request.GET.dict()
        if filters:
            if filters.get('annee'):
                df = df[df['annee'] == int(filters['annee'])]
            if filters.get('saison'):
                df = df[df['saison'] == filters['saison']]
            if filters.get('zone'):
                df = df[df['zones'] == filters['zone']]
        
        # Générer les données selon le type de graphique
        if chart_type == 'evolution':
            data = prepare_evolution_data(df)
        elif chart_type == 'zones':
            data = prepare_zones_data(df)
        elif chart_type == 'superficies':
            data = prepare_superficies_data(df)
        elif chart_type == 'rendements':
            data = prepare_rendements_data(df)
        elif chart_type == 'climat':
            data = prepare_climat_data(df)
        elif chart_type == 'temperature':
            data = prepare_temperature_data(df)
        elif chart_type == 'correlations':
            data = prepare_correlations_data(df)
        elif chart_type == 'previsions':
            data = prepare_previsions_data(df)
        else:
            return JsonResponse({'error': 'Type de graphique inconnu'}, status=400)
        
        return JsonResponse(data)
        
    except Exception as e:
        logger.error(f"Erreur chart data: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)

def prepare_evolution_data(df):
    """Préparer les données pour le graphique d'évolution"""
    # Grouper par année et saison
    grouped = df.groupby(['annee', 'saison']).agg({
        'production': 'sum',
        'precipitation_sum_saison': 'mean'
    }).reset_index()
    
    # Créer les labels
    grouped['label'] = grouped['annee'].astype(str) + '-' + grouped['saison']
    
    return {
        'labels': grouped['label'].tolist(),
        'production': grouped['production'].tolist(),
        'precipitation': grouped['precipitation_sum_saison'].tolist()
    }

def prepare_zones_data(df):
    """Préparer les données pour le graphique par zones"""
    # Grouper par zone
    grouped = df.groupby('zones')['production'].sum().reset_index()
    
    return {
        'labels': grouped['zones'].tolist(),
        'data': grouped['production'].tolist()
    }

def prepare_superficies_data(df):
    """Préparer les données pour le graphique des superficies"""
    grouped = df.groupby('annee')['superficie'].sum().reset_index()
    
    return {
        'labels': grouped['annee'].tolist(),
        'data': grouped['superficie'].tolist()
    }

def prepare_rendements_data(df):
    """Préparer les données pour le graphique des rendements"""
    # Calculer le rendement par zone
    grouped = df.groupby('zones').agg({
        'production': 'sum',
        'superficie': 'sum'
    }).reset_index()
    
    grouped['rendement'] = grouped['production'] / grouped['superficie']
    grouped = grouped.replace([np.inf, -np.inf], 0)
    
    return {
        'labels': grouped['zones'].tolist(),
        'data': grouped['rendement'].round(2).tolist()
    }

def prepare_climat_data(df):
    """Préparer les données climatiques"""
    # Données par saison et année
    grouped = df.groupby(['annee', 'saison'])['temperature_2m_mean_saison'].mean().reset_index()
    
    hivernage = grouped[grouped['saison'] == 'hivernage']
    contre_saison = grouped[grouped['saison'] == 'contre_saison']
    
    return {
        'labels': sorted(df['annee'].unique().tolist()),
        'hivernage': hivernage.set_index('annee')['temperature_2m_mean_saison'].reindex(sorted(df['annee'].unique())).fillna(0).tolist(),
        'contre_saison': contre_saison.set_index('annee')['temperature_2m_mean_saison'].reindex(sorted(df['annee'].unique())).fillna(0).tolist()
    }

def prepare_temperature_data(df):
    """Distribution des températures"""
    temps = df['temperature_2m_mean_saison'].dropna()
    hist, bins = np.histogram(temps, bins=10)
    
    labels = []
    for i in range(len(bins)-1):
        labels.append(f"{bins[i]:.1f}-{bins[i+1]:.1f}°C")
    
    return {
        'labels': labels,
        'data': hist.tolist()
    }

def prepare_correlations_data(df):
    """Matrice de corrélations"""
    # Sélectionner les colonnes numériques pertinentes
    numeric_cols = ['production', 'superficie', 'rendement', 
                   'temperature_2m_mean_saison', 'precipitation_sum_saison']
    
    available_cols = [col for col in numeric_cols if col in df.columns]
    
    if 'rendement' not in df.columns and 'production' in df.columns and 'superficie' in df.columns:
        df['rendement'] = df['production'] / df['superficie']
        df['rendement'] = df['rendement'].replace([np.inf, -np.inf], 0)
    
    corr_matrix = df[available_cols].corr()
    
    return {
        'labels': available_cols,
        'data': corr_matrix.values.tolist()
    }

def prepare_previsions_data(df):
    """Données pour les prévisions"""
    # Simuler des prévisions basiques
    grouped = df.groupby('annee')['production'].sum().reset_index()
    
    # Tendance simple pour les 2 prochaines années
    if len(grouped) >= 2:
        trend = (grouped['production'].iloc[-1] - grouped['production'].iloc[0]) / len(grouped)
        last_year = grouped['annee'].max()
        last_prod = grouped['production'].iloc[-1]
        
        previsions = {
            'historique': {
                'annees': grouped['annee'].tolist(),
                'production': grouped['production'].tolist()
            },
            'previsions': {
                'annees': [last_year + 1, last_year + 2],
                'production': [
                    last_prod + trend,
                    last_prod + (2 * trend)
                ]
            }
        }
    else:
        previsions = {
            'historique': {
                'annees': grouped['annee'].tolist(),
                'production': grouped['production'].tolist()
            },
            'previsions': {
                'annees': [],
                'production': []
            }
        }
    
    return previsions

def export_csv(request):
    """Exporter les données filtrées en CSV"""
    try:
        session_id = request.session.session_key
        if not session_id or session_id not in DATA_CACHE:
            return JsonResponse({'error': 'Aucune donnée à exporter'}, status=400)
        
        df = DATA_CACHE[session_id].copy()
        
        # Appliquer les filtres si présents
        filters = request.GET.dict()
        if filters:
            if filters.get('annee'):
                df = df[df['annee'] == int(filters['annee'])]
            if filters.get('saison'):
                df = df[df['saison'] == filters['saison']]
            if filters.get('zone'):
                df = df[df['zones'] == filters['zone']]
        
        # Créer la réponse CSV
        response = HttpResponse(content_type='text/csv')
        timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
        response['Content-Disposition'] = f'attachment; filename="export_tchia_{timestamp}.csv"'
        
        df.to_csv(response, index=False, encoding='utf-8-sig')
        
        return response
        
    except Exception as e:
        logger.error(f"Erreur export CSV: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)

def analyze_production(request):
    """Analyse détaillée de la production"""
    try:
        session_id = request.session.session_key
        if not session_id or session_id not in DATA_CACHE:
            return JsonResponse({'error': 'Aucune donnée chargée'}, status=400)
        
        df = DATA_CACHE[session_id].copy()
        
        # Analyses diverses
        analysis = {
            'total_production': df['production'].sum(),
            'moyenne_production': df['production'].mean(),
            'max_production': df['production'].max(),
            'min_production': df['production'].min(),
            'evolution_annuelle': df.groupby('annee')['production'].sum().to_dict(),
            'top_zones': df.groupby('zones')['production'].sum().nlargest(5).to_dict()
        }
        
        return JsonResponse(analysis)
        
    except Exception as e:
        logger.error(f"Erreur analyse production: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)

def analyze_meteo(request):
    """Analyse météorologique"""
    try:
        session_id = request.session.session_key
        if not session_id or session_id not in DATA_CACHE:
            return JsonResponse({'error': 'Aucune donnée chargée'}, status=400)
        
        df = DATA_CACHE[session_id].copy()
        
        analysis = {
            'temperature_moyenne': df['temperature_2m_mean_saison'].mean(),
            'precipitation_totale': df['precipitation_sum_saison'].sum(),
            'humidite_moyenne': df['soil_moisture_saison'].mean() if 'soil_moisture_saison' in df else 0,
            'vent_moyen': df['wind_speed_10m_max_saison'].mean() if 'wind_speed_10m_max_saison' in df else 0,
        }
        
        return JsonResponse(analysis)
        
    except Exception as e:
        logger.error(f"Erreur analyse météo: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)

def analyze_correlations(request):
    """Analyse des corrélations"""
    try:
        session_id = request.session.session_key
        if not session_id or session_id not in DATA_CACHE:
            return JsonResponse({'error': 'Aucune donnée chargée'}, status=400)
        
        df = DATA_CACHE[session_id].copy()
        
        # Calculer les corrélations importantes
        correlations = {}
        
        if 'production' in df and 'precipitation_sum_saison' in df:
            correlations['production_precipitation'] = df['production'].corr(df['precipitation_sum_saison'])
        
        if 'production' in df and 'temperature_2m_mean_saison' in df:
            correlations['production_temperature'] = df['production'].corr(df['temperature_2m_mean_saison'])
        
        return JsonResponse({'correlations': correlations})
        
    except Exception as e:
        logger.error(f"Erreur analyse corrélations: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)

def analyze_predictions(request):
    """Générer des prédictions simples"""
    try:
        session_id = request.session.session_key
        if not session_id or session_id not in DATA_CACHE:
            return JsonResponse({'error': 'Aucune donnée chargée'}, status=400)
        
        df = DATA_CACHE[session_id].copy()
        
        # Prédictions basiques basées sur la tendance
        yearly_prod = df.groupby('annee')['production'].sum()
        
        predictions = {
            'methode': 'Tendance linéaire simple',
            'fiabilite': 'Basique - Pour démonstration uniquement',
            'recommandations': []
        }
        
        # Recommandations basées sur les données
        if 'temperature_2m_mean_saison' in df:
            temp_mean = df['temperature_2m_mean_saison'].mean()
            if temp_mean > 30:
                predictions['recommandations'].append({
                    'type': 'warning',
                    'message': 'Températures élevées détectées - Augmenter l\'irrigation'
                })
        
        if 'precipitation_sum_saison' in df:
            precip_mean = df['precipitation_sum_saison'].mean()
            if precip_mean < 500:
                predictions['recommandations'].append({
                    'type': 'info',
                    'message': 'Précipitations faibles - Prévoir irrigation supplémentaire'
                })
        
        return JsonResponse(predictions)
        
    except Exception as e:
        logger.error(f"Erreur prédictions: {str(e)}")
        return JsonResponse({'error': str(e)}, status=500)
    
    