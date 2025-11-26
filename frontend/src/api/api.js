import axios from "axios";

const API_BASE_URL = "http://localhost:8000/api";

// Axios 인스턴스 생성
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// 요청 인터셉터 - 토큰 자동 추가
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  const newConfig = { ...config };
  if (token) {
    newConfig.headers.Authorization = `Bearer ${token}`;
  }
  return newConfig;
});

// 응답 인터셉터 - 401 에러 시 로그아웃 처리
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem("access_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

// 인증 관련 API
export const authAPI = {
  register: (userData) => api.post("/register", userData),
  login: (credentials) => api.post("/login", credentials),
  logout: () => api.post("/logout"),
  getMe: () => api.get("/users/me"),
};

// 사용자 관련 API
export const userAPI = {
  updateProfile: (profileData) => api.put("/users/profile", profileData),
  changePassword: (passwordData) => api.put("/users/password", passwordData),
  deleteAccount: () => api.delete("/users/me"),
};

// 분석 관련 API
export const analysisAPI = {
  analyzeToday: () => api.get("/analyze/today"),
};

// 캘린더 관련 API
export const calendarAPI = {
  getMonth: (year, month) => api.get(`/calendar/${year}/${month}`),
  getDate: (dateStr) => api.get(`/calendar/date/${dateStr}`),
  getHistory: (limit = 30) => api.get(`/calendar/history?limit=${limit}`),
};

export default api;
