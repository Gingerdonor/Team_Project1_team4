import { useState, useRef } from "react";
import { motion } from "framer-motion";
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
        // eslint-disable-next-line no-alert
        alert("로그인이 필요합니다.");
        window.location.href = "/login";
        return null;
      }

      const response = await fetch("http://127.0.0.1:8000/api/analyze/today", {
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
      // eslint-disable-next-line no-console
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
        const mbti = pData.mbti || data.my_persona;

        setPersonaState({
          status: "success",
          data: {
            title: mbti,
            subtitle: MBTI_NICKNAMES[mbti] || "유형",
            color: "#a18cd1",
            description: pData.description || data.persona_desc,
            axes: pData.axes, // 수치 데이터 전달
          },
        });
      } else {
        const dData = data.destiny_data || {};
        const mbti = dData.mbti || data.my_destiny;

        setDestinaState({
          status: "success",
          data: {
            title: mbti,
            subtitle: MBTI_NICKNAMES[mbti] || "유형",
            color: "#fad0c4",
            description: dData.description || data.destiny_desc,
            axes: dData.axes, // 수치 데이터 전달
          },
        });
      }
    }, 1500);
  };

  return (
    <SpaceBackground>
      <div className="selection-page-content">
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
