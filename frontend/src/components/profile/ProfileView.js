import React from "react";
import { useProfile } from "../../contexts/ProfileContext";
import { useAuth } from "../../contexts/AuthContext";
import "./profileView.css";

const ProfileView = ({ userId }) => {
  const { viewedUser, loading, error, isOwnProfile, viewUserProfile } =
    useProfile();
  const { user: currentUser } = useAuth();

  React.useEffect(() => {
    if (userId) {
      viewUserProfile(userId);
    }
  }, [userId, viewUserProfile]);

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

  return (
    <div className="card border-0 shadow-lg overflow-hidden">
      {/* Profile Header với gradient background */}
      <div className="profile-header bg-gradient-primary position-relative">
        <div
          className="profile-cover"
          style={{
            height: "200px",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            position: "relative",
          }}
        >
          {isOwnProfile && (
            <button className="btn btn-light btn-sm position-absolute top-0 end-0 m-3">
              <i className="fas fa-camera me-1"></i>
              Thay ảnh bìa
            </button>
          )}
        </div>

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
                    <button className="btn btn-primary px-4 py-2 d-flex align-items-center">
                      <i className="fas fa-comment me-2"></i>
                      Nhắn tin
                    </button>
                    <button className="btn btn-outline-primary px-4 py-2 d-flex align-items-center">
                      <i className="fas fa-user-plus me-2"></i>
                      Kết bạn
                    </button>
                    <button className="btn btn-outline-secondary px-4 py-2 d-flex align-items-center">
                      <i className="fas fa-bell me-2"></i>
                      Theo dõi
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
                    <h5 className="mb-1">128</h5>
                    <small>Bài viết</small>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card border-0 bg-gradient-success text-white text-center">
                  <div className="card-body py-3">
                    <h5 className="mb-1">456</h5>
                    <small>Bạn bè</small>
                  </div>
                </div>
              </div>
              <div className="col-md-4">
                <div className="card border-0 bg-gradient-info text-white text-center">
                  <div className="card-body py-3">
                    <h5 className="mb-1">789</h5>
                    <small>Theo dõi</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
