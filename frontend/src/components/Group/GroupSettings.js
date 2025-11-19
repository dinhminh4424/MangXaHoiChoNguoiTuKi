// components/Group/GroupSettings.js
import React, { useState, useRef, useEffect } from "react";
import {
  Save,
  Trash2,
  Shield,
  Globe,
  Mail,
  Camera,
  X,
  Users,
  Settings,
  AlertTriangle,
  Image as ImageIcon,
} from "lucide-react";
import {
  Form,
  Button,
  Card,
  Alert,
  Row,
  Col,
  Modal,
  Image,
  Badge,
  Tabs,
  Tab,
} from "react-bootstrap";
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
  const [activeTab, setActiveTab] = useState("general");

  // State cho hình ảnh
  const [avatarFile, setAvatarFile] = useState(null);
  const [coverPhotoFile, setCoverPhotoFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(group.avatar || "");
  const [coverPhotoPreview, setCoverPhotoPreview] = useState(
    group.coverPhoto || ""
  );

  const avatarInputRef = useRef(null);
  const coverPhotoInputRef = useRef(null);

  // Cleanup URLs khi component unmount
  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
      if (coverPhotoPreview && coverPhotoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(coverPhotoPreview);
      }
    };
  }, [avatarPreview, coverPhotoPreview]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Xử lý chọn avatar
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Kích thước ảnh không được vượt quá 5MB");
        return;
      }

      if (!file.type.startsWith("image/")) {
        setError("Vui lòng chọn file ảnh hợp lệ");
        return;
      }

      setAvatarFile(file);
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);
      setError(null);
    }
  };

  // Xử lý chọn cover photo
  const handleCoverPhotoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        setError("Kích thước ảnh bìa không được vượt quá 10MB");
        return;
      }

      if (!file.type.startsWith("image/")) {
        setError("Vui lòng chọn file ảnh hợp lệ");
        return;
      }

      setCoverPhotoFile(file);
      const previewUrl = URL.createObjectURL(file);
      setCoverPhotoPreview(previewUrl);
      setError(null);
    }
  };

  // Xóa avatar
  const handleRemoveAvatar = () => {
    setAvatarFile(null);
    setAvatarPreview(group.avatar || "");
    if (avatarInputRef.current) {
      avatarInputRef.current.value = "";
    }
  };

  // Xóa cover photo
  const handleRemoveCoverPhoto = () => {
    setCoverPhotoFile(null);
    setCoverPhotoPreview(group.coverPhoto || "");
    if (coverPhotoInputRef.current) {
      coverPhotoInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setLoading(true);
      setError(null);
      setSuccess(null);

      // Tạo FormData để gửi cả file và text data
      const submitData = new FormData();

      // Thêm dữ liệu text
      submitData.append("name", formData.name);
      submitData.append("description", formData.description);
      submitData.append("visibility", formData.visibility);

      if (formData.category) {
        submitData.append("category", formData.category);
      }

      // Xử lý tags
      if (formData.tags) {
        const tagsArray = formData.tags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag);
        tagsArray.forEach((tag) => {
          submitData.append("tags", tag);
        });
      }

      // Xử lý emotion tags
      if (formData.emotionTags) {
        const emotionTagsArray = formData.emotionTags
          .split(",")
          .map((tag) => tag.trim())
          .filter((tag) => tag);
        emotionTagsArray.forEach((tag) => {
          submitData.append("emotionTags", tag);
        });
      }

      // Thêm file nếu có
      if (avatarFile) {
        submitData.append("avatar", avatarFile);
      }
      if (coverPhotoFile) {
        submitData.append("coverPhoto", coverPhotoFile);
      }

      const response = await groupService.updateGroup(group._id, submitData);

      if (response.success) {
        setSuccess("Cập nhật thông tin nhóm thành công");

        // Dọn dẹp preview URLs
        if (avatarFile && avatarPreview.startsWith("blob:")) {
          URL.revokeObjectURL(avatarPreview);
        }
        if (coverPhotoFile && coverPhotoPreview.startsWith("blob:")) {
          URL.revokeObjectURL(coverPhotoPreview);
        }

        // Reset file states
        setAvatarFile(null);
        setCoverPhotoFile(null);

        // Cập nhật preview với URL mới từ server
        if (response.group.avatar) {
          setAvatarPreview(response.group.avatar);
        }
        if (response.group.coverPhoto) {
          setCoverPhotoPreview(response.group.coverPhoto);
        }

        onGroupUpdate();

        setTimeout(() => setSuccess(null), 5000);
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
      icon: <Globe size={18} />,
      description: "Ai cũng có thể thấy nhóm và tham gia",
      badge: "success",
    },
    {
      value: "private",
      label: "Riêng tư",
      icon: <Shield size={18} />,
      description:
        "Mọi người có thể tìm thấy nhóm nhưng chỉ thành viên mới xem được nội dung",
      badge: "warning",
    },
    {
      value: "invite",
      label: "Chỉ theo lời mời",
      icon: <Mail size={18} />,
      description: "Chỉ thành viên mới có thể tìm thấy và xem nội dung nhóm",
      badge: "secondary",
    },
  ];

  const categoryOptions = [
    { value: "happy", label: "Vui vẻ", emoji: "😊" },
    { value: "sad", label: "Buồn bã", emoji: "😢" },
    { value: "angry", label: "Tức giận", emoji: "😠" },
    { value: "surprised", label: "Ngạc nhiên", emoji: "😲" },
    { value: "fearful", label: "Sợ hãi", emoji: "😨" },
    { value: "disgusted", label: "Ghê tởm", emoji: "🤢" },
    { value: "neutral", label: "Trung lập", emoji: "😐" },
  ];

  return (
    <div className="group-settings">
      <div className="group-settings-header mb-4">
        <div className="d-flex align-items-center gap-3">
          <div className="group-settings-header-icon">
            <Settings size={32} />
          </div>
          <div>
            <h2 className="mb-1">Cài đặt nhóm</h2>
            <p className="text-muted mb-0">
              Quản lý thông tin và cài đặt của "{group.name}"
            </p>
          </div>
        </div>
      </div>

      {error && (
        <Alert
          variant="danger"
          dismissible
          onClose={() => setError(null)}
          className="border-0 group-settings-alert"
        >
          <div className="d-flex align-items-center">
            <AlertTriangle size={20} className="me-2" />
            {error}
          </div>
        </Alert>
      )}

      {success && (
        <Alert
          variant="success"
          dismissible
          onClose={() => setSuccess(null)}
          className="border-0 group-settings-alert"
        >
          {success}
        </Alert>
      )}

      <Tabs
        activeKey={activeTab}
        onSelect={(tab) => setActiveTab(tab)}
        className="group-settings-tabs mb-4"
        fill
      >
        <Tab
          eventKey="general"
          title={
            <div className="d-flex align-items-center gap-2">
              <Settings size={16} />
              <span>Thông tin chung</span>
            </div>
          }
        >
          <Form onSubmit={handleSubmit}>
            <Card className="border-0 group-settings-card">
              <Card.Header className="group-settings-card-header">
                <h5 className="mb-0 d-flex align-items-center gap-2">
                  <ImageIcon size={20} />
                  Hình ảnh nhóm
                </h5>
              </Card.Header>
              <Card.Body className="group-settings-card-body">
                <Row>
                  <Col lg={6}>
                    <div className="group-settings-image-section">
                      <Form.Label className="fw-semibold mb-3">
                        Ảnh đại diện
                      </Form.Label>
                      <div className="group-settings-avatar-upload">
                        <div className="group-settings-avatar-preview mb-3">
                          {avatarPreview ? (
                            <div className="position-relative d-inline-block">
                              <Image
                                src={avatarPreview}
                                alt="Avatar preview"
                                roundedCircle
                                width={140}
                                height={140}
                                className="group-settings-image-preview"
                              />
                              <Button
                                variant="danger"
                                size="sm"
                                className="group-settings-image-remove-btn"
                                onClick={handleRemoveAvatar}
                              >
                                <X size={16} />
                              </Button>
                            </div>
                          ) : (
                            <div className="group-settings-avatar-placeholder">
                              <Camera size={40} />
                            </div>
                          )}
                        </div>

                        <div className="d-flex gap-2 mb-2">
                          <Button
                            variant="outline-primary"
                            onClick={() => avatarInputRef.current?.click()}
                            className="d-flex align-items-center gap-2"
                          >
                            <Camera size={16} />
                            {avatarPreview ? "Thay đổi" : "Chọn ảnh"}
                          </Button>

                          {avatarPreview && avatarPreview !== group.avatar && (
                            <Button
                              variant="outline-secondary"
                              onClick={handleRemoveAvatar}
                            >
                              Xóa
                            </Button>
                          )}
                        </div>

                        <Form.Control
                          type="file"
                          ref={avatarInputRef}
                          onChange={handleAvatarChange}
                          accept="image/*"
                          className="group-settings-file-input"
                        />

                        <div className="group-settings-help-text">
                          <div>• Ảnh vuông, tối đa 5MB</div>
                          <div>• Định dạng: JPG, PNG, GIF</div>
                        </div>
                      </div>
                    </div>
                  </Col>

                  <Col lg={6}>
                    <div className="group-settings-image-section">
                      <Form.Label className="fw-semibold mb-3">
                        Ảnh bìa
                      </Form.Label>
                      <div className="group-settings-cover-upload">
                        <div className="group-settings-cover-preview mb-3">
                          {coverPhotoPreview ? (
                            <div className="position-relative">
                              <Image
                                src={coverPhotoPreview}
                                alt="Cover preview"
                                className="group-settings-cover-image"
                              />
                              <Button
                                variant="danger"
                                size="sm"
                                className="group-settings-image-remove-btn"
                                onClick={handleRemoveCoverPhoto}
                              >
                                <X size={16} />
                              </Button>
                            </div>
                          ) : (
                            <div className="group-settings-cover-placeholder">
                              <Camera size={40} />
                            </div>
                          )}
                        </div>

                        <div className="d-flex gap-2 mb-2">
                          <Button
                            variant="outline-primary"
                            onClick={() => coverPhotoInputRef.current?.click()}
                            className="d-flex align-items-center gap-2"
                          >
                            <Camera size={16} />
                            {coverPhotoPreview ? "Thay đổi" : "Chọn ảnh bìa"}
                          </Button>

                          {coverPhotoPreview &&
                            coverPhotoPreview !== group.coverPhoto && (
                              <Button
                                variant="outline-secondary"
                                onClick={handleRemoveCoverPhoto}
                              >
                                Xóa
                              </Button>
                            )}
                        </div>

                        <Form.Control
                          type="file"
                          ref={coverPhotoInputRef}
                          onChange={handleCoverPhotoChange}
                          accept="image/*"
                          className="group-settings-file-input"
                        />

                        <div className="group-settings-help-text">
                          <div>• Tỷ lệ khuyến nghị: 3:1, tối đa 10MB</div>
                          <div>• Định dạng: JPG, PNG</div>
                        </div>
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <Card className="border-0 group-settings-card mt-4">
              <Card.Header className="group-settings-card-header">
                <h5 className="mb-0 d-flex align-items-center gap-2">
                  <Users size={20} />
                  Thông tin cơ bản
                </h5>
              </Card.Header>
              <Card.Body className="group-settings-card-body">
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">
                        Tên nhóm <span className="text-danger">*</span>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        placeholder="Nhập tên nhóm..."
                        className="group-settings-form-control"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">
                        Thể loại cảm xúc
                      </Form.Label>
                      <Form.Select
                        name="category"
                        value={formData.category}
                        onChange={handleInputChange}
                        className="group-settings-form-control"
                      >
                        <option value="">Chọn thể loại cảm xúc...</option>
                        {categoryOptions.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.emoji} {cat.label}
                          </option>
                        ))}
                      </Form.Select>
                    </Form.Group>
                  </Col>
                </Row>

                <Form.Group className="mb-4">
                  <Form.Label className="fw-semibold">Mô tả nhóm</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={4}
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Mô tả về mục đích và nội dung của nhóm..."
                    className="group-settings-form-control"
                  />
                  <Form.Text className="group-settings-help-text">
                    Mô tả rõ ràng sẽ giúp thành viên hiểu hơn về nhóm của bạn
                  </Form.Text>
                </Form.Group>
              </Card.Body>
            </Card>

            <Card className="border-0 group-settings-card mt-4">
              <Card.Header className="group-settings-card-header">
                <h5 className="mb-0 d-flex align-items-center gap-2">
                  <Shield size={20} />
                  Quyền riêng tư & Bảo mật
                </h5>
              </Card.Header>
              <Card.Body className="group-settings-card-body">
                <div className="group-settings-privacy-options">
                  {visibilityOptions.map((option) => (
                    <div
                      key={option.value}
                      className={`group-settings-privacy-option ${
                        formData.visibility === option.value
                          ? "group-settings-privacy-option-active"
                          : ""
                      }`}
                      onClick={() =>
                        setFormData((prev) => ({
                          ...prev,
                          visibility: option.value,
                        }))
                      }
                    >
                      <div className="d-flex align-items-start gap-3">
                        <div
                          className={`group-settings-privacy-icon group-settings-privacy-icon-${option.badge}`}
                        >
                          {option.icon}
                        </div>
                        <div className="flex-grow-1">
                          <div className="d-flex align-items-center gap-2 mb-1">
                            <h6 className="mb-0 fw-semibold">{option.label}</h6>
                            <Badge
                              bg={option.badge}
                              className="group-settings-privacy-badge"
                            >
                              {option.value === "public"
                                ? "Mở"
                                : option.value === "private"
                                ? "Hạn chế"
                                : "Đóng"}
                            </Badge>
                          </div>
                          <p className="text-muted mb-0 group-settings-privacy-description">
                            {option.description}
                          </p>
                        </div>
                        <Form.Check
                          type="radio"
                          name="visibility"
                          value={option.value}
                          checked={formData.visibility === option.value}
                          onChange={handleInputChange}
                          className="group-settings-privacy-radio"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Body>
            </Card>

            <Card className="border-0 group-settings-card mt-4">
              <Card.Header className="group-settings-card-header">
                <h5 className="mb-0">Tags & Phân loại</h5>
              </Card.Header>
              <Card.Body className="group-settings-card-body">
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">
                        Tags
                        <Badge
                          bg="light"
                          text="dark"
                          className="ms-2 group-settings-optional-badge"
                        >
                          Tùy chọn
                        </Badge>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="tags"
                        value={formData.tags}
                        onChange={handleInputChange}
                        placeholder="ví dụ: cảm xúc, hỗ trợ, tâm lý, chia sẻ..."
                        className="group-settings-form-control"
                      />
                      <Form.Text className="group-settings-help-text">
                        Phân cách bằng dấu phẩy. Giúp thành viên dễ dàng tìm
                        thấy nhóm
                      </Form.Text>
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label className="fw-semibold">
                        Tags cảm xúc
                        <Badge
                          bg="light"
                          text="dark"
                          className="ms-2 group-settings-optional-badge"
                        >
                          Tùy chọn
                        </Badge>
                      </Form.Label>
                      <Form.Control
                        type="text"
                        name="emotionTags"
                        value={formData.emotionTags}
                        onChange={handleInputChange}
                        placeholder="ví dụ: happy, sad, anxious, stressed..."
                        className="group-settings-form-control"
                      />
                      <Form.Text className="group-settings-help-text">
                        Phân cách bằng dấu phẩy. Mô tả các cảm xúc chính trong
                        nhóm
                      </Form.Text>
                    </Form.Group>
                  </Col>
                </Row>
              </Card.Body>
            </Card>

            <div className="d-flex justify-content-end mt-4">
              <Button
                type="submit"
                disabled={loading}
                variant="primary"
                size="lg"
                className="group-settings-submit-btn"
              >
                <Save size={20} />
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
        </Tab>

        <Tab
          eventKey="danger"
          title={
            <div className="d-flex align-items-center gap-2 text-danger">
              <AlertTriangle size={16} />
              <span>Khu vực nguy hiểm</span>
            </div>
          }
        >
          <Card className="group-settings-danger-card">
            <Card.Header className="group-settings-danger-header">
              <h5 className="mb-0 d-flex align-items-center gap-2">
                <AlertTriangle size={20} />
                Khu vực nguy hiểm
              </h5>
            </Card.Header>
            <Card.Body className="group-settings-danger-body">
              <div className="group-settings-danger-content">
                <div className="d-flex align-items-start gap-3 mb-4">
                  <div className="group-settings-danger-icon">
                    <Trash2 size={24} />
                  </div>
                  <div>
                    <h6 className="text-danger mb-2">Xóa nhóm vĩnh viễn</h6>
                    <p className="text-muted mb-3">
                      Một khi bạn xóa nhóm, hành động này không thể hoàn tác.
                      Tất cả bài viết, bình luận, thành viên và dữ liệu liên
                      quan đến nhóm sẽ bị xóa vĩnh viễn. Hãy chắc chắn về quyết
                      định của bạn.
                    </p>
                    <ul className="group-settings-danger-list">
                      <li>Tất cả bài viết trong nhóm sẽ bị xóa</li>
                      <li>Tất cả thành viên sẽ bị xóa khỏi nhóm</li>
                      <li>Không thể khôi phục dữ liệu sau khi xóa</li>
                      <li>Thao tác này ảnh hưởng đến tất cả thành viên</li>
                    </ul>
                    <Button
                      variant="outline-danger"
                      onClick={() => setShowDeleteConfirm(true)}
                      className="group-settings-delete-btn"
                    >
                      <Trash2 size={18} />
                      Xóa nhóm
                    </Button>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Tab>
      </Tabs>

      {/* Delete Confirmation Modal */}
      <Modal
        show={showDeleteConfirm}
        onHide={() => setShowDeleteConfirm(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton className="group-settings-modal-header">
          <Modal.Title className="d-flex align-items-center gap-2 text-danger">
            <AlertTriangle size={24} />
            Xác nhận xóa nhóm
          </Modal.Title>
        </Modal.Header>

        <Modal.Body className="group-settings-modal-body">
          <div className="text-center mb-4">
            <div className="group-settings-danger-icon-large mb-3">
              <Trash2 size={48} />
            </div>
            <h5 className="text-danger mb-3">
              Bạn có chắc chắn muốn xóa nhóm?
            </h5>
            <p className="text-muted">
              Bạn sắp xóa nhóm <strong>"{group.name}"</strong>. Hành động này
              sẽ:
            </p>
            <ul className="group-settings-modal-list">
              <li>Xóa vĩnh viễn tất cả bài viết trong nhóm</li>
              <li>Xóa tất cả thành viên khỏi nhóm</li>
              <li>Không thể khôi phục dữ liệu sau khi xóa</li>
              <li>Ảnh hưởng đến {group.memberCount || 0} thành viên</li>
            </ul>
            <p className="text-danger fw-semibold mt-3">
              ⚠️ Hành động này không thể hoàn tác!
            </p>
          </div>
        </Modal.Body>

        <Modal.Footer className="group-settings-modal-footer">
          <Button
            variant="outline-secondary"
            onClick={() => setShowDeleteConfirm(false)}
            disabled={deleteLoading}
            className="group-settings-modal-cancel"
          >
            Hủy bỏ
          </Button>

          <Button
            variant="danger"
            onClick={handleDeleteGroup}
            disabled={deleteLoading}
            className="group-settings-modal-confirm"
          >
            {deleteLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Đang xóa...
              </>
            ) : (
              <>
                <Trash2 size={18} />
                Xóa nhóm vĩnh viễn
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default GroupSettings;
