// // =====================================================================================
// import React, { useEffect, useRef, useState } from "react";

// export default function SpeechToTextButton({
//   onTextChange,
//   placeholder = "Nhấn nút để bắt đầu nói...",
//   className = "",
//   buttonSize = "md",
// }) {
//   const [isActive, setIsActive] = useState(false);
//   const [isListening, setIsListening] = useState(false);
//   const [showSettings, setShowSettings] = useState(false);
//   const [finalText, setFinalText] = useState("");
//   const [interimText, setInterimText] = useState("");
//   const [language, setLanguage] = useState("vi-VN");
//   const [status, setStatus] = useState("Nhấn để bắt đầu");
//   const recognitionRef = useRef(null);

//   // Khởi tạo Speech Recognition
//   useEffect(() => {
//     const SpeechRecognition =
//       window.SpeechRecognition || window.webkitSpeechRecognition;

//     if (!SpeechRecognition) {
//       setStatus("Trình duyệt không hỗ trợ");
//       return;
//     }

//     const recognition = new SpeechRecognition();
//     recognition.lang = language;
//     recognition.interimResults = true;
//     recognition.continuous = true;

//     recognition.onstart = () => {
//       setIsListening(true);
//       setStatus("Đang nghe...");
//     };

//     recognition.onresult = (event) => {
//       let newFinalText = finalText;
//       let newInterimText = "";

//       for (let i = event.resultIndex; i < event.results.length; i++) {
//         const result = event.results[i];
//         const transcript = result[0].transcript;

//         if (result.isFinal) {
//           newFinalText += transcript;
//         } else {
//           newInterimText += transcript;
//         }
//       }

//       // Cập nhật state
//       if (newFinalText !== finalText) {
//         setFinalText(newFinalText);
//         if (onTextChange) {
//           onTextChange(newFinalText);
//         }
//       }
//       setInterimText(newInterimText);
//     };

//     recognition.onerror = (event) => {
//       console.error("Speech recognition error:", event.error);
//       if (event.error === "not-allowed") {
//         setStatus("Micro bị chặn. Vui lòng cho phép sử dụng micro.");
//       } else if (event.error === "audio-capture") {
//         setStatus("Không tìm thấy micro");
//       } else if (event.error === "network") {
//         setStatus("Lỗi kết nối mạng");
//       } else {
//         setStatus("Lỗi: " + event.error);
//       }
//       setIsListening(false);
//     };

//     recognition.onend = () => {
//       setIsListening(false);
//       if (status !== "Micro bị chặn") {
//         setStatus("Đã dừng");
//       }
//     };

//     recognitionRef.current = recognition;

//     return () => {
//       if (recognitionRef.current) {
//         recognitionRef.current.stop();
//       }
//     };
//   }, [language]); // Loại bỏ finalText và onTextChange khỏi dependencies

//   const startListening = () => {
//     if (!recognitionRef.current) {
//       setStatus("Không hỗ trợ");
//       return;
//     }

//     try {
//       // Reset text khi bắt đầu mới
//       setFinalText("");
//       setInterimText("");
//       recognitionRef.current.start();
//       setShowSettings(false);
//       setStatus("Đang khởi động...");
//     } catch (error) {
//       console.error("Error starting recognition:", error);
//       setStatus("Lỗi khi bắt đầu");
//     }
//   };

//   const stopListening = () => {
//     if (recognitionRef.current && isListening) {
//       recognitionRef.current.stop();
//     }
//     setIsListening(false);
//   };

//   const handleMainButtonClick = () => {
//     setIsActive(true);
//   };

//   const handleClose = () => {
//     setIsActive(false);
//     setShowSettings(false);
//     stopListening();
//   };

//   const clearText = () => {
//     setFinalText("");
//     setInterimText("");
//     if (onTextChange) {
//       onTextChange("");
//     }
//   };

//   const handleLanguageChange = (e) => {
//     const newLanguage = e.target.value;
//     setLanguage(newLanguage);
//     setShowSettings(false);

//     // Thông báo ngôn ngữ đã thay đổi
//     setStatus(`Đã chọn: ${e.target.options[e.target.selectedIndex].text}`);

//     // Dừng và reset nếu đang nghe
//     if (isListening) {
//       stopListening();
//     }
//   };

//   const getButtonSizeClass = () => {
//     switch (buttonSize) {
//       case "sm":
//         return "btn-sm";
//       case "lg":
//         return "btn-lg";
//       default:
//         return "";
//     }
//   };

//   // Danh sách ngôn ngữ
//   const LanguageSelect = [
//     {
//       value: "vi-VN",
//       name: "Tiếng Việt",
//       flag: "🇻🇳",
//     },
//     {
//       value: "en-US",
//       name: "English (US)",
//       flag: "🇺🇸",
//     },
//     {
//       value: "en-GB",
//       name: "English (UK)",
//       flag: "🇬🇧",
//     },
//   ];

