// components/EmotionPicker/EmojiPicker.js
import React from "react";
import { EMOTIONS } from "../../constants/emotions";
import "./EmojiPicker.css";

const EmotionPicker = ({
  isOpen,
  position = "top",
  selectedEmotion,
  hoverEmotion,
  onEmotionSelect,
  onHoverEmotion,
  pickerRef,
  onMouseEnter,
  onMouseLeave,
}) => {
  if (!isOpen) return null;

  return (
    <div
      ref={pickerRef}
      className={`emotion-picker emotion-picker--${position}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div className="emotion-picker-content">
        <div className="emotion-grid">
          {EMOTIONS.map((emotion) => (
            <button
              key={emotion.key}
              className={`emotion-option ${
                selectedEmotion === emotion.key ? "selected" : ""
              }`}
              onClick={() => onEmotionSelect(emotion.key)}
              onMouseEnter={() => onHoverEmotion(emotion.key)}
              title={emotion.label}
              style={{
                transform:
                  hoverEmotion === emotion.key ? "scale(1.3)" : "scale(1)",
              }}
            >
              <span className="emotion-icon">{emotion.icon}</span>
              <span className="emotion-label">{emotion.label}</span>
            </button>
          ))}
        </div>
        {/* <div className="emotion-picker-arrow"></div> */}
      </div>
    </div>
  );
};

export default EmotionPicker;
