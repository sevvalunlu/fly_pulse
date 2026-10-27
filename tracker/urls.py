from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('map/', views.map_view, name='map'),

    path('api/flights/', views.get_flight_data, name='get_flight_data'),
]