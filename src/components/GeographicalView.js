import React, { useEffect, useRef, useState } from "react";
import ReactDOMServer from "react-dom/server";
import { UserCircle, MapPin } from "lucide-react";

const GeographicalView = ({ referees, venues, filters }) => {
    const mapRef = useRef(null);
    const googleMapRef = useRef(null);
    const [filteredReferees, setFilteredReferees] = useState([]);
    const [filteredVenues, setFilteredVenues] = useState([]);
    const markersRef = useRef([]);

    useEffect(() => {
        const googleMapScript = document.createElement("script");
        googleMapScript.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.GOOGLE_MAPS_API_KEY}&callback=initMap&v=beta`;
        googleMapScript.async = true;
        window.document.body.appendChild(googleMapScript);

        window.initMap = initMap;

        return () => {
            window.document.body.removeChild(googleMapScript);
        };
    }, []);

    useEffect(() => {
        if (googleMapRef.current) {
            applyFilters();
            updateMarkers();
        }
    }, [referees, venues, filters]);

    const initMap = () => {
        googleMapRef.current = new window.google.maps.Map(mapRef.current, {
            center: { lat: -37.8136, lng: 144.9631 },
            zoom: 12,
            mapId: "4f90136a1b865575",
            disableDefaultUI: true,
            zoomControl: true,
            mapTypeControl: false,
            scaleControl: true,
            streetViewControl: false,
            rotateControl: false,
            fullscreenControl: false,
        });
        applyFilters();
        updateMarkers();
    };

    const applyFilters = () => {
        const filteredRefs = referees.filter((referee) => {
            const isAvailable = !filters.availability || referee.isAvailable;
            const meetsLevelRequirement =
                !filters.level || referee.level === filters.level;
            const meetsAgeRequirement =
                !filters.minAge || referee.age >= filters.minAge;
            const meetsExperienceRequirement =
                !filters.minExperience ||
                referee.experienceYears >= filters.minExperience;
            const hasRequiredQualification =
                !filters.qualification ||
                referee.qualifications.includes(filters.qualification);
            const withinDistance =
                !filters.distance ||
                calculateDistance(referee.location, {
                    lat: -37.8136,
                    lng: 144.9631,
                }) <= filters.distance;

            return (
                isAvailable &&
                meetsLevelRequirement &&
                meetsAgeRequirement &&
                meetsExperienceRequirement &&
                hasRequiredQualification &&
                withinDistance
            );
        });
        setFilteredReferees(filteredRefs);

        const filteredVens = venues.filter(
            (venue) =>
                !filters.distance ||
                calculateDistance(venue.location, {
                    lat: -37.8136,
                    lng: 144.9631,
                }) <= filters.distance,
        );
        setFilteredVenues(filteredVens);
    };

    const createSVGIcon = (element) => {
        const svgString = ReactDOMServer.renderToString(element);
        return `data:image/svg+xml;base64,${btoa(svgString)}`;
    };

    const updateMarkers = () => {
        markersRef.current.forEach((marker) => marker.setMap(null));
        markersRef.current = [];

        filteredReferees.forEach((referee) => {
            const icon = createSVGIcon(
                <UserCircle
                    fill={referee.isAvailable ? "#235DAE" : "#9EACC1"}
                    color="white"
                    size={32}
                />,
            );

            const marker = new window.google.maps.Marker({
                position: referee.location,
                map: googleMapRef.current,
                title: `${referee.name} (${referee.level})`,
                icon: {
                    url: icon,
                    scaledSize: new window.google.maps.Size(32, 32),
                },
            });
            markersRef.current.push(marker);
        });

        filteredVenues.forEach((venue) => {
            const icon = createSVGIcon(
                <MapPin fill="#0F007D" color="white" size={32} />,
            );

            const marker = new window.google.maps.Marker({
                position: venue.location,
                map: googleMapRef.current,
                title: venue.name,
                icon: {
                    url: icon,
                    scaledSize: new window.google.maps.Size(32, 32),
                },
            });
            markersRef.current.push(marker);
        });
    };

    const calculateDistance = (point1, point2) => {
        const R = 6371; // Radius of the Earth in km
        const dLat = ((point2.lat - point1.lat) * Math.PI) / 180;
        const dLon = ((point2.lng - point1.lng) * Math.PI) / 180;
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos((point1.lat * Math.PI) / 180) *
                Math.cos((point2.lat * Math.PI) / 180) *
                Math.sin(dLon / 2) *
                Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c; // Distance in km
    };

    return (
        <div>
            <div ref={mapRef} style={{ width: "100%", height: "500px" }}></div>
            <div>Filtered Referees: {filteredReferees.length}</div>
            <div>Filtered Venues: {filteredVenues.length}</div>
        </div>
    );
};

export default GeographicalView;
