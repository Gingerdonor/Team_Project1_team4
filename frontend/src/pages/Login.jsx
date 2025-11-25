import { motion } from "framer-motion";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import SpaceBackground from "../components/SpaceBackground";

const Login = () => {
  const navigate = useNavigate();
  
  // 상태 관리: 모드(로그인/가입), 입력값
  const [isLoginMode, setIsLoginMode] = useState(true); 
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  // API 호출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault(); // 새로고침 방지
    setErrorMsg("");

    const endpoint = isLoginMode ? "/api/login" : "/api/register";
    const url = `http://localhost:8000${endpoint}`;

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "오류가 발생했습니다.");
      }

      if (isLoginMode) {
        // 로그인 성공: 토큰 저장 후 이동
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("username", username); // 편의상 저장
        navigate("/select");
      } else {
        // 회원가입 성공: 로그인 모드로 전환
        alert("회원가입 완료! 로그인해주세요.");
        setIsLoginMode(true);
        setPassword("");
      }

    } catch (err) {
      setErrorMsg(err.message);
    }
  };

  return (
    <SpaceBackground>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{ textAlign: "center", width: "100%", maxWidth: "400px" }}
      >
        <h1 style={{ fontSize: "3.5rem", marginBottom: "30px", textShadow: "0 0 20px #a29bfe" }}>
          My Destina
        </h1>

        <div style={formCardStyle}>
          <h2 style={{ marginBottom: "20px" }}>
            {isLoginMode ? "LOGIN" : "SIGN UP"}
          </h2>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={inputStyle}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={inputStyle}
              required
            />
            
            {errorMsg && <p style={{ color: "#ff7675", fontSize: "0.9rem" }}>{errorMsg}</p>}

            <motion.button
              whileHover={{ scale: 1.02, backgroundColor: "#6c5ce7" }}
              whileTap={{ scale: 0.95 }}
              type="submit"
              style={mainButtonStyle}
            >
              {isLoginMode ? "Start Journey" : "Create Account"}
            </motion.button>
          </form>

          <div style={{ marginTop: "20px", fontSize: "0.9rem", color: "#ccc" }}>
            {isLoginMode ? "계정이 없으신가요? " : "이미 계정이 있으신가요? "}
            <span 
              onClick={() => { setIsLoginMode(!isLoginMode); setErrorMsg(""); }}
              style={{ color: "#74b9ff", cursor: "pointer", fontWeight: "bold", textDecoration: "underline" }}
            >
              {isLoginMode ? "회원가입" : "로그인"}
            </span>
          </div>
        </div>

      </motion.div>
    </SpaceBackground>
  );
};

// --- 스타일 정의 ---
const formCardStyle = {
  background: "rgba(255, 255, 255, 0.05)",
  backdropFilter: "blur(10px)",
  padding: "40px",
  borderRadius: "20px",
  border: "1px solid rgba(255, 255, 255, 0.1)",
  boxShadow: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
};

const inputStyle = {
  padding: "15px",
  borderRadius: "10px",
  border: "1px solid rgba(255, 255, 255, 0.2)",
  background: "rgba(0, 0, 0, 0.3)",
  color: "white",
  fontSize: "1rem",
  outline: "none",
};

const mainButtonStyle = {
  padding: "15px",
  marginTop: "10px",
  fontSize: "1.1rem",
  border: "none",
  borderRadius: "10px",
  backgroundColor: "#4834d4",
  color: "white",
  fontWeight: "bold",
  cursor: "pointer",
  transition: "background 0.3s",
};

export default Login;