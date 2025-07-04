# Sene_analytics Dashboard

Dashboard d'analyse des données agricoles et météorologiques pour l'Office du Niger (Mali).

## 🚀 Fonctionnalités

- **Vue d'ensemble** : Métriques principales et graphiques de performance
- **Analyse agricole** : Analyse détaillée des superficies, productions et rendements
- **Intelligence météo** : Analyses climatiques et impacts sur les cultures
- **Corrélations** : Relations entre variables météorologiques et agricoles
- **Prévisions IA** : Modèles prédictifs et recommandations
- **Exports** : Génération de rapports CSV et visualisations

## 📋 Prérequis

- Python 3.8+
- pip (gestionnaire de paquets Python)
- Virtualenv (recommandé)
- Node.js et npm (pour les dépendances front-end optionnelles)

## 🛠️ Installation

### 1. Cloner le projet

```bash
git clone https://github.com/votre-repo/tchia-analytics.git
cd Sene_analytics
```

### 2. Créer un environnement virtuel

```bash
# Windows
python -m venv venv
venv\Scripts\activate

# Linux/Mac
python3 -m venv venv
source venv/bin/activate
```

### 3. Installer les dépendances

```bash
pip install -r requirements.txt
```

### 4. Configuration de l'environnement

Créer un fichier `.env` à la racine du projet :

```env
# Django
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (optionnel, SQLite par défaut)
# DATABASE_URL=postgresql://user:password@localhost:5432/tchia_db

# Redis (optionnel pour le cache)
# REDIS_URL=redis://localhost:6379/0
```

### 5. Migrations de la base de données

```bash
python manage.py migrate
```

### 6. Créer un superutilisateur (optionnel)

```bash
python manage.py createsuperuser
```

### 7. Collecter les fichiers statiques

```bash
python manage.py collectstatic --noinput
```

## 🏃‍♂️ Lancement du serveur de développement

```bash
python manage.py runserver
```

Le dashboard sera accessible à l'adresse : http://localhost:8000/dashboard/

## 📁 Structure du projet

```
Sene_analytics/
├── manage.py                 # Script de gestion Django
├── requirements.txt          # Dépendances Python
├── .env                     # Variables d'environnement (à créer)
├── tchia_analytics/         # Configuration principale
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
├── dashboard/               # Application principale
│   ├── views.py            # Vues et logique métier
│   ├── urls.py             # Routes de l'application
│   └── templates/          # Templates HTML
│       └── dashboard/
│           ├── base.html
│           ├── index.html
│           ├── agriculture.html
│           ├── meteo.html
│           ├── export.html
│           ├── previsions.html
│           ├── corelations.html
│           └── previsions.html
│ 
├── static/                  # Fichiers statiques
│   ├── css/
│   │   └── style.css
│   └── js/
│       ├── main.js
│       ├── dashboard.js
│       ├── agriculture.js
│       ├── meteo.js
│       ├── correlations.js
│       ├── export.js
│       ├── previsions.js
│       └── meteo.js
│ 
│ 
│ 
└── media/                   # Fichiers uploadés

```

## 📊 Utilisation

### 1. Chargement des données

1. Accédez au dashboard : http://localhost:8000/dashboard/
2. Cliquez sur "Charger vos données"
3. Sélectionnez votre fichier CSV contenant les données agricoles et météorologiques

### 2. Format du fichier CSV

Le fichier CSV doit contenir les colonnes suivantes :
- `annee` : Année
- `saison` : Saison (hivernage/contre_saison)
- `zones` : Zone géographique
- `production` : Production en tonnes
- `superficie` : Superficie en hectares
- `temperature_2m_mean_saison` : Température moyenne
- `precipitation_sum_saison` : Précipitations totales
- `soil_moisture_saison` : Humidité du sol (optionnel)
- `wind_speed_10m_max_saison` : Vitesse du vent (optionnel)
- `sunshine_duration_saison` : Durée d'ensoleillement (optionnel)

### 3. Filtrage des données

Utilisez les filtres en haut de page pour :
- Sélectionner une année spécifique
- Filtrer par saison (hivernage/contre-saison)
- Choisir une zone géographique
- Filtrer par type de culture

### 4. Export des données

- **CSV** : Cliquez sur "Exporter CSV" pour télécharger les données filtrées
- **Graphiques** : Utilisez les boutons de téléchargement sur chaque graphique


### Cache Redis

Pour améliorer les performances avec Redis :

1. Installer Redis
2. Installer le package : `pip install django-redis`
3. Configurer dans `.env` :
   ```env
   REDIS_URL=redis://localhost:6379/0
   ```
