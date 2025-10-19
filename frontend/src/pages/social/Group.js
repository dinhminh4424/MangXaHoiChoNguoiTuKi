// pages/GroupsPage.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  Container,
  Row,
  Col,
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
// import './GroupsPage.css';

const GroupsPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("discover");
  const [groups, setGroups] = useState([]);
  const [myGroups, setMyGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");

  // Load tất cả groups
  const loadAllGroups = async () => {
    try {
      setLoading(true);

      let response;
      if (searchTerm) {
        // Nếu có search term, dùng search API
        response = await groupService.searchGroups(searchTerm, {
          limit: 20,
        });
      } else {
        // Nếu không, lấy tất cả groups
        response = await groupService.getAllGroups({
          limit: 20,
        });
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
        // Refresh danh sách
        loadAllGroups();
        loadMyGroups();
        // Hiển thị thông báo thành công
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

  const getPrivacyText = (visibility) => {
    switch (visibility) {
      case "public":
        return "Công khai";
      case "private":
        return "Riêng tư";
      case "invite":
        return "Chỉ mời";
      default:
        return "Công khai";
    }
  };

  const GroupCard = ({ group, showJoinButton = true }) => {
    const isMember = myGroups.some((g) => g._id === group._id);

    return (
      <Card className="group-card h-100">
        <div className="group-cover">
          <div
            className="cover-image"
            style={{
              backgroundImage: group.coverPhoto
                ? `url(${group.coverPhoto})`
                : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            }}
          />
        </div>

        <Card.Body className="d-flex flex-column">
          <div className="group-avatar mb-3">
            {group.avatar ? (
              <img src={group.avatar} alt={group.name} className=" w-100" />
            ) : (
              <div className="avatar-placeholder rounded-circle">
                {group.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>

          <h5 className="group-name">{group.name}</h5>

          <p className="group-description text-muted small flex-grow-1">
            {group.description || "Chưa có mô tả..."}
          </p>

          <div className="group-meta mb-3">
            <div className="d-flex justify-content-between align-items-center small text-muted">
              <span className="d-flex align-items-center">
                {getPrivacyIcon(group.visibility)}
                {getPrivacyText(group.visibility)}
              </span>
              <span className="d-flex align-items-center">
                <Users size={16} className="me-1" />
                {group.memberCount} thành viên
              </span>
            </div>
          </div>

          {group.tags && group.tags.length > 0 && (
            <div className="group-tags mb-3">
              {group.tags.slice(0, 3).map((tag, index) => (
                <span
                  key={index}
                  className="badge bg-light text-dark me-1 mb-1"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-auto">
            {showJoinButton ? (
              isMember ? (
                <Button
                  variant="outline-primary"
                  size="sm"
                  className="w-100"
                  onClick={() => navigate(`/groups/${group._id}`)}
                >
                  Vào nhóm
                </Button>
              ) : (
                <Button
                  variant="primary"
                  size="sm"
                  className="w-100"
                  onClick={() => handleJoinGroup(group._id)}
                >
                  Tham gia
                </Button>
              )
            ) : (
              <Button
                variant="outline-primary"
                size="sm"
                className="w-100"
                onClick={() => navigate(`/group/${group._id}`)}
              >
                Quản lý
              </Button>
            )}
          </div>
        </Card.Body>
      </Card>
    );
  };

  return (
    <Container className="groups-page py-4">
      {/* Header */}
      <div className="page-header mb-4">
        <div className="d-flex justify-content-between align-items-center">
          <div>
            <h1 className="h2 mb-1">Các nhóm</h1>
            <p className="text-muted mb-0">
              Khám phá và tham gia các nhóm cùng sở thích
            </p>
          </div>
          <Button
            variant="primary"
            className="d-flex align-items-center gap-2"
            onClick={handleCreateGroup}
          >
            <Plus size={20} />
            Tạo nhóm
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Search */}
      <Card className="mb-4">
        <Card.Body>
          <Form onSubmit={handleSearch}>
            <div className="position-relative">
              <Search
                size={20}
                className="position-absolute top-50 start-0 translate-middle-y ms-3 text-muted"
              />
              <Form.Control
                type="text"
                placeholder="Tìm kiếm nhóm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: "45px" }}
              />
            </div>
          </Form>
        </Card.Body>
      </Card>

      {/* Tabs */}
      <Tabs
        activeKey={activeTab}
        onSelect={(tab) => setActiveTab(tab)}
        className="mb-4"
      >
        <Tab eventKey="discover" title="Khám phá">
          {loading ? (
            <div className="text-center py-5">
              <Spinner animation="border" variant="primary" />
              <p className="mt-2 text-muted">Đang tải nhóm...</p>
            </div>
          ) : groups.length > 0 ? (
            <Row>
              {groups.map((group) => (
                <Col key={group._id} lg={4} md={6} className="mb-4">
                  <GroupCard group={group} showJoinButton={true} />
                </Col>
              ))}
            </Row>
          ) : (
            <div className="text-center py-5">
              <Users size={64} className="text-muted mb-3" />
              <h5>Không tìm thấy nhóm nào</h5>
              <p className="text-muted">Hãy thử tìm kiếm với từ khóa khác</p>
            </div>
          )}
        </Tab>

        <Tab eventKey="my-groups" title="Nhóm của tôi">
          {myGroups.length > 0 ? (
            <Row>
              {myGroups.map((group) => (
                <Col key={group._id} lg={4} md={6} className="mb-4">
                  <GroupCard group={group} showJoinButton={false} />
                </Col>
              ))}
            </Row>
          ) : (
            <div className="text-center py-5">
              <Users size={64} className="text-muted mb-3" />
              <h5>Bạn chưa tham gia nhóm nào</h5>
              <p className="text-muted">
                Hãy khám phá và tham gia các nhóm thú vị!
              </p>
              <Button
                variant="primary"
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
