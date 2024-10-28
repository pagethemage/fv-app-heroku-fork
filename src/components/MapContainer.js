import React from "react";
import ErrorDisplay from "./ErrorDisplay";
import LoadingSpinner from "./LoadingSpinner";

const MapContainer = ({ mapRef, error, isLoading }) => {
    if (error) {
        return (
            <div className="w-full h-[500px] flex items-center justify-center">
                <ErrorDisplay
                    error={error}
                    message="Failed to load map"
                    onRetry={() => window.location.reload()}
                />
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="w-full h-[500px] flex items-center justify-center">
                <LoadingSpinner message="Loading map..." />
            </div>
        );
    }

    return (
        <div
            ref={mapRef}
            className="w-full h-[500px] rounded-lg"
            id="google-map"
        />
    );
};

export default MapContainer;
