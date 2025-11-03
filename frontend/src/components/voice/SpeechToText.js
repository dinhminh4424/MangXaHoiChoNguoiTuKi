// // SpeechToText.jsx
// import React, { useEffect, useRef, useState } from "react";

// /**
//  * SpeechToText component
//  * - Dùng Web Speech API nếu có (live từ mic, interim results)
//  * - Nếu không hỗ trợ hoặc user muốn, có thể ghi âm (MediaRecorder) hoặc upload file
//  * - Gửi file blob tới /api/transcribe (bạn cần cài backend xử lý)
//  */

// export default function SpeechToText() {
//   const [supported, setSupported] = useState(false);
//   const [isListening, setIsListening] = useState(false);
//   const [transcript, setTranscript] = useState("");
//   const [interim, setInterim] = useState("");
//   const [status, setStatus] = useState("Chưa sẵn sàng");
//   const [mediaRecorderState, setMediaRecorderState] = useState("idle"); // idle/recording/stopped
//   const [recordedBlob, setRecordedBlob] = useState(null);
//   const [uploading, setUploading] = useState(false);
//   const [lang, setLang] = useState("vi-VN");

//   const recognitionRef = useRef(null);
//   const mediaRecorderRef = useRef(null);
//   const audioChunksRef = useRef([]);

//   // Kiểm tra hỗ trợ Web Speech API
//   useEffect(() => {
//     const SpeechRecognition =
//       window.SpeechRecognition || window.webkitSpeechRecognition;
//     if (SpeechRecognition) {
//       setSupported(true);

//       const recognition = new SpeechRecognition();
//       recognition.lang = lang;
//       recognition.interimResults = true;
//       recognition.continuous = true;

//       recognition.onstart = () => {
//         setStatus("Đang nghe (Web Speech API)...");
//         setIsListening(true);
//       };

//       recognition.onresult = (event) => {
//         let interimTranscript = "";
//         let finalTranscript = transcript; // preserve existing final text

//         for (let i = event.resultIndex; i < event.results.length; ++i) {
//           const res = event.results[i];
//           if (res.isFinal) {
//             finalTranscript += res[0].transcript;
//           } else {
//             interimTranscript += res[0].transcript;
//           }
//         }
//         setTranscript(finalTranscript);
//         setInterim(interimTranscript);
//       };

//       recognition.onerror = (err) => {
//         console.error("recognition.onerror", err);
//         setStatus("Lỗi nhận diện: " + (err.error || JSON.stringify(err)));
//       };

//       recognition.onend = () => {
//         setIsListening(false);
//         setStatus("Dừng nghe");
//       };

//       recognitionRef.current = recognition;
//     } else {
//       setSupported(false);
//       setStatus("Trình duyệt không hỗ trợ Web Speech API");
//     }
//     // eslint-disable-next-line react-hooks/exhaustive-deps
//   }, [lang]); // cập nhật nếu đổi language

//   // Start/Stop Web Speech
//   const handleToggleListen = () => {
//     if (!recognitionRef.current) {
//       setStatus("Web Speech API không khả dụng");
//       return;
//     }
//     if (!isListening) {
//       try {
//         recognitionRef.current.start();
//       } catch (e) {
//         // start có thể ném nếu đã start rồi
//         console.warn(e);
//       }
//     } else {
//       recognitionRef.current.stop();
//     }
//   };

//   // MediaRecorder: start recording
//   const startRecording = async () => {
//     if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
//       setStatus("Trình duyệt không hỗ trợ MediaRecorder / getUserMedia");
//       return;
//     }
//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       const options = {}; // bạn có thể thêm mimeType nếu cần
//       const mediaRecorder = new MediaRecorder(stream, options);
//       mediaRecorderRef.current = mediaRecorder;
//       audioChunksRef.current = [];

//       mediaRecorder.ondataavailable = (e) => {
//         if (e.data && e.data.size > 0) audioChunksRef.current.push(e.data);
//       };

//       mediaRecorder.onstart = () => {
//         setMediaRecorderState("recording");
//         setStatus("Đang ghi âm...");
//       };

