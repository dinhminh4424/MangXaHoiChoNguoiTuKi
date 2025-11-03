// import React, { useEffect, useRef, useState } from "react";

// /**
//  * TextReaderAdvanced
//  * Props:
//  *  - text: string (bắt buộc) -> nội dung cần đọc
//  *  - lang: default "vi-VN"
//  */
// const TextReaderAdvanced = ({ text, lang = "vi-VN" }) => {
//   const [isReading, setIsReading] = useState(false);
//   const [isPaused, setIsPaused] = useState(false);
//   const [rate, setRate] = useState(0.95); // tốc độ đọc (0.1 - 2)
//   const [pitch, setPitch] = useState(1); // cao độ (0 - 2)
//   const [voices, setVoices] = useState([]);
//   const [selectedVoice, setSelectedVoice] = useState(null);

//   const utteranceRef = useRef(null);

//   // Lấy danh sách voices (browser-dependent)
//   useEffect(() => {
//     const populateVoices = () => {
//       const v = window.speechSynthesis.getVoices();
//       // Lọc ra voice khớp lang trước (nếu có)
//       const filtered = v.length
//         ? v.filter((x) =>
//             lang
//               ? x.lang.startsWith(lang.split("-")[0]) || x.lang === lang
//               : true
//           )
//         : v;
//       setVoices(filtered.length ? filtered : v);
//       if (filtered.length) setSelectedVoice(filtered[0].name);
//     };

//     // Một số trình duyệt load voices bất đồng bộ
//     populateVoices();
//     window.speechSynthesis.onvoiceschanged = populateVoices;

//     return () => {
//       // cleanup handler
//       window.speechSynthesis.onvoiceschanged = null;
//     };
//   }, [lang]);

//   // Cleanup khi component unmount (dừng mọi âm thanh)
//   useEffect(() => {
//     return () => {
//       window.speechSynthesis.cancel();
//     };
//   }, []);

//   // Tạo SpeechSynthesisUtterance và bắt đầu đọc
//   const startReading = () => {
//     if (!text) return;
//     // nếu đang đọc, dừng trước rồi bắt đầu lại
//     window.speechSynthesis.cancel();

//     const speech = new SpeechSynthesisUtterance(text);
//     speech.lang = lang;
//     speech.rate = rate;
//     speech.pitch = pitch;

//     // chọn voice nếu user đã chọn
//     if (selectedVoice) {
//       const found = window.speechSynthesis
//         .getVoices()
//         .find((v) => v.name === selectedVoice || v.voiceURI === selectedVoice);
//       if (found) speech.voice = found;
//     }

//     // sự kiện (tùy trình duyệt hỗ trợ)
//     speech.onstart = () => {
//       setIsReading(true);
//       setIsPaused(false);
//     };
//     speech.onend = () => {
//       setIsReading(false);
//       setIsPaused(false);
//       utteranceRef.current = null;
//     };
//     speech.onerror = (e) => {
//       console.error("SpeechSynthesis error:", e);
//       setIsReading(false);
//       setIsPaused(false);
//       utteranceRef.current = null;
//     };

//     utteranceRef.current = speech;
//     window.speechSynthesis.speak(speech);
//   };

//   const stopReading = () => {
//     window.speechSynthesis.cancel();
//     setIsReading(false);
//     setIsPaused(false);
//     utteranceRef.current = null;
//   };

//   const pauseReading = () => {
//     if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
//       window.speechSynthesis.pause();
//       setIsPaused(true);
//     }
//   };

//   const resumeReading = () => {
//     if (window.speechSynthesis.paused) {
//       window.speechSynthesis.resume();
//       setIsPaused(false);
//     }
//   };

