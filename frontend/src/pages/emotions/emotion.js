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
} from "react-bootstrap";

// Services - ĐÃ XÓA emotionService
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
  happy: "Vui vẻ 😊",
  sad: "Buồn 😢",
  angry: "Tức giận 😠",
  surprised: "Ngạc nhiên 😲",
  fearful: "Sợ hãi 😨",
  disgusted: "Chán ghét 🤢",
  neutral: "Bình thường 😐",
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
  const [supportGroups, setSupportGroups] = useState([]);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState(null);
  const [currentEmotionData, setCurrentEmotionData] = useState(null);
  const [detectedEmotions, setDetectedEmotions] = useState([]);

  // Hàm hiển thị Toast
  const showToast = useCallback((message, variant = "info", emoji = "") => {
    const id = Date.now();
    setToasts((prev) => [
      ...prev,
      { id, message: `${emoji} ${message}`, variant },
    ]);
  }, []);

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
      const data = await moodService.getMoodHistory({ limit: 5 });
      if (data.success) {
        setMoodHistory(data.moodLogs);
      }
    } catch (error) {
      console.error("Lỗi tải lịch sử tâm trạng:", error);
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
        }
      } catch (error) {
        console.error("Lỗi lưu tâm trạng:", error);
        showToast("Lỗi khi lưu tâm trạng", "danger");
      }
    },
    [user, showToast, loadSupportGroups, loadMoodHistory]
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
          navigate(`/groups/${groupId}`);
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

  // Maybe show confirmation - ĐÃ SỬA: Xóa gọi emotionService
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

        setStatus(`👥 ${result.faces.length} khuôn mặt | ${emotions}`);
      } else {
        setStatus("🔍 Đang tìm khuôn mặt...");
      }
    },
    [showConfirmation, showRecommendations]
  );

  // Send to server (optional) - ĐÃ SỬA: Xóa gọi emotionService
  const sendToServer = useCallback(async (result) => {
    // Không gửi dữ liệu detection lên server nữa
    // Chỉ log cục bộ để debug
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
        neutral: "rgba(158, 158, 158, 0.8)",
      };

      // Vẽ bounding box với màu theo cảm xúc
      context.strokeStyle =
        emotionColors[dominant.emotion] || "rgba(0,255,0,0.9)";
      context.lineWidth = 3;
      context.strokeRect(b.x, b.y, b.width, b.height);

      // Vẽ nhãn cảm xúc
      const label = `${EMOTION_LABELS[dominant.emotion].split(" ")[0]} ${(
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
      <div className="container-md mt-4">
        <Card className="shadow-sm">
          <Card.Body className="text-center py-5">
            <Spinner animation="border" variant="primary" className="mb-3" />
            <h5>Đang tải AI Models...</h5>
            <p className="text-muted">{status}</p>
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
      <div className="container-md mt-4">
        <Alert variant="danger">
          <Alert.Heading>Lỗi tải AI Models</Alert.Heading>
          <p>{error}</p>
          <hr />
          <div className="d-flex justify-content-between">
            <Button
              variant="outline-danger"
              onClick={() => window.location.reload()}
            >
              Thử lại
            </Button>
            <Button variant="primary" onClick={() => navigate("/manual-mood")}>
              Ghi tâm trạng thủ công
            </Button>
          </div>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container-md mt-4">
      <Row>
        <Col md={8}>
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title>🤖 Nhận diện cảm xúc (AI)</Card.Title>
              <Badge
                bg={modelsLoaded ? "success" : "secondary"}
                className="mb-3"
              >
                {status}
              </Badge>

              <div
                style={{ position: "relative", display: "inline-block" }}
                className="mb-3"
              >
                <video
                  ref={videoRef}
                  width="640"
                  height="480"
                  autoPlay
                  muted
                  playsInline
                  className="rounded border"
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
                  className="rounded"
                />
              </div>

              {/* Detected Emotions History */}
              {detectedEmotions.length > 0 && (
                <Card className="mb-3">
                  <Card.Body className="py-2">
                    <small className="text-muted">
                      Cảm xúc phát hiện gần đây:
                    </small>
                    <div className="d-flex flex-wrap gap-1 mt-1">
                      {detectedEmotions.slice(-6).map((emotion, index) => (
                        <Badge
                          key={index}
                          bg="outline-secondary"
                          className="text-dark border"
                          title={`${(emotion.probability * 100).toFixed(
                            0
                          )}% - ${emotion.timestamp}`}
                        >
                          {EMOJI_MAP[emotion.emotion]}{" "}
                          {(emotion.probability * 100).toFixed(0)}%
                        </Badge>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              )}

              <Form.Group className="mb-3">
                <div className="d-flex flex-wrap gap-2 align-items-center">
                  <Form.Control
                    type="file"
                    accept="image/*"
                    onChange={onImageChange}
                    className="w-auto"
                  />
                  <Button
                    variant="primary"
                    onClick={startCamera}
                    disabled={!modelsLoaded}
                  >
                    🎥 Bắt đầu camera
                  </Button>
                  <Button variant="secondary" onClick={stopCamera}>
                    ⏹️ Dừng
                  </Button>
                </div>
              </Form.Group>

              <Alert variant="info" className="small">
                <strong>💡 Lưu ý:</strong> Hệ thống sẽ hỏi xác nhận trước khi
                ghi nhận cảm xúc mạnh. Bạn có thể chọn "Ghi nhận" hoặc "Bỏ qua"
                tùy theo cảm nhận thực tế.
              </Alert>
            </Card.Body>
          </Card>
        </Col>

        <Col md={4}>
          {/* Mood History */}
          <Card className="shadow-sm mb-4">
            <Card.Body>
              <Card.Title>📊 Lịch sử tâm trạng</Card.Title>
              {!user ? (
                <Alert variant="warning" className="small">
                  Vui lòng <a href="/login">đăng nhập</a> để xem lịch sử tâm
                  trạng
                </Alert>
              ) : moodHistory.length === 0 ? (
                <p className="text-muted text-center py-3">Chưa có dữ liệu</p>
              ) : (
                moodHistory.map((log) => (
                  <div
                    key={log._id}
                    className="d-flex justify-content-between align-items-center mb-2 p-2 border rounded"
                  >
                    <div>
                      <span className="fs-5">{EMOJI_MAP[log.emotion]}</span>
                      <span className="ms-2 text-capitalize">
                        {log.emotion}
                      </span>
                    </div>
                    <div className="text-end">
                      <div className="small text-muted">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </div>
                      <div className="small">
                        <Badge bg="outline-primary">
                          {(log.intensity * 100).toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </Card.Body>
          </Card>

          {/* Quick Mood Logging */}
          <Card className="shadow-sm">
            <Card.Body>
              <Card.Title>✏️ Ghi lại tâm trạng</Card.Title>
              {!user ? (
                <Alert variant="warning" className="small">
                  Vui lòng <a href="/login">đăng nhập</a> để ghi lại tâm trạng
                </Alert>
              ) : (
                <>
                  <div className="d-flex flex-wrap gap-2 mb-3">
                    {Object.entries(EMOJI_MAP).map(([emotion, emoji]) => (
                      <Button
                        key={emotion}
                        variant="outline-primary"
                        size="sm"
                        onClick={() => logManualMood(emotion)}
                        className="d-flex align-items-center"
                      >
                        <span className="me-1">{emoji}</span>
                        <span className="text-capitalize">{emotion}</span>
                      </Button>
                    ))}
                  </div>
                  <Form.Group>
                    <Form.Control
                      as="textarea"
                      rows={2}
                      placeholder="Ghi chú thêm về tâm trạng..."
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
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Confirmation Modal */}
      <Modal show={showConfirmation} onHide={skipMoodLog} centered>
        <Modal.Header closeButton>
          <Modal.Title>
            {currentEmotionData && EMOJI_MAP[currentEmotionData.emotion]} Xác
            nhận cảm xúc
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center">
          <div className="mb-4">
            <h4>
              {currentEmotionData && EMOTION_LABELS[currentEmotionData.emotion]}
            </h4>
            <p className="text-muted mb-2">
              Độ tin cậy:{" "}
              <strong>
                {(currentEmotionData?.intensity * 100).toFixed(0)}%
              </strong>
            </p>
            <p>Bạn có thực sự cảm thấy như vậy không?</p>
          </div>

          <div className="d-flex gap-2 justify-content-center">
            <Button variant="outline-secondary" onClick={skipMoodLog} size="lg">
              ❌ Không phải
            </Button>
            <Button variant="primary" onClick={confirmMoodLog} size="lg">
              ✅ Đúng vậy
            </Button>
          </div>
        </Modal.Body>
      </Modal>

      {/* Recommendations Modal */}
      <Modal
        show={showRecommendations}
        onHide={() => setShowRecommendations(false)}
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>
            {EMOJI_MAP[currentEmotion]} Gợi ý hỗ trợ cho cảm xúc:{" "}
            {currentEmotion}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Alert variant="info" className="small">
            💡 Dựa trên cảm xúc của bạn, đây là các nhóm hỗ trợ phù hợp:
          </Alert>

          <h6>👥 Các nhóm hỗ trợ phù hợp:</h6>
          {supportGroups.length > 0 ? (
            <ListGroup variant="flush" className="mb-3">
              {supportGroups.map((group) => (
                <ListGroup.Item
                  key={group._id}
                  className="d-flex align-items-start"
                >
                  <Badge bg="primary" className="me-2 mt-1">
                    {group.category}
                  </Badge>
                  <div className="flex-grow-1">
                    <strong>{group.name}</strong>
                    <br />
                    <small className="text-muted">{group.description}</small>
                    <br />
                    <small className="text-muted">
                      👤 {group.memberCount} thành viên •{" "}
                      {group.visibility === "public"
                        ? "🌐 Công khai"
                        : "🔒 Riêng tư"}
                    </small>
                  </div>
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="mt-1"
                    onClick={() => handleJoinGroup(group._id)}
                  >
                    Tham gia
                  </Button>
                </ListGroup.Item>
              ))}
            </ListGroup>
          ) : (
            <p className="text-muted">Đang tải nhóm hỗ trợ...</p>
          )}

          <div className="mt-3 p-3 bg-light rounded">
            <h6>💡 Mẹo hỗ trợ cho cảm xúc {currentEmotion}:</h6>
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
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
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
          >
            <Toast.Header>
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
