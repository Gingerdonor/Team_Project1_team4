import { useState, useEffect, useCallback } from "react";
import { authAPI } from "../api/api";

export const useAuth = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem("access_token");
    if (!token) {
      setIsLoading(false);
      setIsAuthenticated(false);
      return;
    }

    try {
      const response = await authAPI.getMe();
      setUser(response.data);
      setIsAuthenticated(true);
    } catch (error) {
      localStorage.removeItem("access_token");
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async (credentials) => {
    const response = await authAPI.login(credentials);
    localStorage.setItem("access_token", response.data.access_token);
    await checkAuth();
    return response;
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("로그아웃 API 호출 실패:", error);
    } finally {
      localStorage.removeItem("access_token");
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const register = async (userData) => {
    const response = await authAPI.register(userData);
    return response;
  };

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
    register,
    checkAuth,
  };
};

export default useAuth;
