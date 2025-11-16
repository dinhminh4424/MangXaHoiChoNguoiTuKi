// import React, { useRef, useState, useEffect } from "react";
// import api from "../../services/api";
// import * as faceapi from "face-api.js";

// const FaceLogin = () => {
//   // 📹 Tham chiếu tới thẻ <video> để hiển thị camera
//   const videoRef = useRef(null);

//   // 🔤 Các trạng thái hiển thị cho người dùng
//   const [status, setStatus] = useState("Bật camera để đăng nhập");

//   // 👥 Danh sách user có dữ liệu khuôn mặt từ backend
//   const [users, setUsers] = useState([]);

//   // 🧠 Trạng thái models của face-api.js đã load xong chưa
//   const [modelsLoaded, setModelsLoaded] = useState(false);

//   // 🎯 Ngưỡng so khớp descriptor (độ tương đồng giữa 2 khuôn mặt)
//   // Càng NHỎ thì yêu cầu càng khắt khe (ít sai, nhưng có thể khó khớp)
//   const FACE_MATCH_THRESHOLD = 0.55;

//   // ==========================
//   // 1️⃣ Load models của face-api.js
//   // ==========================
//   useEffect(() => {
//     const loadModels = async () => {
//       try {
//         // Load 3 models cần thiết để phát hiện và nhận dạng khuôn mặt
//         await Promise.all([
//           faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
//           faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
//           faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
//         ]);
//         setModelsLoaded(true);
//         setStatus("Models đã sẵn sàng");
//       } catch (error) {
//         console.error("Lỗi load models:", error);
//         setStatus("Lỗi khi tải models nhận diện khuôn mặt");
//       }
//     };

//     loadModels();
//   }, []);

//   // ==========================
//   // 2️⃣ Tải danh sách user có descriptor từ server
//   // ==========================
//   useEffect(() => {
//     if (modelsLoaded) {
//       api
//         .get("/api/auth/face-users")
//         .then((res) => {
//           console.log("Users loaded:", res.data);
//           setUsers(res.data);
//         })
//         .catch((err) => {
//           console.error("Lỗi tải users:", err);
//           setStatus("Không thể tải danh sách người dùng");
//         });
//     }
//   }, [modelsLoaded]);

//   // ==========================
//   // 3️⃣ Hàm khởi động camera và bắt đầu quét khuôn mặt
//   // ==========================
//   const start = async () => {
//     if (!modelsLoaded) {
//       setStatus("Models chưa sẵn sàng");
//       return;
//     }

//     try {
//       // 🎥 Yêu cầu quyền truy cập camera
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: { width: 640, height: 480 },
//       });

//       // Gắn luồng camera vào thẻ <video>
//       videoRef.current.srcObject = stream;
//       setStatus("Đang quét khuôn mặt...");

//       // Chờ một chút để camera sẵn sàng, rồi bắt đầu dò khuôn mặt
//       setTimeout(() => {
//         detectFace();
//       }, 500);
//     } catch (error) {
//       console.error("Lỗi truy cập camera:", error);
//       setStatus("Không thể truy cập camera");
//     }
//   };

//   // ==========================
//   // 4️⃣ Hàm nhận diện khuôn mặt từ video
//   // ==========================
//   const detectFace = async () => {
//     const video = videoRef.current;
//     let attempts = 0; // Đếm số lần thử dò khuôn mặt

//     const check = async () => {
//       if (attempts++ > 50) {
//         // Sau 50 lần (~25 giây) không phát hiện khuôn mặt thì dừng
//         setStatus("Không phát hiện khuôn mặt");
//         return;
//       }

//       try {
//         // 🔍 Dò một khuôn mặt duy nhất trong khung hình
//         const detection = await faceapi
//           .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
//           .withFaceLandmarks()
//           .withFaceDescriptor();

//         if (detection) {
//           console.log(
//             "Đã phát hiện khuôn mặt, confidence:",
//             detection.detection.score
//           );

//           // Lấy vector mô tả khuôn mặt (128 giá trị float)
//           const desc = Array.from(detection.descriptor);

//           // Tìm người dùng khớp nhất trong danh sách
//           const match = findMatch(desc);

//           console.log("match.distance:", match?.distance);

//           // Nếu tìm được user khớp và độ sai biệt nhỏ hơn ngưỡng cho phép
//           if (match && match.distance < FACE_MATCH_THRESHOLD) {
//             setStatus(`✅ Đã nhận diện: ${match.user.username}`);
//             await login(match.user._id);
//             return;
//           } else {
//             // Nếu không khớp đủ ngưỡng hoặc không có user nào
//             setStatus(
//               match
//                 ? `❌ Không khớp (${match.distance.toFixed(3)})`
//                 : "Không tìm thấy người dùng phù hợp"
//             );
//           }
//         } else {
//           setStatus("Đang tìm khuôn mặt...");
//         }

//         // Tiếp tục kiểm tra lại sau 0.5 giây (vòng lặp quét)
//         setTimeout(check, 500);
//       } catch (error) {
//         console.error("Lỗi detect:", error);
//         setStatus("Lỗi khi nhận diện khuôn mặt");
//       }
//     };

//     check();
//   };

//   // ==========================
//   // 5️⃣ Hàm tìm user khớp nhất dựa trên descriptor
//   // ==========================
//   const findMatch = (queryDescriptor) => {
//     if (users.length === 0) {
//       console.log("Không có users nào trong database");
//       return null;
//     }

//     let bestMatch = null;
//     let minDistance = Infinity;

//     users.forEach((user) => {
//       try {
//         // Lấy descriptor từ user.profile.faceDescriptor
//         const storedDescriptor = user.profile?.faceDescriptor;

//         if (!storedDescriptor || !Array.isArray(storedDescriptor)) {
//           console.log(`User ${user.username} không có face descriptor`);
//           return;
//         }

//         if (storedDescriptor.length !== 128) {
//           console.log(`User ${user.username} descriptor không đúng độ dài`);
//           return;
//         }

//         // Tạo mảng Float32Array để tính toán
//         const storedFloat32 = new Float32Array(storedDescriptor);
//         const queryFloat32 = new Float32Array(queryDescriptor);

//         // 🔢 Tính khoảng cách Euclidean giữa hai vector khuôn mặt
//         const distance = faceapi.euclideanDistance(queryFloat32, storedFloat32);

//         console.log(`So sánh với ${user.username}: distance = ${distance}`);

//         // Nếu khoảng cách nhỏ hơn min hiện tại thì cập nhật user này là gần nhất
//         if (distance < minDistance) {
//           minDistance = distance;
//           bestMatch = { user, distance };
//         }
//       } catch (error) {
//         console.error("Lỗi so sánh với user:", user.username, error);
//       }
//     });

//     console.log(
//       "Best match:",
//       bestMatch
//         ? `${bestMatch.user.username} (${minDistance.toFixed(3)})`
//         : "Không có user nào phù hợp"
//     );
//     return bestMatch;
//   };

//   // ==========================
//   // 6️⃣ Gửi request đăng nhập khi nhận diện thành công
//   // ==========================
//   const login = async (userId) => {
//     try {
//       setStatus("Đang đăng nhập...");
//       const res = await api.post("/api/auth/face-login", { userId });

//       if (res.data.success) {
//         // Lưu token vào localStorage để dùng cho các request sau
//         localStorage.setItem("token", res.data.token);
//         setStatus("🎉 Đăng nhập thành công!");

//         // Chuyển hướng sang trang hồ sơ
//         setTimeout(() => {
//           window.location.href = "/profile";
//         }, 1000);
//       } else {
//         setStatus("Đăng nhập thất bại");
//       }
//     } catch (error) {
//       console.error("Lỗi login:", error);
//       setStatus(
//         "Lỗi đăng nhập: " + (error.response?.data?.message || error.message)
//       );
//     }
//   };

//   // ==========================
//   // 7️⃣ Dừng camera
//   // ==========================
//   const stopCamera = () => {
//     if (videoRef.current?.srcObject) {
//       videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
//       setStatus("Camera đã tắt");
//     }
//   };

//   // ==========================
//   // 8️⃣ Cleanup khi rời component
//   // ==========================
//   useEffect(() => {
//     return () => stopCamera();
//   }, []);

//   // ==========================
//   // 9️⃣ JSX: Giao diện hiển thị
//   // ==========================
//   return (
//     <div className="container py-5">
//       <div className="row justify-content-center">
//         <div className="col-md-6">
//           <div className="card shadow-lg">
//             <div className="card-body text-center p-5">
//               <h2>Đăng nhập bằng khuôn mặt</h2>

//               <video
//                 ref={videoRef}
//                 autoPlay
//                 muted
//                 playsInline
//                 className="w-100 rounded mb-3"
//                 style={{ maxHeight: "400px", backgroundColor: "#f8f9fa" }}
//               ></video>

//               <p className="text-muted mb-3">{status}</p>

//               <div className="d-flex gap-2 justify-content-center">
//                 <button
//                   onClick={start}
//                   className="btn btn-primary btn-lg"
//                   disabled={!modelsLoaded}
//                 >
//                   {modelsLoaded ? "Bật Camera" : "Đang tải models..."}
//                 </button>

//                 <button
//                   onClick={stopCamera}
//                   className="btn btn-outline-secondary btn-lg"
//                 >
//                   Tắt Camera
//                 </button>
//               </div>

//               {users.length > 0 && (
//                 <div className="mt-3">
//                   <small className="text-muted">
//                     Có {users.length} người dùng đã đăng ký khuôn mặt
//                   </small>
//                 </div>
//               )}
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default FaceLogin;

// ===============================================================================

// import React, { useRef, useState, useEffect } from "react";
// import api from "../../services/api";
// import * as faceapi from "face-api.js";

