import React, { useState, useEffect } from "react";
import { useAppContext } from "../contexts/AppContext";
import TitleWithBar from "../components/TitleWithBar";
import Button from "../components/Button";
import withAsyncState from "../hoc/withAsyncState";
import { refereeService } from "../services/api";
import { toast } from "react-toastify";

const Settings = () => {
    const { user } = useAppContext();
    const [settings, setSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [saving, setSaving] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            setError(null);
            const response = await refereeService.getRefereeSettings(user.id);
            setSettings(response.data);
        } catch (err) {
            setError(err.response?.data?.message || "Failed to fetch settings");
            toast.error("Failed to load settings");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSettings();
    }, [user.id]);

    const handleSettingChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSettings((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleSaveSettings = async () => {
        try {
            setSaving(true);
            await refereeService.updateRefereeSettings(user.id, settings);
            toast.success("Settings updated successfully");
        } catch (err) {
            toast.error(
                err.response?.data?.message || "Failed to update settings",
            );
        } finally {
            setSaving(false);
        }
    };

    const SettingsContent = withAsyncState(({ settings }) => (
        <>
            <TitleWithBar title="Settings" />
            <div className="bg-white shadow rounded-lg p-6">
                {/* Notification Settings */}
                <section className="mb-8">
                    <h3 className="text-xl font-semibold mb-4">
                        Notification Preferences
                    </h3>
                    <div className="space-y-4">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                name="emailNotifications"
                                checked={settings.emailNotifications}
                                onChange={handleSettingChange}
                                className="form-checkbox h-5 w-5 text-blue-600"
                            />
                            <span className="ml-2">
                                Receive email notifications
                            </span>
                        </label>
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                name="smsNotifications"
                                checked={settings.smsNotifications}
                                onChange={handleSettingChange}
                                className="form-checkbox h-5 w-5 text-blue-600"
                            />
                            <span className="ml-2">
                                Receive SMS notifications
                            </span>
                        </label>
                    </div>
                </section>

                {/* Preferences */}
                <section className="mb-8">
                    <h3 className="text-xl font-semibold mb-4">Preferences</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Language
                            </label>
                            <select
                                name="language"
                                value={settings.language}
                                onChange={handleSettingChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            >
                                <option value="en">English</option>
                                <option value="es">Spanish</option>
                                <option value="fr">French</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Timezone
                            </label>
                            <select
                                name="timezone"
                                value={settings.timezone}
                                onChange={handleSettingChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                            >
                                <option value="Australia/Melbourne">
                                    Melbourne
                                </option>
                                <option value="Australia/Sydney">Sydney</option>
                                <option value="Australia/Brisbane">
                                    Brisbane
                                </option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">
                                Default Travel Distance (km)
                            </label>
                            <input
                                type="number"
                                name="maxTravelDistance"
                                value={settings.maxTravelDistance}
                                onChange={handleSettingChange}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                                min="0"
                                max="200"
                            />
                        </div>
                    </div>
                </section>

                {/* Availability Settings */}
                <section className="mb-8">
                    <h3 className="text-xl font-semibold mb-4">
                        Availability Settings
                    </h3>
                    <div className="space-y-4">
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                name="autoDecline"
                                checked={settings.autoDecline}
                                onChange={handleSettingChange}
                                className="form-checkbox h-5 w-5 text-blue-600"
                            />
                            <span className="ml-2">
                                Automatically decline matches outside travel
                                distance
                            </span>
                        </label>
                        <label className="flex items-center">
                            <input
                                type="checkbox"
                                name="autoAcceptPreferred"
                                checked={settings.autoAcceptPreferred}
                                onChange={handleSettingChange}
                                className="form-checkbox h-5 w-5 text-blue-600"
                            />
                            <span className="ml-2">
                                Automatically accept matches at preferred venues
                            </span>
                        </label>
                    </div>
                </section>

                {/* Account Settings */}
                <section className="mb-8">
                    <h3 className="text-xl font-semibold mb-4">
                        Account Settings
                    </h3>
                    <div className="space-y-4">
                        <Button
                            onClick={() => setShowPasswordModal(true)}
                            variant="secondary"
                        >
                            Change Password
                        </Button>
                    </div>
                </section>

                {/* Save Button */}
                <div className="flex justify-end">
                    <Button
                        onClick={handleSaveSettings}
                        disabled={saving}
                        className="min-w-[120px]"
                    >
                        {saving ? "Saving..." : "Save Changes"}
                    </Button>
                </div>
            </div>

            {/* Password Change Modal */}
            {showPasswordModal && (
                <PasswordChangeModal
                    isOpen={showPasswordModal}
                    onClose={() => setShowPasswordModal(false)}
                    userId={user.id}
                />
            )}
        </>
    ));

    return (
        <SettingsContent
            loading={loading}
            error={error}
            settings={settings}
            onRetry={fetchSettings}
            loadingMessage="Loading settings..."
            errorMessage="Failed to load settings"
        />
    );
};

// Password Change Modal Component
const PasswordChangeModal = ({ isOpen, onClose, userId }) => {
    const [passwords, setPasswords] = useState({
        current: "",
        new: "",
        confirm: "",
    });
    const [changing, setChanging] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (e) => {
        const { name, value } = e.target;
        setPasswords((prev) => ({
            ...prev,
            [name]: value,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (passwords.new !== passwords.confirm) {
            setError("New passwords don't match");
            return;
        }

        try {
            setChanging(true);
            await refereeService.changePassword(userId, passwords);
            toast.success("Password changed successfully");
            onClose();
        } catch (err) {
            setError(
                err.response?.data?.message || "Failed to change password",
            );
        } finally {
            setChanging(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
                <h3 className="text-xl font-semibold mb-4">Change Password</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <div className="bg-red-50 text-red-500 p-3 rounded">
                            {error}
                        </div>
                    )}
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Current Password
                        </label>
                        <input
                            type="password"
                            name="current"
                            value={passwords.current}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            New Password
                        </label>
                        <input
                            type="password"
                            name="new"
                            value={passwords.new}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700">
                            Confirm New Password
                        </label>
                        <input
                            type="password"
                            name="confirm"
                            value={passwords.confirm}
                            onChange={handleChange}
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                    <div className="flex justify-end space-x-3">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button type="submit" disabled={changing}>
                            {changing ? "Changing..." : "Change Password"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Settings;
