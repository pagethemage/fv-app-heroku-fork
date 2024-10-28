import React, { useState, useEffect } from "react";
import { useAppContext } from "../contexts/AppContext";
import AppointmentTable from "../components/AppointmentTable";
import AppointmentForm from "../components/AppointmentForm";
import MatchDetails from "../components/MatchDetails";
import TitleWithBar from "../components/TitleWithBar";
import Button from "../components/Button";
import LoadingSpinner from "../components/LoadingSpinner";
import ErrorDisplay from "../components/ErrorDisplay";
import { appointmentService } from "../services/api";
import { toast } from "react-toastify";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";

const Dashboard = () => {
    const [appointments, setAppointments] = useState([]);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [meta, setMeta] = useState({});
    const [showAppointmentForm, setShowAppointmentForm] = useState(false);
    const { user } = useAppContext();

    const fetchAppointments = async (page = 1) => {
        try {
            setLoading(true);
            setError(null);

            const response = await appointmentService.getAllAppointments(page);
            setAppointments(response.data);
            setMeta(response.meta);
        } catch (err) {
            console.error("Error fetching appointments:", err);
            setError(err.message || "Failed to load appointments");
            toast.error(err.message || "Failed to load appointments");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments(currentPage);
    }, [currentPage]);

    const handleCreateAppointment = async (appointmentData) => {
        try {
            console.log("Creating appointment with data:", appointmentData);
            const response = await appointmentService.createAppointment(
                appointmentData,
            );

            // Refresh the appointments list
            await fetchAppointments(currentPage);

            return response;
        } catch (err) {
            console.error("Appointment creation failed:", err);

            // Format error message for display
            const errorMessage =
                typeof err === "object"
                    ? err.message
                    : "Failed to create appointment";
            toast.error(errorMessage);

            throw new Error(errorMessage);
        }
    };

    // Stats cards component
    const StatsCard = ({ title, value, color }) => (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-2">{title}</h3>
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
        </div>
    );

    if (error) {
        return (
            <ErrorDisplay
                error={error}
                message="Failed to load appointments"
                onRetry={() => fetchAppointments(currentPage)}
            />
        );
    }

    return (
        <>
            <div className="flex justify-between items-center">
                <TitleWithBar title="Upcoming Appointments" />
                {/* currently always visible, but should only be visible to staff */}
                <div className="flex items-center gap-2">
                    <Button onClick={() => setShowAppointmentForm(true)}>
                        <Plus className="w-full h-4" />
                        Create Appointment
                    </Button>
                </div>
            </div>

            {/* Stats Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatsCard title="Total Appointments" value={meta.count || 0} color="text-blue-600" />
                <StatsCard title="Pending" value={appointments.filter((a) => a.status === "pending").length} color="text-yellow-600" />
                <StatsCard title={"Confirmed"} value={appointments.filter((a) => a.status === "confirmed").length} color={"text-green-600"} />
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-lg shadow my-6">
                {loading ? (
                    <LoadingSpinner message="Loading appointments..." />
                ) : (
                    <>
                        <AppointmentTable
                            appointments={appointments}
                            onViewMatch={setSelectedMatch}
                        />

                        {/* Pagination */}
                        {meta.count > 0 && (
                            <div className="flex justify-between items-center p-4 border-t">
                                <Button
                                    onClick={() =>
                                        setCurrentPage((prev) => prev - 1)
                                    }
                                    disabled={!meta.previous}
                                    variant="secondary"
                                >
                                    <ChevronLeft className="w-full h-4" />
                                    Previous
                                </Button>
                                <span className="text-gray-600">
                                    Page {currentPage} of{" "}
                                    {meta.total_pages || 1}
                                </span>
                                <Button
                                    onClick={() =>
                                        setCurrentPage((prev) => prev + 1)
                                    }
                                    disabled={!meta.next}
                                    variant="secondary"
                                >
                                    <ChevronRight className="w-full h-4" />
                                    Next
                                </Button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Appointment Creation Form */}
            {showAppointmentForm && (
                <AppointmentForm
                    isOpen={showAppointmentForm}
                    onClose={() => setShowAppointmentForm(false)}
                    onSubmit={handleCreateAppointment}
                />
            )}

            {/* Match Details Modal */}
            {selectedMatch && (
                <MatchDetails
                    match={selectedMatch}
                    isOpen={!!selectedMatch}
                    onClose={() => setSelectedMatch(null)}
                />
            )}
        </>
    );
};

export default Dashboard;
