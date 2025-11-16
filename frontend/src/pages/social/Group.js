// pages/GroupsPage.js
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { getImagesByCategoryActive } from "../../services/imageService";
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

  const [imageCover, setImageCover] = React.useState("");
  const [imageAvatar, setImageAvatar] = React.useState("");

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
      <div className="card mb-0">
        <div className="top-bg-image">
          <img
            src={
              // group?.coverPhoto || "../assets/images/BannerGroup_default_2.jpg"
              group?.coverPhoto ||
              imageCover ||
              "../assets/images/default-cover.jpg"
            }
            className="img-fluid w-100"
            alt="group-bg"
          />
        </div>
        <div className="card-body text-center">
          <div className="group-icon">
            <img
              src={
                group?.avatar ||
                imageAvatar ||
                "../assets/images/AvartarGroup_default.jpg"
              }
              alt="profile-img"
              className=" img-fluid rounded-circle avatar-120"
            />
          </div>
          <div className="group-info pt-3 pb-3 d-flex justify-content-center align-items-center">
            <div>
              <h4>
                <a
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(`/group/${group._id}`);
                  }}
                  style={{ color: "inherit" }}
                >
                  {group.name}
                </a>
              </h4>
              <p className="text-muted mb-0 ">{group.description}</p>
            </div>
          </div>

          <div className="group-details d-inline-block pb-3">
            <ul className="d-flex align-items-center justify-content-between list-inline m-0 p-0">
              <li className="pe-3 ps-3">
                <p className="mb-0">Post</p>
                <h6>600</h6>
              </li>
              <li className="pe-3 ps-3">
                <p className="mb-0">Member</p>
                <h6>{group.members || "899"}</h6>
              </li>
              <li className="pe-3 ps-3">
                <p className="mb-0">Visit</p>
                <h6>1.2k</h6>
              </li>
            </ul>
          </div>
          <div>
            {group.category && group.category.length > 0 && (
              <span className="badge bg-primary m-2">{group.category[0]}</span>
            )}
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
          <div className="group-member mb-3">
            <div className="iq-media-group">
              <a href="#" className="iq-media">
                <img
                  className="img-fluid avatar-40 rounded-circle"
                  src="../assets/images/user/05.jpg"
                  alt=""
                />
              </a>
              <a href="#" className="iq-media">
                <img
                  className="img-fluid avatar-40 rounded-circle"
                  src="../assets/images/user/06.jpg"
                  alt=""
                />
              </a>
              <a href="#" className="iq-media">
                <img
                  className="img-fluid avatar-40 rounded-circle"
                  src="../assets/images/user/07.jpg"
                  alt=""
                />
              </a>
              <a href="#" className="iq-media">
                <img
                  className="img-fluid avatar-40 rounded-circle"
                  src="../assets/images/user/08.jpg"
                  alt=""
                />
              </a>
              <a href="#" className="iq-media">
                <img
                  className="img-fluid avatar-40 rounded-circle"
                  src="../assets/images/user/09.jpg"
                  alt=""
                />
              </a>
              <a href="#" className="iq-media">
                <img
                  className="img-fluid avatar-40 rounded-circle"
                  src="../assets/images/user/10.jpg"
                  alt=""
                />
              </a>
            </div>
          </div>
          {showJoinButton ? (
            isMember ? (
              <Button
                variant="outline-primary"
                className="d-block w-100"
                onClick={() => navigate(`/group/${group._id}`)}
              >
                Xem Nhóm
              </Button>
            ) : (
              <Button
                variant="primary"
                className="d-block w-100"
                // onClick={() => handleJoinGroup(group._id)}
                onClick={() => navigate("/group/" + group._id)}
              >
                Vào Nhóm
              </Button>
            )
          ) : (
            <Button
              variant="outline-primary"
              className="d-block w-100"
              onClick={() => navigate(`/group/${group._id}`)}
            >
              Quản lý
            </Button>
          )}
        </div>
      </div>
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
            <div className="d-grid gap-3 d-grid-template-1fr-19">
              {groups.map((group, index) => (
                // <Col key={group._id} lg={4} md={6} className="mb-4">
                <GroupCard
                  key={group._id + "-" + index}
                  group={group}
                  showJoinButton={true}
                />
                // </Col>
              ))}
            </div>
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