//       mediaRecorder.onstop = () => {
//         setMediaRecorderState("stopped");
//         const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
//         setRecordedBlob(blob);
//         setStatus("Ghi âm xong. Sẵn sàng upload.");
//         // stop tracks to free mic
//         stream.getTracks().forEach((t) => t.stop());
//         mediaRecorderRef.current = null;
//       };

//       mediaRecorder.start();
//     } catch (err) {
//       console.error("startRecording error:", err);
//       setStatus("Không thể mở micro: " + err.message);
//     }
//   };

//   const stopRecording = () => {
//     if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
//       mediaRecorderRef.current.stop();
//     } else {
//       setStatus("Không đang ghi âm");
//     }
//   };

//   // Upload recordedBlob or file to /api/transcribe
//   const uploadAudio = async (blobOrFile) => {
//     if (!blobOrFile) {
//       setStatus("Không có file để upload");
//       return;
//     }
//     setUploading(true);
//     setStatus("Đang gửi file lên server...");
//     try {
//       const fd = new FormData();
//       // đặt tên file phù hợp loại
//       const file = blobOrFile instanceof File ? blobOrFile : new File([blobOrFile], "audio.webm", { type: blobOrFile.type || "audio/webm" });
//       fd.append("file", file);

//       // (Optional) send language hint
//       fd.append("language", lang);

//       const res = await fetch("/api/transcribe", {
//         method: "POST",
//         body: fd,
//       });

//       if (!res.ok) {
//         const text = await res.text();
//         throw new Error("Server error: " + text);
//       }

//       const json = await res.json();
//       // Expect server returns { text: "..." }
//       setTranscript((p) => (p ? p + " " + (json.text || "") : (json.text || "")));
//       setInterim("");
//       setStatus("Hoàn thành: nhận văn bản từ server");
//     } catch (err) {
//       console.error("uploadAudio error", err);
//       setStatus("Lỗi upload: " + (err.message || err));
//     } finally {
//       setUploading(false);
//     }
//   };

//   // File input change
//   const onFileChange = (e) => {
//     const f = e.target.files && e.target.files[0];
//     if (f) {
//       setRecordedBlob(f);
//     }
//   };

//   // Helper clear
//   const clearAll = () => {
//     setTranscript("");
//     setInterim("");
//     setRecordedBlob(null);
//     setStatus("Đã xóa");
//   };

//   return (
//     <div style={{ maxWidth: 760, margin: "12px auto", fontFamily: "Arial, sans-serif" }}>
//       <h3>Chuyển âm thanh → văn bản (Speech to Text)</h3>

//       <div style={{ marginBottom: 8 }}>
//         <label>Ngôn ngữ: </label>
//         <select value={lang} onChange={(e) => setLang(e.target.value)}>
//           <option value="vi-VN">Tiếng Việt (vi-VN)</option>
//           <option value="en-US">English (en-US)</option>
//           <option value="auto">Tự động (nếu server hỗ trợ)</option>
//         </select>
//       </div>

//       <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8, marginBottom: 12 }}>
//         <strong>Web Speech API: </strong>
//         <div style={{ marginTop: 8 }}>
//           <button onClick={handleToggleListen} disabled={!supported} style={{ marginRight: 8 }}>
//             {isListening ? "Dừng nghe" : "Bắt đầu nghe"}
//           </button>
//           {!supported && <span style={{ color: "orange" }}>Trình duyệt có thể không hỗ trợ (Firefox/Safari không hỗ trợ).</span>}
//         </div>
//       </div>

//       <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8, marginBottom: 12 }}>
//         <strong>Ghi âm (MediaRecorder) / Upload file:</strong>
//         <div style={{ marginTop: 8 }}>
//           {mediaRecorderState !== "recording" ? (
//             <button onClick={startRecording} style={{ marginRight: 8 }}>
//               Bắt đầu ghi âm
//             </button>
//           ) : (
//             <button onClick={stopRecording} style={{ marginRight: 8 }}>
//               Dừng ghi âm
//             </button>
//           )}

