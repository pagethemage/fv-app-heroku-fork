import React, { useState, useEffect } from "react";
import { useAppContext } from "../contexts/AppContext";
import TitleWithBar from "../components/TitleWithBar";
import Button from "../components/Button";
import { teamService } from "../services/api";
import { toast } from "react-toastify";
import LoadingSpinner from "../components/LoadingSpinner";
import {
    Search,
    MapPin,
    Phone,
    Users,
    Mail,
    Calendar,
    Trophy,
    ChevronLeft,
    ChevronRight,
} from "lucide-react";
import TeamDetailsModal from "../components/TeamDetailsModal";

const ITEMS_PER_PAGE = 9; // Match the Venues page pagination

const Teams = () => {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedTeam, setSelectedTeam] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [currentPage, setCurrentPage] = useState(1);

    // Filter teams based on search
    const filteredTeams = teams.filter((team) => {
        const matchesSearch =
            team.club_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            team.contact_name?.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesSearch;
    });

    // Calculate pagination
    const totalPages = Math.ceil(filteredTeams.length / ITEMS_PER_PAGE);
    const paginatedTeams = filteredTeams.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE,
    );

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                setLoading(true);
                const response = await teamService.getAllTeams();
                const teamsData = Array.isArray(response.data)
                    ? response.data
                    : response.data.results || [];
                setTeams(teamsData);
            } catch (err) {
                console.error("Error fetching teams:", err);
                toast.error("Failed to load teams");
            } finally {
                setLoading(false);
            }
        };

        fetchTeams();
    }, []);

    // Reset to first page when search changes
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    if (loading) {
        return <LoadingSpinner message="Loading teams..." />;
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <div className="bg-red-50 rounded-lg p-6 inline-block">
                    <h3 className="text-red-600 font-semibold mb-2">
                        Failed to load teams
                    </h3>
                    <p className="text-red-500 mb-4">{error}</p>
                    <Button onClick={() => window.location.reload()}>
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <TitleWithBar title="Teams" />
            </div>

            {/* Search Bar */}
            <div className="relative">
                <input
                    type="text"
                    placeholder="Search teams by name or contact..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-xl border-2 border-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
            </div>

            {/* Teams Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
                {paginatedTeams.map((team) => (
                    <div
                        key={team.club_id}
                        onClick={() => setSelectedTeam(team)}
                        className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden cursor-pointer"
                    >
                        {/* Team Header */}
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-start justify-between mb-4">
                                <h3 className="font-semibold text-lg text-gray-900 group-hover:text-blue-600 transition-colors">
                                    {team.club_name}
                                </h3>
                                <div className="bg-blue-50 text-blue-600 px-3 py-1 rounded-full text-sm font-medium">
                                    Active
                                </div>
                            </div>

                            {/* Venue Info */}
                            <div className="flex items-center text-gray-600 mb-2">
                                <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                                <span className="truncate">
                                    {team.home_venue?.venue_name ||
                                        "No venue assigned"}
                                </span>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div className="px-6 py-4 bg-gray-50">
                            <div className="space-y-2">
                                <div className="flex items-center text-gray-600">
                                    <Users className="w-4 h-4 mr-2 flex-shrink-0" />
                                    <span>
                                        {team.contact_name || "No contact name"}
                                    </span>
                                </div>
                                <div className="flex items-center text-gray-600">
                                    <Phone className="w-4 h-4 mr-2 flex-shrink-0" />
                                    <span>
                                        {team.contact_phone_number ||
                                            "No phone number"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats */}
                        <div className="px-6 py-4 border-t border-gray-100">
                            <div className="flex justify-between text-sm">
                                <div className="text-gray-500">
                                    <Trophy className="w-4 h-4 inline mr-1" />
                                    <span>5 matches won</span>
                                </div>
                                <div className="text-gray-500">
                                    <Calendar className="w-4 h-4 inline mr-1" />
                                    <span>3 upcoming</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* No Results */}
            {filteredTeams.length === 0 && (
                <div className="text-center py-12">
                    <div className="bg-gray-50 rounded-lg p-6 inline-block">
                        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-gray-900 font-semibold mb-2">
                            No teams found
                        </h3>
                        <p className="text-gray-500">
                            Try adjusting your search criteria
                        </p>
                    </div>
                </div>
            )}

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-center items-center gap-4 mt-8 mb-8">
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
                            setCurrentPage((p) => Math.min(totalPages, p + 1))
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

            {/* Team Details Modal */}
            {selectedTeam && (
                <TeamDetailsModal
                    team={selectedTeam}
                    onClose={() => setSelectedTeam(null)}
                />
            )}
        </>
    );
};

export default Teams;
