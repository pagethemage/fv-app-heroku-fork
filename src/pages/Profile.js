import React, { useState, useEffect } from "react";
import { useAppContext } from "../contexts/AppContext";
import ErrorDisplay from "../components/ErrorDisplay";
import LoadingSpinner from "../components/LoadingSpinner";
import Button from "../components/Button";
import TitleWithBar from "../components/TitleWithBar";
import { toast } from "react-toastify";
import { refereeService } from "../services/api";
import {
    UserCircle,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Award,
    Clock,
} from "lucide-react";

const Profile = () => {
    const { user } = useAppContext();
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [editMode, setEditMode] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            if (!user?.referee_id) {
                setError("No user ID found");
                setLoading(false);
                return;
            }

            try {
                setLoading(true);
                const response = await refereeService.getRefereeProfile(
                    user.referee_id,
                );
                setProfile(response);
                setLoading(false);
            } catch (err) {
                console.error("Error fetching profile:", err);
                setError("Failed to fetch profile data");
                setLoading(false);
            }
        };

        fetchProfile();
    }, [user?.referee_id]);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!user?.referee_id) {
            toast.error("No user ID found");
            return;
        }

        try {
            setSaving(true);
            await refereeService.updateRefereeProfile(user.referee_id, profile);
            toast.success("Profile updated successfully");
            setEditMode(false);
        } catch (err) {
            toast.error(err.message || "Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfile((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    if (loading) {
        return <LoadingSpinner message="Loading profile..." />;
    }

    if (error) {
        return (
            <ErrorDisplay
                error={error}
                message="Failed to load profile"
                onRetry={() => window.location.reload()}
            />
        );
    }

    return (
        <>
            <div className="flex justify-between items-center">
                <TitleWithBar title="Profile" />
                <Button
                    onClick={() => setEditMode(!editMode)}
                    variant={editMode ? "secondary" : "primary"}
                >
                    {editMode ? "Cancel Editing" : "Edit Profile"}
                </Button>
            </div>

            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Profile Header */}
                <div className="bg-blue-600 text-white p-6">
                    <div className="flex items-center space-x-4">
                        <div className="bg-white rounded-full p-3">
                            <UserCircle className="w-16 h-16 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">
                                {profile?.first_name} {profile?.last_name}
                            </h2>
                            <p className="text-blue-100">
                                Referee Level {profile?.level}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Profile Content */}
                <form onSubmit={handleSubmit} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Personal Information */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold border-b pb-2">
                                Personal Information
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        First Name
                                    </label>
                                    <div className="flex items-center">
                                        <UserCircle className="w-5 h-5 text-gray-400 mr-2" />
                                        {editMode ? (
                                            <input
                                                type="text"
                                                name="first_name"
                                                value={
                                                    profile?.first_name || ""
                                                }
                                                onChange={handleInputChange}
                                                className="w-full p-2 border rounded-md"
                                            />
                                        ) : (
                                            <span className="text-gray-900">
                                                {profile?.first_name}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Last Name
                                    </label>
                                    <div className="flex items-center">
                                        <UserCircle className="w-5 h-5 text-gray-400 mr-2" />
                                        {editMode ? (
                                            <input
                                                type="text"
                                                name="last_name"
                                                value={profile?.last_name || ""}
                                                onChange={handleInputChange}
                                                className="w-full p-2 border rounded-md"
                                            />
                                        ) : (
                                            <span className="text-gray-900">
                                                {profile?.last_name}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email
                                    </label>
                                    <div className="flex items-center">
                                        <Mail className="w-5 h-5 text-gray-400 mr-2" />
                                        {editMode ? (
                                            <input
                                                type="email"
                                                name="email"
                                                value={profile?.email || ""}
                                                onChange={handleInputChange}
                                                className="w-full p-2 border rounded-md"
                                            />
                                        ) : (
                                            <span className="text-gray-900">
                                                {profile?.email}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Phone Number
                                    </label>
                                    <div className="flex items-center">
                                        <Phone className="w-5 h-5 text-gray-400 mr-2" />
                                        {editMode ? (
                                            <input
                                                type="tel"
                                                name="phone_number"
                                                value={
                                                    profile?.phone_number || ""
                                                }
                                                onChange={handleInputChange}
                                                className="w-full p-2 border rounded-md"
                                            />
                                        ) : (
                                            <span className="text-gray-900">
                                                {profile?.phone_number}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Referee Information */}
                        <div className="space-y-6">
                            <h3 className="text-lg font-semibold border-b pb-2">
                                Referee Information
                            </h3>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Location
                                    </label>
                                    <div className="flex items-center">
                                        <MapPin className="w-5 h-5 text-gray-400 mr-2" />
                                        {editMode ? (
                                            <input
                                                type="text"
                                                name="location"
                                                value={profile?.location || ""}
                                                onChange={handleInputChange}
                                                className="w-full p-2 border rounded-md"
                                            />
                                        ) : (
                                            <span className="text-gray-900">
                                                {profile?.location}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Age
                                    </label>
                                    <div className="flex items-center">
                                        <Calendar className="w-5 h-5 text-gray-400 mr-2" />
                                        {editMode ? (
                                            <input
                                                type="number"
                                                name="age"
                                                value={profile?.age || ""}
                                                onChange={handleInputChange}
                                                className="w-full p-2 border rounded-md"
                                            />
                                        ) : (
                                            <span className="text-gray-900">
                                                {profile?.age} years old
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Experience
                                    </label>
                                    <div className="flex items-center">
                                        <Clock className="w-5 h-5 text-gray-400 mr-2" />
                                        {editMode ? (
                                            <input
                                                type="number"
                                                name="experience_years"
                                                value={
                                                    profile?.experience_years ||
                                                    ""
                                                }
                                                onChange={handleInputChange}
                                                className="w-full p-2 border rounded-md"
                                            />
                                        ) : (
                                            <span className="text-gray-900">
                                                {profile?.experience_years}{" "}
                                                years
                                            </span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Referee Level
                                    </label>
                                    <div className="flex items-center">
                                        <Award className="w-5 h-5 text-gray-400 mr-2" />
                                        {editMode ? (
                                            <select
                                                name="level"
                                                value={profile?.level || ""}
                                                onChange={handleInputChange}
                                                className="w-full p-2 border rounded-md"
                                            >
                                                <option value="1">
                                                    Level 1
                                                </option>
                                                <option value="2">
                                                    Level 2
                                                </option>
                                                <option value="3">
                                                    Level 3
                                                </option>
                                                <option value="4">
                                                    Level 4
                                                </option>
                                            </select>
                                        ) : (
                                            <span className="text-gray-900">
                                                Level {profile?.level}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {editMode && (
                        <div className="mt-6 flex justify-end gap-4">
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => setEditMode(false)}
                                disabled={saving}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={saving}>
                                {saving ? "Saving..." : "Save Changes"}
                            </Button>
                        </div>
                    )}
                </form>

                {/* Stats Section */}
                <div className="bg-gray-50 p-6 mt-6">
                    <h3 className="text-lg font-semibold mb-4">Statistics</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-lg shadow">
                            <h4 className="text-sm text-gray-500">
                                Total Matches
                            </h4>
                            <p className="text-2xl font-bold text-blue-600">
                                0
                            </p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow">
                            <h4 className="text-sm text-gray-500">
                                Last Match
                            </h4>
                            <p className="text-2xl font-bold text-blue-600">
                                N/A
                            </p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow">
                            <h4 className="text-sm text-gray-500">
                                Next Match
                            </h4>
                            <p className="text-2xl font-bold text-blue-600">
                                N/A
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Profile;
