// pages/journal/Journal.jsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { useJournal } from "../../contexts/JournalContext";
import { useAuth } from "../../contexts/AuthContext";
import TiptapEditor from "../../components/journal/TiptapEditor";
import { EmotionSelector } from "../../components/journal/EmotionSelector";
import { MediaUploader } from "../../components/journal/MediaUploader";
import { imageUploadService } from "../../services/imageUploadService";
import notificationService from "../../services/notificationService";
import MediaPreview from "../../components/MediaPreview";
import {
  Edit,
  Delete,
  Calendar,
  Clock,
  Lock,
  Unlock,
  Image as ImageIcon,
  Video,
  File,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";

const Journal = () => {
  const { id } = useParams();
  const { user } = useAuth();
  const {
    journalDetail,
    fetchJournalDetail,
    updateJournal,
    detailLoading,
    deleteJournal,
  } = useJournal();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    emotions: [],
    tags: [],
    isPrivate: true,
    media: [], // Media hiện có
    mediaFiles: [], // File mới upload
  });

  // Fetch journal detail khi component mount hoặc id thay đổi
  useEffect(() => {
    if (id) {
      fetchJournalDetail(id);
    }
  }, [id, fetchJournalDetail]);

  // Cập nhật formData khi journalDetail thay đổi
  useEffect(() => {
    if (journalDetail) {
      setFormData({
        title: journalDetail.title || "",
        content: journalDetail.content || "",
        emotions: journalDetail.emotions || [],
        tags: journalDetail.tags || [],
        isPrivate: journalDetail.isPrivate,
        media: journalDetail.media || [],
        mediaFiles: [], // Reset new files when loading detail
      });

      console.log(
        "Fetching journal detail for ID:",
        user?.id,
        " - idUser:",
        journalDetail.userId?._id
      );
    }
  }, [journalDetail, user]);

  const handleImageUpload = async (file) => {
    try {
      const imageUrl = await imageUploadService.uploadImage(file);
      return imageUrl;
    } catch (error) {
      console.error("Image upload failed, using local URL:", error);
      return URL.createObjectURL(file);
    }
  };

  // Thêm tag
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

  // Xử lý file upload mới
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

  // Xóa file hiện có
  const handleRemoveExistingMedia = (index) => {
    setFormData((prev) => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== index),
    }));
  };

  // Hủy chỉnh sửa
  const handleCancelEdit = () => {
    setIsEditing(false);
    if (journalDetail) {
      setFormData({
        title: journalDetail.title || "",
        content: journalDetail.content || "",
        emotions: journalDetail.emotions || [],
        tags: journalDetail.tags || [],
        isPrivate: journalDetail.isPrivate,
        media: journalDetail.media || [],
        mediaFiles: [],
      });
    }
    setTagInput("");
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) {
      notificationService.error({
        title: "Lỗi",
        text: "Vui lòng nhập tiêu đề và nội dung",
        timer: 2000,
        showConfirmButton: false,
      });
      return;
    }

    try {
      console.log("🎯 [Component] Starting update process...");

      // KHÔNG upload file trước - để server xử lý
      const updateData = {
        title: formData.title.trim(),
        content: formData.content,
        emotions: Array.isArray(formData.emotions) ? formData.emotions : [],
        tags: Array.isArray(formData.tags) ? formData.tags : [],
        isPrivate: Boolean(formData.isPrivate),
        media: Array.isArray(formData.media) ? formData.media : [],
        mediaFiles: Array.isArray(formData.mediaFiles)
          ? formData.mediaFiles
          : [],
      };

      console.log("🚀 [Component] Sending to updateJournal:", updateData);

      let res = await updateJournal(updateData, journalDetail._id);

      if (res?.success) {
        console.log("✅ [Component] Update successful!");
        notificationService.success({
          title: "Cập nhật thành công!",
          text: "Nhật ký của bạn đã được cập nhật.",
          timer: 2000,
          showConfirmButton: false,
        });
        setIsEditing(false);
      } else {
        console.error("❌ [Component] Update failed:", res);
        notificationService.error({
          title: "Cập nhật thất bại!",
          text: res?.message || "Lỗi khi cập nhật nhật ký",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error("💥 [Component] Update error:", error);
      notificationService.error({
        title: "Lỗi",
        text: error.response?.data?.message || "Lỗi khi cập nhật nhật ký",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  const handleDelete = async (e) => {
    e.preventDefault();

    const result = await notificationService.confirm({
      title: "Bạn có chắc muốn xoá nhật ký này?",
    });

    if (result.isConfirmed === false) {
      return;
    }
    try {
      console.log("🎯 [Component] Starting delete process...");

      notificationService.confirm({
        title: "Bạn có chắc muốn xoá nhật kí này",
      });

      let res = await deleteJournal(journalDetail._id);

      if (res?.success) {
        console.log("✅ [Component] Update successful!");
        notificationService.success({
          title: "Xoá Nhật Kí Thành Công!",
          text: `${res.message}`,
          timer: 2000,
          showConfirmButton: false,
        });
        navigate("/journal/history");
      } else {
        console.error("❌ [Component] Delete failed:", res);
        notificationService.error({
          title: "Cập nhật thất bại!",
          text: res?.message || "Lỗi khi Xoá nhật ký",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.error("💥 [Component] Delete error:", error);
      notificationService.error({
        title: "Lỗi",
        text: error.response?.data?.message || "Lỗi khi Xoá nhật ký",
        timer: 2000,
        showConfirmButton: false,
      });
    }
  };

  const renderMediaPreview = () => {
    return (
      <div className="mt-4">
        <h6 className="fw-semibold mb-3">File đính kèm:</h6>
        <div className="row">
          {journalDetail?.media && journalDetail.media.length > 0 && (
            <MediaPreview mediaList={journalDetail.media} />
          )}
        </div>
      </div>
    );
  };

  // Hiển thị media khi đang edit
  const renderMediaDuringEdit = () => {
    return (
      <div className="mb-4">
        <h6 className="fw-semibold mb-2">File đính kèm:</h6>

        {/* Media Uploader cho file mới */}
        <MediaUploader
          files={formData.mediaFiles}
          onFilesSelect={handleFilesSelect}
          onFileRemove={removeFile}
        />

        {/* Preview existing media files với option xóa */}
        {formData.media && formData.media.length > 0 && (
          <div className="mt-3">
            <h6 className="fw-semibold mb-2">File hiện có:</h6>
            <div className="row">
              {formData.media.map((mediaUrl, index) => {
                const isImage = mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                const isVideo = mediaUrl.match(/\.(mp4|mov|avi|wmv)$/i);

                return (
                  <div key={index} className="col-6 col-md-4 col-lg-3 mb-3">
                    <div className="card h-100">
                      <div className="card-body p-2 text-center">
                        {isImage ? (
                          <img
                            src={mediaUrl}
                            alt=""
                            className="img-fluid rounded"
                            style={{ maxHeight: "100px", objectFit: "cover" }}
                          />
                        ) : isVideo ? (
                          <video
                            controls
                            className="w-100 rounded"
                            style={{ maxHeight: "100px", objectFit: "cover" }}
                          >
                            <source src={mediaUrl} type="video/mp4" />
                          </video>
                        ) : (
                          <File size={32} className="text-secondary mb-2" />
                        )}

                        <small className="d-block text-truncate">
                          {mediaUrl.split("/").pop()}
                        </small>

                        {/* Option to remove existing media */}
                        <button
                          type="button"
                          className="btn btn-outline-danger btn-sm mt-1"
                          onClick={() => handleRemoveExistingMedia(index)}
                        >
                          Xóa
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return journalDetail ? (
    <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">Chi Tiết Nhật Ký</h2>
          <div className="d-flex align-items-center gap-3 text-muted">
            <span className="d-flex align-items-center gap-1">
              <Calendar size={16} />
              {dayjs(journalDetail.date).format("DD/MM/YYYY")}
            </span>
            <span className="d-flex align-items-center gap-1">
              <Clock size={16} />
              {dayjs(journalDetail.date).format("HH:mm")}
            </span>
            <span
              className={`badge ${
                journalDetail.isPrivate ? "bg-secondary" : "bg-success"
              }`}
            >
              {journalDetail.isPrivate ? (
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

        {!isEditing && user?.id === journalDetail.userId?._id && (
          <div className="d-flex">
            <button
              className="btn btn-outline-primary col-6 d-flex align-items-center gap-2"
              onClick={() => setIsEditing(true)}
            >
              <Edit size={24} />
              <span>Chỉnh sửa</span>
            </button>
            <button
              className="btn btn-outline-danger col-6 d-flex align-items-center gap-2"
              onClick={handleDelete}
            >
              <Delete size={24} />
              <span>Xoá</span>
            </button>
          </div>
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

              {/* Nội dung */}
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

              {/* Emoji */}
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

              {/* Tags Input */}
              <div className="mb-4">
                <h6 className="fw-semibold mb-2">Tags:</h6>
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

              {/* File Upload Section */}
              {renderMediaDuringEdit()}

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
                    disabled={detailLoading}
                    className="btn btn-primary"
                  >
                    {detailLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Đang lưu...
                      </>
                    ) : (
                      "Lưu thay đổi"
                    )}
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
              <h1 className="mb-4">{journalDetail.title}</h1>

              <div
                className="journal-content mb-4"
                dangerouslySetInnerHTML={{ __html: journalDetail.content }}
              />

              {journalDetail.emotions && journalDetail.emotions.length > 0 && (
                <div className="mb-4">
                  <h6 className="fw-semibold mb-2">Cảm xúc:</h6>
                  <div className="d-flex flex-wrap gap-2">
                    {journalDetail.emotions.map((emotion, index) => {
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

              {journalDetail.tags && journalDetail.tags.length > 0 && (
                <div className="mb-4">
                  <h6 className="fw-semibold mb-2">Tags:</h6>
                  <div className="d-flex flex-wrap gap-1">
                    {journalDetail.tags.map((tag, index) => (
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
  ) : (
    <div className="container mt-4">
      {detailLoading ? (
        <div>Loading...</div>
      ) : (
        <div>Không tìm thấy nhật ký. Vui lòng thử lại. {id}</div>
      )}
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
