import axios from "axios";

const BASE_URL = process.env.REACT_APP_API_BASE_URL;

// Create axios instance with default config
const api = axios.create({
    baseURL: BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Auth endpoints
export const authService = {
    login: (credentials) => api.post("/auth/login/", credentials),
    register: (userData) => api.post("/auth/register/", userData),
    logout: () => api.post("/auth/logout/"),
    getCurrentUser: () => api.get("/auth/current-user/"),
};

// Referee endpoints
export const refereeService = {
    getRefereeProfile: (id) => api.get(`/referee/${id}/`),
    updateRefereeProfile: (id, data) => api.put(`/referee/${id}/`, data),
    getAllReferees: () => api.get("/referee/"),
    getRefereesByFilters: (filters) => {
        const params = new URLSearchParams();

        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
                params.append(key, value);
            }
        });

        return api.get(`/referee/filter/?${params.toString()}`);
    },
};

// Appointment endpoints
export const appointmentService = {
    getAllAppointments: async () => {
        const response = await api.get("/appointments/");
        return {
            ...response,
            data: response.data.results || [], // Extract the results array
        };
    },
    getAppointment: (id) => api.get(`/appointments/${id}/`),
    createAppointment: (data) => api.post("/appointments/", data),
    updateAppointment: (id, data) => api.put(`/appointments/${id}/`, data),
    deleteAppointment: (id) => api.delete(`/appointments/${id}/`),
};

// Availability endpoints
export const availabilityService = {
    getAvailability: (refereeId) =>
        api.get(`/availability/?referee=${refereeId}`),
    updateAvailability: (refereeId, data) =>
        api.post(`/availability/`, {
            referee: refereeId,
            ...data,
        }),
    getAvailableDates: (refereeId) =>
        api.get(`/availability/dates/?referee=${refereeId}`),
    getUnavailableDates: (refereeId) =>
        api.get(`/availability/unavailable/?referee=${refereeId}`),
};

// Venue endpoints
export const venueService = {
    getAllVenues: () => api.get("/venues/"),
    getVenue: (id) => api.get(`/venues/${id}/`),
    createVenue: (data) => api.post("/venues/", data),
    updateVenue: (id, data) => api.put(`/venues/${id}/`, data),
    deleteVenue: (id) => api.delete(`/venues/${id}/`),
};

// Team endpoints
export const teamService = {
    getAllTeams: () => api.get("/teams/"),
    getTeam: (id) => api.get(`/teams/${id}/`),
    createTeam: (data) => api.post("/teams/", data),
    updateTeam: (id, data) => api.put(`/teams/${id}/`, data),
    deleteTeam: (id) => api.delete(`/teams/${id}/`),
};

// Request interceptor for adding auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("authToken");
        if (token) {
            config.headers.Authorization = `Token ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    },
);

// Response interceptor for handling errors
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem("authToken");
            window.location.href = "/login";
        }
        return Promise.reject(error);
    },
);

export default api;
