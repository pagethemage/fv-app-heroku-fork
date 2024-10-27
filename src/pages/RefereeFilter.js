import React, { useEffect, useRef, useState } from "react";
import TitleWithBar from "../components/TitleWithBar";
import Button from "../components/Button";
import { RefreshCw, Search, MapPin } from "lucide-react";
import {
    geocodeAddress,
    calculateDistance,
    formatDistance,
} from "../utils/geocoding";
import AddressInput from "../components/AddressInput";
import { refereeService } from "../services/api";
import { toast } from "react-toastify";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorDisplay from "../components/ErrorDisplay";

const MELBOURNE_CENTER = { lat: -37.8136, lng: 144.9631 };

const RefereeFilter = () => {
    const mapRef = useRef(null);
    const [map, setMap] = useState(null);
    const [markers, setMarkers] = useState([]);
    const [searchLocation, setSearchLocation] = useState(null);
    const [isSearching, setIsSearching] = useState(false);
    const [referees, setReferees] = useState([]);
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [filters, setFilters] = useState({
        availability: false,
        level: "",
        minAge: "",
        minExperience: "",
        distance: 50,
        address: "",
    });

    const [filteredReferees, setFilteredReferees] = useState(referees);

    useEffect(() => {
        const fetchReferees = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await refereeService.getAllReferees();

                if (!response?.data) {
                    throw new Error("No data received from server");
                }

                // Process the referee data
                const refereesData = Array.isArray(response.data)
                    ? response.data
                    : response.data.results || [];

                // Transform referee data to include location coordinates
                const processedReferees = refereesData
                    .map((referee) => {
                        let location = null;
                        try {
                            if (referee.location) {
                                const [lat, lng] = referee.location
                                    .split(",")
                                    .map((coord) => parseFloat(coord.trim()));
                                if (!isNaN(lat) && !isNaN(lng)) {
                                    location = { lat, lng };
                                }
                            }
                        } catch (e) {
                            console.warn(
                                `Invalid location data for referee ${referee.referee_id}`,
                            );
                        }

                        return {
                            id: referee.referee_id,
                            firstName: referee.first_name,
                            lastName: referee.last_name,
                            level: referee.level,
                            experienceYears: referee.experience_years,
                            location,
                            isAvailable: true, // TODO: Implement proper availability check
                        };
                    })
                    .filter((referee) => referee.location !== null); // Only include referees with valid locations

                console.log("Processed referees:", processedReferees);
                setReferees(processedReferees);
                setFilteredReferees(processedReferees);
            } catch (err) {
                console.error("Error fetching referees:", err);
                setError(err.message || "Failed to load referees");
            } finally {
                setLoading(false);
            }
        };

        fetchReferees();
    }, []);

    // Load Google Maps API
    useEffect(() => {
        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;
        script.onload = initializeMap;
        script.onerror = () => setError("Failed to load Google Maps");
        document.head.appendChild(script);

        return () => {
            document.head.removeChild(script);
            if (markers.length > 0) {
                markers.forEach((marker) => marker.setMap(null));
            }
        };
    }, []);

    // Initialize the map
    const initializeMap = () => {
        if (!mapRef.current || !window.google) return;

        try {
            const newMap = new window.google.maps.Map(mapRef.current, {
                center: MELBOURNE_CENTER,
                zoom: 12,
                styles: [
                    {
                        featureType: "poi",
                        elementType: "labels",
                        stylers: [{ visibility: "off" }],
                    },
                ],
            });
            setMap(newMap);
        } catch (err) {
            console.error("Error initializing map:", err);
            setError("Failed to initialize map");
        }
    };

    // Update markers when map or filtered referees change
    useEffect(() => {
        if (!map || !filteredReferees?.length) return;

        try {
            // Clear existing markers
            markers.forEach((marker) => marker.setMap(null));
            const newMarkers = [];
            const bounds = new window.google.maps.LatLngBounds();

            // Add search location marker if exists
            if (searchLocation) {
                const searchMarker = new window.google.maps.Marker({
                    position: searchLocation,
                    map: map,
                    title: "Search Location",
                    icon: {
                        path: window.google.maps.SymbolPath.CIRCLE,
                        scale: 10,
                        fillColor: "#FF0000",
                        fillOpacity: 1,
                        strokeWeight: 2,
                        strokeColor: "#FFFFFF",
                    },
                });
                newMarkers.push(searchMarker);
                bounds.extend(searchLocation);
            }

            // Add referee markers
            filteredReferees.forEach((referee) => {
                if (referee.location) {
                    const marker = new window.google.maps.Marker({
                        position: referee.location,
                        map: map,
                        title: `${referee.firstName} ${referee.lastName}`,
                        icon: {
                            path: window.google.maps.SymbolPath.CIRCLE,
                            scale: 8,
                            fillColor: referee.isAvailable
                                ? "#4CAF50"
                                : "#FF5722",
                            fillOpacity: 1,
                            strokeWeight: 2,
                            strokeColor: "#FFFFFF",
                        },
                    });

                    const infoWindow = new window.google.maps.InfoWindow({
                        content: `
                            <div class="p-2">
                                <h3 class="font-semibold">${
                                    referee.firstName
                                } ${referee.lastName}</h3>
                                <p>Level: ${referee.level}</p>
                                <p>Experience: ${
                                    referee.experienceYears
                                } years</p>
                                ${
                                    searchLocation
                                        ? `
                                    <p>Distance: ${formatDistance(
                                        calculateDistance(
                                            searchLocation.lat,
                                            searchLocation.lng,
                                            referee.location.lat,
                                            referee.location.lng,
                                        ),
                                    )}</p>
                                `
                                        : ""
                                }
                            </div>
                        `,
                    });

                    marker.addListener("click", () => {
                        // Close any open info windows
                        markers.forEach((m) => m.infoWindow?.close());
                        infoWindow.open(map, marker);
                    });

                    // Store the info window with the marker
                    marker.infoWindow = infoWindow;
                    newMarkers.push(marker);
                    bounds.extend(referee.location);
                }
            });

            // Update markers state
            setMarkers(newMarkers);

            // Only fit bounds if we have markers
            if (newMarkers.length > 0) {
                map.fitBounds(bounds);
                // Add a slight zoom out to give some padding
                const listener = map.addListener("idle", () => {
                    if (map.getZoom() > 15) map.setZoom(15);
                    window.google.maps.event.removeListener(listener);
                });
            }
        } catch (err) {
            console.error("Error updating markers:", err);
            toast.error("Error updating map markers");
        }
    }, [map, filteredReferees, searchLocation]);

    const handleFilterChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFilters((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSearch = async () => {
        if (!filters.address) return;

        setIsSearching(true);
        try {
            const result = await geocodeAddress(filters.address);
            if (result) {
                setSearchLocation(result.coordinates);
                // Center map on search location
                if (map) {
                    map.setCenter(result.coordinates);
                    map.setZoom(12);
                }
            }
        } catch (error) {
            console.error("Geocoding error:", error);
        } finally {
            setIsSearching(false);
        }
    };

    const handleApplyFilters = async () => {
        try {
            setLoading(true);
            // Send filter parameters to backend
            const response = await refereeService.getRefereesByFilters({
                availability: filters.availability,
                level: filters.level,
                minAge: filters.minAge,
                minExperience: filters.minExperience,
                distance: filters.distance,
                searchLocation: searchLocation,
            });

            setFilteredReferees(response.data);
        } catch (err) {
            console.error("Error applying filters:", err);
            toast.error("Failed to apply filters");
        } finally {
            setLoading(false);
        }
    };

    const resetFilters = () => {
        setFilters({
            availability: false,
            level: "",
            minAge: "",
            minExperience: "",
            distance: 50,
            address: "",
        });
        setSearchLocation(null);
        setFilteredReferees(referees);

        // Reset map view
        if (map) {
            map.setCenter({ lat: -37.8136, lng: 144.9631 });
            map.setZoom(12);
        }
    };

    if (error) {
        return (
            <ErrorDisplay
                error={error}
                message="Failed to load referee data"
                onRetry={() => window.location.reload()}
            />
        );
    }

    return (
        <div className="">
            <div className="flex justify-between items-center">
                <TitleWithBar title="Referee Filter" />
            </div>

            {/* Filters */}
            <div className="bg-white rounded-lg shadow-lg p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Location Search */}
                    <div className="lg:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Search Location
                        </label>
                        <div className="flex space-x-2">
                            <AddressInput
                                value={filters.address}
                                onChange={(value) =>
                                    setFilters((prev) => ({
                                        ...prev,
                                        address: value,
                                    }))
                                }
                                onLocationSelect={(location) => {
                                    setSearchLocation(location.coordinates);
                                    if (map) {
                                        map.setCenter(location.coordinates);
                                        map.setZoom(12);
                                    }
                                }}
                                isSearching={isSearching}
                            />
                            <Button
                                onClick={handleSearch}
                                disabled={isSearching}
                            >
                                <Search className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Distance Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Maximum Distance (km)
                        </label>
                        <input
                            type="number"
                            name="distance"
                            value={filters.distance}
                            onChange={handleFilterChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            min="0"
                            max="200"
                        />
                    </div>

                    {/* Level Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Level
                        </label>
                        <select
                            name="level"
                            value={filters.level}
                            onChange={handleFilterChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        >
                            <option value="">All Levels</option>
                            <option value="1">Level 1</option>
                            <option value="2">Level 2</option>
                            <option value="3">Level 3</option>
                            <option value="4">Level 4</option>
                        </select>
                    </div>

                    {/* Minimum Age Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Minimum Age
                        </label>
                        <input
                            type="number"
                            name="minAge"
                            value={filters.minAge}
                            onChange={handleFilterChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            min="0"
                        />
                    </div>

                    {/* Experience Filter */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Minimum Experience (years)
                        </label>
                        <input
                            type="number"
                            name="minExperience"
                            value={filters.minExperience}
                            onChange={handleFilterChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            min="0"
                        />
                    </div>

                    {/* Availability Filter */}
                    <div className="flex items-center h-full pt-6">
                        <label className="flex items-center space-x-2">
                            <input
                                type="checkbox"
                                name="availability"
                                checked={filters.availability}
                                onChange={handleFilterChange}
                                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium text-gray-700">
                                Available Only
                            </span>
                        </label>
                    </div>
                </div>

                <div className="mt-6">
                    <Button
                        onClick={resetFilters}
                        className="w-full"
                        variant="secondary"
                    >
                        Reset Filters
                    </Button>
                </div>
                <div className="mt-2">
                    <Button
                        onClick={handleApplyFilters}
                        className="w-full"
                        disabled={loading}
                    >
                        {loading ? "Applying Filters..." : "Apply Filters"}
                    </Button>
                </div>
            </div>

            {/* Map */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden relative mt-6">
                {loading && (
                    <div className="absolute inset-0 bg-white bg-opacity-75 z-10">
                        <LoadingSpinner message="Loading map data..." />
                    </div>
                )}
                <div ref={mapRef} className="w-full h-[500px]" />
            </div>

            {/* Results */}
            <div className="bg-white rounded-lg shadow-lg p-6 mt-6">
                <h3 className="text-lg font-semibold mb-4">
                    Found {filteredReferees.length} matching referees
                </h3>

                {loading ? (
                    <LoadingSpinner
                        size="default"
                        message="Loading results..."
                    />
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredReferees.map((referee) => (
                            <div
                                key={referee.id}
                                className="bg-gray-50 rounded-lg p-4 hover:shadow-md transition-shadow"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h4 className="font-medium">
                                            {referee.firstName}{" "}
                                            {referee.lastName}
                                        </h4>
                                        <p className="text-sm text-gray-600">
                                            Level: {referee.level}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Experience:{" "}
                                            {referee.experienceYears} years
                                        </p>
                                        {searchLocation && referee.location && (
                                            <p className="text-sm text-gray-600">
                                                Distance:{" "}
                                                {formatDistance(
                                                    calculateDistance(
                                                        searchLocation.lat,
                                                        searchLocation.lng,
                                                        referee.location.lat,
                                                        referee.location.lng,
                                                    ),
                                                )}
                                            </p>
                                        )}
                                    </div>
                                    <span
                                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                            referee.isAvailable
                                                ? "bg-green-100 text-green-800"
                                                : "bg-red-100 text-red-800"
                                        }`}
                                    >
                                        {referee.isAvailable
                                            ? "Available"
                                            : "Unavailable"}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default RefereeFilter;
