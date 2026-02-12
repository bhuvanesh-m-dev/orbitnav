// --- Configuration & Data ---

// Specified Dataset
const destinations = [
    { name: "Mauna Kea, USA", lat: 19.8206, lng: -155.4681 },
    { name: "Atacama, Chile", lat: -24.6275, lng: -70.4044 },
    { name: "Hanle, India", lat: 32.7794, lng: 78.9642 },
    { name: "Aoraki, NZ", lat: -43.9858, lng: 170.4650 },
    { name: "La Palma, Spain", lat: 28.7636, lng: -17.8947 },
    { name: "NamibRand, Namibia", lat: -24.9530, lng: 15.9080 },
    { name: "Pic du Midi, France", lat: 42.9369, lng: 0.1411 },
    { name: "Natural Bridges, USA", lat: 37.6017, lng: -110.0105 },
    { name: "Uluru, Australia", lat: -25.3444, lng: 131.0369 },
    { name: "Cherry Springs, USA", lat: 41.6659, lng: -77.8236 }
];

// App State
let map;
let userMarker;
let routeLayer;
let userLocation = { lat: null, lng: null };
let markersMap = new Map(); // Store markers mapped by name for easy access

// --- Icons ---

// Standard Leaflet markers with hue shift handled via CSS filter in style.css for dark mode compatibility
// But we want specific "Glow" effects, so we stick to standard icons and styled CSS.
const DefaultIcon = L.Icon.Default.extend({
    options: {
        className: 'custom-marker-icon'
    }
});
L.Icon.Default.imagePath = 'https://unpkg.com/leaflet@1.9.4/dist/images/';

// --- Core Functions ---

// 1. Initialization
window.onload = () => {
    initMap();
    initSearch();
};

function initMap() {
    // Initialize map centered on global view (or standard 0,0)
    map = L.map('map', {
        zoomControl: false,
        attributionControl: false
    }).setView([20, 0], 2);

    // Zoom Control Top Right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // Attribution
    L.control.attribution({ position: 'bottomright' })
        .addAttribution('&copy; OpenStreetMap | OrbitNav')
        .addTo(map);

    // Tiles (OpenStreetMap) -> Darkened by CSS
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        minZoom: 2
    }).addTo(map);

    // Add Destination Markers
    addMarkers();

    // Get User Position
    getUserPosition();
}

// 2. Markers & Popups
function addMarkers() {
    destinations.forEach(dest => {
        const marker = L.marker([dest.lat, dest.lng], { icon: new DefaultIcon() })
            .addTo(map)
            .bindTooltip(`${dest.name}<br><span style="color:#aaa; font-size:0.8em">${dest.lat.toFixed(2)}, ${dest.lng.toFixed(2)}</span>`, {
                direction: 'top',
                offset: [0, -40],
                className: 'custom-tooltip' // We'll rely on default styled by theme
            });

        // Hover Effect: Enlarge
        marker.on('mouseover', function (e) {
            this.openTooltip();
            this._icon.style.transform += ' scale(1.2)';
            this._icon.style.filter = 'drop-shadow(0 0 15px #00f3ff)';
        });

        marker.on('mouseout', function (e) {
            this.closeTooltip();
            // Reset transform is handled by Leaflet usually resetting on map move, 
            // but for CSS hover we used a class. 
            // Reverting manual inline styles:
            this._icon.style.transform = this._icon.style.transform.replace(' scale(1.2)', '');
            this._icon.style.filter = '';
        });

        // Click: Show Card Popup
        marker.on('click', () => {
            const content = createPopupContent(dest);
            marker.bindPopup(content, {
                maxWidth: 300,
                className: 'glass-popup'
            }).openPopup();

            // Trigger Route if user location exists
            if (userLocation.lat) {
                fetchRoute(dest);
            }
        });

        markersMap.set(dest.name, marker);
    });
}