//           <input type="file" accept="audio/*" onChange={onFileChange} style={{ marginLeft: 8 }} />
//           <button
//             onClick={() => uploadAudio(recordedBlob)}
//             disabled={!recordedBlob || uploading}
//             style={{ marginLeft: 8 }}
//           >
//             {uploading ? "Đang gửi..." : "Gửi lên server (transcribe)"}
//           </button>
//           {recordedBlob && (
//             <div style={{ marginTop: 8 }}>
//               <audio controls src={recordedBlob instanceof File ? URL.createObjectURL(recordedBlob) : recordedBlob && URL.createObjectURL(recordedBlob)} />
//               <div>File sẵn sàng: {(recordedBlob.name) || "audio.webm"}</div>
//             </div>
//           )}
//         </div>
//       </div>

//       <div style={{ border: "1px solid #ddd", padding: 12, borderRadius: 8, marginBottom: 12 }}>
//         <strong>Văn bản nhận được:</strong>
//         <div style={{ whiteSpace: "pre-wrap", minHeight: 80, padding: 8, background: "#fafafa", marginTop: 8 }}>
//           <span>{transcript}</span>
//           {interim && <span style={{ opacity: 0.6 }}> {interim}</span>}
//         </div>

//         <div style={{ marginTop: 8 }}>
//           <button onClick={clearAll}>Xóa</button>
//         </div>
//       </div>

//       <div>
//         <small>Trạng thái: {status}</small>
//       </div>

//       <hr />

//       <div style={{ fontSize: 13 }}>
//         <strong>Ghi chú:</strong>
//         <ul>
//           <li>Chrome / Edge / Cốc Cốc (bản mới) hỗ trợ Web Speech API. Firefox & Safari không hỗ trợ.</li>
//           <li>Endpoint <code>/api/transcribe</code> cần được cài ở backend — ví dụ nhận FormData['file'] và gọi API Whisper/Google.</li>
//           <li>Nếu muốn demo nhanh mà không có server: bạn có thể console.log(recordedBlob) và dùng client-side libs (whisper.wasm) để chạy offline.</li>
//         </ul>
//       </div>
//     </div>
//   );
// }

// ////////////////// - ////////////////////////////- //////////////////////////////////// - //////////////////////////////////////////

// // AdvancedSpeechToTextButton.jsx
// // SpeechToTextButton.jsx
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

//       for (let i = event.resultIndex; i < event.results.length; ++i) {
//         const result = event.results[i];
//         if (result.isFinal) {
//           newFinalText += result[0].transcript;
//           setFinalText(newFinalText);
//           // Gọi callback khi có text cuối
//           if (onTextChange) {
//             onTextChange(newFinalText);
//           }
//         } else {
//           newInterimText += result[0].transcript;
//         }
//       }

//       setInterimText(newInterimText);
//     };

//     recognition.onerror = (event) => {
//       console.error("Speech recognition error:", event.error);
//       if (event.error === "not-allowed") {
//         setStatus("Micro bị chặn");
//       } else {
//         setStatus("Lỗi: " + event.error);
//       }
//       setIsListening(false);
//     };

//     recognition.onend = () => {
//       setIsListening(false);
//       setStatus("Đã dừng");
//     };

//     recognitionRef.current = recognition;

//     return () => {
//       if (recognitionRef.current) {
//         recognitionRef.current.stop();
//       }
//     };
//   }, [language, onTextChange]);

//   const startListening = () => {
//     if (!recognitionRef.current) {
//       setStatus("Không hỗ trợ");
//       return;
//     }

//     try {
//       recognitionRef.current.start();
//       setShowSettings(false);
//     } catch (error) {
//       console.error("Error starting recognition:", error);
//       setStatus("Lỗi khi bắt đầu");
//     }
//   };

//   const stopListening = () => {
//     if (recognitionRef.current) {
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
//     setLanguage(e.target.value);
//     setShowSettings(false);
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

//   const onChange = (value) => {
//     setLanguage(value);
//   };

