// pages/CreateGroupPage.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  Container,
  Card,
  Form,
  Button,
  Alert,
  Row,
  Col,
} from "react-bootstrap";
import { ArrowLeft, Upload, Globe, Lock, Mail, Image } from "lucide-react";
import groupService from "../../services/groupService";
import "./CreateGroupPage.css";

const CreateGroupPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [coverPreview, setCoverPreview] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    visibility: "public",
    tags: "",
    emotionTags: "",
    category: "",
    avatar: null,
    coverPhoto: null,
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];

    if (file) {
      setFormData((prev) => ({
        ...prev,
        [name]: file,
      }));

      // Tạo preview
      const reader = new FileReader();
      reader.onload = (e) => {
        if (name === "avatar") {
          setAvatarPreview(e.target.result);
        } else if (name === "coverPhoto") {
          setCoverPreview(e.target.result);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      setError("Vui lòng nhập tên nhóm");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const submitData = new FormData();

      // Thêm các field text
      submitData.append("name", formData.name);
      submitData.append("description", formData.description);
      submitData.append("visibility", formData.visibility);
      submitData.append("tags", formData.tags);
      submitData.append("emotionTags", formData.emotionTags);
      submitData.append("category", formData.category);

      // Thêm files nếu có
      if (formData.avatar) {
        submitData.append("avatar", formData.avatar);
      }
      if (formData.coverPhoto) {
        submitData.append("coverPhoto", formData.coverPhoto);
      }

      const response = await groupService.createGroup(submitData);

      if (response.success) {
        alert("Tạo nhóm thành công!");
        navigate(`/groups/${response.group._id}`);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Lỗi khi tạo nhóm");
    } finally {
      setLoading(false);
    }
  };

  const visibilityOptions = [
    {
      value: "public",
      icon: Globe,
      label: "Công khai",
      description: "Ai cũng có thể thấy nhóm và tham gia",
    },
    {
      value: "private",
      icon: Lock,
      label: "Riêng tư",
      description:
        "Mọi người có thể tìm thấy nhóm nhưng chỉ thành viên mới xem được nội dung",
    },
    {
      value: "invite",
      icon: Mail,
      label: "Chỉ theo lời mời",
      description: "Chỉ thành viên mới có thể tìm thấy và xem nội dung nhóm",
    },
  ];

  const categoryOptions = [
    { value: "happy", label: "Vui vẻ 😊" },
    { value: "sad", label: "Buồn 😢" },
    { value: "angry", label: "Tức giận 😠" },
    { value: "surprised", label: "Ngạc nhiên 😲" },
    { value: "fearful", label: "Sợ hãi 😨" },
    { value: "disgusted", label: "Chán ghét 🤢" },
    { value: "neutral", label: "Bình thường 😐" },
  ];

  return (
    <Container className="create-group-page py-4">
      {/* Header */}
      <div className="page-header mb-4">
        <div className="d-flex align-items-center gap-3">
          <Button
            variant="outline-secondary"
            onClick={() => navigate(-1)}
            disabled={loading}
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="h2 mb-1">Tạo nhóm mới</h1>
            <p className="text-muted mb-0">Tạo nhóm để kết nối với mọi người</p>
          </div>
        </div>
      </div>

      <Row className="justify-content-center">
        <Col lg={8}>
          {error && (
            <Alert variant="danger" dismissible onClose={() => setError("")}>
              {error}
            </Alert>
          )}

          <Card>
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                {/* Ảnh cover và avatar */}
                <div className="group-images mb-4">
                  {/* Cover Photo */}
                  <div className="cover-upload mb-3">
                    <Form.Label className="d-block fw-medium mb-2">
                      Ảnh bìa nhóm
                    </Form.Label>
                    <div className="cover-preview-container">
                      {coverPreview ? (
                        <div className="cover-preview position-relative">
                          <img
                            src={coverPreview}
                            alt="Cover preview"
                            className="cover-image"
                          />
                          <Button
                            variant="danger"
                            size="sm"
                            className="position-absolute top-0 end-0 m-2"
                            onClick={() => {
                              setCoverPreview("");
                              setFormData((prev) => ({
                                ...prev,
                                coverPhoto: null,
                              }));
                            }}
                          >
                            ×
                          </Button>
                        </div>
                      ) : (
                        <Form.Label className="cover-upload-placeholder">
                          <Upload size={32} className="mb-2" />
                          <span>Tải lên ảnh bìa</span>
                          <Form.Control
                            type="file"
                            name="coverPhoto"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="d-none"
                          />
                        </Form.Label>
                      )}
                    </div>
                  </div>

                  {/* Avatar */}
                  <div className="avatar-upload">
                    <Form.Label className="d-block fw-medium mb-2">
                      Ảnh đại diện nhóm
                    </Form.Label>
                    <div className="d-flex align-items-center gap-3">
                      <div className="avatar-preview-container">
                        {avatarPreview ? (
                          <div className="avatar-preview position-relative">
                            <img
                              src={avatarPreview}
                              alt="Avatar preview"
                              className="avatar-image rounded-circle"
                            />
                            <Button
                              variant="danger"
                              size="sm"
                              className="position-absolute top-0 end-0"
                              onClick={() => {
                                setAvatarPreview("");
                                setFormData((prev) => ({
                                  ...prev,
                                  avatar: null,
                                }));
                              }}
                            >
                              ×
                            </Button>
                          </div>
                        ) : (
                          <Form.Label className="avatar-upload-placeholder rounded-circle">
                            <Image size={24} />
                            <Form.Control
                              type="file"
                              name="avatar"
                              accept="image/*"
                              onChange={handleFileChange}
                              className="d-none"
                            />
                          </Form.Label>
                        )}
                      </div>
                      <div className="flex-grow-1">
                        <p className="text-muted small mb-0">
                          Ảnh đại diện giúp nhóm của bạn dễ nhận biết hơn
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Thông tin cơ bản */}
                <Row>
                  <Col md={8}>
                    <Form.Group className="mb-3">
                      <Form.Label>Tên nhóm *</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Nhập tên nhóm..."
                        required
                        maxLength={100}
                      />
                      <Form.Text className="text-muted">
                        {formData.name.length}/100 ký tự
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group className="mb-3">
                      <Form.Label>Thể loại cảm xúc</Form.Label>
                      <Form.Select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                      >
                        <option value="">Chọn thể loại</option>
                        {categoryOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
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
                    maxLength={500}
                  />
                  <Form.Text className="text-muted">
                    {formData.description.length}/500 ký tự
                  </Form.Text>
                </Form.Group>

                {/* Quyền riêng tư */}
                <Form.Group className="mb-4">
                  <Form.Label className="fw-medium">Quyền riêng tư</Form.Label>
                  <div>
                    {visibilityOptions.map((option) => {
                      const Icon = option.icon;
                      return (
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
                                <Icon size={18} className="me-2" />
                                <span className="fw-medium">
                                  {option.label}
                                </span>
                              </div>
                              <small className="text-muted d-block mt-1">
                                {option.description}
                              </small>
                            </div>
                          }
                          className="mb-3 p-3 border rounded"
                        />
                      );
                    })}
                  </div>
                </Form.Group>

                {/* Tags */}
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Tags</Form.Label>
                      <Form.Control
                        type="text"
                        name="tags"
                        value={formData.tags}
                        onChange={handleInputChange}
                        placeholder="ví dụ: cảm xúc, hỗ trợ, tâm lý"
                      />
                      <Form.Text className="text-muted">
                        Phân cách nhiều tags bằng dấu phẩy
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Tags cảm xúc</Form.Label>
                      <Form.Control
                        type="text"
                        name="emotionTags"
                        value={formData.emotionTags}
                        onChange={handleInputChange}
                        placeholder="ví dụ: happy, sad, anxious"
                      />
                      <Form.Text className="text-muted">
                        Phân cách nhiều tags cảm xúc bằng dấu phẩy
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                {/* Submit Buttons */}
                <div className="d-flex gap-3 justify-content-end pt-3 border-top">
                  <Button
                    variant="outline-secondary"
                    onClick={() => navigate(-1)}
                    disabled={loading}
                  >
                    Hủy
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={loading || !formData.name.trim()}
                    className="d-flex align-items-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div
                          className="spinner-border spinner-border-sm"
                          role="status"
                        />
                        Đang tạo...
                      </>
                    ) : (
                      "Tạo nhóm"
                    )}
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default CreateGroupPage;
