import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import "./LogoutButton.css";

const LogoutButton = ({ onLogoutSuccess }) => {
  const { logout } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    if (window.confirm("정말 로그아웃 하시겠습니까?")) {
      setIsLoading(true);
      try {
        await logout();
        if (onLogoutSuccess) {
          onLogoutSuccess();
        }
      } catch (error) {
        console.error("로그아웃 실패:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <button
      type="button"
      className="logout-button"
      onClick={handleLogout}
      disabled={isLoading}
    >
      {isLoading ? "로그아웃 중..." : "로그아웃"}
    </button>
  );
};

export default LogoutButton;