//   // Khi thay đổi rate/pitch => nếu đang đọc, restart để áp dụng
//   useEffect(() => {
//     if (isReading) {
//       // restart reading with new settings
//       const remainingText = text; // Web Speech API không dễ lấy vị trí hiện tại; ta restart toàn bộ
//       stopReading();
//       // cập nhật state đã setRate/setPitch rồi start lại:
//       // small timeout để chắc chắn cancel đã xong
//       setTimeout(() => {
//         // tạo lại utterance ngay với giá trị rate/pitch hiện tại
//         const speech = new SpeechSynthesisUtterance(remainingText);
//         speech.lang = lang;
//         speech.rate = rate;
//         speech.pitch = pitch;
//         if (selectedVoice) {
//           const found = window.speechSynthesis
//             .getVoices()
//             .find(
//               (v) => v.name === selectedVoice || v.voiceURI === selectedVoice
//             );
//           if (found) speech.voice = found;
//         }
//         speech.onstart = () => {
//           setIsReading(true);
//           setIsPaused(false);
//         };
//         speech.onend = () => {
//           setIsReading(false);
//           setIsPaused(false);
//           utteranceRef.current = null;
//         };
//         utteranceRef.current = speech;
//         window.speechSynthesis.speak(speech);
//       }, 120);
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [rate, pitch, selectedVoice]);

//   return (
//     <div
//       className="textreader-card"
//       style={{
//         border: "1px solid #e2e8f0",
//         padding: 12,
//         borderRadius: 8,
//         background: "#fbfdff",
//         maxWidth: 720,
//       }}
//       aria-live="polite"
//     >
//       <div style={{ marginBottom: 8 }}>
//         <p style={{ margin: 0, lineHeight: "1.6", fontSize: 16 }}>{text}</p>
//       </div>

//       {/* Controls */}
//       <div
//         style={{
//           display: "flex",
//           gap: 8,
//           flexWrap: "wrap",
//           alignItems: "center",
//         }}
//       >
//         {/* Start / Pause / Resume / Stop */}
//         <button
//           onClick={() => {
//             if (!isReading) startReading();
//             else if (isPaused) resumeReading();
//             else pauseReading();
//           }}
//           aria-pressed={isReading && !isPaused}
//           style={{
//             padding: "8px 12px",
//             borderRadius: 8,
//             border: "none",
//             background: "#0ea5e9",
//             color: "white",
//             fontWeight: 600,
//             cursor: "pointer",
//           }}
//         >
//           {!isReading ? "🔊 Nghe" : isPaused ? "▶️ Tiếp tục" : "⏸️ Tạm dừng"}
//         </button>

//         <button
//           onClick={stopReading}
//           disabled={!isReading && !isPaused}
//           style={{
//             padding: "8px 12px",
//             borderRadius: 8,
//             border: "1px solid #e2e8f0",
//             background: "#fff",
//             cursor: "pointer",
//           }}
//         >
//           ⏹️ Dừng
//         </button>

//         {/* Voice select */}
//         <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
//           <label htmlFor="voiceSelect" style={{ fontSize: 13 }}>
//             Giọng:
//           </label>
//           <select
//             id="voiceSelect"
//             value={selectedVoice || ""}
//             onChange={(e) => setSelectedVoice(e.target.value)}
//             style={{ padding: 6, borderRadius: 6 }}
//           >
//             <option value="">(Mặc định)</option>
//             {voices.map((v) => (
//               <option key={v.name + v.lang} value={v.name}>
//                 {v.name} — {v.lang}
//               </option>
//             ))}
//           </select>
//         </div>

//         {/* Rate */}
//         <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
//           <label htmlFor="rate" style={{ fontSize: 13 }}>
//             Tốc độ:
//           </label>
//           <input
//             id="rate"
//             type="range"
//             min="0.5"
//             max="1.5"
//             step="0.05"
//             value={rate}
//             onChange={(e) => setRate(Number(e.target.value))}
//           />
//           <span style={{ minWidth: 34, textAlign: "right", fontSize: 13 }}>
//             {rate.toFixed(2)}
//           </span>
//         </div>

