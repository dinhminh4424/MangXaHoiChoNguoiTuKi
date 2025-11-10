// src/components/settings/PrivacyTab.js
import React, { useState, useEffect } from "react";
import { Card, Form, Button, Alert, Row, Col } from "react-bootstrap";
import { accountService } from "../../services/accountService";

const PrivacyTab = ({ user }) => {
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: true,
    profileVisibility: "public",
    showOnlineStatus: true,
    allowFriendRequests: true,
    allowMessages: "everyone",
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await accountService.getSettings();
      if (response.data.data.settings) {
        setSettings(response.data.data.settings);
      }
    } catch (error) {
      console.error("Lỗi khi lấy cài đặt:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSettingChange = (key, value) => {
    setSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      await accountService.updateSettings(settings);
      setMessage({ type: "success", text: "Cập nhật cài đặt thành công!" });
    } catch (error) {
      setMessage({
        type: "danger",
        text: error.response?.data?.message || "Có lỗi xảy ra",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card className="settings-card">
        <Card.Body className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="settings-card">
      <Card.Header>
        <h4 className="mb-0">
          <i className="fas fa-user-shield me-2"></i>
          Cài Đặt Quyền Riêng Tư
        </h4>
      </Card.Header>
      <Card.Body>
        {message.text && <Alert variant={message.type}>{message.text}</Alert>}

        <Row>
          <Col md={6}>
            <h5 className="mb-3">Thông Báo</h5>

            <Form.Group className="mb-3">
              <Form.Check
                type="switch"
                id="email-notifications"
                label="Thông báo qua email"
                checked={settings.emailNotifications}
                onChange={(e) =>
                  handleSettingChange("emailNotifications", e.target.checked)
                }
              />
              <Form.Text className="text-muted">
                Nhận thông báo qua email về các hoạt động mới
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Check
                type="switch"
                id="push-notifications"
                label="Thông báo đẩy"
                checked={settings.pushNotifications}
                onChange={(e) =>
                  handleSettingChange("pushNotifications", e.target.checked)
                }
              />
              <Form.Text className="text-muted">
                Hiển thị thông báo trên trình duyệt
              </Form.Text>
            </Form.Group>

            <h5 className="mb-3">Trạng Thái Online</h5>
            <Form.Group className="mb-4">
              <Form.Check
                type="switch"
                id="show-online-status"
                label="Hiển thị trạng thái online"
                checked={settings.showOnlineStatus}
                onChange={(e) =>
                  handleSettingChange("showOnlineStatus", e.target.checked)
                }
              />
              <Form.Text className="text-muted">
                Cho phép người khác thấy khi bạn online
              </Form.Text>
            </Form.Group>
          </Col>

          <Col md={6}>
            <h5 className="mb-3">Quyền Riêng Tư Hồ Sơ</h5>

            <Form.Group className="mb-3">
              <Form.Label>Hiển thị hồ sơ</Form.Label>
              <Form.Select
                value={settings.profileVisibility}
                onChange={(e) =>
                  handleSettingChange("profileVisibility", e.target.value)
                }
              >
                <option value="public">Công khai</option>
                <option value="friends">Chỉ bạn bè</option>
                <option value="private">Riêng tư</option>
              </Form.Select>
              <Form.Text className="text-muted">
                Ai có thể xem hồ sơ của bạn
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Check
                type="switch"
                id="allow-friend-requests"
                label="Cho phép kết bạn"
                checked={settings.allowFriendRequests}
                onChange={(e) =>
                  handleSettingChange("allowFriendRequests", e.target.checked)
                }
              />
              <Form.Text className="text-muted">
                Cho phép người khác gửi lời mời kết bạn
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-4">
              <Form.Label>Ai có thể nhắn tin</Form.Label>
              <Form.Select
                value={settings.allowMessages}
                onChange={(e) =>
                  handleSettingChange("allowMessages", e.target.value)
                }
              >
                <option value="everyone">Mọi người</option>
                <option value="friends">Chỉ bạn bè</option>
                <option value="none">Không ai</option>
              </Form.Select>
              <Form.Text className="text-muted">
                Ai có thể gửi tin nhắn cho bạn
              </Form.Text>
            </Form.Group>
          </Col>
        </Row>

        <div className="d-flex justify-content-end mt-4">
          <Button
            variant="primary"
            onClick={handleSaveSettings}
            disabled={saving}
          >
            {saving ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                Đang lưu...
              </>
            ) : (
              <>
                <i className="fas fa-save me-2"></i>
                Lưu Cài Đặt
              </>
            )}
          </Button>
        </div>
      </Card.Body>
    </Card>
  );
};

export default PrivacyTab;
