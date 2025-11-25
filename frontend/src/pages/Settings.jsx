// src/pages/Settings.jsx
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaUser, FaLock, FaSignOutAlt, FaTrash } from "react-icons/fa";
import SpaceBackground from "../components/SpaceBackground";

const Settings = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  
  // 비밀번호 변경 상태
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  
  const token = localStorage.getItem("token");

  // 사용자 정보 불러오기
  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    fetch("http://localhost:8000/api/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => setUsername(data.username))
      .catch(() => {
        localStorage.clear();
        navigate("/");
      });
  }, [token, navigate]);

  // 비밀번호 변경 핸들러
  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!confirm("정말 비밀번호를 변경하시겠습니까?")) return;

    try {
      const res = await fetch("http://localhost:8000/api/users/password", {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ old_password: oldPassword, new_password: newPassword }),
      });
      const data = await res.json();
      
      if (res.ok) {
        alert("비밀번호가 변경되었습니다.");
        setOldPassword("");
        setNewPassword("");
      } else {
        alert(data.detail || "오류가 발생했습니다.");
      }
    } catch (err) {
      alert("서버 연결 오류");
    }
  };

  // 회원 탈퇴 핸들러
  const handleDeleteAccount = async () => {
    const promptText = prompt("탈퇴하려면 'DELETE'를 입력하세요.");
    if (promptText !== "DELETE") return;

    try {
      const res = await fetch("http://localhost:8000/api/users/me", {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        alert("계정이 삭제되었습니다. 안녕히 가세요!");
        handleLogout();
      } else {
        alert("오류가 발생했습니다.");
      }
    } catch (err) {
      alert("서버 연결 오류");
    }
  };

  // 로그아웃
  const handleLogout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <SpaceBackground>
      <div style={containerStyle}>
        
        {/* 헤더 (뒤로가기) */}
        <div style={headerStyle}>
          <FaArrowLeft 
            size={24} 
            style={{ cursor: "pointer" }} 
            onClick={() => navigate("/select")} 
          />
          <h2 style={{ margin: 0, marginLeft: "15px" }}>Settings</h2>
        </div>

        {/* 1. 프로필 섹션 */}
        <div style={sectionStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "15px", marginBottom: "10px" }}>
            <div style={avatarStyle}><FaUser size={20}/></div>
            <div>
              <div style={{ fontSize: "0.8rem", color: "#aaa" }}>Logged in as</div>
              <div style={{ fontSize: "1.2rem", fontWeight: "bold" }}>{username}</div>
            </div>
          </div>
          <button onClick={handleLogout} style={logoutButtonStyle}>
            <FaSignOutAlt /> 로그아웃
          </button>
        </div>

        {/* 2. 비밀번호 변경 섹션 */}
        <div style={sectionStyle}>
          <h3 style={subTitleStyle}><FaLock /> 비밀번호 변경</h3>
          <form onSubmit={handleChangePassword} style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <input 
              type="password" 
              placeholder="현재 비밀번호" 
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              style={inputStyle}
              required
            />
            <input 
              type="password" 
              placeholder="새 비밀번호" 
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              style={inputStyle}
              required
            />
            <button type="submit" style={actionButtonStyle}>변경하기</button>
          </form>
        </div>

        {/* 3. 위험 구역 (탈퇴) */}
        <div style={{ ...sectionStyle, border: "1px solid rgba(255, 100, 100, 0.3)" }}>
          <h3 style={{ ...subTitleStyle, color: "#ff7675" }}><FaTrash /> Danger Zone</h3>
          <p style={{ fontSize: "0.8rem", color: "#ccc", marginBottom: "15px" }}>
            계정을 삭제하면 모든 데이터가 사라지며 복구할 수 없습니다.
          </p>
          <button onClick={handleDeleteAccount} style={dangerButtonStyle}>
            회원 탈퇴
          </button>
        </div>

      </div>
    </SpaceBackground>
  );
};

// --- Styles ---
const containerStyle = {
  width: "100%",
  maxWidth: "500px",
  padding: "20px",
  display: "flex",
  flexDirection: "column",
  gap: "20px",
};

const headerStyle = {
  display: "flex",
  alignItems: "center",
  marginBottom: "10px",
  padding: "10px",
};

const sectionStyle = {
  background: "rgba(255, 255, 255, 0.05)",
  backdropFilter: "blur(10px)",
  borderRadius: "15px",
  padding: "20px",
  border: "1px solid rgba(255, 255, 255, 0.1)",
};

const subTitleStyle = {
  fontSize: "1rem",
  marginBottom: "15px",
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

const avatarStyle = {
  width: "50px",
  height: "50px",
  borderRadius: "50%",
  background: "linear-gradient(45deg, #6c5ce7, #a29bfe)",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
};

const inputStyle = {
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid rgba(255, 255, 255, 0.2)",
  background: "rgba(0, 0, 0, 0.3)",
  color: "white",
  fontSize: "0.9rem",
};

const actionButtonStyle = {
  padding: "12px",
  borderRadius: "8px",
  border: "none",
  background: "#6c5ce7",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
};

const logoutButtonStyle = {
  width: "100%",
  padding: "10px",
  marginTop: "10px",
  borderRadius: "8px",
  border: "1px solid rgba(255, 255, 255, 0.3)",
  background: "transparent",
  color: "white",
  cursor: "pointer",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: "8px",
};

const dangerButtonStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "8px",
  border: "none",
  background: "#d63031",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
};

export default Settings;