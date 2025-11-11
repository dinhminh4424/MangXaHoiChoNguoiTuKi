// src/components/settings/SecurityTab.js
import React, { useState } from "react";
import { Card, Form, Button, Row, Col, Alert, Modal } from "react-bootstrap";
import { accountService } from "../../services/accountService";

const SecurityTab = () => {
  const [changePasswordData, setChangePasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [resetPasswordData, setResetPasswordData] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [showResetModal, setShowResetModal] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: "", text: "" });

    if (changePasswordData.newPassword !== changePasswordData.confirmPassword) {
      setMessage({ type: "danger", text: "Mật khẩu mới không khớp" });
      setLoading(false);
      return;
    }

    try {
      await accountService.changePassword(
        changePasswordData.currentPassword,
        changePasswordData.newPassword
      );
      setMessage({ type: "success", text: "Đổi mật khẩu thành công!" });
      setChangePasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      setMessage({
        type: "danger",
        text: error.response?.data?.message || "Có lỗi xảy ra",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRequestOTP = async () => {
    if (!resetPasswordData.email) {
      setMessage({ type: "danger", text: "Vui lòng nhập email" });
      return;
    }

    try {
      await accountService.requestPasswordReset(resetPasswordData.email);
      setOtpSent(true);
      setMessage({
        type: "success",
        text: "Mã OTP đã được gửi đến email của bạn",
      });
    } catch (error) {
      setMessage({
        type: "danger",
        text: error.response?.data?.message || "Có lỗi xảy ra",
      });
    }
  };

  const handleResetPassword = async () => {
    if (resetPasswordData.newPassword !== resetPasswordData.confirmPassword) {
      setMessage({ type: "danger", text: "Mật khẩu mới không khớp" });
      return;
    }

    setLoading(true);
    try {
      await accountService.resetPasswordWithOTP(
        resetPasswordData.email,
        resetPasswordData.otp,
        resetPasswordData.newPassword
      );
      setMessage({ type: "success", text: "Đặt lại mật khẩu thành công!" });
      setShowResetModal(false);
      setResetPasswordData({
        email: "",
        otp: "",
        newPassword: "",
        confirmPassword: "",
      });
      setOtpSent(false);
    } catch (error) {
      setMessage({
        type: "danger",
        text: error.response?.data?.message || "Có lỗi xảy ra",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Card className="settings-card mb-4">
        <Card.Header>
          <h4 className="mb-0">
            <i className="fas fa-key me-2"></i>
            Đổi Mật Khẩu
          </h4>
        </Card.Header>
        <Card.Body>
          {message.text && <Alert variant={message.type}>{message.text}</Alert>}

          <Form onSubmit={handleChangePassword}>
            <Form.Group className="mb-3">
              <Form.Label>Mật khẩu hiện tại</Form.Label>
              <Form.Control
                type="password"
                value={changePasswordData.currentPassword}
                onChange={(e) =>
                  setChangePasswordData({
                    ...changePasswordData,
                    currentPassword: e.target.value,
                  })
                }
                placeholder="Nhập mật khẩu hiện tại"
                required
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Mật khẩu mới</Form.Label>
                  <Form.Control
                    type="password"
                    value={changePasswordData.newPassword}
                    onChange={(e) =>
                      setChangePasswordData({
                        ...changePasswordData,
                        newPassword: e.target.value,
                      })
                    }
                    placeholder="Nhập mật khẩu mới"
                    required
                    minLength={6}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Xác nhận mật khẩu mới</Form.Label>
                  <Form.Control
                    type="password"
                    value={changePasswordData.confirmPassword}
                    onChange={(e) =>
                      setChangePasswordData({
                        ...changePasswordData,
                        confirmPassword: e.target.value,
                      })
                    }
                    placeholder="Xác nhận mật khẩu mới"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <div className="d-flex justify-content-end">
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? "Đang xử lý..." : "Đổi Mật Khẩu"}
              </Button>
            </div>
          </Form>
        </Card.Body>
      </Card>

      <Card className="settings-card">
        <Card.Header>
          <h4 className="mb-0">
            <i className="fas fa-unlock-alt me-2"></i>
            Quên Mật Khẩu
          </h4>
        </Card.Header>
        <Card.Body>
          <p className="text-muted mb-3">
            Nếu bạn quên mật khẩu, bạn có thể đặt lại mật khẩu bằng email đã
            đăng ký.
          </p>
          <Button
            variant="outline-primary"
            onClick={() => setShowResetModal(true)}
          >
            <i className="fas fa-redo me-2"></i>
            Đặt Lại Mật Khẩu
          </Button>
        </Card.Body>
      </Card>

      {/* Reset Password Modal */}
      <Modal
        show={showResetModal}
        onHide={() => setShowResetModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Đặt Lại Mật Khẩu</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {message.text && <Alert variant={message.type}>{message.text}</Alert>}

          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <div className="d-flex">
                <Form.Control
                  type="email"
                  value={resetPasswordData.email}
                  onChange={(e) =>
                    setResetPasswordData({
                      ...resetPasswordData,
                      email: e.target.value,
                    })
                  }
                  placeholder="Nhập email đã đăng ký"
                  disabled={otpSent}
                />
                <Button
                  variant="outline-secondary"
                  className="ms-2"
                  onClick={handleRequestOTP}
                  disabled={otpSent}
                >
                  {otpSent ? "Đã gửi" : "Gửi OTP"}
                </Button>
              </div>
            </Form.Group>

            {otpSent && (
              <>
                <Form.Group className="mb-3">
                  <Form.Label>Mã OTP</Form.Label>
                  <Form.Control
                    type="text"
                    value={resetPasswordData.otp}
                    onChange={(e) =>
                      setResetPasswordData({
                        ...resetPasswordData,
                        otp: e.target.value,
                      })
                    }
                    placeholder="Nhập mã OTP 6 số"
                  />
                </Form.Group>

                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Mật khẩu mới</Form.Label>
                      <Form.Control
                        type="password"
                        value={resetPasswordData.newPassword}
                        onChange={(e) =>
                          setResetPasswordData({
                            ...resetPasswordData,
                            newPassword: e.target.value,
                          })
                        }
                        placeholder="Nhập mật khẩu mới"
                        minLength={6}
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Xác nhận mật khẩu</Form.Label>
                      <Form.Control
                        type="password"
                        value={resetPasswordData.confirmPassword}
                        onChange={(e) =>
                          setResetPasswordData({
                            ...resetPasswordData,
                            confirmPassword: e.target.value,
                          })
                        }
                        placeholder="Xác nhận mật khẩu mới"
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowResetModal(false)}>
            Hủy
          </Button>
          {otpSent && (
            <Button
              variant="primary"
              onClick={handleResetPassword}
              disabled={loading}
            >
              {loading ? "Đang xử lý..." : "Đặt Lại Mật Khẩu"}
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default SecurityTab;
