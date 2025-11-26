import { motion } from "framer-motion";
import { useState } from "react";
import "./FlipCard.css";

const FlipCard = ({ title, color, description }) => {
  // 기존의 boolean 상태 대신 회전 각도를 저장하는 숫자 상태로 변경
  const [rotation, setRotation] = useState(0);

  // 카드를 뒤집는 함수: 현재 각도에 180도를 더함 (계속 같은 방향 회전)
  const flipCard = () => {
    setRotation((prev) => prev + 180);
  };

  // 키보드 엔터/스페이스바로 뒤집기 지원
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      flipCard();
    }
  };

  return (
    <div
      className="card-container"
      onClick={flipCard} // 핸들러 변경
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <motion.div
        className="card-inner"
        initial={false}
        // boolean 대신 누적된 각도를 적용
        animate={{ rotateY: rotation }}
        transition={{ duration: 0.6, type: "spring", stiffness: 50 }}
      >
        {/* 앞면 */}
        <div className="card-face card-front" style={{ borderColor: color }}>
          <h2 style={{ color, textShadow: `0 0 10px ${color}` }}>{title}</h2>
          <p className="click-hint">Click to Reveal</p>
        </div>

        {/* 뒷면 */}
        <div className="card-face card-back" style={{ borderColor: color }}>
          <h3>분석 결과</h3>
          <p>{description}</p>
        </div>
      </motion.div>
    </div>
  );
};

export default FlipCard;
