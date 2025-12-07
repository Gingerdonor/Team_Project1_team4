import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LOADING_EFFECTS } from "./LoadingEffects";
import "./LoadingEffects.css";

const EffectSelector = ({ isOpen, currentEffect, onSelect, onClose }) => {
  const [selected, setSelected] = useState(currentEffect);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onSelect(selected);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        className="effect-selector-overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="effect-selector-modal"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.8, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
        >
          <h3 className="effect-selector-title">✨ 로딩 효과 선택</h3>

          <div className="effect-grid">
            {LOADING_EFFECTS.map((effect) => (
              <button
                type="button"
                key={effect.id}
                className={`effect-option ${
                  selected === effect.id ? "selected" : ""
                }`}
                onClick={() => setSelected(effect.id)}
              >
                <span className="effect-icon">{effect.icon}</span>
                <span className="effect-name">{effect.name}</span>
              </button>
            ))}
          </div>

          <div className="effect-selector-actions">
            <button
              type="button"
              className="effect-btn secondary"
              onClick={onClose}
            >
              취소
            </button>
            <button
              type="button"
              className="effect-btn primary"
              onClick={handleConfirm}
            >
              적용하기
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default EffectSelector;