// const FaceLogin = () => {
//   const videoRef = useRef(null);
//   const [status, setStatus] = useState("Bật camera để bắt đầu đăng nhập");
//   const [users, setUsers] = useState([]);
//   const [modelsLoaded, setModelsLoaded] = useState(false);
//   const [isScanning, setIsScanning] = useState(false);
//   const [matchInfo, setMatchInfo] = useState(null);

//   // Load face-api.js models
//   useEffect(() => {
//     const loadModels = async () => {
//       try {
//         setStatus("Đang tải AI nhận diện khuôn mặt...");
//         await Promise.all([
//           faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
//           faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
//           faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
//         ]);
//         setModelsLoaded(true);
//         setStatus("Hệ thống đã sẵn sàng");
//       } catch (error) {
//         console.error("Lỗi load models:", error);
//         setStatus("❌ Lỗi tải hệ thống nhận diện");
//       }
//     };
//     loadModels();
//   }, []);

//   // Load users
//   useEffect(() => {
//     if (modelsLoaded) {
//       api.get("/api/auth/face-users").then((res) => {
//         console.log("Users loaded:", res.data);
//         setUsers(res.data);
//       });
//     }
//   }, [modelsLoaded]);

//   const start = async () => {
//     if (!modelsLoaded) {
//       setStatus("Hệ thống chưa sẵn sàng");
//       return;
//     }

//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: { width: 640, height: 480 },
//       });
//       videoRef.current.srcObject = stream;
//       setIsScanning(true);
//       setStatus("🔍 Đang quét khuôn mặt...");
//       setMatchInfo(null);

//       // Đợi video bắt đầu
//       setTimeout(() => {
//         detectFace();
//       }, 500);
//     } catch (error) {
//       console.error("Lỗi camera:", error);
//       setStatus("❌ Lỗi truy cập camera. Vui lòng cho phép quyền camera.");
//     }
//   };

//   const detectFace = async () => {
//     const video = videoRef.current;
//     let attempts = 0;

//     const check = async () => {
//       if (attempts++ > 100) {
//         setStatus("⏰ Không phát hiện khuôn mặt. Vui lòng thử lại.");
//         setIsScanning(false);
//         return;
//       }

//       try {
//         const detection = await faceapi
//           .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
//           .withFaceLandmarks()
//           .withFaceDescriptor();

//         if (detection) {
//           const confidence = (detection.detection.score * 100).toFixed(1);
//           console.log(`Đã phát hiện khuôn mặt, độ tin cậy: ${confidence}%`);

//           setStatus(`✅ Đã phát hiện khuôn mặt (${confidence}%)`);

//           const desc = Array.from(detection.descriptor);
//           const match = findMatch(desc);

//           if (match) {
//             setMatchInfo({
//               username: match.user.username,
//               distance: match.distance,
//               confidence: confidence,
//             });

//             if (match.distance < 0.55) {
//               setStatus(`🎉 Đã nhận diện: ${match.user.username}`);
//               await login(match.user._id);
//               return;
//             } else {
//               setStatus(
//                 `⚠️ Độ tương đồng thấp: ${(match.distance * 100).toFixed(1)}%`
//               );
//             }
//           } else {
//             setStatus("❌ Không tìm thấy người dùng phù hợp");
//           }
//         } else {
//           setStatus("🔍 Đang tìm khuôn mặt...");
//         }

//         setTimeout(check, 300);
//       } catch (error) {
//         console.error("Lỗi detect:", error);
//         setStatus("❌ Lỗi nhận diện khuôn mặt");
//         setIsScanning(false);
//       }
//     };

//     check();
//   };

//   const findMatch = (queryDescriptor) => {
//     if (users.length === 0) {
//       console.log("Không có users nào trong database");
//       return null;
//     }

//     let bestMatch = null;
//     let minDistance = Infinity;

//     users.forEach((user) => {
//       try {
//         const storedDescriptor = user.profile?.faceDescriptor;

//         if (!storedDescriptor || !Array.isArray(storedDescriptor)) {
//           return;
//         }

//         if (storedDescriptor.length !== 128) {
//           return;
//         }

//         const storedFloat32 = new Float32Array(storedDescriptor);
//         const queryFloat32 = new Float32Array(queryDescriptor);

//         const distance = faceapi.euclideanDistance(queryFloat32, storedFloat32);

//         if (distance < minDistance) {
//           minDistance = distance;
//           bestMatch = { user, distance };
//         }
//       } catch (error) {
//         console.error("Lỗi so sánh với user:", user.username, error);
//       }
//     });

//     return bestMatch;
//   };

//   const login = async (userId) => {
//     try {
//       setStatus("🔐 Đang đăng nhập...");
//       const res = await api.post("/api/auth/face-login", { userId });

//       if (res.data.success) {
//         localStorage.setItem("token", res.data.token);
//         setStatus("🎉 Đăng nhập thành công!");
//         setIsScanning(false);

//         setTimeout(() => {
//           window.location.href = "/profile";
//         }, 1500);
//       } else {
//         setStatus("❌ Đăng nhập thất bại");
//         setIsScanning(false);
//       }
//     } catch (error) {
//       console.error("Lỗi login:", error);
//       setStatus("❌ Lỗi đăng nhập");
//       setIsScanning(false);
//     }
//   };

//   const stopCamera = () => {
//     if (videoRef.current?.srcObject) {
//       videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
//       setStatus("📷 Camera đã tắt");
//       setIsScanning(false);
//       setMatchInfo(null);
//     }
//   };

//   // Cleanup
//   useEffect(() => {
//     return () => stopCamera();
//   }, []);

//   const getStatusColor = () => {
//     if (status.includes("❌")) return "text-danger";
//     if (status.includes("✅") || status.includes("🎉")) return "text-success";
//     if (status.includes("⚠️")) return "text-warning";
//     if (status.includes("🔍") || status.includes("🔐")) return "text-info";
//     return "text-muted";
//   };

//   return (
//     <div className="container py-4">
//       <div className="row justify-content-center">
//         <div className="col-md-8 col-lg-6">
//           <div className="card border-0 shadow-lg">
//             <div className="card-header bg-gradient-primary text-white text-center py-4">
//               <div className="d-flex align-items-center justify-content-center mb-2">
//                 <i className="fas fa-face-recognition fa-2x me-3"></i>
//                 <div>
//                   <h2 className="h3 mb-0">Đăng Nhập Bằng Khuôn Mặt</h2>
//                   <p className="mb-0 opacity-75">
//                     Nhanh chóng - Bảo mật - Tiện lợi
//                   </p>
//                 </div>
//               </div>
//             </div>

//             <div className="card-body p-4">
//               {/* Video Preview */}
//               <div className="position-relative mb-4">
//                 <video
//                   ref={videoRef}
//                   autoPlay
//                   muted
//                   playsInline
//                   className="w-100 rounded-3 shadow-sm"
//                   style={{
//                     maxHeight: "400px",
//                     backgroundColor: "#f8f9fa",
//                     border: "2px solid #e9ecef",
//                   }}
//                 />
//                 {isScanning && (
//                   <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center">
//                     <div
//                       className="spinner-border text-primary"
//                       style={{ width: "3rem", height: "3rem" }}
//                     >
//                       <span className="visually-hidden">Đang quét...</span>
//                     </div>
//                   </div>
//                 )}
//               </div>

//               {/* Status */}
//               <div className="text-center mb-4">
//                 <div className={`fw-bold fs-5 mb-2 ${getStatusColor()}`}>
//                   {status}
//                 </div>

//                 {/* Match Info */}
//                 {matchInfo && (
//                   <div className="alert alert-info py-2 px-3 d-inline-block">
//                     <small>
//                       <strong>{matchInfo.username}</strong> • Độ tương đồng:{" "}
//                       <strong>
//                         {(100 - matchInfo.distance * 100).toFixed(1)}%
//                       </strong>
//                     </small>
//                   </div>
//                 )}
//               </div>

//               {/* Control Buttons */}
//               <div className="d-flex gap-3 justify-content-center mb-4">
//                 <button
//                   onClick={start}
//                   className="btn btn-primary btn-lg px-4"
//                   disabled={!modelsLoaded || isScanning}
//                 >
//                   <i className="fas fa-camera me-2"></i>
//                   {modelsLoaded ? "Bật Camera" : "Đang tải..."}
//                 </button>

//                 <button
//                   onClick={stopCamera}
//                   className="btn btn-outline-secondary btn-lg px-4"
//                   disabled={!isScanning}
//                 >
//                   <i className="fas fa-stop me-2"></i>
//                   Dừng
//                 </button>
//               </div>

//               {/* Stats */}
//               <div className="row text-center">
//                 <div className="col-6">
//                   <div className="border-end">
//                     <div className="text-primary fw-bold fs-4">
//                       {users.length}
//                     </div>
//                     <small className="text-muted">Người dùng đã đăng ký</small>
//                   </div>
//                 </div>
//                 <div className="col-6">
//                   <div>
//                     <div className="text-success fw-bold fs-4">
//                       {modelsLoaded ? "✓" : "..."}
//                     </div>
//                     <small className="text-muted">Hệ thống sẵn sàng</small>
//                   </div>
//                 </div>
//               </div>

