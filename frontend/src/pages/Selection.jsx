import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { FaCog, FaCrown, FaCalendarAlt, FaSignOutAlt } from "react-icons/fa";
import FlipCard from "../components/FlipCard";
import SpaceBackground from "../components/SpaceBackground";
import "./Selection.css";

// MBTI 별명 매핑
const MBTI_NICKNAMES = {
  ISTJ: "세상의 소금형",
  ISFJ: "임금 뒤편의 권력형",
  INFJ: "예언자형",
  INTJ: "과학자형",
  ISTP: "백과사전형",
  ISFP: "성인군자형",
  INFP: "잔다르크형",
  INTP: "아이디어형",
  ESTP: "활동가형",
  ESFP: "사교적인 유형",
  ENFP: "스파크형",
  ENTP: "발명가형",
  ESTJ: "사업가형",
  ESFJ: "친선도모형",
  ENFJ: "언변능숙형",
  ENTJ: "지도자형",
};

const CardSlot = ({ type, state, onSelect, label, icon, color }) => (
  <div className="card-slot">
    {/* 1. 대기 상태 */}
    {state.status === "idle" && (
      <motion.button
        type="button"
        className="slot-button"
        style={{ borderColor: color }}
        whileHover={{ scale: 1.02, boxShadow: `0 0 20px ${color}40` }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onSelect(type)}
      >
        <span className="slot-icon">{icon}</span>
        <h3 className="slot-title">{label}</h3>
        <p className="slot-desc">클릭하여 분석하기</p>
      </motion.button>
    )}

    {/* 2. 로딩 상태 */}
    {state.status === "loading" && (
      <motion.div
        className="slot-loading"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        <motion.div
          className="spinner"
          style={{ borderTopColor: color }}
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
        />
        <p>운명을 읽는 중...</p>
      </motion.div>
    )}

    {/* 3. 결과 완료 (FlipCard) */}
    {state.status === "success" && state.data && (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
      >
        <FlipCard
          title={state.data.title}
          subtitle={state.data.subtitle}
          color={state.data.color}
          description={state.data.description}
          axes={state.data.axes}
        />
      </motion.div>
    )}
  </div>
);

const Selection = () => {
  const navigate = useNavigate();

  // 1. 유저 정보 로딩
  const [userInfo, setUserInfo] = useState({
    nickname: "Loading...",
    membership: "Standard",
  });

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
      return;
    }

    fetch("/api/users/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("토큰 만료");
        return res.json();
      })
      .then((data) => {
        setUserInfo({
          nickname: data.nickname || data.username,
          membership: "VIP Member", // VIP 강제 적용
        });
      })
      .catch(() => {
        localStorage.clear();
        navigate("/");
      });
  }, [navigate]);

  // 2. 분석 데이터 로딩
  const [personaState, setPersonaState] = useState({
    status: "idle",
    data: null,
  });
  const [destinaState, setDestinaState] = useState({
    status: "idle",
    data: null,
  });
  const analysisDataRef = useRef(null);

  const fetchAnalysisData = async () => {
    if (analysisDataRef.current) return analysisDataRef.current;
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("로그인이 필요합니다.");
        window.location.href = "/login";
        return null;
      }
      const response = await fetch("/api/analyze/today", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("데이터 실패");
      const data = await response.json();
      analysisDataRef.current = data;
      return data;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  const handleSelect = async (type) => {
    if (type === "persona")
      setPersonaState((prev) => ({ ...prev, status: "loading" }));
    else setDestinaState((prev) => ({ ...prev, status: "loading" }));

    const data = await fetchAnalysisData();

    setTimeout(() => {
      if (!data) {
        if (type === "persona") setPersonaState({ status: "idle", data: null });
        else setDestinaState({ status: "idle", data: null });
        return;
      }
      if (type === "persona") {
        const pData = data.persona_data || {};
        setPersonaState({
          status: "success",
          data: {
            title: pData.mbti || data.my_persona,
            subtitle: MBTI_NICKNAMES[pData.mbti || data.my_persona] || "유형",
            color: "#a18cd1",
            description: pData.description,
            axes: pData.axes,
          },
        });
      } else {
        const dData = data.destiny_data || {};
        setDestinaState({
          status: "success",
          data: {
            title: dData.mbti || data.my_destiny,
            subtitle: MBTI_NICKNAMES[dData.mbti || data.my_destiny] || "유형",
            color: "#fad0c4",
            description: dData.description,
            axes: dData.axes,
          },
        });
      }
    }, 1500);
  };

  // 로그아웃 핸들러
  const handleLogout = async () => {
    if (!window.confirm("정말 로그아웃 하시겠습니까?")) return;

    const token = localStorage.getItem("token");
    try {
      await fetch("/api/logout", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (error) {
      console.error("로그아웃 API 호출 실패:", error);
    } finally {
      localStorage.clear();
      navigate("/");
    }
  };

  return (
    <SpaceBackground>
      <div className="selection-page-content">
        {/* 유저 프로필 (VIP 배지) */}
        <div className="user-profile-container">
          <motion.div
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="glass-badge"
          >
            <span className="user-nickname">{userInfo.nickname}</span>
            <div className="badge-divider" />
            <div className="vip-badge-content">
              <FaCrown
                size={14}
                style={{ marginBottom: "2px", color: "#FFD700" }}
              />
              <span className="vip-text">{userInfo.membership}</span>
            </div>
          </motion.div>
        </div>

        {/* 상단 네비게이션 버튼들 */}
        <div className="nav-buttons">
          {/* 캘린더 버튼 */}
          <button
            type="button"
            className="nav-btn calendar-btn"
            onClick={() => navigate("/calendar")}
            aria-label="캘린더 페이지로 이동"
          >
            <FaCalendarAlt size={24} />
          </button>

          {/* 설정 버튼 */}
          <button
            type="button"
            className="nav-btn settings-btn"
            onClick={() => navigate("/settings")}
            aria-label="설정 페이지로 이동"
          >
            <FaCog size={24} />
          </button>

          {/* 로그아웃 버튼 */}
          <button
            type="button"
            className="nav-btn logout-btn"
            onClick={handleLogout}
            aria-label="로그아웃"
          >
            <FaSignOutAlt size={24} />
          </button>
        </div>

        <h1 className="page-title">오늘의 운명 확인하기</h1>

        <div className="cards-wrapper">
          <CardSlot
            type="persona"
            state={personaState}
            onSelect={handleSelect}
            label="My Persona"
            icon="🔮"
            color="#a18cd1"
          />
          <CardSlot
            type="destina"
            state={destinaState}
            onSelect={handleSelect}
            label="My Destina"
            icon="🌟"
            color="#fad0c4"
          />
        </div>
      </div>
    </SpaceBackground>
  );
};

export default Selection;
