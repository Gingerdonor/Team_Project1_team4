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

  const [analysis, setAnalysis] = useState({
    my_persona: "Loading...",
    my_destiny: "Loading...",
    persona_desc: "분석 중입니다...",
    destiny_desc: "운명의 상대를 찾는 중...",
    lucky_color: "#a29bfe", // 기본색
  });

  // 오행별 색상 매핑
  const ELEMENT_COLORS = {
    "목(木)": "#00b894", // 초록
    "화(火)": "#ff7675", // 빨강
    "토(土)": "#fdcb6e", // 노랑
    "금(金)": "#dfe6e9", // 흰색/회색
    "수(水)": "#74b9ff", // 파랑
  };

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      alert("로그인이 필요합니다.");
      navigate("/", { replace: true }); // 뒤로가기 방지하며 이동
      return;
    }

    fetch("/api/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) {
          // 토큰이 만료되었거나 위조된 경우
          throw new Error("토큰 만료");
        }
        return res.json();
      })
      .then((data) => {
        setUserInfo({
          nickname: data.nickname || data.username,
          membership: "VIP Member",
        });
        return fetch("/api/analyze/today", {
          headers: { Authorization: `Bearer ${token}` },
        });
      })
      .then((res) => {
        if (res) return res.json(); // 위에서 에러나면 res가 없을 수 있음
      })
      .then((data) => {
        if (data) {
          setAnalysis({
            ...data,
            lucky_color: ELEMENT_COLORS[data.lucky_element] || "#a29bfe",
          });
        }
      })
      .catch(() => {
        // 에러 발생 시(토큰 만료 등) 로그아웃 처리 후 내보내기
        localStorage.removeItem("token"); // 잘못된 토큰 삭제
        localStorage.removeItem("username");
        alert("로그인 세션이 만료되었습니다.");
        navigate("/", { replace: true });
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

      {/* 유저 뱃지 */}
      <div style={{ marginTop: "80px", marginBottom: "30px", zIndex: 10 }}>
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          style={userBadgeStyle}
        >
          <span style={{ fontSize: "1.2rem", fontWeight: "bold" }}>
            {userInfo.nickname}
          </span>
          <div
            style={{
              width: "1px",
              height: "15px",
              background: "rgba(255,255,255,0.4)",
            }}
          ></div>
          <div style={vipBadgeStyle}>
            <FaCrown size={14} style={{ marginBottom: "2px" }} />
            <span>{userInfo.membership}</span>
          </div>
        </motion.div>
      </div>

      {/* 카드 배치 영역 */}
      <div style={cardContainerStyle}>
        {/* Persona Card */}
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <FlipCard
            title="My Persona"
            color={analysis.lucky_color} // 행운의 색 적용
            description={
              <>
                <div
                  style={{
                    fontSize: "2rem",
                    fontWeight: "bold",
                    marginBottom: "10px",
                  }}
                >
                  {analysis.my_persona}
                </div>
                {analysis.persona_desc}
              </>
            }
          />
        </motion.div>

        {/* Destiny Card */}
        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          <FlipCard
            title="My Destiny"
            color="#fab1a0"
            description={
              <>
                <div
                  style={{
                    fontSize: "2rem",
                    fontWeight: "bold",
                    marginBottom: "10px",
                  }}
                >
                  {analysis.my_destiny}
                </div>
                {analysis.destiny_desc}
              </>
            }
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

const cardContainerStyle = {
  display: "flex",
  flexWrap: "wrap",
  justifyContent: "center",
  gap: "40px",
  width: "100%",
  maxWidth: "1000px",
  padding: "40px 20px 100px 20px",
  height: "auto",
};

export default Selection;
