import os

import requests
from django.http import JsonResponse
from django.shortcuts import render

def home(request):
    return render(request, 'index.html')

def map_view(request):
    flight_id = request.GET.get('flight_id', None)
    context = {
        'flight_id': flight_id
    }
    return render(request, 'map.html', context)

def get_opensky_auth():
    """OpenSky kimlik bilgilerini .env / ortam degiskenlerinden okur."""
    username = os.environ.get('OPENSKY_USERNAME')
    password = os.environ.get('OPENSKY_PASSWORD')
    if username and password:
        return (username, password)
    return None  # anonim erisim (daha dusuk limit)


def get_flight_data(request):
    url = 'https://opensky-network.org/api/states/all?lamin=35.0&lomin=25.0&lamax=42.0&lomax=45.0'
    
    try:
        headers = {'User-Agent': 'FlyPulse Student Project/1.0'}

        response = requests.get(url, headers=headers, auth=get_opensky_auth(), timeout=10)
        
        if response.status_code == 200:
            data = response.json()
            if data.get('states') is None:
                return JsonResponse({'states': []})
            return JsonResponse(data)
        else:
            print(f"OpenSky API Hatası: {response.status_code}")
            print(f"Hata Detayı: {response.text}")
            return JsonResponse({'states': []})
            
    except Exception as e:
        print(f"Sunucu İşlem Hatası: {str(e)}")
        return JsonResponse({'states': []})
# Create your views here.
