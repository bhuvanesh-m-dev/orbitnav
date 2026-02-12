// --- Configuration & Data ---

// Dataset provided by user
const destinations = [
    { name: "Egmore Station", lat: 13.0815, lng: 80.2605 },
    { name: "Fort St. George (Secretariat)", lat: 13.0796, lng: 80.2875 },
    { name: "Marina Beach (Light House)", lat: 13.0436, lng: 80.2793 },
    { name: "Nungambakkam", lat: 13.0587, lng: 80.2476 },
    { name: "George Town (Parrys)", lat: 13.0906, lng: 80.2885 },
    { name: "T. Nagar (Panagal Park)", lat: 13.0402, lng: 80.2341 },
    { name: "Anna Nagar (Roundtana)", lat: 13.0850, lng: 80.2101 },
    { name: "Adyar (Gandhi Nagar)", lat: 13.0064, lng: 80.2575 },
    { name: "Guindy (Kathipara)", lat: 13.0067, lng: 80.2206 }
];

const MAX_DISTANCE_KM = 5.0;
let map;
let userMarker;
let destinationMarker;
let routeLayer;
let boundaryCircle;
let allMarkersLayerGroup = L.layerGroup(); // To hold all markers when out of bounds

let userLocation = { lat: null, lng: null };

// Custom Icons
const greenIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const blueIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});


// --- Core Functions ---

// Haversine Formula for distance calculation
function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    return distance;
}

function toRad(val) {
    return val * Math.PI / 180;
}

// Initialize Map
function initMap() {
    // Default center before location is found (Chennai roughly)
    map = L.map('map', {
        zoomControl: false, // Reposition zoom control
        attributionControl: false
    }).setView([13.0827, 80.2707], 13);

    // Add custom attribution
    L.control.attribution({
        position: 'bottomright',
        prefix: false
    }).addAttribution('&copy; OpenStreetMap contributors | OrbitNav').addTo(map);

    // Add zoom control to top right
    L.control.zoom({
        position: 'topright'
    }).addTo(map);

    // Add OpenStreetMap tiles
    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
    }).addTo(map);

    // Trigger Geolocation
    getUserPosition();
}

// Get User Location
function getUserPosition() {
    if (!navigator.geolocation) {
        alert("Geolocation is not supported by your browser");
        document.getElementById('loading-overlay').style.display = 'none';
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            // Success
            userLocation.lat = position.coords.latitude;
            userLocation.lng = position.coords.longitude;

            // Center map on user
            map.setView([userLocation.lat, userLocation.lng], 14);

            // Add User Marker
            if (userMarker) map.removeLayer(userMarker);
            userMarker = L.marker([userLocation.lat, userLocation.lng], { icon: greenIcon })
                .addTo(map)
                .bindPopup("<b>You Are Here</b><br>Live GPS Location").openPopup();

            // Update UI
            document.getElementById('status-text').innerHTML = "Signal Acquired";
            document.getElementById('status-text').style.color = "var(--accent-green)";
            document.getElementById('loading-overlay').style.display = 'none';

            // Populate List
            renderLocationList();
        },
        (error) => {
            // Error
            console.error(error);
            document.getElementById('loading-overlay').style.display = 'none';
            document.getElementById('status-text').innerHTML = "GPS Error";
            document.getElementById('status-text').style.color = "var(--accent-red)";
            alert("Unable to retrieve your location. Please check GPS settings.");

            // Fallback to a default location for demo purposes (Egmore)
            // userLocation.lat = 13.0815;
            // userLocation.lng = 80.2605;
            // initMap would handle this but here we just stop. User needs GPS.
        },
        {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        }
    );
}

// Render Sidebar List
function renderLocationList() {
    const listContainer = document.getElementById('locations-container');
    listContainer.innerHTML = '';

    destinations.forEach((dest, index) => {
        // Calculate distance for preview (or hide if purely dynamic)
        // Let's just list them
        const li = document.createElement('li');
        li.className = 'location-item';
        li.innerHTML = `
            <div>
                <div class="loc-name">${dest.name}</div>
                <div class="loc-coords">${dest.lat.toFixed(4)}, ${dest.lng.toFixed(4)}</div>
            </div>
            <div class="loc-dist" id="dist-${index}"></div>
        `;
        li.onclick = () => selectDestination(index);
        listContainer.appendChild(li);
    });
}

