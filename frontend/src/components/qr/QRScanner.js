// QRScanner.js - Simple & Stable Version with jsQR
import React, { useState, useEffect, useRef } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Button,
  Alert,
  Badge,
  Modal,
  ProgressBar,
} from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import jsQR from "jsqr";
import NotificationService from "../../services/notificationService";
import api from "../../services/api";
import "./QRScanner.css";

const QRScanPage = () => {
  const navigate = useNavigate();

  // --- States ---
  const [error, setError] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scanResult, setScanResult] = useState("");
  const [activeMode, setActiveMode] = useState("camera");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showResultModal, setShowResultModal] = useState(false);
  const [processingImage, setProcessingImage] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // --- Refs ---
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const scanInProgressRef = useRef(false);

  // --- Effects ---
  useEffect(() => {
    // Load lịch sử
    const savedHistory = localStorage.getItem("qrScanHistory");
    if (savedHistory) {
      try {
        setScanHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Lỗi đọc lịch sử", e);
      }
    }

    // Cleanup khi unmount
    return () => {
      stopCamera();
    };
  }, []);

  useEffect(() => {
    if (activeMode === "camera") {
      startCamera();
    } else {
      stopCamera();
    }
  }, [activeMode]);

  // --- Camera Logic với jsQR ---
  const startCamera = async () => {
    try {
      setError(null);
      setIsScanning(false);

      // Dừng camera cũ nếu có
      stopCamera();

      // Yêu cầu quyền truy cập camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        setIsScanning(true);
        scanQRCode(); // Bắt đầu quét
      }
    } catch (err) {
      console.error("Lỗi camera:", err);
      handleError(err);
    }
  };

  const stopCamera = () => {
    // Dừng animation frame
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    // Dừng stream camera
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    // Clear video source
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsScanning(false);
  };

  const scanQRCode = () => {
    if (!videoRef.current || !canvasRef.current || scanInProgressRef.current) {
      return;
    }

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    // Nếu video chưa sẵn sàng, thử lại
    if (video.readyState !== video.HAVE_ENOUGH_DATA) {
      animationFrameRef.current = requestAnimationFrame(scanQRCode);
      return;
    }

    // Set kích thước canvas bằng video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Vẽ frame hiện tại lên canvas
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Lấy image data để quét
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const code = jsQR(imageData.data, imageData.width, imageData.height, {
      inversionAttempts: "dontInvert",
    });

    // Nếu tìm thấy QR code
    if (code) {
      console.log("✅ QR Code found:", code.data);
      handleScanSuccess(code.data);
      return; // Dừng quét tạm thời
    }

    // Tiếp tục quét
    animationFrameRef.current = requestAnimationFrame(scanQRCode);
  };

  const resumeScanning = () => {
    scanInProgressRef.current = false;
    if (isScanning) {
      scanQRCode();
    }
  };

  // --- Handlers xử lý kết quả ---
  const handleScanSuccess = async (decodedText) => {
    if (scanInProgressRef.current) return;
    scanInProgressRef.current = true;

    // Tạm dừng quét
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    try {
      setScanResult(decodedText);
      setLoading(true);
      setShowResultModal(true);

      const processedResult = await processQRCode(decodedText);

      // Lưu lịch sử
      addToHistory({
        data: decodedText,
        type: processedResult.type,
        timestamp: new Date().toISOString(),
        success: true,
      });

      // Xử lý hành động cụ thể
      await handleScanResult(processedResult);
    } catch (error) {
      console.error("❌ Error processing:", error);
      addToHistory({
        data: decodedText,
        type: "unknown",
        timestamp: new Date().toISOString(),
        success: false,
        error: error.message,
      });
      NotificationService.error({
        title: "Lỗi xử lý",
        text: error.message || "Không thể xử lý QR code này",
      });
      resumeScanning();
    } finally {
      setLoading(false);
    }
  };

  const processQRCode = async (data) => {
    if (data.includes("/profile/")) return { type: "user_profile", data };
    if (data.includes("/group/")) return { type: "group", data };
    if (data.includes("/chat/")) return { type: "chat", data };
    if (data.includes("/event/")) return { type: "event", data };
    if (data.includes("/checkin/")) return { type: "checkin", data };
    if (data.startsWith("auth:")) return { type: "authentication", data };
    if (data.startsWith("http")) return { type: "website", data };
    if (data.startsWith("WIFI:")) return { type: "wifi", data };
    if (data.startsWith("BEGIN:VCARD")) return { type: "vcard", data };
    try {
      const jsonData = JSON.parse(data);
      return { type: "json_data", data: jsonData };
    } catch {
      return { type: "text", data };
    }
  };

  const handleScanResult = async (result) => {
    switch (result.type) {
      case "user_profile":
        await handleUserProfile(result.data);
        break;
      case "group":
        await handleGroup(result.data);
        break;
      case "chat":
        await handleChat(result.data);
        break;
      case "checkin":
        await handleCheckIn(result.data);
        break;
      case "authentication":
        await handleAuthentication(result.data);
        break;
      case "website":
        window.open(result.data, "_blank");
        resumeScanning();
        break;
      case "wifi":
        handleWifiConnection(result.data);
        resumeScanning();
        break;
      case "vcard":
        handleVCard(result.data);
        resumeScanning();
        break;
      case "json_data":
        NotificationService.info({
          title: "Dữ liệu JSON",
          text: JSON.stringify(result.data, null, 2),
        });
        resumeScanning();
        break;
      default:
        NotificationService.info({
          title: "Nội dung QR Code",
          text: result.data,
        });
        resumeScanning();
    }
  };

  // --- Các hàm nghiệp vụ ---
  const handleUserProfile = async (profileUrl) => {
    const userId = extractUserIdFromUrl(profileUrl);
    if (userId) {
      try {
        const response = await api.get(`/api/users/${userId}`);
        if (response.data.success) {
          setTimeout(() => {
            navigate(`/profile/${userId}`);
            NotificationService.success({
              title: "Thành công!",
              text: `Đang chuyển đến profile của ${response.data.data.fullName}`,
            });
          }, 1500);
        }
      } catch (error) {
        throw new Error("Không tìm thấy người dùng");
      }
    } else {
      throw new Error("URL profile không hợp lệ");
    }
  };

  const handleGroup = async (groupUrl) => {
    const groupId = extractIdFromUrl(groupUrl, "group");
    if (groupId) {
      setTimeout(() => {
        navigate(`/group/${groupId}`);
        NotificationService.info({
          title: "Tham gia nhóm",
          text: "Đang chuyển đến trang nhóm...",
        });
      }, 1500);
    }
  };

  const handleChat = async (chatUrl) => {
    const chatId = extractIdFromUrl(chatUrl, "chat");
    if (chatId) {
      setTimeout(() => {
        navigate(`/chat/${chatId}`);
        NotificationService.info({
          title: "Tham gia chat",
          text: "Đang chuyển đến phòng chat...",
        });
      }, 1500);
    }
  };

  const handleCheckIn = async (checkinUrl) => {
    const checkinId = extractIdFromUrl(checkinUrl, "checkin");
    if (checkinId) {
      NotificationService.success({
        title: "Điểm danh thành công!",
        text: "Bạn đã điểm danh thành công",
      });
      resumeScanning();
    }
  };

  const handleAuthentication = async (authData) => {
    const token = authData.replace("auth:", "");
    NotificationService.info({
      title: "Xác thực QR",
      text: "Đang xử lý đăng nhập...",
    });
    resumeScanning();
  };

  const handleWifiConnection = (wifiData) => {
    NotificationService.info({
      title: "Thông tin WiFi",
      text: `Quét thành công thông tin WiFi: ${wifiData}`,
    });
  };

  const handleVCard = (vcardData) => {
    NotificationService.info({
      title: "Danh thiếp",
      text: "Đã quét thành công danh thiếp",
    });
  };

  // --- Helpers ---
  const extractUserIdFromUrl = (url) => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/");
      const profileIndex = pathParts.indexOf("profile");
      return profileIndex !== -1 ? pathParts[profileIndex + 1] : null;
    } catch {
      const match = url.match(/profile\/([a-fA-F0-9]{24})/);
      return match ? match[1] : null;
    }
  };

  const extractIdFromUrl = (url, type) => {
    try {
      const urlObj = new URL(url);
      const pathParts = urlObj.pathname.split("/");
      const typeIndex = pathParts.indexOf(type);
      return typeIndex !== -1 ? pathParts[typeIndex + 1] : null;
    } catch {
      const match = new RegExp(`${type}/([a-fA-F0-9]{24})`).exec(url);
      return match ? match[1] : null;
    }
  };

  const handleError = (err) => {
    let msg = "Không thể khởi động camera.";
    if (err.name === "NotAllowedError" || err.message?.includes("Permission")) {
      msg =
        "Quyền truy cập camera bị từ chối. Vui lòng cấp quyền trong cài đặt trình duyệt.";
    } else if (err.name === "NotFoundError") {
      msg = "Không tìm thấy camera trên thiết bị.";
    } else if (err.name === "NotReadableError") {
      msg = "Camera đang được sử dụng bởi ứng dụng khác hoặc bị lỗi phần cứng.";
    }
    setError(msg);
  };

  // --- Upload Logic ---
  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    if (file) processImageFile(file);
    event.target.value = "";
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const processImageFile = (file) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      NotificationService.error({ title: "Lỗi", text: "File quá lớn (>5MB)" });
      return;
    }

    setProcessingImage(true);
    setUploadProgress(20);

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        setUploadProgress(60);

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        canvas.width = img.width;
        canvas.height = img.height;
        context.drawImage(img, 0, 0);

        const imageData = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height
        );
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });

        setUploadProgress(100);

        if (code) {
          setTimeout(() => {
            handleScanSuccess(code.data);
            setProcessingImage(false);
            setUploadProgress(0);
          }, 500);
        } else {
          setProcessingImage(false);
          setUploadProgress(0);
          NotificationService.error({
            title: "Lỗi",
            text: "Không tìm thấy mã QR trong ảnh này",
          });
        }
      };
      img.src = e.target.result;
    };

    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  const handleModeChange = (mode) => {
    setActiveMode(mode);
    setError(null);
  };

  const handleCloseResultModal = () => {
    setShowResultModal(false);
    resumeScanning();
  };

  const handleRestartScanner = () => {
    stopCamera();
    startCamera();
  };

  const addToHistory = (scanItem) => {
    const newHistory = [scanItem, ...scanHistory.slice(0, 19)];
    setScanHistory(newHistory);
    localStorage.setItem("qrScanHistory", JSON.stringify(newHistory));
  };

  const clearHistory = () => {
    setScanHistory([]);
    localStorage.removeItem("qrScanHistory");
    NotificationService.success({
      title: "Thành công",
      text: "Đã xóa lịch sử quét",
    });
  };

  const getTypeIcon = (type) => {
    const icons = {
      user_profile: "fas fa-user",
      group: "fas fa-users",
      chat: "fas fa-comments",
      event: "fas fa-calendar",
      checkin: "fas fa-check-circle",
      authentication: "fas fa-fingerprint",
      website: "fas fa-globe",
      wifi: "fas fa-wifi",
      vcard: "fas fa-address-card",
      json_data: "fas fa-code",
      text: "fas fa-align-left",
      unknown: "fas fa-question",
    };
    return icons[type] || icons.unknown;
  };

  const getTypeColor = (type) => {
    const colors = {
      user_profile: "primary",
      group: "success",
      chat: "info",
      event: "warning",
      checkin: "danger",
      authentication: "secondary",
      website: "primary",
      wifi: "info",
      vcard: "dark",
      json_data: "dark",
      text: "secondary",
      unknown: "light",
    };
    return colors[type] || colors.unknown;
  };

  const getTypeName = (type) => {
    const names = {
      user_profile: "Profile",
      group: "Nhóm",
      chat: "Chat",
      event: "Sự kiện",
      checkin: "Điểm danh",
      authentication: "Xác thực",
      website: "Website",
      wifi: "WiFi",
      vcard: "Danh thiếp",
      json_data: "Dữ liệu JSON",
      text: "Văn bản",
      unknown: "Không xác định",
    };
    return names[type] || names.unknown;
  };

  return (
    <Container className="qr-scan-page py-4">
      <Row className="justify-content-center">
        <Col md={10} lg={8}>
          {/* Header */}
          <div className="text-center mb-4">
            <h1 className="display-5 fw-bold text-white mb-3">
              <i className="fas fa-qrcode me-3"></i>
              Quét QR Code
            </h1>
            <p className="text-light mb-4">
              Quét mã QR để kết nối với bạn bè, tham gia nhóm, điểm danh và
              nhiều tính năng khác
            </p>
          </div>

          {/* Mode Switch */}
          <div className="mode-switch mb-4">
            <button
              className={`mode-btn ${activeMode === "camera" ? "active" : ""}`}
              onClick={() => handleModeChange("camera")}
              disabled={loading || processingImage}
            >
              <i className="fas fa-camera me-2"></i>
              Quét Camera
            </button>
            <button
              className={`mode-btn ${activeMode === "upload" ? "active" : ""}`}
              onClick={() => handleModeChange("upload")}
              disabled={loading || processingImage}
            >
              <i className="fas fa-upload me-2"></i>
              Tải ảnh lên
            </button>
          </div>

          {/* Scanner Card */}
          <Card className="scanner-card shadow-lg">
            <Card.Header className="bg-primary text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i
                  className={`fas ${
                    activeMode === "camera" ? "fa-camera" : "fa-upload"
                  } me-2`}
                ></i>
                {activeMode === "camera"
                  ? "Máy quét QR Code"
                  : "Tải ảnh QR Code lên"}
              </h5>
              <Badge bg="light" text="dark">
                <i
                  className="fas fa-circle me-1"
                  style={{
                    color: isScanning ? "#28a745" : "#6c757d",
                    fontSize: "8px",
                  }}
                ></i>
                {isScanning ? "Đang chạy" : "Tạm dừng"}
              </Badge>
            </Card.Header>
            <Card.Body className="p-0">
              {error ? (
                <div className="p-4 text-center">
                  <Alert variant="danger" className="mb-3">
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    {error}
                  </Alert>
                  <Button
                    variant="outline-secondary"
                    onClick={() => {
                      setError(null);
                      startCamera();
                    }}
                  >
                    <i className="fas fa-redo me-2"></i>
                    Thử lại
                  </Button>
                </div>
              ) : activeMode === "camera" ? (
                <div
                  className="scanner-container"
                  style={{ position: "relative", minHeight: "400px" }}
                >
                  {/* Video element cho camera */}
                  <video
                    ref={videoRef}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover",
                      minHeight: "400px",
                    }}
                    playsInline
                    muted
                  />

                  {/* Canvas ẩn để xử lý ảnh */}
                  <canvas ref={canvasRef} style={{ display: "none" }} />

                  {/* Overlay với khung quét */}
                  {isScanning && (
                    <div className="scanner-overlay">
                      <div className="viewfinder">
                        <div className="corner top-left"></div>
                        <div className="corner top-right"></div>
                        <div className="corner bottom-left"></div>
                        <div className="corner bottom-right"></div>
                        <div className="scan-line"></div>
                      </div>
                      <div className="scanner-instructions">
                        <p className="text-white mb-0">
                          Đưa mã QR vào khung hình để quét
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className={`upload-section ${dragOver ? "dragover" : ""}`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={triggerFileInput}
                  style={{
                    cursor: "pointer",
                    minHeight: "400px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    style={{ display: "none" }}
                  />

                  <div className="text-center">
                    {processingImage ? (
                      <div>
                        <div
                          className="spinner-border text-primary mb-3"
                          role="status"
                        ></div>
                        <h5>Đang xử lý ảnh... {uploadProgress}%</h5>
                        <ProgressBar
                          now={uploadProgress}
                          className="mb-2"
                          style={{ width: "200px", margin: "0 auto" }}
                        />
                        <p className="text-muted">Vui lòng chờ giây lát</p>
                      </div>
                    ) : (
                      <>
                        <div className="upload-icon mb-3">
                          <i className="fas fa-cloud-upload-alt fa-3x text-primary"></i>
                        </div>
                        <h5 className="mb-2">Tải ảnh QR Code lên</h5>
                        <p className="text-muted mb-3">
                          Kéo thả ảnh vào đây hoặc click để chọn file
                        </p>
                        <Button variant="outline-primary">
                          <i className="fas fa-folder-open me-2"></i>
                          Chọn ảnh
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </Card.Body>
            <Card.Footer className="bg-light">
              <div className="d-flex justify-content-between align-items-center">
                <Button
                  variant="outline-primary"
                  onClick={handleRestartScanner}
                  disabled={loading || processingImage}
                >
                  <i className="fas fa-sync-alt me-2"></i>
                  {activeMode === "camera" ? "Khởi động lại" : "Làm mới"}
                </Button>

                <div className="text-muted small text-end">
                  <i className="fas fa-info-circle me-1"></i>
                  Hỗ trợ: Profile, Nhóm, Chat, WiFi, Danh thiếp,...
                </div>
              </div>
            </Card.Footer>
          </Card>

          {/* Scan History */}
          {scanHistory.length > 0 && (
            <Card className="mt-4 scanner-card">
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h6 className="mb-0">
                  <i className="fas fa-history me-2"></i>
                  Lịch sử quét gần đây
                  <Badge bg="primary" className="ms-2">
                    {scanHistory.length}
                  </Badge>
                </h6>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={clearHistory}
                >
                  <i className="fas fa-trash me-1"></i>
                  Xóa
                </Button>
              </Card.Header>
              <Card.Body>
                <div className="scan-history">
                  {scanHistory.slice(0, 5).map((item, index) => (
                    <div
                      key={index}
                      className={`scan-history-item ${
                        item.success ? "success" : "error"
                      }`}
                    >
                      <div className="d-flex align-items-center">
                        <i
                          className={`${getTypeIcon(
                            item.type
                          )} text-${getTypeColor(item.type)} me-3 fs-5`}
                        ></i>
                        <div className="flex-grow-1">
                          <div
                            className="fw-medium text-truncate"
                            style={{ maxWidth: "250px" }}
                          >
                            {item.data}
                          </div>
                          <small className="text-muted">
                            {new Date(item.timestamp).toLocaleTimeString()} •
                            <Badge
                              bg={getTypeColor(item.type)}
                              className="ms-1"
                              text="light"
                            >
                              {getTypeName(item.type)}
                            </Badge>
                          </small>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Features Grid */}
          <Row className="mt-4 g-3">
            <Col md={6} lg={3}>
              <Card className="h-100 text-center feature-card">
                <Card.Body>
                  <i className="fas fa-user-friends fa-2x text-primary mb-3"></i>
                  <h6>Kết nối bạn bè</h6>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} lg={3}>
              <Card className="h-100 text-center feature-card">
                <Card.Body>
                  <i className="fas fa-users fa-2x text-success mb-3"></i>
                  <h6>Tham gia nhóm</h6>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} lg={3}>
              <Card className="h-100 text-center feature-card">
                <Card.Body>
                  <i className="fas fa-check-circle fa-2x text-warning mb-3"></i>
                  <h6>Điểm danh</h6>
                </Card.Body>
              </Card>
            </Col>
            <Col md={6} lg={3}>
              <Card className="h-100 text-center feature-card">
                <Card.Body>
                  <i className="fas fa-wifi fa-2x text-info mb-3"></i>
                  <h6>Kết nối WiFi</h6>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* Result Modal */}
      <Modal
        show={showResultModal}
        onHide={handleCloseResultModal}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton className="bg-success text-white">
          <Modal.Title>
            <i className="fas fa-check-circle me-2"></i>
            Quét thành công!
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-4">
          {loading && (
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          )}
          <h5 className="mt-3">Đã tìm thấy mã QR</h5>
          <code
            className="bg-light p-3 rounded d-block text-start mt-3"
            style={{
              maxHeight: "150px",
              overflow: "auto",
              wordBreak: "break-all",
            }}
          >
            {scanResult}
          </code>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseResultModal}>
            Đóng
          </Button>
          <Button variant="primary" onClick={handleCloseResultModal}>
            Tiếp tục quét
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default QRScanPage;