//               {/* Instructions */}
//               <div className="mt-4 p-3 bg-light rounded-3">
//                 <h6 className="fw-bold mb-2">📝 Hướng dẫn sử dụng:</h6>
//                 <div className="row small text-muted">
//                   <div className="col-md-6">
//                     <i className="fas fa-check-circle text-success me-2"></i>
//                     Đảm bảo ánh sáng đủ
//                   </div>
//                   <div className="col-md-6">
//                     <i className="fas fa-check-circle text-success me-2"></i>
//                     Nhìn thẳng vào camera
//                   </div>
//                   <div className="col-md-6">
//                     <i className="fas fa-check-circle text-success me-2"></i>
//                     Giữ khuôn mặt trong khung hình
//                   </div>
//                   <div className="col-md-6">
//                     <i className="fas fa-check-circle text-success me-2"></i>
//                     Không đeo kính râm
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div className="card-footer bg-transparent text-center py-3">
//               <small className="text-muted">
//                 <i className="fas fa-shield-alt me-1"></i>
//                 Hệ thống sử dụng AI để bảo vệ thông tin của bạn
//               </small>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default FaceLogin;

// ======================================
// import React, { useRef, useState, useEffect } from "react";
// import api from "../../services/api";
// import * as faceapi from "face-api.js";
// import { Modal, Button } from "react-bootstrap";

// const FaceLogin = () => {
//   const USRE_DISTANCE = 0.3;

//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);
//   const [status, setStatus] = useState("Bật camera để bắt đầu đăng nhập");
//   const [users, setUsers] = useState([]);
//   const [modelsLoaded, setModelsLoaded] = useState(false);
//   const [isScanning, setIsScanning] = useState(false);
//   const [matchInfo, setMatchInfo] = useState(null);
//   const [capturedImage, setCapturedImage] = useState(null);
//   const [showCapture, setShowCapture] = useState(false);

//   // Biến trạng thái để kiểm soát hiển thị modal
//   const [show, setShow] = useState(false);
//   const [id, setId] = useState(null);

//   // Hàm đóng modal
//   const handleClose = () => setShow(false);

//   // Load face-api.js models
//   useEffect(() => {
//     const loadModels = async () => {
//       try {
//         setStatus("Đang tải AI nhận diện khuôn mặt...");
//         await Promise.all([
//           faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
//           faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
//           faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
//         ]);
//         setModelsLoaded(true);
//         setStatus("Hệ thống đã sẵn sàng");
//       } catch (error) {
//         console.error("Lỗi load models:", error);
//         setStatus("❌ Lỗi tải hệ thống nhận diện");
//       }
//     };
//     loadModels();
//   }, []);

//   // Load users
//   useEffect(() => {
//     if (modelsLoaded) {
//       api.get("/api/auth/face-users").then((res) => {
//         console.log("Users loaded:", res.data);
//         setUsers(res.data);
//       });
//     }
//   }, [modelsLoaded]);

//   const start = async () => {
//     if (!modelsLoaded) {
//       setStatus("Hệ thống chưa sẵn sàng");
//       return;
//     }

//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: { width: 640, height: 480 },
//       });
//       videoRef.current.srcObject = stream;
//       setIsScanning(true);
//       setStatus("🔍 Đang quét khuôn mặt...");
//       setMatchInfo(null);
//       setCapturedImage(null);
//       setShowCapture(false);

//       // Đợi video bắt đầu
//       setTimeout(() => {
//         detectFace();
//       }, 500);
//     } catch (error) {
//       console.error("Lỗi camera:", error);
//       setStatus("❌ Lỗi truy cập camera. Vui lòng cho phép quyền camera.");
//     }
//   };

//   const captureImage = () => {
//     const video = videoRef.current;
//     const canvas = canvasRef.current;

//     if (!video || !canvas) return;

//     const context = canvas.getContext("2d");
//     canvas.width = video.videoWidth;
//     canvas.height = video.videoHeight;

//     // Vẽ ảnh từ video lên canvas
//     context.drawImage(video, 0, 0, canvas.width, canvas.height);

//     // Chuyển canvas thành data URL (định dạng ảnh)
//     const imageDataUrl = canvas.toDataURL("image/jpeg", 0.8);
//     setCapturedImage(imageDataUrl);
//     setShowCapture(true);

//     setStatus("✅ Đã chụp ảnh thành công!");
//   };

//   const retakePhoto = () => {
//     setCapturedImage(null);
//     setShowCapture(false);
//     setStatus("📷 Chụp lại ảnh...");
//   };

//   const savePhoto = () => {
//     if (!capturedImage) return;

//     // Tạo link tải về
//     const link = document.createElement("a");
//     link.download = `face-capture-${new Date().getTime()}.jpg`;
//     link.href = capturedImage;
//     link.click();

//     setStatus("💾 Đã lưu ảnh thành công!");
//   };

//   const detectFace = async () => {
//     const video = videoRef.current;
//     let attempts = 0;

//     const check = async () => {
//       if (attempts++ > 100) {
//         setStatus("⏰ Không phát hiện khuôn mặt. Vui lòng thử lại.");
//         setIsScanning(false);
//         return;
//       }

//       try {
//         const detection = await faceapi
//           .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
//           .withFaceLandmarks()
//           .withFaceDescriptor();

//         if (detection) {
//           const confidence = (detection.detection.score * 100).toFixed(1);
//           console.log(`Đã phát hiện khuôn mặt, độ tin cậy: ${confidence}%`);

//           setStatus(`✅ Đã phát hiện khuôn mặt (${confidence}%)`);

//           const desc = Array.from(detection.descriptor);
//           const match = findMatch(desc);

//           if (match) {
//             setMatchInfo({
//               username: match.user.username,
//               distance: match.distance,
//               confidence: confidence,
//             });

//             if (match.distance < USRE_DISTANCE) {
//               setStatus(`🎉 Đã nhận diện: ${match.user.username}`);

//               setId(match.user._id);
//               // await login(match.user._id);
//               setShow(true);
//               return;
//             } else {
//               setStatus(
//                 `⚠️ Độ tương đồng thấp: ${(match.distance * 100).toFixed(1)}%`
//               );
//             }
//           } else {
//             setStatus("❌ Không tìm thấy người dùng phù hợp");
//           }
//         } else {
//           setStatus("🔍 Đang tìm khuôn mặt...");
//         }

//         setTimeout(check, 300);
//       } catch (error) {
//         console.error("Lỗi detect:", error);
//         setStatus("❌ Lỗi nhận diện khuôn mặt");
//         setIsScanning(false);
//       }
//     };

//     check();
//   };

//   const findMatch = (queryDescriptor) => {
//     if (users.length === 0) {
//       console.log("Không có users nào trong database");
//       return null;
//     }

//     let bestMatch = null;
//     let minDistance = Infinity;

//     users.forEach((user) => {
//       try {
//         const storedDescriptor = user.profile?.faceDescriptor;

//         if (!storedDescriptor || !Array.isArray(storedDescriptor)) {
//           return;
//         }

//         if (storedDescriptor.length !== 128) {
//           return;
//         }

//         const storedFloat32 = new Float32Array(storedDescriptor);
//         const queryFloat32 = new Float32Array(queryDescriptor);

//         const distance = faceapi.euclideanDistance(queryFloat32, storedFloat32);

//         if (distance < minDistance) {
//           minDistance = distance;
//           bestMatch = { user, distance };
//         }
//       } catch (error) {
//         console.error("Lỗi so sánh với user:", user.username, error);
//       }
//     });

//     return bestMatch;
//   };

//   const handleLogin = async (userId) => {
//     try {
//       await login(userId);
//     } catch (error) {
//       console.error("Lỗi handleLogin:", error);
//       setStatus("❌ Lỗi đăng nhập handleLogin");
//       setIsScanning(false);
//     }
//   };

//   const login = async (userId) => {
//     try {
//       setStatus("🔐 Đang đăng nhập...");
//       const res = await api.post("/api/auth/face-login", { userId });

//       if (res.data.success) {
//         localStorage.setItem("token", res.data.token);
//         setStatus("🎉 Đăng nhập thành công!");
//         setIsScanning(false);

//         setTimeout(() => {
//           window.location.href = "/profile";
//         }, 1500);
//       } else {
//         setStatus("❌ Đăng nhập thất bại");
//         setIsScanning(false);
//       }
//     } catch (error) {
//       console.error("Lỗi login:", error);
//       setStatus("❌ Lỗi đăng nhập");
//       setIsScanning(false);
//     }
//   };

//   const stopCamera = () => {
//     if (videoRef.current?.srcObject) {
//       videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
//       setStatus("📷 Camera đã tắt");
//       setIsScanning(false);
//       setMatchInfo(null);
//       setCapturedImage(null);
//       setShowCapture(false);
//     }
//   };

//   // Cleanup
//   useEffect(() => {
//     return () => stopCamera();
//   }, []);

//   const getStatusColor = () => {
//     if (status.includes("❌")) return "text-danger";
//     if (status.includes("✅") || status.includes("🎉") || status.includes("💾"))
//       return "text-success";
//     if (status.includes("⚠️")) return "text-warning";
//     if (status.includes("🔍") || status.includes("🔐") || status.includes("📷"))
//       return "text-info";
//     return "text-muted";
//   };

//   return (
//     <div className="container py-4">
//       <div className="row justify-content-center">
//         <div className="col-md-8 col-lg-6">
//           <div className="card border-0 shadow-lg">
//             <div className="card-header bg-gradient-primary text-white text-center py-4">
//               <div className="d-flex align-items-center justify-content-center mb-2">
//                 <i className="fas fa-face-recognition fa-2x me-3"></i>
//                 <div>
//                   <h2 className="h3 mb-0">Đăng Nhập Bằng Khuôn Mặt</h2>
//                   <p className="mb-0 opacity-75">
//                     Nhanh chóng - Bảo mật - Tiện lợi
//                   </p>
//                 </div>
//               </div>
//             </div>

