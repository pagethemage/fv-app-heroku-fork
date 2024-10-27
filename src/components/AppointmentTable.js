import React from "react";
import Button from "./Button";

const AppointmentTable = ({ appointments = [], onViewMatch }) => {
    const getStatusColor = (status) => {
        if (!status) return "bg-gray-500 text-white";
        switch (status.toLowerCase()) {
            case "confirmed", "complete":
                return "bg-green-500 text-white";
            case "pending":
                return "bg-yellow-500 text-white";
            case "declined", "cancelled":
                return "bg-red-500 text-white";
            case "success":
                return "bg-purple-500 text-white";
            default:
                return "bg-gray-500 text-white";
        }
    };

    // Handle paginated response or direct array
    const appointmentList = Array.isArray(appointments)
        ? appointments
        : appointments?.results || [];

    return (
        <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
                <thead>
                    <tr>
                        <th className="px-3 py-3 border-b-2 border-gray-400 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Competition
                        </th>
                        <th className="px-3 py-3 border-b-2 border-gray-400 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                        </th>
                        <th className="px-3 py-3 border-b-2 border-gray-400 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                        </th>
                        <th className="px-3 py-3 border-b-2 border-gray-400 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Time
                        </th>
                        <th className="px-3 py-3 border-b-2 border-gray-400 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Teams
                        </th>
                        <th className="px-3 py-3 border-b-2 border-gray-400 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Venue
                        </th>
                        <th className="px-3 py-3 border-b-2 border-gray-400 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                        </th>
                        <th className="px-3 py-3 border-b-2 border-gray-400 text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                        </th>
                    </tr>
                </thead>
                <tbody>
                    {appointmentList.length === 0 ? (
                        <tr>
                            <td
                                colSpan="8"
                                className="px-3 py-4 text-center text-gray-500"
                            >
                                No appointments found
                            </td>
                        </tr>
                    ) : (
                        appointmentList.map((appointment) => (
                            <tr
                                key={
                                    appointment.appointment_id || appointment.id
                                }
                            >
                                <td className="px-3 py-3 whitespace-no-wrap border-b border-gray-200 text-left">
                                    {appointment.match?.level || "N/A"}
                                </td>
                                <td className="px-3 py-3 whitespace-no-wrap border-b border-gray-200 text-left">
                                    {appointment.type || "Standard"}
                                </td>
                                <td className="px-3 py-3 whitespace-no-wrap border-b border-gray-200 text-left">
                                    {appointment.appointment_date ||
                                        appointment.date}
                                </td>
                                <td className="px-3 py-3 whitespace-no-wrap border-b border-gray-200 text-left">
                                    {appointment.appointment_time ||
                                        appointment.time}
                                </td>
                                <td className="px-3 py-3 whitespace-no-wrap border-b border-gray-200 text-left">
                                    {appointment.match
                                        ? `${
                                              appointment.match.home_club
                                                  ?.club_name || "TBD"
                                          } vs ${
                                              appointment.match.away_club
                                                  ?.club_name || "TBD"
                                          }`
                                        : appointment.teams || "TBD"}
                                </td>
                                <td className="px-3 py-3 whitespace-no-wrap border-b border-gray-200 text-left">
                                    {appointment.venue?.venue_name ||
                                        appointment.venue ||
                                        "TBD"}
                                </td>
                                <td className="px-3 py-3 whitespace-no-wrap border-b border-gray-200 text-center">
                                    <span
                                        className={`px-3 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(
                                            appointment.status,
                                        )}`}
                                    >
                                        {appointment.status
                                            ? appointment.status
                                                  .charAt(0)
                                                  .toUpperCase() +
                                              appointment.status
                                                  .slice(1)
                                                  .toLowerCase()
                                            : "Unknown"}
                                    </span>
                                </td>
                                <td className="px-3 py-3 whitespace-no-wrap border-b border-gray-200 text-center">
                                    <Button
                                        onClick={() => onViewMatch(appointment)}
                                    >
                                        View
                                    </Button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};

export default AppointmentTable;
