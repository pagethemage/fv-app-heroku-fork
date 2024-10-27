import React, { useState, useEffect } from "react";
import { useAppContext } from "../contexts/AppContext";
import TitleWithBar from "../components/TitleWithBar";
import Button from "../components/Button";
import withAsyncState from "../hoc/withAsyncState";
import { venueService } from "../services/api";
import {
    getGoogleMaps,
    isGoogleMapsLoaded,
} from "../utils/loadGoogleMapsScript";
import { toast } from "react-toastify";
import { Map } from "lucide-react";

const Venues = () => {
    const [venues, setVenues] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedVenue, setSelectedVenue] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [map, setMap] = useState(null);
    const [markers, setMarkers] = useState([]);

    const fetchVenues = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await venueService.getAllVenues();
            setVenues(response.data);

            // Initialize map after getting venues
            await initializeMap(response.data);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to fetch venues");
            toast.error("Failed to load venues");
        } finally {
            setLoading(false);
        }
    };

    const initializeMap = async (venueData) => {
    try {
        if (!isGoogleMapsLoaded()) {
            const script = document.createElement("script");
            const API_KEY = process.env.REACT_APP_GOOGLE_MAPS_API_KEY;

            if (!API_KEY) {
                throw new Error('Google Maps API key is not configured');
            }

            script.src = `https://maps.googleapis.com/maps/api/js?key=${API_KEY}&libraries=places`;
            script.async = true;
            script.defer = true;

            await new Promise((resolve, reject) => {
                script.addEventListener("load", resolve);
                script.addEventListener("error", reject);
                document.head.appendChild(script);
            });
        }

        const google = getGoogleMaps();
        if (!google) {
            throw new Error('Google Maps failed to load');
        }

        const mapInstance = new google.maps.Map(
            document.getElementById("venues-map"),
            {
                center: { lat: -37.8136, lng: 144.9631 }, // Melbourne
                zoom: 11,
            },
        );

        const bounds = new google.maps.LatLngBounds();
        const newMarkers = venueData
            .map((venue) => {
                if (venue.location) {
                    const position = new google.maps.LatLng(venue.location);
                    bounds.extend(position);

                    return new google.maps.Marker({
                        position,
                        map: mapInstance,
                        title: venue.venue_name,
                        icon: {
                            path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                            scale: 6,
                            fillColor: "#2196F3",
                            fillOpacity: 1,
                            strokeWeight: 2,
                            strokeColor: "#FFFFFF",
                        },
                    });
                }
                return null;
            })
            .filter(Boolean);

        if (newMarkers.length > 0) {
            mapInstance.fitBounds(bounds);
        }

        setMap(mapInstance);
        setMarkers(newMarkers);
    } catch (err) {
        console.error("Failed to initialize map:", err);
    }
};

    useEffect(() => {
        fetchVenues();
        return () => {
            // Cleanup markers
            markers.forEach((marker) => marker.setMap(null));
        };
    }, []);

    const handleAddVenue = async (venueData) => {
        try {
            const response = await venueService.createVenue(venueData);
            setVenues((prev) => [...prev, response.data]);
            toast.success("Venue added successfully");
            setShowAddForm(false);
            await fetchVenues(); // Refresh to update map
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to add venue");
        }
    };

    const VenuesContent = withAsyncState(({ venues }) => (
        <div>
            <div className="flex justify-between items-center mb-6">
                <TitleWithBar title="Venues" />
                <Button onClick={() => setShowAddForm(true)}>
                    Add New Venue
                </Button>
            </div>

            {/* Map View */}
            <div
                id="venues-map"
                className="w-full h-[400px] rounded-lg shadow-md mb-6"
            ></div>

            {/* Venues Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {venues.map((venue) => (
                    <div
                        key={venue.venue_id}
                        className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow"
                        onClick={() => setSelectedVenue(venue)}
                    >
                        <h3 className="font-semibold text-lg mb-2">
                            {venue.venue_name}
                        </h3>
                        <div className="space-y-2 text-gray-600">
                            <p>Capacity: {venue.capacity}</p>
                            <p>Location: {venue.location}</p>
                            <Button
                                className="mt-4"
                                variant="secondary"
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
                                <Map className="w-4 h-4 mr-2 inline-block" />
                                View on Maps
                            </Button>
                        </div>
                    </div>
                ))}
            </div>

            {/* Add Venue Form Modal */}
            {showAddForm && (
                <VenueForm
                    onSubmit={handleAddVenue}
                    onCancel={() => setShowAddForm(false)}
                />
            )}

            {/* Venue Details Modal */}
            {selectedVenue && (
                <VenueDetails
                    venue={selectedVenue}
                    onClose={() => setSelectedVenue(null)}
                />
            )}
        </div>
    ));

    return (
        <VenuesContent
            loading={loading}
            error={error}
            venues={venues}
            onRetry={fetchVenues}
            loadingMessage="Loading venues..."
            errorMessage="Failed to load venues"
        />
    );
};

