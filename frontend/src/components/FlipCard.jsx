// src/components/FlipCard.jsx
import { motion } from "framer-motion";
import { useState } from "react";
import "./FlipCard.css";

const FlipCard = ({ title, color, description }) => {
  const [isFlipped, setIsFlipped] = useState(false);

  // 키보드 엔터/스페이스바로 뒤집기 지원
  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      setIsFlipped(!isFlipped);
    }
  };

  return (
    <div
      className="card-container"
      onClick={() => setIsFlipped(!isFlipped)}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <motion.div
        className="card-inner"
        initial={false}
        animate={{ rotateY: isFlipped ? 180 : 0 }}
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
