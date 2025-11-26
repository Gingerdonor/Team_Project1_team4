// src/components/FlipCard.jsx
import { motion } from "framer-motion";
import { useState, useRef } from "react";
import html2canvas from "html2canvas"; // 패키지 설치 필요
import "./FlipCard.css";

const FlipCard = ({ title, color, description }) => {
  const [rotation, setRotation] = useState(0);
  const cardBackRef = useRef(null); // 캡처할 뒷면 요소 참조

  // 카드 회전 함수
  const flipCard = () => {
    setRotation((prev) => prev + 180);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      flipCard();
    }
  };

  // 1. 이미지 저장 핸들러
  const handleSaveImage = async (e) => {
    e.stopPropagation(); // 카드 뒤집기 방지
    if (!cardBackRef.current) return;

    try {
      // 3D 회전된 요소를 캡처하면 이미지가 뒤집히거나 안 나올 수 있음
      // 따라서 요소를 복제(clone)하여 회전값을 제거한 뒤 캡처
      const element = cardBackRef.current;
      const clone = element.cloneNode(true);

      // 복제본 스타일 재설정 (화면에 안 보이게 하되 캡처는 가능하게)
      Object.assign(clone.style, {
        position: "fixed",
        top: "-10000px",
        left: "-10000px",
        transform: "none", // 회전 제거
        zIndex: -1,
        width: `${element.offsetWidth}px`,
        height: `${element.offsetHeight}px`,
        borderRadius: "20px", // CSS와 맞춤
      });

      // 버튼 영역 제거 (이미지에 버튼은 안 나오게)
      const actions = clone.querySelector(".card-actions");
      if (actions) actions.remove();

      document.body.appendChild(clone);

      const canvas = await html2canvas(clone, {
        backgroundColor: null, // 투명 배경 유지 (필요시 색상 지정)
        scale: 2, // 고해상도
      });

      document.body.removeChild(clone);

      // 다운로드 트리거
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `${title}_analysis.png`;
      link.click();
    } catch (err) {
      console.error("이미지 저장 실패:", err);
      alert("이미지 저장 중 오류가 발생했습니다.");
    }
  };

  // 2. 공유하기 핸들러
  const handleShare = async (e) => {
    e.stopPropagation();
    const shareData = {
      title: `${title} 분석 결과`,
      text: description,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log("공유 취소 또는 에러");
      }
    } else {
      // Web Share API 미지원 시 클립보드 복사
      try {
        await navigator.clipboard.writeText(
          `${title}: ${description}\n${window.location.href}`
        );
        alert("분석 결과가 클립보드에 복사되었습니다!");
      } catch (err) {
        alert("공유하기를 지원하지 않는 브라우저입니다.");
      }
    }
  };

  return (
    <div
      className="card-container"
      onClick={flipCard}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
    >
      <motion.div
        className="card-inner"
        initial={false}
        animate={{ rotateY: rotation }}
        transition={{ duration: 0.6, type: "spring", stiffness: 50 }}
      >
        {/* 앞면 */}
        <div className="card-face card-front" style={{ borderColor: color }}>
          <h2 style={{ color, textShadow: `0 0 10px ${color}` }}>{title}</h2>
          <p className="click-hint">Click to Reveal</p>
        </div>

        {/* 뒷면 */}
        <div
          className="card-face card-back"
          style={{ borderColor: color }}
          ref={cardBackRef}
        >
          <div className="card-content">
            <h3>분석 결과</h3>
            <p>{description}</p>
          </div>

          {/* 하단 버튼 영역 */}
          <div className="card-actions">
            <button onClick={handleSaveImage} className="action-btn save-btn">
              💾 저장
            </button>
            <button onClick={handleShare} className="action-btn share-btn">
              🔗 공유
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FlipCard;
