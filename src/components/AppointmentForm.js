import React, { useState, useEffect } from "react";
import { useAppContext } from "../contexts/AppContext";
import Button from "./Button";
import LoadingSpinner from "./LoadingSpinner";
import ErrorDisplay from "./ErrorDisplay";
import TimePicker from "./TimePicker";
import Popup from "./Popup";
import { Users, MapPin, Calendar, Clock } from "lucide-react";
import {
    appointmentService,
    venueService,
    refereeService,
} from "../services/api";
import { toast } from "react-toastify";

const AppointmentForm = ({ isOpen, onClose, onSubmit }) => {
    const [formData, setFormData] = useState({
        appointment_id: `APP_${Date.now()}`,
        referee: "",
        venue: "",
        appointment_date: "",
        appointment_time: "",
        status: "upcoming",
    });

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [venues, setVenues] = useState([]);
    const [referees, setReferees] = useState([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [venuesRes, refereesRes] = await Promise.all([
                    venueService.getAllVenues(),
                    refereeService.getAllReferees(),
                ]);

                setVenues(venuesRes.data || []);
                setReferees(refereesRes.data || []);
            } catch (err) {
                console.error("Error fetching data:", err);
                setError(err.message || "Failed to load form data");
            } finally {
                setLoading(false);
            }
        };

        if (isOpen) {
            fetchData();
        }
    }, [isOpen]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (
            !formData.referee ||
            !formData.venue ||
            !formData.appointment_date ||
            !formData.appointment_time
        ) {
            toast.error("Please fill in all required fields");
            return;
        }

        try {
            setLoading(true);
            await onSubmit(formData);
            toast.success("Appointment created successfully");
            onClose();
        } catch (err) {
            console.error("Submission error:", err);
            toast.error(err.message || "Failed to create appointment");
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Popup isOpen={isOpen} onClose={onClose} title="Create New Appointment">
            <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                        {error}
                    </div>
                )}

                {/* Referee Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Users className="w-4 h-4 inline-block mr-2" />
                        Referee
                    </label>
                    <select
                        value={formData.referee}
                        onChange={(e) =>
                            setFormData((prev) => ({
                                ...prev,
                                referee: e.target.value,
                            }))
                        }
                        className="w-full p-2 border rounded-md"
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

                {/* Venue Selection */}
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        <MapPin className="w-4 h-4 inline-block mr-2" />
                        Venue
                    </label>
                    <select
                        value={formData.venue}
                        onChange={(e) =>
                            setFormData((prev) => ({
                                ...prev,
                                venue: e.target.value,
                            }))
                        }
                        className="w-full p-2 border rounded-md"
                        required
                    >
                        <option value="">Select Venue</option>
                        {venues.map((venue) => (
                            <option key={venue.venue_id} value={venue.venue_id}>
                                {venue.venue_name}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Date and Time */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Calendar className="w-4 h-4 inline-block mr-2" />
                            Date
                        </label>
                        <input
                            type="date"
                            value={formData.appointment_date}
                            onChange={(e) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    appointment_date: e.target.value,
                                }))
                            }
                            className="w-full p-2 border rounded-md"
                            min={new Date().toISOString().split("T")[0]}
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Clock className="w-4 h-4 inline-block mr-2" />
                            Time
                        </label>
                        <TimePicker
                            value={formData.appointment_time}
                            onChange={(value) =>
                                setFormData((prev) => ({
                                    ...prev,
                                    appointment_time: value,
                                }))
                            }
                            className="w-full"
                        />
                    </div>
                </div>

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