//   const LanguageSelect = [
//     {
//       value: "vi-VN",
//       name: "Tiếng Việt",
//       flag: (
//         <svg
//           xmlns="http://www.w3.org/2000/svg"
//           width="25"
//           height="25"
//           viewBox="0 0 64 64"
//         >
//           <path
//             fill="#ec1c24"
//             d="M64 44c0 6.075-3.373 11-10 11H10C3.373 55 0 50.075 0 44V22c0-6.075 3.373-11 10-11h44c6.627 0 10 4.925 10 11v22"
//           />
//           <path
//             fill="#f9cb38"
//             d="m45.43 28.963l-9.997.015l-3.103-10.114l-3.08 10.114l-10.01-.015l8.106 6.157l-3.14 10.05l8.13-6.241l8.147 6.241l-3.147-10.05z"
//           />
//         </svg>
//       ),
//     },
//     {
//       value: "en-US",
//       name: "Tiếng Anh (US)",
//       flag: (
//         <svg
//           xmlns="http://www.w3.org/2000/svg"
//           width="25"
//           height="25"
//           viewBox="0 0 36 36"
//         >
//           <path
//             fill="#EEE"
//             d="M32 5H4a4 4 0 0 0-4 4v18a4 4 0 0 0 4 4h28a4 4 0 0 0 4-4V9a4 4 0 0 0-4-4z"
//           />
//           <path fill="#CE1124" d="M21 5h-6v10H0v6h15v10h6V21h15v-6H21z" />
//         </svg>
//       ),
//     },
//     {
//       value: "en-GB",
//       name: "Tiếng Anh (UK)",
//       flag: (
//         <svg
//           xmlns="http://www.w3.org/2000/svg"
//           width="25"
//           height="25"
//           viewBox="0 0 36 36"
//         >
//           <path
//             fill="#EEE"
//             d="M32 5H4a4 4 0 0 0-4 4v18a4 4 0 0 0 4 4h28a4 4 0 0 0 4-4V9a4 4 0 0 0-4-4z"
//           />
//           <path fill="#CE1124" d="M21 5h-6v10H0v6h15v10h6V21h15v-6H21z" />
//         </svg>
//       ),
//     },
//     {
//       value: "fr-FR",
//       name: "Français (Pháp - France)",
//       flag: (
//         <svg
//           xmlns="http://www.w3.org/2000/svg"
//           width="25"
//           height="25"
//           viewBox="0 0 36 36"
//         >
//           <path
//             fill="#ED2939"
//             d="M36 27a4 4 0 0 1-4 4h-8V5h8a4 4 0 0 1 4 4v18z"
//           />
//           <path fill="#002495" d="M4 5a4 4 0 0 0-4 4v18a4 4 0 0 0 4 4h8V5H4z" />
//           <path fill="#EEE" d="M12 5h12v26H12z" />
//         </svg>
//       ),
//     },
//     {
//       value: "ja-JP",
//       name: "日本語 (Nhật Bản - Japan)",
//       flag: (
//         <svg
//           xmlns="http://www.w3.org/2000/svg"
//           width="25"
//           height="25"
//           viewBox="0 0 36 36"
//         >
//           <path
//             fill="#EEE"
//             d="M36 27a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4V9a4 4 0 0 1 4-4h28a4 4 0 0 1 4 4v18z"
//           />
//           <circle cx="18" cy="18" r="7" fill="#ED1B2F" />
//         </svg>
//       ),
//     },
//     {
//       value: "ko-KR",
//       name: "한국어 (Hàn Quốc - South Korea)",
//       flag: (
//         <svg
//           width="25"
//           height="25"
//           xmlns="http://www.w3.org/2000/svg"
//           viewBox="0 0 36 36"
//         >
//           <path
//             fill="#EEE"
//             d="M36 27a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4V9a4 4 0 0 1 4-4h28a4 4 0 0 1 4 4v18z"
//           />
//           <path
//             fill="#C60C30"
//             d="M21.441 13.085a6 6 0 0 0-8.356 1.474A3.001 3.001 0 0 0 18 18a3 3 0 0 1 4.915 3.442a6 6 0 0 0-1.474-8.357z"
//           />
//           <path
//             fill="#003478"
//             d="M22.178 17.264A3 3 0 0 0 18 18a3.001 3.001 0 0 1-4.915-3.442a6 6 0 1 0 9.829 6.882a2.997 2.997 0 0 0-.736-4.176z"
//           />
//           <path
//             d="M24.334 25.572l1.928-2.298l.766.643l-1.928 2.298zm2.57-3.063l1.928-2.297l.766.643l-1.928 2.297zm-1.038 4.351l1.928-2.297l.766.643l-1.928 2.297zm2.572-3.066l1.93-2.297l.766.644l-1.93 2.296zm-1.041 4.352l1.93-2.297l.765.643l-1.929 2.297zm2.571-3.065l1.927-2.3l.767.643l-1.927 2.3zm.004-14.162l.766-.643l1.93 2.299l-.767.643zM27.4 7.853l.766-.643l1.928 2.299l-.767.642zm-1.533 1.288l.766-.643l4.5 5.362l-.766.643zm-1.532 1.284l.767-.643l1.927 2.298l-.766.642zm2.57 3.065l.766-.643l1.93 2.297l-.765.643zM6.4 20.854l.766-.643l4.499 5.363l-.767.643zM4.87 22.14l.765-.642l1.929 2.298l-.767.643zm2.567 3.066l.766-.643l1.93 2.297l-.766.643zm-4.101-1.781l.766-.643l4.5 5.362l-.767.643zm-.001-10.852l4.498-5.362l.767.642l-4.5 5.363zm1.532 1.287l4.5-5.363l.766.643l-4.5 5.362zM6.4 15.145l4.5-5.363l.766.643l-4.5 5.363z"
//             fill="#292F33"
//           />
//         </svg>
//       ),
//     },
//     {
//       value: "zh-CN",
//       name: "中文 (简体) (Trung Quốc - China)",
//       flag: (
//         <svg
//           xmlns="http://www.w3.org/2000/svg"
//           width="25"
//           height="25"
//           viewBox="0 0 36 36"
//         >
//           <path
//             fill="#DE2910"
//             d="M36 27a4 4 0 0 1-4 4H4a4 4 0 0 1-4-4V9a4 4 0 0 1 4-4h28a4 4 0 0 1 4 4v18z"
//           />
//           <path
//             fill="#FFDE02"
//             d="m11.136 8.977l.736.356l.589-.566l-.111.81l.72.386l-.804.144l-.144.804l-.386-.72l-.81.111l.566-.589zm4.665 2.941l-.356.735l.566.59l-.809-.112l-.386.721l-.144-.805l-.805-.144l.721-.386l-.112-.809l.59.566zm-.957 3.779l.268.772l.817.017l-.651.493l.237.783l-.671-.467l-.671.467l.236-.783l-.651-.493l.817-.017zm-3.708 3.28l.736.356l.589-.566l-.111.81l.72.386l-.804.144l-.144.804l-.386-.72l-.81.111l.566-.589zM7 10.951l.929 2.671l2.826.058l-2.253 1.708l.819 2.706L7 16.479l-2.321 1.615l.819-2.706l-2.253-1.708l2.826-.058z"
//           />
//         </svg>
//       ),
//     },
//   ];