//             <div className="card-body p-4">
//               {/* Video Preview */}
//               <div className="position-relative mb-4">
//                 {!showCapture ? (
//                   <video
//                     ref={videoRef}
//                     autoPlay
//                     muted
//                     playsInline
//                     className="w-100 rounded-3 shadow-sm"
//                     style={{
//                       maxHeight: "400px",
//                       backgroundColor: "#f8f9fa",
//                       border: "2px solid #e9ecef",
//                     }}
//                   />
//                 ) : (
//                   <div className="text-center">
//                     <img
//                       src={capturedImage}
//                       alt="Ảnh đã chụp"
//                       className="w-100 rounded-3 shadow-sm"
//                       style={{
//                         maxHeight: "400px",
//                         backgroundColor: "#f8f9fa",
//                         border: "2px solid #e9ecef",
//                       }}
//                     />
//                     <div className="mt-2 text-muted small">
//                       📸 Ảnh đã chụp - {new Date().toLocaleTimeString()}
//                     </div>
//                   </div>
//                 )}

//                 {/* Canvas ẩn để chụp ảnh */}
//                 <canvas ref={canvasRef} style={{ display: "none" }} />

//                 {isScanning && !showCapture && (
//                   <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center">
//                     <div
//                       className="spinner-border text-primary"
//                       style={{ width: "3rem", height: "3rem" }}
//                     >
//                       <span className="visually-hidden">Đang quét...</span>
//                     </div>
//                   </div>
//                 )}
//               </div>

//               {/* Status */}
//               <div className="text-center mb-4">
//                 <div className={`fw-bold fs-5 mb-2 ${getStatusColor()}`}>
//                   {status}
//                 </div>

//                 {/* Match Info */}
//                 {matchInfo && (
//                   <div className="alert alert-info py-2 px-3 d-inline-block">
//                     <small>
//                       <strong>{matchInfo.username}</strong> • Độ tương đồng:{" "}
//                       <strong>
//                         {(100 - matchInfo.distance * 100).toFixed(1)}%
//                       </strong>
//                     </small>
//                   </div>
//                 )}
//               </div>

//               {/* Control Buttons */}
//               <div className="d-flex gap-3 justify-content-center mb-4 flex-wrap">
//                 <button
//                   onClick={start}
//                   className="btn btn-primary btn-lg px-4"
//                   disabled={!modelsLoaded || (isScanning && !showCapture)}
//                 >
//                   <i className="fas fa-camera me-2"></i>
//                   {modelsLoaded ? "Bật Camera" : "Đang tải..."}
//                 </button>

//                 {isScanning && !showCapture && (
//                   <button
//                     onClick={captureImage}
//                     className="btn btn-success btn-lg px-4"
//                   >
//                     <i className="fas fa-camera me-2"></i>
//                     Chụp Ảnh
//                   </button>
//                 )}

//                 {showCapture && (
//                   <>
//                     <button
//                       onClick={savePhoto}
//                       className="btn btn-info btn-lg px-4"
//                     >
//                       <i className="fas fa-download me-2"></i>
//                       Lưu Ảnh
//                     </button>
//                     <button
//                       onClick={retakePhoto}
//                       className="btn btn-warning btn-lg px-4"
//                     >
//                       <i className="fas fa-redo me-2"></i>
//                       Chụp Lại
//                     </button>
//                   </>
//                 )}

//                 <button
//                   onClick={stopCamera}
//                   className="btn btn-outline-secondary btn-lg px-4"
//                   disabled={!isScanning}
//                 >
//                   <i className="fas fa-stop me-2"></i>
//                   Dừng
//                 </button>
//               </div>

//               {/* Stats */}
//               <div className="row text-center">
//                 <div className="col-6">
//                   <div className="border-end">
//                     <div className="text-primary fw-bold fs-4">
//                       {users.length}
//                     </div>
//                     <small className="text-muted">Người dùng đã đăng ký</small>
//                   </div>
//                 </div>
//                 <div className="col-6">
//                   <div>
//                     <div className="text-success fw-bold fs-4">
//                       {modelsLoaded ? "✓" : "..."}
//                     </div>
//                     <small className="text-muted">Hệ thống sẵn sàng</small>
//                   </div>
//                 </div>
//               </div>

//               {/* Instructions */}
//               <div className="mt-4 p-3 bg-light rounded-3">
//                 <h6 className="fw-bold mb-2">📝 Hướng dẫn sử dụng:</h6>
//                 <div className="row small text-muted">
//                   <div className="col-md-6">
//                     <i className="fas fa-check-circle text-success me-2"></i>
//                     Đảm bảo ánh sáng đủ
//                   </div>
//                   <div className="col-md-6">
//                     <i className="fas fa-check-circle text-success me-2"></i>
//                     Nhìn thẳng vào camera
//                   </div>
//                   <div className="col-md-6">
//                     <i className="fas fa-check-circle text-success me-2"></i>
//                     Giữ khuôn mặt trong khung hình
//                   </div>
//                   <div className="col-md-6">
//                     <i className="fas fa-check-circle text-success me-2"></i>
//                     Không đeo kính râm
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div className="card-footer bg-transparent text-center py-3">
//               <small className="text-muted">
//                 <i className="fas fa-shield-alt me-1"></i>
//                 Hệ thống sử dụng AI để bảo vệ thông tin của bạn
//               </small>
//             </div>

//             <Modal
//               show={show} // ✅ Bắt buộc: hiển thị modal khi show = true
//               onHide={handleClose} // ✅ Bắt buộc: hàm đóng modal (khi nhấn nút X hoặc click nền)
//               size="md" // Kích thước modal: sm, lg, xl
//               centered // Căn giữa theo chiều dọc
//               scrollable // Cho phép cuộn nếu nội dung dài
//             >
//               {/* ====== PHẦN HEADER ====== */}
//               <Modal.Header
//                 closeButton // Hiển thị nút X để đóng
//                 closeVariant="white" // Màu nút X (white hoặc black)
//                 className="bg-primary text-white"
//               >
//                 <Modal.Title>Đăng Nhập Thành Công</Modal.Title>
//               </Modal.Header>

//               {/* ====== PHẦN BODY ====== */}
//               <Modal.Body>
//                 <div>{status}</div>
//                 {matchInfo && (
//                   <div className="alert alert-info py-2 px-3 d-inline-block">
//                     <small>
//                       <strong>{matchInfo.username}</strong> • Độ tương đồng:{" "}
//                       <strong>
//                         {(100 - matchInfo.distance * 100).toFixed(1)}%
//                       </strong>
//                     </small>
//                   </div>
//                 )}
//               </Modal.Body>

//               {/* ====== PHẦN FOOTER ====== */}
//               <Modal.Footer>
//                 {/* Nút đóng modal */}
//                 <Button variant="secondary" onClick={handleClose}>
//                   Đóng
//                 </Button>

//                 {/* Nút hành động */}
//                 <Button
//                   variant="success" // màu nền
//                   onClick={() => {
//                     handleLogin(id);
//                     handleClose();
//                   }}
//                 >
//                   Lưu
//                 </Button>
//               </Modal.Footer>
//             </Modal>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default FaceLogin;

// ================================================================= cuối cùng
// import React, { useRef, useState, useEffect } from "react";
// import api from "../../services/api";
// import * as faceapi from "face-api.js";
// import { Modal, Button } from "react-bootstrap";

// const FaceLogin = () => {
//   const USER_DISTANCE = 0.2;

//   const videoRef = useRef(null);
//   const canvasRef = useRef(null);
//   const [status, setStatus] = useState("Bật camera để bắt đầu đăng nhập");
//   const [users, setUsers] = useState([]);
//   const [modelsLoaded, setModelsLoaded] = useState(false);
//   const [isScanning, setIsScanning] = useState(false);
//   const [matchInfo, setMatchInfo] = useState(null);
//   const [capturedImage, setCapturedImage] = useState(null);
//   const [showCapture, setShowCapture] = useState(false);

//   // Biến trạng thái để kiểm soát hiển thị modal
//   const [showSuccessModal, setShowSuccessModal] = useState(false);
//   const [showFailModal, setShowFailModal] = useState(false);
//   const [id, setId] = useState(null);
//   const [allMatches, setAllMatches] = useState([]); // Lưu tất cả kết quả so sánh

//   // Hàm đóng modal
//   const handleCloseSuccessModal = () => setShowSuccessModal(false);
//   const handleCloseFailModal = () => setShowFailModal(false);

//   // Load face-api.js models
//   useEffect(() => {
//     const loadModels = async () => {
//       try {
//         setStatus("Đang tải AI nhận diện khuôn mặt...");
//         await Promise.all([
//           faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
//           faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
//           faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
//         ]);
//         setModelsLoaded(true);
//         setStatus("Hệ thống đã sẵn sàng");
//       } catch (error) {
//         console.error("Lỗi load models:", error);
//         setStatus("❌ Lỗi tải hệ thống nhận diện");
//       }
//     };
//     loadModels();
//   }, []);

//   // Load users
//   useEffect(() => {
//     if (modelsLoaded) {
//       api.get("/api/auth/face-users").then((res) => {
//         console.log("Users loaded:", res.data);
//         setUsers(res.data);
//       });
//     }
//   }, [modelsLoaded]);

//   const start = async () => {
//     if (!modelsLoaded) {
//       setStatus("Hệ thống chưa sẵn sàng");
//       return;
//     }

//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({
//         video: { width: 640, height: 480 },
//       });
//       videoRef.current.srcObject = stream;
//       setIsScanning(true);
//       setStatus("🔍 Đang quét khuôn mặt...");
//       setMatchInfo(null);
//       setCapturedImage(null);
//       setShowCapture(false);
//       setAllMatches([]);

//       // Đợi video bắt đầu
//       setTimeout(() => {
//         detectFace();
//       }, 500);
//     } catch (error) {
//       console.error("Lỗi camera:", error);
//       setStatus("❌ Lỗi truy cập camera. Vui lòng cho phép quyền camera.");
//     }
//   };

