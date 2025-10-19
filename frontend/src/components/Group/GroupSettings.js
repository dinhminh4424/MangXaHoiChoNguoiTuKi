// components/Group/GroupSettings.js
import React, { useState } from "react";
import { Save, Trash2, Users, Shield, Globe, Mail } from "lucide-react";
import { Form, Button, Card, Alert, Row, Col, Modal } from "react-bootstrap";
import groupService from "../../services/groupService";
import "./GroupSettings.css";

const GroupSettings = ({ group, onGroupUpdate }) => {
  const [formData, setFormData] = useState({
    name: group.name,
    description: group.description,
    visibility: group.visibility,
    tags: group.tags?.join(", ") || "",
    emotionTags: group.emotionTags?.join(", ") || "",
    category: group.category?.[0] || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);

      const updateData = {
        ...formData,
        tags: formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
        emotionTags: formData.emotionTags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag),
        category: [formData.category].filter((cat) => cat),
      };

      const response = await groupService.updateGroup(group._id, updateData);

      if (response.success) {
        setSuccess("Cập nhật thông tin nhóm thành công");
        onGroupUpdate();

        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi cập nhật nhóm");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    try {
      setDeleteLoading(true);
      const response = await groupService.deleteGroup(group._id);
      if (response.success) {
        window.location.href = "/groups";
      }
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi xóa nhóm");
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const visibilityOptions = [
    {
      value: "public",
      label: "Công khai",
      icon: <Globe size={16} />,
      description: "Ai cũng có thể thấy nhóm và tham gia",
    },
    {
      value: "private",
      label: "Riêng tư",
      icon: <Shield size={16} />,
      description:
        "Mọi người có thể tìm thấy nhóm nhưng chỉ thành viên mới xem được nội dung",
    },
    {
      value: "invite",
      label: "Chỉ theo lời mời",
      icon: <Mail size={16} />,
      description: "Chỉ thành viên mới có thể tìm thấy và xem nội dung nhóm",
    },
  ];

  const categoryOptions = [
    "happy",
    "sad",
    "angry",
    "surprised",
    "fearful",
    "disgusted",
    "neutral",
  ];

  return (
    <div className="group-settings">
      <div className="settings-header mb-4">
        <h2>Cài đặt nhóm</h2>
        <p className="text-muted">Quản lý thông tin và cài đặt của nhóm</p>
      </div>

      {error && (
        <Alert variant="danger" dismissible onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert variant="success" dismissible onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Form onSubmit={handleSubmit}>
        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Thông tin cơ bản</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tên nhóm *</Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    placeholder="Nhập tên nhóm"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Thể loại cảm xúc</Form.Label>
                  <Form.Select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                  >
                    <option value="">Chọn thể loại</option>
                    {categoryOptions.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat.charAt(0).toUpperCase() + cat.slice(1)}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Label>Mô tả nhóm</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Mô tả về nhóm của bạn..."
              />
            </Form.Group>
          </Card.Body>
        </Card>

        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Quyền riêng tư</h5>
          </Card.Header>
          <Card.Body>
            <div>
              {visibilityOptions.map((option) => (
                <Form.Check
                  key={option.value}
                  type="radio"
                  id={`visibility-${option.value}`}
                  name="visibility"
                  value={option.value}
                  checked={formData.visibility === option.value}
                  onChange={handleInputChange}
                  label={
                    <div className="ms-2">
                      <div className="d-flex align-items-center">
                        {option.icon}
                        <span className="ms-2 fw-medium">{option.label}</span>
                      </div>
                      <small className="text-muted d-block mt-1">
                        {option.description}
                      </small>
                    </div>
                  }
                  className="mb-3"
                />
              ))}
            </div>
          </Card.Body>
        </Card>

        <Card className="mb-4">
          <Card.Header>
            <h5 className="mb-0">Tags & Phân loại</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tags (phân cách bằng dấu phẩy)</Form.Label>
                  <Form.Control
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleInputChange}
                    placeholder="ví dụ: cảm xúc, hỗ trợ, tâm lý"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Tags cảm xúc (phân cách bằng dấu phẩy)
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="emotionTags"
                    value={formData.emotionTags}
                    onChange={handleInputChange}
                    placeholder="ví dụ: happy, sad, anxious"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>

        <div className="d-flex justify-content-end">
          <Button
            type="submit"
            disabled={loading}
            variant="primary"
            className="d-flex align-items-center gap-2"
          >
            <Save size={18} />
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Đang lưu...
              </>
            ) : (
              "Lưu thay đổi"
            )}
          </Button>
        </div>
      </Form>

      {/* Danger Zone */}
      <Card className="mt-5 border-danger">
        <Card.Header className="bg-danger text-white">
          <h5 className="mb-0">Khu vực nguy hiểm</h5>
        </Card.Header>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h6 className="text-danger">Xóa nhóm</h6>
              <p className="text-muted mb-0">
                ⚠️ Hành động này không thể hoàn tác. Tất cả bài viết và dữ liệu
                nhóm sẽ bị xóa vĩnh viễn.
              </p>
            </div>
            <Button
              variant="outline-danger"
              onClick={() => setShowDeleteConfirm(true)}
              className="d-flex align-items-center gap-2"
            >
              <Trash2 size={18} />
              Xóa nhóm
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteConfirm}
        onHide={() => setShowDeleteConfirm(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title className="d-flex align-items-center">
            <Trash2 size={24} className="text-danger me-2" />
            Xóa nhóm
          </Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <p className="mb-0">
            Bạn có chắc chắn muốn xóa nhóm "{group.name}"? Tất cả bài viết và dữ
            liệu sẽ bị xóa vĩnh viễn.
          </p>
        </Modal.Body>

        <Modal.Footer>
          <Button
            variant="outline-secondary"
            onClick={() => setShowDeleteConfirm(false)}
            disabled={deleteLoading}
          >
            Hủy
          </Button>

          <Button
            variant="danger"
            onClick={handleDeleteGroup}
            disabled={deleteLoading}
          >
            {deleteLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Đang xóa...
              </>
            ) : (
              "Xóa nhóm"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default GroupSettings;