//   const selected =
//     LanguageSelect.find((l) => l.code === language) || LanguageSelect[0];

//   // Khi đã active, hiển thị đầy đủ controls
//   return (
//     <div className={`card ${className}`}>
//       <div className="card-body">
//         {/* Header với nút đóng */}
//         <div className="d-flex justify-content-between align-items-center mb-3">
//           <h6 className="card-title mb-0">Nhận diện giọng nói</h6>
//           <button
//             type="button"
//             className="btn-close"
//             onClick={handleClose}
//             aria-label="Đóng"
//           ></button>
//         </div>

//         {/* Hiển thị text */}
//         <div className="mb-3">
//           <div
//             className="form-control"
//             style={{
//               minHeight: "80px",
//               background: interimText ? "#f8f9fa" : "white",
//               borderColor: isListening ? "#0d6efd" : "#dee2e6",
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

//           {/* Status */}
//           <div className="mt-1">
//             <small
//               className={`badge ${
//                 isListening
//                   ? "bg-success"
//                   : status.includes("Lỗi")
//                   ? "bg-danger"
//                   : "bg-secondary"
//               }`}
//             >
//               {isListening ? "🔴 Đang thu" : status}
//             </small>
//           </div>
//         </div>

//         {/* Control buttons */}
//         <div className="d-flex gap-2 flex-wrap">
//           {!isListening ? (
//             <button
//               type="button"
//               className={`btn btn-success ${getButtonSizeClass()}`}
//               onClick={startListening}
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