//         {/* Pitch */}
//         <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
//           <label htmlFor="pitch" style={{ fontSize: 13 }}>
//             Pitch:
//           </label>
//           <input
//             id="pitch"
//             type="range"
//             min="0.5"
//             max="2"
//             step="0.1"
//             value={pitch}
//             onChange={(e) => setPitch(Number(e.target.value))}
//           />
//           <span style={{ minWidth: 34, textAlign: "right", fontSize: 13 }}>
//             {pitch.toFixed(1)}
//           </span>
//         </div>
//       </div>

//       {/* Status line */}
//       <div style={{ marginTop: 8, fontSize: 13, color: "#475569" }}>
//         {isReading
//           ? isPaused
//             ? "Tạm dừng"
//             : "Đang đọc..."
//           : "Sẵn sàng để đọc"}
//       </div>
//     </div>
//   );
// };

// export default TextReaderAdvanced;

//=============================================================================== *********************************

// import React, { useEffect, useRef, useState } from "react";
// import PropTypes from "prop-types";

// /**
//  * TextReaderTwoButtons
//  *
//  * Props:
//  *  - text (string)          : văn bản sẽ đọc (bắt buộc nên truyền vào)
//  *  - lang (string)          : ngôn ngữ, default "vi-VN"
//  *  - rate (number)          : tốc độ mặc định, default 1.0
//  *  - pitch (number)         : cao độ mặc định, default 1.0
//  *  - volume (number)        : âm lượng mặc định, default 1.0
//  *  - showSetupDefault (bool): nếu true -> panel setup mở mặc định
//  *
//  * Trả về: giao diện 2 nút (50x50) + panel setup để chỉnh text/rate/pitch/volume.
//  *
//  * Thiết kế: dùng Bootstrap classes (btn, form-control...). Bạn đang dùng Bootstrap nên component sẽ hợp.
//  */
// const TextReaderTwoButtons = ({
//   text: propText,
//   lang: propLang = "vi-VN",
//   rate: propRate = 0.25,
//   pitch: propPitch = 1.0,
//   volume: propVolume = 1.0,
//   showSetupDefault = false,
//   height: height = 50,
// }) => {
//   // Local state (có thể khởi từ props)
//   const [isReading, setIsReading] = useState(false);
//   const [isPaused, setIsPaused] = useState(false);
//   const [showSetup, setShowSetup] = useState(showSetupDefault);

//   // editable settings (user có thể sửa trong panel)
//   const [text, setText] = useState(propText || "");
//   const [lang, setLang] = useState(propLang);
//   const [rate, setRate] = useState(propRate);
//   const [pitch, setPitch] = useState(propPitch);
//   const [volume, setVolume] = useState(propVolume);

//   // ref cho utterance hiện tại (dùng để dừng / resume)
//   const utterRef = useRef(null);

//   // Nếu props thay đổi từ parent, cập nhật local state tương ứng
//   useEffect(() => setText(propText || ""), [propText]);
//   useEffect(() => setLang(propLang), [propLang]);
//   useEffect(() => setRate(propRate), [propRate]);
//   useEffect(() => setPitch(propPitch), [propPitch]);
//   useEffect(() => setVolume(propVolume), [propVolume]);

//   // Cleanup khi unmount (dừng speech)
//   useEffect(() => {
//     return () => {
//       window.speechSynthesis.cancel();
//       utterRef.current = null;
//     };
//   }, []);

//   // Hàm đọc / dừng (nút chính)
//   const handleReadToggle = () => {
//     // nếu đang đọc -> dừng (cancel)
//     if (isReading) {
//       window.speechSynthesis.cancel();
//       setIsReading(false);
//       setIsPaused(false);
//       utterRef.current = null;
//       return;
//     }

//     // nếu chưa có text -> không làm
//     if (!text || !text.trim()) {
//       alert("Vui lòng truyền `text` (hoặc nhập nội dung trong Setup).");
//       return;
//     }

