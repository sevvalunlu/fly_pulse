// map.js

function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const openBtn = document.getElementById('openPanelBtn');
    
    sidebar.classList.toggle('-translate-x-[150%]');
    sidebar.classList.toggle('translate-x-0');
    sidebar.classList.toggle('opacity-0');
    sidebar.classList.toggle('pointer-events-none');
    
    openBtn.classList.toggle('hidden');
}

function getFlightIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('flight_id') ? urlParams.get('flight_id').trim().toUpperCase() : null;
}

let map;
let flightMarkers = {}; 
let searchedFlightId = getFlightIdFromUrl();
let flightHistory = {}; 
let selectedFlightPolyline = null; 
let activeFlightId = null;
let currentFilter = 'all';

function applyFilter(filterValue) {
    currentFilter = filterValue;
    fetchFlightData();
}

const planeIconHtml = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#06b6d4" width="24" height="24" class="drop-shadow-md">
        <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
    </svg>
`;

const activePlaneIconHtml = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#f59e0b" width="32" height="32" class="drop-shadow-[0_0_10px_rgba(245,158,11,0.8)]">
        <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/>
    </svg>
`;

function getCustomIcon(isSelected, trueTrack) {
    const currentIconHtml = isSelected ? activePlaneIconHtml : planeIconHtml;
    const iconSize = isSelected ? [32, 32] : [24, 24];
    const iconAnchor = isSelected ? [16, 16] : [12, 12];
    
    return L.divIcon({
        html: `<div style="transform: rotate(${trueTrack}deg); width: ${iconSize[0]}px; height: ${iconSize[1]}px; transition: transform 0.5s linear;">
                ${currentIconHtml}
               </div>`,
        className: 'plane-icon',
        iconSize: iconSize,
        iconAnchor: iconAnchor
    });
}

document.addEventListener('DOMContentLoaded', () => {
    map = L.map('map', { zoomControl: false }).setView([39.0, 35.0], 6);

    L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; Esri &mdash; Terrain Map',
        maxZoom: 19
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    fetchFlightData();
    setInterval(fetchFlightData, 30000); 
});

async function fetchFlightData() {
    try {
        const response = await fetch('/api/flights/');
        const data = await response.json();

        if (data && data.states) {
            updateMapMarkers(data.states);
        }
    } catch (error) {
        console.error("Veri çekilirken hata:", error);
    }
}

function updateMapMarkers(states) {
    const currentFlightIds = new Set();
    let flightFoundInThisCycle = false; 
    let flightToPan = null;

    states.forEach(flight => {
        const id = flight[0]; 
        const callsign = flight[1] ? flight[1].trim().toUpperCase() : "BİLİNMİYOR";
        const originCountry = flight[2] ? flight[2] : "Bilinmiyor";
        const lng = flight[5];
        const lat = flight[6];
        const altitude = flight[7] ? Math.round(flight[7] * 3.28084) : 0; 
        const velocity = flight[9] ? Math.round(flight[9] * 3.6) : 0; 
        const trueTrack = flight[10] || 0; 
        const verticalRate = flight[11] || 0; 

        if (!lat || !lng) return;

        let isSelected = false;
        if (activeFlightId === id) {
            isSelected = true;
        } else if (searchedFlightId && callsign === searchedFlightId) {
            isSelected = true;
            activeFlightId = id; 
            flightFoundInThisCycle = true;
            flightToPan = [lat, lng]; 
        }

        let passesFilter = true;
        if (currentFilter === 'climbing' && verticalRate <= 0) passesFilter = false;
        if (currentFilter === 'descending' && verticalRate >= 0) passesFilter = false;
        if (currentFilter === 'low_alt' && altitude >= 10000) passesFilter = false;
        if (currentFilter === 'high_speed' && velocity <= 800) passesFilter = false;

        if (isSelected) passesFilter = true;

        if (!passesFilter) return;

        currentFlightIds.add(id);

        if (!flightHistory[id]) flightHistory[id] = [];
        const lastPos = flightHistory[id][flightHistory[id].length - 1];
        if (!lastPos || lastPos[0] !== lat || lastPos[1] !== lng) {
            flightHistory[id].push([lat, lng]);
        }
        if (flightHistory[id].length > 50) flightHistory[id].shift();

        const customIcon = getCustomIcon(isSelected, trueTrack);

        if (flightMarkers[id]) {
            flightMarkers[id].setLatLng([lat, lng]);
            flightMarkers[id].setIcon(customIcon);
        } else {
            const marker = L.marker([lat, lng], { icon: customIcon }).addTo(map);

            marker.on('click', () => {
                if (activeFlightId && flightMarkers[activeFlightId]) {
                    const prevMarker = flightMarkers[activeFlightId];
                    const prevTrack = prevMarker._div_icon_trueTrack || 0; 
                    prevMarker.setIcon(getCustomIcon(false, prevTrack));
                }
                
                activeFlightId = id;
                searchedFlightId = null; 
                
                marker.setIcon(getCustomIcon(true, trueTrack));
                marker._div_icon_trueTrack = trueTrack; 

                map.flyTo([lat, lng], 8, { animate: true, duration: 1.5 }); 
                showFlightDetails(callsign, altitude, velocity, originCountry, verticalRate);
                drawPolyline(id);
            });
            flightMarkers[id] = marker;
        }
        
        flightMarkers[id]._div_icon_trueTrack = trueTrack; 

        if (isSelected) {
            showFlightDetails(callsign, altitude, velocity, originCountry, verticalRate);
            drawPolyline(id);
        }
    });

    for (const id in flightMarkers) {
        if (!currentFlightIds.has(id)) {
            map.removeLayer(flightMarkers[id]);
            delete flightMarkers[id];
            delete flightHistory[id]; 
        }
    }

    if (flightToPan) {
        map.panTo(flightToPan, { animate: true });
        searchedFlightId = null; 
    }

    if (searchedFlightId && !flightFoundInThisCycle) {
         alert(`"${searchedFlightId}" kodlu uçuş radar bölgesinde bulunamadı.`);
         searchedFlightId = null; 
    }
} 

function drawPolyline(flightId) {
    if (selectedFlightPolyline) map.removeLayer(selectedFlightPolyline);
    
    if (flightHistory[flightId] && flightHistory[flightId].length > 1) {
        selectedFlightPolyline = L.polyline(flightHistory[flightId], {
            color: '#f59e0b', weight: 4, opacity: 0.8, dashArray: '5, 5' 
        }).addTo(map);
    }
}

function showFlightDetails(callsign, altitude, velocity, country, vRate) {
    document.getElementById('flightCode').innerText = callsign;
    document.getElementById('altitude').innerText = `${altitude} ft`;
    document.getElementById('velocity').innerText = `${velocity} km/h`;
    document.getElementById('originCountry').innerText = country;
    
    let rateText = "Düz Uçuş";
    if (vRate > 0) rateText = `Tırmanıyor (+${vRate} m/s)`;
    else if (vRate < 0) rateText = `Alçalıyor (${vRate} m/s)`;
    
    document.getElementById('verticalRate').innerText = rateText;
    
    const sidebar = document.getElementById('sidebar');
    if (sidebar.classList.contains('-translate-x-[150%]')) {
        toggleSidebar();
    }
}