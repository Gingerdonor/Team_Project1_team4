// src/pages/Login.jsx
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import SpaceBackground from "../components/SpaceBackground";

const Login = () => {
  const navigate = useNavigate();

  return (
    <SpaceBackground>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        style={{ textAlign: "center" }}
      >
        <h1 style={{ fontSize: "4rem", marginBottom: "50px", textShadow: "0 0 20px #a29bfe" }}>
          My Destina
        </h1>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: "#6c5ce7" }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/select")} // 로그인하면 선택 화면으로 이동
            style={buttonStyle}
          >
            Login
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.05, backgroundColor: "#fd79a8" }}
            whileTap={{ scale: 0.95 }}
            style={{ ...buttonStyle, backgroundColor: "#e84393" }}
          >
            Make Account
          </motion.button>
        </div>
      </motion.div>
    </SpaceBackground>
  );
};

const buttonStyle = {
  padding: "15px 50px",
  fontSize: "1.2rem",
  border: "none",
  borderRadius: "30px",
  backgroundColor: "#4834d4",
  color: "white",
  fontWeight: "bold",
  boxShadow: "0 0 15px rgba(100, 100, 255, 0.5)",
  transition: "background-color 0.3s",
};

export default Login;