// pages/journal/Journal.jsx
import React, { useState, useEffect } from "react";
import api from "../../services/api"; // ✅ THÊM: Import instance api
import Swal from "sweetalert2"; // ✅ THÊM: Import SweetAlert2
import { useJournal } from "../../contexts/JournalContext";
import { useAuth } from "../../contexts/AuthContext";
import TiptapEditor from "../../components/journal/TiptapEditor";
import { EmotionSelector } from "../../components/journal/EmotionSelector";
import { imageUploadService } from "../../services/imageUploadService";
import MediaPreview from "../../components/MediaPreview";
import {
  Edit,
  Calendar,
  Clock,
  Lock,
  Unlock,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

const Journal = () => {
  const { user } = useAuth();
  const { todayJournal, updateJournal, loading, fetchTodayJournal } =
    useJournal();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    emotions: [],
    tags: [],
    isPrivate: true,
    mediaFiles: [],
  });

  // ✅ THÊM: useEffect để kiểm tra trạng thái chuỗi khi vào trang
  useEffect(() => {
    const checkJournalStreakStatus = async () => {
      try {
        const response = await api.get("/api/journals/streaks/status");
        const { success, data } = response.data;

        if (success) {
          // Kịch bản 1: Mất chuỗi hoàn toàn
          if (data.hasLostJournalStreak) {
            Swal.fire({
              icon: "error",
              title: "Bạn đã mất chuỗi!",
              text: "Bạn đã bỏ lỡ quá 2 lần viết nhật ký trong tuần này. Chuỗi sẽ được bắt đầu lại từ đầu.",
              confirmButtonText: "Đã hiểu",
            });
          }
          // Kịch bản 2: Chuỗi đang tạm dừng
          else if (data.isPaused) {
            const missesLeft = data.weeklyMissesAllowed - data.weeklyMissesUsed;
            Swal.fire({
              icon: "warning",
              title: "Chuỗi của bạn đang tạm dừng!",
              html: `Bạn đã bỏ lỡ một ngày viết nhật ký. <br/>Hãy viết bài hôm nay để tiếp tục chuỗi nhé. <br/>Bạn còn <strong>${missesLeft}</strong> lần bỏ lỡ trong tuần.`,
              confirmButtonText: "OK, tôi sẽ viết ngay!",
            });
          }
        }
      } catch (error) {
        console.error("Lỗi khi kiểm tra trạng thái chuỗi nhật ký:", error);
      }
    };

    // Chỉ gọi khi có user đăng nhập
    if (user) {
      checkJournalStreakStatus();
    }
  }, [user]); // Phụ thuộc vào user để đảm bảo chỉ chạy khi đã đăng nhập

  useEffect(() => {
    if (todayJournal) {
      setFormData({
        title: todayJournal.title || "",
        content: todayJournal.content || "",
        emotions: todayJournal.emotions || [],
        tags: todayJournal.tags || [],
        isPrivate: todayJournal.isPrivate ?? true,
        mediaFiles: [],
      });
    }
  }, [todayJournal]);

  const handleImageUpload = async (file) => {
    try {
      const imageUrl = await imageUploadService.uploadImage(file);
      return imageUrl;
    } catch (error) {
      console.error("Image upload failed, using local URL:", error);
      return URL.createObjectURL(file);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      alert("Vui lòng nhập tiêu đề và nội dung");
      return;
    }

    try {
      await updateJournal(formData);
      setIsEditing(false);
    } catch (error) {
      alert(error.response?.data?.message || "Lỗi khi cập nhật nhật ký");
    }
  };

  const handleCancelEdit = () => {
    if (todayJournal) {
      setFormData({
        title: todayJournal.title || "",
        content: todayJournal.content || "",
        emotions: todayJournal.emotions || [],
        tags: todayJournal.tags || [],
        isPrivate: todayJournal.isPrivate ?? true,
        mediaFiles: [],
      });
    }
    setIsEditing(false);
  };

  if (!todayJournal) {
    return (
      <div className="container mt-4">
        <div className="alert alert-info text-center">
          <Calendar size={48} className="mb-3 text-primary" />
          <h3>Hôm nay bạn chưa ghi nhật ký</h3>
          <p>
            Hãy bắt đầu ghi lại những trải nghiệm và cảm xúc của bạn ngay bây
            giờ
          </p>
          <button
            className="btn btn-primary d-flex align-items-center gap-2 mx-auto"
            onClick={() => navigate("/journal/create")}
          >
            <Edit size={18} />
            Ghi nhật ký mới
          </button>
        </div>
      </div>
    );
  }

  const renderMediaPreview = () => {
    if (!todayJournal.media || todayJournal.media.length === 0) return null;

    return (
      <div className="mt-4">
        <h6 className="fw-semibold mb-3">File đính kèm:</h6>
        <div className="row">
          {todayJournal?.media && todayJournal.media.length > 0 && (
            <MediaPreview mediaList={todayJournal.media} />
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Nhật ký hôm nay</h2>
          <div className="d-flex align-items-center gap-3 text-muted">
            <span className="d-flex align-items-center gap-1">
              <Calendar size={16} />
              {dayjs(todayJournal.date).format("DD/MM/YYYY")}
            </span>
            <span className="d-flex align-items-center gap-1">
              <Clock size={16} />
              {dayjs(todayJournal.date).format("HH:mm")}
            </span>
            <span
              className={`badge ${
                todayJournal.isPrivate ? "bg-secondary" : "bg-success"
              }`}
            >
              {todayJournal.isPrivate ? (
                <>
                  <Lock size={12} /> Riêng tư
                </>
              ) : (
                <>
                  <Unlock size={12} /> Công khai
                </>
              )}
            </span>
          </div>
        </div>

        {!isEditing && (
          <button
            className="btn btn-outline-primary d-flex align-items-center gap-2"
            onClick={() => setIsEditing(true)}
          >
            <Edit size={16} />
            Chỉnh sửa
          </button>
        )}
      </div>

      <div className="card">
        <div className="card-body">
          {isEditing ? (
            <form onSubmit={handleUpdate}>
              <div className="mb-4">
                <input
                  type="text"
                  className="form-control form-control-lg border-0 fs-3 fw-bold"
                  placeholder="Tiêu đề nhật ký..."
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  required
                />
              </div>

              <div className="mb-4">
                <TiptapEditor
                  value={formData.content}
                  onChange={(content) =>
                    setFormData((prev) => ({ ...prev, content }))
                  }
                  placeholder="Hôm nay của bạn thế nào? Hãy chia sẻ cảm xúc và trải nghiệm của bạn..."
                  onImageUpload={handleImageUpload}
                />
              </div>

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

              <div className="mb-4">
                <h6 className="fw-semibold mb-2">Tags:</h6>
                <div className="d-flex flex-wrap gap-1">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="badge bg-primary d-flex align-items-center gap-1"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            tags: prev.tags.filter((t) => t !== tag),
                          }))
                        }
                        className="btn btn-sm p-0 text-white"
                        style={{ lineHeight: 1 }}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <div className="d-flex justify-content-between align-items-center">
                <div className="d-flex gap-2">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleCancelEdit}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary"
                  >
                    {loading ? "Đang lưu..." : "Lưu thay đổi"}
                  </button>
                </div>

                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="privacySwitch"
                    checked={formData.isPrivate}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        isPrivate: e.target.checked,
                      }))
                    }
                  />
                  <label className="form-check-label" htmlFor="privacySwitch">
                    {formData.isPrivate ? "Riêng tư" : "Công khai"}
                  </label>
                </div>
              </div>
            </form>
          ) : (
            <>
              <h1 className="mb-4">{todayJournal.title}</h1>

              <div
                className="journal-content mb-4"
                dangerouslySetInnerHTML={{ __html: todayJournal.content }}
              />

              {todayJournal.emotions && todayJournal.emotions.length > 0 && (
                <div className="mb-4">
                  <h6 className="fw-semibold mb-2">Cảm xúc:</h6>
                  <div className="d-flex flex-wrap gap-2">
                    {todayJournal.emotions.map((emotion, index) => {
                      const emotionData = EMOTIONS.find(
                        (e) => e.label === emotion
                      );
                      if (!emotionData) return null;

                      return (
                        <span
                          key={index}
                          className="badge d-flex align-items-center gap-1"
                          style={{
                            backgroundColor: emotionData.color,
                            borderColor: emotionData.color,
                          }}
                        >
                          {emotionData.emoji} {emotionData.name}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              {todayJournal.tags && todayJournal.tags.length > 0 && (
                <div className="mb-4">
                  <h6 className="fw-semibold mb-2">Tags:</h6>
                  <div className="d-flex flex-wrap gap-1">
                    {todayJournal.tags.map((tag, index) => (
                      <span key={index} className="badge bg-secondary">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {renderMediaPreview()}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const EMOTIONS = [
  { emoji: "😊", label: "happy", name: "Vui vẻ", color: "#fbbf24" },
  { emoji: "😢", label: "sad", name: "Buồn", color: "#60a5fa" },
  { emoji: "😡", label: "angry", name: "Tức giận", color: "#ef4444" },
  { emoji: "😴", label: "tired", name: "Mệt mỏi", color: "#6b7280" },
  { emoji: "😃", label: "excited", name: "Hào hứng", color: "#f59e0b" },
  { emoji: "😰", label: "anxious", name: "Lo lắng", color: "#8b5cf6" },
  { emoji: "😌", label: "peaceful", name: "Bình yên", color: "#10b981" },
  { emoji: "🤔", label: "thoughtful", name: "Suy tư", color: "#6366f1" },
  { emoji: "🎉", label: "celebratory", name: "Ăn mừng", color: "#ec4899" },
  { emoji: "💪", label: "motivated", name: "Động lực", color: "#84cc16" },
];

export default Journal;
