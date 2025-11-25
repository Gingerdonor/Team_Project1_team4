import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaCog, FaCrown } from "react-icons/fa"; // 👑 왕관 아이콘 추가
import SpaceBackground from "../components/SpaceBackground";
import FlipCard from "../components/FlipCard";

const Selection = () => {
  const navigate = useNavigate();

  const [userInfo, setUserInfo] = useState({
    nickname: "Loading...",
    membership: "Standard",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("로그인이 필요합니다.");
      navigate("/");
      return;
    }

    fetch("http://localhost:8000/api/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("토큰 만료");
        return res.json();
      })
      .then((data) => {
        setUserInfo({
          nickname: data.nickname || data.username,
          // 모든 유저를 일단 VIP로 대우 (추후 DB에 등급 컬럼 추가 가능)
          membership: "VIP Member",
        });
      })
      .catch(() => {
        localStorage.clear();
        navigate("/");
      });
  }, [navigate]);

  return (
    <SpaceBackground>
      {/* 상단 헤더 (설정 버튼) */}
      <div style={{ position: "absolute", top: 20, right: 20, zIndex: 10 }}>
        <FaCog
          size={30}
          style={{ cursor: "pointer", opacity: 0.8, color: "white" }}
          onClick={() => navigate("/settings")}
        />
      </div>

      {/* 유저 뱃지 (VIP 스타일 적용) */}
      <div style={{ position: "absolute", top: 20, zIndex: 10 }}>
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          style={userBadgeStyle}
        >
          {/* 닉네임 */}
          <span style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
            {userInfo.nickname}
          </span>

          {/* 구분선 */}
          <div
            style={{
              width: "1px",
              height: "15px",
              background: "rgba(255,255,255,0.4)",
            }}
          ></div>

          {/* VIP 배지 */}
          <div style={vipBadgeStyle}>
            <FaCrown size={14} style={{ marginBottom: "2px" }} />
            <span>{userInfo.membership}</span>
          </div>
        </motion.div>
      </div>

      {/* 카드 배치 영역 */}
      <div
        style={{
          display: "flex",
          gap: "50px",
          flexWrap: "wrap",
          justifyContent: "center",
          alignItems: "center",
          height: "80vh",
        }}
      >
        {/* 왼쪽 카드: Persona */}
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <FlipCard
            title="My Persona"
            color="#ff7675"
            description="오늘 당신의 오행 에너지는 '불(Fire)'입니다. 열정적인 태도가 행운을 부릅니다!"
          />
        </motion.div>

        {/* 오른쪽 카드: Destiny */}
        <motion.div
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <FlipCard
            title="My Destiny"
            color="#74b9ff"
            description="오늘 당신의 귀인은 'ESTJ' 성향을 가진 사람입니다. 주변을 잘 살펴보세요."
          />
        </motion.div>
      </div>
    </SpaceBackground>
  );
};

// --- 스타일 정의 ---

const userBadgeStyle = {
  display: "flex",
  alignItems: "center",
  gap: "15px",
  padding: "10px 25px",
  // 유리 질감 (Glassmorphism)
  background: "rgba(20, 20, 20, 0.6)",
  border: "1px solid rgba(255, 255, 255, 0.15)",
  borderRadius: "50px",
  backdropFilter: "blur(12px)",
  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
  color: "white",
};

const vipBadgeStyle = {
  display: "flex",
  alignItems: "center",
  gap: "6px",
  fontSize: "0.85rem",
  fontWeight: "bold",
  // 골드 그라데이션 (VIP 느낌)
  background: "linear-gradient(135deg, #FFD700 0%, #FDB931 100%)",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  // 아이콘 색상은 그라데이션이 안 먹히므로 따로 지정 (여기서는 텍스트와 어울리게 골드색으로 보이게 꼼수)
  color: "#FFD700",
  textShadow: "0 0 10px rgba(255, 215, 0, 0.3)", // 은은한 금빛 광채
};

export default Selection;
