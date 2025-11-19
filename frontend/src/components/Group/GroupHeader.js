// components/Group/GroupHeader.js
import React, { useState, useRef } from "react";
import { Users, Settings, Share, MoreHorizontal } from "lucide-react";
import { Button, Dropdown, ButtonGroup, Modal } from "react-bootstrap";
import NotificationService from "../../services/notificationService";
import TiptapEditor from "../journal/TiptapEditor";
import { X, Image } from "lucide-react";

import { useAuth } from "../../contexts/AuthContext";
import groupService from "../../services/groupService";
import "./GroupHeader.css";

import { getImagesByCategoryActive } from "../../services/imageService";

const GroupHeader = ({ group, isMember, userRole, onJoin, onLeave }) => {
  const { user } = useAuth();

  const [uploading, setUploading] = React.useState(false);
  const [showReport, setShowReport] = React.useState(false);
  const [dataReport, setDataReport] = React.useState({
    targetType: "Group",
    targetId: group._id || "",
    reason: "",
    notes: "",
    files: [],
  });

  console.log("isMember: ", isMember);
  console.log("userRole: ", userRole);

  const [imageCover, setImageCover] = React.useState("");
  const [imageAvatar, setImageAvatar] = React.useState("");

  // load image default

  const loadImageDefault = React.useCallback(async () => {
    try {
      const resBanner = await getImagesByCategoryActive("BannerGroup");
      if (resBanner.success) {
        setImageCover(resBanner.image?.file.path || "");
      }
      const resAvatar = await getImagesByCategoryActive("AvartarGroup");
      if (resAvatar.success) {
        setImageAvatar(resAvatar.image?.file.path || "");
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  React.useEffect(() => {
    loadImageDefault();
  }, [loadImageDefault]);

  const fileInputReportRef = React.useRef(null);
  const handleFileClick = (e) => {
    fileInputReportRef.current?.click();
  };
  const removeFile = (index) => {
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(dataReport.files[index].fileUrl);

    setDataReport((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
  };

  const handleFileChangeReport = (e) => {
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

    setDataReport((prev) => ({
      ...prev,
      files: [...prev.files, ...newFiles],
    }));

    // Reset input để cho phép chọn lại cùng file
    e.target.value = "";
  };

  const handleSubmitReport = async () => {
    try {
      setUploading(true);
      const dataObjForm = {
        targetType: dataReport.targetType,
        targetId: dataReport.targetId,
        reason: dataReport.reason,
        notes: dataReport.notes,
        files: dataReport.files,
      };

      const res = await groupService.reportGroup(group._id, dataObjForm);
      if (res.success) {
        setShowReport(false);
        setDataReport({
          targetType: "Group",
          targetId: group._id || "",
          reason: "",
          notes: "",
          files: [],
        });
        NotificationService.success({
          title: "Báo cáo thành công!",
          text: `Báo cáo người dùng thành công!  `,
          timer: 3000,
          showConfirmButton: false,
        });
      }
    } catch (error) {
      console.log("Lỗi báo cáo: ", error);
      NotificationService.error({
        title: "Báo Cáo thất bại!",
        text: `Báo Cáo thất bại! :  ${error.toString()}`,
        timer: 3000,
        showConfirmButton: false,
      });
    } finally {
      setUploading(false);
    }
  };

  const getPrivacyIcon = () => {
    switch (group.visibility) {
      case "public":
        return "🌍";
      case "private":
        return "🔒";
      case "invite":
        return "📨";
      default:
        return "🔒";
    }
  };

  const getPrivacyText = () => {
    switch (group.visibility) {
      case "public":
        return "Nhóm công khai";
      case "private":
        return "Nhóm riêng tư";
      case "invite":
        return "Nhóm chỉ theo lời mời";
      default:
        return "Nhóm riêng tư";
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: group.name,
        text: group.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      // Hiển thị toast thông báo đã copy
    }
  };

  return (
    <div className="group-header ">
      <div className="group-cover">
        <div
          className="cover-image"
          style={{
            backgroundImage: group.coverPhoto
              ? `url(${group.coverPhoto})`
              : imageCover
              ? `url(${imageCover})`
              : "linear-gradient(135deg, #667eea 0%, #764ba2 100%",
          }}
        />

        <div className="cover-overlay">
          <div className="container">
            <div className="row align-items-end">
              <div className="col-md-8">
                <div className="group-info">
                  <div className="group-avatar">
                    {group.avatar ? (
                      <img
                        src={group.avatar}
                        alt={group.name}
                        className="rounded-circle"
                      />
                    ) : imageAvatar ? (
                      <img
                        src={imageAvatar}
                        alt={group.name}
                        className="rounded-circle"
                      />
                    ) : (
                      <div className="avatar-placeholder rounded-circle">
                        {group.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>

                  <div className="group-details">
                    <h1 className="group-name text-white">{group.name}</h1>

                    <div className="group-meta">
                      <span className="badge bg-light text-dark me-2">
                        {getPrivacyIcon()} {getPrivacyText()}
                      </span>
                      <span className="text-white me-3">
                        <Users size={16} className="me-1" />
                        {group.memberCount} thành viên
                      </span>
                      {group.category && group.category.length > 0 && (
                        <span className="badge bg-primary">
                          {group.category[0]}
                        </span>
                      )}
                    </div>
                    {!group.active && (
                      <div className="btn btn-danger">Nhóm đang bị khoá</div>
                    )}
                    <p className="group-description text-white">
                      {group.description}
                    </p>
                  </div>
                </div>
              </div>

              <div className="col-md-4">
                <div className="group-actions">
                  {user && (
                    <>
                      {!isMember ? (
                        <Button
                          variant="primary"
                          size="lg"
                          className="join-btn"
                          onClick={onJoin}
                        >
                          Tham gia nhóm
                        </Button>
                      ) : (
                        <div className="member-actions">
                          {userRole === "owner" && (
                            <span className="badge bg-warning me-2">
                              Chủ nhóm
                            </span>
                          )}
                          {userRole === "moderator" && (
                            <span className="badge bg-info me-2">
                              Quản trị viên
                            </span>
                          )}

                          {userRole !== "moderator" && userRole !== "owner" && (
                            <Button
                              variant="primary"
                              size="lg"
                              className="leave-btn"
                              onClick={onLeave}
                            >
                              Rời nhóm
                            </Button>
                          )}
                        </div>
                      )}

                      <div className="d-flex gap-2 mt-2">
                        <a
                          className="btn btn-primary "
                          href={`/group/createPost/${group._id}`}
                          title="Đăng bài"
                        >
                          Đăng bài
                        </a>

                        <div
                          className="btn btn-primary"
                          size="md"
                          onClick={handleShare}
                          title="Chia sẻ nhóm"
                        >
                          <Share size={20} />
                          Chia sẻ
                        </div>
                        {userRole !== "owner" && userRole !== "moderator" ? (
                          <Dropdown as={ButtonGroup}>
                            <Dropdown.Toggle
                              variant="info"
                              size="md"
                              className="text-white d-flex align-items-center"
                            >
                              <Settings size={20} className="me-2" />
                              Báo cáo nhóm
                            </Dropdown.Toggle>

                            <Dropdown.Menu>
                              <Dropdown.Item
                                onClick={() => setShowReport(true)}
                              >
                                Gửi báo cáo
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        ) : (
                          <Dropdown as={ButtonGroup}>
                            <Dropdown.Toggle
                              variant="info"
                              size="md"
                              className="text-white d-flex align-items-center"
                            >
                              <Settings size={20} className="me-2" />
                              Báo cáo & thống kê
                            </Dropdown.Toggle>

                            <Dropdown.Menu>
                              <Dropdown.Item
                                onClick={() => alert("Báo cáo nhóm")}
                              >
                                Xem lịch sử
                              </Dropdown.Item>

                              <Dropdown.Item
                                onClick={() => alert("Thống kê nhóm")}
                              >
                                Thống kê
                              </Dropdown.Item>
                            </Dropdown.Menu>
                          </Dropdown>
                        )}
                      </div>
                    </>
                  )}
                </div>
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
            <Modal.Title>Báo cáo Group</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            <form>
              <h3>Tại sao bạn báo cáo group này?</h3>
              <p>
                Nếu bạn nhận thấy ai đó đang gặp nguy hiểm, đừng chần chừ mà hãy
                tìm ngay sự giúp đỡ trước khi báo cáo với Admin.
              </p>

              <input
                type="hidden"
                value={dataReport.targetType}
                readOnly
                name="targetType"
              />
              <input
                type="hidden"
                value={dataReport.targetId}
                readOnly
                name="targetId"
              />

              <div className="mb-3">
                <label className="form-label">Lý do báo cáo</label>
                <select
                  className="form-select"
                  name="reason"
                  value={dataReport.reason}
                  onChange={(e) =>
                    setDataReport((prev) => ({
                      ...prev,
                      reason: e.target.value,
                    }))
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
                    value={dataReport.notes}
                    onChange={(content) =>
                      setDataReport((prev) => ({ ...prev, notes: content }))
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
                    ref={fileInputReportRef}
                    type="file"
                    multiple
                    onChange={handleFileChangeReport}
                    accept="image/*,video/*"
                    className="d-none"
                  />

                  <div className="form-text">
                    Chọn một hoặc nhiều hình ảnh/video (tối đa 50MB/file)
                  </div>
                </div>

                {/* File Previews - Giống CreatePost */}
                {dataReport.files.length > 0 && (
                  <div className="file-previews">
                    <div className="row g-2">
                      {dataReport.files.map((file, index) => (
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
                              <div className="text-truncate">
                                {file.fileName}
                              </div>
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
              disabled={uploading || !dataReport.reason}
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
      </div>
    </div>
  );
};

export default GroupHeader;
