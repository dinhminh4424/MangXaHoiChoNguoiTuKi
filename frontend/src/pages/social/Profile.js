// components/profile/Profile.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProfile } from "../../contexts/ProfileContext";
import { useAuth } from "../../contexts/AuthContext";
import ProfileView from "../../components/profile/ProfileView";
import ProfileEdit from "../../components/profile/ProfileEdit";
import ProfileImage from "../../components/profile/ProfileImage";
import VerificationTab from "../../components/profile/VerificationTab";
import ProfileJournal from "../../components/profile/profileJournal";
import ProfileFriends from "../../components/profile/profileFriends";
import ProfilePosts from "../../components/profile/profilePost";
import api from "../../services/api";

const Profile = () => {
  const { userId: userIdParam } = useParams();
  const { isOwnProfile, viewMyProfile, viewedUser } = useProfile();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("edit");
  const [isVerified, setIsVerified] = useState(false);
  const [checkViewProfile, setCheckViewProfile] = useState(true);

  // Tính toán userId: nếu không có trong URL thì dùng currentUser.id
  const userId = userIdParam || currentUser?.id;

  useEffect(() => {
    // if (!userIdParam) return;

    const checkView = async () => {
      try {
        //  const res = await api.get(`/api/users/${userIdParam}`);
        const res = await api.get(`/api/users/${userId}`);

        const verified = res.data.success && res.data.data.checkViewProfile;

        setCheckViewProfile(verified);
      } catch (err) {
        console.error(err);
        setCheckViewProfile(true);
      }
    };

    checkView();
  }, [userIdParam]);

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

  // Load profile khi vào /profile (không có userId trong URL)
  useEffect(() => {
    if (!userIdParam) {
      viewMyProfile();
    }
  }, [userIdParam, viewMyProfile]);

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
          {checkViewProfile && (
            <>
              {/* Navigation Tabs */}
              <ul className="nav nav-tabs mt-4 border-bottom">
                {/* Bài viết */}
                <li className="nav-item">
                  <button
                    className={`nav-link ${
                      activeTab === "posts" ? "active" : ""
                    }`}
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

                {/* Hình ảnh */}
                <li className="nav-item">
                  <button
                    className={`nav-link ${
                      activeTab === "images" ? "active" : ""
                    }`}
                    onClick={() => handleTabSelect("images")}
                  >
                    Hình ảnh
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
                        {isVerified && (
                          <i className="fas fa-check-circle ms-1"></i>
                        )}
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
                    <ProfileFriends userId={userId} />
                  </div>
                )}

                {/* Chỉnh sửa */}
                {activeTab === "images" && (
                  <div className="tab-pane fade show active">
                    <ProfileImage userId={userId} />
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
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
