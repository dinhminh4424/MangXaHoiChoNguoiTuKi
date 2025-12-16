// pages/social/CreatePost.js
import React, { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePost } from "../../contexts/PostContext";
import { useAuth } from "../../contexts/AuthContext";

import groupService from "../../services/groupService";
import NotificationService from "../../services/notificationService";
import {
  ArrowLeft,
  Image,
  Video,
  File,
  X,
  Smile,
  Paperclip,
  Globe,
  Users,
  Lock,
  Send,
} from "lucide-react";
import "./CreatePost.css";

const readableFileSize = (size) => {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / 1024 / 1024).toFixed(2)} MB`;
};

const CreatePost = () => {
  const navigate = useNavigate();
  const { createPost } = usePost();
  const { user } = useAuth();

  const { groupId } = useParams();

  // const groupId = idOfGroup;

  const [formData, setFormData] = useState({
    content: "",
    privacy: "public",
    isAnonymous: false,
    emotions: "",
    tags: "",
  });

  const [files, setFiles] = useState([]); // raw File objects
  const [previews, setPreviews] = useState([]); // { type, fileUrl, fileName, fileSize, fileObject }
  const [loading, setLoading] = useState(false);
  const [loadingGroup, setLoadingGroup] = useState(true);
  const [error, setError] = useState("");
  const [group, setGroup] = useState(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const dropRef = useRef(null);

  // Modal state for viewing full image/video
  const [viewer, setViewer] = useState({ open: false, index: null });

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const makePreviewForFile = (file) => {
    const url = URL.createObjectURL(file);
    const type = file.type.startsWith("image/")
      ? "image"
      : file.type.startsWith("video/")
      ? "video"
      : "file";
    return {
      type,
      fileUrl: url,
      fileName: file.name,
      fileSize: file.size,
      fileObject: file,
    };
  };

  const addFiles = (selectedFiles) => {
    const validFiles = [];
    for (const file of selectedFiles) {
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        setError(`File ${file.name} vượt quá kích thước cho phép (50MB)`);
        continue;
      }
      validFiles.push(file);
    }
    if (validFiles.length === 0) return;

    setFiles((prev) => [...prev, ...validFiles]);
    const newPreviews = validFiles.map((f) => makePreviewForFile(f));
    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const handleFileChange = (e) => {
    const selected = Array.from(e.target.files || []);
    addFiles(selected);
    // reset input so selecting same file again triggers change
    e.target.value = null;
  };

  // Drag & drop handlers
  useEffect(() => {
    const dropArea = dropRef.current;
    if (!dropArea) return;

    const preventDefault = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };
    const handleDrop = (e) => {
      preventDefault(e);
      const dt = e.dataTransfer;
      const dropped = Array.from(dt.files || []);
      addFiles(dropped);
    };

    ["dragenter", "dragover", "dragleave", "drop"].forEach((evt) =>
      dropArea.addEventListener(evt, preventDefault)
    );
    dropArea.addEventListener("drop", handleDrop);

    return () => {
      ["dragenter", "dragover", "dragleave", "drop"].forEach((evt) =>
        dropArea.removeEventListener(evt, preventDefault)
      );
      dropArea.removeEventListener("drop", handleDrop);
    };
  }, []);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      previews.forEach((p) => {
        try {
          URL.revokeObjectURL(p.fileUrl);
        } catch (e) {}
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadGroup = async (groupId) => {
    if (groupId) {
      try {
        setLoadingGroup(true);
        const response = await groupService.getGroup(groupId);

        if (response.success) {
          setGroup(response.group);
        }
      } catch (err) {
        setError(err.response?.data?.message || "Lỗi khi tải thông tin nhóm");
      } finally {
        setLoadingGroup(false);
      }
    }
  };

  useEffect(() => {
    if (groupId) {
      loadGroup(groupId);
    }
  }, [groupId]);

  const removeFile = (index) => {
    setFiles((prev) => {
      const newFiles = [...prev];
      newFiles.splice(index, 1);
      return newFiles;
    });
    setPreviews((prev) => {
      const newPreviews = [...prev];
      if (newPreviews[index]) {
        try {
          URL.revokeObjectURL(newPreviews[index].fileUrl);
        } catch (e) {}
      }
      newPreviews.splice(index, 1);
      return newPreviews;
    });
    // close viewer if it was open for removed item
    if (viewer.open && viewer.index === index) {
      setViewer({ open: false, index: null });
    }
  };

  const handleSubmit = async (e) => {
    e && e.preventDefault();
    if (!formData.content.trim() && files.length === 0) {
      setError("Vui lòng nhập nội dung hoặc chọn file đính kèm");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const submitData = {
        ...formData,
        emotions: formData.emotions
          .split(",")
          .map((e) => e.trim())
          .filter((e) => e),
        tags: formData.tags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t),
        files: files, // assume createPost handles File objects / FormData
      };

      if (groupId) submitData.groupId = groupId;

      await createPost(submitData);

      // alert("Đăng bài viết thành công!");

      NotificationService.success({
        title: "Đăng bài viết thành công!",
        text: "Bài viết của bạn đã được đăng.",
      });

      if (groupId) {
        navigate(`/group/${groupId}`);
      } else {
        navigate("/feed");
      }
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra khi đăng bài viết");
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = () => fileInputRef.current?.click();

  const openViewer = (index) => setViewer({ open: true, index });
  const closeViewer = () => setViewer({ open: false, index: null });

  const privacyOptions = [
    {
      value: "public",
      icon: Globe,
      label: "Công khai",
      description: "Mọi người đều có thể xem",
    },
    {
      value: "friends",
      icon: Users,
      label: "Bạn bè",
      description: "Chỉ bạn bè có thể xem",
    },
    {
      value: "private",
      icon: Lock,
      label: "Riêng tư",
      description: "Chỉ mình tôi có thể xem",
    },
  ];

  return (
    <div className="create-post-container">
      {/* Header */}
      <div className="create-post-header">
        <div className="container">
          <div className="row align-items-center">
            <div className="col">
              <button
                className="btn btn-back"
                onClick={() =>
                  groupId ? navigate("/group/" + groupId) : navigate("/feed")
                }
                disabled={loading}
              >
                <ArrowLeft size={20} />
              </button>
              <h1 className="page-title">Tạo bài viết mới</h1>
            </div>
            <div className="col-auto">
              <button
                className="btn btn-primary btn-publish"
                onClick={handleSubmit}
                disabled={
                  loading || (!formData.content.trim() && files.length === 0)
                }
              >
                {loading ? (
                  <div
                    className="spinner-border spinner-border-sm me-2"
                    role="status"
                  >
                    <span className="visually-hidden">Loading...</span>
                  </div>
                ) : (
                  <Send size={16} className="me-2" />
                )}
                Đăng bài
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mt-3">
        <div className="row justify-content-center">
          <div className="col-lg-8 col-md-10">
            {/* User Info */}
            <div className="user-info-card">
              <div className="d-flex align-items-center">
                <img
                  src={
                    user?.profile?.avatar || "/assets/images/default-avatar.png"
                  }
                  alt="Avatar"
                  className="user-avatar"
                />
                <div className="user-details">
                  <div className="user-name">
                    {formData.isAnonymous ? "🕶️ Ẩn danh" : user?.fullName}
                  </div>
                  <div className="privacy-selector">
                    <select
                      name="privacy"
                      value={formData.privacy}
                      onChange={handleInputChange}
                      className="form-select privacy-select"
                      disabled={loading}
                    >
                      {privacyOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label} - {option.description}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Alert */}
            {error && (
              <div
                className="alert alert-danger alert-dismissible fade show"
                role="alert"
              >
                {error}
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setError("")}
                ></button>
              </div>
            )}

            {/* group */}
            {groupId && (
              <>
                {loadingGroup ? (
                  // --- Trạng thái loading ---
                  <div className="group-info-card d-flex justify-content-center align-items-center p-4 mb-2">
                    <div className="text-center text-light">
                      <div
                        className="spinner-border text-light mb-2"
                        role="status"
                      ></div>
                      <div>Đang tải thông tin nhóm...</div>
                    </div>
                  </div>
                ) : (
                  // --- Thông tin nhóm ---
                  <div
                    className="group-info-card text-white mb-3"
                    style={{
                      backdropFilter: "blur(4px)",
                      backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${
                        group?.coverPhoto ||
                        group?.avatar ||
                        "/assets/images/default-cover.jpg"
                      })`,
                    }}
                  >
                    <div className="group-info-content d-flex align-items-center p-3">
                      <img
                        src={
                          group?.avatar || "/assets/images/default-avatar.png"
                        }
                        alt="Avatar"
                        className="group-avatar-create me-3"
                      />

                      <div className="group-details">
                        <div className="group-name fw-bold mb-1">
                          {group?.name}
                        </div>

                        <div className="group-description text-light small mb-2">
                          {group?.description || "Không có mô tả"}
                        </div>

                        <div className="group-meta small text-light-50">
                          <span>{group?.memberCount ?? 0} thành viên</span>
                          <span className="mx-2">•</span>
                          <span>
                            {group?.visibility === "public"
                              ? "Công khai"
                              : group?.visibility === "private"
                              ? "Riêng tư"
                              : "Chỉ mời"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Content Form */}
            <div className="post-form-card">
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <textarea
                    ref={textareaRef}
                    name="content"
                    value={formData.content}
                    onChange={handleInputChange}
                    placeholder="Bạn đang nghĩ gì?..."
                    className="form-control post-textarea"
                    rows="6"
                    disabled={loading}
                    maxLength={5000}
                  />
                </div>

                {/* Dropzone + File Previews */}
                <div
                  ref={dropRef}
                  className="dropzone-area mb-3"
                  aria-label="Khu vực kéo thả file"
                >
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <div className="small text-muted">
                      Đính kèm: {previews.length} file
                    </div>
                    <div className="small text-muted">
                      {formData.content.length}/5000 ký tự
                    </div>
                  </div>

                  {previews.length > 0 ? (
                    <div className="file-previews-grid mb-3">
                      {previews.map((preview, index) => (
                        <div
                          key={index}
                          className="file-preview-item position-relative"
                        >
                          {preview.type === "image" ? (
                            <img
                              src={preview.fileUrl}
                              alt={preview.fileName}
                              className="preview-thumb"
                              onClick={() => openViewer(index)}
                              loading="lazy"
                              role="button"
                            />
                          ) : preview.type === "video" ? (
                            <div
                              className="video-thumb"
                              onClick={() => openViewer(index)}
                              role="button"
                            >
                              <video
                                src={preview.fileUrl}
                                className="preview-thumb-video"
                                preload="metadata"
                              />
                              <div className="video-icon">
                                <Video size={20} />
                              </div>
                            </div>
                          ) : (
                            <div className="document-thumb">
                              <File size={28} />
                              <div className="doc-meta">
                                <div className="doc-name">
                                  {preview.fileName}
                                </div>
                                <small className="doc-size">
                                  {readableFileSize(preview.fileSize)}
                                </small>
                              </div>
                            </div>
                          )}

                          <button
                            type="button"
                            className="btn-remove-file"
                            onClick={() => removeFile(index)}
                            disabled={loading}
                            aria-label={`Xóa file ${preview.fileName}`}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="dropzone-placeholder">
                      <div className="d-flex gap-2 align-items-center">
                        <button
                          type="button"
                          className="btn btn-outline-primary btn-action"
                          onClick={handleFileClick}
                          disabled={loading}
                        >
                          <Image size={18} className="me-2" /> Ảnh/Video
                        </button>
                        <button
                          type="button"
                          className="btn btn-outline-secondary btn-action"
                          disabled={loading}
                          onClick={handleFileClick}
                        >
                          <Paperclip size={18} className="me-2" /> File
                        </button>
                      </div>
                      <div className="mt-2 small text-muted">
                        Kéo thả file vào đây hoặc bấm "Ảnh/Video" để chọn
                      </div>
                    </div>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                    className="d-none"
                  />
                </div>

                {/* Additional Options */}
                <div className="post-options mb-3">
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Cảm xúc</label>
                      <input
                        type="text"
                        name="emotions"
                        value={formData.emotions}
                        onChange={handleInputChange}
                        placeholder="Ví dụ: vui vẻ, lo lắng..."
                        className="form-control"
                        disabled={loading}
                      />
                      <div className="form-text">
                        Phân cách nhiều cảm xúc bằng dấu phẩy
                      </div>
                    </div>

                    <div className="col-md-6 mb-3">
                      <label className="form-label">Tags</label>
                      <input
                        type="text"
                        name="tags"
                        value={formData.tags}
                        onChange={handleInputChange}
                        placeholder="Ví dụ: #suckhoe #tamly..."
                        className="form-control"
                        disabled={loading}
                      />
                      <div className="form-text">
                        Phân cách nhiều tags bằng dấu phẩy
                      </div>
                    </div>
                  </div>

                  <div className="mb-4">
                    <div className="form-check">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="isAnonymous"
                        checked={formData.isAnonymous}
                        onChange={handleInputChange}
                        id="anonymousCheck"
                        disabled={loading}
                      />
                      <label
                        className="form-check-label"
                        htmlFor="anonymousCheck"
                      >
                        🕶️ Đăng ẩn danh
                      </label>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="post-actions">
                  <div className="d-flex justify-content-between align-items-center">
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-action"
                        onClick={handleFileClick}
                        disabled={loading}
                      >
                        <Image size={18} className="me-2" /> Ảnh/Video
                      </button>

                      {/* <button
                        type="button"
                        className="btn btn-outline-secondary btn-action"
                        disabled={loading}
                      >
                        <Smile size={18} className="me-2" /> Cảm xúc
                      </button> */}

                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-action"
                        onClick={handleFileClick}
                        disabled={loading}
                      >
                        <Paperclip size={18} className="me-2" /> File
                      </button>
                    </div>

                    <div>
                      <button
                        className="btn btn-primary"
                        onClick={handleSubmit}
                        disabled={
                          loading ||
                          (!formData.content.trim() && files.length === 0)
                        }
                      >
                        {loading ? (
                          <div
                            className="spinner-border spinner-border-sm me-2"
                            role="status"
                          >
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        ) : (
                          <Send size={16} className="me-2" />
                        )}
                        Đăng bài
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>

            {/* Viewer Modal */}
            {viewer.open !== false &&
              viewer.index !== null &&
              previews[viewer.index] && (
                <div
                  className="viewer-overlay"
                  role="dialog"
                  aria-modal="true"
                  onClick={closeViewer}
                >
                  <div
                    className="viewer-content"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      className="viewer-close"
                      onClick={closeViewer}
                      aria-label="Đóng"
                    >
                      <X size={18} />
                    </button>
                    {previews[viewer.index].type === "image" ? (
                      <img
                        src={previews[viewer.index].fileUrl}
                        alt={previews[viewer.index].fileName}
                        className="viewer-image"
                      />
                    ) : previews[viewer.index].type === "video" ? (
                      <video
                        src={previews[viewer.index].fileUrl}
                        controls
                        className="viewer-video"
                      />
                    ) : (
                      <div className="viewer-file">
                        <File size={48} />
                        <div className="viewer-file-meta">
                          <div>{previews[viewer.index].fileName}</div>
                          <small>
                            {readableFileSize(previews[viewer.index].fileSize)}
                          </small>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
