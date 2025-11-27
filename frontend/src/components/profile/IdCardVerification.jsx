// ================================================================ 1 =================================================================

import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import Tesseract from "tesseract.js";
import * as faceapi from "face-api.js";
import api from "../../services/api";

const SIMILARITY_THRESHOLD = 60;

const IdCardVerification = ({ onSuccess }) => {
  const [step, setStep] = useState(1);
  const [cccdFile, setCccdFile] = useState(null);
  const [selfieBlob, setSelfieBlob] = useState(null);
  const [ocr, setOcr] = useState({
    fullName: "",
    number: "",
    dob: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false); // Thêm state cho tính toán
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // Lưu detection + dataURL
  const [cccdData, setCccdData] = useState({ detection: null, dataURL: null });
  const [selfieData, setSelfieData] = useState({
    detection: null,
    dataURL: null,
  });

  const [similarity, setSimilarity] = useState(null);

  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const cccdCanvasRef = useRef(null);
  const selfieCanvasRef = useRef(null);

  /* --------------------------------------------------------------- */
  // Helper
  const fileToDataURL = (file) =>
    new Promise((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result);
      r.readAsDataURL(file);
    });

  /* --------------------------------------------------------------- */
  // OCR
  const extractInfo = (text) => {
    const lines = text
      .replace(
        /[^\w\s\d\/:.,-ÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂưăạảấầẩẫậắằẳẵặẹẻẽềềểỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵỷỹ]/g,
        " "
      )
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean);

    const info = { fullName: "", number: "", dob: "", address: "" };
    let addrLines = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].toLowerCase();
      const raw = lines[i];

      if (!info.fullName && /họ.*tên|full.?name/i.test(line)) {
        const next = lines[i + 1] || "";
        if (next && !/số|no\.|id|ngày|sinh/i.test(next.toLowerCase())) {
          info.fullName = next.trim();
        }
      }

      if (!info.number) {
        const m = raw.match(/\b\d{9,12}\b/);
        if (m) info.number = m[0];
      }

      if (!info.dob) {
        const m = raw.match(/\b(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4})\b/);
        if (m) info.dob = m[1].replace(/-/g, "/");
      }

      if (/nơi.*thường.*trú|thường.*trú/i.test(line)) {
        addrLines = [];
        for (let j = i + 1; j < lines.length; j++) {
          const a = lines[j];
          if (a && !/ngày.*sinh|số.*cccd|họ.*tên/i.test(a.toLowerCase()))
            addrLines.push(a);
          else break;
        }
        info.address = addrLines.join(", ").trim();
      }
    }

    if (!info.fullName) {
      const cand = lines.filter(
        (l) => /[a-zA-Z]/.test(l) && l.length > 10 && !/\d{4}/.test(l)
      );
      if (cand.length) info.fullName = cand[0].trim();
    }

    return info;
  };

  /* --------------------------------------------------------------- */
  // Detect + lưu
  const detectFaceInImage = async (file, setData, canvasRef) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.src = url;

    return new Promise((resolve) => {
      img.onload = async () => {
        try {
          const detection = await faceapi
            .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
            .withFaceLandmarks()
            .withFaceDescriptor();

          if (!detection) {
            alert("Không phát hiện khuôn mặt!");
            resolve(null);
            return;
          }

          const dataURL = await fileToDataURL(file);
          const data = { detection, dataURL };

          setData(data);
          drawFaceOnCanvas(img, detection, canvasRef.current);
          resolve(detection);
        } catch (e) {
          console.error(e);
          alert("Lỗi nhận diện khuôn mặt!");
          resolve(null);
        } finally {
          URL.revokeObjectURL(url);
        }
      };
    });
  };

  /* --------------------------------------------------------------- */
  // VẼ LẠI CANVAS
  const redrawCanvas = (data, canvas) => {
    if (!data || !canvas) return;

    requestAnimationFrame(() => {
      const img = new Image();
      img.src = data.dataURL;
      img.onload = () => {
        const resized = faceapi.resizeResults(data.detection, {
          width: img.width,
          height: img.height,
        });
        faceapi.matchDimensions(canvas, {
          width: img.width,
          height: img.height,
        });
        const ctx = canvas.getContext("2d");
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        faceapi.draw.drawDetections(ctx, resized);
        faceapi.draw.drawFaceLandmarks(ctx, resized);
      };
    });
  };

  // VẼ LẠI KHI DATA THAY ĐỔI
  useLayoutEffect(() => {
    if (cccdData.detection && cccdCanvasRef.current) {
      redrawCanvas(cccdData, cccdCanvasRef.current);
    }
  }, [cccdData]);

  useLayoutEffect(() => {
    if (selfieData.detection && selfieCanvasRef.current) {
      redrawCanvas(selfieData, selfieCanvasRef.current);
    }
  }, [selfieData]);

  /* --------------------------------------------------------------- */
  const drawFaceOnCanvas = (img, detection, canvas) => {
    if (!canvas || !img) return;
    const resized = faceapi.resizeResults(detection, {
      width: img.width,
      height: img.height,
    });
    faceapi.matchDimensions(canvas, { width: img.width, height: img.height });
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    faceapi.draw.drawDetections(ctx, resized);
    faceapi.draw.drawFaceLandmarks(ctx, resized);
  };

  /* --------------------------------------------------------------- */
  // Bước 1
  const handleCccd = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCccdFile(file);
    setLoading(true);
    try {
      const { data } = await Tesseract.recognize(file, "vie", {
        tessedit_char_whitelist:
          "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÁÀẢÃẠĂẮẰẲẴẶÂẤẦẨẪẬĐÊẾỀỂỄỆÌÍỈĨỊÒÓỎÕỌÔỐỒỔỖỘƠỚỜỞỠỢÙÚỦŨỤƯỨỪỬỮỰỲÝỶỸỴ /:-",
      });
      setOcr(extractInfo(data.text));
      await detectFaceInImage(file, setCccdData, cccdCanvasRef);
    } catch (err) {
      alert("Lỗi xử lý CCCD: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmStep1 = () => {
    if (!ocr.fullName || !ocr.number)
      return alert("Vui lòng nhập Họ tên và Số CCCD!");
    if (!cccdData.detection)
      return alert("Không phát hiện khuôn mặt trong CCCD!");
    setStep(2);
  };

  /* --------------------------------------------------------------- */
  // Bước 2 - CHỈ CHỤP VÀ NHẬN DIỆN, KHÔNG TÍNH TOÁN
  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480 },
      });
      videoRef.current.srcObject = stream;
    } catch (e) {
      alert("Không thể mở camera: " + e.message);
    }
  };

  const captureSelfie = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);

    canvas.toBlob(
      async (blob) => {
        setSelfieBlob(blob);
        stopCamera();
        setLoading(true);

        try {
          // CHỈ NHẬN DIỆN KHUÔN MẶT, KHÔNG TÍNH TOÁN
          const selfieDetection = await detectFaceInImage(
            blob,
            setSelfieData,
            selfieCanvasRef
          );

          if (selfieDetection) {
            // Chuyển sang bước 3 nhưng CHƯA tính similarity
            setStep(3);
          } else {
            alert(
              "Không thể nhận diện khuôn mặt trong ảnh selfie. Vui lòng thử lại!"
            );
          }
        } catch (error) {
          console.error("Lỗi khi xử lý selfie:", error);
          alert("Có lỗi xảy ra khi xử lý ảnh selfie!");
        } finally {
          setLoading(false);
        }
      },
      "image/jpeg",
      0.9
    );
  };

  const stopCamera = () => {
    videoRef.current?.srcObject?.getTracks().forEach((t) => t.stop());
  };

  /* --------------------------------------------------------------- */
  // Bước 3 - TÍNH TOÁN KHI NGƯỜI DÙNG NHẤN NÚT
  const calculateSimilarity = async () => {
    if (!cccdData.detection || !selfieData.detection) {
      alert("Không có dữ liệu khuôn mặt để so sánh!");
      return;
    }

    setCalculating(true);

    // Giả lập thời gian tính toán để người dùng thấy loading
    setTimeout(() => {
      try {
        const dist = faceapi.euclideanDistance(
          cccdData.detection.descriptor,
          selfieData.detection.descriptor
        );
        const sim = Math.max(0, Math.min(100, (1 - dist) * 100)).toFixed(1);
        setSimilarity(sim);
      } catch (error) {
        console.error("Lỗi tính toán similarity:", error);
        alert("Lỗi khi tính toán độ tương đồng!");
      } finally {
        setCalculating(false);
      }
    }, 1500); // Hiển thị loading 1.5 giây
  };

  const retakeSelfie = () => {
    setSelfieBlob(null);
    setSelfieData({ detection: null, dataURL: null });
    setSimilarity(null);
    setStep(2);
  };

  const confirmStep3 = async () => {
    if (!similarity) {
      return alert("Vui lòng tính toán độ tương đồng trước!");
    }

    if (similarity < SIMILARITY_THRESHOLD) {
      return alert(`Độ tương đồng chỉ ${similarity}%. Vui lòng chụp lại!`);
    }

    setLoading(true);
    const form = new FormData();
    form.append("cccd", cccdFile);
    form.append("selfie", selfieBlob, "selfie.jpg");
    form.append("fullName", ocr.fullName);
    form.append("number", ocr.number);
    form.append("dob", ocr.dob);
    form.append("address", ocr.address);

    const descriptorArray = Array.from(selfieData.detection.descriptor);
    form.append("faceDescriptor", JSON.stringify(descriptorArray));

    try {
      const res = await api.post("/api/auth/verify-id-face", form);
      if (res.data.success) {
        setStep(4);
        onSuccess?.(res.data.data);
      }
    } catch (e) {
      alert(e.response?.data?.message || "Lỗi xác minh");
    } finally {
      setLoading(false);
    }
  };

  /* --------------------------------------------------------------- */
  // Load models
  useEffect(() => {
    const load = async () => {
      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri("/models"),
          faceapi.nets.faceLandmark68Net.loadFromUri("/models"),
          faceapi.nets.faceRecognitionNet.loadFromUri("/models"),
        ]);
        setModelsLoaded(true);
      } catch (e) {
        alert("Không tải được model. Kiểm tra /public/models");
      }
    };
    load();
  }, []);

  useEffect(() => () => stopCamera(), []);

  /* --------------------------------------------------------------- */
  return (
    <div className="card border-0 shadow-lg">
      <div className="card-header bg-gradient-primary text-white text-center py-3">
        <h5 className="mb-0">Xác minh danh tính (Bước {step}/4)</h5>
      </div>
      <div className="card-body p-4">
        {/* Bước 1 */}
        {step === 1 && (
          <div>
            <h6 className="fw-bold text-primary mb-3">Bước 1: Upload CCCD</h6>
            <input
              type="file"
              accept="image/*"
              onChange={handleCccd}
              className="form-control mb-3"
              disabled={loading || !modelsLoaded}
            />
            {loading && (
              <div className="text-center my-3">
                <div className="spinner-border text-primary"></div>
                <p>Đang xử lý CCCD...</p>
              </div>
            )}

            {cccdFile && !loading && (
              <>
                <div className="row g-3">
                  <div className="col-md-6">
                    <canvas
                      ref={cccdCanvasRef}
                      className="w-100 border rounded shadow-sm"
                      style={{ maxHeight: "250px" }}
                    />
                    {cccdData.detection && (
                      <small className="text-success d-block mt-1">
                        Confidence:{" "}
                        {(cccdData.detection.detection.score * 100).toFixed(1)}%
                      </small>
                    )}
                  </div>
                  <div className="col-md-6">
                    <div className="row g-2">
                      <div className="col-12">
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Họ và tên *"
                          value={ocr.fullName}
                          onChange={(e) =>
                            setOcr({ ...ocr, fullName: e.target.value })
                          }
                        />
                      </div>
                      <div className="col-12">
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Số CCCD *"
                          value={ocr.number}
                          onChange={(e) =>
                            setOcr({ ...ocr, number: e.target.value })
                          }
                        />
                      </div>
                      <div className="col-6">
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Ngày sinh"
                          value={ocr.dob}
                          onChange={(e) =>
                            setOcr({ ...ocr, dob: e.target.value })
                          }
                        />
                      </div>
                      <div className="col-6">
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Địa chỉ"
                          value={ocr.address}
                          onChange={(e) =>
                            setOcr({ ...ocr, address: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-3 text-end">
                  <button
                    onClick={confirmStep1}
                    className="btn btn-success px-4"
                    disabled={!cccdData.detection || loading}
                  >
                    Xác nhận & Tiếp tục
                  </button>
                </div>
              </>
            )}
          </div>
        )}

        {/* Bước 2 */}
        {step === 2 && (
          <div>
            <h6 className="fw-bold text-primary mb-3">Bước 2: Chụp selfie</h6>
            <div className="text-center mb-3">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-100 rounded shadow-sm"
                style={{ maxHeight: "340px" }}
              />
              <canvas ref={canvasRef} style={{ display: "none" }} />
            </div>
            <div className="d-flex justify-content-center gap-2 mb-3">
              <button
                onClick={startCamera}
                className="btn btn-outline-primary"
                disabled={loading}
              >
                Bật camera
              </button>
              <button
                onClick={captureSelfie}
                className="btn btn-success"
                // disabled={loading || !videoRef.current?.srcObject}
              >
                {loading ? "Đang xử lý..." : "Chụp ảnh"}
              </button>
            </div>
          </div>
        )}

        {/* Bước 3 */}
        {step === 3 && (
          <div>
            <h6 className="fw-bold text-primary mb-3">
              Bước 3: So sánh khuôn mặt
            </h6>

            {/* Hiển thị ảnh đã chụp */}
            <div className="row g-3 text-center mb-4">
              <div className="col-md-6">
                <h6>Khuôn mặt CCCD</h6>
                <canvas
                  ref={cccdCanvasRef}
                  className="w-100 border rounded shadow-sm"
                  style={{ maxHeight: "220px" }}
                />
                {cccdData.detection && (
                  <small className="text-success">
                    Confidence:{" "}
                    {(cccdData.detection.detection.score * 100).toFixed(1)}%
                  </small>
                )}
              </div>
              <div className="col-md-6">
                <h6>Khuôn mặt Selfie</h6>
                <canvas
                  ref={selfieCanvasRef}
                  className="w-100 border rounded shadow-sm"
                  style={{ maxHeight: "220px" }}
                />
                {selfieData.detection && (
                  <small className="text-success">
                    Confidence:{" "}
                    {(selfieData.detection.detection.score * 100).toFixed(1)}%
                  </small>
                )}
              </div>
            </div>

            {/* Khu vực tính toán */}
            <div className="text-center mt-3 p-3 bg-light rounded">
              {calculating ? (
                <div>
                  <div className="spinner-border text-primary mb-2"></div>
                  <p className="mb-0">Đang tính toán độ tương đồng...</p>
                </div>
              ) : similarity !== null ? (
                <div>
                  <h5
                    className={
                      similarity >= SIMILARITY_THRESHOLD
                        ? "text-success"
                        : "text-danger"
                    }
                  >
                    Độ tương đồng: <strong>{similarity}%</strong>
                  </h5>
                  {similarity < SIMILARITY_THRESHOLD && (
                    <button
                      onClick={retakeSelfie}
                      className="btn btn-warning btn-sm mt-2"
                    >
                      Chụp lại selfie
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  <p className="text-muted mb-3">
                    Nhấn nút bên dưới để tính toán độ tương đồng
                  </p>
                  <button
                    onClick={calculateSimilarity}
                    className="btn btn-primary"
                    disabled={!selfieData.detection}
                  >
                    Tính toán độ tương đồng
                  </button>
                </div>
              )}
            </div>

            {/* Thông tin xác minh */}
            <div className="mt-3">
              <h6>Thông tin xác minh</h6>
              <div className="row g-2">
                {["fullName", "number", "dob", "address"].map((f) => (
                  <div key={f} className="col-6">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      placeholder={
                        f === "fullName"
                          ? "Họ tên *"
                          : f === "number"
                          ? "Số CCCD *"
                          : f === "dob"
                          ? "Ngày sinh"
                          : "Địa chỉ"
                      }
                      value={ocr[f]}
                      onChange={(e) => setOcr({ ...ocr, [f]: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            </div>

            <hr />
            <div className="d-flex justify-content-between">
              <button
                onClick={() => setStep(1)}
                className="btn btn-outline-secondary"
              >
                Quay lại
              </button>
              <button
                onClick={confirmStep3}
                className="btn btn-success px-4"
                disabled={
                  loading || !similarity || similarity < SIMILARITY_THRESHOLD
                }
              >
                {loading ? "Đang lưu..." : "Xác nhận & Lưu"}
              </button>
            </div>
          </div>
        )}

        {/* Bước 4 */}
        {step === 4 && (
          <div className="text-center py-5">
            <i className="fas fa-check-circle fa-4x text-success mb-4"></i>
            <h4 className="text-success mb-3">Xác minh thành công!</h4>
            <p className="text-muted mb-4">Thông tin đã được lưu.</p>

            <div className="row g-4">
              <div className="col-md-6">
                <h6 className="text-primary">CCCD</h6>
                <canvas
                  ref={cccdCanvasRef}
                  className="w-100 border rounded shadow-sm"
                  style={{ maxHeight: "220px" }}
                />
              </div>
              <div className="col-md-6">
                <h6 className="text-primary">Selfie</h6>
                <canvas
                  ref={selfieCanvasRef}
                  className="w-100 border rounded shadow-sm"
                  style={{ maxHeight: "220px" }}
                />
              </div>
            </div>

            <div className="mt-4 p-3 bg-light rounded text-start">
              <p className="mb-1">
                <strong>Họ tên:</strong> {ocr.fullName}
              </p>
              <p className="mb-1">
                <strong>Số CCCD:</strong> {ocr.number}
              </p>
              <p className="mb-0">
                <strong>Độ tương đồng:</strong>{" "}
                <span className="text-success">{similarity}%</span>
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IdCardVerification;
