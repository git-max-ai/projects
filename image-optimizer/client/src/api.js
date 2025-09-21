import axios from "axios";

const API = axios.create({
    baseURL: "http://localhost:4000", // backend URL
    timeout: 60000, // 60 second timeout for large files
});

// Single image optimization
export const optimizeImage = (formData) =>
    API.post("/optimize", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });

// Batch image optimization
export const optimizeImageBatch = (formData) =>
    API.post("/optimize-batch", formData, {
        headers: { "Content-Type": "multipart/form-data" },
    });

// Get all processed images with pagination
export const getImages = (page = 1, limit = 20) =>
    API.get(`/images?page=${page}&limit=${limit}`);

// Get optimization statistics
export const getStats = () =>
    API.get("/stats");

// Get server capabilities
export const getCapabilities = () =>
    API.get("/capabilities");

// Error handling interceptor
API.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error("API Error:", error);

        if (error.response) {
            // Server responded with error status
            const message = error.response.data?.error || error.response.data?.message || 'Server error';
            throw new Error(message);
        } else if (error.request) {
            // Network error
            throw new Error('Network error. Please check your connection.');
        } else {
            // Other error
            throw new Error('An unexpected error occurred.');
        }
    }
);

export default API;
