// pages/journal/CreateJournal.jsx
import React, { useState } from "react";
import { useJournal } from "../../contexts/JournalContext";
import { useAuth } from "../../contexts/AuthContext";
import TiptapEditor from "../../components/journal/TiptapEditor";
import { EmotionSelector } from "../../components/journal/EmotionSelector";
import { MediaUploader } from "../../components/journal/MediaUploader";
import { imageUploadService } from "../../services/imageUploadService";
import { ArrowLeft, Save, Lock, Unlock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const CreateJournal = () => {
  const { user } = useAuth();
  const { createJournal, loading, todayJournal } = useJournal();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    emotions: [],
    tags: [],
    moodRating: 50, // Giá trị mặc định cho thanh trượt là 50%
    moodTriggers: [], // Thêm trường yếu tố kích hoạt
    isPrivate: true,
    mediaFiles: [],
  });
  const [tagInput, setTagInput] = useState("");
  const [triggerInput, setTriggerInput] = useState(""); // State cho input trigger

  // Kiểm tra nếu chưa có user
  if (!user) {
    return (
      <div className="container mt-4">
        <div className="alert alert-warning text-center">
          <h4>Vui lòng đăng nhập</h4>
          <p>Bạn cần đăng nhập để ghi nhật ký</p>
          <button
            className="btn btn-primary"
            onClick={() => navigate("/login")}
          >
            Đăng nhập
          </button>
        </div>
      </div>
    );
  }

  if (todayJournal) {
    return (
      <div className="container mt-4">
        <div className="alert alert-info">
          <h4 className="alert-heading">Hôm nay bạn đã ghi nhật ký rồi!</h4>
          <p>Bạn có muốn xem hoặc chỉnh sửa nhật ký hiện tại không?</p>
          <hr />
          <div className="d-flex gap-2">
            <button
              className="btn btn-primary"
              onClick={() => navigate("/journal")}
            >
              Xem nhật ký hôm nay
            </button>
            <button
              className="btn btn-outline-primary"
              onClick={() => navigate("/journal/history")}
            >
              Lịch sử nhật ký
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleImageUpload = async (file) => {
    try {
      const imageUrl = await imageUploadService.uploadImage(file);
      return imageUrl;
    } catch (error) {
      console.error("Image upload failed, using local URL:", error);
      return URL.createObjectURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      alert("Vui lòng nhập tiêu đề và nội dung");
      return;
    }

    // Tạo object data với userId
    const journalData = {
      ...formData,
      userId: user.id, // Sử dụng cả _id và id để đảm bảo
    };

    console.log("Submitting journal data:", journalData); // Debug

    try {
      await createJournal(journalData);
      navigate("/journal");
    } catch (error) {
      console.error("Journal creation error:", error);
      alert(error.response?.data?.message || "Lỗi khi tạo nhật ký");
    }
  };

  const handleTagAdd = () => {
    if (!tagInput.trim()) return;

    const cleanTag = tagInput.startsWith("#")
      ? tagInput
      : `#${tagInput.trim()}`;
    if (!formData.tags.includes(cleanTag)) {
      setFormData((prev) => ({
        ...prev,
        tags: [...prev.tags, cleanTag],
      }));
    }
    setTagInput("");
  };

  const handleTriggerAdd = () => {
    if (!triggerInput.trim()) return;
    const cleanTrigger = triggerInput.trim();
    if (!formData.moodTriggers.includes(cleanTrigger)) {
      setFormData((prev) => ({
        ...prev,
        moodTriggers: [...prev.moodTriggers, cleanTrigger],
      }));
    }
    setTriggerInput("");
  };

  const handleTagRemove = (tagToRemove) => {
    setFormData((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const handleTriggerRemove = (triggerToRemove) => {
    setFormData((prev) => ({
      ...prev,
      moodTriggers: prev.moodTriggers.filter((t) => t !== triggerToRemove),
    }));
  };

  const handleFilesSelect = (newFiles) => {
    setFormData((prev) => ({
      ...prev,
      mediaFiles: [...prev.mediaFiles, ...newFiles],
    }));
  };

  const removeFile = (index) => {
    setFormData((prev) => ({
      ...prev,
      mediaFiles: prev.mediaFiles.filter((_, i) => i !== index),
    }));
  };

  return (
    <div className="container mt-4">
      <p hidden>id: {user.id}</p>
      <div className="d-flex align-items-center mb-4">
        <button
          className="btn btn-outline-secondary me-3"
          onClick={() => navigate("/journal")}
        >
          <ArrowLeft size={18} />
        </button>
        <div>
          <h2 className="mb-0">Ghi nhật ký mới</h2>
          <p className="text-muted mb-0">
            Chia sẻ những trải nghiệm và cảm xúc của bạn ngày hôm nay
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label className="fw-semibold fs-5 form-label">
                Tiêu đề nhật ký
              </label>
              <input
                type="text"
                className="form-control form-control-lg border-0 border-bottom rounded-0 fs-4 fw-bold"
                placeholder="Nhập tiêu đề cho nhật ký của bạn..."
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                required
                style={{ borderBottom: "2px solid #dee2e6" }}
              />
            </div>

            <div className="mb-4">
              <label className="fw-semibold fs-5 form-label">Nội dung</label>
              <TiptapEditor
                value={formData.content}
                onChange={(content) =>
                  setFormData((prev) => ({ ...prev, content }))
                }
                onImageUpload={handleImageUpload}
                placeholder="Hôm nay của bạn thế nào? Hãy chia sẻ cảm xúc, suy nghĩ và trải nghiệm của bạn..."
              />
            </div>

            {/* === PHẦN NÂNG CẤP: ĐÁNH GIÁ CẢM XÚC VÀ YẾU TỐ KÍCH HOẠT === */}
            <div className="mb-4 p-3 bg-light rounded">
              <label className="fw-semibold fs-5 form-label">
                Đánh giá tâm trạng hôm nay
              </label>
              <p className="text-muted small">
                Kéo thanh trượt để thể hiện mức độ cảm xúc của bạn.
              </p>
              <div className="d-flex align-items-center gap-3">
                <span style={{ fontSize: "1.5rem" }}>😰</span>
                <input
                  type="range"
                  className="form-range flex-grow-1"
                  min="0"
                  max="100"
                  step="1"
                  value={formData.moodRating}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      moodRating: parseInt(e.target.value, 10),
                    }))
                  }
                />
                <span style={{ fontSize: "1.5rem" }}>😍</span>
                <span
                  className="badge bg-primary rounded-pill"
                  style={{ minWidth: "50px" }}
                >
                  {formData.moodRating}%
                </span>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6">
                <div className="mb-4">
                  <EmotionSelector
                    selectedEmotions={formData.emotions}
                    onEmotionSelect={(emotion) => {
                      setFormData((prev) => ({
                        ...prev,
                        emotions: prev.emotions.includes(emotion)
                          ? prev.emotions.filter((e) => e !== emotion)
                          : [...prev.emotions, emotion],
                      }));
                    }}
                  />
                </div>
              </div>

              <div className="col-md-6">
                <div className="mb-4">
                  <label className="fw-semibold form-label">Thẻ tags</label>
                  <div className="d-flex gap-2 mb-2">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Thêm tag mới..."
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleTagAdd();
                        }
                      }}
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={handleTagAdd}
                    >
                      Thêm
                    </button>
                  </div>
                  <div className="d-flex flex-wrap gap-1">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="badge bg-primary d-flex align-items-center gap-1 fs-6"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => handleTagRemove(tag)}
                          className="btn btn-sm p-0 text-white"
                          style={{ lineHeight: 1 }}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <label className="fw-semibold form-label">
                Yếu tố kích hoạt cảm xúc
              </label>
              <div className="d-flex gap-2 mb-2">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ví dụ: công việc, gia đình, bạn bè..."
                  value={triggerInput}
                  onChange={(e) => setTriggerInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleTriggerAdd();
                    }
                  }}
                />
                <button
                  type="button"
                  className="btn btn-outline-secondary"
                  onClick={handleTriggerAdd}
                >
                  Thêm
                </button>
              </div>
              <div className="d-flex flex-wrap gap-1">
                {formData.moodTriggers.map((trigger, index) => (
                  <span
                    key={index}
                    className="badge bg-info text-dark d-flex align-items-center gap-1 fs-6"
                  >
                    {trigger}
                    <button
                      type="button"
                      onClick={() => handleTriggerRemove(trigger)}
                      className="btn btn-sm p-0 text-dark"
                      style={{ lineHeight: 1 }}
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label className="fw-semibold form-label">File đính kèm</label>
              <MediaUploader
                files={formData.mediaFiles}
                onFilesSelect={handleFilesSelect}
                onFileRemove={removeFile}
              />
            </div>

            <div className="d-flex justify-content-between align-items-center border-top pt-4">
              <div className="form-check form-switch">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="privacy-switch"
                  checked={formData.isPrivate}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      isPrivate: e.target.checked,
                    }))
                  }
                />
                <label
                  className="form-check-label fw-semibold d-flex align-items-center gap-2"
                  htmlFor="privacy-switch"
                >
                  {formData.isPrivate ? (
                    <Lock size={18} />
                  ) : (
                    <Unlock size={18} />
                  )}
                  {formData.isPrivate
                    ? "Nhật ký riêng tư"
                    : "Nhật ký công khai"}
                </label>
              </div>

              <button
                type="submit"
                disabled={
                  loading || !formData.title.trim() || !formData.content.trim()
                }
                className="btn btn-primary d-flex align-items-center gap-2 px-4 py-2"
              >
                <Save size={20} />
                {loading ? "Đang xử lý..." : "Ghi nhật ký"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default CreateJournal;
