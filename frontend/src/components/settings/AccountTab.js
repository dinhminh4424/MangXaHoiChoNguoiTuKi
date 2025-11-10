// src/components/settings/AccountTab.js
import React, { useState } from "react";
import {
  Card,
  Row,
  Col,
  Button,
  Modal,
  Form,
  Alert,
  Badge,
} from "react-bootstrap";
import { accountService } from "../../services/accountService";

const AccountTab = ({ user }) => {
  const [showDeactivateModal, setShowDeactivateModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [deactivateData, setDeactivateData] = useState({
    password: "",
    reason: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const handleDeactivate = async () => {
    setLoading(true);
    try {
      await accountService.deactivateAccount(
        deactivateData.password,
        deactivateData.reason
      );
      setMessage({
        type: "success",
        text: "Tài khoản đã được vô hiệu hóa thành công",
      });
      setShowDeactivateModal(false);
      // Redirect to login or home page
      setTimeout(() => {
        localStorage.removeItem("token");
        window.location.href = "/login";
      }, 2000);
    } catch (error) {
      setMessage({
        type: "danger",
        text: error.response?.data?.message || "Có lỗi xảy ra",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      const response = await accountService.exportData();
      // Tạo file download
      const dataStr = JSON.stringify(response.data.data, null, 2);
      const dataBlob = new Blob([dataStr], { type: "application/json" });
      const url = URL.createObjectURL(dataBlob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `user-data-${user.username}-${
        new Date().toISOString().split("T")[0]
      }.json`;
      link.click();
      URL.revokeObjectURL(url);
      setShowExportModal(false);
    } catch (error) {
      setMessage({
        type: "danger",
        text: error.response?.data?.message || "Có lỗi xảy ra",
      });
    }
  };

  return (
    <>
      <Card className="settings-card mb-4">
        <Card.Header>
          <h4 className="mb-0">
            <i className="fas fa-info-circle me-2"></i>
            Thông Tin Tài Khoản
          </h4>
        </Card.Header>
        <Card.Body>
          <Row className="mb-3">
            <Col sm={4}>
              <strong>Tên đăng nhập:</strong>
            </Col>
            <Col sm={8}>{user?.username}</Col>
          </Row>
          <Row className="mb-3">
            <Col sm={4}>
              <strong>Email:</strong>
            </Col>
            <Col sm={8}>{user?.email || "Chưa cập nhật"}</Col>
          </Row>
          <Row className="mb-3">
            <Col sm={4}>
              <strong>Vai trò:</strong>
            </Col>
            <Col sm={8}>
              <Badge
                bg={
                  user?.role === "admin"
                    ? "danger"
                    : user?.role === "supporter"
                    ? "warning"
                    : user?.role === "doctor"
                    ? "info"
                    : "primary"
                }
              >
                {user?.role}
              </Badge>
            </Col>
          </Row>
          <Row className="mb-3">
            <Col sm={4}>
              <strong>Trạng thái:</strong>
            </Col>
            <Col sm={8}>
              <Badge bg={user?.active ? "success" : "secondary"}>
                {user?.active ? "Đang hoạt động" : "Đã vô hiệu hóa"}
              </Badge>
            </Col>
          </Row>
          <Row>
            <Col sm={4}>
              <strong>Ngày tham gia:</strong>
            </Col>
            <Col sm={8}>
              {new Date(user?.createdAt).toLocaleDateString("vi-VN")}
            </Col>
          </Row>
        </Card.Body>
      </Card>

      <Card className="settings-card mb-4">
        <Card.Header>
          <h4 className="mb-0">
            <i className="fas fa-download me-2"></i>
            Xuất Dữ Liệu
          </h4>
        </Card.Header>
        <Card.Body>
          <p className="text-muted mb-3">
            Tải xuống toàn bộ dữ liệu cá nhân của bạn bao gồm bài viết, nhật ký
            và bình luận.
          </p>
          <Button
            variant="outline-primary"
            onClick={() => setShowExportModal(true)}
          >
            <i className="fas fa-file-export me-2"></i>
            Xuất Dữ Liệu
          </Button>
        </Card.Body>
      </Card>

      <Card className="settings-card border-danger">
        <Card.Header
          className="bg-danger text-white"
          style={{ background: "#dc3545" }}
        >
          <h4 className="mb-0">
            <i className="fas fa-exclamation-triangle me-2"></i>
            Vùng Nguy Hiểm
          </h4>
        </Card.Header>
        <Card.Body>
          <p className="text-muted mb-3">
            Vô hiệu hóa tài khoản sẽ ẩn tất cả nội dung của bạn và bạn không thể
            đăng nhập lại. Bạn có thể kích hoạt lại trong vòng 30 ngày.
          </p>
          <Button variant="danger" onClick={() => setShowDeactivateModal(true)}>
            <i className="fas fa-user-slash me-2"></i>
            Vô Hiệu Hóa Tài Khoản
          </Button>
        </Card.Body>
      </Card>

      {/* Deactivate Modal */}
      <Modal
        show={showDeactivateModal}
        onHide={() => setShowDeactivateModal(false)}
        centered
      >
        <Modal.Header closeButton className="bg-danger text-white">
          <Modal.Title style={{ color: "white" }}>
            Vô Hiệu Hóa Tài Khoản
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {message.text && <Alert variant={message.type}>{message.text}</Alert>}
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Mật khẩu xác nhận</Form.Label>
              <Form.Control
                type="password"
                value={deactivateData.password}
                onChange={(e) =>
                  setDeactivateData({
                    ...deactivateData,
                    password: e.target.value,
                  })
                }
                placeholder="Nhập mật khẩu của bạn"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Lý do (tùy chọn)</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={deactivateData.reason}
                onChange={(e) =>
                  setDeactivateData({
                    ...deactivateData,
                    reason: e.target.value,
                  })
                }
                placeholder="Cho chúng tôi biết lý do bạn rời đi..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowDeactivateModal(false)}
          >
            Hủy
          </Button>
          <Button
            variant="danger"
            onClick={handleDeactivate}
            disabled={loading}
          >
            {loading ? "Đang xử lý..." : "Vô Hiệu Hóa"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Export Modal */}
      <Modal
        show={showExportModal}
        onHide={() => setShowExportModal(false)}
        size="md"
        centered
      >
        <Modal.Header
          closeButton
          style={{ backgroundColor: "#0d6efd", color: "white" }}
        >
          <Modal.Title style={{ color: "white" }}>Xuất Dữ Liệu</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Bạn có muốn tải xuống toàn bộ dữ liệu cá nhân của mình?</p>
          <div className="row">
            <div className="col-md-6">
              {" "}
              <ul>
                <li>Thông tin tài khoản</li>
                <li>Bài viết</li>
                <li>Nhật ký</li>
              </ul>
            </div>
            <div className="col-md-6">
              {" "}
              <ul>
                <li>Bình luận</li>
                <li>Công việc</li>
                <li>Hội nhóm</li>
              </ul>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowExportModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleExportData}>
            <i className="fas fa-download me-2"></i>
            Tải Xuống
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AccountTab;