//   const captureImage = () => {
//     const video = videoRef.current;
//     const canvas = canvasRef.current;

//     if (!video || !canvas) return;

//     const context = canvas.getContext("2d");
//     canvas.width = video.videoWidth;
//     canvas.height = video.videoHeight;

//     // Vẽ ảnh từ video lên canvas
//     context.drawImage(video, 0, 0, canvas.width, canvas.height);

//     // Chuyển canvas thành data URL (định dạng ảnh)
//     const imageDataUrl = canvas.toDataURL("image/jpeg", 0.8);
//     setCapturedImage(imageDataUrl);
//     setShowCapture(true);

//     setStatus("✅ Đã chụp ảnh thành công!");
//   };

//   const retakePhoto = () => {
//     setCapturedImage(null);
//     setShowCapture(false);
//     setStatus("📷 Chụp lại ảnh...");
//   };

//   const savePhoto = () => {
//     if (!capturedImage) return;

//     // Tạo link tải về
//     const link = document.createElement("a");
//     link.download = `face-capture-${new Date().getTime()}.jpg`;
//     link.href = capturedImage;
//     link.click();

//     setStatus("💾 Đã lưu ảnh thành công!");
//   };

//   const detectFace = async () => {
//     const video = videoRef.current;
//     let attempts = 0;

//     const check = async () => {
//       if (attempts++ > 100) {
//         setStatus("⏰ Không phát hiện khuôn mặt. Vui lòng thử lại.");
//         setIsScanning(false);
//         return;
//       }

//       try {
//         const detection = await faceapi
//           .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
//           .withFaceLandmarks()
//           .withFaceDescriptor();

//         if (detection) {
//           const confidence = (detection.detection.score * 100).toFixed(1);
//           console.log(`Đã phát hiện khuôn mặt, độ tin cậy: ${confidence}%`);

//           setStatus(`✅ Đã phát hiện khuôn mặt (${confidence}%)`);

//           const desc = Array.from(detection.descriptor);
//           const matchResult = findMatch(desc);

//           if (matchResult.bestMatch) {
//             setMatchInfo({
//               username: matchResult.bestMatch.user.username,
//               distance: matchResult.bestMatch.distance,
//               confidence: confidence,
//             });

//             // Lưu tất cả kết quả so sánh để debug
//             setAllMatches(matchResult.allMatches);

//             if (matchResult.bestMatch.distance < USER_DISTANCE) {
//               setStatus(
//                 `🎉 Đã nhận diện: ${matchResult.bestMatch.user.username}`
//               );
//               setId(matchResult.bestMatch.user._id);
//               setShowSuccessModal(true);
//               stopCamera(); // Dừng camera khi nhận diện thành công
//               return;
//             } else {
//               setStatus(
//                 `⚠️ Độ tương đồng thấp: ${(
//                   matchResult.bestMatch.distance * 100
//                 ).toFixed(1)}%`
//               );
//             }
//           } else {
//             setStatus("❌ Không tìm thấy người dùng phù hợp");
//             setAllMatches(matchResult.allMatches);
//           }
//         } else {
//           setStatus("🔍 Đang tìm khuôn mặt...");
//         }

//         setTimeout(check, 300);
//       } catch (error) {
//         console.error("Lỗi detect:", error);
//         setStatus("❌ Lỗi nhận diện khuôn mặt");
//         setIsScanning(false);
//       }
//     };

//     check();
//   };

//   const findMatch = (queryDescriptor) => {
//     if (users.length === 0) {
//       console.log("Không có users nào trong database");
//       return { bestMatch: null, allMatches: [] };
//     }

//     let bestMatch = null;
//     let minDistance = Infinity;
//     const allMatches = [];

//     users.forEach((user) => {
//       try {
//         const storedDescriptor = user.profile?.faceDescriptor;

//         if (!storedDescriptor || !Array.isArray(storedDescriptor)) {
//           allMatches.push({
//             username: user.username,
//             distance: "N/A",
//             error: "Không có descriptor",
//           });
//           return;
//         }

//         if (storedDescriptor.length !== 128) {
//           allMatches.push({
//             username: user.username,
//             distance: "N/A",
//             error: "Descriptor không hợp lệ",
//           });
//           return;
//         }

//         const storedFloat32 = new Float32Array(storedDescriptor);
//         const queryFloat32 = new Float32Array(queryDescriptor);

//         const distance = faceapi.euclideanDistance(queryFloat32, storedFloat32);
//         const similarity = (100 - distance * 100).toFixed(1);

//         allMatches.push({
//           username: user.username,
//           distance: distance,
//           similarity: similarity,
//           status: distance < USER_DISTANCE ? "✅ Khớp" : "❌ Không khớp",
//         });

//         if (distance < minDistance) {
//           minDistance = distance;
//           bestMatch = { user, distance };
//         }
//       } catch (error) {
//         console.error("Lỗi so sánh với user:", user.username, error);
//         allMatches.push({
//           username: user.username,
//           distance: "N/A",
//           error: "Lỗi so sánh",
//         });
//       }
//     });

//     // Sắp xếp theo độ tương đồng giảm dần
//     allMatches.sort((a, b) => {
//       if (a.distance === "N/A") return 1;
//       if (b.distance === "N/A") return -1;
//       return a.distance - b.distance;
//     });

//     return { bestMatch, allMatches };
//   };

//   const handleLogin = async (userId) => {
//     try {
//       await login(userId);
//     } catch (error) {
//       console.error("Lỗi handleLogin:", error);
//       setStatus("❌ Lỗi đăng nhập handleLogin");
//       setIsScanning(false);
//       setShowFailModal(true);
//     }
//   };

//   const login = async (userId) => {
//     try {
//       setStatus("🔐 Đang đăng nhập...");
//       const res = await api.post("/api/auth/face-login", { userId });

//       if (res.data.success) {
//         localStorage.setItem("token", res.data.token);
//         setStatus("🎉 Đăng nhập thành công!");
//         setIsScanning(false);

//         setTimeout(() => {
//           window.location.href = "/profile";
//         }, 1500);
//       } else {
//         setStatus("❌ Đăng nhập thất bại");
//         setIsScanning(false);
//         setShowFailModal(true);
//       }
//     } catch (error) {
//       console.error("Lỗi login:", error);
//       setStatus("❌ Lỗi đăng nhập");
//       setIsScanning(false);
//       setShowFailModal(true);
//     }
//   };

//   const stopCamera = () => {
//     if (videoRef.current?.srcObject) {
//       videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
//       setStatus("📷 Camera đã tắt");
//       setIsScanning(false);
//       setMatchInfo(null);
//       setCapturedImage(null);
//       setShowCapture(false);
//     }
//   };

//   const retryScan = () => {
//     setShowFailModal(false);
//     setShowSuccessModal(false);
//     start();
//   };

//   // Cleanup
//   useEffect(() => {
//     return () => stopCamera();
//   }, []);

//   const getStatusColor = () => {
//     if (status.includes("❌")) return "text-danger";
//     if (status.includes("✅") || status.includes("🎉") || status.includes("💾"))
//       return "text-success";
//     if (status.includes("⚠️")) return "text-warning";
//     if (status.includes("🔍") || status.includes("🔐") || status.includes("📷"))
//       return "text-info";
//     return "text-muted";
//   };

//   return (
//     <div className="container py-4">
//       <div className="row justify-content-center">
//         <div className="col-md-8 col-lg-6">
//           <div className="card border-0 shadow-lg">
//             <div className="card-header bg-gradient-primary text-white text-center py-4">
//               <div className="d-flex align-items-center justify-content-center mb-2">
//                 <i className="fas fa-face-recognition fa-2x me-3"></i>
//                 <div>
//                   <h2 className="h3 mb-0">Đăng Nhập Bằng Khuôn Mặt</h2>
//                   <p className="mb-0 opacity-75">
//                     Nhanh chóng - Bảo mật - Tiện lợi
//                   </p>
//                 </div>
//               </div>
//             </div>

//             <div className="card-body p-4">
//               {/* Video Preview */}
//               <div className="position-relative mb-4">
//                 {!showCapture ? (
//                   <video
//                     ref={videoRef}
//                     autoPlay
//                     muted
//                     playsInline
//                     className="w-100 rounded-3 shadow-sm"
//                     style={{
//                       maxHeight: "400px",
//                       backgroundColor: "#f8f9fa",
//                       border: "2px solid #e9ecef",
//                     }}
//                   />
//                 ) : (
//                   <div className="text-center">
//                     <img
//                       src={capturedImage}
//                       alt="Ảnh đã chụp"
//                       className="w-100 rounded-3 shadow-sm"
//                       style={{
//                         maxHeight: "400px",
//                         backgroundColor: "#f8f9fa",
//                         border: "2px solid #e9ecef",
//                       }}
//                     />
//                     <div className="mt-2 text-muted small">
//                       📸 Ảnh đã chụp - {new Date().toLocaleTimeString()}
//                     </div>
//                   </div>
//                 )}

//                 {/* Canvas ẩn để chụp ảnh */}
//                 <canvas ref={canvasRef} style={{ display: "none" }} />

//                 {isScanning && !showCapture && (
//                   <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center">
//                     <div
//                       className="spinner-border text-primary"
//                       style={{ width: "3rem", height: "3rem" }}
//                     >
//                       <span className="visually-hidden">Đang quét...</span>
//                     </div>
//                   </div>
//                 )}
//               </div>

//               {/* Status */}
//               <div className="text-center mb-4">
//                 <div className={`fw-bold fs-5 mb-2 ${getStatusColor()}`}>
//                   {status}
//                 </div>