//   // Nếu chưa active, chỉ hiển thị nút chính
//   if (!isActive) {
//     return (
//       <button
//         type="button"
//         className={`btn btn-primary ${getButtonSizeClass()} ${className}`}
//         onClick={handleMainButtonClick}
//       >
//         <i className="bi bi-mic me-2"></i>
//         Nói
//       </button>
//     );
//   }

//   return (
//     <div className={`card ${className}`}>
//       <div className="card-body">
//         <div className="d-flex justify-content-between align-items-center mb-3">
//           <h6 className="card-title mb-0">Nhận diện giọng nói</h6>
//           <button
//             type="button"
//             className="btn-close"
//             onClick={handleClose}
//             aria-label="Đóng"
//           ></button>
//         </div>

//         <div className="mb-3">
//           <div
//             className="form-control"
//             style={{
//               minHeight: "80px",
//               background: interimText ? "#f8f9fa" : "white",
//               borderColor: isListening ? "#0d6efd" : "#dee2e6",
//               whiteSpace: "pre-wrap",
//             }}
//           >
//             {finalText && <div className="mb-1">{finalText}</div>}
//             {interimText && (
//               <div style={{ color: "#6c757d", fontStyle: "italic" }}>
//                 {interimText}
//               </div>
//             )}
//             {!finalText && !interimText && (
//               <div style={{ color: "#6c757d" }}>{placeholder}</div>
//             )}
//           </div>

//           <div className="mt-1">
//             <small
//               className={`badge ${
//                 isListening
//                   ? "bg-success"
//                   : status.includes("Lỗi") || status.includes("chặn")
//                   ? "bg-danger"
//                   : "bg-secondary"
//               }`}
//             >
//               {isListening ? "🔴 Đang thu" : status}
//             </small>
//           </div>
//         </div>

//         <div className="d-flex gap-2 flex-wrap">
//           {!isListening ? (
//             <button
//               type="button"
//               className={`btn btn-success ${getButtonSizeClass()}`}
//               onClick={startListening}
//               disabled={status.includes("Không hỗ trợ")}
//             >
//               <i className="bi bi-mic-fill me-2"></i>
//               Bắt đầu nói
//             </button>
//           ) : (
//             <button
//               type="button"
//               className={`btn btn-danger ${getButtonSizeClass()}`}
//               onClick={stopListening}
//             >
//               <i className="bi bi-stop-fill me-2"></i>
//               Dừng
//             </button>
//           )}

//           <button
//             type="button"
//             className={`btn btn-outline-secondary ${getButtonSizeClass()}`}
//             onClick={() => setShowSettings(!showSettings)}
//           >
//             <i className="bi bi-gear me-2"></i>
//             Cài đặt
//           </button>

//           {(finalText || interimText) && (
//             <button
//               type="button"
//               className={`btn btn-outline-secondary ${getButtonSizeClass()}`}
//               onClick={clearText}
//             >
//               <i className="bi bi-trash me-2"></i>
//               Xóa
//             </button>
//           )}
//         </div>

//         {showSettings && (
//           <div className="mt-3 p-3 border rounded">
//             <h6 className="mb-3">Cài đặt</h6>

//             <div className="mb-3">
//               <label className="form-label">Ngôn ngữ:</label>
//               <select
//                 className="form-select"
//                 value={language}
//                 onChange={handleLanguageChange}
//               >
//                 <option value="vi-VN">🇻🇳 Tiếng Việt</option>
//                 <option value="en-US">🇺🇸 English (US)</option>
//                 <option value="en-GB">🇬🇧 English (UK)</option>
//                 <option value="fr-FR">🇫🇷 Français</option>
//                 <option value="ja-JP">🇯🇵 日本語</option>
//                 <option value="ko-KR">🇰🇷 한국어</option>
//                 <option value="zh-CN">🇨🇳 中文 (简体)</option>
//               </select>
//             </div>

//             <div className="form-text">
//               <small>
//                 <i className="bi bi-info-circle me-1"></i>
//                 Hỗ trợ tốt nhất trên Chrome/Edge. Cho phép sử dụng micro khi
//                 trình duyệt hỏi.
//               </small>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
import React, { useEffect, useRef, useState } from "react";
import { Modal, Button, Badge, Form } from "react-bootstrap";
import { Mic, MicFill, X, Stop, Trash, Gear } from "react-bootstrap-icons";
import "./SpeechToText.css";

