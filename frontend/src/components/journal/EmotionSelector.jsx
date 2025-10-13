// components/journal/EmotionSelector.jsx
import React from "react";

const EMOTIONS = [
  { emoji: "😊", label: "happy", name: "Vui vẻ", color: "#fbbf24" },
  { emoji: "😢", label: "sad", name: "Buồn", color: "#60a5fa" },
  { emoji: "😡", label: "angry", name: "Tức giận", color: "#ef4444" },
  { emoji: "😴", label: "tired", name: "Mệt mỏi", color: "#6b7280" },
  { emoji: "😃", label: "excited", name: "Hào hứng", color: "#f59e0b" },
  { emoji: "😰", label: "anxious", name: "Lo lắng", color: "#8b5cf6" },
  { emoji: "😌", label: "peaceful", name: "Bình yên", color: "#10b981" },
  { emoji: "🤔", label: "thoughtful", name: "Suy tư", color: "#6366f1" },
  { emoji: "🎉", label: "celebratory", name: "Ăn mừng", color: "#ec4899" },
  { emoji: "💪", label: "motivated", name: "Động lực", color: "#84cc16" },
];

export const EmotionSelector = ({ selectedEmotions, onEmotionSelect }) => {
  return (
    <div className="emotion-selector">
      <h6 className="fw-semibold mb-3">Cảm xúc hôm nay của bạn:</h6>
      <div className="d-flex flex-wrap gap-2">
        {EMOTIONS.map((emotion) => (
          <button
            key={emotion.label}
            type="button"
            onClick={() => onEmotionSelect(emotion.label)}
            className={`emotion-badge d-flex align-items-center gap-2 p-2 border-0 rounded ${
              selectedEmotions.includes(emotion.label) ? "selected" : ""
            }`}
            style={{
              backgroundColor: selectedEmotions.includes(emotion.label)
                ? emotion.color
                : "transparent",
              border: `2px solid ${emotion.color}`,
              color: selectedEmotions.includes(emotion.label)
                ? "white"
                : emotion.color,
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
            title={emotion.name}
          >
            <span className="emoji fs-5">{emotion.emoji}</span>
            <span className="name">{emotion.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};
