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
import {
  ArrowLeft,
  Upload,
  Globe,
  Lock,
  Mail,
  Image as ImageIcon,
} from "lucide-react";
import groupService from "../../services/groupService";
import "./CreateGroupPage.css";

const CreateGroupPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [avatarPreview, setAvatarPreview] = useState("");
  const [coverPreview, setCoverPreview] = useState("");

  // State cho tags động
  const [tagInput, setTagInput] = useState("");
  const [emotionTagInput, setEmotionTagInput] = useState("");

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    visibility: "public",
    tags: [], // Mảng string
    emotionTags: [], // Mảng string
    category: "",
    avatar: null,
    coverPhoto: null,
  });

  // Xử lý input thường
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Xử lý upload ảnh
  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];
    if (!file) return;

    setFormData((prev) => ({ ...prev, [name]: file }));

    const reader = new FileReader();
    reader.onload = (e) => {
      if (name === "avatar") setAvatarPreview(e.target.result);
      else if (name === "coverPhoto") setCoverPreview(e.target.result);
    };
    reader.readAsDataURL(file);
  };

  // === XỬ LÝ TAGS ===
  const handleTagKeyDown = (e, type) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      const value = type === "tags" ? tagInput.trim() : emotionTagInput.trim();
      if (value) addTag(value, type);
    }
  };

  const handlePaste = (e, type) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text");
    const tags = pasted
      .split(/[\s,]+/)
      .map((t) => t.trim())
      .filter((t) => t);
    tags.forEach((tag) => addTag(tag, type));
  };

  const addTag = (tag, type) => {
    const key = type === "tags" ? "tags" : "emotionTags";
    const inputSetter = type === "tags" ? setTagInput : setEmotionTagInput;

    if (!formData[key].includes(tag)) {
      setFormData((prev) => ({
        ...prev,
        [key]: [...prev[key], tag],
      }));
    }
    inputSetter("");
  };

  const removeTag = (tagToRemove, type) => {
    const key = type === "tags" ? "tags" : "emotionTags";
    setFormData((prev) => ({
      ...prev,
      [key]: prev[key].filter((t) => t !== tagToRemove),
    }));
  };

  // === EMOJI & MÀU ===
  const getEmotionEmoji = (tag) => {
    const lower = tag.toLowerCase();
    if (lower.includes("vui") || lower.includes("hạnh")) return "positive";
    if (lower.includes("buồn") || lower.includes("cô")) return "negative";
    if (lower.includes("giận") || lower.includes("tức")) return "angry";
    if (lower.includes("lo") || lower.includes("sợ") || lower.includes("âu"))
      return "anxious";
    if (lower.includes("yêu") || lower.includes("thương")) return "love";
    if (lower.includes("bất ngờ") || lower.includes("ngạc nhiên"))
      return "surprised";
    return "neutral";
  };

  const getEmotionClass = (tag) => `emotion-${getEmotionEmoji(tag)}`;

  // === SUBMIT ===
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError("Vui lòng nhập tên nhóm");
      return;
    }

    if (!formData.category.trim()) {
      setError("Vui lòng chọn cảm xúc");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const submitData = new FormData();

      // Thêm các field
      submitData.append("name", formData.name);
      submitData.append("description", formData.description);
      submitData.append("visibility", formData.visibility);
      submitData.append("category", formData.category);

      // Tags → join thành chuỗi
      formData.tags.forEach((tag) => submitData.append("tags", tag));
      formData.emotionTags.forEach((tag) =>
        submitData.append("emotionTags", tag)
      );

      if (formData.avatar) submitData.append("avatar", formData.avatar);
      if (formData.coverPhoto)
        submitData.append("coverPhoto", formData.coverPhoto);

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
      description: "Chỉ thành viên mới xem được nội dung",
    },
    {
      value: "invite",
      icon: Mail,
      label: "Chỉ theo lời mời",
      description: "Chỉ thành viên được mời mới tham gia",
    },
  ];

  const categoryOptions = [
    { value: "happy", label: "Vui vẻ" },
    { value: "sad", label: "Buồn" },
    { value: "angry", label: "Tức giận" },
    { value: "surprised", label: "Ngạc nhiên" },
    { value: "fearful", label: "Sợ hãi" },
    { value: "disgusted", label: "Chán ghét" },
    { value: "neutral", label: "Bình thường" },
  ];

  return (
    <Container className="create-group-page">
      <div className="page-header">
        <div className="d-flex align-items-center gap-3">
          <Button
            variant="outline-secondary"
            onClick={() => navigate(-1)}
            disabled={loading}
            size="sm"
          >
            <ArrowLeft size={20} />
          </Button>
          <div>
            <h1 className="h2 mb-1">Tạo nhóm mới</h1>
            <p className="text-muted mb-0">
              Kết nối cộng đồng theo cách của bạn
            </p>
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
                {/* Cover & Avatar */}
                <div className="group-images mb-5">
                  <div className="cover-upload">
                    <Form.Label className="d-block fw-medium mb-2">
                      Ảnh bìa nhóm
                    </Form.Label>
                    <div className="cover-preview-container">
                      {coverPreview ? (
                        <div className="cover-preview position-relative">
                          <img
                            src={coverPreview}
                            alt="Cover"
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
                          <Upload size={36} />
                          <div>Tải lên ảnh bìa (tối đa 5MB)</div>
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

                  <div className="avatar-upload">
                    <Form.Label className="d-block fw-medium mb-2">
                      Ảnh đại diện
                    </Form.Label>
                    <div className="d-flex align-items-center gap-3">
                      <div className="avatar-preview-container">
                        {avatarPreview ? (
                          <div className="position-relative">
                            <img
                              src={avatarPreview}
                              alt="Avatar"
                              className="avatar-image"
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
                          <Form.Label className="avatar-upload-placeholder">
                            <ImageIcon size={28} />
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
                      <div>
                        <p className="text-muted small mb-0">
                          Định dạng: JPG, PNG. Kích thước tối ưu: 400x400px
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Form Fields */}
                <Row className="g-3">
                  <Col md={8}>
                    <Form.Group>
                      <Form.Label>Tên nhóm *</Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Tên nhóm dễ nhớ, độc đáo..."
                        required
                        maxLength={100}
                      />
                      <Form.Text>{formData.name.length}/100</Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={4}>
                    <Form.Group>
                      <Form.Label>Cảm xúc chính</Form.Label>
                      <Form.Select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                      >
                        <option value="">Chọn cảm xúc</option>
                        {categoryOptions.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mt-3">
                  <Form.Label>Mô tả nhóm</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Mục đích nhóm, hoạt động chính, đối tượng tham gia..."
                    maxLength={500}
                  />
                  <Form.Text>{formData.description.length}/500</Form.Text>
                </Form.Group>

                <Form.Group className="mt-4">
                  <Form.Label className="fw-medium">Quyền riêng tư</Form.Label>
                  {visibilityOptions.map((opt) => {
                    const Icon = opt.icon;
                    return (
                      <Form.Check
                        key={opt.value}
                        type="radio"
                        id={`vis-${opt.value}`}
                        name="visibility"
                        value={opt.value}
                        checked={formData.visibility === opt.value}
                        onChange={handleInputChange}
                        label={
                          <div className="ms-2">
                            <div className="d-flex align-items-center gap-2">
                              <Icon size={18} />
                              <span className="fw-medium">{opt.label}</span>
                            </div>
                            <small className="text-muted">
                              {opt.description}
                            </small>
                          </div>
                        }
                      />
                    );
                  })}
                </Form.Group>

                {/* === TAGS VỚI BADGE === */}
                <Row className="g-3 mt-3">
                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Tags</Form.Label>
                      <div className="tag-input-container">
                        <div className="tag-input-wrapper">
                          <input
                            type="text"
                            className="tag-input"
                            placeholder={
                              formData.tags.length === 0
                                ? "Nhập tag + Enter"
                                : ""
                            }
                            value={tagInput}
                            onChange={(e) => setTagInput(e.target.value)}
                            onKeyDown={(e) => handleTagKeyDown(e, "tags")}
                            onPaste={(e) => handlePaste(e, "tags")}
                          />
                          <span className="tag-placeholder">#</span>
                        </div>
                        <div className="tag-list">
                          {formData.tags.map((tag, i) => (
                            <span key={i} className="tag-badge hash">
                              #{tag}
                              <button
                                type="button"
                                onClick={() => removeTag(tag, "tags")}
                                className="tag-remove"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                      <Form.Text>
                        Nhấn Enter hoặc Paste để thêm nhiều tag
                      </Form.Text>
                    </Form.Group>
                  </Col>

                  <Col md={6}>
                    <Form.Group>
                      <Form.Label>Tags cảm xúc</Form.Label>
                      <div className="tag-input-container">
                        <div className="tag-input-wrapper">
                          <input
                            type="text"
                            className="tag-input"
                            placeholder={
                              formData.emotionTags.length === 0
                                ? "Nhập cảm xúc + Enter"
                                : ""
                            }
                            value={emotionTagInput}
                            onChange={(e) => setEmotionTagInput(e.target.value)}
                            onKeyDown={(e) =>
                              handleTagKeyDown(e, "emotionTags")
                            }
                            onPaste={(e) => handlePaste(e, "emotionTags")}
                          />
                        </div>
                        <div className="tag-list">
                          {formData.emotionTags.map((tag, i) => (
                            <span
                              key={i}
                              className={`tag-badge emotion ${getEmotionClass(
                                tag
                              )}`}
                            >
                              {getEmotionEmoji(tag)} {tag}
                              <button
                                type="button"
                                onClick={() => removeTag(tag, "emotionTags")}
                                className="tag-remove"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                      <Form.Text>
                        Gợi ý: vui, buồn, lo âu, hạnh phúc...
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>

                <div className="d-flex gap-3 justify-content-end pt-4 border-top mt-4">
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
