import React, { useState, useEffect } from "react";
import {
  getAllPosts,
  getAllJournals,
  getAllGroups,
  deletePost,
  deleteJournal,
  deleteGroup,
} from "../../services/adminService";
import "./AdminContentManagement.css";

const AdminContentManagement = () => {
  const [activeTab, setActiveTab] = useState("posts");
  const [posts, setPosts] = useState([]);
  const [journals, setJournals] = useState([]);
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      let response;
      switch (activeTab) {
        case "posts":
          response = await getAllPosts({ page: 1, limit: 10 });
          setPosts(response.data.data.posts);
          setPagination(response.data.data.pagination);
          break;
        case "journals":
          response = await getAllJournals({ page: 1, limit: 10 });
          setJournals(response.data.data.journals);
          setPagination(response.data.data.pagination);
          break;
        case "groups":
          response = await getAllGroups({ page: 1, limit: 10 });
          setGroups(response.data.data.groups);
          setPagination(response.data.data.pagination);
          break;
        default:
          break;
      }
    } catch (err) {
      setError("Không thể tải dữ liệu");
      console.error("Fetch data error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, type) => {
    const itemName =
      type === "posts" ? "bài viết" : type === "journals" ? "nhật ký" : "nhóm";

    if (window.confirm(`Bạn có chắc chắn muốn xóa ${itemName} này?`)) {
      try {
        switch (type) {
          case "posts":
            await deletePost(id);
            setPosts(posts.filter((post) => post._id !== id));
            break;
          case "journals":
            await deleteJournal(id);
            setJournals(journals.filter((journal) => journal._id !== id));
            break;
          case "groups":
            await deleteGroup(id);
            setGroups(groups.filter((group) => group._id !== id));
            break;
          default:
            break;
        }
      } catch (err) {
        alert(`Không thể xóa ${itemName}`);
        console.error("Delete error:", err);
      }
    }
  };

  const renderPosts = () => (
    <div className="content-list">
      {posts.map((post) => (
        <div key={post._id} className="content-item">
          <div className="content-header">
            <div className="author-info">
              <div className="avatar">
                <i className="ri-user-line"></i>
              </div>
              <div className="details">
                <h4>{post.author?.username}</h4>
                <p>{new Date(post.createdAt).toLocaleDateString("vi-VN")}</p>
              </div>
            </div>
            <div className="content-stats">
              <span>
                <i className="ri-heart-line"></i> {post.likes?.length || 0}
              </span>
              <span>
                <i className="ri-chat-3-line"></i> {post.comments?.length || 0}
              </span>
            </div>
          </div>
          <div className="content-body">
            <p>{post.content?.substring(0, 200)}...</p>
            {post.media && post.media.length > 0 && (
              <div className="media-preview">
                <i className="ri-image-line"></i>
                <span>{post.media.length} tệp đính kèm</span>
              </div>
            )}
          </div>
          <div className="content-actions">
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => window.open(`/posts/${post._id}`, "_blank")}
            >
              <i className="ri-eye-line"></i> Xem
            </button>
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={() => handleDelete(post._id, "posts")}
            >
              <i className="ri-delete-bin-line"></i> Xóa
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderJournals = () => (
    <div className="content-list">
      {journals.map((journal) => (
        <div key={journal._id} className="content-item">
          <div className="content-header">
            <div className="author-info">
              <div className="avatar">
                <i className="ri-user-line"></i>
              </div>
              <div className="details">
                <h4>{journal.author?.username}</h4>
                <p>{new Date(journal.createdAt).toLocaleDateString("vi-VN")}</p>
              </div>
            </div>
            <div className="journal-mood">
              {journal.emotion && (
                <span className="mood-badge">{journal.emotion}</span>
              )}
            </div>
          </div>
          <div className="content-body">
            <h5>{journal.title}</h5>
            <p>{journal.content?.substring(0, 200)}...</p>
          </div>
          <div className="content-actions">
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => window.open(`/journal/${journal._id}`, "_blank")}
            >
              <i className="ri-eye-line"></i> Xem
            </button>
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={() => handleDelete(journal._id, "journals")}
            >
              <i className="ri-delete-bin-line"></i> Xóa
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  const renderGroups = () => (
    <div className="content-list">
      {groups.map((group) => (
        <div key={group._id} className="content-item">
          <div className="content-header">
            <div className="author-info">
              <div className="avatar">
                <i className="ri-group-line"></i>
              </div>
              <div className="details">
                <h4>{group.name}</h4>
                <p>Quản lý bởi {group.admin?.username}</p>
              </div>
            </div>
            <div className="group-stats">
              <span>
                <i className="ri-user-line"></i> {group.members?.length || 0}{" "}
                thành viên
              </span>
            </div>
          </div>
          <div className="content-body">
            <p>{group.description?.substring(0, 200)}...</p>
            <div className="group-tags">
              {group.tags &&
                group.tags.map((tag, index) => (
                  <span key={index} className="tag">
                    {tag}
                  </span>
                ))}
            </div>
          </div>
          <div className="content-actions">
            <button
              className="btn btn-sm btn-outline-primary"
              onClick={() => window.open(`/group/${group._id}`, "_blank")}
            >
              <i className="ri-eye-line"></i> Xem
            </button>
            <button
              className="btn btn-sm btn-outline-danger"
              onClick={() => handleDelete(group._id, "groups")}
            >
              <i className="ri-delete-bin-line"></i> Xóa
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  if (loading) {
    return (
      <div className="admin-content-management">
        <div className="loading-container">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-content-management">
      <div className="page-header">
        <h1>Quản lý nội dung</h1>
        <p>Quản lý bài viết, nhật ký và nhóm trong hệ thống</p>
      </div>

      {/* Tabs */}
      <div className="content-tabs">
        <button
          className={`tab-button ${activeTab === "posts" ? "active" : ""}`}
          onClick={() => setActiveTab("posts")}
        >
          <i className="ri-file-text-line"></i>
          Bài viết ({posts.length})
        </button>
        <button
          className={`tab-button ${activeTab === "journals" ? "active" : ""}`}
          onClick={() => setActiveTab("journals")}
        >
          <i className="ri-book-open-line"></i>
          Nhật ký ({journals.length})
        </button>
        <button
          className={`tab-button ${activeTab === "groups" ? "active" : ""}`}
          onClick={() => setActiveTab("groups")}
        >
          <i className="ri-group-line"></i>
          Nhóm ({groups.length})
        </button>
      </div>

      {/* Content */}
      <div className="content-section">
        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {activeTab === "posts" && renderPosts()}
        {activeTab === "journals" && renderJournals()}
        {activeTab === "groups" && renderGroups()}

        {/* Empty State */}
        {((activeTab === "posts" && posts.length === 0) ||
          (activeTab === "journals" && journals.length === 0) ||
          (activeTab === "groups" && groups.length === 0)) && (
          <div className="empty-state">
            <i className="ri-inbox-line"></i>
            <h3>Chưa có nội dung</h3>
            <p>
              Chưa có{" "}
              {activeTab === "posts"
                ? "bài viết"
                : activeTab === "journals"
                ? "nhật ký"
                : "nhóm"}{" "}
              nào trong hệ thống.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminContentManagement;