//     // tạo utterance mới với thiết lập hiện tại
//     const u = new SpeechSynthesisUtterance(text);
//     u.lang = lang;
//     u.rate = Number(rate) || 1.0;
//     u.pitch = Number(pitch) || 1.0;
//     u.volume = Number(volume) || 1.0;

//     u.onstart = () => {
//       setIsReading(true);
//       setIsPaused(false);
//     };
//     u.onend = () => {
//       setIsReading(false);
//       setIsPaused(false);
//       utterRef.current = null;
//     };
//     u.onerror = (e) => {
//       console.error("Speech error:", e);
//       setIsReading(false);
//       setIsPaused(false);
//       utterRef.current = null;
//     };

//     utterRef.current = u;
//     window.speechSynthesis.speak(u);
//   };

//   // Pause / Resume (nếu muốn dùng bàn phím hoặc gọi từ UI khác)
//   const pause = () => {
//     if (window.speechSynthesis.speaking && !window.speechSynthesis.paused) {
//       window.speechSynthesis.pause();
//       setIsPaused(true);
//     }
//   };
//   const resume = () => {
//     if (window.speechSynthesis.paused) {
//       window.speechSynthesis.resume();
//       setIsPaused(false);
//     }
//   };

//   // Small helper: style cho nút vuông 50px
//   const squareBtnStyle = {
//     width: height || 50,
//     height: height || 50,
//     padding: 0,
//     display: "inline-flex",
//     alignItems: "center",
//     justifyContent: "center",
//     borderRadius: 6,
//     fontSize: 18,
//   };

//   return (
//     <div className="text-reader-two-buttons">
//       {/* Row chứa 2 nút (Bootstrap) */}
//       <div className="d-flex align-items-center gap-2">
//         {/* Nút đọc / dừng */}
//         <button
//           type="button"
//           className={`btn ${isReading ? "btn-danger" : "btn-primary"}`}
//           style={squareBtnStyle}
//           title={isReading ? "Dừng đọc" : "Đọc văn bản"}
//           onClick={handleReadToggle}
//         >
//           {isReading ? (
//             <svg
//               width={height}
//               height={height}
//               xmlns="http://www.w3.org/2000/svg"
//               viewBox="0 0 14 14"
//             >
//               <g fill="none" fill-rule="evenodd" clip-rule="evenodd">
//                 <path
//                   fill="#8fbffa"
//                   d="M2.5 6.763a.75.75 0 1 0-1.5 0a5.25 5.25 0 0 0 5 5.245v1.212a.75.75 0 0 0 1.5 0v-1.213a5.25 5.25 0 0 0 5-5.244a.75.75 0 0 0-1.5 0a3.75 3.75 0 0 1-3.75 3.75h-1a3.75 3.75 0 0 1-3.75-3.75"
//                 />
//                 <path
//                   fill="#8fbffa"
//                   d="M6.75 0a2.946 2.946 0 0 0-2.946 2.946v3.425a2.946 2.946 0 1 0 5.892 0V2.946A2.946 2.946 0 0 0 6.75 0"
//                 />
//                 <path
//                   fill="#2859c5"
//                   d="M.22.22a.75.75 0 0 0 0 1.06l12.5 12.5a.75.75 0 1 0 1.06-1.06L1.28.22a.75.75 0 0 0-1.06 0"
//                 />
//               </g>
//             </svg>
//           ) : (
//             <svg
//               width={height}
//               height={height}
//               xmlns="http://www.w3.org/2000/svg"
//               viewBox="0 0 14 14"
//             >
//               <g fill="none" fill-rule="evenodd" clip-rule="evenodd">
//                 <path
//                   fill="#8fbffa"
//                   d="M7.204.794a.75.75 0 0 0-1.5 0V9.25a.75.75 0 1 0 1.5 0zm2.07 1.13a.75.75 0 0 1 .75.75v5.42a.75.75 0 0 1-1.5 0v-5.42a.75.75 0 0 1 .75-.75m-5.64 1.882a.75.75 0 0 1 .75.75v3.76a.75.75 0 0 1-1.5 0v-3.76a.75.75 0 0 1 .75-.75m-2.821.94a.75.75 0 0 1 .75.75v1.88a.75.75 0 0 1-1.5 0v-1.88a.75.75 0 0 1 .75-.75m12.032-.19a.75.75 0 0 0-1.5 0v1.163a.75.75 0 1 0 1.5 0z"
//                 />
//                 <path
//                   fill="#2859c5"
//                   d="M13.754 9.19a.75.75 0 1 0-1.008-1.111c-.773.702-1.361 1.338-1.859 2.115c-.32.5-.595 1.046-.859 1.685l-.855-.882a.75.75 0 0 0-1.077 1.044l1.679 1.731a.75.75 0 0 0 1.246-.276c.386-1.108.725-1.862 1.13-2.493c.4-.627.887-1.163 1.603-1.813"
//                 />
//               </g>
//             </svg>
//           )}
//         </button>

