// components/profile/Profile.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProfile } from "../../contexts/ProfileContext";
import ProfileView from "../../components/profile/ProfileView";
import ProfileEdit from "../../components/profile/ProfileEdit";
import VerificationTab from "../../components/profile/VerificationTab";
import ProfileJournal from "../../components/profile/profileJournal";
import ProfilePosts from "../../components/profile/profilePost";
import api from "../../services/api";

const Profile = () => {
  const { userId } = useParams();
  const { isOwnProfile, viewMyProfile } = useProfile();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("posts");
  const [isVerified, setIsVerified] = useState(false);

  // Kiểm tra đã xác minh chưa (chỉ khi là profile cá nhân)
  useEffect(() => {
    if (!isOwnProfile) return;

    const checkVerification = async () => {
      try {
        const res = await api.get("/api/users/me");
        const verified =
          res.data.success && res.data.data.user.profile?.idCard?.verified;
        setIsVerified(verified);
      } catch (err) {
        setIsVerified(false);
      }
    };

    checkVerification();
  }, [isOwnProfile]);

  // Load profile khi vào /profile (không có userId)
  useEffect(() => {
    if (!userId) {
      viewMyProfile();
    }
  }, [userId, viewMyProfile]);

  const handleTabSelect = (tab) => {
    if (tab === "edit" && !isOwnProfile) {
      navigate("/profile");
      return;
    }
    setActiveTab(tab);
  };

  return (
    <div className="container py-4">
      <div className="row justify-content-center">
        <div className="col-lg-10">
          {/* Profile Header */}
          <ProfileView userId={userId} />

          {/* Navigation Tabs */}
          <ul className="nav nav-tabs mt-4 border-bottom">
            {/* Bài viết */}
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "posts" ? "active" : ""}`}
                onClick={() => handleTabSelect("posts")}
              >
                Bài viết
              </button>
            </li>

            {/* Nhật ký */}
            <li className="nav-item">
              <button
                className={`nav-link ${
                  activeTab === "journals" ? "active" : ""
                }`}
                onClick={() => handleTabSelect("journals")}
              >
                Nhật ký
              </button>
            </li>

            {/* Bạn bè */}
            <li className="nav-item">
              <button
                className={`nav-link ${
                  activeTab === "friends" ? "active" : ""
                }`}
                onClick={() => handleTabSelect("friends")}
              >
                Bạn bè
              </button>
            </li>

            {/* Chỉ hiện khi là profile của mình */}
            {isOwnProfile && (
              <>
                {/* Chỉnh sửa */}
                <li className="nav-item">
                  <button
                    className={`nav-link ${
                      activeTab === "edit" ? "active" : ""
                    }`}
                    onClick={() => handleTabSelect("edit")}
                  >
                    Chỉnh sửa
                  </button>
                </li>

                {/* Xác minh danh tính */}
                <li className="nav-item">
                  <button
                    className={`nav-link ${
                      activeTab === "verify" ? "active" : ""
                    } ${isVerified ? "text-success fw-bold" : ""}`}
                    onClick={() => handleTabSelect("verify")}
                  >
                    Xác minh danh tính
                    {isVerified && <i className="fas fa-check-circle ms-1"></i>}
                  </button>
                </li>
              </>
            )}
          </ul>

          {/* Tab Content */}
          <div className="tab-content mt-3">
            {/* Bài viết */}
            {activeTab === "posts" && (
              <div className="tab-pane fade show active">
                <ProfilePosts userId={userId} />
              </div>
            )}

            {/* Nhật ký */}
            {activeTab === "journals" && (
              <div className="tab-pane fade show active">
                <ProfileJournal userId={userId} />
              </div>
            )}

            {/* Bạn bè */}
            {activeTab === "friends" && (
              <div className="tab-pane fade show active">
                <div className="card border-0 shadow-sm">
                  <div className="card-body text-center text-muted py-5">
                    <i className="fas fa-users fa-3x mb-3 text-light"></i>
                    <h5>Chưa có bạn bè</h5>
                    <p className="mb-0">
                      Kết nối với mọi người để xem danh sách bạn bè
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Chỉnh sửa */}
            {activeTab === "edit" && isOwnProfile && (
              <div className="tab-pane fade show active">
                <ProfileEdit />
              </div>
            )}

            {/* Xác minh danh tính */}
            {activeTab === "verify" && isOwnProfile && (
              <div className="tab-pane fade show active">
                <VerificationTab />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
