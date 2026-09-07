import axios from "axios";

const api = axios.create({
    baseURL:
        import.meta.env.VITE_API_URL ||
        "https://tailoring-management-cvah.onrender.com/api/",
    headers: {
        "Content-Type": "application/json",
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token");

        console.log("API TOKEN:", token ? "TOKEN FOUND" : "NO TOKEN");

        if (token) {
            if (!config.headers) {
                config.headers = {};
            }

            config.headers.Authorization = `Token ${token}`;
        }

        console.log(
            "AUTH HEADER:",
            config.headers?.Authorization || "NOT SET"
        );

        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

export default api;