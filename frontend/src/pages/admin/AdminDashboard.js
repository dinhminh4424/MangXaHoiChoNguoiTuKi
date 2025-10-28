import React, { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import { getDashboardStats } from "../../services/adminService";
import { updateToken } from "../../services/api";
import "./AdminDashboard.css";

const AdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      // Cập nhật token trước khi gọi API
      updateToken();
      const response = await getDashboardStats();
      setStats(response.data);
    } catch (err) {
      setError("Không thể tải thống kê dashboard: " + err.toString());
      console.error("Dashboard stats error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-container">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Đang tải thống kê...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="error-container">
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
          <button className="btn btn-primary" onClick={fetchDashboardStats}>
            Thử lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h1>Dashboard Admin</h1>
        <p>Chào mừng, {user?.username}! Đây là tổng quan hệ thống.</p>
      </div>

      {/* Thống kê tổng quan */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">
            <i className="ri-user-line"></i>
          </div>
          <div className="stat-content">
            <h3>{stats?.overview?.totalUsers || 0}</h3>
            <p>Tổng người dùng</p>
            <small>+{stats?.weeklyStats?.newUsers || 0} tuần này</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="ri-file-text-line"></i>
          </div>
          <div className="stat-content">
            <h3>{stats?.overview?.totalPosts || 0}</h3>
            <p>Tổng bài viết</p>
            <small>+{stats?.weeklyStats?.newPosts || 0} tuần này</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="ri-book-open-line"></i>
          </div>
          <div className="stat-content">
            <h3>{stats?.overview?.totalJournals || 0}</h3>
            <p>Tổng nhật ký</p>
            <small>+{stats?.weeklyStats?.newJournals || 0} tuần này</small>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="ri-group-line"></i>
          </div>
          <div className="stat-content">
            <h3>{stats?.overview?.totalGroups || 0}</h3>
            <p>Tổng nhóm</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="ri-chat-3-line"></i>
          </div>
          <div className="stat-content">
            <h3>{stats?.overview?.totalComments || 0}</h3>
            <p>Tổng bình luận</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">
            <i className="ri-message-3-line"></i>
          </div>
          <div className="stat-content">
            <h3>{stats?.overview?.totalMessages || 0}</h3>
            <p>Tổng tin nhắn</p>
          </div>
        </div>
      </div>

      {/* Hoạt động gần đây */}
      <div className="dashboard-sections">
        <div className="section">
          <h2>Người dùng mới</h2>
          <div className="recent-list">
            {stats?.recentActivity?.users?.map((user) => (
              <div key={user._id} className="recent-item">
                <div className="user-info">
                  <div className="avatar">
                    <i className="ri-user-line"></i>
                  </div>
                  <div className="details">
                    <h4>{user.username}</h4>
                    <p>{user.email}</p>
                    <small>
                      {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                    </small>
                  </div>
                </div>
                <span className={`role-badge role-${user.role}`}>
                  {user.role}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="section">
          <h2>Bài viết gần đây</h2>
          <div className="recent-list">
            {stats?.recentActivity?.posts?.map((post) => (
              <div key={post._id} className="recent-item">
                <div className="post-info">
                  <div className="avatar">
                    <i className="ri-file-text-line"></i>
                  </div>
                  <div className="details">
                    <h4>{post.author?.username}</h4>
                    <p>{post.content?.substring(0, 50)}...</p>
                    <small>
                      {new Date(post.createdAt).toLocaleDateString("vi-VN")}
                    </small>
                  </div>
                </div>
                <div className="post-stats">
                  <span>
                    <i className="ri-heart-line"></i> {post.likes?.length || 0}
                  </span>
                  <span>
                    <i className="ri-chat-3-line"></i>{" "}
                    {post.comments?.length || 0}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Thống kê cảm xúc */}
      {stats?.moodStats && stats.moodStats.length > 0 && (
        <div className="section">
          <h2>Thống kê cảm xúc</h2>
          <div className="mood-stats">
            {stats.moodStats.map((mood, index) => (
              <div key={index} className="mood-item">
                <span className="mood-name">{mood._id}</span>
                <div className="mood-bar">
                  <div
                    className="mood-fill"
                    style={{
                      width: `${
                        (mood.count / stats.moodStats[0].count) * 100
                      }%`,
                    }}
                  ></div>
                </div>
                <span className="mood-count">{mood.count}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
