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
  FaStar,
  FaTimes,
} from "react-icons/fa";
import FlipCard from "../components/FlipCard";
import SpaceBackground from "../components/SpaceBackground";
import LoadingEffect, { LOADING_EFFECTS } from "../components/LoadingEffects";
import EffectSelector from "../components/EffectSelector";
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

// 카테고리 정의
const CATEGORIES = [
  { id: "marvel", label: "마블", tags: ["마블"] },
  { id: "disney", label: "디즈니", tags: ["디즈니"] },
  { id: "celebrity", label: "유명인", tags: ["실제인물"] },
  { id: "custom", label: "커스텀", tags: [] },
];

const Selection = () => {
  const navigate = useNavigate();

  // 유저 정보
  const [userInfo, setUserInfo] = useState({
    nickname: "Loading...",
    membership: "Standard",
  });

  // 현재 보기 상태
  const [currentView, setCurrentView] = useState("selection");
  const [isLoading, setIsLoading] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const analysisDataRef = useRef(null);

  // 카테고리 선택 상태 (기본값: marvel)
  const [selectedCategory, setSelectedCategory] = useState("marvel");

  // 커스텀 태그 모달 상태
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customTags, setCustomTags] = useState([]);

  // 전체 태그 목록 (API에서 로드)
  const [availableTags, setAvailableTags] = useState([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);

  // 태그 목록 로드
  useEffect(() => {
    const fetchTags = async () => {
      try {
        setIsLoadingTags(true);
        const response = await fetch("/api/celebrities/tags/all");
        if (response.ok) {
          const data = await response.json();
          setAvailableTags(data.tags || []);
        }
      } catch (error) {
        console.error("태그 목록 로드 실패:", error);
      } finally {
        setIsLoadingTags(false);
      }
    };

    fetchTags();
  }, []);

  // 카테고리 선택 핸들러
  const handleCategorySelect = (categoryId) => {
    if (categoryId === "custom") {
      setShowCustomModal(true);
    } else {
      setSelectedCategory(categoryId);
      // 카테고리 변경 시 캐시 초기화
      analysisDataRef.current = null;
      setAnalysisData(null);
    }
  };

  // 커스텀 태그 토글
  const toggleCustomTag = (tag) => {
    setCustomTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  // 커스텀 태그 적용
  const applyCustomTags = () => {
    if (customTags.length > 0) {
      setSelectedCategory("custom");
      // 태그 변경 시 캐시 초기화
      analysisDataRef.current = null;
      setAnalysisData(null);
    }
    setShowCustomModal(false);
  };

  // 현재 선택된 태그 가져오기
  const getCurrentTags = () => {
    if (selectedCategory === "custom") {
      return customTags;
    }
    const category = CATEGORIES.find((c) => c.id === selectedCategory);
    return category ? category.tags : [];
  };

  // 로딩 효과 설정
  const [loadingEffect, setLoadingEffect] = useState(
    () => localStorage.getItem("loadingEffect") || "card_spin"
  );
  const [showEffectSelector, setShowEffectSelector] = useState(false);

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

  // 로딩 효과 저장
  const handleEffectSelect = (effectId) => {
    setLoadingEffect(effectId);
    localStorage.setItem("loadingEffect", effectId);
  };

  // 분석 데이터 가져오기
  const fetchAnalysisData = async () => {
    // ⚠️ 캐시된 데이터가 있어도, 태그가 변경되면 새로 요청해야 함
    // 기존: if (analysisDataRef.current) return analysisDataRef.current;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        alert("로그인이 필요합니다.");
        navigate("/");
        return null;
      }

      // 현재 선택된 태그 가져오기
      const tags = getCurrentTags();
      const queryParams =
        tags.length > 0 ? `?include_tags=${tags.join(",")}` : "";

      const response = await fetch(`/api/analyze/today${queryParams}`, {
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

    // 로딩 효과 최소 2초
    setTimeout(() => {
      setIsLoading(false);
      if (!data) {
        setCurrentView("selection");
      }
    }, 2000);
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

  // 카드 데이터 가져오기
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
        celebrity: null, // My Persona에는 celeb 정보 미표시
      };
    }
    const dData = analysisData.destiny_data || {};
    return {
      title: dData.mbti || analysisData.my_destiny,
      subtitle: MBTI_NICKNAMES[dData.mbti || analysisData.my_destiny] || "유형",
      color: "#fad0c4",
      description: dData.description,
      axes: dData.axes,
      celebrity: dData.celebrity || null,
    };
  };

  const currentColor = currentView === "persona" ? "#a18cd1" : "#fad0c4";

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
          {/* 로딩 효과 선택 버튼 */}
          <button
            type="button"
            className="nav-btn effect-btn"
            onClick={() => setShowEffectSelector(true)}
            title="로딩 효과 변경"
          >
            <span className="nav-emoji">✨</span>
          </button>
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

        {(currentView === "persona" || currentView === "destiny") && (
          <motion.button
            type="button"
            className="back-button"
            onClick={handleBack}
            initial={{ opacity: 0, x: -20 }} // 왼쪽에서 부드럽게 등장
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <FaArrowLeft size={20} />
            <span>돌아가기</span>
          </motion.button>
        )}

        <AnimatePresence mode="wait">
          {/* 메인 선택 화면 */}
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

              {/* 카테고리 탭 버튼 추가 */}
              <div className="category-tabs">
                {CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    className={`category-tab ${
                      selectedCategory === category.id ? "active" : ""
                    }`}
                    onClick={() => handleCategorySelect(category.id)}
                  >
                    {category.label}
                    {category.id === "custom" && customTags.length > 0 && (
                      <span className="custom-tag-count">
                        {customTags.length}
                      </span>
                    )}
                  </button>
                ))}
              </div>

              {/* 선택된 커스텀 태그 표시 */}
              {selectedCategory === "custom" && customTags.length > 0 && (
                <div className="selected-tags-display">
                  {customTags.map((tag, index) => (
                    <span key={index} className="selected-tag">
                      {tag}
                      <button
                        type="button"
                        className="tag-remove-btn"
                        onClick={() => toggleCustomTag(tag)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

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

              {/* 현재 효과 표시 */}
              <motion.p
                className="current-effect-hint"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
              >
                현재 로딩 효과:{" "}
                {LOADING_EFFECTS.find((e) => e.id === loadingEffect)?.icon}{" "}
                {LOADING_EFFECTS.find((e) => e.id === loadingEffect)?.name}
              </motion.p>
            </motion.div>
          )}

          {/* 결과 화면 */}
          {(currentView === "persona" || currentView === "destiny") && (
            <motion.div
              key={currentView}
              className="result-view"
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -100 }}
              transition={{ duration: 0.4 }}
            >
              <h1 className="result-title">
                {currentView === "persona" ? "🔮 My Persona" : "🌟 My Destiny"}
              </h1>
              <div
                className="result-card-container"
                style={{
                  position: "relative",
                  perspective: "1200px", // 원근감 일치시키기
                  zIndex: 10,
                  width: "100%",
                  height: "100%",
                  minHeight: "600px", // 카드 공간 확보
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <AnimatePresence mode="wait">
                  {/* 1. 로딩 중: 카드가 계속 회전 */}
                  {isLoading && (
                    <motion.div
                      key="loading-card"
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, transition: { duration: 0.2 } }} // 빠르게 사라지고 결과 카드로 교체
                      style={{ position: "absolute", zIndex: 20 }}
                    >
                      <LoadingEffect
                        effectId={loadingEffect}
                        color={currentColor}
                        text="운명의 카드를 찾는 중..."
                      />
                    </motion.div>
                  )}

                  {/* 2. 로딩 완료: 카드가 뒷면(180도)에서 시작해 앞면(0도)으로 뒤집힘 */}
                  {!isLoading && analysisData && (
                    <motion.div
                      key="result-card"
                      /* rotateY: 180 (뒷면)에서 시작 -> 0 (앞면)으로 회전
                         마치 회전하던 카드가 멈춰서 뒤집히는 듯한 연출 
                      */
                      initial={{ opacity: 0, rotateY: 180, scale: 0.9 }}
                      animate={{ opacity: 1, rotateY: 0, scale: 1 }}
                      transition={{
                        duration: 0.8,
                        ease: "easeOut",
                        type: "spring",
                        stiffness: 60,
                        damping: 12,
                      }}
                      style={{
                        transformStyle: "preserve-3d",
                        backfaceVisibility: "visible",
                      }}
                    >
                      {getCardData(currentView) && (
                        <FlipCard
                          title={getCardData(currentView).title}
                          subtitle={getCardData(currentView).subtitle}
                          color={getCardData(currentView).color}
                          description={getCardData(currentView).description}
                          axes={getCardData(currentView).axes}
                          celebrity={getCardData(currentView).celebrity}
                        />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 효과 선택 모달 */}
      <EffectSelector
        isOpen={showEffectSelector}
        currentEffect={loadingEffect}
        onSelect={handleEffectSelect}
        onClose={() => setShowEffectSelector(false)}
      />

      {/* 커스텀 태그 선택 모달 */}
      <AnimatePresence>
        {showCustomModal && (
          <motion.div
            className="custom-modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCustomModal(false)}
          >
            <motion.div
              className="custom-modal"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="custom-modal-header">
                <h2>🎨 커스텀 태그 선택</h2>
                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setShowCustomModal(false)}
                >
                  <FaTimes />
                </button>
              </div>

              <div className="custom-modal-content">
                {isLoadingTags ? (
                  <div className="tags-loading">태그 로딩 중...</div>
                ) : (
                  <div className="tag-options">
                    {availableTags.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className={`tag-option ${
                          customTags.includes(tag) ? "selected" : ""
                        }`}
                        onClick={() => toggleCustomTag(tag)}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="custom-modal-footer">
                <button
                  type="button"
                  className="clear-tags-btn"
                  onClick={() => setCustomTags([])}
                >
                  초기화
                </button>
                <button
                  type="button"
                  className="apply-tags-btn"
                  onClick={applyCustomTags}
                >
                  적용하기 ({customTags.length}개 선택)
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </SpaceBackground>
  );
};

export default Selection;
