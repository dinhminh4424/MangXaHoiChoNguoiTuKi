import { useEffect, useRef, useState } from "react";
import { Modal, Button, Badge, Form } from "react-bootstrap";
import { Mic, MicFill, X, Stop, Trash } from "react-bootstrap-icons";
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