// Handle Destination Selection
function selectDestination(index) {
    const dest = destinations[index];

    // Highlight styling
    document.querySelectorAll('.location-item').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.location-item')[index].classList.add('active');

    // 1. Calculate Distance
    const distance = calculateHaversineDistance(
        userLocation.lat, userLocation.lng,
        dest.lat, dest.lng
    );

    // Update Dist Display
    document.getElementById('distance-box').style.display = 'block';
    document.getElementById('distance-value').innerText = distance.toFixed(2) + " KM";

    // Cleanup previous map state
    if (routeLayer) map.removeLayer(routeLayer);
    if (destinationMarker) map.removeLayer(destinationMarker);
    if (boundaryCircle) map.removeLayer(boundaryCircle);
    allMarkersLayerGroup.clearLayers();
    map.removeLayer(allMarkersLayerGroup);

    // 2. Check Constraint
    if (distance <= MAX_DISTANCE_KM) {
        // WITHIN 5KM
        handleWithinRange(dest);
    } else {
        // OUTSIDE 5KM
        handleOutOfRange(dest, distance);
    }
}

// Logic: Within Range
function handleWithinRange(dest) {
    // Add Destination Marker
    destinationMarker = L.marker([dest.lat, dest.lng], { icon: redIcon })
        .addTo(map)
        .bindPopup(`<b>${dest.name}</b><br>Destination`);

    // Fetch Route from OSRM
    fetchRoute(userLocation.lat, userLocation.lng, dest.lat, dest.lng);
}

// Logic: Out of Range
function handleOutOfRange(dest, distance) {
    // Show Alert
    document.getElementById('alert-modal').style.display = 'block';

    // Draw 5KM Boundary Circle
    boundaryCircle = L.circle([userLocation.lat, userLocation.lng], {
        color: '#00f3ff',
        fillColor: '#00f3ff',
        fillOpacity: 0.1,
        radius: 5000 // 5km in meters
    }).addTo(map);

    // Show ALL markers
    destinations.forEach(d => {
        const marker = L.marker([d.lat, d.lng], { icon: blueIcon })
            .bindPopup(`<b>${d.name}</b>`);
        allMarkersLayerGroup.addLayer(marker);
    });
    allMarkersLayerGroup.addTo(map);

    // Fit bounds to show circle and markers
    const group = new L.featureGroup([
        L.marker([userLocation.lat, userLocation.lng]),
        boundaryCircle
    ]);
    map.fitBounds(group.getBounds());
}

// Fetch OSRM Route
async function fetchRoute(lat1, lon1, lat2, lon2) {
    const url = `https://router.project-osrm.org/route/v1/driving/${lon1},${lat1};${lon2},${lat2}?overview=full&geometries=geojson`;

    try {
        const response = await fetch(url);
        const data = await response.json();

        if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) {
            alert('Routing service could not find a path.');
            return;
        }

        const routeGeoJSON = data.routes[0].geometry;

        // Draw Polyline (Neon Blue)
        routeLayer = L.geoJSON(routeGeoJSON, {
            style: {
                color: '#00f3ff', // Neon Blue
                weight: 5,
                opacity: 0.8,
                lineCap: 'round',
                lineJoin: 'round',
                dashArray: '1, 10', // Cool dash animation potential, keeping solid for now
                dashOffset: '0'
            }
        }).addTo(map);

        // Add animation effect via CSS if we wanted, but sticking to solid neon for clarity
        // Just use simple styling for now.
        routeLayer.setStyle({ dashArray: null }); // Ensure solid line

        // Fit bounds
        const bounds = routeLayer.getBounds();
        map.fitBounds(bounds, { padding: [50, 50] });

    } catch (error) {
        console.error('Routing Error:', error);
        alert('Failed to connect to routing service.');
    }
}

function closeAlert() {
    document.getElementById('alert-modal').style.display = 'none';
}

// Start App
window.onload = initMap;
