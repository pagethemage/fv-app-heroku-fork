import React, { useState, useEffect } from "react";
import { useAppContext } from "../contexts/AppContext";
import AppointmentTable from "../components/AppointmentTable";
import MatchDetails from "../components/MatchDetails";
import TitleWithBar from "../components/TitleWithBar";
import withAsyncState from "../hoc/withAsyncState";
import { appointmentService } from "../services/api";
import { toast } from "react-toastify";

const Dashboard = () => {
    const [appointments, setAppointments] = useState([]);
    const [selectedMatch, setSelectedMatch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchAppointments = async () => {
        try {
            setLoading(true);
            const response = await appointmentService.getAllAppointments();
            setAppointments(response.data || []);
        } catch (err) {
            setError("Failed to load appointments");
            toast.error("Failed to load appointments");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAppointments();
    }, []);

    const DashboardContent = withAsyncState(({ appointments }) => (
        <div>
            <TitleWithBar title="Upcoming Appointments" />
            <AppointmentTable
                appointments={appointments}
                onViewMatch={setSelectedMatch}
            />
            {selectedMatch && (
                <MatchDetails
                    match={selectedMatch}
                    isOpen={!!selectedMatch}
                    onClose={() => setSelectedMatch(null)}
                />
            )}
        </div>
    ));

    return (
        <DashboardContent
            loading={loading}
            error={error}
            appointments={appointments}
            onRetry={fetchAppointments}
            loadingMessage="Loading appointments..."
            errorMessage="Failed to load appointments"
        />
    );
};

export default Dashboard;
