import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import SpaceBackground from "../components/SpaceBackground";

const Login = () => {
  const navigate = useNavigate();

  // 상태 관리: 모드(로그인/가입), 입력값
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  // 회원가입용 추가 상태
  const [nickname, setNickname] = useState("");
  const [birthdate, setBirthdate] = useState("");
  const [gender, setGender] = useState("male");

  const [errorMsg, setErrorMsg] = useState("");

  // 페이지 로드 시 로그인 여부 확인 및 리다이렉트
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      // 이미 토큰이 있다면 선택 화면으로 바로 이동
      navigate("/select", { replace: true });
    }
  }, [navigate]);

  // API 호출 핸들러
  const handleSubmit = async (e) => {
    e.preventDefault(); // 새로고침 방지
    setErrorMsg("");

    try {
      let response;

      if (isLoginMode) {
        // 로그인: Form Data 형식으로 전송 (OAuth2PasswordRequestForm 호환)
        const formData = new URLSearchParams();
        formData.append("username", username);
        formData.append("password", password);

        response = await fetch("/api/login", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: formData,
        });
      } else {
        // 회원가입: 기존 JSON 형식 유지
        response = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username,
            password,
            nickname,
            birthdate,
            gender,
          }),
        });
      }

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
        <h1
          style={{
            fontSize: "3.5rem",
            marginBottom: "30px",
            textShadow: "0 0 20px #a29bfe",
          }}
        >
          My Destina
        </h1>

        <div style={formCardStyle}>
          <h2 style={{ marginBottom: "20px" }}>
            {isLoginMode ? "LOGIN" : "SIGN UP"}
          </h2>

          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "15px" }}
          >
            {/* 공통 필드 */}
            <input
              type="text"
              placeholder="ID"
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

            {/* 회원가입일 때만 보이는 필드들 */}
            {!isLoginMode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "15px",
                }}
              >
                <input
                  type="text"
                  placeholder="닉네임"
                  value={nickname}
                  onChange={(e) => setNickname(e.target.value)}
                  style={inputStyle}
                  required
                />

                <div style={{ display: "flex", gap: "10px" }}>
                  <input
                    type="date"
                    value={birthdate}
                    onChange={(e) => setBirthdate(e.target.value)}
                    style={{ ...inputStyle, flex: 1 }}
                    required
                    min="1950-01-01"
                    max="2050-12-31"
                  />
                  <select
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                    style={{ ...inputStyle, width: "100px" }}
                  >
                    <option value="male">남성</option>
                    <option value="female">여성</option>
                  </select>
                </div>
              </motion.div>
            )}

            {errorMsg && (
              <p style={{ color: "#ff7675", fontSize: "0.9rem" }}>{errorMsg}</p>
            )}

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
              onClick={() => {
                setIsLoginMode(!isLoginMode);
                setErrorMsg("");
              }}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter") setIsLoginMode(!isLoginMode);
              }}
              style={{
                color: "#74b9ff",
                cursor: "pointer",
                fontWeight: "bold",
                textDecoration: "underline",
              }}
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
