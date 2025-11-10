// src/components/settings/SettingsDashboard.js
import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Nav, Tab } from "react-bootstrap";
import ProfileTab from "./ProfileTab";
import AccountTab from "./AccountTab";
import SecurityTab from "./SecurityTab";
import ActivityTab from "./ActivityTab";
import PrivacyTab from "./PrivacyTab";
import { accountService } from "../../services/accountService";
import "./SettingsDashboard.css";

const SettingsDashboard = () => {
  const [activeTab, setActiveTab] = useState("profile");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await accountService.getProfile();
      console.log("response: ", response);
      setUser(response.data.user);
    } catch (error) {
      console.error("Lỗi khi lấy thông tin user:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container className="mt-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="settings-dashboard mt-4">
      <Row>
        <Col>
          <h1 className="mb-4">Cài Đặt Tài Khoản</h1>
        </Col>
      </Row>

      <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
        <Row>
          <Col md={3}>
            <Card className="settings-sidebar">
              <Card.Body>
                <Nav variant="pills" className="flex-column">
                  <Nav.Item>
                    <Nav.Link eventKey="profile" className="settings-nav-link">
                      <i className="fas fa-user me-2"></i>
                      Hồ Sơ
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="account" className="settings-nav-link">
                      <i className="fas fa-cog me-2"></i>
                      Tài Khoản
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="security" className="settings-nav-link">
                      <i className="fas fa-shield-alt me-2"></i>
                      Bảo Mật
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="privacy" className="settings-nav-link">
                      <i className="fas fa-lock me-2"></i>
                      Quyền Riêng Tư
                    </Nav.Link>
                  </Nav.Item>
                  <Nav.Item>
                    <Nav.Link eventKey="activity" className="settings-nav-link">
                      <i className="fas fa-history me-2"></i>
                      Lịch Sử Hoạt Động
                    </Nav.Link>
                  </Nav.Item>
                </Nav>
              </Card.Body>
            </Card>
          </Col>

          <Col md={9}>
            <Tab.Content>
              <Tab.Pane eventKey="profile">
                <ProfileTab user={user} onUpdate={fetchUserProfile} />
              </Tab.Pane>
              <Tab.Pane eventKey="account">
                <AccountTab user={user} />
              </Tab.Pane>
              <Tab.Pane eventKey="security">
                <SecurityTab />
              </Tab.Pane>
              <Tab.Pane eventKey="privacy">
                <PrivacyTab user={user} />
              </Tab.Pane>
              <Tab.Pane eventKey="activity">
                <ActivityTab />
              </Tab.Pane>
            </Tab.Content>
          </Col>
        </Row>
      </Tab.Container>
    </Container>
  );
};

export default SettingsDashboard;