const VenueForm = ({ onSubmit, onCancel }) => {
    const [formData, setFormData] = useState({
        venue_name: "",
        capacity: "",
        location: "",
    });
    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        await onSubmit(formData);
        setSubmitting(false);
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-xl font-semibold mb-4">Add New Venue</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Venue Name
                        </label>
                        <input
                            type="text"
                            value={formData.venue_name}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    venue_name: e.target.value,
                                }))
                            }
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Capacity
                        </label>
                        <input
                            type="number"
                            value={formData.capacity}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    capacity: e.target.value,
                                }))
                            }
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Location
                        </label>
                        <input
                            type="text"
                            value={formData.location}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    location: e.target.value,
                                }))
                            }
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            placeholder="Enter full address"
                        />
                    </div>
                    <div className="flex justify-end space-x-3">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onCancel}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={submitting}>
                            {submitting ? "Adding..." : "Add Venue"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const VenueDetails = ({ venue, onClose }) => {
    const [matches, setMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchVenueMatches = async () => {
            try {
                setLoading(true);
                const response = await venueService.getVenueMatches(
                    venue.venue_id,
                );
                setMatches(response.data);
            } catch (err) {
                setError("Failed to load venue matches");
            } finally {
                setLoading(false);
            }
        };

        fetchVenueMatches();
    }, [venue.venue_id]);

    const VenueMatchesContent = withAsyncState(({ matches }) => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">{venue.venue_name}</h2>
                    <Button onClick={onClose} variant="secondary">
                        Close
                    </Button>
                </div>

                <div className="space-y-6">
                    <section>
                        <h3 className="text-lg font-semibold mb-3">
                            Upcoming Matches
                        </h3>
                        {matches.length > 0 ? (
                            <div className="space-y-2">
                                {matches.map((match) => (
                                    <div
                                        key={match.match_id}
                                        className="bg-gray-50 p-3 rounded"
                                    >
                                        <p className="font-medium">
                                            {match.home_club.club_name} vs{" "}
                                            {match.away_club.club_name}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {new Date(
                                                match.match_date,
                                            ).toLocaleDateString()}{" "}
                                            at {match.match_time}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500">
                                No upcoming matches at this venue
                            </p>
                        )}
                    </section>

                    <section>
                        <h3 className="text-lg font-semibold mb-3">
                            Venue Details
                        </h3>
                        <div className="bg-gray-50 p-4 rounded">
                            <p>
                                <strong>Capacity:</strong> {venue.capacity}
                            </p>
                            <p>
                                <strong>Location:</strong> {venue.location}
                            </p>
                            <Button
                                className="mt-4"
                                onClick={() =>
                                    window.open(
                                        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                            venue.location,
                                        )}`,
                                        "_blank",
                                    )
                                }
                            >
                                <Map className="w-4 h-4 mr-2 inline-block" />
                                View on Google Maps
                            </Button>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    ));

    return (
        <VenueMatchesContent
            loading={loading}
            error={error}
            matches={matches}
            loadingMessage="Loading venue details..."
            errorMessage="Failed to load venue details"
        />
    );
};

export default Venues;
