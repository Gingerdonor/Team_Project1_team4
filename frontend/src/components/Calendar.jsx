import React, { useState, useEffect, useCallback } from "react";
import { calendarAPI } from "../api/api";
import "./Calendar.css";

const Calendar = ({ onDateSelect }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth() + 1;

  const fetchCalendarData = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await calendarAPI.getMonth(year, month);
      setCalendarData(response.data.data || {});
    } catch (error) {
      console.error("캘린더 데이터 로드 실패:", error);
    } finally {
      setIsLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    fetchCalendarData();
  }, [year, month, fetchCalendarData]);

  const getDaysInMonth = (y, m) => new Date(y, m, 0).getDate();

  const getFirstDayOfMonth = (y, m) => new Date(y, m - 1, 1).getDay();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month, 1));
  };

  const handleDateClick = async (day) => {
    const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(
      day
    ).padStart(2, "0")}`;
    setSelectedDate(dateStr);

    if (calendarData[dateStr]?.has_analysis && onDateSelect) {
      try {
        const response = await calendarAPI.getDate(dateStr);
        onDateSelect(response.data);
      } catch (error) {
        console.error("분석 결과 로드 실패:", error);
      }
    }
  };

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days = [];

    // 빈 칸 채우기
    for (let i = 0; i < firstDay; i += 1) {
      days.push(<div key={`empty-${i}`} className="calendar-day empty" />);
    }

    // 날짜 렌더링
    for (let day = 1; day <= daysInMonth; day += 1) {
      const dateStr = `${year}-${String(month).padStart(2, "0")}-${String(
        day
      ).padStart(2, "0")}`;
      const dayData = calendarData[dateStr];
      const isToday = dateStr === new Date().toISOString().split("T")[0];
      const isSelected = dateStr === selectedDate;
      const hasAnalysis = dayData?.has_analysis;

      days.push(
        <button
          type="button"
          key={day}
          className={`calendar-day ${isToday ? "today" : ""} ${
            isSelected ? "selected" : ""
          } ${hasAnalysis ? "has-analysis" : ""}`}
          onClick={() => handleDateClick(day)}
        >
          <span className="day-number">{day}</span>
          {hasAnalysis && (
            <div className="analysis-indicator">
              <span className="mbti-badge">{dayData.my_persona}</span>
              <span className="element-badge">{dayData.lucky_element}</span>
            </div>
          )}
        </button>
      );
    }

    return days;
  };

  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <button type="button" onClick={handlePrevMonth} className="nav-button">
          ◀
        </button>
        <h2 className="calendar-title">
          {year}년 {month}월
        </h2>
        <button type="button" onClick={handleNextMonth} className="nav-button">
          ▶
        </button>
      </div>

      <div className="calendar-weekdays">
        {weekDays.map((day) => (
          <div key={day} className="weekday">
            {day}
          </div>
        ))}
      </div>

      <div className="calendar-grid">
        {isLoading ? (
          <div className="loading">로딩 중...</div>
        ) : (
          renderCalendarDays()
        )}
      </div>
    </div>
  );
};

export default Calendar;
