import { useState, useCallback } from "react";
import { refereeService } from "../services/api";
import { batchGeocodeAddresses, calculateDistance } from "../utils/geocoding";
import { toast } from "react-toastify";

export const useRefereeFilter = () => {
    const [referees, setReferees] = useState([]);
    const [filteredReferees, setFilteredReferees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        availability: false,
        level: "",
        minAge: "",
        minExperience: "",
        distance: 50,
        address: "",
    });

    const fetchReferees = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await refereeService.getAllReferees();
            const refereeData = Array.isArray(response.data)
                ? response.data
                : [];

            const addressesToGeocode = refereeData.map((referee) => ({
                id: referee.referee_id,
                address: referee.location,
            }));

            const geocodedResults = await batchGeocodeAddresses(
                addressesToGeocode,
            );

            const processedReferees = refereeData.map((referee) => {
                const geocodeResult = geocodedResults.find(
                    (r) => r.id === referee.referee_id,
                );
                return {
                    ...referee,
                    coordinates: geocodeResult?.coordinates,
                    formattedAddress: geocodeResult?.formattedAddress,
                };
            });

            setReferees(processedReferees);
            setFilteredReferees(processedReferees);

            return processedReferees;
        } catch (err) {
            const errorMessage =
                err.response?.data?.message || "Failed to fetch referees";
            setError(errorMessage);
            toast.error(errorMessage);
            throw err;
        } finally {
            setLoading(false);
        }
    }, []);

    const applyFilters = useCallback(
        (searchCoordinates = null) => {
            if (!Array.isArray(referees)) return;

            const filtered = referees.filter((referee) => {
                if (!referee) return false;

                const meetsAvailability =
                    !filters.availability || referee.isAvailable;
                const meetsLevel =
                    !filters.level || referee.level === filters.level;
                const meetsAge =
                    !filters.minAge || referee.age >= parseInt(filters.minAge);
                const meetsExperience =
                    !filters.minExperience ||
                    referee.experience_years >= parseInt(filters.minExperience);

                // Check distance if search coordinates exist
                let meetsDistance = true;
                if (
                    searchCoordinates &&
                    referee.coordinates &&
                    filters.distance
                ) {
                    const distance = calculateDistance(
                        searchCoordinates.lat,
                        searchCoordinates.lng,
                        referee.coordinates.lat,
                        referee.coordinates.lng,
                    );
                    meetsDistance = distance <= filters.distance;
                }

                return (
                    meetsAvailability &&
                    meetsLevel &&
                    meetsAge &&
                    meetsExperience &&
                    meetsDistance
                );
            });

            setFilteredReferees(filtered);
            return filtered;
        },
        [referees, filters],
    );

    const updateFilters = useCallback((newFilters) => {
        setFilters((prev) => ({ ...prev, ...newFilters }));
    }, []);

    const resetFilters = useCallback(() => {
        setFilters({
            availability: false,
            level: "",
            minAge: "",
            minExperience: "",
            distance: 50,
            address: "",
        });
        setFilteredReferees(referees);
    }, [referees]);

    return {
        referees,
        filteredReferees,
        loading,
        error,
        filters,
        fetchReferees,
        applyFilters,
        updateFilters,
        resetFilters,
    };
};