function createPopupContent(dest) {
    // Calculate distance if user location known
    let distString = "Select to calc distance";
    if (userLocation.lat) {
        const d = calculateHaversineDistance(userLocation.lat, userLocation.lng, dest.lat, dest.lng);
        distString = `${d.toFixed(0)} km away`;
    }

    const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${dest.lat},${dest.lng}`;

    return `
        <div class="popup-content">
            <div class="popup-title">${dest.name}</div>
            <div class="popup-data">Coords: ${dest.lat.toFixed(4)}, ${dest.lng.toFixed(4)}</div>
            <div class="popup-data dist">${distString}</div>
            <a href="${googleMapsUrl}" target="_blank" class="btn-nav">Open in Google Maps</a>
        </div>
    `;
}

// 3. User Geolocation
function getUserPosition() {
    if (!navigator.geolocation) {
        console.warn("Geolocation not supported");
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (pos) => {
            userLocation.lat = pos.coords.latitude;
            userLocation.lng = pos.coords.longitude;

            // Green User Marker
            const userIcon = new L.Icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
            });

            if (userMarker) map.removeLayer(userMarker);

            userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
                .addTo(map)
                .bindPopup("<b>You Are Here</b>");

            // Optional: Center on user initially? 
            // User requested "Zoom map to location" on search, so we leave global view initially unless user is found.
            // Let's pan to them gently.
            map.flyTo([userLocation.lat, userLocation.lng], 5);
        },
        (err) => {
            console.error("GPS Error:", err);
            // Graceful degradation: App works without user location, just no distance/route
        },
        { enableHighAccuracy: true }
    );
}

// 4. Routing (OSRM)
async function fetchRoute(dest) {
    if (!userLocation.lat) return;

    // Remove old route
    if (routeLayer) map.removeLayer(routeLayer);

    const url = `https://router.project-osrm.org/route/v1/driving/${userLocation.lng},${userLocation.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`;

    try {
        const res = await fetch(url);
        const data = await res.json();

        if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
            console.warn("No drivable route found (likely across ocean).");
            return;
        }

        routeLayer = L.geoJSON(data.routes[0].geometry, {
            style: {
                color: '#00f3ff', // Neon Cyan
                weight: 4,
                opacity: 0.7,
                dashArray: '5, 10',
                lineCap: 'round'
            }
        }).addTo(map);

        // Fit bounds to show route
        map.fitBounds(routeLayer.getBounds(), { padding: [50, 50] });

    } catch (e) {
        console.error("Routing API failed or blocked", e);
    }
}

// 5. Search Logic (Live Typing + Autocomplete)
function initSearch() {
    const input = document.getElementById('search-input');
    const resultsContainer = document.getElementById('search-results');

    input.addEventListener('input', (e) => {
        const query = e.target.value.toLowerCase();

        if (query.length === 0) {
            resultsContainer.style.display = 'none';
            return;
        }

        // Filter
        const matches = destinations.filter(d => d.name.toLowerCase().includes(query));

        // Render
        renderSuggestions(matches, query);
    });

    // Close on click outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.search-box')) {
            resultsContainer.style.display = 'none';
        }
    });

    function renderSuggestions(matches, query) {
        resultsContainer.innerHTML = '';

        if (matches.length === 0) {
            resultsContainer.style.display = 'none';
            return;
        }

        matches.forEach(match => {
            const div = document.createElement('div');
            div.className = 'suggestion-item';

            // Highlight text
            const regex = new RegExp(`(${query})`, 'gi');
            const highlightedName = match.name.replace(regex, '<span class="highlight">$1</span>');

            div.innerHTML = highlightedName;

            div.onclick = () => {
                selectLocation(match);
                input.value = match.name;
                resultsContainer.style.display = 'none';
            };

            resultsContainer.appendChild(div);
        });

        resultsContainer.style.display = 'block';
    }
}

function selectLocation(dest) {
    // Zoom map
    map.flyTo([dest.lat, dest.lng], 10, {
        animate: true,
        duration: 1.5
    });

    // Trigger Popup
    const marker = markersMap.get(dest.name);
    if (marker) {
        setTimeout(() => {
            marker.fire('click');
        }, 1600); // Wait for flyTo
    }
}

// 6. Algorithm (Haversine)
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth radiues in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

function toRad(val) {
    return val * Math.PI / 180;
}
