export const MELBOURNE_CENTER = { lat: -37.8136, lng: 144.9631 };

let googleMapsPromise = null;

export class MapManager {
    constructor() {
        this.map = null;
        this.markers = new Map();
        this.infoWindows = new Map();
        this.bounds = null;
        this.isInitialized = false;
    }

    async loadGoogleMaps() {
        if (googleMapsPromise) {
            return googleMapsPromise;
        }

        googleMapsPromise = new Promise((resolve, reject) => {
            try {
                // Check if Google Maps is already loaded
                if (window.google?.maps) {
                    resolve(window.google);
                    return;
                }

                const API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;
                if (!API_KEY) {
                    throw new Error("Google Maps API key is not configured");
                }

                // Create the script element
                const script = document.createElement("script");
                const callback = "onGoogleMapsLoad";

                // Define the callback function
                window[callback] = () => {
                    if (window.google?.maps) {
                        resolve(window.google);
                    } else {
                        reject(new Error("Google Maps failed to load"));
                    }
                    delete window[callback];
                };

                script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places&callback=${callback}`;
                script.async = true;
                script.defer = true;

                script.onerror = () => {
                    reject(new Error("Failed to load Google Maps script"));
                    delete window[callback];
                };

                document.head.appendChild(script);
            } catch (error) {
                reject(error);
            }
        });

        return googleMapsPromise;
    }

    async initializeMap(mapElement, options = {}) {
        if (!mapElement) {
            throw new Error("Map element is required");
        }

        try {
            // Load Google Maps if not already loaded
            await this.loadGoogleMaps();

            // Clear any existing markers
            this.clearMarkers();

            const defaultOptions = {
                center: MELBOURNE_CENTER,
                zoom: 11,
                styles: [
                    {
                        featureType: "poi",
                        elementType: "labels",
                        stylers: [{ visibility: "off" }],
                    },
                ],
                mapTypeControl: true,
                streetViewControl: true,
                fullscreenControl: true,
            };

            this.map = new window.google.maps.Map(mapElement, {
                ...defaultOptions,
                ...options,
            });

            this.bounds = new window.google.maps.LatLngBounds();
            this.isInitialized = true;

            return this.map;
        } catch (error) {
            console.error("Failed to initialize map:", error);
            throw error;
        }
    }

    clearMarkers() {
        if (!this.markers) return;

        this.markers.forEach((marker) => marker.setMap(null));
        this.markers.clear();

        if (this.infoWindows) {
            this.infoWindows.forEach((window) => window.close());
            this.infoWindows.clear();
        }

        if (this.bounds && window.google) {
            this.bounds = new window.google.maps.LatLngBounds();
        }
    }

    addMarker(id, position, options = {}) {
        if (!this.isInitialized || !this.map) {
            console.warn("Map not initialized");
            return null;
        }

        if (this.markers.has(id)) {
            this.markers.get(id).setMap(null);
        }

        const marker = new window.google.maps.Marker({
            position,
            map: this.map,
            ...options,
        });

        this.markers.set(id, marker);
        this.bounds.extend(position);
        return marker;
    }

    addInfoWindow(id, marker, content) {
        if (!this.isInitialized || !this.map) {
            console.warn("Map not initialized");
            return null;
        }

        if (this.infoWindows.has(id)) {
            this.infoWindows.get(id).close();
        }

        const infoWindow = new window.google.maps.InfoWindow({
            content,
        });

        marker.addListener("click", () => {
            this.infoWindows.forEach((window) => window.close());
            infoWindow.open(this.map, marker);
        });

        this.infoWindows.set(id, infoWindow);
        return infoWindow;
    }

    fitBounds() {
        if (!this.isInitialized || !this.map || !this.bounds) return;
        if (this.markers.size > 0) {
            this.map.fitBounds(this.bounds);
        }
    }

    setCenter(position) {
        if (!this.isInitialized || !this.map) return;
        this.map.setCenter(position);
    }

    getMap() {
        return this.map;
    }

    cleanup() {
        this.clearMarkers();
        this.map = null;
        this.bounds = null;
        this.isInitialized = false;
    }
}
