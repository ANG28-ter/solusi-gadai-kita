import axios from "axios";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Add selected branch header for Manager cross-branch access
  const selectedBranchId = localStorage.getItem("selectedBranchId");
  if (selectedBranchId) {
    config.headers['X-Selected-Branch'] = selectedBranchId;
  }

  console.log("API INSTANCE ACTIVE:", process.env.NEXT_PUBLIC_API_BASE_URL);
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      console.warn("Session expired or unauthorized. Logging out...");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("selectedBranchId");

      // Prevent infinite reload loops if already on login
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