//                 {/* Match Info */}
//                 {matchInfo && (
//                   <div className="alert alert-info py-2 px-3 d-inline-block">
//                     <small>
//                       <strong>{matchInfo.username}</strong> • Độ tương đồng:{" "}
//                       <strong>
//                         {(100 - matchInfo.distance * 100).toFixed(1)}%
//                       </strong>
//                     </small>
//                   </div>
//                 )}
//               </div>

//               {/* Control Buttons */}
//               <div className="d-flex gap-3 justify-content-center mb-4 flex-wrap">
//                 <button
//                   onClick={start}
//                   className="btn btn-primary btn-lg px-4"
//                   disabled={!modelsLoaded || (isScanning && !showCapture)}
//                 >
//                   <i className="fas fa-camera me-2"></i>
//                   {modelsLoaded ? "Bật Camera" : "Đang tải..."}
//                 </button>

//                 {isScanning && !showCapture && (
//                   <button
//                     onClick={captureImage}
//                     className="btn btn-success btn-lg px-4"
//                   >
//                     <i className="fas fa-camera me-2"></i>
//                     Chụp Ảnh
//                   </button>
//                 )}

//                 {showCapture && (
//                   <>
//                     <button
//                       onClick={savePhoto}
//                       className="btn btn-info btn-lg px-4"
//                     >
//                       <i className="fas fa-download me-2"></i>
//                       Lưu Ảnh
//                     </button>
//                     <button
//                       onClick={retakePhoto}
//                       className="btn btn-warning btn-lg px-4"
//                     >
//                       <i className="fas fa-redo me-2"></i>
//                       Chụp Lại
//                     </button>
//                   </>
//                 )}

//                 <button
//                   onClick={stopCamera}
//                   className="btn btn-outline-secondary btn-lg px-4"
//                   disabled={!isScanning}
//                 >
//                   <i className="fas fa-stop me-2"></i>
//                   Dừng
//                 </button>
//               </div>

//               {/* Stats */}
//               <div className="row text-center">
//                 <div className="col-6">
//                   <div className="border-end">
//                     <div className="text-primary fw-bold fs-4">
//                       {users.length}
//                     </div>
//                     <small className="text-muted">Người dùng đã đăng ký</small>
//                   </div>
//                 </div>
//                 <div className="col-6">
//                   <div>
//                     <div className="text-success fw-bold fs-4">
//                       {modelsLoaded ? "✓" : "..."}
//                     </div>
//                     <small className="text-muted">Hệ thống sẵn sàng</small>
//                   </div>
//                 </div>
//               </div>

//               {/* Instructions */}
//               <div className="mt-4 p-3 bg-light rounded-3">
//                 <h6 className="fw-bold mb-2">📝 Hướng dẫn sử dụng:</h6>
//                 <div className="row small text-muted">
//                   <div className="col-md-6">
//                     <i className="fas fa-check-circle text-success me-2"></i>
//                     Đảm bảo ánh sáng đủ
//                   </div>
//                   <div className="col-md-6">
//                     <i className="fas fa-check-circle text-success me-2"></i>
//                     Nhìn thẳng vào camera
//                   </div>
//                   <div className="col-md-6">
//                     <i className="fas fa-check-circle text-success me-2"></i>
//                     Giữ khuôn mặt trong khung hình
//                   </div>
//                   <div className="col-md-6">
//                     <i className="fas fa-check-circle text-success me-2"></i>
//                     Không đeo kính râm
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div className="card-footer bg-transparent text-center py-3">
//               <small className="text-muted">
//                 <i className="fas fa-shield-alt me-1"></i>
//                 Hệ thống sử dụng AI để bảo vệ thông tin của bạn
//               </small>
//             </div>

//             {/* Modal Đăng Nhập Thành Công */}
//             <Modal
//               show={showSuccessModal}
//               onHide={handleCloseSuccessModal}
//               size="lg"
//               centered
//               scrollable
//             >
//               <Modal.Header closeButton className="bg-success text-white">
//                 <Modal.Title>🎉 Đăng Nhập Thành Công</Modal.Title>
//               </Modal.Header>

//               <Modal.Body>
//                 <div className="alert alert-success">
//                   <strong>Trạng thái:</strong> {status}
//                 </div>

//                 {matchInfo && (
//                   <div className="alert alert-info">
//                     <h6>Thông tin khớp:</h6>
//                     <p>
//                       <strong>Username:</strong> {matchInfo.username}
//                     </p>
//                     <p>
//                       <strong>Độ tương đồng:</strong>{" "}
//                       {(100 - matchInfo.distance * 100).toFixed(1)}%
//                     </p>
//                     <p>
//                       <strong>Khoảng cách:</strong>{" "}
//                       {matchInfo.distance.toFixed(4)}
//                     </p>
//                     <p>
//                       <strong>Ngưỡng chấp nhận:</strong> {USER_DISTANCE}
//                     </p>
//                   </div>
//                 )}

//                 <div className="mt-3">
//                   <h6>📊 Kết quả so sánh với tất cả người dùng:</h6>
//                   <div className="table-responsive">
//                     <table className="table table-sm table-striped">
//                       <thead>
//                         <tr>
//                           <th>Username</th>
//                           <th>Độ tương đồng</th>
//                           <th>Khoảng cách</th>
//                           <th>Trạng thái</th>
//                         </tr>
//                       </thead>
//                       <tbody>
//                         {allMatches.map((match, index) => (
//                           <tr
//                             key={index}
//                             className={
//                               match.status === "✅ Khớp" ? "table-success" : ""
//                             }
//                           >
//                             <td>{match.username}</td>
//                             <td>{match.similarity || "N/A"}%</td>
//                             <td>
//                               {typeof match.distance === "number"
//                                 ? match.distance.toFixed(4)
//                                 : match.distance}
//                             </td>
//                             <td>
//                               {match.status ||
//                                 (match.error && `❌ ${match.error}`)}
//                             </td>
//                           </tr>
//                         ))}
//                       </tbody>
//                     </table>
//                   </div>
//                 </div>
//               </Modal.Body>

//               <Modal.Footer>
//                 <Button variant="secondary" onClick={handleCloseSuccessModal}>
//                   Đóng
//                 </Button>
//                 <Button
//                   variant="success"
//                   onClick={() => {
//                     handleLogin(id);
//                     handleCloseSuccessModal();
//                   }}
//                 >
//                   Tiếp tục đăng nhập
//                 </Button>
//               </Modal.Footer>
//             </Modal>

//             {/* Modal Đăng Nhập Thất Bại */}
//             <Modal
//               show={showFailModal}
//               onHide={handleCloseFailModal}
//               size="lg"
//               centered
//             >
//               <Modal.Header closeButton className="bg-danger text-white">
//                 <Modal.Title>❌ Đăng Nhập Thất Bại</Modal.Title>
//               </Modal.Header>

//               <Modal.Body>
//                 <div className="alert alert-danger">
//                   <strong>Lỗi:</strong> {status}
//                 </div>

//                 <div className="mt-3">
//                   <h6>📊 Kết quả so sánh debug:</h6>
//                   <div className="table-responsive">
//                     <table className="table table-sm table-striped">
//                       <thead>
//                         <tr>
//                           <th>Username</th>
//                           <th>Độ tương đồng</th>
//                           <th>Khoảng cách</th>
//                           <th>Trạng thái</th>
//                         </tr>
//                       </thead>
//                       <tbody>
//                         {allMatches.map((match, index) => (
//                           <tr key={index}>
//                             <td>{match.username}</td>
//                             <td>{match.similarity || "N/A"}%</td>
//                             <td>
//                               {typeof match.distance === "number"
//                                 ? match.distance.toFixed(4)
//                                 : match.distance}
//                             </td>
//                             <td>
//                               {match.status ||
//                                 (match.error && `❌ ${match.error}`)}
//                             </td>
//                           </tr>
//                         ))}
//                       </tbody>
//                     </table>
//                   </div>
//                 </div>

//                 <div className="alert alert-warning mt-3">
//                   <strong>💡 Gợi ý:</strong>
//                   <ul className="mb-0">
//                     <li>Kiểm tra ánh sáng và vị trí khuôn mặt</li>
//                     <li>Đảm bảo khuôn mặt không bị che khuất</li>
//                     <li>Thử lại với khoảng cách phù hợp</li>
//                   </ul>
//                 </div>
//               </Modal.Body>

//               <Modal.Footer>
//                 <Button variant="secondary" onClick={handleCloseFailModal}>
//                   Đóng
//                 </Button>
//                 <Button variant="primary" onClick={retryScan}>
//                   <i className="fas fa-redo me-2"></i>
//                   Thử Lại
//                 </Button>
//               </Modal.Footer>
//             </Modal>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default FaceLogin;

/// ===================
import React, { useRef, useState, useEffect } from "react";
import api from "../../services/api";
import * as faceapi from "face-api.js";
import { Modal, Button } from "react-bootstrap";

