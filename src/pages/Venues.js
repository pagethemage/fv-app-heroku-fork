import React, { useState, useEffect, useRef } from "react";
import { useAppContext } from "../contexts/AppContext";
import TitleWithBar from "../components/TitleWithBar";
import Button from "../components/Button";
import { venueService } from "../services/api";
import {
    Map,
    Search,
    Plus,
    MapPin,
    Users,
    ChevronLeft,
    ChevronRight,
    Grid2X2,
    MapIcon,
} from "lucide-react";
import LoadingSpinner from "../components/LoadingSpinner";
import VenueForm from "../components/VenueForm";
import VenueDetails from "../components/VenueDetails";
import { toast } from "react-toastify";
import SimpleMap from "../components/SimpleMap";

const MELBOURNE_CENTER = { lat: -37.8136, lng: 144.9631 };
const ITEMS_PER_PAGE = 9;

const Venues = () => {
    const [venues, setVenue] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mapError, setMapError] = useState(null);
    const [selectedVenue, setSelectedVenue] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [viewMode, setViewMode] = useState("grid"); // 'grid' or 'map'
    const [searchTerm, setSearchTerm] = useState("");
    const mapRef = useRef(null);
    const markersRef = useRef([]);
    const mapInstance = useRef(null);

    // Filter venues based on search term
    const filteredVenues = venues.filter(
        (venue) =>
            venue.venue_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            venue.location.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    // Calculate pagination
    const totalPages = Math.ceil(filteredVenues.length / ITEMS_PER_PAGE);
    const paginatedVenues = filteredVenues.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE,
    );

    useEffect(() => {
        let isMounted = true;

        const initializeGoogleMaps = async () => {
            if (!window.google) {
                try {
                    const script = document.createElement("script");
                    const apiKey = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

                    if (!apiKey) {
                        throw new Error("Google Maps API key is missing");
                    }

                    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
                    script.async = true;
                    script.defer = true;

                    // Create a promise to wait for script to load
                    await new Promise((resolve, reject) => {
                        script.onload = resolve;
                        script.onerror = () =>
                            reject(
                                new Error("Failed to load Google Maps script"),
                            );
                        document.head.appendChild(script);
                    });
                } catch (error) {
                    console.error("Error loading Google Maps:", error);
                    setMapError("Failed to load Google Maps");
                    return;
                }
            }

            try {
                // Initialize map only if component is still mounted
                if (isMounted && mapRef.current && !mapInstance.current) {
                    mapInstance.current = new window.google.maps.Map(
                        mapRef.current,
                        {
                            center: MELBOURNE_CENTER,
                            zoom: 11,
                            styles: [
                                {
                                    featureType: "poi",
                                    elementType: "labels",
                                    stylers: [{ visibility: "off" }],
                                },
                            ],
                        },
                    );
                }
            } catch (error) {
                console.error("Map initialization error:", error);
                if (isMounted) {
                    setMapError("Failed to initialize map");
                }
            }
        };

        const handleAddVenue = async (data) => {
            try {
                const venueData = {
                    venue_id: `VENUE_${Date.now()}`,
                    ...data,
                };

                const response = await venueService.createVenue(venueData);
                setVenue((prev) => [...prev, response.data]);
                setShowAddForm(false);
                toast.success("Venue created successfully");
            } catch (error) {
                console.error("Error creating venue:", error);
                toast.error(
                    error.response?.data?.message ||
                        "Failed to create venue. Please try again.",
                );
            }
        };

        const fetchVenues = async () => {
            try {
                setLoading(true);
                const response = await venueService.getAllVenues();
                if (isMounted) {
                    const venuesData = Array.isArray(response.data)
                        ? response.data
                        : response.data.results || [];
                    setVenue(venuesData);
                    await initializeGoogleMaps();
                    if (mapInstance.current) {
                        updateMapMarkers(venuesData);
                    }
                }
            } catch (error) {
                console.error("Error fetching venues:", error);
                if (isMounted) {
                    setMapError("Failed to load venues data");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchVenues();

        return () => {
            isMounted = false;
            if (markersRef.current) {
                markersRef.current.forEach((marker) => marker.setMap(null));
            }
        };
    }, []);

    const updateMapMarkers = (venuesData) => {
        // Clear existing markers
        markersRef.current.forEach((marker) => marker.setMap(null));
        markersRef.current = [];

        const bounds = new window.google.maps.LatLngBounds();

        venuesData.forEach((venue) => {
            try {
                let position;
                if (venue.location) {
                    const [lat, lng] = venue.location
                        .split(",")
                        .map((coord) => parseFloat(coord.trim()));
                    if (!isNaN(lat) && !isNaN(lng)) {
                        position = { lat, lng };
                    }
                }

                if (position) {
                    const marker = new window.google.maps.Marker({
                        position,
                        map: mapInstance.current,
                        title: venue.venue_name,
                        icon: {
                            path: window.google.maps.SymbolPath.CIRCLE,
                            scale: 8,
                            fillColor: "#2196F3",
                            fillOpacity: 1,
                            strokeWeight: 2,
                            strokeColor: "#FFFFFF",
                        },
                    });

                    const infoWindow = new window.google.maps.InfoWindow({
                        content: `
                            <div class="p-4">
                                <h3 class="font-semibold text-lg mb-2">${venue.venue_name}</h3>
                                <p class="text-gray-600">Capacity: ${venue.capacity}</p>
                                <p class="text-gray-600 mt-1">${venue.location}</p>
                            </div>
                        `,
                    });

                    marker.addListener("click", () => {
                        infoWindow.open(mapInstance.current, marker);
                    });

                    markersRef.current.push(marker);
                    bounds.extend(position);
                }
            } catch (error) {
                console.warn(
                    `Error processing venue ${venue.venue_name}:`,
                    error,
                );
            }
        });

        if (markersRef.current.length > 0) {
            mapInstance.current.fitBounds(bounds);
            const listener = mapInstance.current.addListener("idle", () => {
                if (mapInstance.current.getZoom() > 15)
                    mapInstance.current.setZoom(15);
                window.google.maps.event.removeListener(listener);
            });
        }
    };

    if (loading) {
        return <LoadingSpinner message="Loading venues..." />;
    }

    return (
        <>
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <TitleWithBar title="Venues" />
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setViewMode("grid")}
                            className={`p-2 rounded-lg transition-colors ${
                                viewMode === "grid"
                                    ? "bg-blue-100 text-blue-600"
                                    : "text-gray-400 hover:text-gray-600"
                            }`}
                        >
                            <Grid2X2 className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode("map")}
                            className={`p-2 rounded-lg transition-colors ${
                                viewMode === "map"
                                    ? "bg-blue-100 text-blue-600"
                                    : "text-gray-400 hover:text-gray-600"
                            }`}
                        >
                            <MapIcon className="w-5 h-5" />
                        </button>
                    </div>
                    <Button onClick={() => setShowAddForm(true)}>
                        <Plus className="w-full h-4" />
                        Add Venue
                    </Button>
                </div>
            </div>

            {/* Search Bar */}
            <div className="relative">
                <input
                    type="text"
                    placeholder="Search venues by name or location..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
            </div>

            {viewMode === "map" ? (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden mt-6">
                    <SimpleMap venues={venues} />
                </div>
            ) : (
                /* Grid View */
                <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                        {paginatedVenues.map((venue) => (
                            <div
                                key={venue.venue_id}
                                className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300 overflow-hidden cursor-pointer"
                                onClick={() => setSelectedVenue(venue)}
                            >
                                <div className="p-6">
                                    <h3 className="font-semibold text-lg mb-4">
                                        {venue.venue_name}
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex items-center text-gray-600">
                                            <MapPin className="w-4 h-4 mr-2" />
                                            <span className="truncate">
                                                {venue.location}
                                            </span>
                                        </div>
                                        <div className="flex items-center text-gray-600">
                                            <Users className="w-4 h-4 mr-2" />
                                            <span>
                                                Capacity:{" "}
                                                {venue.capacity.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="px-6 py-4 bg-gray-50 border-t">
                                    <Button
                                        variant="secondary"
                                        className="w-full"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            window.open(
                                                `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                                    venue.location,
                                                )}`,
                                                "_blank",
                                            );
                                        }}
                                    >
                                        <Map className="w-full h-4" />
                                        View on Maps
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-4 mt-8">
                            <button
                                onClick={() =>
                                    setCurrentPage((p) => Math.max(1, p - 1))
                                }
                                disabled={currentPage === 1}
                                className={`p-2 rounded-lg ${
                                    currentPage === 1
                                        ? "text-gray-300"
                                        : "text-gray-600 hover:bg-gray-100"
                                }`}
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>

                            <span className="text-gray-600">
                                Page {currentPage} of {totalPages}
                            </span>

                            <button
                                onClick={() =>
                                    setCurrentPage((p) =>
                                        Math.min(totalPages, p + 1),
                                    )
                                }
                                disabled={currentPage === totalPages}
                                className={`p-2 rounded-lg ${
                                    currentPage === totalPages
                                        ? "text-gray-300"
                                        : "text-gray-600 hover:bg-gray-100"
                                }`}
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* Modals */}
            <VenueForm
                isOpen={showAddForm}
                onSubmit={async (data) => {
                    try {
                        const response = await venueService.createVenue(data);
                        setVenue((prev) => [...prev, response.data]);
                        setShowAddForm(false);
                        // Update markers
                        if (mapInstance.current) {
                            updateMapMarkers([...venues, response.data]);
                        }
                    } catch (error) {
                        console.error("Error adding venue:", error);
                        // Show error to user
                        alert(
                            error.response?.data?.message ||
                                "Failed to create venue",
                        );
                    }
                }}
                onClose={() => setShowAddForm(false)}
            />

            <VenueDetails
                venue={selectedVenue}
                isOpen={!!selectedVenue}
                onClose={() => setSelectedVenue(null)}
            />
        </>
    );
};

export default Venues;
