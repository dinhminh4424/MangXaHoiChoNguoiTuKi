// components/Group/GroupHeader.js
import React, { useState } from "react";
import { Users, Settings, BarChart2 } from "lucide-react";
import { Button, Dropdown, ButtonGroup, Modal } from "react-bootstrap";
import NotificationService from "../../services/notificationService";
import TiptapEditor from "../journal/TiptapEditor";
import { X, Image } from "lucide-react";

import api from "../../services/api";

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

  // report
  const [showListReport, setShowListReport] = useState(false);
  const [loadingListReports, setLoadingListReports] = useState(false);
  const [errorListReports, setErrorListReports] = useState("");
  const [listReports, setListReports] = useState([]);

  console.log("isMember: ", isMember);
  console.log("userRole: ", userRole);

  const [imageCover, setImageCover] = React.useState("");
  const [imageAvatar, setImageAvatar] = React.useState("");

  //  QR CODE
  const [qrCode, setQrCode] = React.useState(null);
  const [qrLoading, setQrLoading] = React.useState(false);
  const [showQRModal, setShowQRModal] = React.useState(false);
  const [qrError, setQrError] = React.useState(null);

  // Hàm lấy QR code
  const loadQRCode = async () => {
    try {
      setQrLoading(true);
      setQrError(null);

      const response = await api.get(`/api/groups/${group._id}/qr`);

      if (response.data.success) {
        const qrDataURL = response.data.data?.qrDataURL || response.data.data;
        if (qrDataURL) {
          setQrCode(qrDataURL);
        } else {
          throw new Error("Không tìm thấy QR code data");
        }
      } else {
        throw new Error(response.data.message || "Không thể tải QR code");
      }
    } catch (error) {
      console.error("Lỗi tải QR code:", error);
      setQrError(
        error.response?.data?.message ||
          error.message ||
          "Không thể tải QR code"
      );
    } finally {
      setQrLoading(false);
    }
  };

  // Hàm mở modal và load QR code
  const handleShowQRCode = async () => {
    setShowQRModal(true);
    await loadQRCode(); // Load QR khi mở modal
  };

  // Hàm cập nhật QR code
  const updateQRCode = async () => {
    try {
      setQrLoading(true);
      const response = await api.put(`/api/groups/${group._id}/qr`);

      if (response.data.success) {
        const qrDataURL = response.data.data?.qrDataURL || response.data.data;
        if (qrDataURL) {
          setQrCode(qrDataURL);
          NotificationService.success({
            title: "Thành công!",
            text: "QR code đã được cập nhật",
          });
        }
      }
    } catch (error) {
      console.error("Lỗi cập nhật QR code:", error);
      NotificationService.error({
        title: "Lỗi",
        text: error.response?.data?.message || "Không thể cập nhật QR code",
      });
    } finally {
      setQrLoading(false);
    }
  };

  // Tải QR code khi component mount
  React.useEffect(() => {
    if (group._id) {
      loadQRCode();
    }
  }, [group]);

  const fetchListReports = React.useCallback(async () => {
    try {
      setLoadingListReports(true);
      setErrorListReports("");

      const res = await groupService.getGroupReports(group._id);
      console.log("Báo cáo nhóm: ", res);

      if (res.success) {
        setListReports(res.violations || []);
      }
    } catch (error) {
      console.error("Lỗi tải báo cáo nhóm:", error);
      setErrorListReports(
        "Loi tải báo cáo nhóm: " +
          (error.response?.data?.message ||
            error.message ||
            "Lỗi không xác định")
      );
    }
  }, [group._id]);

  const loadingsListReportsGroup = async () => {
    await fetchListReports();
    setLoadingListReports(false);
  };

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
              <div className="col-md-6">
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

              <div className="col-md-6">
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
                              className="leave-btn p-1"
                              onClick={onLeave}
                            >
                              Rời nhóm
                            </Button>
                          )}
                        </div>
                      )}

                      <div className="d-flex gap-2 mt-2 p-4 d-flex align-items-center">
                        <a
                          className="btn btn-primary d-flex align-items-center p-2"
                          href={`/group/createPost/${group._id}`}
                          title="Đăng bài"
                        >
                          <i className="fas fa-plus me-2"></i>
                          Đăng bài
                        </a>

                        {/* Thêm nút QR Code vào đây */}
                        <button
                          className="btn btn-warning d-flex align-items-center p-2"
                          onClick={handleShowQRCode}
                        >
                          <i className="fas fa-qrcode me-2"></i>
                          QR
                        </button>
                        {userRole !== "owner" && userRole !== "moderator" ? (
                          <Dropdown as={ButtonGroup}>
                            <Dropdown.Toggle
                              variant="info"
                              size="md"
                              className=" text-white d-flex align-items-center p-2"
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
                              className="btn btn-primary d-flex align-items-center p-2"
                            >
                              <Settings size={20} className="me-2" />
                              Báo cáo & thống kê
                            </Dropdown.Toggle>

                            <Dropdown.Menu>
                              <Dropdown.Item
                                onClick={() => {
                                  setShowListReport(true);
                                  loadingsListReportsGroup();
                                }}
                              >
                                Xem lịch sử
                              </Dropdown.Item>

                              <Dropdown.Item
                                onClick={() => {
                                  // Thêm route hoặc modal hiển thị thống kê
                                  window.location.href = `/group/${group._id}/statistics`;
                                }}
                              >
                                <BarChart2 size={16} className="me-2" />
                                Thống kê chi tiết
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

        {/* báo cáo */}
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

        {/* Modal hiển thị QR Code lớn */}
        <Modal
          show={showQRModal}
          onHide={() => setShowQRModal(false)}
          centered
          size="sm"
        >
          <Modal.Header closeButton className="bg-primary text-white">
            <Modal.Title>
              <i className="fas fa-qrcode me-2"></i>
              QR Code Group
            </Modal.Title>
          </Modal.Header>
          <Modal.Body className="text-center p-4">
            {qrLoading ? (
              <div className="py-4">
                <div className="spinner-border text-primary mb-3" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="text-muted">Đang tải QR code...</p>
              </div>
            ) : qrError ? (
              <div className="py-3">
                <div className="alert alert-warning mb-3">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  {qrError}
                </div>
                <Button variant="primary" onClick={loadQRCode}>
                  <i className="fas fa-redo me-2"></i>
                  Thử lại
                </Button>
              </div>
            ) : qrCode ? (
              <>
                <img
                  src={qrCode}
                  alt="QR Code Profile"
                  className="img-fluid rounded shadow-sm mb-3"
                  style={{
                    maxWidth: "100%",
                    border: "8px solid white",
                    boxShadow: "0 4px 8px rgba(0,0,0,0.1)",
                  }}
                />
                <p className="text-muted mb-3">
                  Quét QR code để xem group của <strong>{group?.name}</strong>
                </p>
                <div className="d-flex justify-content-center gap-2 flex-wrap">
                  <Button
                    variant="outline-primary"
                    size="sm"
                    onClick={() => {
                      const link = document.createElement("a");
                      link.href = qrCode;
                      link.download = `qr-profile-${group?.name || "user"}.png`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                  >
                    <i className="fas fa-download me-2"></i>
                    Tải xuống
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => {
                      const profileUrl = `${process.env.REACT_APP_FRONTEND_URL}/group/${group._id}`;
                      navigator.clipboard.writeText(profileUrl);
                      NotificationService.success({
                        title: "Đã sao chép!",
                        text: "Đã sao chép link profile vào clipboard",
                        timer: 2000,
                      });
                    }}
                  >
                    <i className="fas fa-link me-2"></i>
                    Sao chép link
                  </Button>
                  {(userRole === "owner" || user.role === "admin") && (
                    <Button
                      variant="outline-secondary"
                      size="sm"
                      onClick={updateQRCode}
                      disabled={qrLoading}
                    >
                      {qrLoading ? (
                        <span className="spinner-border spinner-border-sm"></span>
                      ) : (
                        <>
                          <i className="fas fa-refresh me-2"></i>
                          Làm mới
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="py-3">
                <p className="text-muted">Không thể tải QR code</p>
                <Button variant="primary" onClick={loadQRCode}>
                  <i className="fas fa-redo me-2"></i>
                  Thử lại
                </Button>
              </div>
            )}
          </Modal.Body>
        </Modal>

        {/*danh sách báo cáo */}
        <Modal
          show={showListReport}
          onHide={() => setShowListReport(false)}
          centered
          scrollable
          animation
          size="lg"
        >
          <Modal.Header closeButton className="bg-danger text-white">
            <Modal.Title>Lịch sử báo cáo</Modal.Title>
          </Modal.Header>

          <Modal.Body>
            {loadingListReports ? (
              <div className="text-center my-4">
                <div className="spinner-border text-danger" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : errorListReports ? (
              <div className="alert alert-danger" role="alert">
                {errorListReports}
              </div>
            ) : listReports.length === 0 ? (
              <div className="alert alert-info" role="alert">
                Chưa có báo cáo nào cho nhóm này.
              </div>
            ) : (
              <div className="list-reports">
                {listReports.map((report, index) => (
                  <div key={index} className="card">
                    <div className="card-header container-fluid">
                      <div className="d-flex justify-content-center align-items-between">
                        <div className="me-3 text-center">
                          <strong>Lý do:</strong> {report.reason}
                        </div>
                        <div>
                          Trạng thái:{" "}
                          {/* "pending", "reviewed", "approved", "rejected", "auto" */}
                          {report.status === "pending" && (
                            <span className="badge bg-warning text-dark">
                              Đang chờ xử lý
                            </span>
                          )}
                          {report.status === "reviewed" && (
                            <span className="badge bg-info text-dark">
                              Đã xem xét
                            </span>
                          )}
                          {report.status === "approved" && (
                            <span className="badge bg-danger">Bị Vi Phạm</span>
                          )}
                          {report.status === "rejected" && (
                            <span className="badge bg-success">
                              Không vi phạm
                            </span>
                          )}
                          {report.status === "auto" && (
                            <span className="badge bg-secondary">Tự động</span>
                          )}
                        </div>
                      </div>
                      <p></p>
                    </div>
                    <div className="card-body">
                      <h5>Mã báo cáo: {report._id}</h5>

                      <p>
                        <strong>Ghi chú:</strong>{" "}
                        <span className="text-muted">{report.notes}</span>
                      </p>

                      <p>
                        <strong>Ngày báo cáo:</strong>{" "}
                        <span className="text-muted">
                          {new Date(report.createdAt).toLocaleString()}
                        </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Modal.Body>

          <Modal.Footer>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowListReport(false)}
              disabled={uploading}
            >
              Đóng
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </div>
  );
};

export default GroupHeader;