//         {/* Nút setup: mở panel để chỉnh */}
//         <button
//           type="button"
//           className="btn "
//           style={squareBtnStyle}
//           title="Mở cài đặt đọc"
//           onClick={() => setShowSetup((s) => !s)}
//         >
//           <svg
//             xmlns="http://www.w3.org/2000/svg"
//             width={height}
//             height={height}
//             viewBox="0 0 48 48"
//           >
//             <g fill="none" stroke-linejoin="round" stroke-width="4">
//               <path
//                 fill="#2F88FF"
//                 stroke="#000"
//                 d="M36.686 15.171C37.9364 16.9643 38.8163 19.0352 39.2147 21.2727H44V26.7273H39.2147C38.8163 28.9648 37.9364 31.0357 36.686 32.829L40.0706 36.2137L36.2137 40.0706L32.829 36.686C31.0357 37.9364 28.9648 38.8163 26.7273 39.2147V44H21.2727V39.2147C19.0352 38.8163 16.9643 37.9364 15.171 36.686L11.7863 40.0706L7.92939 36.2137L11.314 32.829C10.0636 31.0357 9.18372 28.9648 8.78533 26.7273H4V21.2727H8.78533C9.18372 19.0352 10.0636 16.9643 11.314 15.171L7.92939 11.7863L11.7863 7.92939L15.171 11.314C16.9643 10.0636 19.0352 9.18372 21.2727 8.78533V4H26.7273V8.78533C28.9648 9.18372 31.0357 10.0636 32.829 11.314L36.2137 7.92939L40.0706 11.7863L36.686 15.171Z"
//               />
//               <path
//                 fill="#43CCF8"
//                 stroke="#fff"
//                 d="M24 29C26.7614 29 29 26.7614 29 24C29 21.2386 26.7614 19 24 19C21.2386 19 19 21.2386 19 24C19 26.7614 21.2386 29 24 29Z"
//               />
//             </g>
//           </svg>
//         </button>

//         {/* (Tùy) Hiển thị trạng thái nhỏ */}
//         <div style={{ marginLeft: 8 }}>
//           <small className="text-muted">
//             {isReading ? (isPaused ? "Tạm dừng" : "Đang đọc...") : ""}
//           </small>
//         </div>
//       </div>

//       {/* Panel setup (hiện/ẩn) */}
//       {showSetup && (
//         <div className="card mt-2" style={{ minWidth: 720 }}>
//           <div className="card-body">
//             <h6 className="card-title">Cài đặt đọc (Setup)</h6>

//             {/* Text input (textarea) */}
//             <div className="mb-2">
//               <label className="form-label small">Nội dung (text)</label>
//               <textarea
//                 className="form-control"
//                 rows={3}
//                 value={text}
//                 onChange={(e) => setText(e.target.value)}
//                 placeholder="Nhập văn bản sẽ đọc..."
//               />
//             </div>

