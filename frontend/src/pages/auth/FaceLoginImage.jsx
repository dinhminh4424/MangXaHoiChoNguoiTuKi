import React, { useRef, useState, useEffect } from "react";
import api from "../../services/api";
import * as faceapi from "face-api.js";
import { Modal, Button } from "react-bootstrap";

const FaceLogin = () => {
  const USER_DISTANCE = 0.22;

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [status, setStatus] = useState("Bật camera để chụp ảnh nhận diện");
  const [users, setUsers] = useState([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [isCameraOn, setIsCameraOn] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [capturedImage, setCapturedImage] = useState(null);
  const [showCapture, setShowCapture] = useState(false);

  // Modal states
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showFailModal, setShowFailModal] = useState(false);
  const [matchInfo, setMatchInfo] = useState(null);
  const [allMatches, setAllMatches] = useState([]);
  const [userId, setUserId] = useState(null);

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
        setStatus("Hệ thống đã sẵn sàng - Bật camera để chụp ảnh");
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

  const startCamera = async () => {
    if (!modelsLoaded) {
      setStatus("Hệ thống chưa sẵn sàng");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      videoRef.current.srcObject = stream;
      setIsCameraOn(true);
      setStatus("📷 Camera đã bật - Điều chỉnh khuôn mặt và chụp ảnh");
      setCapturedImage(null);
      setShowCapture(false);
    } catch (error) {
      console.error("Lỗi camera:", error);
      setStatus("❌ Lỗi truy cập camera. Vui lòng cho phép quyền camera.");
    }
  };

  const captureImage = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;

    if (!video || !canvas) return;

    const context = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Vẽ ảnh từ video lên canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Chuyển canvas thành data URL
    const imageDataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setCapturedImage(imageDataUrl);
    setShowCapture(true);

    // Tắt camera sau khi chụp
    stopCamera();

    setStatus("✅ Đã chụp ảnh - Đang xử lý nhận diện...");

    // Bắt đầu xử lý nhận diện
    processCapturedImage(imageDataUrl);
  };

  const processCapturedImage = async (imageDataUrl) => {
    setIsProcessing(true);

    try {
      const img = new Image();
      img.onload = async () => {
        try {
          setStatus("🔍 Đang nhận diện khuôn mặt...");

          const detection = await faceapi
            .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();

          if (detection) {
            const confidence = (detection.detection.score * 100).toFixed(1);
            console.log(`Đã phát hiện khuôn mặt, độ tin cậy: ${confidence}%`);

            setStatus(`✅ Đã phát hiện khuôn mặt (${confidence}%)`);

            const desc = Array.from(detection.descriptor);
            const matchResult = findMatch(desc);

            if (matchResult.bestMatch) {
              setMatchInfo({
                username: matchResult.bestMatch.user.username,
                distance: matchResult.bestMatch.distance,
                confidence: confidence,
                userId: matchResult.bestMatch.user._id,
              });

              setAllMatches(matchResult.allMatches);
              setUserId(matchResult.bestMatch.user._id);

              if (matchResult.bestMatch.distance < USER_DISTANCE) {
                setStatus(
                  `🎉 Đã nhận diện: ${matchResult.bestMatch.user.username}`
                );
                setShowSuccessModal(true);
              } else {
                setStatus(
                  `⚠️ Độ tương đồng thấp: ${(
                    matchResult.bestMatch.distance * 100
                  ).toFixed(1)}%`
                );
                setShowFailModal(true);
              }
            } else {
              setStatus("❌ Không tìm thấy người dùng phù hợp");
              setAllMatches(matchResult.allMatches);
              setShowFailModal(true);
            }
          } else {
            setStatus("❌ Không phát hiện khuôn mặt trong ảnh");
            setShowFailModal(true);
          }
        } catch (error) {
          console.error("Lỗi nhận diện:", error);
          setStatus("❌ Lỗi nhận diện khuôn mặt");
          setShowFailModal(true);
        } finally {
          setIsProcessing(false);
        }
      };
      img.src = imageDataUrl;
    } catch (error) {
      console.error("Lỗi xử lý ảnh:", error);
      setStatus("❌ Lỗi xử lý ảnh");
      setIsProcessing(false);
      setShowFailModal(true);
    }
  };

  const findMatch = (queryDescriptor) => {
    if (users.length === 0) {
      console.log("Không có users nào trong database");
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
          userId: user._id,
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

    // Sắp xếp theo độ tương đồng giảm dần
    allMatches.sort((a, b) => {
      if (a.distance === "N/A") return 1;
      if (b.distance === "N/A") return -1;
      return a.distance - b.distance;
    });

    return { bestMatch, allMatches };
  };

  const handleLogin = async () => {
    try {
      setStatus("🔐 Đang đăng nhập...");
      const res = await api.post("/api/auth/face-login", { userId });

      if (res.data.success) {
        localStorage.setItem("token", res.data.token);
        setStatus("🎉 Đăng nhập thành công!");

        setTimeout(() => {
          window.location.href = "/profile";
        }, 1500);
      } else {
        setStatus("❌ Đăng nhập thất bại");
      }
    } catch (error) {
      console.error("Lỗi login:", error);
      setStatus("❌ Lỗi đăng nhập");
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
      setIsCameraOn(false);
    }
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    setShowCapture(false);
    setMatchInfo(null);
    setAllMatches([]);
    setShowSuccessModal(false);
    setShowFailModal(false);
    setStatus("📷 Chụp lại ảnh - Bật camera để bắt đầu");
  };

  const retryScan = () => {
    setShowFailModal(false);
    setMatchInfo(null);
    setAllMatches([]);
    startCamera();
  };

  // Cleanup
  useEffect(() => {
    return () => stopCamera();
  }, []);

  const getStatusColor = () => {
    if (status.includes("❌")) return "text-danger";
    if (status.includes("✅") || status.includes("🎉")) return "text-success";
    if (status.includes("⚠️")) return "text-warning";
    if (status.includes("🔍") || status.includes("🔐") || status.includes("📷"))
      return "text-info";
    return "text-muted";
  };

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-md-8 col-lg-6">
          <div className="card border-0 shadow-lg">
            <div className="card-header bg-gradient-primary text-white text-center py-4">
              <div className="d-flex align-items-center justify-content-center mb-2">
                <i className="fas fa-camera fa-2x me-3"></i>
                <div>
                  <h2 className="h3 mb-0">Đăng Nhập Bằng Khuôn Mặt</h2>
                  <p className="mb-0 opacity-75">
                    Chụp ảnh - Nhận diện - Đăng nhập
                  </p>
                </div>
              </div>
            </div>

            <div className="card-body p-4">
              {/* Video Preview hoặc Ảnh đã chụp */}
              <div className="position-relative mb-4">
                {!showCapture ? (
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
                      display: isCameraOn ? "block" : "none",
                    }}
                  />
                ) : (
                  <div className="text-center">
                    <img
                      src={capturedImage}
                      alt="Ảnh đã chụp"
                      className="w-100 rounded-3 shadow-sm"
                      style={{
                        maxHeight: "400px",
                        backgroundColor: "#f8f9fa",
                        border: "2px solid #e9ecef",
                      }}
                    />
                    <div className="mt-2 text-muted small">
                      📸 Ảnh đã chụp - {new Date().toLocaleTimeString()}
                    </div>
                  </div>
                )}

                {/* Canvas ẩn để chụp ảnh */}
                <canvas ref={canvasRef} style={{ display: "none" }} />

                {!isCameraOn && !showCapture && (
                  <div className="text-center py-5 bg-light rounded-3">
                    <i className="fas fa-camera fa-3x text-muted mb-3"></i>
                    <p className="text-muted">Camera chưa được bật</p>
                  </div>
                )}

                {isProcessing && (
                  <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-light bg-opacity-75 rounded-3">
                    <div className="text-center">
                      <div
                        className="spinner-border text-primary mb-3"
                        style={{ width: "3rem", height: "3rem" }}
                      >
                        <span className="visually-hidden">Đang xử lý...</span>
                      </div>
                      <div className="text-primary fw-bold">
                        Đang xử lý ảnh...
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Status */}
              <div className="text-center mb-4">
                <div className={`fw-bold fs-5 mb-2 ${getStatusColor()}`}>
                  {status}
                </div>
              </div>

              {/* Control Buttons */}
              <div className="d-flex gap-3 justify-content-center mb-4 flex-wrap">
                {!isCameraOn && !showCapture && (
                  <button
                    onClick={startCamera}
                    className="btn btn-primary btn-lg px-4"
                    disabled={!modelsLoaded}
                  >
                    <i className="fas fa-camera me-2"></i>
                    {modelsLoaded ? "Bật Camera" : "Đang tải..."}
                  </button>
                )}

                {isCameraOn && !showCapture && (
                  <button
                    onClick={captureImage}
                    className="btn btn-success btn-lg px-4"
                  >
                    <i className="fas fa-camera me-2"></i>
                    Chụp Ảnh
                  </button>
                )}

                {showCapture && (
                  <button
                    onClick={retakePhoto}
                    className="btn btn-warning btn-lg px-4"
                  >
                    <i className="fas fa-redo me-2"></i>
                    Chụp Lại
                  </button>
                )}

                {isCameraOn && (
                  <button
                    onClick={stopCamera}
                    className="btn btn-outline-secondary btn-lg px-4"
                  >
                    <i className="fas fa-stop me-2"></i>
                    Tắt Camera
                  </button>
                )}
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
                    Bật camera và chụp ảnh
                  </div>
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
                </div>
              </div>
            </div>

            <div className="card-footer bg-transparent text-center py-3">
              <small className="text-muted">
                <i className="fas fa-shield-alt me-1"></i>
                Hệ thống sử dụng AI để bảo vệ thông tin của bạn
              </small>
            </div>

            {/* Modal Đăng Nhập Thành Công */}
            <Modal
              show={showSuccessModal}
              onHide={() => setShowSuccessModal(false)}
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
                    <h6>Thông tin khớp:</h6>
                    <p>
                      <strong>Username:</strong> {matchInfo.username}
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
                <Button
                  variant="secondary"
                  onClick={() => setShowSuccessModal(false)}
                >
                  Đóng
                </Button>
                <Button
                  variant="success"
                  onClick={() => {
                    handleLogin();
                    setShowSuccessModal(false);
                  }}
                >
                  Tiếp tục đăng nhập
                </Button>
              </Modal.Footer>
            </Modal>

            {/* Modal Đăng Nhập Thất Bại */}
            <Modal
              show={showFailModal}
              onHide={() => setShowFailModal(false)}
              size="lg"
              centered
            >
              <Modal.Header closeButton className="bg-danger text-white">
                <Modal.Title>❌ Đăng Nhập Thất Bại</Modal.Title>
              </Modal.Header>

              <Modal.Body>
                <div className="alert alert-danger">
                  <strong>Lỗi:</strong> {status}
                </div>

                {matchInfo && (
                  <div className="alert alert-warning">
                    <h6>Thông tin khớp tốt nhất:</h6>
                    <p>
                      <strong>Username:</strong> {matchInfo.username}
                    </p>
                    <p>
                      <strong>Độ tương đồng:</strong>{" "}
                      {(100 - matchInfo.distance * 100).toFixed(1)}%
                    </p>
                    <p>
                      <strong>Khoảng cách:</strong>{" "}
                      {matchInfo.distance.toFixed(4)}
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
                          <tr key={index}>
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

                <div className="alert alert-info mt-3">
                  <strong>💡 Gợi ý:</strong>
                  <ul className="mb-0">
                    <li>Kiểm tra ánh sáng và vị trí khuôn mặt</li>
                    <li>Đảm bảo khuôn mặt không bị che khuất</li>
                    <li>Thử lại với khoảng cách phù hợp</li>
                    <li>Đảm bảo khuôn mặt nhìn thẳng camera</li>
                  </ul>
                </div>
              </Modal.Body>

              <Modal.Footer>
                <Button
                  variant="secondary"
                  onClick={() => setShowFailModal(false)}
                >
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
