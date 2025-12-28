// components/Post/PostHeader.js
import React, { useState, useRef, useEffect } from "react";
import {
  MoreHorizontal,
  Edit3,
  Trash2,
  Eye,
  Flag,
  X,
  Image,
  Globe,
  Users,
  Lock,
} from "lucide-react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import "dayjs/locale/vi";
import "./PostHeader.css";
import { Link, useNavigate } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";
import TiptapEditor from "../journal/TiptapEditor";

dayjs.extend(relativeTime);
dayjs.locale("vi");

const PostHeader = ({ post, isOwner, onUpdate, onDelete, onReport }) => {
  const [showMenu, setShowMenu] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportData, setReportData] = useState({
    targetType: "Post",
    targetId: post._id,
    reason: "",
    notes: "",
    files: [], // Chứa các file object chưa upload
  });
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  const toggleRef = useRef(null);
  const menuRef = useRef(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    // Validate file sizes and types
    const validFiles = selectedFiles.filter((file) => {
      const maxSize = 50 * 1024 * 1024; // 50MB
      if (file.size > maxSize) {
        alert(`File ${file.name} vượt quá kích thước cho phép (50MB)`);
        return false;
      }
      if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
        alert(`File ${file.name} không phải là hình ảnh hoặc video`);
        return false;
      }
      return true;
    });

    // Create preview objects với file gốc
    const newFiles = validFiles.map((file) => {
      return {
        type: file.type.startsWith("image/") ? "image" : "video",
        fileUrl: URL.createObjectURL(file), // Chỉ dùng cho preview
        fileName: file.name,
        fileSize: file.size,
        fileObject: file, // Giữ file gốc để sau này upload
        mimeType: file.type,
      };
    });

    setReportData((prev) => ({
      ...prev,
      files: [...prev.files, ...newFiles],
    }));

    // Reset input để cho phép chọn lại cùng file
    e.target.value = "";
  };

  const removeFile = (index) => {
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(reportData.files[index].fileUrl);

    setReportData((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
  };

  const handleFileClick = () => {
    fileInputRef.current?.click();
  };

  const handleMenuToggle = (e) => {
    e.stopPropagation();
    setShowMenu((s) => !s);
  };

  const handleMenuAction = (action) => {
    setShowMenu(false);
    switch (action) {
      case "edit":
        if (onUpdate) {
          onUpdate(post);
        }
        break;
      case "delete":
        if (onDelete) {
          onDelete();
        }
        break;
      case "detail":
        navigate("/posts/" + post._id);
        break;
      case "report":
        setShowReport(true);
        break;
      default:
        break;
    }
  };

  const handleSubmitReport = async () => {
    try {
      // Validate
      if (!reportData.reason) {
        alert("Vui lòng chọn lý do báo cáo");
        return;
      }

      setUploading(true);

      // Chuẩn bị data để gửi lên component cha
      const submitData = {
        targetType: reportData.targetType,
        targetId: reportData.targetId,
        reason: reportData.reason,
        notes: reportData.notes,
        files: reportData.files,
        // files: reportData.files.map((file) => ({
        //   fileObject: file.fileObject, // File gốc
        //   fileName: file.fileName,
        //   fileSize: file.fileSize,
        //   mimeType: file.mimeType,
        //   type: file.type,
        // })),
      };

      console.log("Report data Khi nhấn submit:", submitData);

      // Gọi hàm onReport từ props để xử lý ở component cha
      if (onReport) {
        await onReport(submitData);
      }

      // Đóng modal và reset form
      setShowReport(false);
      setReportData({
        targetType: "Post",
        targetId: post._id,
        reason: "",
        notes: "",
        files: [],
      });
    } catch (error) {
      console.error("Error submitting report:", error);
      alert("Có lỗi xảy ra khi gửi báo cáo");
    } finally {
      setUploading(false);
    }
  };

  // Click outside để đóng menu
  useEffect(() => {
    const onDocClick = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        toggleRef.current &&
        !toggleRef.current.contains(e.target)
      ) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  // Clean up object URLs when component unmounts
  useEffect(() => {
    return () => {
      reportData.files.forEach((file) => {
        if (file.fileUrl && file.fileUrl.startsWith("blob:")) {
          URL.revokeObjectURL(file.fileUrl);
        }
      });
    };
  }, [reportData.files]);

  return (
    <div className="post-header">
      <div className="header-content d-flex align-items-start justify-content-between">
        <div className="user-info d-flex align-items-start">
          {post.isAnonymous ? (
            <img
              src={"/assets/images/andanh.jpg"}
              alt="Avatar"
              className="user-avatar rounded-circle"
            />
          ) : (
            <Link to={`/profile/${post.userCreateID._id}`}>
              <img
                src={
                  post.isAnonymous
                    ? "/assets/images/andanh.jpg"
                    : post.userCreateID.profile?.avatar ||
                      "/assets/images/default-avatar.png"
                }
                alt="Avatar"
                className="user-avatar rounded-circle"
              />
            </Link>
          )}

          <div className="user-details ms-2 ">
            <div className="user-name text-start">
              <h5>
                {post.isAnonymous ? "Ẩn danh" : post.userCreateID.fullName}
              </h5>
            </div>
            {post.group?._id && (
              <Link
                to={`/group/${post.group._id}`}
                className="group-badge btn btn-sm btn-outline-primary"
              >
                {post.group.name}
              </Link>
            )}
            <div className="post-meta small text-muted">
              <span className="post-time">
                {dayjs(post.createdAt).fromNow()}
              </span>
              {post.isEdited && (
                <span className="edited-badge"> • Đã chỉnh sửa</span>
              )}
            </div>

            {post.isBlocked && (
              <div className="user-details">
                <div className="user-name text-start">
                  <span class="badge text-bg-danger">
                    Bài viết đã bị khoá do vi phạm
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="header-actions">
          <div
            className={`menu-container dropdown ${showMenu ? "show" : ""}`}
            style={{ position: "relative" }}
          >
            <button
              ref={toggleRef}
              className="menu-toggle btn btn-sm btn-light dropdown-toggle"
              onClick={handleMenuToggle}
              aria-expanded={showMenu}
              aria-haspopup="true"
            >
              <MoreHorizontal size={18} />
            </button>

            <div
              ref={menuRef}
              className={`dropdown-menu ${showMenu ? "show" : ""}`}
              style={{ right: 0, left: "auto" }}
            >
              {isOwner ? (
                <>
                  <button
                    className="dropdown-item d-flex align-items-center"
                    onClick={() => handleMenuAction("edit")}
                  >
                    <Edit3 size={16} /> <span className="ms-2"> Chỉnh sửa</span>
                  </button>
                  <button
                    className="dropdown-item d-flex align-items-center text-danger"
                    onClick={() => handleMenuAction("delete")}
                  >
                    <Trash2 size={16} /> <span className="ms-2"> Xóa</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="dropdown-item d-flex align-items-center"
                    onClick={() => handleMenuAction("report")}
                  >
                    <Flag size={16} /> <span className="ms-2"> Báo cáo</span>
                  </button>
                  <button
                    className="dropdown-item d-flex align-items-center"
                    onClick={() => handleMenuAction("detail")}
                  >
                    <Eye size={16} />{" "}
                    <span className="ms-2"> Xem chi tiết</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <Modal
        show={showReport}
        onHide={() => setShowReport(false)}
        centered
        scrollable
        animation
        size="lg"
      >
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title>Báo cáo Bài Viết</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <form>
            <h3>Tại sao bạn báo cáo bài viết này?</h3>
            <p>
              Nếu bạn nhận thấy ai đó đang gặp nguy hiểm, đừng chần chừ mà hãy
              tìm ngay sự giúp đỡ trước khi báo cáo với Admin.
            </p>

            <input
              type="hidden"
              value={reportData.targetType}
              readOnly
              name="targetType"
            />
            <input
              type="hidden"
              value={reportData.targetId}
              readOnly
              name="targetId"
            />

            <div className="mb-3">
              <label className="form-label">Lý do báo cáo</label>
              <select
                className="form-select"
                name="reason"
                value={reportData.reason}
                onChange={(e) =>
                  setReportData((prev) => ({ ...prev, reason: e.target.value }))
                }
                required
              >
                <option value="">-- Chọn lý do --</option>
                <option value="Vấn đề liên quan đến người dưới 18 tuổi">
                  Vấn đề liên quan đến người dưới 18 tuổi
                </option>
                <option value="Bắt nạt, quấy rối hoặc lăng mạ/lạm dụng/ngược đãi">
                  Bắt nạt, quấy rối hoặc lăng mạ/lạm dụng/ngược đãi
                </option>
                <option value="Tự tử hoặc tự hại bản thân">
                  Tự tử hoặc tự hại bản thân
                </option>
                <option value="Nội dung mang tính bạo lực, thù ghét hoặc gây phiền toái">
                  Nội dung mang tính bạo lực, thù ghét hoặc gây phiền toái
                </option>
                <option value="Bán hoặc quảng cáo mặt hàng bị hạn chế">
                  Bán hoặc quảng cáo mặt hàng bị hạn chế
                </option>
                <option value="Nội dung người lớn">Nội dung người lớn</option>
                <option value="Thông tin sai sự thật, lừa đảo hoặc gian lận">
                  Thông tin sai sự thật, lừa đảo hoặc gian lận
                </option>
                <option value="Khác">Khác</option>
              </select>
            </div>

            <div className="mb-3">
              <label className="form-label">Ghi chú</label>
              <div className="tiptap-wrapper">
                <TiptapEditor
                  value={reportData.notes}
                  onChange={(content) =>
                    setReportData((prev) => ({ ...prev, notes: content }))
                  }
                  maxHeight="40vh"
                  minContentHeight={150}
                  placeholder="Mô tả chi tiết lý do báo cáo..."
                />
              </div>
            </div>

            {/* File Upload Section - Giống CreatePost */}
            <div className="mb-3">
              <label className="form-label">Hình ảnh minh chứng</label>

              {/* File Upload Button */}
              <div className="mb-3">
                <button
                  type="button"
                  className="btn btn-outline-primary btn-action"
                  onClick={handleFileClick}
                  disabled={uploading}
                >
                  <Image size={18} className="me-2" />
                  {uploading ? "Đang xử lý..." : "Thêm Ảnh/Video"}
                </button>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  onChange={handleFileChange}
                  accept="image/*,video/*"
                  className="d-none"
                />

                <div className="form-text">
                  Chọn một hoặc nhiều hình ảnh/video (tối đa 50MB/file)
                </div>
              </div>

              {/* File Previews - Giống CreatePost */}
              {reportData.files.length > 0 && (
                <div className="file-previews">
                  <div className="row g-2">
                    {reportData.files.map((file, index) => (
                      <div key={index} className="col-6 col-md-4 col-lg-3">
                        <div className="file-preview-item position-relative">
                          {file.type === "image" ? (
                            <img
                              src={file.fileUrl}
                              alt={`Preview ${index}`}
                              className="img-fluid rounded"
                              style={{
                                height: "120px",
                                width: "100%",
                                objectFit: "cover",
                              }}
                            />
                          ) : (
                            <div className="video-preview position-relative">
                              <video
                                src={file.fileUrl}
                                className="img-fluid rounded"
                                style={{
                                  height: "120px",
                                  width: "100%",
                                  objectFit: "cover",
                                }}
                              />
                              <div className="video-overlay position-absolute top-50 start-50 translate-middle">
                                <i className="fas fa-play text-white fs-4"></i>
                              </div>
                            </div>
                          )}
                          <button
                            type="button"
                            className="btn-remove-file position-absolute top-0 end-0 bg-danger text-white rounded-circle border-0"
                            onClick={() => removeFile(index)}
                            disabled={uploading}
                            style={{
                              width: "24px",
                              height: "24px",
                              transform: "translate(30%, -30%)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <X size={12} />
                          </button>
                          <div className="file-info small mt-1 text-center">
                            <div className="text-truncate">{file.fileName}</div>
                            <div className="text-muted">
                              {(file.fileSize / 1024 / 1024).toFixed(2)} MB
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </form>
        </Modal.Body>

        <Modal.Footer>
          <Button
            type="button"
            variant="secondary"
            onClick={() => setShowReport(false)}
            disabled={uploading}
          >
            Đóng
          </Button>
          <Button
            variant="success"
            onClick={handleSubmitReport}
            disabled={uploading || !reportData.reason}
          >
            {uploading ? (
              <>
                <div
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                >
                  <span className="visually-hidden">Loading...</span>
                </div>
                Đang xử lý...
              </>
            ) : (
              "Gửi báo cáo"
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Privacy Badge */}
      <div className="privacy-info mt-2 text-start">
        <span className={`privacy-badge ${post.privacy}`}>
          {post.privacy === "public" && (
            <span className="">
              <Globe size={18} /> {"          "}
              <span>Công khai</span>
            </span>
          )}
          {post.privacy === "friends" && (
            <span className="">
              <Users size={18} /> {"  "}
              <span>Bạn bè</span>
            </span>
          )}
          {post.privacy === "private" && (
            <span className="">
              <Lock size={18} /> {"  "} <span>Riêng tư</span>
            </span>
          )}
        </span>
        {post.isAnonymous && (
          <span className="anonymous-badge ms-2">
            <i className="fa fa-eye-slash"></i> Ẩn danh
          </span>
        )}
      </div>
    </div>
  );
};

export default PostHeader;