//             <div className="row g-2">
//               {/* Lang */}
//               <div className="col-6 col-md-3">
//                 <label className="form-label small">Ngôn ngữ (lang)</label>
//                 {/* <input
//                   className="form-control form-control-sm"
//                   value={lang}
//                   onChange={(e) => setLang(e.target.value)}
//                 /> */}

//                 <select
//                   class="form-select"
//                   id="autoSizingSelect"
//                   onChange={(e) => setLang(e.target.value)}
//                 >
//                   <option value="vi-VN">🇻🇳 Tiếng Việt</option>
//                   <option value="en-US">🇺🇸 Tiếng Anh</option>
//                   <option value="ja-JP">🇯🇵 Tiếng Nhật</option>
//                   <option value="fr-FR">🇫🇷 Tiếng Pháp</option>
//                   <option value="zh-CN">🇨🇳 Tiếng Trung</option>
//                   <option value="ko-KR">🇰🇷 Tiếng Hàn</option>
//                   <option value="es-ES">🇪🇸 Tiếng Tây Ban Nha</option>
//                 </select>

//                 <div className="form-text small">vd: vi-VN</div>
//               </div>

//               {/* Rate */}
//               <div className="col-6 col-md-3">
//                 <label className="form-label small">Tốc độ (rate)</label>
//                 <input
//                   className="form-range"
//                   type="range"
//                   min="0.5"
//                   max="1.5"
//                   step="0.05"
//                   value={rate}
//                   onChange={(e) => setRate(e.target.value)}
//                 />
//                 <div className="text-end small">{Number(rate).toFixed(2)}</div>
//               </div>

//               {/* Pitch */}
//               <div className="col-6 col-md-3">
//                 <label className="form-label small">Cao độ (pitch)</label>
//                 <input
//                   className="form-range"
//                   type="range"
//                   min="0.5"
//                   max="2"
//                   step="0.1"
//                   value={pitch}
//                   onChange={(e) => setPitch(e.target.value)}
//                 />
//                 <div className="text-end small">{Number(pitch).toFixed(1)}</div>
//               </div>

//               {/* Volume */}
//               <div className="col-6 col-md-3">
//                 <label className="form-label small">Âm lượng</label>
//                 <input
//                   className="form-range"
//                   type="range"
//                   min="0.1"
//                   max="1"
//                   step="0.05"
//                   value={volume}
//                   onChange={(e) => setVolume(e.target.value)}
//                 />
//                 <div className="text-end small">
//                   {Number(volume).toFixed(2)}
//                 </div>
//               </div>
//             </div>

//             {/* Buttons: Save as default (copies to clipboard or localStorage optional) */}
//             <div className="mt-3 d-flex gap-2">
//               <button
//                 type="button"
//                 className="btn btn-outline-primary btn-sm"
//                 onClick={() => {
//                   // Lưu tạm vào localStorage để lần sau mở lại mặc định
//                   const cfg = { text, lang, rate, pitch, volume };
//                   try {
//                     localStorage.setItem(
//                       "textReader.default",
//                       JSON.stringify(cfg)
//                     );
//                     alert("Đã lưu cấu hình vào localStorage.");
//                   } catch (e) {
//                     console.error(e);
//                     alert("Lưu thất bại (kiểm tra permission).");
//                   }
//                 }}
//               >
//                 💾 Lưu mặc định (localStorage)
//               </button>

//               <button
//                 type="button"
//                 className="btn btn-outline-secondary btn-sm"
//                 onClick={() => {
//                   // Khôi phục từ props ban đầu
//                   setText(propText || "");
//                   setLang(propLang);
//                   setRate(propRate);
//                   setPitch(propPitch);
//                   setVolume(propVolume);
//                 }}
//               >
//                 ↺ Reset về mặc định
//               </button>

