import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useProfile } from "../../contexts/ProfileContext";
import ProfileView from "../../components/profile/ProfileView";
import ProfileEdit from "../../components/profile/ProfileEdit";
import ProfileJournal from "../../components/profile/profileJournal";
import ProfilePosts from "../../components/profile/profilePost";

const Profile = () => {
  const { userId } = useParams();
  const { isOwnProfile, viewMyProfile } = useProfile();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("posts");

  React.useEffect(() => {
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
          {/* Profile View Component */}
          <ProfileView userId={userId} />

          {/* Tabs for additional content */}
          <ul className="nav nav-tabs mt-4">
            <li className="nav-item">
              <button
                className={`nav-link ${activeTab === "posts" ? "active" : ""}`}
                onClick={() => handleTabSelect("posts")}
              >
                Bài viết
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${
                  activeTab === "journals" ? "active" : ""
                }`}
                onClick={() => handleTabSelect("journals")}
              >
                Nhật kí
              </button>
            </li>
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
            {isOwnProfile && (
              <li className="nav-item">
                <button
                  className={`nav-link ${activeTab === "edit" ? "active" : ""}`}
                  onClick={() => handleTabSelect("edit")}
                >
                  Chỉnh sửa
                </button>
              </li>
            )}
          </ul>

          {/* Tab Content */}
          <div className="tab-content mt-3">
            {activeTab === "posts" && (
              <div className="tab-pane fade show active">
                {/* Component bài viết sẽ thêm sau */}
                <ProfilePosts userId={userId} />
              </div>
            )}

            {activeTab === "journals" && (
              <div className="tab-pane fade show active">
                {userId ? (
                  <ProfileJournal userId={userId} />
                ) : (
                  <ProfileJournal userId={userId} />
                )}
              </div>
            )}

            {activeTab === "friends" && (
              <div className="tab-pane fade show active">
                {/* Component bạn bè sẽ thêm sau */}
                <div className="card">
                  <div className="card-body text-center text-muted py-5">
                    <h5>Chưa có bạn bè</h5>
                    <p>Người dùng chưa kết bạn với ai</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "edit" && isOwnProfile && (
              <div className="tab-pane fade show active">
                <ProfileEdit />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
