import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FaArrowLeft,
  FaChevronLeft,
  FaChevronRight,
  FaUsers,
  FaChartPie,
  FaCrown,
} from "react-icons/fa";
import SpaceBackground from "../components/SpaceBackground";
import "./StatsPage.css";

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

const MBTI_COLORS = {
  INTJ: "#6B5B95",
  INTP: "#88B04B",
  ENTJ: "#F7CAC9",
  ENTP: "#92A8D1",
  INFJ: "#955251",
  INFP: "#B565A7",
  ENFJ: "#009B77",
  ENFP: "#DD4124",
  ISTJ: "#45B8AC",
  ISFJ: "#EFC050",
  ESTJ: "#5B5EA6",
  ESFJ: "#9B2335",
  ISTP: "#BC243C",
  ISFP: "#C3447A",
  ESTP: "#98B4D4",
  ESFP: "#DFCFBE",
};

const AxisBar = ({
  leftLabel,
  rightLabel,
  leftPercent,
  rightPercent,
  leftColor,
  rightColor,
}) => (
  <div className="axis-bar-container">
    <div className="axis-labels">
      <span className="axis-label left" style={{ color: leftColor }}>
        {leftLabel} ({leftPercent}%)
      </span>
      <span className="axis-label right" style={{ color: rightColor }}>
        {rightLabel} ({rightPercent}%)
      </span>
    </div>
    <div className="axis-bar">
      <motion.div
        className="axis-fill left"
        style={{ backgroundColor: leftColor }}
        initial={{ width: 0 }}
        animate={{ width: `${leftPercent}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
      <motion.div
        className="axis-fill right"
        style={{ backgroundColor: rightColor }}
        initial={{ width: 0 }}
        animate={{ width: `${rightPercent}%` }}
        transition={{ duration: 1, ease: "easeOut" }}
      />
    </div>
  </div>
);

const MBTIRankingCard = ({ title, data, icon }) => {
  const sortedData = Object.entries(data)
    .sort((a, b) => b[1].count - a[1].count)
    .slice(0, 5);

  return (
    <div className="ranking-card">
      <h3 className="ranking-title">
        {icon} {title}
      </h3>
      <div className="ranking-list">
        {sortedData.map(([mbti, stats], index) => (
          <motion.div
            key={mbti}
            className="ranking-item"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <div
              className="rank-number"
              style={{ backgroundColor: MBTI_COLORS[mbti] || "#667eea" }}
            >
              {index + 1}
            </div>
            <div className="rank-info">
              <span className="rank-mbti">{mbti}</span>
              <span className="rank-nickname">{MBTI_NICKNAMES[mbti]}</span>
            </div>
            <div className="rank-stats">
              <span className="rank-count">{stats.count}회</span>
              <span className="rank-percent">{stats.percent}%</span>
            </div>
            <div className="rank-bar-container">
              <motion.div
                className="rank-bar"
                style={{ backgroundColor: MBTI_COLORS[mbti] || "#667eea" }}
                initial={{ width: 0 }}
                animate={{ width: `${stats.percent}%` }}
                transition={{ duration: 0.8, delay: index * 0.1 }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const StatsContent = ({ stats, axesConfig }) => {
  if (stats.total_analyses === 0) {
    return (
      <div className="no-data">
        <p>해당 기간의 분석 데이터가 없습니다.</p>
      </div>
    );
  }

  return (
    <>
      {/* 요약 카드 */}
      <div className="summary-cards">
        <motion.div
          className="summary-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <FaChartPie className="summary-icon" />
          <div className="summary-value">{stats.total_analyses}</div>
          <div className="summary-label">총 분석 횟수</div>
        </motion.div>
        <motion.div
          className="summary-card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <FaUsers className="summary-icon" />
          <div className="summary-value">{stats.unique_users}</div>
          <div className="summary-label">참여 유저 수</div>
        </motion.div>
        {stats.top_persona && (
          <motion.div
            className="summary-card highlight"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <FaCrown className="summary-icon gold" />
            <div className="summary-value">{stats.top_persona.mbti}</div>
            <div className="summary-label">가장 많은 Persona</div>
          </motion.div>
        )}
      </div>

      {/* MBTI 축별 통계 */}
      <div className="axes-section">
        <h3 className="section-title">🧬 MBTI 축별 분포</h3>
        <div className="axes-container">
          {axesConfig.map((axis) => (
            <AxisBar
              key={axis.key}
              leftLabel={`${axis.leftLabel} (${axis.left})`}
              rightLabel={`${axis.rightLabel} (${axis.right})`}
              leftPercent={
                stats.axes_stats?.[axis.key]?.[`${axis.left}_percent`] || 0
              }
              rightPercent={
                stats.axes_stats?.[axis.key]?.[`${axis.right}_percent`] || 0
              }
              leftColor={axis.leftColor}
              rightColor={axis.rightColor}
            />
          ))}
        </div>
      </div>

      {/* MBTI 랭킹 */}
      <div className="ranking-section">
        {Object.keys(stats.persona_stats || {}).length > 0 && (
          <MBTIRankingCard
            title="My Persona TOP 5"
            data={stats.persona_stats}
            icon="🔮"
          />
        )}
        {Object.keys(stats.destiny_stats || {}).length > 0 && (
          <MBTIRankingCard
            title="My Destina TOP 5"
            data={stats.destiny_stats}
            icon="🌟"
          />
        )}
      </div>

      {/* 행운의 원소 통계 */}
      {stats.element_stats && Object.keys(stats.element_stats).length > 0 && (
        <div className="element-section">
          <h3 className="section-title">🍀 행운의 원소 분포</h3>
          <div className="element-grid">
            {Object.entries(stats.element_stats).map(
              ([element, data], index) => (
                <motion.div
                  key={element}
                  className="element-card"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <span className="element-name">{element}</span>
                  <span className="element-percent">{data.percent}%</span>
                  <span className="element-count">{data.count}회</span>
                </motion.div>
              )
            )}
          </div>
        </div>
      )}
    </>
  );
};

const StatsPage = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("monthly");

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const fetchMonthlyStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `/api/stats/monthly?year=${year}&month=${month}`
      );
      if (!response.ok) throw new Error("통계 로드 실패");
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [year, month]);

  const fetchAllTimeStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/stats/all-time`);
      if (!response.ok) throw new Error("통계 로드 실패");
      const data = await response.json();
      setStats(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (viewMode === "monthly") {
      fetchMonthlyStats();
    } else {
      fetchAllTimeStats();
    }
  }, [year, month, viewMode, fetchMonthlyStats, fetchAllTimeStats]);

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 2, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month, 1));

  const axesConfig = [
    {
      key: "E_I",
      left: "E",
      right: "I",
      leftLabel: "외향",
      rightLabel: "내향",
      leftColor: "#FF6B6B",
      rightColor: "#4ECDC4",
    },
    {
      key: "S_N",
      left: "S",
      right: "N",
      leftLabel: "감각",
      rightLabel: "직관",
      leftColor: "#FFE66D",
      rightColor: "#95E1D3",
    },
    {
      key: "T_F",
      left: "T",
      right: "F",
      leftLabel: "사고",
      rightLabel: "감정",
      leftColor: "#A8E6CF",
      rightColor: "#FFB6C1",
    },
    {
      key: "J_P",
      left: "J",
      right: "P",
      leftLabel: "판단",
      rightLabel: "인식",
      leftColor: "#DDA0DD",
      rightColor: "#87CEEB",
    },
  ];

  // 렌더링 함수 분리 (중첩 삼항 연산자 해결)
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="loading-container">
          <div className="loading-spinner">통계 로딩 중...</div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="no-data">
          <p>통계를 불러올 수 없습니다: {error}</p>
        </div>
      );
    }

    if (!stats) {
      return (
        <div className="no-data">
          <p>통계 데이터가 없습니다.</p>
        </div>
      );
    }

    return <StatsContent stats={stats} axesConfig={axesConfig} />;
  };

  return (
    <SpaceBackground>
      <div className="stats-page-container">
        {/* 헤더 */}
        <div className="stats-header">
          <button
            type="button"
            className="back-btn"
            onClick={() => navigate("/select")}
          >
            <FaArrowLeft size={20} />
          </button>
          <h2 className="stats-page-title">📊 전체 유저 통계</h2>
        </div>

        {/* 보기 모드 선택 */}
        <div className="view-mode-selector">
          <button
            type="button"
            className={`mode-btn ${viewMode === "monthly" ? "active" : ""}`}
            onClick={() => setViewMode("monthly")}
          >
            월간 통계
          </button>
          <button
            type="button"
            className={`mode-btn ${viewMode === "allTime" ? "active" : ""}`}
            onClick={() => setViewMode("allTime")}
          >
            전체 기간
          </button>
        </div>

        {/* 월 네비게이션 (월간 모드일 때만) */}
        {viewMode === "monthly" && (
          <div className="month-navigation">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="month-nav-btn"
            >
              <FaChevronLeft />
            </button>
            <h3 className="current-month">
              {year}년 {month}월
            </h3>
            <button
              type="button"
              onClick={handleNextMonth}
              className="month-nav-btn"
            >
              <FaChevronRight />
            </button>
          </div>
        )}

        <div className="stats-content">{renderContent()}</div>
      </div>
    </SpaceBackground>
  );
};

export default StatsPage;