//         {/* Settings panel */}
//         {showSettings && (
//           <div className="mt-3 p-3 border rounded">
//             <h6 className="mb-3">Cài đặt</h6>

//             <div className="mb-3">
//               <label className="form-label">Ngôn ngữ:</label>
//               <select
//                 className="form-select form-select-sm"
//                 value={language}
//                 onChange={handleLanguageChange}
//               >
//                 <option value="vi-VN">Tiếng Việt</option>
//                 <option value="en-US">English (US)</option>
//                 <option value="en-GB">English (UK)</option>
//                 <option value="fr-FR">Français</option>
//                 <option value="ja-JP">日本語</option>
//                 <option value="ko-KR">한국어</option>
//                 <option value="zh-CN">中文 (简体)</option>
//               </select>
//               {/* <div className="dropdown w-100">
//                 <button
//                   className="btn btn-light dropdown-toggle d-flex align-items-center justify-content-between w-100 border"
//                   type="button"
//                   data-bs-toggle="dropdown"
//                   aria-expanded="false"
//                 >
//                   <span className="d-flex align-items-center gap-2">
//                     {selected.flag}
//                     {selected.name}
//                   </span>
//                 </button>
//                 <ul className="dropdown-menu w-100">
//                   {LanguageSelect.map((lang) => (
//                     <li key={lang.code}>
//                       <button
//                         className="dropdown-item d-flex align-items-center gap-2"
//                         onClick={() => onChange(lang.code)}
//                       >
//                         {lang.flag}
//                         {lang.name}
//                       </button>
//                     </li>
//                   ))}
//                 </ul>
//               </div> */}
//             </div>

//             <div className="form-text">
//               <small>
//                 <i className="bi bi-info-circle me-1"></i>
//                 Hỗ trợ tốt nhất trên Chrome/Edge
//               </small>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// =====================================================================================
import React, { useEffect, useRef, useState } from "react";

