import { useState, useRef } from "react";
import { motion } from "framer-motion";
import FlipCard from "../components/FlipCard";
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
  // 상태 관리
  const [personaState, setPersonaState] = useState({
    status: "idle",
    data: null,
  });
  const [destinaState, setDestinaState] = useState({
    status: "idle",
    data: null,
  });

  // API 데이터를 저장할 Ref (불필요한 중복 호출 방지)
  const analysisDataRef = useRef(null);

  // 데이터 가져오기 (API 호출)
  const fetchAnalysisData = async () => {
    // 이미 데이터가 있다면 재사용
    if (analysisDataRef.current) return analysisDataRef.current;

    try {
      const token = localStorage.getItem("token"); // 로그인 토큰 확인
      if (!token) {
        alert("로그인이 필요합니다.");
        window.location.href = "/login"; // 로그인 페이지로 리다이렉트 (필요 시 수정)
        return null;
      }

      const response = await fetch("http://127.0.0.1:8000/api/analyze/today", {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("데이터를 불러오는데 실패했습니다.");
      }

      const data = await response.json();
      analysisDataRef.current = data; // 데이터 캐싱
      return data;
    } catch (error) {
      console.error(error);
      alert("분석 정보를 가져오는 중 오류가 발생했습니다.");
      return null;
    }
  };

  // 공통 선택 핸들러
  const handleSelect = async (type) => {
    // 1. 해당 슬롯 로딩 상태로 변경
    if (type === "persona")
      setPersonaState((prev) => ({ ...prev, status: "loading" }));
    else setDestinaState((prev) => ({ ...prev, status: "loading" }));

    // 2. API 호출 (또는 캐시된 데이터 가져오기)
    const data = await fetchAnalysisData();

    // 3. 최소 로딩 시간(1.5초) 보장 후 결과 표시 (UX 효과)
    setTimeout(() => {
      if (!data) {
        // 에러 발생 시 idle로 복귀
        if (type === "persona") setPersonaState({ status: "idle", data: null });
        else setDestinaState({ status: "idle", data: null });
        return;
      }

      if (type === "persona") {
        const mbti = data.my_persona;
        setPersonaState({
          status: "success",
          data: {
            title: `${mbti} (${MBTI_NICKNAMES[mbti] || "유형"})`, // 예: ISFP (성인군자형)
            color: "#a18cd1",
            description: data.persona_desc,
          },
        });
      } else {
        const mbti = data.my_destiny;
        setDestinaState({
          status: "success",
          data: {
            title: `${mbti} (${MBTI_NICKNAMES[mbti] || "유형"})`,
            color: "#fad0c4",
            description: data.destiny_desc,
          },
        });
      }
    }, 1500);
  };

  // 카드 슬롯 컴포넌트
  const CardSlot = ({ type, state, onSelect, label, icon, color }) => {
    return (
      <div className="card-slot">
        {/* 1. 대기 상태 */}
        {state.status === "idle" && (
          <motion.button
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
            <FlipCard {...state.data} />
            <button
              className="retry-btn"
              onClick={() =>
                type === "persona"
                  ? setPersonaState({ status: "idle", data: null })
                  : setDestinaState({ status: "idle", data: null })
              }
            >
              다시 하기
            </button>
          </motion.div>
        )}
      </div>
    );
  };

  return (
    <div className="selection-page">
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
  );
};

export default Selection;
