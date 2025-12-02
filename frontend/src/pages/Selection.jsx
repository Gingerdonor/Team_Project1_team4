import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  FaCog,
  FaCrown,
  FaCalendarAlt,
  FaSignOutAlt,
  FaChartBar,
  FaArrowLeft,
} from "react-icons/fa";
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

const Selection = () => {
  const navigate = useNavigate();

  // 유저 정보
  const [userInfo, setUserInfo] = useState({
    nickname: "Loading...",
    membership: "Standard",
  });

  // 현재 보기 상태: "selection" | "persona" | "destiny"
  const [currentView, setCurrentView] = useState("selection");

  // 로딩 상태
  const [isLoading, setIsLoading] = useState(false);

  // 분석 결과 데이터
  const [analysisData, setAnalysisData] = useState(null);
  const analysisDataRef = useRef(null);

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
          membership: "VIP Member",
        });
      })
      .catch(() => {
        localStorage.clear();
        navigate("/");
      });
  }, [navigate]);

  // 분석 데이터 가져오기
  const fetchAnalysisData = async () => {
    if (analysisDataRef.current) return analysisDataRef.current;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("로그인이 필요합니다.");
        navigate("/");
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
      setAnalysisData(data);
      return data;
    } catch (error) {
      console.error(error);
      return null;
    }
  };

  // 버튼 클릭 핸들러
  const handleSelect = async (type) => {
    setCurrentView(type);
    setIsLoading(true);

    const data = await fetchAnalysisData();

    // 로딩 효과 (최소 1.5초)
    setTimeout(() => {
      setIsLoading(false);
      if (!data) {
        setCurrentView("selection");
      }
    }, 1500);
  };

  // 뒤로가기
  const handleBack = () => {
    setCurrentView("selection");
  };

  // 로그아웃
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

  // 현재 표시할 카드 데이터 가져오기
  const getCardData = (type) => {
    if (!analysisData) return null;

    if (type === "persona") {
      const pData = analysisData.persona_data || {};
      return {
        title: pData.mbti || analysisData.my_persona,
        subtitle:
          MBTI_NICKNAMES[pData.mbti || analysisData.my_persona] || "유형",
        color: "#a18cd1",
        description: pData.description,
        axes: pData.axes,
        celebrity: pData.celebrity || null,
      };
    } else {
      const dData = analysisData.destiny_data || {};
      return {
        title: dData.mbti || analysisData.my_destiny,
        subtitle:
          MBTI_NICKNAMES[dData.mbti || analysisData.my_destiny] || "유형",
        color: "#fad0c4",
        description: dData.description,
        axes: dData.axes,
        celebrity: dData.celebrity || null,
      };
    }
  };

  return (
    <SpaceBackground>
      <div className="selection-page-content">
        {/* 유저 프로필 */}
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

        {/* 상단 네비게이션 */}
        <div className="nav-buttons">
          <button
            type="button"
            className="nav-btn stats-btn"
            onClick={() => navigate("/stats")}
          >
            <FaChartBar size={24} />
          </button>
          <button
            type="button"
            className="nav-btn calendar-btn"
            onClick={() => navigate("/calendar")}
          >
            <FaCalendarAlt size={24} />
          </button>
          <button
            type="button"
            className="nav-btn settings-btn"
            onClick={() => navigate("/settings")}
          >
            <FaCog size={24} />
          </button>
          <button
            type="button"
            className="nav-btn logout-btn"
            onClick={handleLogout}
          >
            <FaSignOutAlt size={24} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {/* ===== 메인 선택 화면 ===== */}
          {currentView === "selection" && (
            <motion.div
              key="selection"
              className="selection-main"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
            >
              <h1 className="page-title">오늘의 운명 확인하기</h1>

              <div className="orb-buttons-wrapper">
                {/* Persona 버튼 */}
                <motion.button
                  type="button"
                  className="orb-button persona-orb"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelect("persona")}
                >
                  <div className="orb-glow persona-glow" />
                  <div className="orb-content">
                    <span className="orb-icon">🔮</span>
                    <span className="orb-label">My Persona</span>
                  </div>
                </motion.button>

                {/* Destiny 버튼 */}
                <motion.button
                  type="button"
                  className="orb-button destiny-orb"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleSelect("destiny")}
                >
                  <div className="orb-glow destiny-glow" />
                  <div className="orb-content">
                    <span className="orb-icon">🌟</span>
                    <span className="orb-label">My Destiny</span>
                  </div>
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* ===== 결과 화면 (Persona / Destiny) ===== */}
          {(currentView === "persona" || currentView === "destiny") && (
            <motion.div
              key={currentView}
              className="result-view"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.4 }}
            >
              {/* 뒤로가기 버튼 */}
              <motion.button
                type="button"
                className="back-button"
                onClick={handleBack}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
              >
                <FaArrowLeft size={20} />
                <span>돌아가기</span>
              </motion.button>

              <h1 className="result-title">
                {currentView === "persona" ? "🔮 My Persona" : "🌟 My Destiny"}
              </h1>

              <div className="result-card-container">
                {/* 로딩 상태 */}
                {isLoading && (
                  <motion.div
                    className="loading-container"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                  >
                    <motion.div
                      className="loading-orb"
                      style={{
                        background:
                          currentView === "persona"
                            ? "linear-gradient(135deg, #a18cd1, #fbc2eb)"
                            : "linear-gradient(135deg, #fad0c4, #ffd1ff)",
                      }}
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                    <p className="loading-text">운명을 읽는 중...</p>
                  </motion.div>
                )}

                {/* FlipCard 결과 */}
                {!isLoading && analysisData && (
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <FlipCard {...getCardData(currentView)} />
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SpaceBackground>
  );
};

export default Selection;
