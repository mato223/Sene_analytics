# dash/urls.py
from django.urls import path
from . import views

app_name = 'dash'

urlpatterns = [
    # Page principale
    path('', views.index, name='index'),
    
    # Pages d'analyse
    path('agriculture/', views.agriculture, name='agriculture'),
    path('meteo/', views.meteo, name='meteo'),
    path('correlations/', views.correlations, name='correlations'),
    path('previsions/', views.previsions, name='previsions'),
    path('exports/', views.exports, name='exports'),
    
    # API endpoints
    path('api/upload-csv/', views.upload_csv, name='upload_csv'),
    path('api/filter-data/', views.filter_data, name='filter_data'),
    path('api/export-csv/', views.export_csv, name='export_csv'),
    path('api/chart-data/<str:chart_type>/', views.get_chart_data, name='get_chart_data'),
    path('api/analyze/production/', views.analyze_production, name='analyze_production'),
    path('api/analyze/meteo/', views.analyze_meteo, name='analyze_meteo'),
    path('api/analyze/correlations/', views.analyze_correlations, name='analyze_correlations'),
    path('api/analyze/predictions/', views.analyze_predictions, name='analyze_predictions'),
]