export default function SpeechToTextButton({
  onTextChange,
  placeholder = "Nhấn nút để bắt đầu nói...",
  className = "",
  buttonSize = "md",
}) {
  const [isActive, setIsActive] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
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

      // Cập nhật state
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
        setStatus("Micro bị chặn. Vui lòng cho phép sử dụng micro.");
      } else if (event.error === "audio-capture") {
        setStatus("Không tìm thấy micro");
      } else if (event.error === "network") {
        setStatus("Lỗi kết nối mạng");
      } else {
        setStatus("Lỗi: " + event.error);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      if (status !== "Micro bị chặn") {
        setStatus("Đã dừng");
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [language]); // Loại bỏ finalText và onTextChange khỏi dependencies

  const startListening = () => {
    if (!recognitionRef.current) {
      setStatus("Không hỗ trợ");
      return;
    }

    try {
      // Reset text khi bắt đầu mới
      setFinalText("");
      setInterimText("");
      recognitionRef.current.start();
      setShowSettings(false);
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

  const handleMainButtonClick = () => {
    setIsActive(true);
  };

  const handleClose = () => {
    setIsActive(false);
    setShowSettings(false);
    stopListening();
  };

  const clearText = () => {
    setFinalText("");
    setInterimText("");
    if (onTextChange) {
      onTextChange("");
    }
  };

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    setShowSettings(false);

    // Thông báo ngôn ngữ đã thay đổi
    setStatus(`Đã chọn: ${e.target.options[e.target.selectedIndex].text}`);

    // Dừng và reset nếu đang nghe
    if (isListening) {
      stopListening();
    }
  };

  const getButtonSizeClass = () => {
    switch (buttonSize) {
      case "sm":
        return "btn-sm";
      case "lg":
        return "btn-lg";
      default:
        return "";
    }
  };

  // Danh sách ngôn ngữ
  const LanguageSelect = [
    {
      value: "vi-VN",
      name: "Tiếng Việt",
      flag: "🇻🇳",
    },
    {
      value: "en-US",
      name: "English (US)",
      flag: "🇺🇸",
    },
    {
      value: "en-GB",
      name: "English (UK)",
      flag: "🇬🇧",
    },
  ];

  // Nếu chưa active, chỉ hiển thị nút chính
  if (!isActive) {
    return (
      <button
        type="button"
        className={`btn btn-primary ${getButtonSizeClass()} ${className}`}
        onClick={handleMainButtonClick}
      >
        <i className="bi bi-mic me-2"></i>
        Nói
      </button>
    );
  }

  return (
    <div className={`card ${className}`}>
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h6 className="card-title mb-0">Nhận diện giọng nói</h6>
          <button
            type="button"
            className="btn-close"
            onClick={handleClose}
            aria-label="Đóng"
          ></button>
        </div>

        <div className="mb-3">
          <div
            className="form-control"
            style={{
              minHeight: "80px",
              background: interimText ? "#f8f9fa" : "white",
              borderColor: isListening ? "#0d6efd" : "#dee2e6",
              whiteSpace: "pre-wrap",
            }}
          >
            {finalText && <div className="mb-1">{finalText}</div>}
            {interimText && (
              <div style={{ color: "#6c757d", fontStyle: "italic" }}>
                {interimText}
              </div>
            )}
            {!finalText && !interimText && (
              <div style={{ color: "#6c757d" }}>{placeholder}</div>
            )}
          </div>

          <div className="mt-1">
            <small
              className={`badge ${
                isListening
                  ? "bg-success"
                  : status.includes("Lỗi") || status.includes("chặn")
                  ? "bg-danger"
                  : "bg-secondary"
              }`}
            >
              {isListening ? "🔴 Đang thu" : status}
            </small>
          </div>
        </div>

        <div className="d-flex gap-2 flex-wrap">
          {!isListening ? (
            <button
              type="button"
              className={`btn btn-success ${getButtonSizeClass()}`}
              onClick={startListening}
              disabled={status.includes("Không hỗ trợ")}
            >
              <i className="bi bi-mic-fill me-2"></i>
              Bắt đầu nói
            </button>
          ) : (
            <button
              type="button"
              className={`btn btn-danger ${getButtonSizeClass()}`}
              onClick={stopListening}
            >
              <i className="bi bi-stop-fill me-2"></i>
              Dừng
            </button>
          )}

          <button
            type="button"
            className={`btn btn-outline-secondary ${getButtonSizeClass()}`}
            onClick={() => setShowSettings(!showSettings)}
          >
            <i className="bi bi-gear me-2"></i>
            Cài đặt
          </button>

          {(finalText || interimText) && (
            <button
              type="button"
              className={`btn btn-outline-secondary ${getButtonSizeClass()}`}
              onClick={clearText}
            >
              <i className="bi bi-trash me-2"></i>
              Xóa
            </button>
          )}
        </div>

        {showSettings && (
          <div className="mt-3 p-3 border rounded">
            <h6 className="mb-3">Cài đặt</h6>

            <div className="mb-3">
              <label className="form-label">Ngôn ngữ:</label>
              <select
                className="form-select"
                value={language}
                onChange={handleLanguageChange}
              >
                <option value="vi-VN">🇻🇳 Tiếng Việt</option>
                <option value="en-US">🇺🇸 English (US)</option>
                <option value="en-GB">🇬🇧 English (UK)</option>
                <option value="fr-FR">🇫🇷 Français</option>
                <option value="ja-JP">🇯🇵 日本語</option>
                <option value="ko-KR">🇰🇷 한국어</option>
                <option value="zh-CN">🇨🇳 中文 (简体)</option>
              </select>
            </div>

            <div className="form-text">
              <small>
                <i className="bi bi-info-circle me-1"></i>
                Hỗ trợ tốt nhất trên Chrome/Edge. Cho phép sử dụng micro khi
                trình duyệt hỏi.
              </small>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
