import React, { useState, useEffect, useRef } from "react";
import { useAppContext } from "../contexts/AppContext";
import Button from "./Button";
import Popup from "./Popup";
import { Map, MapPin } from "lucide-react";
import { appointmentService, matchService } from "../services/api";
import { toast } from "react-toastify";
import withAsyncState from "../hoc/withAsyncState";
import LoadingSpinner from "./LoadingSpinner";
import {
    getGoogleMaps,
    isGoogleMapsLoaded,
    loadGoogleMapsScript,
} from "../utils/loadGoogleMapsScript";

const MatchDetails = ({ match, isOpen, onClose }) => {
    const [matchDetails, setMatchDetails] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updating, setUpdating] = useState(false);
    const [showDeclineForm, setShowDeclineForm] = useState(false);
    const [declineReason, setDeclineReason] = useState("");
    const [mapLoaded, setMapLoaded] = useState(false);
    const [mapError, setMapError] = useState(null);
    const [map, setMap] = useState(null);

    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const geocoderRef = useRef(null);
    const markerRef = useRef(null);

    // Load Google Maps
    useEffect(() => {
        const initGoogleMaps = async () => {
            try {
                await loadGoogleMapsScript();
                geocoderRef.current = new window.google.maps.Geocoder();
            } catch (err) {
                console.error("Error loading Google Maps:", err);
                setMapError("Failed to load map");
            }
        };

        if (!window.google?.maps) {
            initGoogleMaps();
        } else {
            geocoderRef.current = new window.google.maps.Geocoder();
        }
    }, []);

    // Initialize map
    useEffect(() => {
        if (!window.google?.maps || !match?.venue?.location || !mapRef.current)
            return;

        try {
            // Only create new map instance if one doesn't exist
            if (!mapInstanceRef.current) {
                mapInstanceRef.current = new window.google.maps.Map(
                    mapRef.current,
                    {
                        zoom: 15,
                        center: { lat: -37.8136, lng: 144.9631 }, // Melbourne default
                        mapTypeControl: false,
                        streetViewControl: false,
                        fullscreenControl: false,
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

            // Clear existing marker if any
            if (markerRef.current) {
                markerRef.current.setMap(null);
            }

            // Geocode and set marker
            geocoderRef.current?.geocode(
                {
                    address: `${match.venue.location}, Victoria, Australia`,
                },
                (results, status) => {
                    if (status === "OK" && results[0]) {
                        const location = results[0].geometry.location;
                        mapInstanceRef.current.setCenter(location);

                        markerRef.current = new window.google.maps.Marker({
                            map: mapInstanceRef.current,
                            position: location,
                            title: match.venue.venue_name,
                        });
                    } else {
                        setMapError("Could not find venue location");
                    }
                },
            );
        } catch (err) {
            console.error("Map initialization error:", err);
            setMapError("Failed to initialize map");
        }

        // Cleanup function
        return () => {
            if (markerRef.current) {
                markerRef.current.setMap(null);
            }
        };
    }, [match?.venue]);

    useEffect(() => {
        const fetchMatchDetails = async () => {
            if (!isOpen || !match?.appointment_id) return;

            try {
                setLoading(true);
                const response = await appointmentService.getAppointment(
                    match.appointment_id,
                );
                setMatchDetails(response);
            } catch (err) {
                console.error("Error in fetchMatchDetails:", err);
                setError(err.message || "Failed to fetch match details");
                toast.error("Failed to load match details");
            } finally {
                setLoading(false);
            }
        };

        fetchMatchDetails();
    }, [isOpen, match]);

    const handleAccept = async () => {
        try {
            setUpdating(true);
            console.log("Accepting appointment:", match.appointment_id);

            // Include all required fields in the update
            const updateData = {
                appointment_id: match.appointment_id,
                referee: match.referee?.referee_id,
                venue: match.venue?.venue_id,
                match: match.match?.match_id,
                status: "confirmed",
                appointment_date: match.appointment_date,
                appointment_time: match.appointment_time,
                distance: match.distance || 0,
            };

            await appointmentService.updateAppointment(
                match.appointment_id,
                updateData,
            );
            toast.success("Match accepted successfully");
            onClose();
        } catch (err) {
            console.error("Error accepting match:", err);
            toast.error(err.message || "Failed to accept match");
        } finally {
            setUpdating(false);
        }
    };

    const handleDecline = async () => {
        if (!declineReason.trim()) {
            toast.error("Please provide a reason for declining");
            return;
        }

        try {
            setUpdating(true);

            // Include all required fields in the update
            const updateData = {
                appointment_id: match.appointment_id,
                referee: match.referee?.referee_id,
                venue: match.venue?.venue_id,
                match: match.match?.match_id,
                status: "declined",
                decline_reason: declineReason,
                appointment_date: match.appointment_date,
                appointment_time: match.appointment_time,
                distance: match.distance || 0,
            };

            await appointmentService.updateAppointment(
                match.appointment_id,
                updateData,
            );
            toast.success("Match declined successfully");
            onClose();
        } catch (err) {
            console.error("Error declining match:", err);
            toast.error(err.message || "Failed to decline match");
        } finally {
            setUpdating(false);
        }
    };

    return (
        <Popup
            isOpen={isOpen}
            onClose={() => {
                // Cleanup map when closing
                if (markerRef.current) {
                    markerRef.current.setMap(null);
                }
                onClose();
            }}
            title={match?.match?.level || "Match Details"}
        >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Match Details Section */}
                <div className="space-y-4">
                    <h3 className="text-xl font-semibold">Match Details</h3>
                    <div className="space-y-2">
                        <p>
                            <strong>Teams:</strong>{" "}
                            {`${
                                match?.match?.home_club?.club_name || "TBA"
                            } vs ${
                                match?.match?.away_club?.club_name || "TBA"
                            }`}
                        </p>
                        <p>
                            <strong>Date:</strong>{" "}
                            {match?.appointment_date
                                ? new Date(
                                      match.appointment_date,
                                  ).toLocaleDateString()
                                : "TBA"}
                        </p>
                        <p>
                            <strong>Time:</strong>{" "}
                            {match?.appointment_time || "TBA"}
                        </p>
                        <p>
                            <strong>Venue:</strong>{" "}
                            {match?.venue?.venue_name || "TBA"}
                        </p>
                        <p>
                            <strong>Status:</strong>{" "}
                            {match?.status || "pending"}
                        </p>
                    </div>

                    {match?.status === "pending" && (
                        <div className="mt-6 space-x-4">
                            <Button onClick={handleAccept} disabled={updating}>
                                {updating ? "Accepting..." : "Accept Match"}
                            </Button>
                            <Button
                                onClick={() => setShowDeclineForm(true)}
                                variant="secondary"
                                disabled={updating}
                            >
                                Decline Match
                            </Button>
                        </div>
                    )}

                    {showDeclineForm && (
                        <div className="mt-4">
                            <textarea
                                value={declineReason}
                                onChange={(e) =>
                                    setDeclineReason(e.target.value)
                                }
                                className="w-full p-2 border rounded"
                                placeholder="Please provide a reason for declining"
                                rows={3}
                            />
                            <Button
                                onClick={handleDecline}
                                className="mt-2"
                                disabled={updating}
                            >
                                {updating ? "Declining..." : "Submit Decline"}
                            </Button>
                        </div>
                    )}
                </div>

                {/* Location Section */}
                <div>
                    <h3 className="text-xl font-semibold mb-4">Location</h3>
                    <div className="bg-white rounded-lg overflow-hidden shadow">
                        {mapError ? (
                            <div className="bg-red-50 p-4 rounded">
                                <p className="text-red-600">{mapError}</p>
                            </div>
                        ) : (
                            <>
                                <div
                                    ref={mapRef}
                                    className="w-full h-[300px]" // Fixed height
                                    style={{ minHeight: "300px" }} // Ensure minimum height
                                />
                                <div className="p-4 border-t">
                                    <div className="flex items-center gap-2 mb-3">
                                        <MapPin className="w-4 h-4 text-gray-500" />
                                        <p className="text-sm text-gray-600">
                                            {match?.venue?.location}
                                        </p>
                                    </div>
                                    <Button
                                        className="w-full"
                                        onClick={() => {
                                            const address = encodeURIComponent(
                                                match?.venue?.location || "",
                                            );
                                            window.open(
                                                `https://www.google.com/maps/search/?api=1&query=${address}`,
                                                "_blank",
                                            );
                                        }}
                                    >
                                        <Map className="w-4 h-4 mr-2" />
                                        Open in Google Maps
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </Popup>
    );
};

export default MatchDetails;
