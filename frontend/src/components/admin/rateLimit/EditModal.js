// components/rateLimit/EditModal.js
import React, { useState, useEffect } from "react";
import {
  Modal,
  Button,
  Form,
  Row,
  Col,
  Alert,
  Badge,
  InputGroup,
} from "react-bootstrap";

const ROLE_OPTIONS = ["admin", "supporter", "doctor"];

const EditModal = ({ open, config, onClose, onSave, loading }) => {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    windowMs: 0,
    max: 0,
    enabled: true,
    skipRoles: [],
    customMessage: "",
  });

  const [selectedRole, setSelectedRole] = useState("");

  useEffect(() => {
    if (config) {
      setFormData({
        name: config.name || "",
        description: config.description || "",
        windowMs: config.windowMs || 0,
        max: config.max || 0,
        enabled: config.enabled !== undefined ? config.enabled : true,
        skipRoles: config.skipRoles || [],
        customMessage: config.customMessage || "",
      });
    }
  }, [config]);

  const handleChange = (field) => (event) => {
    const value = event.target.value;
    setFormData((prev) => ({
      ...prev,
      [field]: field === "windowMs" || field === "max" ? Number(value) : value,
    }));
  };

  const handleSwitchChange = (field) => (event) => {
    setFormData((prev) => ({
      ...prev,
      [field]: event.target.checked,
    }));
  };

  const addRole = () => {
    if (selectedRole && !formData.skipRoles.includes(selectedRole)) {
      setFormData((prev) => ({
        ...prev,
        skipRoles: [...prev.skipRoles, selectedRole],
      }));
      setSelectedRole("");
    }
  };

  const removeRole = (roleToRemove) => {
    setFormData((prev) => ({
      ...prev,
      skipRoles: prev.skipRoles.filter((role) => role !== roleToRemove),
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(config.key, formData);
  };

  const timeOptions = [
    { value: 30000, label: "30 giây" },
    { value: 60000, label: "1 phút" },
    { value: 300000, label: "5 phút" },
    { value: 600000, label: "10 phút" },
    { value: 900000, label: "15 phút" },
    { value: 1800000, label: "30 phút" },
    { value: 3600000, label: "1 giờ" },
  ];

  return (
    <Modal show={open} onHide={onClose} size="lg" centered>
      <Modal.Header closeButton>
        <Modal.Title>Chỉnh sửa: {config?.name}</Modal.Title>
      </Modal.Header>

      <Form onSubmit={handleSubmit}>
        <Modal.Body>
          <Alert variant="info">
            Cấu hình giới hạn request cho: <strong>{config?.key}</strong>
          </Alert>

          <Row className="g-3">
            <Col md={6}>
              <Form.Group>
                <Form.Label>Tên hiển thị *</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.name}
                  onChange={handleChange("name")}
                  required
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label>Mô tả</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.description}
                  onChange={handleChange("description")}
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label>Thời gian cửa sổ *</Form.Label>
                <Form.Select
                  value={formData.windowMs}
                  onChange={handleChange("windowMs")}
                  required
                >
                  {timeOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group>
                <Form.Label>Số lần tối đa *</Form.Label>
                <Form.Control
                  type="number"
                  value={formData.max}
                  onChange={handleChange("max")}
                  min="1"
                  max="1000"
                  required
                />
              </Form.Group>
            </Col>

            <Col xs={12}>
              <Form.Group>
                <Form.Label>Tin nhắn tùy chỉnh (khi vượt giới hạn)</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  value={formData.customMessage}
                  onChange={handleChange("customMessage")}
                  placeholder="Để trống để sử dụng tin nhắn mặc định"
                />
              </Form.Group>
            </Col>

            <Col xs={12}>
              <Form.Group>
                <Form.Label>Roles được bỏ qua</Form.Label>
                <div className="mb-2">
                  <InputGroup className="mb-2" style={{ maxWidth: "300px" }}>
                    <Form.Select
                      value={selectedRole}
                      onChange={(e) => setSelectedRole(e.target.value)}
                    >
                      <option value="">Chọn role</option>
                      {ROLE_OPTIONS.map((role) => (
                        <option key={role} value={role}>
                          {role}
                        </option>
                      ))}
                    </Form.Select>
                    <Button
                      variant="outline-primary"
                      onClick={addRole}
                      disabled={!selectedRole}
                    >
                      Thêm
                    </Button>
                  </InputGroup>

                  <div className="d-flex gap-1 flex-wrap">
                    {formData.skipRoles.map((role) => (
                      <Badge
                        key={role}
                        bg="primary"
                        className="d-flex align-items-center"
                        style={{ fontSize: "0.875rem" }}
                      >
                        {role}
                        <button
                          type="button"
                          className="btn-close btn-close-white ms-1"
                          style={{ fontSize: "0.5rem" }}
                          onClick={() => removeRole(role)}
                          aria-label="Remove"
                        ></button>
                      </Badge>
                    ))}
                  </div>
                </div>
              </Form.Group>
            </Col>

            <Col xs={12}>
              <Form.Group>
                <Form.Check
                  type="switch"
                  id="enabled-switch"
                  label="Kích hoạt giới hạn"
                  checked={formData.enabled}
                  onChange={handleSwitchChange("enabled")}
                />
              </Form.Group>
            </Col>
          </Row>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? (
              <>
                <span
                  className="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Đang lưu...
              </>
            ) : (
              "Lưu thay đổi"
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default EditModal;
