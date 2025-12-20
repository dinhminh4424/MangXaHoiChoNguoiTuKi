import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";
import "./TextReaderTwoButtons.css";

// SVG Icon Components
const SaveIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    color="white"
  >
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

const ResetIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    color="white"
  >
    <polyline points="1 4 1 10 7 10" />
    <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
  </svg>
);

const TestIcon = () => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    color="white"
  >
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
  </svg>
);

const AudioIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
    <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
    <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
  </svg>
);

const StopIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
  </svg>
);

const SettingsIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </svg>
);

const MusicIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M9 18V5l12-2v13" />
    <circle cx="6" cy="18" r="3" />
    <circle cx="18" cy="16" r="3" />
  </svg>
);

const CloseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);

const PauseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <rect x="6" y="4" width="4" height="16" />
    <rect x="14" y="4" width="4" height="16" />
  </svg>
);

const ReadyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M20 6L9 17l-5-5" />
  </svg>
);

const TextReaderTwoButtons = ({
  text: propText,
  lang: propLang = "vi-VN",
  rate: propRate = 0.95,
  pitch: propPitch = 1.0,
  volume: propVolume = 1.0,
  showSetupDefault = false,
  height = 40, // Chiều cao mặc định
  minWidth = 120, // Chiều rộng tối thiểu
  children = "", // "light" hoặc "dark"
}) => {
  // Local state
  const [isReading, setIsReading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showSetup, setShowSetup] = useState(showSetupDefault);
  const [voices, setVoices] = useState([]);
  const [filteredVoices, setFilteredVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState("");

  // Editable settings
  const [text, setText] = useState(propText || "");
  const [rate, setRate] = useState(propRate);
  const [pitch, setPitch] = useState(propPitch);
  const [volume, setVolume] = useState(propVolume);

  const utterRef = useRef(null);
  const modalRef = useRef(null);

  const containerStyle = {
    minHeight: `${height}px`,
    minWidth: `${minWidth}px`,
    display: "inline-flex",
    alignItems: "center",
  };

  const buttonStyle = {
    width: `${height}px`,
    height: `${height}px`,
    padding: 0,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    fontSize: Math.max(14, height * 0.35), // Font size tỷ lệ với chiều cao
  };

  // Lấy danh sách giọng đọc
  // useEffect(() => {
  //   const populateVoices = () => {
  //     const allVoices = window.speechSynthesis.getVoices() || [];

  //     console.log("allVoices", allVoices);

  //     setVoices(allVoices);

  //     // Sắp xếp và lọc giọng đọc: ưu tiên tiếng Việt, rồi tiếng Anh
  //     const sortedVoices = [...allVoices].sort((a, b) => {
  //       const aLang = a.lang || "";
  //       const bLang = b.lang || "";

  //       // Ưu tiên tiếng Việt lên đầu
  //       if (aLang.startsWith("vi") && !bLang.startsWith("vi")) return -1;
  //       if (!aLang.startsWith("vi") && bLang.startsWith("vi")) return 1;

  //       // Sau đó ưu tiên tiếng Anh
  //       if (aLang.startsWith("en") && !bLang.startsWith("en")) return -1;
  //       if (!aLang.startsWith("en") && bLang.startsWith("en")) return 1;

  //       // Còn lại sắp xếp theo tên
  //       return a.name.localeCompare(b.name);
  //     });

  //     setFilteredVoices(sortedVoices);

  //     // Tự động chọn giọng phù hợp với ngôn ngữ hiện tại
  //     if (sortedVoices.length > 0 && !selectedVoice) {
  //       const defaultVoice =
  //         sortedVoices.find((voice) =>
  //           voice.lang.startsWith(propLang.split("-")[0])
  //         ) || sortedVoices[0];
  //       setSelectedVoice(defaultVoice.name);
  //     }
  //   };

  //   populateVoices();
  //   window.speechSynthesis.onvoiceschanged = populateVoices;

  //   return () => {
  //     window.speechSynthesis.onvoiceschanged = null;
  //   };
  // }, [propLang, selectedVoice]);

  useEffect(() => {
    const synth = window.speechSynthesis;

    const populateVoices = () => {
      const allVoices = synth.getVoices();
      if (!allVoices.length) return;

      console.log("allVoices", allVoices);

      setVoices(allVoices);

      const sortedVoices = [...allVoices].sort((a, b) => {
        const la = a.lang || "";
        const lb = b.lang || "";

        if (la !== lb) return la.localeCompare(lb);

        // ưu tiên local voice
        if (a.localService && !b.localService) return -1;
        if (!a.localService && b.localService) return 1;

        return a.name.localeCompare(b.name);
      });

      setFilteredVoices(sortedVoices);

      // chỉ set default 1 lần
      setSelectedVoice((prev) => {
        if (prev) return prev;

        const baseLang = propLang.split("-")[0];
        const def =
          sortedVoices.find((v) => v.lang === propLang) ||
          sortedVoices.find((v) => v.lang.startsWith(baseLang)) ||
          sortedVoices[0];

        return def?.name || "";
      });
    };

    populateVoices();
    synth.onvoiceschanged = populateVoices;

    return () => {
      synth.onvoiceschanged = null;
    };
  }, []); // ⚠️ KHÔNG CÓ DEPENDENCY

  // Nếu props thay đổi từ parent, cập nhật local state tương ứng
  useEffect(() => setText(propText || ""), [propText]);
  useEffect(() => setRate(propRate), [propRate]);
  useEffect(() => setPitch(propPitch), [propPitch]);
  useEffect(() => setVolume(propVolume), [propVolume]);

  // Click outside to close modal
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        setShowSetup(false);
      }
    };

    if (showSetup) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSetup]);

  // Cleanup khi unmount
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel();
      utterRef.current = null;
    };
  }, []);

  // Hàm đọc / dừng (nút chính)
  const handleReadToggle = () => {
    if (isReading) {
      window.speechSynthesis.cancel();
      setIsReading(false);
      setIsPaused(false);
      utterRef.current = null;
      return;
    }

    if (!text || !text.trim()) {
      alert("Vui lòng truyền `text` (hoặc nhập nội dung trong Setup).");
      return;
    }

    const u = new SpeechSynthesisUtterance(text);

    // Chọn giọng nếu có
    if (selectedVoice) {
      const foundVoice = voices.find((v) => v.name === selectedVoice);
      if (foundVoice) {
        u.voice = foundVoice;
        u.lang = foundVoice.lang;
      } else {
        u.lang = propLang;
      }
    } else {
      u.lang = propLang;
    }

    u.rate = Number(rate) || 1.0;
    u.pitch = Number(pitch) || 1.0;
    u.volume = Number(volume) || 1.0;

    u.onstart = () => {
      setIsReading(true);
      setIsPaused(false);
    };
    u.onend = () => {
      setIsReading(false);
      setIsPaused(false);
      utterRef.current = null;
    };
    u.onerror = (e) => {
      console.error("Speech error:", e);
      setIsReading(false);
      setIsPaused(false);
      utterRef.current = null;
    };

    utterRef.current = u;
    window.speechSynthesis.speak(u);
  };

  // Helper để hiển thị tên giọng theo định dạng (lang)-name
  const getVoiceDisplayName = (voice) => {
    const langCode = voice.lang || "unknown";
    const langPrefix = langCode;
    return `(${langPrefix}) ${voice.voiceURI}`;
  };

  const squareBtnStyle = {
    width: height || 50,
    height: height || 50,
    padding: 0,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 6,
    fontSize: 18,
  };

  return (
    <div className="trtb-container" style={containerStyle}>
      {/* Row chứa 2 nút */}
      <div className="d-flex align-items-center gap-2">
        {/* Nút đọc / dừng */}
        <button
          type="button"
          className={`btn ${isReading ? "btn-danger" : "btn-primary"}`}
          // style={squareBtnStyle}
          style={buttonStyle}
          title={isReading ? "Dừng đọc" : "Đọc văn bản"}
          onClick={handleReadToggle}
        >
          <i className="trtb-icon">
            {isReading ? <StopIcon /> : <AudioIcon />}
          </i>
        </button>

        {/* Nút setup */}
        <button
          type="button"
          className="btn btn-secondary border-1 "
          // style={squareBtnStyle}
          style={buttonStyle}
          title="Mở cài đặt đọc"
          onClick={() => setShowSetup((s) => !s)}
        >
          <i className="trtb-icon">
            <SettingsIcon />
          </i>
        </button>

        {children}

        {/* Hiển thị trạng thái */}
        {minWidth > 160 && (
          <div style={{ marginLeft: 8, minWidth: "80px" }}>
            <small className="text-muted">
              {isReading ? (
                isPaused ? (
                  <>
                    <i className="tra-icon tra-icon-pause">
                      <PauseIcon />
                    </i>{" "}
                    Tạm dừng
                  </>
                ) : (
                  <>
                    <i className="tra-icon tra-icon-audio">
                      <AudioIcon />
                    </i>{" "}
                    Đang đọc...
                  </>
                )
              ) : (
                <>
                  <i className="tra-icon tra-icon-ready">
                    <ReadyIcon />
                  </i>{" "}
                  Sẵn sàng
                </>
              )}
            </small>
          </div>
        )}
      </div>

      {/* Modal Popup */}
      {showSetup && (
        <div className="trtb-modal-overlay">
          <div className="trtb-modal-content" ref={modalRef}>
            {/* Modal Header */}
            <div className="trtb-modal-header">
              <h5 className="trtb-modal-title">
                <i className="trtb-icon trtb-icon-music">
                  <MusicIcon />
                </i>
                Cài đặt Text-to-Speech
              </h5>
              <button
                type="button"
                className="btn trtb-modal-close"
                onClick={() => setShowSetup(false)}
              >
                <i className="trtb-icon trtb-icon-close">
                  <CloseIcon />
                </i>
              </button>
            </div>

            {/* Modal Body */}
            <div className="trtb-modal-body">
              {/* Text input */}
              <div className="trtb-form-section">
                <label className="trtb-form-label">Nội dung văn bản</label>
                <textarea
                  className="trtb-textarea-custom w-100"
                  rows={4}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Nhập văn bản sẽ đọc..."
                />
              </div>

              <div className="trtb-settings-grid">
                {/* Voice selection */}
                <div className="trtb-setting-group">
                  <label className="trtb-setting-label">Giọng đọc</label>
                  <select
                    className="trtb-select-custom"
                    value={selectedVoice}
                    onChange={(e) => setSelectedVoice(e.target.value)}
                  >
                    <option value="">Mặc định hệ thống</option>
                    {filteredVoices.map((voice) => (
                      <option key={voice.name} value={voice.name}>
                        {getVoiceDisplayName(voice)}
                      </option>
                    ))}
                  </select>
                  <div className="trtb-setting-info">
                    {filteredVoices.length} giọng có sẵn
                  </div>
                </div>

                {/* Rate */}
                <div className="trtb-setting-group">
                  <label className="trtb-setting-label">
                    Tốc độ:{" "}
                    <span className="trtb-value-display">
                      {Number(rate).toFixed(2)}
                    </span>
                  </label>
                  <input
                    className="trtb-range-custom"
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.05"
                    value={rate}
                    onChange={(e) => setRate(e.target.value)}
                  />
                </div>

                {/* Pitch */}
                <div className="trtb-setting-group">
                  <label className="trtb-setting-label">
                    Cao độ:{" "}
                    <span className="trtb-value-display">
                      {Number(pitch).toFixed(1)}
                    </span>
                  </label>
                  <input
                    className="trtb-range-custom"
                    type="range"
                    min="0.5"
                    max="2"
                    step="0.1"
                    value={pitch}
                    onChange={(e) => setPitch(e.target.value)}
                  />
                </div>

                {/* Volume */}
                <div className="trtb-setting-group">
                  <label className="trtb-setting-label">
                    Âm lượng:{" "}
                    <span className="trtb-value-display">
                      {Number(volume).toFixed(2)}
                    </span>
                  </label>
                  <input
                    className="trtb-range-custom"
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.05"
                    value={volume}
                    onChange={(e) => setVolume(e.target.value)}
                  />
                </div>
              </div>

              {/* Debug voices info */}
              <details className="trtb-debug-section">
                <summary className="trtb-debug-summary">
                  Thông tin giọng đọc ({voices.length} giọng)
                </summary>
                <div className="trtb-debug-content">
                  {voices.map((voice, index) => (
                    <div key={index} className="trtb-voice-item">
                      <strong>{voice.name}</strong> - {voice.lang}
                      {voice.default ? " - [Mặc định]" : ""}
                    </div>
                  ))}
                </div>
              </details>
            </div>

            {/* Modal Footer */}
            <div className="trtb-modal-footer">
              <div className="trtb-footer-actions">
                <button
                  type="button"
                  className="btn trtb-btn trtb-btn-save"
                  onClick={() => {
                    const cfg = {
                      text,
                      rate,
                      pitch,
                      volume,
                      selectedVoice,
                    };
                    try {
                      localStorage.setItem(
                        "textReader.default",
                        JSON.stringify(cfg)
                      );
                      alert("Đã lưu cấu hình vào localStorage.");
                    } catch (e) {
                      console.error(e);
                      alert("Lưu thất bại.");
                    }
                  }}
                >
                  <i className="trtb-icon trtb-icon-save">
                    <SaveIcon />
                  </i>
                  Lưu mặc định
                </button>

                <button
                  type="button"
                  className="btn trtb-btn trtb-btn-reset"
                  onClick={() => {
                    setText(propText || "");
                    setRate(propRate);
                    setPitch(propPitch);
                    setVolume(propVolume);
                    setSelectedVoice("");
                  }}
                >
                  <i className="trtb-icon trtb-icon-reset">
                    <ResetIcon />
                  </i>
                  Reset
                </button>

                <button
                  type="button"
                  className="btn trtb-btn trtb-btn-test"
                  onClick={() => {
                    const sample = propLang.startsWith("vi")
                      ? "Đây là thử giọng tiếng Việt."
                      : "This is an English voice test.";
                    const u = new SpeechSynthesisUtterance(sample);

                    // Chọn giọng nếu có
                    if (selectedVoice) {
                      const foundVoice = voices.find(
                        (v) => v.name === selectedVoice
                      );
                      if (foundVoice) {
                        u.voice = foundVoice;
                        u.lang = foundVoice.lang;
                      } else {
                        u.lang = propLang;
                      }
                    } else {
                      u.lang = propLang;
                    }

                    u.rate = Number(rate) || 1.0;
                    u.pitch = Number(pitch) || 1.0;
                    u.volume = Number(volume) || 1.0;

                    window.speechSynthesis.cancel();
                    window.speechSynthesis.speak(u);
                  }}
                >
                  <i className="trtb-icon trtb-icon-test">
                    <TestIcon />
                  </i>
                  Nghe thử
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

TextReaderTwoButtons.propTypes = {
  text: PropTypes.string,
  lang: PropTypes.string,
  rate: PropTypes.number,
  pitch: PropTypes.number,
  volume: PropTypes.number,
  showSetupDefault: PropTypes.bool,
  height: PropTypes.number,
};

export default TextReaderTwoButtons;
