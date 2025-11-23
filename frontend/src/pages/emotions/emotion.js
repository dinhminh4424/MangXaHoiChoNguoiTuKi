import React, { useEffect, useRef, useState, useCallback } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import {
  Button,
  Toast,
  ToastContainer,
  Badge,
  Form,
  Card,
  Modal,
  Row,
  Col,
  ListGroup,
  Alert,
  Spinner,
  ProgressBar,
  Tabs,
  Tab,
} from "react-bootstrap";

// Services
import moodService from "../../services/moodService";
import modelService from "../../services/modelService";
import groupService from "../../services/groupService";

// Constants
const DETECTION_INTERVAL = 2000;
const ALERT_COOLDOWN_MS = 10000;
const ALERT_THRESHOLD = 0.7;
const CONFIRMATION_THRESHOLD = 0.6;
const MAX_WIDTH = 480;
const MAX_HEIGHT = 360;

const EMOJI_MAP = {
  happy: "😊",
  sad: "😢",
  angry: "😠",
  surprised: "😲",
  fearful: "😨",
  disgusted: "🤢",
  neutral: "😐",
};

const EMOTION_LABELS = {
  happy: "Vui vẻ",
  sad: "Buồn",
  angry: "Tức giận",
  surprised: "Ngạc nhiên",
  fearful: "Sợ hãi",
  disgusted: "Chán ghét",
  neutral: "Bình thường",
};

const EMOTION_COLORS = {
  happy: "success",
  sad: "info",
  angry: "danger",
  surprised: "warning",
  fearful: "dark",
  disgusted: "secondary",
  neutral: "primary",
};

