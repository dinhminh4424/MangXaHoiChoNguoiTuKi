// pages/social/CreatePost.js
import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { usePost } from "../../contexts/PostContext";
import { useAuth } from "../../contexts/AuthContext";
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

const CreatePost = () => {
  const navigate = useNavigate();
  const { createPost } = usePost();
  const { user } = useAuth();

  const [formData, setFormData] = useState({
    content: "",
    privacy: "public",
    isAnonymous: false,
    emotions: "",
    tags: "",
  });

  const [files, setFiles] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    // Validate file sizes and types
    const validFiles = selectedFiles.filter((file) => {
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        setError(`File ${file.name} vượt quá kích thước cho phép (50MB)`);
        return false;
      }
      return true;
    });

    setFiles((prev) => [...prev, ...validFiles]);

    // Create previews
    const newPreviews = validFiles.map((file) => {
      const preview = {
        type: file.type.startsWith("image/")
          ? "image"
          : file.type.startsWith("video/")
          ? "video"
          : "file",
        fileUrl: URL.createObjectURL(file),
        fileName: file.name,
        fileSize: file.size,
        fileObject: file,
      };
      return preview;
    });

    setPreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeFile = (index) => {
    const newFiles = [...files];
    const newPreviews = [...previews];

    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(newPreviews[index].fileUrl);

    newFiles.splice(index, 1);
    newPreviews.splice(index, 1);

    setFiles(newFiles);
    setPreviews(newPreviews);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

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
        files: files,
      };

      console.log("======================== submitData =================");
      console.log(submitData);
      console.log("======================== =================");

      await createPost(submitData);

      // Show success message
      alert("Đăng bài viết thành công!");
      navigate("/feed");
    } catch (err) {
      setError(err.message || "Có lỗi xảy ra khi đăng bài viết");
    } finally {
      setLoading(false);
    }
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

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
                onClick={() => navigate("/feed")}
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
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-lg-8 col-md-10">
            {/* User Info */}
            <div className="user-info-card">
              <div className="d-flex align-items-center">
                <img
                  src={user?.avatar || "/images/default-avatar.png"}
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
                      {privacyOptions.map((option) => {
                        const Icon = option.icon;
                        return (
                          <option key={option.value} value={option.value}>
                            {option.label} - {option.description}
                          </option>
                        );
                      })}
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

            {/* Content Form */}
            <div className="post-form-card">
              <form onSubmit={handleSubmit}>
                {/* Content Textarea */}
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
                  />
                </div>

                {/* File Previews */}
                {previews.length > 0 && (
                  <div className="file-previews mb-4">
                    <div className="row g-2">
                      {previews.map((preview, index) => (
                        <div key={index} className="col-6 col-md-4 col-lg-3">
                          <div className="file-preview-item position-relative">
                            {preview.type === "image" ? (
                              <img
                                src={preview.fileUrl}
                                alt={`Preview ${index}`}
                                className="img-fluid rounded"
                              />
                            ) : preview.type === "video" ? (
                              <div className="video-preview">
                                <video
                                  src={preview.fileUrl}
                                  className="img-fluid rounded"
                                />
                                <div className="video-overlay">
                                  <Video size={24} className="text-white" />
                                </div>
                              </div>
                            ) : (
                              <div className="file-preview-document">
                                <File size={32} className="text-primary" />
                                <div className="file-name">
                                  {preview.fileName}
                                </div>
                                <small className="file-size">
                                  {(preview.fileSize / 1024 / 1024).toFixed(2)}{" "}
                                  MB
                                </small>
                              </div>
                            )}
                            <button
                              type="button"
                              className="btn-remove-file"
                              onClick={() => removeFile(index)}
                              disabled={loading}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Additional Options */}
                <div className="post-options">
                  <div className="row">
                    {/* Emotions */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Cảm xúc</label>
                      <input
                        type="text"
                        name="emotions"
                        value={formData.emotions}
                        onChange={handleInputChange}
                        placeholder="Ví dụ: vui vẻ, lo lắng, hạnh phúc..."
                        className="form-control"
                        disabled={loading}
                      />
                      <div className="form-text">
                        Phân cách nhiều cảm xúc bằng dấu phẩy
                      </div>
                    </div>

                    {/* Tags */}
                    <div className="col-md-6 mb-3">
                      <label className="form-label">Tags</label>
                      <input
                        type="text"
                        name="tags"
                        value={formData.tags}
                        onChange={handleInputChange}
                        placeholder="Ví dụ: #suckhoe #tamly #hoctap..."
                        className="form-control"
                        disabled={loading}
                      />
                      <div className="form-text">
                        Phân cách nhiều tags bằng dấu phẩy
                      </div>
                    </div>
                  </div>

                  {/* Anonymous Option */}
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
                      {/* File Upload Button */}
                      <button
                        type="button"
                        className="btn btn-outline-primary btn-action"
                        onClick={handleFileClick}
                        disabled={loading}
                      >
                        <Image size={18} className="me-2" />
                        Ảnh/Video
                      </button>

                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        onChange={handleFileChange}
                        accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                        className="d-none"
                      />

                      {/* Other Actions */}
                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-action"
                        disabled={loading}
                      >
                        <Smile size={18} className="me-2" />
                        Cảm xúc
                      </button>

                      <button
                        type="button"
                        className="btn btn-outline-secondary btn-action"
                        disabled={loading}
                      >
                        <Paperclip size={18} className="me-2" />
                        File
                      </button>
                    </div>

                    <div className="text-muted small">
                      {formData.content.length}/5000 ký tự
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatePost;