export default function SpeechToTextButton({
  onTextChange,
  placeholder = "Nhấn nút để bắt đầu nói...",
  className = "",
  buttonSize = "md",
}) {
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [finalText, setFinalText] = useState("");
  const [interimText, setInterimText] = useState("");
  const [language, setLanguage] = useState("vi-VN");
  const [status, setStatus] = useState("Nhấn để bắt đầu");
  const recognitionRef = useRef(null);

  // Khởi tạo Speech Recognition
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatus("Trình duyệt không hỗ trợ");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = language;
    recognition.interimResults = true;
    recognition.continuous = true;

    recognition.onstart = () => {
      setIsListening(true);
      setStatus("Đang nghe...");
    };

    recognition.onresult = (event) => {
      let newFinalText = finalText;
      let newInterimText = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const transcript = result[0].transcript;

        if (result.isFinal) {
          newFinalText += transcript;
        } else {
          newInterimText += transcript;
        }
      }

      if (newFinalText !== finalText) {
        setFinalText(newFinalText);
        if (onTextChange) {
          onTextChange(newFinalText);
        }
      }
      setInterimText(newInterimText);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      if (event.error === "not-allowed") {
        setStatus("Micro bị chặn");
      } else if (event.error === "audio-capture") {
        setStatus("Không tìm thấy micro");
      } else {
        setStatus("Lỗi: " + event.error);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (!status.includes("chặn")) {
        setStatus("Đã dừng");
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language]);

  const startListening = () => {
    if (!recognitionRef.current) {
      setStatus("Không hỗ trợ");
      return;
    }

    try {
      setFinalText("");
      setInterimText("");
      recognitionRef.current.start();
      setStatus("Đang khởi động...");
    } catch (error) {
      console.error("Error starting recognition:", error);
      setStatus("Lỗi khi bắt đầu");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const handleClose = () => {
    setIsActive(false);
    stopListening();
  };

  const clearText = () => {
    setFinalText("");
    setInterimText("");
    if (onTextChange) {
      onTextChange("");
    }
  };

  const handleApplyText = () => {
    const textToApply = finalText + (interimText ? interimText : "");
    if (onTextChange && textToApply.trim()) {
      onTextChange(textToApply.trim());
    }
    handleClose();
  };

  const buttonSizes = {
    sm: { class: "btn-sm", icon: 16 },
    md: { class: "", icon: 20 },
    lg: { class: "btn-lg", icon: 24 },
  };

  const { class: sizeClass, icon: iconSize } = buttonSizes[buttonSize];

  // Nếu chưa active, chỉ hiển thị nút chính
  if (!isActive) {
    return (
      <Button
        variant="primary"
        className={`stt-main-btn ${sizeClass} ${className}`}
        onClick={() => setIsActive(true)}
      >
        <Mic size={iconSize} className="me-2" />
      </Button>
    );
  }

  return (
    <Modal
      show={isActive}
      onHide={handleClose}
      centered
      size="lg"
      className="stt-simple-modal"
    >
      <Modal.Header className="stt-simple-header">
        <Modal.Title>
          <Mic size={24} className="me-2" />
          Nhận diện giọng nói
        </Modal.Title>
        <Button variant="outline-light" size="sm" onClick={handleClose}>
          <X size={18} />
        </Button>
      </Modal.Header>

      <Modal.Body className="stt-simple-body">
        {/* Text Display */}
        <div className="stt-text-display">
          {finalText && <div className="stt-final-text">{finalText}</div>}
          {interimText && (
            <div className="stt-interim-text">
              {interimText}
              <span className="stt-cursor">|</span>
            </div>
          )}
          {!finalText && !interimText && (
            <div className="stt-placeholder">{placeholder}</div>
          )}
        </div>

        {/* Status */}
        <div className="stt-status-section">
          <Badge
            bg={
              isListening
                ? "success"
                : status.includes("Lỗi")
                ? "danger"
                : "secondary"
            }
            className="stt-status-badge"
          >
            {isListening ? (
              <>
                <div className="stt-pulse-dot"></div>
                Đang thu âm...
              </>
            ) : (
              status
            )}
          </Badge>
        </div>

        {/* Language Select */}
        <Form.Group className="stt-language-section">
          <Form.Label>Ngôn ngữ:</Form.Label>
          <Form.Select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            size="sm"
          >
            <option value="vi-VN">🇻🇳 Tiếng Việt</option>
            <option value="en-US">🇺🇸 English</option>
            <option value="fr-FR">🇫🇷 Français</option>
            <option value="ja-JP">🇯🇵 日本語</option>
          </Form.Select>
        </Form.Group>
      </Modal.Body>

      <Modal.Footer className="stt-simple-footer">
        <div className="stt-actions">
          <Button
            variant="outline-secondary"
            onClick={clearText}
            disabled={!finalText && !interimText}
            size="sm"
          >
            <Trash size={14} className="me-1" />
            Xóa
          </Button>

          <div className="stt-main-actions">
            {!isListening ? (
              <Button
                variant="success"
                onClick={startListening}
                disabled={status.includes("Không hỗ trợ")}
              >
                <MicFill size={16} className="me-1" />
                Bắt đầu nói
              </Button>
            ) : (
              <Button variant="danger" onClick={stopListening}>
                <Stop size={16} className="me-1" />
                Dừng
              </Button>
            )}

            <Button
              variant="primary"
              onClick={handleApplyText}
              disabled={!finalText.trim() && !interimText.trim()}
            >
              Áp dụng
            </Button>
          </div>
        </div>
      </Modal.Footer>
    </Modal>
  );
}