const NhanDien = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const detectingRef = useRef(false);
  const lastDetectionTimeRef = useRef(0);
  const lastAlertTimeRef = useRef(0);

  const [status, setStatus] = useState("Đang khởi tạo...");
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [toasts, setToasts] = useState([]);
  const [moodHistory, setMoodHistory] = useState([]);
  const [moodStats, setMoodStats] = useState([]);
  const [supportGroups, setSupportGroups] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState(null);
  const [currentEmotionData, setCurrentEmotionData] = useState(null);
  const [detectedEmotions, setDetectedEmotions] = useState([]);
  const [activeTab, setActiveTab] = useState("realtime");

  // Hàm hiển thị Toast
  const showToast = useCallback((message, variant = "info", emoji = "") => {
    const id = Date.now();
    setToasts((prev) => [
      ...prev,
      { id, message: `${emoji} ${message}`, variant },
    ]);
  }, []);

  // Format date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Vừa xong";
    if (diffMins < 60) return `${diffMins} phút trước`;
    if (diffHours < 24) return `${diffHours} giờ trước`;
    if (diffDays === 1) return "Hôm qua";
    if (diffDays < 7) return `${diffDays} ngày trước`;

    return date.toLocaleDateString("vi-VN");
  };

  // Load models
  useEffect(() => {
    let mounted = true;

    const loadModels = async () => {
      try {
        setLoading(true);
        setStatus("Đang tải AI models...");

        await modelService.ensureModels();

        if (mounted) {
          setModelsLoaded(true);
          setLoading(false);
          setStatus("Models đã sẵn sàng!");
          showToast("AI models đã tải thành công!", "success", "🤖");

          if (user) {
            loadMoodHistory();
            loadMoodStats();
          }
        }
      } catch (err) {
        console.error("Lỗi tải models:", err);
        if (mounted) {
          setError(`Không thể tải AI models: ${err.message}`);
          setLoading(false);
          setStatus("Lỗi tải models");
          showToast("Lỗi tải AI models", "danger", "❌");
        }
      }
    };

    loadModels();

    return () => {
      mounted = false;
    };
  }, [user, showToast]);

  // Load mood history
  const loadMoodHistory = useCallback(async () => {
    if (!user) return;

    try {
      const data = await moodService.getMoodHistory({ limit: 10 });
      if (data.success) {
        setMoodHistory(data.moodLogs);
      }
    } catch (error) {
      console.error("Lỗi tải lịch sử tâm trạng:", error);
    }
  }, [user]);

  // Load mood statistics
  const loadMoodStats = useCallback(async () => {
    if (!user) return;

    try {
      const data = await moodService.getMoodStats("week");
      if (data.success) {
        setMoodStats(data.stats || []);
      }
    } catch (error) {
      console.error("Lỗi tải thống kê tâm trạng:", error);
    }
  }, [user]);

  // Load support groups based on emotion
  const loadSupportGroups = useCallback(async (emotion) => {
    try {
      const data = await groupService.getGroupsByEmotion(emotion);
      if (data.success) {
        setSupportGroups(data.groups || []);
      } else {
        setSupportGroups([]);
      }
    } catch (error) {
      console.error("Lỗi tải nhóm hỗ trợ:", error);
      setSupportGroups([]);
    }
  }, []);

  // Save mood log
  const saveMoodLog = useCallback(
    async (
      emotion,
      intensity,
      detectedFrom = "camera",
      note = "",
      autoSave = false
    ) => {
      if (!user) {
        showToast("Vui lòng đăng nhập để lưu tâm trạng", "warning");
        return;
      }

      try {
        const moodData = {
          emotion,
          intensity: Math.round(intensity * 100) / 100,
          detectedFrom,
          description:
            note ||
            `Phát hiện ${autoSave ? "tự động" : "thủ công"} từ ${detectedFrom}`,
          tags: autoSave
            ? ["auto-detected", "facial-recognition"]
            : ["manual", "confirmed"],
        };

        const data = await moodService.logMood(moodData);

        if (data.success) {
          showToast(
            `Đã ghi nhận tâm trạng: ${EMOTION_LABELS[emotion]}`,
            "success",
            EMOJI_MAP[emotion]
          );

          // Hiển thị gợi ý nếu cảm xúc mạnh
          if (intensity > 0.7 && emotion !== "neutral") {
            await loadSupportGroups(emotion);
            setCurrentEmotion(emotion);
            setShowRecommendations(true);
          }

          loadMoodHistory();
          loadMoodStats();
        }
      } catch (error) {
        console.error("Lỗi lưu tâm trạng:", error);
        showToast("Lỗi khi lưu tâm trạng", "danger");
      }
    },
    [user, showToast, loadSupportGroups, loadMoodHistory, loadMoodStats]
  );

  // Manual mood logging
  const logManualMood = useCallback(
    async (emotion, note = "") => {
      await saveMoodLog(emotion, 0.8, "manual", note, false);
    },
    [saveMoodLog]
  );

  // Xác nhận ghi nhận cảm xúc
  const confirmMoodLog = useCallback(async () => {
    if (currentEmotionData) {
      const { emotion, intensity } = currentEmotionData;
      await saveMoodLog(
        emotion,
        intensity,
        "camera",
        "Đã xác nhận từ người dùng",
        false
      );
      setShowConfirmation(false);
      setCurrentEmotionData(null);
    }
  }, [currentEmotionData, saveMoodLog]);

  // Bỏ qua cảm xúc hiện tại
  const skipMoodLog = useCallback(() => {
    setShowConfirmation(false);
    setCurrentEmotionData(null);
    showToast("Đã bỏ qua cảm xúc này", "info");
  }, [showToast]);

  // Join group handler
  const handleJoinGroup = useCallback(
    async (groupId) => {
      try {
        const data = await groupService.joinGroup(groupId);
        if (data.success) {
          showToast("Đã tham gia nhóm thành công!", "success");
          setShowRecommendations(false);
          navigate(`/group/${groupId}`);
        }
      } catch (error) {
        console.error("Lỗi tham gia nhóm:", error);
        showToast("Lỗi khi tham gia nhóm", "danger");
      }
    },
    [navigate, showToast]
  );

  // Process detection results
  const processDetectionResults = useCallback((detections) => {
    const timestamp = new Date().toISOString();
    const faces = detections.map((d) => {
      const expressions = d.expressions;
      const dominant = Object.entries(expressions).reduce(
        (max, [emotion, probability]) =>
          probability > max.probability ? { emotion, probability } : max,
        { emotion: "neutral", probability: 0 }
      );

      return {
        box: d.detection.box
          ? {
              x: Number((d.detection.box.x || 0).toFixed(2)),
              y: Number((d.detection.box.y || 0).toFixed(2)),
              width: Number((d.detection.box.width || 0).toFixed(2)),
              height: Number((d.detection.box.height || 0).toFixed(2)),
            }
          : null,
        expressions,
        dominant,
      };
    });

    // Cập nhật emotions history
    if (faces.length > 0) {
      const newEmotions = faces.map((face) => ({
        emotion: face.dominant.emotion,
        probability: face.dominant.probability,
        timestamp: new Date().toLocaleTimeString(),
      }));

      setDetectedEmotions((prev) => {
        const updated = [...prev, ...newEmotions].slice(-10);
        return updated;
      });
    }

    return { timestamp, faces };
  }, []);

  // Maybe show confirmation
  const maybeShowConfirmation = useCallback(
    (result) => {
      if (!result.faces || result.faces.length === 0) return;

      const now = Date.now();
      const dom = result.faces[0].dominant;

      // Chỉ hiển thị xác nhận nếu đủ ngưỡng và không có modal nào đang mở
      if (
        dom.probability >= CONFIRMATION_THRESHOLD &&
        dom.emotion !== "neutral" &&
        now - lastAlertTimeRef.current > ALERT_COOLDOWN_MS &&
        !showConfirmation &&
        !showRecommendations
      ) {
        lastAlertTimeRef.current = now;

        setCurrentEmotionData({
          emotion: dom.emotion,
          intensity: dom.probability,
          timestamp: new Date().toLocaleTimeString(),
        });
        setShowConfirmation(true);
      }

      // Cập nhật status với thông tin chi tiết
      if (result.faces.length > 0) {
        const emotions = result.faces
          .map(
            (face) =>
              `${face.dominant.emotion}(${(
                face.dominant.probability * 100
              ).toFixed(0)}%)`
          )
          .join(", ");

        setStatus(` ${result.faces.length} khuôn mặt | ${emotions}`);
      } else {
        setStatus(" Đang tìm khuôn mặt...");
      }
    },
    [showConfirmation, showRecommendations]
  );

  // Send to server (optional)
  const sendToServer = useCallback(async (result) => {
    console.log("Detection result:", {
      facesCount: result.faces.length,
      emotions: result.faces.map((f) => f.dominant.emotion),
    });
  }, []);

  // Draw detection results
  const drawDetections = useCallback((detections, canvas, context) => {
    if (!canvas || !context || detections.length === 0) return;

    context.clearRect(0, 0, canvas.width, canvas.height);

    detections.forEach((d) => {
      const b = d.detection.box;
      const dominant = Object.entries(d.expressions).reduce(
        (max, [emotion, probability]) =>
          probability > max.probability ? { emotion, probability } : max,
        { emotion: "neutral", probability: 0 }
      );

      // Màu sắc theo cảm xúc
      const emotionColors = {
        happy: "rgba(76, 175, 80, 0.8)",
        sad: "rgba(33, 150, 243, 0.8)",
        angry: "rgba(244, 67, 54, 0.8)",
        surprised: "rgba(255, 193, 7, 0.8)",
        fearful: "rgba(156, 39, 176, 0.8)",
        disgusted: "rgba(121, 85, 72, 0.8)",
        neutral: "rgba(48, 13, 13, 0.8)",
      };

      // Vẽ bounding box với màu theo cảm xúc
      context.strokeStyle =
        emotionColors[dominant.emotion] || "rgba(0,255,0,0.9)";
      context.lineWidth = 3;
      context.strokeRect(b.x, b.y, b.width, b.height);

      // Vẽ nhãn cảm xúc
      const label = `${EMOTION_LABELS[dominant.emotion]} ${(
        dominant.probability * 100
      ).toFixed(0)}%`;
      const textWidth = context.measureText(label).width + 16;
      const tx = b.x;
      const ty = Math.max(0, b.y - 25);

      context.fillStyle = emotionColors[dominant.emotion] || "rgba(0,0,0,0.6)";
      context.fillRect(tx, ty, textWidth, 22);
      context.fillStyle = "white";
      context.font = "bold 12px sans-serif";
      context.fillText(label, tx + 8, ty + 15);
    });
  }, []);

  // Detect loop với interval chậm hơn
  const detectLoop = useCallback(async () => {
    if (!detectingRef.current || !modelsLoaded) return;

    const video = videoRef.current;
    if (!video || video.readyState < 2) {
      requestAnimationFrame(detectLoop);
      return;
    }

    const now = Date.now();
    // Chỉ detect mỗi 2 giây
    if (now - lastDetectionTimeRef.current < DETECTION_INTERVAL) {
      requestAnimationFrame(detectLoop);
      return;
    }

    lastDetectionTimeRef.current = now;

    try {
      const detections = await modelService.detectFaces(video);
      const result = processDetectionResults(detections);

      maybeShowConfirmation(result);
      sendToServer(result);

      // Draw overlay
      const canvas = canvasRef.current;
      if (canvas) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        drawDetections(detections, canvas, ctx);
      }
    } catch (err) {
      console.error("Lỗi nhận diện:", err);
    }

    requestAnimationFrame(detectLoop);
  }, [
    modelsLoaded,
    processDetectionResults,
    maybeShowConfirmation,
    sendToServer,
    drawDetections,
  ]);

  // Start camera
  const startCamera = useCallback(async () => {
    if (!modelsLoaded) {
      showToast("Models chưa load xong.", "warning");
      return;
    }

    if (streamRef.current) return;

    try {
      setStatus("Đang khởi động camera...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      detectingRef.current = true;
      setStatus("Camera đã sẵn sàng. Đang nhận diện...");
      detectLoop();
    } catch (err) {
      console.error("Không mở được camera:", err);
      setStatus("Lỗi truy cập camera");
      showToast("Không thể truy cập camera", "danger");
    }
  }, [modelsLoaded, detectLoop, showToast]);

  // Stop camera
  const stopCamera = useCallback(() => {
    detectingRef.current = false;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }
    if (canvasRef.current) {
      const ctx = canvasRef.current.getContext("2d");
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    }
    setStatus("Camera đã dừng");
    setDetectedEmotions([]);
  }, []);

  // Handle image upload
  const onImageChange = useCallback(
    async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;

      if (!modelsLoaded) {
        showToast("Models chưa load xong.", "warning");
        return;
      }

      try {
        setStatus("Đang xử lý ảnh...");
        const img = new Image();
        img.src = URL.createObjectURL(file);

        await new Promise((resolve) => {
          img.onload = resolve;
        });

        const detections = await modelService.detectFacesFromImage(img);
        const result = processDetectionResults(detections);

        maybeShowConfirmation(result);
        sendToServer(result);

        // Hiển thị kết quả
        const canvas = canvasRef.current;
        if (canvas) {
          let displayWidth = img.width;
          let displayHeight = img.height;
          let scale = 1;

          if (displayWidth > MAX_WIDTH || displayHeight > MAX_HEIGHT) {
            scale = Math.min(
              MAX_WIDTH / displayWidth,
              MAX_HEIGHT / displayHeight
            );
            displayWidth = Math.floor(img.width * scale);
            displayHeight = Math.floor(img.height * scale);
          }

          canvas.width = displayWidth;
          canvas.height = displayHeight;
          const ctx = canvas.getContext("2d");
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.drawImage(img, 0, 0, displayWidth, displayHeight);

          drawDetections(detections, canvas, ctx);
        }

        setStatus(`Đã nhận diện ${detections.length} khuôn mặt từ ảnh`);
      } catch (err) {
        console.error("Lỗi xử lý ảnh:", err);
        setStatus("Lỗi xử lý ảnh");
        showToast("Lỗi khi xử lý ảnh", "danger");
      } finally {
        e.target.value = "";
      }
    },
    [
      modelsLoaded,
      processDetectionResults,
      maybeShowConfirmation,
      sendToServer,
      drawDetections,
      showToast,
    ]
  );

  // Cleanup
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Loading state
  if (loading) {
    return (
      <div className="container-fluid mt-4">
        <Card className="shadow border-0">
          <Card.Body className="text-center py-5">
            <Spinner
              animation="border"
              variant="primary"
              className="mb-3"
              size="lg"
            />
            <h4 className="fw-bold text-primary">Đang tải AI Models...</h4>
            <p className="text-muted mb-2">{status}</p>
            <small className="text-muted">
              Lần đầu có thể mất vài phút để tải models từ internet
            </small>
          </Card.Body>
        </Card>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="container-fluid mt-4">
        <Alert variant="danger" className="border-0 shadow">
          <Alert.Heading>🚫 Lỗi tải AI Models</Alert.Heading>
          <p className="mb-3">{error}</p>
          <hr />
          <div className="d-flex gap-2">
            <Button
              variant="outline-danger"
              onClick={() => window.location.reload()}
            >
              Thử lại
            </Button>
            <Button variant="primary" onClick={() => navigate("/manual-mood")}>
              📝 Ghi tâm trạng thủ công
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-4">
      <Row className="g-4">
        <Col xl={8}>
          <Card className="shadow border-0">
            <Card.Body className="p-4">
              <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                  <Card.Title className="h4 fw-bold text-primary mb-1">
                    🤖 Nhận diện cảm xúc AI
                  </Card.Title>
                  <Badge
                    bg={modelsLoaded ? "success" : "secondary"}
                    className="fs-6"
                  >
                    {status}
                  </Badge>
                </div>
                <Button
                  variant="outline-primary"
                  onClick={() => navigate("/mood-history")}
                  size="sm"
                >
                  Xem chi tiết
                </Button>
              </div>

              <div
                style={{ position: "relative", display: "inline-block" }}
                className="mb-4"
              >
                <video
                  ref={videoRef}
                  width="640"
                  height="480"
                  autoPlay
                  muted
                  playsInline
                  className="rounded-3 border shadow-sm"
                  style={{ backgroundColor: "#f8f9fa" }}
                />
                <canvas
                  ref={canvasRef}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    pointerEvents: "none",
                  }}
                  className="rounded-3"
                />
              </div>

              {/* Detected Emotions History */}
              {detectedEmotions.length > 0 && (
                <Card className="mb-4 border-0 bg-light">
                  <Card.Body className="py-3">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <small className="text-muted fw-semibold">
                        Cảm xúc phát hiện gần đây:
                      </small>
                      <Badge bg="primary" pill>
                        {detectedEmotions.length}
                      </Badge>
                    </div>
                    <div className="d-flex flex-wrap gap-2">
                      {detectedEmotions.slice(-8).map((emotion, index) => (
                        <Badge
                          key={index}
                          bg={`outline-${EMOTION_COLORS[emotion.emotion]}`}
                          className="d-flex align-items-center gap-1 p-2"
                          title={`${(emotion.probability * 100).toFixed(
                            0
                          )}% - ${emotion.timestamp}`}
                        >
                          <span className="fs-6">
                            {EMOJI_MAP[emotion.emotion]}
                          </span>
                          <span className="fw-semibold">
                            {(emotion.probability * 100).toFixed(0)}%
                          </span>
                        </Badge>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              )}

              <div className="d-flex flex-wrap gap-3 align-items-center">
                <Form.Control
                  type="file"
                  accept="image/*"
                  onChange={onImageChange}
                  className="w-auto"
                />
                <div className="d-flex gap-2">
                  <Button
                    variant="primary"
                    onClick={startCamera}
                    disabled={!modelsLoaded}
                    className="d-flex align-items-center gap-2"
                  >
                    <span>🎥</span>
                    <span>Bắt đầu camera</span>
                  </Button>
                  <Button
                    variant="outline-secondary"
                    onClick={stopCamera}
                    className="d-flex align-items-center gap-2"
                  >
                    <span>⏹️</span>
                    <span>Dừng</span>
                  </Button>
                </div>
              </div>

              <Alert variant="info" className="mt-3 border-0 bg-light">
                <strong>💡 Lưu ý:</strong> Hệ thống sẽ hỏi xác nhận trước khi
                ghi nhận cảm xúc mạnh. Bạn có thể chọn "Ghi nhận" hoặc "Bỏ qua"
                tùy theo cảm nhận thực tế.
              </Alert>
            </Card.Body>
          </Card>
        </Col>

        <Col xl={4}>
          {/* Mood Statistics */}
          {user && moodStats.length > 0 && (
            <Card className="shadow border-0 mb-4">
              <Card.Body>
                <Card.Title className="h6 fw-bold d-flex align-items-center gap-2 mb-3">
                  Thống kê tuần
                </Card.Title>
                {moodStats.map((stat, index) => (
                  <div key={index} className="mb-3">
                    <div className="d-flex justify-content-between align-items-center mb-1">
                      <span className="d-flex align-items-center gap-2">
                        <span className="fs-5">{EMOJI_MAP[stat._id]}</span>
                        <span className="fw-semibold text-capitalize">
                          {EMOTION_LABELS[stat._id]}
                        </span>
                      </span>
                      <Badge bg={EMOTION_COLORS[stat._id]} className="fs-6">
                        {stat.count}
                      </Badge>
                    </div>
                    <ProgressBar
                      now={
                        (stat.count /
                          Math.max(...moodStats.map((s) => s.count))) *
                        100
                      }
                      variant={EMOTION_COLORS[stat._id]}
                      className="mb-2"
                    />
                    <small className="text-muted">
                      Cường độ trung bình:{" "}
                      <strong>{(stat.avgIntensity * 100).toFixed(0)}%</strong>
                    </small>
                  </div>
                ))}
              </Card.Body>
            </Card>
          )}

          {/* Mood History with Tabs */}
          <Card className="shadow border-0">
            <Card.Body className="p-0">
              <Tabs
                activeKey={activeTab}
                onSelect={(k) => setActiveTab(k)}
                className="px-3 pt-3"
              >
                <Tab eventKey="realtime" title=" Lịch sử">
                  <div className="p-3">
                    {!user ? (
                      <Alert variant="warning" className="small border-0 mb-0">
                        Vui lòng <a href="/login">đăng nhập</a> để xem lịch sử
                        tâm trạng
                      </Alert>
                    ) : moodHistory.length === 0 ? (
                      <div className="text-center py-4">
                        <div className="fs-1 mb-2">😴</div>
                        <p className="text-muted mb-0">Chưa có dữ liệu</p>
                        <small className="text-muted">
                          Hãy bắt đầu ghi lại tâm trạng của bạn
                        </small>
                      </div>
                    ) : (
                      <div className="d-flex flex-column gap-3">
                        {moodHistory.map((log) => (
                          <div
                            key={log._id}
                            className="d-flex align-items-center gap-3 p-3 border rounded-3 bg-light"
                          >
                            <div className="fs-3">{EMOJI_MAP[log.emotion]}</div>
                            <div className="flex-grow-1">
                              <div className="d-flex justify-content-between align-items-center mb-1">
                                <span className="fw-bold text-capitalize">
                                  {EMOTION_LABELS[log.emotion]}
                                </span>
                                <Badge
                                  bg={EMOTION_COLORS[log.emotion]}
                                  className="fs-6"
                                >
                                  {(log.intensity * 100).toFixed(0)}%
                                </Badge>
                              </div>
                              <div className="d-flex justify-content-between align-items-center">
                                <small className="text-muted">
                                  {formatDate(log.createdAt)}
                                </small>
                                <small className="text-muted text-capitalize">
                                  {log.detectedFrom}
                                </small>
                              </div>
                              {log.note && (
                                <div className="mt-2">
                                  <small className="text-muted">
                                    {log.note}
                                  </small>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </Tab>

                <Tab eventKey="quicklog" title=" Ghi nhanh">
                  <div className="p-3">
                    {!user ? (
                      <Alert variant="warning" className="small border-0 mb-0">
                        Vui lòng <a href="/login">đăng nhập</a> để ghi lại tâm
                        trạng
                      </Alert>
                    ) : (
                      <>
                        <div className="d-grid gap-2 mb-3">
                          {Object.entries(EMOJI_MAP).map(([emotion, emoji]) => (
                            <Button
                              key={emotion}
                              variant={`outline-${EMOTION_COLORS[emotion]}`}
                              onClick={() => logManualMood(emotion)}
                              className="d-flex align-items-center justify-content-center gap-2 py-2"
                            >
                              <span className="fs-5">{emoji}</span>
                              <span className="fw-semibold text-capitalize">
                                {EMOTION_LABELS[emotion]}
                              </span>
                            </Button>
                          ))}
                        </div>
                        <Form.Group>
                          <Form.Label className="small fw-semibold">
                            Ghi chú thêm:
                          </Form.Label>
                          <Form.Control
                            as="textarea"
                            rows={3}
                            placeholder="Mô tả cảm xúc của bạn..."
                            onBlur={(e) => {
                              if (e.target.value.trim()) {
                                logManualMood("neutral", e.target.value.trim());
                                e.target.value = "";
                              }
                            }}
                          />
                        </Form.Group>
                      </>
                    )}
                  </div>
                </Tab>
              </Tabs>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Confirmation Modal */}
      <Modal show={showConfirmation} onHide={skipMoodLog} centered>
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="d-flex align-items-center gap-2">
            {currentEmotionData && (
              <span className="fs-2">
                {EMOJI_MAP[currentEmotionData.emotion]}
              </span>
            )}
            <div>
              <div className="h5 mb-0">Xác nhận cảm xúc</div>
              <small className="text-muted">
                Hệ thống phát hiện cảm xúc của bạn
              </small>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center py-4">
          {currentEmotionData && (
            <>
              <div className="fs-1 mb-3">
                {EMOJI_MAP[currentEmotionData.emotion]}
              </div>
              <h4 className="fw-bold text-capitalize">
                {EMOTION_LABELS[currentEmotionData.emotion]}
              </h4>
              <div className="mb-4">
                <ProgressBar
                  now={currentEmotionData.intensity * 100}
                  variant={EMOTION_COLORS[currentEmotionData.emotion]}
                  className="mb-2"
                  style={{ height: "10px" }}
                />
                <small className="text-muted">
                  Độ tin cậy:{" "}
                  <strong>
                    {(currentEmotionData.intensity * 100).toFixed(0)}%
                  </strong>
                </small>
              </div>
              <p className="lead">Bạn có thực sự cảm thấy như vậy không?</p>
            </>
          )}
        </Modal.Body>
        <Modal.Footer className="border-0 justify-content-center">
          <Button
            variant="outline-secondary"
            onClick={skipMoodLog}
            size="lg"
            className="px-4"
          >
            Không phải
          </Button>
          <Button
            variant="primary"
            onClick={confirmMoodLog}
            size="lg"
            className="px-4"
          >
            Đúng vậy
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Recommendations Modal */}
      <Modal
        show={showRecommendations}
        onHide={() => setShowRecommendations(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton className="border-0">
          <Modal.Title className="d-flex align-items-center gap-2">
            <span className="fs-2">{EMOJI_MAP[currentEmotion]}</span>
            <div>
              <div className="h5 mb-0">Gợi ý hỗ trợ</div>
              <small className="text-muted">
                Dành cho cảm xúc: {currentEmotion}
              </small>
            </div>
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info" className="border-0 bg-light">
            💡 Dựa trên cảm xúc của bạn, đây là các nhóm hỗ trợ phù hợp:
          </Alert>

          <h6 className="fw-bold mb-3">👥 Các nhóm hỗ trợ phù hợp:</h6>
          {supportGroups.length > 0 ? (
            <div className="row g-3 mb-4">
              {supportGroups.map((group) => (
                <div key={group._id} className="col-12">
                  <Card className="border-0 bg-light">
                    <Card.Body>
                      <div className="d-flex align-items-start gap-3">
                        <Badge bg="primary" className="fs-6">
                          {group.category}
                        </Badge>
                        <div className="flex-grow-1">
                          <h6 className="fw-bold mb-1">{group.name}</h6>
                          <p className="text-muted small mb-2">
                            {group.description}
                          </p>
                          <div className="d-flex gap-3 small text-muted">
                            <span>👤 {group.memberCount} thành viên</span>
                            <span>
                              {group.visibility === "public"
                                ? "🌐 Công khai"
                                : "🔒 Riêng tư"}
                            </span>
                          </div>
                        </div>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleJoinGroup(group._id)}
                        >
                          Tham gia
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4">
              <div className="fs-1 mb-2">🤷‍♂️</div>
              <p className="text-muted">Không có nhóm hỗ trợ phù hợp</p>
            </div>
          )}

          <Card className="border-0 bg-warning bg-opacity-10">
            <Card.Body>
              <h6 className="fw-bold d-flex align-items-center gap-2 mb-3">
                💡 Mẹo hỗ trợ cho cảm xúc {currentEmotion}:
              </h6>
              <ul className="mb-0">
                {currentEmotion === "sad" && (
                  <>
                    <li>Chia sẻ với người thân hoặc bạn bè</li>
                    <li>Nghe nhạc nhẹ hoặc xem phim hài</li>
                    <li>Đi dạo và hít thở không khí trong lành</li>
                  </>
                )}
                {currentEmotion === "angry" && (
                  <>
                    <li>Hít thở sâu và đếm đến 10</li>
                    <li>Tập thể dục nhẹ để giải tỏa</li>
                    <li>Viết ra giấy những điều làm bạn tức giận</li>
                  </>
                )}
                {currentEmotion === "fearful" && (
                  <>
                    <li>Thực hành thiền hoặc hít thở sâu</li>
                    <li>Chia sẻ nỗi sợ với người tin cậy</li>
                    <li>Phân tích nguyên nhân gây sợ hãi</li>
                  </>
                )}
                {currentEmotion === "happy" && (
                  <>
                    <li>Chia sẻ niềm vui với mọi người</li>
                    <li>Làm điều gì đó sáng tạo</li>
                    <li>Ghi lại khoảnh khắc hạnh phúc</li>
                  </>
                )}
                {(currentEmotion === "neutral" || !currentEmotion) && (
                  <>
                    <li>Chia sẻ cảm xúc với người tin cậy</li>
                    <li>Thực hành hít thở sâu và thiền</li>
                    <li>Viết nhật ký cảm xúc</li>
                    <li>Tham gia các hoạt động thể chất</li>
                  </>
                )}
              </ul>
            </Card.Body>
          </Card>
        </Modal.Body>
        <Modal.Footer className="border-0">
          <Button
            variant="outline-secondary"
            onClick={() => setShowRecommendations(false)}
          >
            Đóng
          </Button>
          <Button variant="primary" onClick={() => navigate("/groups")}>
            Khám phá tất cả nhóm
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Toast Container */}
      <ToastContainer position="top-end" className="p-3">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            onClose={() => setToasts(toasts.filter((t) => t.id !== toast.id))}
            delay={5000}
            autohide
            bg={toast.variant}
            className="border-0"
          >
            <Toast.Header className="border-0">
              <strong className="me-auto">Thông báo</strong>
            </Toast.Header>
            <Toast.Body>{toast.message}</Toast.Body>
          </Toast>
        ))}
      </ToastContainer>
    </div>
  );
};

export default NhanDien;
