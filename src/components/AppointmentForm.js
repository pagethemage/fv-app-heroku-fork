import React, { useState, useEffect } from "react";
import { useAppContext } from "../contexts/AppContext";
import Button from "./Button";
import LoadingSpinner from "./LoadingSpinner";
import ErrorDisplay from "./ErrorDisplay";
import TimePicker from "./TimePicker";
import Popup from "./Popup";
import { PlusCircle, Calendar, MapPin, Users, Clock, Flag } from "lucide-react";
import {
    appointmentService,
    venueService,
    refereeService,
    matchService,
} from "../services/api";
import { toast } from "react-toastify";

const AppointmentForm = ({ isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        appointment_id: `APP_${Date.now()}`,
        referee_id: "",
        venue_id: "",
        match_id: "",
        appointment_date: "",
        appointment_time: "",
        status: "upcoming",
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [venues, setVenues] = useState([]);
    const [referees, setReferees] = useState([]);
    const [matches, setMatches] = useState([]);

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                setLoading(true);
                setError(null);

                const [venuesResponse, refereesResponse, matchesResponse] =
                    await Promise.all([
                        venueService.getAllVenues(),
                        refereeService.getAllReferees(),
                        matchService.getAvailableMatches(),
                    ]);

                setVenues(
                    Array.isArray(venuesResponse.data)
                        ? venuesResponse.data
                        : [],
                );
                setReferees(
                    Array.isArray(refereesResponse.data)
                        ? refereesResponse.data
                        : [],
                );
                setMatches(
                    Array.isArray(matchesResponse.data)
                        ? matchesResponse.data
                        : [],
                );
            } catch (err) {
                console.error("Error fetching form data:", err);
                setError(err.message || "Failed to load form data");
                toast.error("Failed to load form data");
            } finally {
                setLoading(false);
            }
        };

        if (isOpen) {
            fetchInitialData();
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            setError(null);

            // Validate required fields
            const requiredFields = ["referee_id", "match_id"];
            const missingFields = requiredFields.filter(
                (field) => !formData[field],
            );

            if (missingFields.length > 0) {
                throw new Error(
                    `Please fill in all required fields: ${missingFields.join(
                        ", ",
                    )}`,
                );
            }

            // Find selected match to get its date and venue
            const selectedMatch = matches.find(
                (match) => match.match_id === formData.match_id,
            );
            if (!selectedMatch) {
                throw new Error("Selected match not found");
            }

            // Submit with match data
            const submissionData = {
                appointment_id: formData.appointment_id,
                referee: formData.referee_id,
                match: formData.match_id,
                venue: selectedMatch.venue.venue_id, // Use venue from match
                appointment_date: selectedMatch.match_date, // Use date from match
                appointment_time: selectedMatch.match_time, // Use time from match
                status: "upcoming",
            };

            console.log("Submitting appointment data:", submissionData);

            await onSubmit(submissionData);
            toast.success("Appointment created successfully");
            onClose();
        } catch (err) {
            console.error("Form submission error:", err);
            setError(err.message || "Failed to create appointment");
            toast.error(err.message || "Failed to create appointment");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    if (loading) {
        return <LoadingSpinner message="Loading form data..." />;
    }

    if (error) {
        return (
            <ErrorDisplay error={error} message="Failed to load form data" />
        );
    }

    return (
        <Popup
            isOpen={isOpen}
            onClose={onClose}
            title={
                <div className="flex items-center gap-3">
                    <div className="bg-blue-100 p-3 rounded-full">
                        <PlusCircle className="w-6 h-6 text-blue-600" />
                    </div>
                    <h2 className="text-2xl font-semibold">
                        Create New Appointment
                    </h2>
                </div>
            }
        >
            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Match Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Flag className="w-4 h-4 inline mr-2" />
                        Match
                    </label>
                    <select
                        name="match_id"
                        value={formData.match_id}
                        onChange={handleChange}
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                        required
                    >
                        <option value="">Select Match</option>
                        {matches.map((match) => (
                            <option key={match.match_id} value={match.match_id}>
                                {match.home_club.club_name} vs{" "}
                                {match.away_club.club_name} - {match.match_date}{" "}
                                at {match.match_time}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Referee Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Users className="w-4 h-4 inline mr-2" />
                        Referee
                    </label>
                    <select
                        name="referee_id"
                        value={formData.referee_id}
                        onChange={handleChange}
                        className="w-full p-2 border rounded-md focus:ring-2 focus:ring-blue-500"
                        required
                    >
                        <option value="">Select Referee</option>
                        {referees.map((referee) => (
                            <option
                                key={referee.referee_id}
                                value={referee.referee_id}
                            >
                                {referee.first_name} {referee.last_name} (Level{" "}
                                {referee.level})
                            </option>
                        ))}
                    </select>
                </div>

                {/* Selected Match Details */}
                {formData.match_id && (
                    <div className="bg-gray-50 p-4 rounded-lg">
                        <h3 className="font-medium text-gray-700 mb-2">
                            Match Details
                        </h3>
                        {matches.find(
                            (m) => m.match_id === formData.match_id,
                        ) && (
                            <div className="space-y-2 text-sm text-gray-600">
                                <p>
                                    <MapPin className="w-4 h-4 inline mr-2" />
                                    Venue:{" "}
                                    {
                                        matches.find(
                                            (m) =>
                                                m.match_id ===
                                                formData.match_id,
                                        ).venue.venue_name
                                    }
                                </p>
                                <p>
                                    <Calendar className="w-4 h-4 inline mr-2" />
                                    Date:{" "}
                                    {
                                        matches.find(
                                            (m) =>
                                                m.match_id ===
                                                formData.match_id,
                                        ).match_date
                                    }
                                </p>
                                <p>
                                    <Clock className="w-4 h-4 inline mr-2" />
                                    Time:{" "}
                                    {
                                        matches.find(
                                            (m) =>
                                                m.match_id ===
                                                formData.match_id,
                                        ).match_time
                                    }
                                </p>
                            </div>
                        )}
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Cancel
                    </Button>
                    <Button type="submit" disabled={loading}>
                        {loading ? "Creating..." : "Create Appointment"}
                    </Button>
                </div>
            </form>
        </Popup>
    );
};

export default AppointmentForm;
