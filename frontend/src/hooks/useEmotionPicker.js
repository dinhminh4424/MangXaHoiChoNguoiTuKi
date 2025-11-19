// // hooks/useEmotionPicker.js
// import { useState, useRef, useEffect } from "react";

// export const useEmotionPicker = (onEmotionSelect) => {
//   const [showEmotionPicker, setShowEmotionPicker] = useState(false);
//   const [hoverEmotion, setHoverEmotion] = useState(null);
//   const likeButtonRef = useRef(null);
//   const pickerRef = useRef(null);
//   let hideTimeout;

//   useEffect(() => {
//     const handleClickOutside = (event) => {
//       if (
//         pickerRef.current &&
//         !pickerRef.current.contains(event.target) &&
//         likeButtonRef.current &&
//         !likeButtonRef.current.contains(event.target)
//       ) {
//         setShowEmotionPicker(false);
//         setHoverEmotion(null);
//       }
//     };

//     document.addEventListener("mousedown", handleClickOutside);
//     return () => {
//       document.removeEventListener("mousedown", handleClickOutside);
//     };
//   }, []);

//   const handleEmotionSelect = (emotionKey) => {
//     setShowEmotionPicker(false);
//     setHoverEmotion(null);
//     onEmotionSelect?.(emotionKey);
//   };

//   const handleLikeMouseEnter = () => {
//     clearTimeout(hideTimeout);
//     setShowEmotionPicker(true);
//   };

//   const handleLikeMouseLeave = () => {
//     hideTimeout = setTimeout(() => {
//       if (!pickerRef.current?.matches(":hover")) {
//         setShowEmotionPicker(false);
//         setHoverEmotion(null);
//       }
//     }, 300);
//   };

//   const handlePickerMouseEnter = () => {
//     clearTimeout(hideTimeout);
//   };

//   const handlePickerMouseLeave = () => {
//     hideTimeout = setTimeout(() => {
//       setShowEmotionPicker(false);
//       setHoverEmotion(null);
//     }, 300);
//   };

//   return {
//     showEmotionPicker,
//     hoverEmotion,
//     likeButtonRef,
//     pickerRef,
//     setHoverEmotion,
//     handleEmotionSelect,
//     handleLikeMouseEnter,
//     handleLikeMouseLeave,
//     handlePickerMouseEnter,
//     handlePickerMouseLeave,
//   };
// };

// hooks/useEmotionPicker.js
import { useState, useRef, useEffect } from "react";

export const useEmotionPicker = (onEmotionSelect) => {
  const [showEmotionPicker, setShowEmotionPicker] = useState(false);
  const [hoverEmotion, setHoverEmotion] = useState(null);
  const [isLongPress, setIsLongPress] = useState(false);
  const likeButtonRef = useRef(null);
  const pickerRef = useRef(null);
  let hideTimeout;
  let longPressTimeout;

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
        setIsLongPress(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  const handleEmotionSelect = (emotionKey) => {
    setShowEmotionPicker(false);
    setHoverEmotion(null);
    setIsLongPress(false);
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
        setIsLongPress(false);
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
      setIsLongPress(false);
    }, 300);
  };

  // Sự kiện cho touch devices
  const handleLikeTouchStart = () => {
    longPressTimeout = setTimeout(() => {
      setShowEmotionPicker(true);
      setIsLongPress(true);
    }, 500); // 500ms nhấn giữ
  };

  const handleLikeTouchEnd = () => {
    clearTimeout(longPressTimeout);

    // Nếu không phải là long press, thực hiện hành động like thông thường
    if (!isLongPress) {
      onEmotionSelect?.("like");
    }
  };

  const handleLikeTouchMove = () => {
    clearTimeout(longPressTimeout);
  };

  const handlePickerTouchEnd = (emotionKey) => {
    handleEmotionSelect(emotionKey);
  };

  // Cleanup timeouts
  useEffect(() => {
    return () => {
      clearTimeout(hideTimeout);
      clearTimeout(longPressTimeout);
    };
  }, []);

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
    // Touch events
    handleLikeTouchStart,
    handleLikeTouchEnd,
    handleLikeTouchMove,
    handlePickerTouchEnd,
    isLongPress,
  };
};
