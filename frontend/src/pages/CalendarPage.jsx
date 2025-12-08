import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaArrowLeft, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import SpaceBackground from "../components/SpaceBackground";
import "./CalendarPage.css";

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

const CalendarPage = () => {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedResult, setSelectedResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const fetchCalendarData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`/api/calendar/month/${year}/${month}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("데이터 로드 실패");
      const data = await response.json();
      setCalendarData(data.data || {});
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("캘린더 데이터 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  }, [year, month, token]);

  useEffect(() => {
    if (!token) {
      navigate("/");
      return;
    }
    fetchCalendarData();
  }, [year, month, token, navigate, fetchCalendarData]);

  const fetchDateResult = async (dateStr) => {
    try {
      const response = await fetch(`/api/calendar/detail?date_str=${dateStr}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) return null;
      return await response.json();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("분석 결과 로드 실패:", error);
      return null;
    }
  };

  const getDaysInMonth = (y, m) => new Date(y, m, 0).getDate();
  const getFirstDayOfMonth = (y, m) => new Date(y, m - 1, 1).getDay();

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 2, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month, 1));

  const handleDateClick = async (day) => {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
    setSelectedDate(dateStr);

    if (calendarData[dateStr]?.has_analysis) {
      const result = await fetchDateResult(dateStr);
      if (result) {
        setSelectedResult(result);
        setShowModal(true);
      }
    }
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];
    const today = new Date().toISOString().split("T")[0];

    // 빈 칸
    for (let i = 0; i < firstDay; i += 1) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty" />);
    }

    // 날짜
    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;
      const dayData = calendarData[dateStr];
      const isToday = dateStr === today;
      const isSelected = dateStr === selectedDate;
      const hasAnalysis = dayData?.has_analysis;

      days.push(
        <motion.div
          key={day}
          className={`calendar-day 
            ${isToday ? "today" : ""} 
            ${isSelected ? "selected" : ""} 
            ${hasAnalysis ? "has-analysis" : ""}`}
          onClick={() => handleDateClick(day)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <span className="day-number">{day}</span>
          {hasAnalysis && (
            <div className="analysis-indicator">
              <span className="mbti-badge">{dayData.my_persona}</span>
            </div>
          )}
        </motion.div>
      );
    }

    return days;
  };

  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <SpaceBackground>
      <div className="calendar-page-container">
        {/* 헤더 */}
        <div className="calendar-header">
          <button
            type="button"
            className="back-btn"
            onClick={() => navigate("/select")}
          >
            <FaArrowLeft size={20} />
          </button>
          <h2 className="calendar-page-title">📅 분석 기록</h2>
        </div>

        {/* 월 네비게이션 */}
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

        {/* 요일 헤더 */}
        <div className="calendar-weekdays">
          {weekDays.map((day, idx) => (
            <div
              key={day}
              className={`weekday ${idx === 0 ? "sunday" : ""} ${
                idx === 6 ? "saturday" : ""
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* 캘린더 그리드 */}
        <div className="calendar-grid">
          {isLoading ? (
            <div className="loading-spinner">로딩 중...</div>
          ) : (
            renderCalendarDays()
          )}
        </div>

        {/* 분석 결과 모달 */}
        <AnimatePresence>
          {showModal && selectedResult && (
            <motion.div
              className="modal-overlay"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
            >
              <motion.div
                className="modal-content"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="modal-title">
                  📆 {selectedResult.analysis_date} 분석 결과
                </h3>

                <div className="modal-section">
                  <div className="result-card persona">
                    <span className="result-label">나의 페르소나</span>
                    <span className="result-mbti">
                      {selectedResult.my_persona}
                    </span>
                    <span className="result-nickname">
                      {MBTI_NICKNAMES[selectedResult.my_persona] || ""}
                    </span>
                  </div>

                  <div className="result-card destiny">
                    <span className="result-label">운명의 파트너</span>
                    <span className="result-mbti">
                      {selectedResult.my_destiny}
                    </span>
                    <span className="result-nickname">
                      {MBTI_NICKNAMES[selectedResult.my_destiny] || ""}
                    </span>
                  </div>
                </div>

                <div className="lucky-element">
                  <span>🍀 행운의 원소:</span>
                  <span className="element-value">
                    {selectedResult.lucky_element}
                  </span>
                </div>

                {selectedResult.persona_description && (
                  <div className="description-section">
                    <p>{selectedResult.persona_description}</p>
                  </div>
                )}

                <button
                  type="button"
                  className="modal-close-btn"
                  onClick={() => setShowModal(false)}
                >
                  닫기
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SpaceBackground>
  );
};

export default CalendarPage;
