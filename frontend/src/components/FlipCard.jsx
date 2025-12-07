import { motion, AnimatePresence } from "framer-motion";
import { useState, useRef } from "react";
import html2canvas from "html2canvas";
import "./FlipCard.css";

// 기본 프로필 이미지 (이미지가 없을 때 사용)
const DEFAULT_AVATAR = "https://api.dicebear.com/7.x/personas/svg? seed=";

// 게이지 바 컴포넌트
const MbtiGauge = ({ typeStr, axes }) => {
  const getRatio = (left, right) => {
    // axes 데이터가 있으면 사용하여 퍼센트 계산
    if (axes) {
      // "EI", "SN" 같은 키를 찾음
      const axisKey = Object.keys(axes).find(
        (key) => key.includes(left) && key.includes(right)
      );

      if (axisKey && axes[axisKey]) {
        const lVal = axes[axisKey][left];
        const rVal = axes[axisKey][right];
        const total = lVal + rVal;

        // 0으로 나누기 방지
        const percent = total === 0 ? 50 : (lVal / total) * 100;

        return {
          percent,
          lText: lVal.toFixed(2),
          rText: rVal.toFixed(2),
        };
      }
    }

    // 데이터가 없으면 글자 포함 여부로 75% 처리 (기본값)
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
            <div
              className={`gauge-label-container left ${
                percent > 50 ? "active" : ""
              }`}
            >
              <span className="label-char">{row.left}</span>
              {lText && <span className="label-val">{lText}</span>}
            </div>

            <div className="gauge-track">
              <motion.div
                className="gauge-fill"
                initial={{ width: "50%" }}
                animate={{ width: `${percent}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>

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

// 저장/공유 옵션 모달
const SaveShareModal = ({ isOpen, onClose, onSelect, actionType }) => {
  if (!isOpen) return null;

  const options = [
    { id: "front", label: "앞면만", icon: "🎴" },
    { id: "back", label: "뒷면만", icon: "📄" },
    { id: "both", label: "앞면 + 뒷면", icon: "🃏" },
  ];

  return (
    <AnimatePresence>
      <motion.div
        className="save-modal-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="save-modal-content"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <h4 className="save-modal-title">
            {actionType === "save" ? "💾 저장 옵션" : "🔗 공유 옵션"}
          </h4>
          <p className="save-modal-desc">
            어떤 면을 {actionType === "save" ? "저장" : "공유"}할까요?
          </p>
          <div className="save-modal-options">
            {options.map((option) => (
              <button
                type="button"
                key={option.id}
                className="save-option-btn"
                onClick={() => onSelect(option.id)}
              >
                <span className="option-icon">{option.icon}</span>
                <span className="option-label">{option.label}</span>
              </button>
            ))}
          </div>
          <button type="button" className="save-modal-cancel" onClick={onClose}>
            취소
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ⭐ 유명인 프로필 컴포넌트 (앞면용)
const CelebrityProfile = ({ celebrity, color }) => {
  if (!celebrity) return null;

  const avatarUrl = celebrity.image_url || `${DEFAULT_AVATAR}${celebrity.name}`;

  return (
    <motion.div
      className="celebrity-profile-front"
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.3 }}
    >
      <div
        className="celebrity-avatar-large"
        style={{
          borderColor: color,
          boxShadow: `0 0 20px ${color}, 0 0 40px ${color}40`,
        }}
      >
        <img src={avatarUrl} alt={celebrity.name} />
      </div>
      <span className="celebrity-name-large">{celebrity.name}</span>
    </motion.div>
  );
};

const FlipCard = ({ title, subtitle, color, description, axes, celebrity }) => {
  const [rotation, setRotation] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [actionType, setActionType] = useState(null); // "save" or "share"

  const cardFrontRef = useRef(null);
  const cardBackRef = useRef(null);

  const flipCard = () => {
    setRotation((prev) => prev + 180);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") flipCard();
  };

  // 요소를 캡처하는 공통 함수
  const captureElement = async (element, removeActions = true) => {
    const clone = element.cloneNode(true);

    Object.assign(clone.style, {
      position: "fixed",
      top: "-10000px",
      left: "-10000px",
      transform: "none",
      zIndex: -1,
      width: `${element.offsetWidth}px`,
      height: "auto",
      minHeight: `${element.offsetHeight}px`,
      borderRadius: "20px",
      backfaceVisibility: "visible",
      overflow: "visible",
    });

    if (removeActions) {
      const actions = clone.querySelector(".card-actions");
      if (actions) actions.remove();
    }

    document.body.appendChild(clone);
    const canvas = await html2canvas(clone, {
      backgroundColor: null,
      scale: 2,
      useCORS: true, // 외부 이미지 허용
    });
    document.body.removeChild(clone);

    return canvas;
  };

  // 두 캔버스를 합치는 함수
  const combineCanvases = (canvas1, canvas2, gap = 20) => {
    const combinedCanvas = document.createElement("canvas");
    const ctx = combinedCanvas.getContext("2d");

    combinedCanvas.width = canvas1.width + canvas2.width + gap;
    combinedCanvas.height = Math.max(canvas1.height, canvas2.height);

    // 배경 (투명 또는 어두운 색)
    ctx.fillStyle = "rgba(20, 20, 30, 0.9)";
    ctx.fillRect(0, 0, combinedCanvas.width, combinedCanvas.height);

    // 첫 번째 카드 (앞면)
    ctx.drawImage(canvas1, 0, 0);
    // 두 번째 카드 (뒷면)
    ctx.drawImage(canvas2, canvas1.width + gap, 0);

    return combinedCanvas;
  };

  const handleSaveClick = (e) => {
    e.stopPropagation();
    setActionType("save");
    setShowModal(true);
  };

  const handleShareClick = (e) => {
    e.stopPropagation();
    setActionType("share");
    setShowModal(true);
  };

  const handleOptionSelect = async (option) => {
    setShowModal(false);

    if (actionType === "save") {
      await handleSaveImage(option);
    } else {
      await handleShare(option);
    }
  };

  const handleSaveImage = async (option) => {
    try {
      let canvas;

      if (option === "front") {
        if (!cardFrontRef.current) return;
        canvas = await captureElement(cardFrontRef.current, false);
      } else if (option === "back") {
        if (!cardBackRef.current) return;
        canvas = await captureElement(cardBackRef.current, true);
      } else if (option === "both") {
        if (!cardFrontRef.current || !cardBackRef.current) return;
        const frontCanvas = await captureElement(cardFrontRef.current, false);
        const backCanvas = await captureElement(cardBackRef.current, true);
        canvas = combineCanvases(frontCanvas, backCanvas, 40);
      }

      if (canvas) {
        const link = document.createElement("a");
        link.href = canvas.toDataURL("image/png");
        const suffix = option === "both" ? "combined" : option;
        link.download = `${title}_${suffix}.png`;
        link.click();
      }
    } catch (err) {
      alert("저장 중 오류가 발생했습니다.");
    }
  };

  const handleShare = async (option) => {
    let shareText = "";

    if (option === "front") {
      shareText = `🔮 ${title} (${subtitle})\n\n오늘의 MBTI 분석 결과입니다! `;
      if (celebrity) {
        shareText += `\n✨ 같은 MBTI 유명인: ${celebrity.name}`;
      }
    } else if (option === "back") {
      shareText = `🔮 ${title} 분석 결과\n\n${description}`;
    } else if (option === "both") {
      shareText = `🔮 ${title} (${subtitle})\n\n📖 상세 분석:\n${description}`;
      if (celebrity) {
        shareText += `\n\n✨ 같은 MBTI 유명인: ${celebrity.name}`;
      }
    }

    const shareData = {
      title: `${title} 분석 결과`,
      text: shareText,
      url: window.location.href,
    };

    if (navigator.share) {
      // 이미지 공유 시도 (Web Share API Level 2)
      try {
        let canvas;

        if (option === "front" && cardFrontRef.current) {
          canvas = await captureElement(cardFrontRef.current, false);
        } else if (option === "back" && cardBackRef.current) {
          canvas = await captureElement(cardBackRef.current, true);
        } else if (
          option === "both" &&
          cardFrontRef.current &&
          cardBackRef.current
        ) {
          const frontCanvas = await captureElement(cardFrontRef.current, false);
          const backCanvas = await captureElement(cardBackRef.current, true);
          canvas = combineCanvases(frontCanvas, backCanvas, 40);
        }

        if (canvas) {
          const blob = await new Promise((resolve) => {
            canvas.toBlob((b) => resolve(b), "image/png");
          });
          const file = new File([blob], `${title}_analysis.png`, {
            type: "image/png",
          });

          if (navigator.canShare && navigator.canShare({ files: [file] })) {
            await navigator.share({
              ...shareData,
              files: [file],
            });
            return;
          }
        }

        // 이미지 공유 불가 시 텍스트만 공유
        await navigator.share(shareData);
      } catch (err) {
        // 사용자가 공유 취소한 경우 무시
      }
    } else {
      // 클립보드에 복사
      try {
        await navigator.clipboard.writeText(
          `${shareText}\n\n${window.location.href}`
        );
        alert("클립보드에 복사되었습니다!");
      } catch (err) {
        // ignore
      }
    }
  };

  return (
    <>
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
          {/* ===== 앞면 ===== */}
          <div
            className="card-face card-front"
            style={{ borderColor: color }}
            ref={cardFrontRef}
          >
            {/* MBTI 타이틀 */}
            <div className="front-header">
              <h2
                className="mbti-title"
                style={{ color, textShadow: `0 0 15px ${color}` }}
              >
                {title}
              </h2>
              <span className="mbti-subtitle">{subtitle}</span>
            </div>

            {/* MBTI 게이지 */}
            <MbtiGauge typeStr={title} axes={axes} />

            {/* ⭐ 유명인 프로필 (앞면에 추가) */}
            <CelebrityProfile celebrity={celebrity} color={color} />

            <p className="click-hint">Click to Detail</p>
          </div>

          {/* ===== 뒷면 ===== */}
          <div
            className="card-face card-back"
            style={{ borderColor: color }}
            ref={cardBackRef}
          >
            <div className="card-content">
              <h3 style={{ color }}>운명 분석</h3>
              <p className="description-text">{description}</p>

              {/* 유명인 상세 정보 (뒷면) */}
              {celebrity && (
                <div className="celebrity-section">
                  <div className="celebrity-label">
                    ✨ 당신과 같은 MBTI 유명인
                  </div>
                  <div className="celebrity-name">{celebrity.name}</div>
                  {celebrity.description && (
                    <div className="celebrity-desc">
                      {celebrity.description}
                    </div>
                  )}
                  {celebrity.tags && celebrity.tags.length > 0 && (
                    <div className="celebrity-tags">
                      {celebrity.tags.slice(0, 4).map((tag) => (
                        <span key={tag} className="celebrity-tag">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="card-actions">
              <button
                type="button"
                onClick={handleSaveClick}
                className="action-btn save-btn"
              >
                💾 저장
              </button>
              <button
                type="button"
                onClick={handleShareClick}
                className="action-btn share-btn"
              >
                🔗 공유
              </button>
            </div>
          </div>
        </motion.div>
      </div>

      {/* 저장/공유 옵션 모달 */}
      <SaveShareModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSelect={handleOptionSelect}
        actionType={actionType}
      />
    </>
  );
};

export default FlipCard;
