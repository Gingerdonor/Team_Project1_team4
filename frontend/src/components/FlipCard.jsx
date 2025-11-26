import { motion } from "framer-motion";
import { useState, useRef, useMemo } from "react";
import html2canvas from "html2canvas";
import "./FlipCard.css";

// 텍스트에서 수치 추출하는 헬퍼 함수
const extractScores = (text) => {
  const scores = {};
  // 예: [E 6.42 / I 6.16] 형태 찾기
  const regex = /\[([A-Z])\s*([\d.]+)\s*\/\s*([A-Z])\s*([\d.]+)\]/g;
  let match = regex.exec(text);
  while (match !== null) {
    scores[match[1]] = parseFloat(match[2]);
    scores[match[3]] = parseFloat(match[4]);
    match = regex.exec(text);
  }
  return scores;
};

const MbtiGauge = ({ typeStr, description }) => {
  // description이 변경될 때만 점수 다시 계산
  const scores = useMemo(() => extractScores(description), [description]);

  // 데이터가 없을 경우 기본값(단순 글자 포함 여부) 사용을 위한 헬퍼
  const getRatio = (left, right) => {
    const lVal = scores[left];
    const rVal = scores[right];

    // 1. 수치 데이터가 있는 경우
    if (lVal !== undefined && rVal !== undefined) {
      const total = lVal + rVal;
      const percent = total === 0 ? 50 : (lVal / total) * 100;
      return {
        percent,
        lText: `${lVal}`,
        rText: `${rVal}`,
      };
    }

    // 2. 수치 데이터가 없는 경우 (typeStr 기준 75% vs 25%)
    const isLeft = typeStr.includes(left);
    return {
      percent: isLeft ? 75 : 25,
      lText: "",
      rText: "",
    };
  };

  const rows = [
    { left: "E", right: "I" },
    { left: "N", right: "S" },
    { left: "F", right: "T" },
    { left: "P", right: "J" },
  ];

  return (
    <div className="mbti-gauges">
      {rows.map((row) => {
        const { percent, lText, rText } = getRatio(row.left, row.right);

        return (
          <div key={row.left} className="gauge-row">
            {/* 왼쪽 라벨 */}
            <div
              className={`gauge-label-container left ${
                percent > 50 ? "active" : ""
              }`}
            >
              <span className="label-char">{row.left}</span>
              {lText && <span className="label-val">{lText}</span>}
            </div>

            {/* 게이지 바 */}
            <div className="gauge-track">
              <motion.div
                className="gauge-fill"
                initial={{ width: "50%" }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>

            {/* 오른쪽 라벨 */}
            <div
              className={`gauge-label-container right ${
                percent < 50 ? "active" : ""
              }`}
            >
              {rText && <span className="label-val">{rText}</span>}
              <span className="label-char">{row.right}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const FlipCard = ({ title, subtitle, color, description }) => {
  const [rotation, setRotation] = useState(0);
  const cardBackRef = useRef(null);

  const flipCard = () => {
    setRotation((prev) => prev + 180);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") flipCard();
  };

  const handleSaveImage = async (e) => {
    e.stopPropagation();
    if (!cardBackRef.current) return;

    try {
      const element = cardBackRef.current;
      const clone = element.cloneNode(true);

      Object.assign(clone.style, {
        position: "fixed",
        top: "-10000px",
        left: "-10000px",
        transform: "none",
        zIndex: -1,
        width: `${element.offsetWidth}px`,
        height: `${element.offsetHeight}px`,
        borderRadius: "20px",
      });

      const actions = clone.querySelector(".card-actions");
      if (actions) actions.remove();

      document.body.appendChild(clone);
      const canvas = await html2canvas(clone, {
        backgroundColor: null,
        scale: 2,
      });
      document.body.removeChild(clone);

      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `${title}_analysis.png`;
      link.click();
    } catch (err) {
      console.error(err);
      alert("저장 중 오류가 발생했습니다.");
    }
  };

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
        // ignore share cancellation
      }
    } else {
      try {
        await navigator.clipboard.writeText(
          `${title}: ${description}\n${window.location.href}`
        );
        alert("클립보드에 복사되었습니다!");
      } catch (err) {
        // ignore clipboard error
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
          <div className="front-header">
            <h2
              className="mbti-title"
              style={{ color, textShadow: `0 0 15px ${color}` }}
            >
              {title}
            </h2>
            <span className="mbti-subtitle">{subtitle}</span>
          </div>

          {/* 게이지 바 컴포넌트 (description 전달) */}
          <MbtiGauge typeStr={title} description={description} />

          <p className="click-hint">Click to Detail</p>
        </div>

        {/* 뒷면 */}
        <div
          className="card-face card-back"
          style={{ borderColor: color }}
          ref={cardBackRef}
        >
          <div className="card-content">
            <h3 style={{ color }}>운명 분석</h3>
            <p className="description-text">{description}</p>
          </div>

          <div className="card-actions">
            <button
              type="button"
              onClick={handleSaveImage}
              className="action-btn save-btn"
            >
              💾 저장
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="action-btn share-btn"
            >
              🔗 공유
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default FlipCard;
