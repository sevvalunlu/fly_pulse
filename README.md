# FlyPulse ✈️

**FlyPulse**, Türkiye ve çevresindeki hava sahasını canlı olarak izleyen, gerçek zamanlı bir uçuş radarı web uygulamasıdır. Uçuş verileri [OpenSky Network](https://opensky-network.org/) API'sinden çekilir ve interaktif bir harita üzerinde gösterilir.

## Özellikler

- **Canlı radar haritası:** Uçaklar, gidiş yönlerine (true track) göre döndürülmüş simgelerle harita üzerinde görünür. Veriler her 30 saniyede bir otomatik yenilenir.
- **Uçuş kodu ile arama:** Ana sayfadan çağrı kodu (örn. `TK1903`) girilerek uçuş haritada bulunur, seçilir ve haritada ona odaklanılır. Uçuş radar bölgesinde yoksa kullanıcı bilgilendirilir.
- **Uçuş detay paneli:** Bir uçağa tıklandığında çağrı kodu, kalkış ülkesi, irtifa (ft), hız (km/h) ve dikey hız durumu (tırmanıyor / alçalıyor / düz uçuş) gösterilir.
- **Uçuş izi:** Seçili uçağın son konumları kesikli bir çizgi olarak haritada çizilir.
- **Akıllı filtre:** Tüm uçuşlar, sadece tırmananlar, sadece alçalanlar, düşük irtifa (< 10.000 ft) veya yüksek hız (> 800 km/h) olarak filtrelenebilir.
- **Harita parlaklığı ayarı:** Harita katmanının parlaklığı kaydırıcı ile değiştirilebilir.
- **Ana sayfada örnek uçuşlar:** "Şu Anda Havada Olanlar" bölümünde o an havada olan rastgele 4 uçuş listelenir ve tek tıkla takip edilebilir.

## Kullanılan Teknolojiler

| Katman | Teknoloji |
| --- | --- |
| Arka uç | Python, Django 6 |
| Veri kaynağı | OpenSky Network REST API (`/states/all`) |
| Ön yüz | HTML, JavaScript, [Tailwind CSS](https://tailwindcss.com/) (CDN) |
| Harita | [Leaflet](https://leafletjs.com/) + Esri World Topo Map katmanı |

## Nasıl Çalışır?

1. Tarayıcı, Django'nun `/api/flights/` uç noktasına istek atar.
2. Django bu isteği OpenSky API'sine yönlendirir (Türkiye ve çevresini kapsayan koordinat aralığı: enlem 35°–42°, boylam 25°–45°).
3. Gelen uçuş verileri JSON olarak ön yüze döner ve harita üzerindeki uçak simgeleri güncellenir.

OpenSky kimlik bilgileri tarayıcıya gönderilmez, sadece sunucu tarafında kullanılır.

## Kurulum

Gereksinimler: **Python 3.12 veya üzeri** (Django 6 için gereklidir).

```bash
# 1. Projeyi indirin
git clone https://github.com/sevvalunlu/fly_pulse.git
cd fly_pulse

# 2. Sanal ortam oluşturup etkinleştirin
python -m venv venv
venv\Scripts\activate          # Windows
# source venv/bin/activate     # macOS / Linux

# 3. Bağımlılıkları kurun
pip install django requests

# 4. Ortam değişkenleri dosyasını oluşturun
copy .env.example .env         # Windows
# cp .env.example .env         # macOS / Linux

# 5. Veritabanını hazırlayın
python manage.py migrate

# 6. Sunucuyu başlatın
python manage.py runserver
```

Ardından tarayıcıda `http://127.0.0.1:8000` adresini açın.

## Ortam Değişkenleri (`.env`)

Gizli bilgiler koda yazılmaz, proje klasöründeki `.env` dosyasından okunur. Bu dosya `.gitignore` içindedir ve GitHub'a yüklenmez. Şablon için `.env.example` dosyasına bakın.

| Değişken | Açıklama |
| --- | --- |
| `DJANGO_SECRET_KEY` | Django gizli anahtarı. Uzun ve rastgele bir değer kullanın. |
| `DJANGO_DEBUG` | Geliştirme için `True`, yayında `False`. |
| `OPENSKY_USERNAME` | OpenSky Network kullanıcı adı (isteğe bağlı). |
| `OPENSKY_PASSWORD` | OpenSky Network şifresi (isteğe bağlı). |

Rastgele bir gizli anahtar üretmek için:

```bash
python -c "import secrets; print(secrets.token_urlsafe(50))"
```

> OpenSky bilgileri girilmezse uygulama API'ye anonim olarak bağlanır. Anonim erişimin istek limiti daha düşüktür, bu yüzden harita zaman zaman boş kalabilir.

## Proje Yapısı

```
fly_pulse/
├── core/           # Django proje ayarları (settings, urls, wsgi/asgi)
├── tracker/        # Uygulama: görünümler (views) ve URL'ler
├── templates/      # index.html (ana sayfa), map.html (radar haritası)
├── static/         # map.js (harita mantığı), style.css
├── manage.py
├── .env.example    # Ortam değişkenleri şablonu
└── .gitignore
```

## Sayfalar ve Uç Noktalar

| Adres | Açıklama |
| --- | --- |
| `/` | Ana sayfa: uçuş arama ve örnek uçuşlar |
| `/map/` | Canlı radar haritası (`?flight_id=TK1903` ile bir uçuş seçili açılır) |
| `/api/flights/` | OpenSky'dan alınan uçuş verilerini JSON olarak döner |

## Veri Kaynağı ve Teşekkür

- Uçuş verileri: [OpenSky Network](https://opensky-network.org/)
- Harita altlığı: Esri World Topo Map
- Harita kütüphanesi: Leaflet

## Geliştirici

**Şevval Ünlü**: [@sevvalunlu](https://github.com/sevvalunlu)