const FaceLogin = () => {
  const USER_DISTANCE = 0.29;
  const MAX_ATTEMPTS = 1;
  const DETECTION_PER_ATTEMPT = 10;

  const videoRef = useRef(null);
  const [status, setStatus] = useState("Bật camera để bắt đầu đăng nhập");
  const [users, setUsers] = useState([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [matchInfo, setMatchInfo] = useState(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);
  const [id, setId] = useState(null);
  const [allMatches, setAllMatches] = useState([]);
  const [attemptResults, setAttemptResults] = useState([]);
  const [currentAttempt, setCurrentAttempt] = useState(0);

  // Sử dụng ref để theo dõi số lần detect thực tế
  const detectionCountRef = useRef(0);
  const [displayDetectionCount, setDisplayDetectionCount] = useState(0);

  const handleCloseSuccessModal = () => setShowSuccessModal(false);
  const handleCloseFailModal = () => setShowFailModal(false);

  useEffect(() => {
    const loadModels = async () => {
      try {
        setStatus("Đang tải AI nhận diện khuôn mặt...");
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
          faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        ]);
        setModelsLoaded(true);
        setStatus("Hệ thống đã sẵn sàng");
      } catch (error) {
        console.error("Lỗi load models:", error);
        setStatus("❌ Lỗi tải hệ thống nhận diện");
      }
    };
    loadModels();
  }, []);

  useEffect(() => {
    if (modelsLoaded) {
      api.get("/api/auth/face-users").then((res) => {
        console.log("Users loaded:", res.data);
        setUsers(res.data);
      });
    }
  }, [modelsLoaded]);

  const start = async () => {
    if (!modelsLoaded) {
      setStatus("Hệ thống chưa sẵn sàng");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      videoRef.current.srcObject = stream;
      setIsScanning(true);
      setStatus("🔍 Đang quét khuôn mặt...");
      setMatchInfo(null);
      setAttemptResults([]);
      setCurrentAttempt(0);
      detectionCountRef.current = 0;
      setDisplayDetectionCount(0);

      setTimeout(() => {
        detectFace();
      }, 500);
    } catch (error) {
      console.error("Lỗi camera:", error);
      setStatus("❌ Lỗi truy cập camera. Vui lòng cho phép quyền camera.");
    }
  };

  const detectFace = async () => {
    const video = videoRef.current;

    const check = async () => {
      // Kiểm tra nếu đã vượt quá số lần thử
      if (currentAttempt >= MAX_ATTEMPTS) {
        setStatus(`⏰ Đã thử ${MAX_ATTEMPTS} lần. Không thể nhận diện.`);
        setIsScanning(false);
        setShowFailModal(true);
        return;
      }

      // Kiểm tra số lần detect trong lần thử hiện tại
      if (detectionCountRef.current >= DETECTION_PER_ATTEMPT) {
        console.log(
          `Lần thử ${
            currentAttempt + 1
          }: Đã đạt tối đa ${DETECTION_PER_ATTEMPT} lần detect`
        );

        const newAttemptResult = {
          attempt: currentAttempt + 1,
          status: "Thất bại",
          reason: `Đã detect ${DETECTION_PER_ATTEMPT} lần nhưng không tìm thấy khuôn mặt phù hợp`,
          bestMatch:
            attemptResults.find((r) => r.attempt === currentAttempt + 1)
              ?.bestMatch || null,
          allMatches:
            attemptResults.find((r) => r.attempt === currentAttempt + 1)
              ?.allMatches || [],
          timestamp: new Date().toLocaleTimeString(),
          detectionCount: detectionCountRef.current,
        };

        setAttemptResults((prev) => {
          const filtered = prev.filter(
            (item) => item.attempt !== currentAttempt + 1
          );
          return [...filtered, newAttemptResult];
        });

        // Chuyển sang lần thử tiếp theo
        const nextAttempt = currentAttempt + 1;
        setCurrentAttempt(nextAttempt);
        detectionCountRef.current = 0;
        setDisplayDetectionCount(0);

        if (nextAttempt < MAX_ATTEMPTS) {
          setStatus(`🔍 Lần thử ${nextAttempt + 1}: Đang quét khuôn mặt...`);
          setTimeout(detectFace, 1000);
        } else {
          setIsScanning(false);
          setShowFailModal(true);
        }
        return;
      }

      try {
        const detection = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();

        detectionCountRef.current++;
        setDisplayDetectionCount(detectionCountRef.current);

        if (detection) {
          const confidence = (detection.detection.score * 100).toFixed(1);
          console.log(
            `Lần thử ${currentAttempt + 1}, Detect ${
              detectionCountRef.current
            }: Đã phát hiện khuôn mặt, độ tin cậy: ${confidence}%`
          );

          setStatus(
            `✅ Lần thử ${
              currentAttempt + 1
            }: Đã phát hiện khuôn mặt (${confidence}%) - ${
              detectionCountRef.current
            }/${DETECTION_PER_ATTEMPT}`
          );

          const desc = Array.from(detection.descriptor);
          const matchResult = findMatch(desc);

          const newAttemptResult = {
            attempt: currentAttempt + 1,
            status: matchResult.bestMatch ? "Đã phát hiện" : "Không khớp",
            confidence: confidence,
            bestMatch: matchResult.bestMatch,
            allMatches: matchResult.allMatches,
            timestamp: new Date().toLocaleTimeString(),
            detectionCount: detectionCountRef.current,
          };

          setAttemptResults((prev) => {
            const filtered = prev.filter(
              (item) => item.attempt !== currentAttempt + 1
            );
            return [...filtered, newAttemptResult];
          });

          setAllMatches(matchResult.allMatches);

          if (
            matchResult.bestMatch &&
            matchResult.bestMatch.distance < USER_DISTANCE
          ) {
            setStatus(
              `🎉 Nhận diện thành công ở lần thử ${currentAttempt + 1}: ${
                matchResult.bestMatch.user.username
              }`
            );
            setMatchInfo({
              username: matchResult.bestMatch.user.username,
              distance: matchResult.bestMatch.distance,
              confidence: confidence,
              attempt: currentAttempt + 1,
            });
            setId(matchResult.bestMatch.user._id);
            setShowSuccessModal(true);
            stopCamera();
            return;
          } else {
            const bestMatchInfo = matchResult.bestMatch
              ? ` (tốt nhất: ${(
                  100 -
                  matchResult.bestMatch.distance * 100
                ).toFixed(1)}%)`
              : " (không có kết quả khớp)";

            setStatus(
              `⚠️ Lần thử ${
                currentAttempt + 1
              }: Đang quét...${bestMatchInfo} - ${
                detectionCountRef.current
              }/${DETECTION_PER_ATTEMPT}`
            );

            // Tiếp tục detect trong cùng lần thử
            setTimeout(check, 500);
          }
        } else {
          setStatus(
            `🔍 Lần thử ${currentAttempt + 1}: Đang tìm khuôn mặt... (${
              detectionCountRef.current
            }/${DETECTION_PER_ATTEMPT})`
          );
          setTimeout(check, 300);
        }
      } catch (error) {
        console.error("Lỗi detect:", error);
        setStatus(`❌ Lần thử ${currentAttempt + 1}: Lỗi nhận diện khuôn mặt`);

        const newAttemptResult = {
          attempt: currentAttempt + 1,
          status: "Lỗi",
          reason: error.message,
          bestMatch: null,
          allMatches: [],
          timestamp: new Date().toLocaleTimeString(),
          detectionCount: detectionCountRef.current,
        };

        setAttemptResults((prev) => [...prev, newAttemptResult]);

        const nextAttempt = currentAttempt + 1;
        setCurrentAttempt(nextAttempt);
        detectionCountRef.current = 0;
        setDisplayDetectionCount(0);

        setTimeout(() => {
          if (nextAttempt < MAX_ATTEMPTS) {
            setStatus(`🔍 Lần thử ${nextAttempt + 1}: Đang quét khuôn mặt...`);
            detectFace();
          } else {
            setIsScanning(false);
            setShowFailModal(true);
          }
        }, 1000);
      }
    };

    check();
  };

  const findMatch = (queryDescriptor) => {
    if (users.length === 0) {
      return { bestMatch: null, allMatches: [] };
    }

    let bestMatch = null;
    let minDistance = Infinity;
    const allMatches = [];

    users.forEach((user) => {
      try {
        const storedDescriptor = user.profile?.faceDescriptor;

        if (!storedDescriptor || !Array.isArray(storedDescriptor)) {
          allMatches.push({
            username: user.username,
            distance: "N/A",
            error: "Không có descriptor",
          });
          return;
        }

        if (storedDescriptor.length !== 128) {
          allMatches.push({
            username: user.username,
            distance: "N/A",
            error: "Descriptor không hợp lệ",
          });
          return;
        }

        const storedFloat32 = new Float32Array(storedDescriptor);
        const queryFloat32 = new Float32Array(queryDescriptor);

        const distance = faceapi.euclideanDistance(queryFloat32, storedFloat32);
        const similarity = (100 - distance * 100).toFixed(1);

        allMatches.push({
          username: user.username,
          distance: distance,
          similarity: similarity,
          status: distance < USER_DISTANCE ? "✅ Khớp" : "❌ Không khớp",
        });

        if (distance < minDistance) {
          minDistance = distance;
          bestMatch = { user, distance };
        }
      } catch (error) {
        console.error("Lỗi so sánh với user:", user.username, error);
        allMatches.push({
          username: user.username,
          distance: "N/A",
          error: "Lỗi so sánh",
        });
      }
    });

    allMatches.sort((a, b) => {
      if (a.distance === "N/A") return 1;
      if (b.distance === "N/A") return -1;
      return a.distance - b.distance;
    });

    return { bestMatch, allMatches };
  };

  const handleLogin = async (userId) => {
    try {
      await login(userId);
    } catch (error) {
      console.error("Lỗi handleLogin:", error);
      setStatus("❌ Lỗi đăng nhập handleLogin");
      setIsScanning(false);
      setShowFailModal(true);
    }
  };

  const login = async (userId) => {
    try {
      setStatus("🔐 Đang đăng nhập...");
      const res = await api.post("/api/auth/face-login", { userId });

      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        setStatus("🎉 Đăng nhập thành công!");
        setIsScanning(false);

        setTimeout(() => {
          window.location.href = "/profile";
        }, 1500);
      } else {
        setStatus("❌ Đăng nhập thất bại");
        setIsScanning(false);
        setShowFailModal(true);
      }
    } catch (error) {
      console.error("Lỗi login:", error);
      setStatus("❌ Lỗi đăng nhập");
      setIsScanning(false);
      setShowFailModal(true);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      setStatus("📷 Camera đã tắt");
      setIsScanning(false);
      setMatchInfo(null);
    }
  };

  const retryScan = () => {
    setShowFailModal(false);
    setShowSuccessModal(false);
    setAttemptResults([]);
    setCurrentAttempt(0);
    detectionCountRef.current = 0;
    setDisplayDetectionCount(0);
    start();
  };

  useEffect(() => {
    return () => stopCamera();
  }, []);

  const getStatusColor = () => {
    if (status.includes("❌")) return "text-danger";
    if (status.includes("✅") || status.includes("🎉")) return "text-success";
    if (status.includes("⚠️")) return "text-warning";
    if (status.includes("🔍") || status.includes("🔐")) return "text-info";
    return "text-muted";
  };

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card border-0 shadow-lg">
            <div className="card-header bg-gradient-primary text-white text-center py-4">
              <div className="d-flex align-items-center justify-content-center mb-2">
                <i className="fas fa-face-recognition fa-2x me-3"></i>
                <div>
                  <h2 className="h3 mb-0">Đăng Nhập Bằng Khuôn Mặt</h2>
                  <p className="mb-0 opacity-75">
                    Số lần thử: {currentAttempt}/{MAX_ATTEMPTS}
                  </p>
                </div>
              </div>
            </div>

            <div className="card-body p-4">
              <div className="position-relative mb-4">
                <video
                  ref={videoRef}
                  autoPlay
                  muted
                  playsInline
                  className="w-100 rounded-3 shadow-sm"
                  style={{
                    maxHeight: "400px",
                    backgroundColor: "#f8f9fa",
                    border: "2px solid #e9ecef",
                  }}
                />

                {isScanning && (
                  <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center">
                    <div
                      className="spinner-border text-primary"
                      style={{ width: "3rem", height: "3rem" }}
                    >
                      <span className="visually-hidden">Đang quét...</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="text-center mb-4">
                <div className={`fw-bold fs-5 mb-2 ${getStatusColor()}`}>
                  {status}
                </div>

                <div className="progress mb-3" style={{ height: "8px" }}>
                  <div
                    className="progress-bar"
                    role="progressbar"
                    style={{
                      width: `${(currentAttempt / MAX_ATTEMPTS) * 100}%`,
                      backgroundColor:
                        currentAttempt === MAX_ATTEMPTS ? "#dc3545" : "#0d6efd",
                    }}
                  ></div>
                </div>
                <small className="text-muted">
                  Đã thử: {currentAttempt}/{MAX_ATTEMPTS} lần • Lần thử hiện
                  tại: {displayDetectionCount}/{DETECTION_PER_ATTEMPT} lần
                  detect
                </small>

                {matchInfo && (
                  <div className="alert alert-info py-2 px-3 d-inline-block mt-2">
                    <small>
                      <strong>{matchInfo.username}</strong> • Lần thử:{" "}
                      <strong>{matchInfo.attempt}</strong> • Độ tương đồng:{" "}
                      <strong>
                        {(100 - matchInfo.distance * 100).toFixed(1)}%
                      </strong>
                    </small>
                  </div>
                )}
              </div>

              <div className="d-flex gap-3 justify-content-center mb-4 flex-wrap">
                <button
                  onClick={start}
                  className="btn btn-primary btn-lg px-4"
                  disabled={!modelsLoaded || isScanning}
                >
                  <i className="fas fa-camera me-2"></i>
                  {modelsLoaded ? "Bật Camera" : "Đang tải..."}
                </button>

                <button
                  onClick={stopCamera}
                  className="btn btn-outline-secondary btn-lg px-4"
                  disabled={!isScanning}
                >
                  <i className="fas fa-stop me-2"></i>
                  Dừng
                </button>
              </div>

              <div className="row text-center">
                <div className="col-6">
                  <div className="border-end">
                    <div className="text-primary fw-bold fs-4">
                      {users.length}
                    </div>
                    <small className="text-muted">Người dùng đã đăng ký</small>
                  </div>
                </div>
                <div className="col-6">
                  <div>
                    <div className="text-success fw-bold fs-4">
                      {modelsLoaded ? "✓" : "..."}
                    </div>
                    <small className="text-muted">Hệ thống sẵn sàng</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Đăng Nhập Thành Công */}
            <Modal
              show={showSuccessModal}
              onHide={handleCloseSuccessModal}
              size="lg"
              centered
              scrollable
            >
              <Modal.Header closeButton className="bg-success text-white">
                <Modal.Title>🎉 Đăng Nhập Thành Công</Modal.Title>
              </Modal.Header>

              <Modal.Body>
                <div className="alert alert-success">
                  <strong>Trạng thái:</strong> {status}
                </div>

                {matchInfo && (
                  <div className="alert alert-info">
                    <h6>Thông tin nhận diện:</h6>
                    <p>
                      <strong>Username:</strong> {matchInfo.username}
                    </p>
                    <p>
                      <strong>Lần thử thành công:</strong> {matchInfo.attempt}
                    </p>
                    <p>
                      <strong>Độ tin cậy khuôn mặt:</strong>{" "}
                      {matchInfo.confidence}%
                    </p>
                    <p>
                      <strong>Độ tương đồng:</strong>{" "}
                      {(100 - matchInfo.distance * 100).toFixed(1)}%
                    </p>
                    <p>
                      <strong>Khoảng cách:</strong>{" "}
                      {matchInfo.distance.toFixed(4)}
                    </p>
                    <p>
                      <strong>Ngưỡng chấp nhận:</strong> {USER_DISTANCE}
                    </p>
                  </div>
                )}

                <div className="mt-3">
                  <h6>📊 Kết quả so sánh với tất cả người dùng:</h6>
                  <div className="table-responsive">
                    <table className="table table-sm table-striped">
                      <thead>
                        <tr>
                          <th>Username</th>
                          <th>Độ tương đồng</th>
                          <th>Khoảng cách</th>
                          <th>Trạng thái</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allMatches.map((match, index) => (
                          <tr
                            key={index}
                            className={
                              match.status === "✅ Khớp" ? "table-success" : ""
                            }
                          >
                            <td>{match.username}</td>
                            <td>{match.similarity || "N/A"}%</td>
                            <td>
                              {typeof match.distance === "number"
                                ? match.distance.toFixed(4)
                                : match.distance}
                            </td>
                            <td>
                              {match.status ||
                                (match.error && `❌ ${match.error}`)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </Modal.Body>

              <Modal.Footer>
                <Button variant="secondary" onClick={handleCloseSuccessModal}>
                  Đóng
                </Button>
                <Button
                  variant="success"
                  onClick={() => {
                    handleLogin(id);
                    handleCloseSuccessModal();
                  }}
                >
                  Xác Nhận Đăng Nhập
                </Button>
              </Modal.Footer>
            </Modal>

            {/* Modal Đăng Nhập Thất Bại */}
            <Modal
              show={showFailModal}
              onHide={handleCloseFailModal}
              size="lg"
              centered
              scrollable
            >
              <Modal.Header closeButton className="bg-danger text-white">
                <Modal.Title>❌ Đăng Nhập Thất Bại</Modal.Title>
              </Modal.Header>

              <Modal.Body>
                <div className="alert alert-danger">
                  <strong>Lỗi:</strong> {status}
                </div>

                <div className="mt-3">
                  <h6>📊 Kết quả {MAX_ATTEMPTS} lần thử:</h6>
                  <div className="table-responsive">
                    <table className="table table-sm table-striped">
                      <thead>
                        <tr>
                          <th>Lần thử</th>
                          <th>Thời gian</th>
                          <th>Trạng thái</th>
                          <th>Độ tin cậy</th>
                          <th>Kết quả tốt nhất</th>
                          <th>Số lần detect</th>
                        </tr>
                      </thead>
                      <tbody>
                        {attemptResults.map((result, index) => (
                          <tr key={index}>
                            <td>
                              <strong>#{result.attempt}</strong>
                            </td>
                            <td>{result.timestamp}</td>
                            <td>
                              {result.status === "Đã phát hiện" ? (
                                <span className="badge bg-info">
                                  Đã phát hiện
                                </span>
                              ) : result.status === "Lỗi" ? (
                                <span className="badge bg-danger">Lỗi</span>
                              ) : (
                                <span className="badge bg-warning">
                                  Thất bại
                                </span>
                              )}
                            </td>
                            <td>{result.confidence || "N/A"}%</td>
                            <td>
                              {result.bestMatch ? (
                                <span>
                                  {result.bestMatch.user.username} (
                                  {(
                                    100 -
                                    result.bestMatch.distance * 100
                                  ).toFixed(1)}
                                  %)
                                </span>
                              ) : (
                                <span className="text-muted">
                                  {result.reason || "Không có"}
                                </span>
                              )}
                            </td>
                            <td>{result.detectionCount || "N/A"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="alert alert-warning mt-3">
                  <strong>💡 Gợi ý:</strong>
                  <ul className="mb-0">
                    <li>Kiểm tra ánh sáng và vị trí khuôn mặt</li>
                    <li>Đảm bảo khuôn mặt không bị che khuất</li>
                    <li>Thử lại với khoảng cách phù hợp</li>
                    <li>
                      Hệ thống đã thử {MAX_ATTEMPTS} lần nhưng không thành công
                    </li>
                  </ul>
                </div>
              </Modal.Body>

              <Modal.Footer>
                <Button variant="secondary" onClick={handleCloseFailModal}>
                  Đóng
                </Button>
                <Button variant="primary" onClick={retryScan}>
                  <i className="fas fa-redo me-2"></i>
                  Thử Lại
                </Button>
              </Modal.Footer>
            </Modal>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceLogin;
