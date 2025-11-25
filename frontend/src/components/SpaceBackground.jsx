// src/components/SpaceBackground.jsx
import { motion } from "framer-motion";
import "./SpaceBackground.css"; // 아래에서 만들 CSS 파일

const SpaceBackground = ({ children }) => {
  // 별을 랜덤하게 생성 (50개 정도)
  const stars = Array.from({ length: 50 }).map((_, i) => ({
    id: i,
    top: `${Math.random() * 100}%`,
    left: `${Math.random() * 100}%`,
    size: Math.random() * 2 + 1, // 1px ~ 3px 크기
    duration: Math.random() * 10 + 10, // 10초 ~ 20초 속도
    delay: Math.random() * 5,
  }));

  return (
    <div className="space-container">
      {/* 별 레이어 */}
      {stars.map((star) => (
        <motion.div
          key={star.id}
          className="star"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
          }}
          animate={{
            y: [0, -1000], // 위로 올라가는 애니메이션
            opacity: [0.5, 1, 0.5],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            ease: "linear",
            delay: star.delay,
          }}
        />
      ))}
      
      {/* 실제 컨텐츠가 들어갈 곳 */}
      <div className="content-layer">{children}</div>
    </div>
  );
};

export default SpaceBackground;