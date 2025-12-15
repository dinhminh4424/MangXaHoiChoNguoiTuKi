// pages/GroupsPage.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { getImagesByCategoryActive } from "../../services/imageService";
import {
  Container,
  Card,
  Button,
  Spinner,
  Alert,
  Form,
  Tab,
  Tabs,
} from "react-bootstrap";
import { Users, Plus, Search, Globe, Lock, Mail } from "lucide-react";
import groupService from "../../services/groupService";
import "./GroupsPage.css";

const GroupsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("discover");
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  const [imageCover, setImageCover] = React.useState("");
  const [imageAvatar, setImageAvatar] = React.useState("");

  // Load image default
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

  // Load tất cả groups
  const loadAllGroups = async () => {
    try {
      setLoading(true);
      let response;
      if (searchTerm) {
        response = await groupService.searchGroups(searchTerm, { limit: 20 });
      } else {
        response = await groupService.getAllGroups({ limit: 20 });
      }

      if (response.success) {
        setGroups(response.groups || []);
      }
    } catch (err) {
      setError(err.response?.message || "Lỗi khi tải danh sách nhóm");
    } finally {
      setLoading(false);
    }
  };

  // Load groups của user
  const loadMyGroups = async () => {
    if (!user) return;
    try {
      const response = await groupService.getUserGroups();
      if (response.success) {
        setMyGroups(response.groups || []);
      }
    } catch (err) {
      console.error("Error loading my groups:", err);
    }
  };

  const handleJoinGroup = async (groupId) => {
    try {
      const response = await groupService.joinGroup(groupId);
      if (response.success) {
        loadAllGroups();
        loadMyGroups();
        alert("Đã tham gia nhóm thành công!");
      }
    } catch (err) {
      setError(err.response?.message || "Lỗi khi tham gia nhóm");
    }
  };

  const handleCreateGroup = () => {
    navigate("/create-group");
  };

  const handleSearch = (e) => {
    e.preventDefault();
    loadAllGroups();
  };

  useEffect(() => {
    loadAllGroups();
    loadMyGroups();
  }, []);

  const getPrivacyIcon = (visibility) => {
    switch (visibility) {
      case "public":
        return <Globe size={16} className="me-1" />;
      case "private":
        return <Lock size={16} className="me-1" />;
      case "invite":
        return <Mail size={16} className="me-1" />;
      default:
        return <Globe size={16} className="me-1" />;
    }
  };

  // pages/GroupsPage.js (chỉnh sửa phần GroupCard)
  const GroupCard = ({ group, showJoinButton = true }) => {
    const isMember = myGroups.some((g) => g._id === group._id);

    return (
      <Card className="group-card h-100">
        <div className="group-cover-container">
          <img
            src={
              group?.coverPhoto ||
              imageCover ||
              "../assets/images/default-cover.jpg"
            }
            className="group-cover-img"
            alt="group cover"
            loading="lazy"
            onError={(e) => {
              e.target.src = "../assets/images/default-cover.jpg";
            }}
          />
          <div className="group-avatar-overlay">
            <img
              src={
                group?.avatar ||
                imageAvatar ||
                "../assets/images/default-avatar.jpg"
              }
              alt="group avatar"
              className="group-avatar-img"
              loading="lazy"
              onError={(e) => {
                e.target.src = "../assets/images/default-avatar.jpg";
              }}
            />
          </div>
        </div>

        <Card.Body className="group-card-body">
          <div className="group-header">
            <h5 className="group-title mb-2">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  navigate(`/group/${group._id}`);
                }}
                className="group-title-link"
              >
                {group.name}
              </a>
            </h5>
            <p className="group-description text-muted mb-3">
              {group.description || "Chưa có mô tả"}
            </p>
          </div>

          <div className="group-stats mb-3">
            <div className="group-stat-item">
              <span className="stat-label">Bài viết</span>
              <span className="stat-value">{group.postCount || 0}</span>
            </div>
            <div className="group-stat-item">
              <span className="stat-label">Thành viên</span>
              <span className="stat-value">{group.memberCount || 0}</span>
            </div>
            <div className="group-stat-item">
              <span className="stat-label">Hoạt động</span>
              <span className="stat-value">
                {group.reactionCount?.totalInteractions || 0}
              </span>
            </div>
          </div>

          {group.category && group.category.length > 0 && (
            <div className="group-category text-center mb-3">
              <span className="group-category-badge bg-info">
                {group.category[0]}
              </span>
            </div>
          )}

          {group.tags && group.tags.length > 0 && (
            <div className="group-tags mb-3">
              {group.tags.slice(0, 3).map((tag, index) => (
                <span key={index} className="group-tag">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {group.membersPreview && group.membersPreview.length > 0 && (
            <div className="group-members-preview mb-3">
              <div className="members-list">
                {group.membersPreview.slice(0, 5).map((member, index) => (
                  <a
                    key={index}
                    href={`/profile/${member.userId._id}`}
                    className="member-avatar-link"
                    title={member.userId.username}
                  >
                    <img
                      className="member-avatar"
                      src={
                        member.userId.profile?.avatar ||
                        "/assets/images/default-avatar.png"
                      }
                      alt={member.userId.username || "thành viên"}
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = "/assets/images/default-avatar.png";
                      }}
                    />
                  </a>
                ))}
                {group.memberCount > 5 && (
                  <span className="more-members">+{group.memberCount - 5}</span>
                )}
              </div>
            </div>
          )}
        </Card.Body>

        <Card.Footer className="group-card-footer">
          {showJoinButton ? (
            isMember ? (
              <Button
                variant="outline-primary"
                className="group-action-btn"
                onClick={() => navigate(`/group/${group._id}`)}
              >
                Vào nhóm
              </Button>
            ) : (
              <Button
                variant="primary"
                className="group-action-btn"
                onClick={() => navigate(`/group/${group._id}`)}
              >
                Xem nhóm
              </Button>
            )
          ) : (
            <Button
              variant="outline-primary"
              className="group-action-btn"
              onClick={() => navigate(`/group/${group._id}`)}
            >
              Quản lý
            </Button>
          )}
        </Card.Footer>
      </Card>
    );
  };

  return (
    <Container className="groups-page-container py-4">
      {/* Header */}
      <div className="page-header mb-4">
        <div className="header-content">
          <div className="header-text">
            <h1 className="page-title">Các nhóm</h1>
            <p className="page-subtitle">
              Khám phá và tham gia các nhóm cùng sở thích
            </p>
          </div>
          <Button
            variant="primary"
            className="create-group-btn"
            onClick={handleCreateGroup}
          >
            <Plus size={20} />
            <span>Tạo nhóm</span>
          </Button>
        </div>
      </div>

      {error && (
        <Alert
          variant="danger"
          dismissible
          onClose={() => setError(null)}
          className="mb-4"
        >
          {error}
        </Alert>
      )}

      {/* Search */}
      <Card className="search-card mb-4">
        <Card.Body className="search-card-body">
          <Form onSubmit={handleSearch}>
            <div className="search-input-container">
              <Search size={20} className="search-icon" />
              <Form.Control
                type="text"
                placeholder="Tìm kiếm nhóm theo tên, mô tả..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
          </Form>
        </Card.Body>
      </Card>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onSelect={(tab) => setActiveTab(tab)}
        className="groups-tabs mb-4"
      >
        <Tab
          eventKey="discover"
          title="Khám phá"
          className="groups-tab-content"
        >
          {loading ? (
            <div className="loading-container">
              <Spinner animation="border" variant="primary" />
              <p className="loading-text">Đang tải nhóm...</p>
            </div>
          ) : groups.length > 0 ? (
            <div className="groups-grid">
              {groups.map((group, index) => (
                <div key={group._id + "-" + index} className="group-grid-item">
                  <GroupCard group={group} showJoinButton={true} />
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Users size={64} className="empty-state-icon" />
              <h5 className="empty-state-title">Không tìm thấy nhóm nào</h5>
              <p className="empty-state-text">
                Hãy thử tìm kiếm với từ khóa khác
              </p>
            </div>
          )}
        </Tab>

        <Tab
          eventKey="my-groups"
          title="Nhóm của tôi"
          className="groups-tab-content"
        >
          {myGroups.length > 0 ? (
            <div className="groups-grid">
              {myGroups.map((group) => (
                <div key={group._id} className="group-grid-item">
                  <GroupCard group={group} showJoinButton={false} />
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <Users size={64} className="empty-state-icon" />
              <h5 className="empty-state-title">Bạn chưa tham gia nhóm nào</h5>
              <p className="empty-state-text">
                Hãy khám phá và tham gia các nhóm thú vị!
              </p>
              <Button
                variant="primary"
                className="explore-btn"
                onClick={() => setActiveTab("discover")}
              >
                Khám phá nhóm
              </Button>
            </div>
          )}
        </Tab>
      </Tabs>
    </Container>
  );
};

export default GroupsPage;
