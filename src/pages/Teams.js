import React, { useState, useEffect } from "react";
import { useAppContext } from "../contexts/AppContext";
import TitleWithBar from "../components/TitleWithBar";
import withAsyncState from "../hoc/withAsyncState";
import Button from "../components/Button";
import { teamService } from "../services/api";
import { toast } from "react-toastify";
import ErrorDisplay from "../components/ErrorDisplay";
import LoadingSpinner from "../components/LoadingSpinner";

const Teams = () => {
    const [teams, setTeams] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedTeam, setSelectedTeam] = useState(null);

    useEffect(() => {
        const fetchTeams = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await teamService.getAllTeams();

                // Handle both array and paginated responses
                const teamsData = Array.isArray(response.data)
                    ? response.data
                    : response.data.results || [];

                setTeams(teamsData);
            } catch (err) {
                console.error('Error fetching teams:', err);
                setError(err.message || 'Failed to load teams');
            } finally {
                setLoading(false);
            }
        };

        fetchTeams();
    }, []);

    const TeamsContent = withAsyncState(({ teams }) => (
        <div>
            <TitleWithBar title="Teams" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map((team) => (
                    <div
                        key={team.id}
                        className="bg-white shadow rounded-lg p-6 hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => setSelectedTeam(team)}
                    >
                        <h3 className="font-semibold text-lg mb-2">
                            {team.club_name}
                        </h3>
                        <div className="space-y-2 text-gray-600">
                            <p>
                                Venue:{" "}
                                {team.home_venue?.venue_name || "Not specified"}
                            </p>
                            <p>Contact: {team.contact_name}</p>
                            <p>Phone: {team.contact_phone_number}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Team Details Modal */}
            {selectedTeam && (
                <TeamDetailsModal
                    team={selectedTeam}
                    onClose={() => setSelectedTeam(null)}
                />
            )}
        </div>
    ));

    return (
        <TeamsContent
            loading={loading}
            error={error}
            teams={teams}
            onRetry={() => window.location.reload()}
            loadingMessage="Loading teams..."
            errorMessage="Failed to load teams"
        />
    );
};

const TeamDetailsModal = ({ team, onClose }) => {
    const [matches, setMatches] = useState({ home: [], away: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchMatches = async () => {
            try {
                setLoading(true);
                const [homeMatches, awayMatches] = await Promise.all([
                    teamService.getHomeMatches(team.club_id),
                    teamService.getAwayMatches(team.club_id),
                ]);
                setMatches({
                    home: homeMatches.data,
                    away: awayMatches.data,
                });
            } catch (err) {
                setError("Failed to load matches");
            } finally {
                setLoading(false);
            }
        };

        fetchMatches();
    }, [team.club_id]);

    const MatchesList = withAsyncState(({ matches }) => (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-2xl font-bold">{team.club_name}</h2>
                    <Button onClick={onClose} variant="secondary">
                        Close
                    </Button>
                </div>

                <div className="space-y-6">
                    <section>
                        <h3 className="text-lg font-semibold mb-3">
                            Home Matches
                        </h3>
                        {matches.home.length > 0 ? (
                            <div className="space-y-2">
                                {matches.home.map((match) => (
                                    <div
                                        key={match.match_id}
                                        className="bg-gray-50 p-3 rounded"
                                    >
                                        <p className="font-medium">
                                            vs {match.away_club.club_name}
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
                                No upcoming home matches
                            </p>
                        )}
                    </section>

                    <section>
                        <h3 className="text-lg font-semibold mb-3">
                            Away Matches
                        </h3>
                        {matches.away.length > 0 ? (
                            <div className="space-y-2">
                                {matches.away.map((match) => (
                                    <div
                                        key={match.match_id}
                                        className="bg-gray-50 p-3 rounded"
                                    >
                                        <p className="font-medium">
                                            vs {match.home_club.club_name}
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
                                No upcoming away matches
                            </p>
                        )}
                    </section>
                </div>
            </div>
        </div>
    ));

    return (
        <MatchesList
            loading={loading}
            error={error}
            matches={matches}
            loadingMessage="Loading matches..."
            errorMessage="Failed to load matches"
        />
    );
};

export default Teams;
