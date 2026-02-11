# 🌍 5KM GPS Navigation Test System

A static, algorithm-driven geospatial navigation web application built using Leaflet.js, Geolocation API, and OSRM Routing API — fully deployable on GitHub Pages with no backend server required.

This project demonstrates real-time GPS detection, distance calculation using the Haversine formula, and restricted navigation within a defined 5KM test boundary.

---

## 🚀 Project Overview

This system allows users to:

* 📍 Detect live GPS location
* 🗺 Select predefined destination points
* 📏 Calculate real-world distance
* 🚫 Restrict navigation beyond 5KM
* 🧭 Display route if within allowed radius
* 🌑 Operate fully on static hosting (GitHub Pages)

---

## 📊 Dataset Used

| Location                      | Distance (Approx) | Latitude (N) | Longitude (E) |
| ----------------------------- | ----------------- | ------------ | ------------- |
| Egmore Station                | 1.5 km            | 13.0815      | 80.2605       |
| Fort St. George (Secretariat) | 2.5 km            | 13.0796      | 80.2875       |
| Marina Beach (Light House)    | 4.0 km            | 13.0436      | 80.2793       |
| Nungambakkam                  | 4.5 km            | 13.0587      | 80.2476       |
| George Town (Parrys)          | 2.0 km            | 13.0906      | 80.2885       |
| T. Nagar (Panagal Park)       | 6.5 km            | 13.0402      | 80.2341       |
| Anna Nagar (Roundtana)        | 7.5 km            | 13.0850      | 80.2101       |
| Adyar (Gandhi Nagar)          | 9.0 km            | 13.0064      | 80.2575       |
| Guindy (Kathipara)            | 10.0 km           | 13.0067      | 80.2206       |

---

## 🧠 Core Algorithms Used

### 1️⃣ Haversine Formula

Used to calculate the great-circle distance between two coordinates on Earth.

```
Distance = 2R × arcsin(√a)
```

Where:

* R = Earth radius (6371 km)
* Uses latitude and longitude in radians

---

### 2️⃣ Browser Geolocation API

Detects real-time user coordinates:

```
navigator.geolocation.getCurrentPosition()
```

Works only over HTTPS (GitHub Pages compatible).

---

### 3️⃣ OSRM Public Routing API

Used for generating navigation routes:

```
https://router.project-osrm.org/route/v1/driving/
```

Returns GeoJSON polyline for map rendering.

---

## 🛠 Tech Stack

* HTML5
* CSS3 (Dark Themed UI)
* Vanilla JavaScript (ES6)
* Leaflet.js
* OpenStreetMap Tiles
* OSRM Routing API
* GitHub Pages (Static Hosting)

---

## 🎯 Features

* ✅ Live GPS detection
* ✅ 5KM restricted testing mode
* ✅ Real-time distance calculation
* ✅ Dynamic route rendering
* ✅ Interactive map markers
* ✅ Boundary circle visualization
* ✅ Fully static deployment

---

## 🔐 Why No Backend?

This system is designed to run entirely on the frontend.

### GitHub Pages limitations:

* ❌ No server-side processing
* ❌ No database

### Solution:

* ✔ Browser-based algorithms
* ✔ External routing API
* ✔ Static deployment

---

## 🧪 5KM Test Mode Logic

If:

```
Calculated Distance ≤ 5 KM
```

→ Route displayed

Else:

```
Destination outside 5KM test boundary
```

This ensures controlled testing inside defined geospatial radius.

---

## 🌌 Future Scope

* 🔄 Live rerouting on movement
* 🌙 Stargazing integration (CosmoTalker ready)
* 🌍 Light pollution heatmap
* 📡 Astronomy-based location intelligence
* 🔭 Night-sky condition scoring
* 🛰 Real-time celestial overlay

---

## 📦 Deployment

1. Push `index.html` to repository.
2. Go to **Settings → Pages**.
3. Deploy from branch.
4. Open deployed URL.

---

## 💡 Learning Outcomes

Through this project, I explored:

* Practical geospatial mathematics
* Frontend-only architecture design
* Browser-based GPS systems
* Static web deployment engineering
* API integration without backend
* Navigation logic control systems

This project demonstrates algorithmic thinking combined with real-world geolocation systems — fully production deployable using only static hosting.

---

## 👨‍💻 Developer

**Bhuvanesh M**
AI-ready Linux Tools & Geospatial Systems Developer

🔗 GitHub: [https://github.com/bhuvanesh-m-dev](https://github.com/bhuvanesh-m-dev)
🌐 Live Demo: [https://bhuvanesh-m-dev.github.io/orbitnav/](https://bhuvanesh-m-dev.github.io/orbitnav/)