//               <div className="ms-auto">
//                 <button
//                   type="button"
//                   className="btn btn-primary btn-sm"
//                   onClick={() => {
//                     // test nhanh: đọc 1 câu ngắn dùng cài đặt hiện tại
//                     const sample = "Đây là thử giọng.";
//                     const u = new SpeechSynthesisUtterance(sample);
//                     u.lang = lang;
//                     u.rate = Number(rate) || 1.0;
//                     u.pitch = Number(pitch) || 1.0;
//                     u.volume = Number(volume) || 1.0;
//                     window.speechSynthesis.cancel();
//                     window.speechSynthesis.speak(u);
//                   }}
//                 >
//                   🔈 Nghe thử
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// };

// TextReaderTwoButtons.propTypes = {
//   text: PropTypes.string,
//   lang: PropTypes.string,
//   rate: PropTypes.number,
//   pitch: PropTypes.number,
//   volume: PropTypes.number,
//   showSetupDefault: PropTypes.bool,
// };

// export default TextReaderTwoButtons;

import React, { useEffect, useRef, useState } from "react";
import PropTypes from "prop-types";

const TextReaderTwoButtons = ({
  text: propText,
  lang: propLang = "vi-VN",
  rate: propRate = 0.95,
  pitch: propPitch = 1.0,
  volume: propVolume = 1.0,
  showSetupDefault = false,
  height = 50,
}) => {
  // Local state
  const [isReading, setIsReading] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showSetup, setShowSetup] = useState(showSetupDefault);
  const [voices, setVoices] = useState([]);
  const [filteredVoices, setFilteredVoices] = useState([]);
  const [selectedVoice, setSelectedVoice] = useState("");

  // editable settings
  const [text, setText] = useState(propText || "");
  const [rate, setRate] = useState(propRate);
  const [pitch, setPitch] = useState(propPitch);
  const [volume, setVolume] = useState(propVolume);

  const utterRef = useRef(null);

  // Lấy danh sách giọng đọc
  useEffect(() => {
    const populateVoices = () => {
      const allVoices = window.speechSynthesis.getVoices() || [];
      setVoices(allVoices);

      console.log(allVoices);

      // Sắp xếp và lọc giọng đọc: ưu tiên tiếng Việt, rồi tiếng Anh
      const sortedVoices = [...allVoices].sort((a, b) => {
        const aLang = a.lang || "";
        const bLang = b.lang || "";

        // Ưu tiên tiếng Việt lên đầu
        if (aLang.startsWith("vi") && !bLang.startsWith("vi")) return -1;
        if (!aLang.startsWith("vi") && bLang.startsWith("vi")) return 1;

        // Sau đó ưu tiên tiếng Anh
        if (aLang.startsWith("en") && !bLang.startsWith("en")) return -1;
        if (!aLang.startsWith("en") && bLang.startsWith("en")) return 1;

        // Còn lại sắp xếp theo tên
        return a.name.localeCompare(b.name);
      });

      setFilteredVoices(sortedVoices);

      // Tự động chọn giọng phù hợp với ngôn ngữ hiện tại
      if (sortedVoices.length > 0 && !selectedVoice) {
        const defaultVoice =
          sortedVoices.find((voice) =>
            voice.lang.startsWith(propLang.split("-")[0])
          ) || sortedVoices[0];
        setSelectedVoice(defaultVoice.name);
      }
    };

    populateVoices();
    window.speechSynthesis.onvoiceschanged = populateVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, [propLang, selectedVoice]);

  // Nếu props thay đổi từ parent, cập nhật local state tương ứng
  useEffect(() => setText(propText || ""), [propText]);
  useEffect(() => setRate(propRate), [propRate]);
  useEffect(() => setPitch(propPitch), [propPitch]);
  useEffect(() => setVolume(propVolume), [propVolume]);

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
        u.lang = foundVoice.lang; // Sử dụng ngôn ngữ của giọng đã chọn
      } else {
        u.lang = propLang; // Fallback về propLang nếu không tìm thấy giọng
      }
    } else {
      u.lang = propLang; // Sử dụng propLang nếu không chọn giọng cụ thể
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
    // Lấy phần trước dấu - trong language code (vi, en, ja, etc.)
    // const langPrefix = langCode.split("-")[0];
    // return `(${langPrefix.toUpperCase()}) ${voice.name}`;

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
    <div className="text-reader-two-buttons">
      {/* Row chứa 2 nút */}
      <div className="d-flex align-items-center gap-2">
        {/* Nút đọc / dừng */}
        <button
          type="button"
          className={`btn ${isReading ? "btn-danger" : "btn-primary"}`}
          style={squareBtnStyle}
          title={isReading ? "Dừng đọc" : "Đọc văn bản"}
          onClick={handleReadToggle}
        >
          {isReading ? "⏹️" : "🔊"}
        </button>

        {/* Nút setup */}
        <button
          type="button"
          className="btn btn-outline-secondary"
          style={squareBtnStyle}
          title="Mở cài đặt đọc"
          onClick={() => setShowSetup((s) => !s)}
        >
          ⚙️
        </button>

        {/* Hiển thị trạng thái */}
        <div style={{ marginLeft: 8 }}>
          <small className="text-muted">
            {isReading
              ? isPaused
                ? "⏸️ Tạm dừng"
                : "🔊 Đang đọc..."
              : "✅ Sẵn sàng"}
          </small>
        </div>
      </div>

      {/* Panel setup */}
      {showSetup && (
        <div className="card mt-2" style={{ minWidth: 720 }}>
          <div className="card-body">
            <h6 className="card-title">Cài đặt đọc</h6>

            {/* Text input */}
            <div className="mb-2">
              <label className="form-label small">Nội dung (text)</label>
              <textarea
                className="form-control"
                rows={3}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Nhập văn bản sẽ đọc..."
              />
            </div>

            <div className="row g-2">
              {/* Voice selection */}
              <div className="col-12 col-md-6">
                <label className="form-label small">Giọng đọc</label>
                <select
                  className="form-select"
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
                <div className="form-text small">
                  {filteredVoices.length} giọng có sẵn
                </div>
              </div>

              {/* Rate */}
              <div className="col-6 col-md-2">
                <label className="form-label small">
                  Tốc độ: {Number(rate).toFixed(2)}
                </label>
                <input
                  className="form-range"
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.05"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                />
              </div>

              {/* Pitch */}
              <div className="col-6 col-md-2">
                <label className="form-label small">
                  Cao độ: {Number(pitch).toFixed(1)}
                </label>
                <input
                  className="form-range"
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={pitch}
                  onChange={(e) => setPitch(e.target.value)}
                />
              </div>

              {/* Volume */}
              <div className="col-6 col-md-2">
                <label className="form-label small">
                  Âm lượng: {Number(volume).toFixed(2)}
                </label>
                <input
                  className="form-range"
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
            <details className="mt-3 me-2">
              <summary className="small">
                Thông tin giọng đọc ({voices.length} giọng)
              </summary>
              <div
                style={{ maxHeight: 150, overflowY: "auto", fontSize: "12px" }}
              >
                {voices.map((voice, index) => (
                  <div key={index} className="border-bottom py-1 me-3">
                    <strong>{voice.name}</strong> - {voice.lang}
                    {voice.default ? " - [Mặc định]" : ""}
                  </div>
                ))}
              </div>
            </details>

            {/* Action buttons */}
            <div className="mt-3 d-flex gap-2">
              <button
                type="button"
                className="btn btn-outline-primary btn-sm"
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
                💾 Lưu mặc định
              </button>

              <button
                type="button"
                className="btn btn-outline-secondary btn-sm"
                onClick={() => {
                  setText(propText || "");
                  setRate(propRate);
                  setPitch(propPitch);
                  setVolume(propVolume);
                  setSelectedVoice("");
                }}
              >
                ↺ Reset về mặc định
              </button>

              <div className="ms-auto">
                <button
                  type="button"
                  className="btn btn-primary btn-sm"
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
                  🔈 Nghe thử
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
