import React from "react";
import { useProfile } from "../../contexts/ProfileContext";
import { useAuth } from "../../contexts/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { Modal, Button } from "react-bootstrap";

import FriendButton from "../friend/FriendButton";
import FriendsListModal from "../friend/FriendsListModal";
import followService from "../../services/followService";
import { io } from "socket.io-client";

import TiptapEditor from "../journal/TiptapEditor";
import { X, Image } from "lucide-react";
import NotificationService from "../../services/notificationService";

import "./profileView.css";
import { useEffect, useRef } from "react";

const ProfileView = ({ userId }) => {
  const navigate = useNavigate();
  const {
    viewedUser,
    loading,
    error,
    isOwnProfile,
    viewUserProfile,
    updateImageCover,
    reportUser,
  } = useProfile();
  const { user: currentUser } = useAuth();

  const [showModalUpdateCoverPhoto, setShowModalUpdateCoverPhoto] =
    React.useState(false);

  const [previewImage, setPreviewImage] = React.useState(null);
  const [file, setFile] = React.useState(null);
  const fileInputRef = React.useRef(null);
  const fileInputReportRef = React.useRef(null);
  // const [showModalReport, setShowModalReport] = React.useState(false);
  const [dataReport, setDataReport] = React.useState({
    targetType: "User",
    targetId: userId || "",
    reason: "",
    notes: "",
    files: [],
  });

  const [uploading, setUploading] = React.useState(false);
  const [showReport, setShowReport] = React.useState(false);
  const [friendCount, setFriendCount] = React.useState(0);
  const [followerCount, setFollowerCount] = React.useState(0);
  const [isFollowing, setIsFollowing] = React.useState(false);
  const [followLoading, setFollowLoading] = React.useState(false);
  const [showFriendsModal, setShowFriendsModal] = React.useState(false);
  const socketRef = React.useRef(null);
  const followActionInProgress = React.useRef(false);

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

  const handleFileClick = (e) => {
    fileInputReportRef.current?.click();
  };

  const handleFileClickCover = (e) => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const selectFile = e.target.files[0];

    setFile(selectFile);
  };

  // const handleSubmit = async (e) => {
  //   e.preventDefault();

  //   if (!file) {
  //     alert("Bạn chưa chọn ảnh!!!!!");
  //     return;
  //   }

  //   try {
  //     const res = await updateImageCover(file);
  //     if (res.success) {
  //       setShowModalUpdateCoverPhoto(false);
  //       setFile(null);
  //       setPreviewImage(null);
  //       NotificationService.success({
  //         title: "Thành công! 🎉",
  //         text: "Cập nhật ảnh bìa thành công!",
  //         timer: 3000,
  //         showConfirmButton: false,
  //       });
  //     }
  //   } catch (error) {
  //     NotificationService.error({
  //       title: "Lỗi! 😞",
  //       text: error.message || "Có lỗi xảy ra khi cập nhật ảnh bìa",
  //       timer: 5000,
  //       showConfirmButton: true,
  //     });
  //   }

  //   return;
  // };
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      alert("Bạn chưa chọn ảnh!!!!!");
      return;
    }

    try {
      setUploading(true); // ✅ THÊM: Loading state
      const result = await updateImageCover(file);

      console.log("🔄 Update result:", result);

      if (result && result.success) {
        // ✅ FIX: Đóng modal và reset
        setShowModalUpdateCoverPhoto(false);
        setFile(null);
        setPreviewImage(null);

        // ✅ THÊM: Thông báo thành công
        NotificationService.success({
          title: "Thành công! 🎉",
          text: "Cập nhật ảnh bìa thành công!",
          timer: 3000,
          showConfirmButton: false,
        });

        console.log("✅ Cover updated successfully!");
      } else {
        throw new Error(result?.message || "Cập nhật thất bại");
      }
    } catch (error) {
      console.error("❌ Error in handleSubmit:", error);
      // ✅ FIX: Hiển thị lỗi cho user
      NotificationService.error({
        title: "Lỗi! 😞",
        text: error.message || "Có lỗi xảy ra khi cập nhật ảnh bìa",
        timer: 5000,
        showConfirmButton: true,
      });
    } finally {
      setUploading(false); // ✅ FIX: Tắt loading
    }
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

      const res = await reportUser(userId, dataObjForm);
      if (res.success) {
        setShowReport(false);
        setDataReport({
          targetType: "User",
          targetId: userId || "",
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

  React.useEffect(() => {
    if (userId) {
      viewUserProfile(userId);
    }
  }, [userId, viewUserProfile]);

  React.useEffect(() => {
    if (file) {
      setPreviewImage(URL.createObjectURL(file));
    }
  }, [file]);

  // Cập nhật số bạn bè và số người theo dõi từ viewedUser
  React.useEffect(() => {
    if (viewedUser) {
      setFriendCount(viewedUser.countFriends || 0);
      setFollowerCount(viewedUser.countFollowers || 0);
    }
  }, [viewedUser]);

  // Kiểm tra trạng thái follow khi userId thay đổi
  React.useEffect(() => {
    const checkFollowStatus = async () => {
      if (!userId || isOwnProfile || !currentUser) return;
      try {
        const response = await followService.getFollowStatus(userId);
        setIsFollowing(response.data?.isFollowing || false);
      } catch (error) {
        console.error("Error checking follow status:", error);
      }
    };
    checkFollowStatus();
  }, [userId, isOwnProfile, currentUser]);

  // Lắng nghe socket events cho follow status changes
  React.useEffect(() => {
    if (!currentUser) return;

    const API_BASE_URL = process.env.REACT_APP_BACKEND_URL || process.env.REACT_APP_API_URL || "http://localhost:5000";
    const socket = io(API_BASE_URL, {
      withCredentials: true,
    });
    socketRef.current = socket;

    // Join user room để nhận events
    socket.emit("join_notifications", currentUser.id || currentUser._id);

    // Lắng nghe follow_status_changed từ server (cho người thực hiện follow/unfollow)
    const handleFollowStatusChanged = (data) => {
      const { followerId, followingId, action } = data;
      const currentUserId = String(currentUser.id || currentUser._id);
      const viewedUserId = String(viewedUser?.id || viewedUser?._id);
      const followingIdStr = String(followingId);
      const followerIdStr = String(followerId);

      // Nếu đang xem profile của người được follow/unfollow
      // Và current user là người thực hiện follow/unfollow
      if (viewedUserId === followingIdStr && followerIdStr === currentUserId) {
        // Chỉ cập nhật nếu không có action đang được thực hiện (tránh duplicate)
        if (!followActionInProgress.current) {
          if (action === "followed") {
            setIsFollowing(true);
            setFollowerCount((prev) => prev + 1);
          } else if (action === "unfollowed") {
            setIsFollowing(false);
            setFollowerCount((prev) => Math.max(0, prev - 1));
          }
        } else {
          // Nếu có action đang được thực hiện, chỉ cập nhật followerCount (isFollowing đã được cập nhật trong handleFollowToggle)
          if (action === "followed") {
            setFollowerCount((prev) => prev + 1);
          } else if (action === "unfollowed") {
            setFollowerCount((prev) => Math.max(0, prev - 1));
          }
        }
      }
    };

    // Lắng nghe follower_count_changed từ server (cho người được follow/unfollow)
    const handleFollowerCountChanged = (data) => {
      const { followingId, change } = data;
      const viewedUserId = String(viewedUser?.id || viewedUser?._id);
      const currentUserId = String(currentUser?.id || currentUser._id);
      const followingIdStr = String(followingId);

      // Cập nhật số lượng followers nếu:
      // 1. Đang xem profile của người được follow/unfollow (viewedUserId === followingIdStr)
      // 2. Hoặc đang xem profile của chính mình và event là cho mình (isOwnProfile && currentUserId === followingIdStr)
      if (viewedUserId === followingIdStr || (isOwnProfile && currentUserId === followingIdStr)) {
        // Cập nhật số lượng followers (bất kỳ ai follow/unfollow user đó)
        setFollowerCount((prev) => Math.max(0, prev + change));
      }
    };

    // Lắng nghe friend_count_changed từ server (cho người có số lượng bạn bè thay đổi)
    const handleFriendCountChanged = (data) => {
      const { userId, otherUserId, change } = data;
      const viewedUserId = String(viewedUser?.id || viewedUser?._id);
      const currentUserId = String(currentUser?.id || currentUser._id);
      const userIdStr = String(userId);
      const otherUserIdStr = otherUserId ? String(otherUserId) : null;

      // Cập nhật số lượng bạn bè nếu:
      // 1. Đang xem profile của người có số lượng bạn bè thay đổi (userId)
      // 2. Hoặc đang xem profile của người kia trong mối quan hệ bạn bè (otherUserId)
      // 3. Hoặc đang xem profile của chính mình và event là cho mình (isOwnProfile && currentUserId === userIdStr)
      // 4. Hoặc đang xem profile của chính mình và event liên quan đến mình (isOwnProfile && otherUserIdStr && currentUserId === otherUserIdStr)
      const shouldUpdate = 
        viewedUserId === userIdStr || 
        (otherUserIdStr && viewedUserId === otherUserIdStr) ||
        (isOwnProfile && currentUserId === userIdStr) ||
        (isOwnProfile && otherUserIdStr && currentUserId === otherUserIdStr);

      if (shouldUpdate) {
        // Cập nhật số lượng bạn bè (bất kỳ ai kết bạn/hủy bạn bè với user đó)
        setFriendCount((prev) => Math.max(0, prev + change));
      }
    };

    socket.on("follow_status_changed", handleFollowStatusChanged);
    socket.on("follower_count_changed", handleFollowerCountChanged);
    socket.on("friend_count_changed", handleFriendCountChanged);

    return () => {
      socket.off("follow_status_changed", handleFollowStatusChanged);
      socket.off("follower_count_changed", handleFollowerCountChanged);
      socket.off("friend_count_changed", handleFriendCountChanged);
      socket.disconnect();
    };
  }, [currentUser, viewedUser, isOwnProfile]);

  // Lắng nghe window event friend:status-changed (chỉ dùng cho các trường hợp không có socket event)
  // Socket event đã được xử lý trong useEffect trên, không cần xử lý lại ở đây
  // Chỉ giữ lại để tương thích với các component khác dispatch window event
  // Nhưng không cập nhật friendCount vì socket event đã xử lý rồi

  // Xử lý follow/unfollow
  const handleFollowToggle = async () => {
    if (!userId || isOwnProfile || followLoading || followActionInProgress.current) return;
    
    setFollowLoading(true);
    followActionInProgress.current = true;
    try {
      if (isFollowing) {
        await followService.unfollowUser(userId);
        // Chỉ cập nhật isFollowing, để socket event cập nhật followerCount
        setIsFollowing(false);
      } else {
        await followService.followUser(userId);
        // Chỉ cập nhật isFollowing, để socket event cập nhật followerCount
        setIsFollowing(true);
      }
    } catch (error) {
      console.error("Error toggling follow:", error);
      alert(error.response?.data?.message || "Có lỗi xảy ra");
      // Nếu có lỗi, reload lại trạng thái
      try {
        const response = await followService.getFollowStatus(userId);
        setIsFollowing(response.data?.isFollowing || false);
      } catch (e) {
        console.error("Error reloading follow status:", e);
      }
    } finally {
      setFollowLoading(false);
      // Reset flag sau một khoảng thời gian ngắn để socket event có thể xử lý
      setTimeout(() => {
        followActionInProgress.current = false;
      }, 1000);
    }
  };

  const removeFile = (index) => {
    // Revoke object URL to prevent memory leaks
    URL.revokeObjectURL(dataReport.files[index].fileUrl);

    setDataReport((prev) => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index),
    }));
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center py-5">
        <div className="text-center">
          <div
            className="spinner-border text-primary mb-3"
            style={{ width: "3rem", height: "3rem" }}
            role="status"
          >
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="text-muted fw-medium">Đang tải thông tin...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className="alert alert-danger d-flex align-items-center"
        role="alert"
      >
        <i className="fas fa-exclamation-triangle me-2"></i>
        <div className="flex-grow-1">{error}</div>
        <button
          className="btn btn-outline-danger btn-sm"
          onClick={() => viewUserProfile(userId)}
        >
          <i className="fas fa-redo me-1"></i>
          Thử lại
        </button>
      </div>
    );
  }

  if (!viewedUser) {
    return (
      <div className="text-center py-5">
        <div className="mb-4">
          <i
            className="fas fa-user-slash text-muted"
            style={{ fontSize: "4rem" }}
          ></i>
        </div>
        <h5 className="text-muted mb-2">Không tìm thấy người dùng</h5>
        <p className="text-muted">
          Người dùng này có thể không tồn tại hoặc đã bị xóa
        </p>
      </div>
    );
  }

  const getBackgroundStyle = (user) => {
    return user?.profile?.coverPhoto
      ? {
          backgroundImage: `url("${user.profile.coverPhoto}")`,
          backgroundSize: "100% 100%", // 👉 Kéo ảnh phủ toàn vùng
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }
      : {
          backgroundImage:
            "linear-gradient(135deg, #667eea 0%, #674ba2ff 100%)",
        };
  };

  return (
    <div className="card border-0 shadow-lg overflow-hidden">
      {/* Profile Header với gradient background */}
      <div
        className="profile-header  position-relative"
        style={{
          ...getBackgroundStyle(viewedUser), // Sử dụng viewedUser thay vì currentUser
        }}
      >
        {/* Cover Photo Section */}
        <div
          className="profile-cover"
          style={{
            height: "250px",
            position: "relative",
          }}
        >
          {isOwnProfile && (
            <button
              className="btn btn-light btn-sm position-absolute top-0 end-0 m-3"
              onClick={() => {
                setShowModalUpdateCoverPhoto(true);
              }}
            >
              <i className="fas fa-camera me-1"></i>
              Thay ảnh bìa
            </button>
          )}
        </div>

        {/* Modal Update Cover Photo */}

        {/* Avatar Section */}
        <div className="avatar-section position-relative">
          <div className="container">
            <div className="row">
              <div className="col-md-4 text-center">
                <div className="avatar-container position-relative d-inline-block">
                  <img
                    src={
                      viewedUser.profile?.avatar ||
                      "/assets/images/default-avatar.png"
                    }
                    className="rounded-circle border-4 border-white shadow-lg"
                    style={{
                      width: "150px",
                      height: "150px",
                      objectFit: "cover",
                      marginTop: "-75px",
                      position: "relative",
                      zIndex: 2,
                    }}
                    alt="Avatar"
                    onError={(e) => {
                      e.target.src = "/assets/images/default-avatar.png";
                    }}
                  />
                  {viewedUser.isOnline && (
                    <span
                      className="position-absolute bottom-0 end-0 bg-success rounded-circle border-3 border-white"
                      style={{ width: "20px", height: "20px", zIndex: 3 }}
                    ></span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Thay đổi ảnh bìa */}
      <Modal
        show={showModalUpdateCoverPhoto}
        onHide={() => setShowModalUpdateCoverPhoto(false)}
        centered
        scrollable
        animation
        dialogClassName="rounded-4"
        contentClassName="shadow-lg border border-2"
        backdropClassName="bg-dark bg-opacity-75"
      >
        {/* ====== PHẦN HEADER ====== */}
        <Modal.Header
          closeButton
          closeVariant="white"
          className="bg-primary text-white"
        >
          <Modal.Title>Thay đổi hình nền</Modal.Title>
        </Modal.Header>

        {/* ====== PHẦN BODY ====== */}
        <Modal.Body>
          <form onSubmit={handleSubmit}>
            {/* Nút chọn ảnh */}
            <div className="d-flex flex-column align-items-center">
              <button
                type="button"
                className="btn btn-outline-primary d-flex align-items-center gap-2 px-3 py-2"
                onClick={handleFileClickCover}
              >
                <i className="fas fa-camera"></i>
                <span>Chọn ảnh bìa</span>
              </button>

              {/* Input file ẩn */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                hidden
                onChange={handleFileChange}
              />

              {/* Hiển thị ảnh preview nếu có */}
              {previewImage && (
                <div className="mt-3 position-relative w-100 text-center">
                  <img
                    src={previewImage}
                    alt="Xem trước"
                    className="img-fluid rounded shadow-sm"
                    style={{ maxHeight: "250px", objectFit: "cover" }}
                  />

                  {/* Nút xóa ảnh */}
                  <button
                    type="button"
                    className="btn btn-danger btn-sm position-absolute top-0 end-0 m-2"
                    onClick={() => setPreviewImage(null)}
                    title="Xóa ảnh"
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
              )}
            </div>

            {/* Nút xác nhận */}
            <div className="mt-4 text-end">
              <button type="submit" className="btn btn-primary">
                Lưu thay đổi
              </button>
            </div>
          </form>
        </Modal.Body>

        {/* ====== PHẦN FOOTER ====== */}
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowModalUpdateCoverPhoto(false)}
          >
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Moadal báo cáo */}
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
                  setDataReport((prev) => ({ ...prev, reason: e.target.value }))
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
                    {console.log("=====dataReport.files", dataReport.files)}
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

      {/* Profile Content */}
      <div className="card-body p-4 pt-5">
        <div className="row">
          {/* Left Column - Basic Info */}
          <div className="col-md-4">
            <div className="sticky-top" style={{ top: "20px" }}>
              <div className="text-center text-md-start">
                <h3 className="fw-bold text-dark mb-1">
                  {viewedUser.fullName || "Chưa có tên"}
                </h3>
                <p className="text-muted mb-2">
                  @{viewedUser.username || "Chưa có username"}
                </p>

                <div className="mb-3">
                  <span
                    className={`badge ${
                      viewedUser.role === "admin"
                        ? "bg-danger"
                        : viewedUser.role === "supporter"
                        ? "bg-warning"
                        : "bg-primary"
                    } px-3 py-2`}
                  >
                    {viewedUser.role === "admin"
                      ? "👑 Quản trị viên"
                      : viewedUser.role === "supporter"
                      ? "⭐ Người hỗ trợ"
                      : "👤 Thành viên"}
                  </span>
                </div>

                <div className="d-flex flex-column gap-2 mb-4">
                  <div className="d-flex align-items-center justify-content-center justify-content-md-start text-muted">
                    <i className="fas fa-envelope me-2"></i>
                    <span>{viewedUser.email}</span>
                  </div>

                  <div className="d-flex align-items-center justify-content-center justify-content-md-start text-muted">
                    <i className="fas fa-calendar-alt me-2"></i>
                    <span>
                      Tham gia:{" "}
                      {new Date(viewedUser.createdAt).toLocaleDateString(
                        "vi-VN"
                      )}
                    </span>
                  </div>

                  {!viewedUser.isOnline && viewedUser.lastSeen && (
                    <div className="d-flex align-items-center justify-content-center justify-content-md-start text-muted">
                      <i className="fas fa-clock me-2"></i>
                      <span>
                        Hoạt động:{" "}
                        {new Date(viewedUser.lastSeen).toLocaleString("vi-VN")}
                      </span>
                    </div>
                  )}
                </div>

                {/* Status Badge */}
                <div className="mb-4">
                  <span
                    className={`badge ${
                      viewedUser.isOnline ? "bg-success" : "bg-secondary"
                    } px-3 py-2`}
                  >
                    {viewedUser.isOnline
                      ? "🟢 Đang hoạt động"
                      : "⚫ Ngoại tuyến"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Detailed Info */}
          <div className="col-md-8">
            {/* Bio Section */}
            {viewedUser.profile?.bio && (
              <div className="card border-0 bg-light mb-4">
                <div className="card-body">
                  <h6 className="card-title fw-semibold text-primary mb-3">
                    <i className="fas fa-user-circle me-2"></i>
                    Giới thiệu
                  </h6>
                  <p className="text-dark mb-0">{viewedUser.profile.bio}</p>
                </div>
              </div>
            )}

            {/* Interests & Skills Grid */}
            <div className="row g-4">
              {/* Interests */}
              {viewedUser.profile?.interests &&
                viewedUser.profile.interests.length > 0 && (
                  <div className="col-12 col-lg-6">
                    <div className="card border-0 shadow-sm h-100">
                      <div className="card-body">
                        <h6 className="card-title fw-semibold text-primary mb-3">
                          <i className="fas fa-heart me-2"></i>
                          Sở thích
                        </h6>
                        <div className="d-flex flex-wrap gap-2">
                          {viewedUser.profile.interests.map(
                            (interest, index) => (
                              <span
                                key={index}
                                className="badge bg-gradient-info text-white border-0 px-3 py-2"
                                style={{ borderRadius: "20px" }}
                              >
                                {interest}
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

              {/* Skills */}
              {viewedUser.profile?.skills &&
                viewedUser.profile.skills.length > 0 && (
                  <div className="col-12 col-lg-6">
                    <div className="card border-0 shadow-sm h-100">
                      <div className="card-body">
                        <h6 className="card-title fw-semibold text-primary mb-3">
                          <i className="fas fa-star me-2"></i>
                          Kỹ năng
                        </h6>
                        <div className="d-flex flex-wrap gap-2">
                          {viewedUser.profile.skills.map((skill, index) => (
                            <span
                              key={index}
                              className="badge bg-gradient-warning text-dark border-0 px-3 py-2"
                              style={{ borderRadius: "20px" }}
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
            </div>

            {/* Action Buttons */}
            {!isOwnProfile && currentUser && (
              <div className="card border-0 bg-light mt-4">
                <div className="card-body">
                  <h6 className="card-title fw-semibold mb-3">Kết nối</h6>
                  <div className="d-flex flex-wrap gap-2">
                    <button
                      className="btn btn-primary px-4 py-2 d-flex align-items-center"
                      onClick={() => {
                        console.log("Nhắn tin");
                        navigate("/chat/" + userId);
                      }}
                    >
                      <i className="fas fa-comment me-2"></i>
                      Nhắn tin
                    </button>
                    <FriendButton userId={userId} />
                    <button
                      className={`btn ${isFollowing ? 'btn-secondary' : 'btn-outline-secondary'} px-4 py-2 d-flex align-items-center`}
                      onClick={handleFollowToggle}
                      disabled={followLoading}
                    >
                      {followLoading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Đang xử lý...
                        </>
                      ) : (
                        <>
                          <i className={`fas ${isFollowing ? 'fa-bell-slash' : 'fa-bell'} me-2`}></i>
                          {isFollowing ? 'Đang theo dõi' : 'Theo dõi'}
                        </>
                      )}
                    </button>
                    <button
                      className="btn btn-outline-danger px-4 py-2 d-flex align-items-center"
                      onClick={() => setShowReport(true)}
                    >
                      <i className="fa-solid fa-flag"></i>
                      Báo Cáo
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Stats Section (có thể thêm sau) */}
            <div className="row g-3 mt-4">
              <div className="col-md-4">
                <div className="card border-0 bg-gradient-primary text-white text-center">
                  <div className="card-body py-3">
                    <h5 className="mb-1">
                      {viewedUser?.countPost || "Chưa cập nhật"}
                    </h5>
                    <small>Bài viết</small>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div 
                  className="card border-0 bg-gradient-success text-white text-center"
                  style={{ cursor: "pointer" }}
                  onClick={() => setShowFriendsModal(true)}
                >
                  <div className="card-body py-3">
                    <h5 className="mb-1">{friendCount}</h5>
                    <small>Bạn bè</small>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div 
                  className="card border-0 bg-gradient-info text-white text-center"
                  style={{ cursor: "pointer" }}
                  onClick={() => setShowFollowersModal(true)}
                >
                  <div className="card-body py-3">
                    <h5 className="mb-1">{followerCount}</h5>
                    <small>Theo dõi</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Friends List Modal */}
      <FriendsListModal
        show={showFriendsModal}
        onHide={() => setShowFriendsModal(false)}
        userId={userId || viewedUser?.id || viewedUser?._id}
        userName={viewedUser?.fullName || viewedUser?.username}
      />
    </div>
  );
};

export default ProfileView;
