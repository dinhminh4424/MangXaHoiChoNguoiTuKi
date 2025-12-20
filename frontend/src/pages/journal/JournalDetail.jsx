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
  ArrowLeft,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import dayjs from "dayjs";
import "./Journal.css";

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
    media: [],
    mediaFiles: [],
  });

  useEffect(() => {
    if (id) {
      fetchJournalDetail(id);
    }
  }, [id, fetchJournalDetail]);

  useEffect(() => {
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

  const handleRemoveExistingMedia = (index) => {
    setFormData((prev) => ({
      ...prev,
      media: prev.media.filter((_, i) => i !== index),
    }));
  };

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

      let res = await updateJournal(updateData, journalDetail._id);

      if (res?.success) {
        notificationService.success({
          title: "Cập nhật thành công!",
          text: "Nhật ký của bạn đã được cập nhật.",
          timer: 2000,
          showConfirmButton: false,
        });
        setIsEditing(false);
      } else {
        notificationService.error({
          title: "Cập nhật thất bại!",
          text: res?.message || "Lỗi khi cập nhật nhật ký",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (error) {
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
      let res = await deleteJournal(journalDetail._id);

      if (res?.success) {
        notificationService.success({
          title: "Xoá Nhật Kí Thành Công!",
          text: `${res.message}`,
          timer: 2000,
          showConfirmButton: false,
        });
        navigate("/journal/history");
      } else {
        notificationService.error({
          title: "Cập nhật thất bại!",
          text: res?.message || "Lỗi khi Xoá nhật ký",
          timer: 2000,
          showConfirmButton: false,
        });
      }
    } catch (error) {
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

  const renderMediaDuringEdit = () => {
    return (
      <div className="mb-4">
        <h6 className="fw-semibold mb-2">File đính kèm:</h6>

        <MediaUploader
          files={formData.mediaFiles}
          onFilesSelect={handleFilesSelect}
          onFileRemove={removeFile}
        />

        {formData.media && formData.media.length > 0 && (
          <div className="mt-3">
            <h6 className="fw-semibold mb-2">File hiện có:</h6>
            <div className="row">
              {formData.media.map((mediaUrl, index) => {
                const isImage = mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i);
                const isVideo = mediaUrl.match(/\.(mp4|mov|avi|wmv)$/i);

                return (
                  <div key={index} className="col-6 col-md-4 col-lg-3 mb-3">
                    <div className="card journal-media-preview h-100 border-0 shadow-sm">
                      <div className="card-body p-2 text-center position-relative">
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

                        <small className="d-block text-truncate mt-2">
                          {mediaUrl.split("/").pop()}
                        </small>

                        <button
                          type="button"
                          className="btn btn-sm btn-outline-danger mt-2 journal-media-remove"
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

  if (detailLoading) {
    return (
      <div className="journal-loading-container">
        <div className="text-center">
          <div className="journal-loading-spinner"></div>
          <p className="journal-loading-text">Đang tải nhật ký...</p>
        </div>
      </div>
    );
  }

  if (!journalDetail) {
    return (
      <div className="journal-not-found container mt-5">
        <div className="journal-not-found-icon">📝</div>
        <p className="journal-not-found-text">Không tìm thấy nhật ký</p>
        <p className="text-muted">
          Có thể nhật ký đã bị xóa hoặc bạn không có quyền truy cập
        </p>
        <button
          className="btn btn-primary journal-not-found-btn"
          onClick={() => navigate("/journal/history")}
        >
          <ArrowLeft size={20} className="me-2" />
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const isOwner = user?.id === journalDetail.userId?._id;

  return (
    <div className="journal-detail-container">
      {/* Header */}
      <div className="journal-detail-header">
        <div className="container">
          <button
            className="btn btn-light btn-sm mb-3 d-inline-flex align-items-center gap-2"
            onClick={() => navigate("/journal/history")}
          >
            <ArrowLeft size={16} />
            Quay lại
          </button>

          <div className="d-flex justify-content-between align-items-start flex-wrap ">
            <div>
              <h1 className="journal-detail-title mb-3">
                {isEditing ? "Chỉnh sửa nhật ký" : journalDetail.title}
              </h1>
            </div>

            <div className="d-flex flex-column flex-md-row justify-content-between align-items-start align-items-md-center gap-2">
              <div className="journal-detail-meta flex-grow-1">
                <span className="journal-meta-item">
                  <Calendar size={16} />
                  {dayjs(journalDetail.date).format("DD/MM/YYYY")}
                </span>
                <span className="journal-meta-item">
                  <Clock size={16} />
                  {dayjs(journalDetail.date).format("HH:mm")}
                </span>
                <span
                  className={`badge ${
                    journalDetail.isPrivate ? "bg-secondary" : "bg-success"
                  } p-2`}
                >
                  {journalDetail.isPrivate ? (
                    <>
                      <Lock size={12} className="me-1" /> Riêng tư
                    </>
                  ) : (
                    <>
                      <Unlock size={12} className="me-1" /> Công khai
                    </>
                  )}
                </span>
              </div>
              {isOwner && !isEditing && (
                <div className="d-flex gap-2 mt-3 mt-md-0">
                  <button
                    className="btn btn-warning journal-action-btn"
                    onClick={() => setIsEditing(true)}
                  >
                    <Edit size={18} />
                    Chỉnh sửa
                  </button>
                  <button
                    className="btn btn-danger journal-action-btn"
                    onClick={handleDelete}
                  >
                    <Delete size={18} />
                    Xoá
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mt-4">
        <div className="card journal-content-card">
          <div className="card-body">
            {isEditing ? (
              <form onSubmit={handleUpdate}>
                {/* Title */}
                <div className="mb-4">
                  <input
                    type="text"
                    className="form-control border-0 journal-edit-title"
                    placeholder="Tiêu đề nhật ký..."
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                    required
                  />
                </div>

                {/* Content Editor */}
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

                {/* Emotions */}
                <div className="journal-emotion-section mb-4">
                  <h6 className="fw-bold mb-3">Cảm xúc:</h6>
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

                {/* Tags */}
                <div className="mb-4">
                  <h6 className="fw-bold mb-3">Tags:</h6>
                  <div className="d-flex gap-2 mb-3">
                    <input
                      type="text"
                      className="form-control journal-tag-input"
                      placeholder="Thêm tag mới (nhấn Enter để thêm)..."
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
                  <div className="d-flex flex-wrap gap-2">
                    {formData.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="badge bg-primary journal-tag-badge"
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
                          className="journal-tag-remove"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>

                {/* Media Upload */}
                {renderMediaDuringEdit()}

                {/* Action Buttons */}
                <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
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

                  <div className="form-check form-switch journal-privacy-toggle">
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
                    <label
                      className="form-check-label fw-bold"
                      htmlFor="privacySwitch"
                    >
                      {formData.isPrivate ? "🔒 Riêng tư" : "🔓 Công khai"}
                    </label>
                  </div>
                </div>
              </form>
            ) : (
              <>
                {/* Title Display */}
                <h1 className="display-5 fw-bold mb-4">
                  {journalDetail.title}
                </h1>

                {/* Content Display */}
                <div
                  className="journal-content-display mb-5"
                  dangerouslySetInnerHTML={{ __html: journalDetail.content }}
                />

                {/* Emotions Display */}
                {journalDetail.emotions &&
                  journalDetail.emotions.length > 0 && (
                    <div className="mb-4">
                      <h5 className="fw-bold mb-3">🎭 Cảm xúc:</h5>
                      <div className="d-flex flex-wrap gap-2">
                        {journalDetail.emotions.map((emotion, index) => {
                          const emotionData = EMOTIONS.find(
                            (e) => e.label === emotion
                          );
                          if (!emotionData) return null;

                          return (
                            <span
                              key={index}
                              className="journal-emotion-badge"
                              style={{
                                backgroundColor: `${emotionData.color}20`,
                                color: emotionData.color,
                                borderColor: emotionData.color,
                              }}
                            >
                              <span className="fs-4">{emotionData.emoji}</span>
                              <span className="ms-2">{emotionData.name}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                  )}

                {/* Tags Display */}
                {journalDetail.tags && journalDetail.tags.length > 0 && (
                  <div className="mb-4">
                    <h5 className="fw-bold mb-3">🏷️ Tags:</h5>
                    <div className="d-flex flex-wrap gap-2">
                      {journalDetail.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="badge bg-secondary journal-tag-badge fs-6"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Media Preview */}
                {journalDetail.media && journalDetail.media.length > 0 && (
                  <div className="mt-5">
                    <h5 className="fw-bold mb-4">📎 File đính kèm:</h5>
                    <div className="row">
                      <MediaPreview mediaList={journalDetail.media} />
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const EMOTIONS = [
  { emoji: "😊", label: "happy", name: "Vui vẻ", color: "#f59e0b" },
  { emoji: "😢", label: "sad", name: "Buồn", color: "#60a5fa" },
  { emoji: "😡", label: "angry", name: "Tức giận", color: "#ef4444" },
  { emoji: "😴", label: "tired", name: "Mệt mỏi", color: "#6b7280" },
  { emoji: "😃", label: "excited", name: "Hào hứng", color: "#f97316" },
  { emoji: "😰", label: "anxious", name: "Lo lắng", color: "#8b5cf6" },
  { emoji: "😌", label: "peaceful", name: "Bình yên", color: "#10b981" },
  { emoji: "🤔", label: "thoughtful", name: "Suy tư", color: "#6366f1" },
  { emoji: "🎉", label: "celebratory", name: "Ăn mừng", color: "#ec4899" },
  { emoji: "💪", label: "motivated", name: "Động lực", color: "#84cc16" },
];

export default Journal;
