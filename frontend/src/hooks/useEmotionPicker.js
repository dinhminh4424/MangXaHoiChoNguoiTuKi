// hooks/useEmotionPicker.js
import { useState, useRef, useEffect } from "react";

export const useEmotionPicker = (onEmotionSelect) => {
  const [showEmotionPicker, setShowEmotionPicker] = useState(false);
  const [hoverEmotion, setHoverEmotion] = useState(null);
  const likeButtonRef = useRef(null);
  const pickerRef = useRef(null);
  let hideTimeout;

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        pickerRef.current &&
        !pickerRef.current.contains(event.target) &&
        likeButtonRef.current &&
        !likeButtonRef.current.contains(event.target)
      ) {
        setShowEmotionPicker(false);
        setHoverEmotion(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleEmotionSelect = (emotionKey) => {
    setShowEmotionPicker(false);
    setHoverEmotion(null);
    onEmotionSelect?.(emotionKey);
  };

  const handleLikeMouseEnter = () => {
    clearTimeout(hideTimeout);
    setShowEmotionPicker(true);
  };

  const handleLikeMouseLeave = () => {
    hideTimeout = setTimeout(() => {
      if (!pickerRef.current?.matches(":hover")) {
        setShowEmotionPicker(false);
        setHoverEmotion(null);
      }
    }, 300);
  };

  const handlePickerMouseEnter = () => {
    clearTimeout(hideTimeout);
  };

  const handlePickerMouseLeave = () => {
    hideTimeout = setTimeout(() => {
      setShowEmotionPicker(false);
      setHoverEmotion(null);
    }, 300);
  };

  return {
    showEmotionPicker,
    hoverEmotion,
    likeButtonRef,
    pickerRef,
    setHoverEmotion,
    handleEmotionSelect,
    handleLikeMouseEnter,
    handleLikeMouseLeave,
    handlePickerMouseEnter,
    handlePickerMouseLeave,
  };
};
