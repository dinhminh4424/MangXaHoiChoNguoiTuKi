import React, { useState, useRef, useEffect } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Modal,
  ProgressBar,
} from "react-bootstrap";
import {
  Envelope,
  ClipboardCheck,
  ChatText,
  Paperclip,
  Image,
  FileText,
  Trash,
  Send,
  Clock,
  CheckCircle,
  InfoCircle,
  Person,
  Telephone,
  ShieldCheck,
  Eye,
  EyeSlash,
} from "react-bootstrap-icons";
import api from "../../services/api";
import notificationService from "../../services/notificationService";
import "./AppealForm.css";

const AppealForm = () => {
  const [formData, setFormData] = useState({
    email: "",
    phone: "",
    name: "",
    reason: "Bị khoá tài khoản",
    message: "",
    agreeTerms: false,
  });
  const [files, setFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showPreview, setShowPreview] = useState(false);
  const [characterCount, setCharacterCount] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [tempPassword, setTempPassword] = useState("");

  const fileInputRef = useRef(null);
  const maxMessageLength = 2000;

  // Character count for message
  useEffect(() => {
    setCharacterCount(formData.message.length);
  }, [formData.message]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    // Validate file sizes (max 10MB each)
    const oversizedFiles = selectedFiles.filter(
      (file) => file.size > 10 * 1024 * 1024
    );
    if (oversizedFiles.length > 0) {
      notificationService.error({
        title: "File quá lớn",
        text: "Mỗi file không được vượt quá 10MB",
      });
      return;
    }

    // Validate total files count (max 5 files)
    if (files.length + selectedFiles.length > 5) {
      notificationService.warning({
        title: "Quá nhiều file",
        text: "Chỉ có thể đính kèm tối đa 5 file",
      });
      return;
    }

    // Validate file types
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
      "video/mp4",
      "video/avi",
      "audio/mpeg",
      "audio/wav",
    ];

    const invalidFiles = selectedFiles.filter(
      (file) => !allowedTypes.includes(file.type)
    );

    if (invalidFiles.length > 0) {
      notificationService.error({
        title: "File không hợp lệ",
        text: "Chỉ chấp nhận file ảnh, video, audio, PDF, Word và text",
      });
      return;
    }

    setFiles((prev) => [...prev, ...selectedFiles]);
  };

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
  };

  const validateForm = () => {
    if (!formData.email || !formData.message) {
      notificationService.warning({
        title: "Thiếu thông tin",
        text: "Vui lòng điền đầy đủ thông tin bắt buộc (email và mô tả)",
      });
      return false;
    }

    if (!formData.agreeTerms) {
      notificationService.warning({
        title: "Cần chấp nhận điều khoản",
        text: "Vui lòng đồng ý với điều khoản và điều kiện trước khi gửi",
      });
      return false;
    }

    if (formData.message.length < 10) {
      notificationService.warning({
        title: "Mô tả quá ngắn",
        text: "Vui lòng mô tả chi tiết vấn đề (ít nhất 10 ký tự)",
      });
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      notificationService.warning({
        title: "Email không hợp lệ",
        text: "Vui lòng nhập địa chỉ email hợp lệ",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);

    try {
      const submitData = new FormData();
      submitData.append("email", formData.email);
      submitData.append("reason", formData.reason);
      submitData.append("message", formData.message);

      // Thêm các trường mới
      if (formData.phone) submitData.append("phone", formData.phone);
      if (formData.name) submitData.append("name", formData.name);

      files.forEach((file) => {
        submitData.append("files", file);
      });

      const response = await api.post("/api/appeals/submit", submitData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          setUploadProgress(percentCompleted);
        },
      });

      notificationService.success({
        title: "Thành công!",
        text: response.data.message,
      });

      // Reset form
      setFormData({
        email: "",
        phone: "",
        name: "",
        reason: "Bị khoá tài khoản",
        message: "",
        agreeTerms: false,
      });
      setFiles([]);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      notificationService.error({
        title: "Lỗi",
        text:
          error.response?.data?.message || "Có lỗi xảy ra khi gửi kháng nghị",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getFileIcon = (file) => {
    if (file.type.startsWith("image/"))
      return <Image size={20} className="text-primary" />;
    if (file.type.startsWith("video/"))
      return <FileText size={20} className="text-danger" />;
    if (file.type.startsWith("audio/"))
      return <FileText size={20} className="text-warning" />;
    if (file.type === "application/pdf")
      return <FileText size={20} className="text-danger" />;
    return <FileText size={20} className="text-secondary" />;
  };

  const getFilePreview = (file) => {
    if (file.type.startsWith("image/")) {
      return (
        <div className="appeal-form-file-preview-image">
          <img src={URL.createObjectURL(file)} alt={file.name} />
        </div>
      );
    }
    return null;
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const PreviewModal = () => (
    <Modal show={showPreview} onHide={() => setShowPreview(false)} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>Xem trước kháng nghị</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Card>
          <Card.Body>
            <Row className="mb-3">
              <Col sm={4}>
                <strong>Email:</strong>
              </Col>
              <Col sm={8}>{formData.email}</Col>
            </Row>
            {formData.phone && (
              <Row className="mb-3">
                <Col sm={4}>
                  <strong>Số điện thoại:</strong>
                </Col>
                <Col sm={8}>{formData.phone}</Col>
              </Row>
            )}
            {formData.name && (
              <Row className="mb-3">
                <Col sm={4}>
                  <strong>Họ tên:</strong>
                </Col>
                <Col sm={8}>{formData.name}</Col>
              </Row>
            )}
            <Row className="mb-3">
              <Col sm={4}>
                <strong>Lý do:</strong>
              </Col>
              <Col sm={8}>{formData.reason}</Col>
            </Row>
            <Row className="mb-3">
              <Col sm={4}>
                <strong>Mô tả:</strong>
              </Col>
              <Col sm={8}>{formData.message}</Col>
            </Row>
            {files.length > 0 && (
              <Row className="mb-3">
                <Col sm={4}>
                  <strong>File đính kèm:</strong>
                </Col>
                <Col sm={8}>
                  {files.map((file, index) => (
                    <div key={index} className="text-truncate">
                      {file.name} ({formatFileSize(file.size)})
                    </div>
                  ))}
                </Col>
              </Row>
            )}
          </Card.Body>
        </Card>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => setShowPreview(false)}>
          Đóng
        </Button>
        <Button
          variant="primary"
          onClick={handleSubmit}
          disabled={isSubmitting}
        >
          {isSubmitting ? "Đang gửi..." : "Xác nhận gửi"}
        </Button>
      </Modal.Footer>
    </Modal>
  );

  return (
    <Container className="appeal-form-container">
      <Row className="justify-content-center">
        <Col lg={10}>
          {/* Header */}
          <Card className="appeal-form-header-card mb-4">
            <Card.Body className="text-center">
              <ShieldCheck size={48} className="text-primary mb-3" />
              <h2 className="appeal-form-title">Trang Kháng Nghị</h2>
              <p className="appeal-form-subtitle">
                Nếu bạn gặp vấn đề với tài khoản, vui lòng cung cấp thông tin
                chi tiết bên dưới
              </p>
            </Card.Body>
          </Card>

          {/* Progress Bar */}
          {isSubmitting && uploadProgress > 0 && (
            <Card className="mb-4">
              <Card.Body>
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <span>Đang tải lên...</span>
                  <span>{uploadProgress}%</span>
                </div>
                <ProgressBar now={uploadProgress} animated />
              </Card.Body>
            </Card>
          )}

          {/* Main Form */}
          <Card className="appeal-form-main-card">
            <Card.Body>
              <Form onSubmit={handleSubmit}>
                <Row>
                  {/* Email Field */}
                  <Col md={6}>
                    <Form.Group className="mb-4">
                      <Form.Label className="appeal-form-label">
                        <Envelope className="me-2 text-primary" />
                        Email liên hệ *
                      </Form.Label>
                      <Form.Control
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        placeholder="Nhập email của bạn"
                        className="appeal-form-input"
                      />
                    </Form.Group>
                  </Col>

                  {/* Phone Field */}
                  <Col md={6}>
                    <Form.Group className="mb-4">
                      <Form.Label className="appeal-form-label">
                        <Telephone className="me-2 text-primary" />
                        Số điện thoại
                      </Form.Label>
                      <Form.Control
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="Nhập số điện thoại (tuỳ chọn)"
                        className="appeal-form-input"
                      />
                    </Form.Group>
                  </Col>
                </Row>

                {/* Name Field */}
                <Form.Group className="mb-4">
                  <Form.Label className="appeal-form-label">
                    <Person className="me-2 text-primary" />
                    Họ và tên
                  </Form.Label>
                  <Form.Control
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Nhập họ tên của bạn (tuỳ chọn)"
                    className="appeal-form-input"
                  />
                </Form.Group>

                {/* Reason Field */}
                <Form.Group className="mb-4">
                  <Form.Label className="appeal-form-label">
                    <ClipboardCheck className="me-2 text-primary" />
                    Lý do kháng nghị *
                  </Form.Label>
                  <Form.Select
                    name="reason"
                    value={formData.reason}
                    onChange={handleChange}
                    required
                    className="appeal-form-input"
                  >
                    <option value="Bị khoá tài khoản">Bị khoá tài khoản</option>
                    <option value="Nội dung bị xoá">Nội dung bị xoá</option>
                    <option value="Bị report sai">Bị report sai</option>
                    <option value="Lỗi hệ thống">Lỗi hệ thống</option>
                    <option value="Vấn đề bảo mật">Vấn đề bảo mật</option>
                    <option value="Khác">Khác</option>
                  </Form.Select>
                </Form.Group>

                {/* Message Field */}
                <Form.Group className="mb-4">
                  <Form.Label className="appeal-form-label">
                    <ChatText className="me-2 text-primary" />
                    Mô tả chi tiết *
                    <span className="text-muted ms-2">
                      ({characterCount}/{maxMessageLength})
                    </span>
                  </Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={6}
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    maxLength={maxMessageLength}
                    placeholder="Vui lòng mô tả chi tiết vấn đề bạn gặp phải, bao gồm thời gian, thiết bị sử dụng, và các bước bạn đã thử..."
                    className="appeal-form-input"
                  />
                  <Form.Text className="appeal-form-help-text">
                    Mô tả càng chi tiết càng giúp chúng tôi giải quyết vấn đề
                    nhanh chóng
                  </Form.Text>
                </Form.Group>

                {/* File Upload */}
                <Form.Group className="mb-4">
                  <Form.Label className="appeal-form-label">
                    <Paperclip className="me-2 text-primary" />
                    Tài liệu đính kèm (nếu có)
                  </Form.Label>
                  <Form.Control
                    ref={fileInputRef}
                    type="file"
                    multiple
                    onChange={handleFileChange}
                    accept="image/*,.pdf,.doc,.docx,.txt,video/*,audio/*"
                    className="appeal-form-input"
                  />
                  <Form.Text className="appeal-form-help-text">
                    Có thể đính kèm nhiều file (hình ảnh, video, audio, PDF,
                    Word, text), tối đa 5 file, mỗi file không quá 10MB
                  </Form.Text>
                </Form.Group>

                {/* File Preview */}
                {files.length > 0 && (
                  <Card className="appeal-form-files-card mb-4">
                    <Card.Header className="appeal-form-files-header">
                      <Paperclip className="me-2" />
                      Files đã chọn ({files.length}/5)
                    </Card.Header>
                    <Card.Body>
                      <div className="appeal-form-file-list">
                        {files.map((file, index) => (
                          <div key={index} className="appeal-form-file-item">
                            <div className="appeal-form-file-info">
                              {getFileIcon(file)}
                              <div className="appeal-form-file-details">
                                <div className="appeal-form-file-name">
                                  {file.name}
                                </div>
                                <div className="appeal-form-file-size">
                                  {formatFileSize(file.size)}
                                </div>
                              </div>
                              {getFilePreview(file)}
                            </div>
                            <Button
                              variant="outline-danger"
                              size="sm"
                              onClick={() => removeFile(index)}
                              className="appeal-form-remove-btn"
                              disabled={isSubmitting}
                            >
                              <Trash size={14} />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </Card.Body>
                  </Card>
                )}

                {/* Terms Agreement */}
                <Form.Group className="mb-4">
                  <Form.Check
                    type="checkbox"
                    name="agreeTerms"
                    checked={formData.agreeTerms}
                    onChange={handleChange}
                    label={
                      <span>
                        Tôi đồng ý với{" "}
                        <a
                          href="/terms"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          điều khoản dịch vụ
                        </a>{" "}
                        và{" "}
                        <a
                          href="/privacy"
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          chính sách bảo mật
                        </a>
                      </span>
                    }
                  />
                </Form.Group>

                {/* Action Buttons */}
                <div className="d-flex gap-3 flex-wrap">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    disabled={isSubmitting}
                    className="appeal-form-submit-btn"
                  >
                    {isSubmitting ? (
                      <>
                        <Clock className="me-2" />
                        Đang gửi...
                      </>
                    ) : (
                      <>
                        <Send className="me-2" />
                        Gửi Kháng Nghị
                      </>
                    )}
                  </Button>

                  <Button
                    variant="outline-secondary"
                    size="lg"
                    onClick={handlePreview}
                    disabled={
                      isSubmitting || !formData.email || !formData.message
                    }
                  >
                    <Eye className="me-2" />
                    Xem trước
                  </Button>

                  <Button
                    variant="outline-danger"
                    size="lg"
                    onClick={() => {
                      setFormData({
                        email: "",
                        phone: "",
                        name: "",
                        reason: "Bị khoá tài khoản",
                        message: "",
                        agreeTerms: false,
                      });
                      setFiles([]);
                      if (fileInputRef.current) {
                        fileInputRef.current.value = "";
                      }
                    }}
                    disabled={isSubmitting}
                  >
                    <Trash className="me-2" />
                    Xoá form
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>

          {/* Important Info */}
          <Card className="appeal-form-info-card mt-4">
            <Card.Header className="appeal-form-info-header">
              <div>
                <InfoCircle className="me-2" />
                Thông tin quan trọng
              </div>

              <div>
                <a href="/appealCheckStatus" className="btn btn-primary me-2">
                  Theo dõi kháng nghị
                </a>
                <a href="/homeContact" className="btn btn-success">
                  Quay về
                </a>
              </div>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <ul className="appeal-form-info-list">
                    <li>
                      <CheckCircle className="text-success me-2" />
                      Kháng nghị sẽ được xử lý trong vòng 24-48 giờ
                    </li>
                    <li>
                      <CheckCircle className="text-success me-2" />
                      Vui lòng cung cấp email chính xác để nhận phản hồi
                    </li>
                    <li>
                      <CheckCircle className="text-success me-2" />
                      Bạn có thể theo dõi trạng thái kháng nghị bằng email
                    </li>
                  </ul>
                </Col>
                <Col md={6}>
                  <ul className="appeal-form-info-list">
                    <li>
                      <CheckCircle className="text-success me-2" />
                      Mọi thắc mắc vui lòng liên hệ: support@autismnetwork.com
                    </li>
                    <li>
                      <CheckCircle className="text-success me-2" />
                      Giờ làm việc: Thứ 2 - Thứ 6 (8:00 - 17:00)
                    </li>
                    <li>
                      <CheckCircle className="text-success me-2" />
                      Phản hồi khẩn cấp: hotline 1800-xxxx
                    </li>
                  </ul>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <PreviewModal />
    </Container>
  );
};

export default AppealForm;
