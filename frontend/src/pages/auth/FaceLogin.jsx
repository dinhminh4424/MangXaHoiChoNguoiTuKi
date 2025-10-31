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

import React, { useRef, useState, useEffect } from "react";
import api from "../../services/api";
import * as faceapi from "face-api.js";

const FaceLogin = () => {
  const videoRef = useRef(null);
  const [status, setStatus] = useState("Bật camera để bắt đầu đăng nhập");
  const [users, setUsers] = useState([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [matchInfo, setMatchInfo] = useState(null);

  // Load face-api.js models
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

  // Load users
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

      // Đợi video bắt đầu
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
    let attempts = 0;

    const check = async () => {
      if (attempts++ > 100) {
        setStatus("⏰ Không phát hiện khuôn mặt. Vui lòng thử lại.");
        setIsScanning(false);
        return;
      }

      try {
        const detection = await faceapi
          .detectSingleFace(video, new faceapi.TinyFaceDetectorOptions())
          .withFaceLandmarks()
          .withFaceDescriptor();

        if (detection) {
          const confidence = (detection.detection.score * 100).toFixed(1);
          console.log(`Đã phát hiện khuôn mặt, độ tin cậy: ${confidence}%`);

          setStatus(`✅ Đã phát hiện khuôn mặt (${confidence}%)`);

          const desc = Array.from(detection.descriptor);
          const match = findMatch(desc);

          if (match) {
            setMatchInfo({
              username: match.user.username,
              distance: match.distance,
              confidence: confidence,
            });

            if (match.distance < 0.55) {
              setStatus(`🎉 Đã nhận diện: ${match.user.username}`);
              await login(match.user._id);
              return;
            } else {
              setStatus(
                `⚠️ Độ tương đồng thấp: ${(match.distance * 100).toFixed(1)}%`
              );
            }
          } else {
            setStatus("❌ Không tìm thấy người dùng phù hợp");
          }
        } else {
          setStatus("🔍 Đang tìm khuôn mặt...");
        }

        setTimeout(check, 300);
      } catch (error) {
        console.error("Lỗi detect:", error);
        setStatus("❌ Lỗi nhận diện khuôn mặt");
        setIsScanning(false);
      }
    };

    check();
  };

  const findMatch = (queryDescriptor) => {
    if (users.length === 0) {
      console.log("Không có users nào trong database");
      return null;
    }

    let bestMatch = null;
    let minDistance = Infinity;

    users.forEach((user) => {
      try {
        const storedDescriptor = user.profile?.faceDescriptor;

        if (!storedDescriptor || !Array.isArray(storedDescriptor)) {
          return;
        }

        if (storedDescriptor.length !== 128) {
          return;
        }

        const storedFloat32 = new Float32Array(storedDescriptor);
        const queryFloat32 = new Float32Array(queryDescriptor);

        const distance = faceapi.euclideanDistance(queryFloat32, storedFloat32);

        if (distance < minDistance) {
          minDistance = distance;
          bestMatch = { user, distance };
        }
      } catch (error) {
        console.error("Lỗi so sánh với user:", user.username, error);
      }
    });

    return bestMatch;
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
      }
    } catch (error) {
      console.error("Lỗi login:", error);
      setStatus("❌ Lỗi đăng nhập");
      setIsScanning(false);
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

  // Cleanup
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
                    Nhanh chóng - Bảo mật - Tiện lợi
                  </p>
                </div>
              </div>
            </div>

            <div className="card-body p-4">
              {/* Video Preview */}
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

              {/* Status */}
              <div className="text-center mb-4">
                <div className={`fw-bold fs-5 mb-2 ${getStatusColor()}`}>
                  {status}
                </div>

                {/* Match Info */}
                {matchInfo && (
                  <div className="alert alert-info py-2 px-3 d-inline-block">
                    <small>
                      <strong>{matchInfo.username}</strong> • Độ tương đồng:{" "}
                      <strong>
                        {(100 - matchInfo.distance * 100).toFixed(1)}%
                      </strong>
                    </small>
                  </div>
                )}
              </div>

              {/* Control Buttons */}
              <div className="d-flex gap-3 justify-content-center mb-4">
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

              {/* Stats */}
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

              {/* Instructions */}
              <div className="mt-4 p-3 bg-light rounded-3">
                <h6 className="fw-bold mb-2">📝 Hướng dẫn sử dụng:</h6>
                <div className="row small text-muted">
                  <div className="col-md-6">
                    <i className="fas fa-check-circle text-success me-2"></i>
                    Đảm bảo ánh sáng đủ
                  </div>
                  <div className="col-md-6">
                    <i className="fas fa-check-circle text-success me-2"></i>
                    Nhìn thẳng vào camera
                  </div>
                  <div className="col-md-6">
                    <i className="fas fa-check-circle text-success me-2"></i>
                    Giữ khuôn mặt trong khung hình
                  </div>
                  <div className="col-md-6">
                    <i className="fas fa-check-circle text-success me-2"></i>
                    Không đeo kính râm
                  </div>
                </div>
              </div>
            </div>

            <div className="card-footer bg-transparent text-center py-3">
              <small className="text-muted">
                <i className="fas fa-shield-alt me-1"></i>
                Hệ thống sử dụng AI để bảo vệ thông tin của bạn
              </small>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FaceLogin;
