// HomeContact.js
import React, { useState } from "react";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Badge,
} from "react-bootstrap";
import {
  Heart,
  Person,
  Shield,
  Star,
  Send,
  Clock,
  CheckCircle,
  Envelope,
  Phone,
  PinMap,
  Globe,
  Award,
  Lightbulb,
  ExclamationTriangle,
} from "react-bootstrap-icons";
import api from "../../services/api";
import notificationService from "../../services/notificationService";
import "./HomeContact.css";
import { useCallback } from "react";
import { useEffect } from "react";

const HomeContact = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [information, setInformation] = useState({
    user: null,
    admins: [],
    countAdmin: 0,
    countUser: 0,
    distinctProvinceCount: 0,
    activeWeb: "",
    countByProvince: [],
  });
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.message) {
      notificationService.warning({
        title: "Thiếu thông tin",
        text: "Vui lòng điền đầy đủ thông tin bắt buộc",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await api.post("/api/appeals/submit", formData);

      if (response.data.success) {
        notificationService.success({
          title: "Thành công!",
          text: "Cảm ơn bạn đã liên hệ. Chúng tôi sẽ phản hồi sớm nhất có thể.",
        });
      }

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      notificationService.error({
        title: "Lỗi",
        text: error.response?.data?.message || "Có lỗi xảy ra khi gửi liên hệ",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await api.get("/api/contact");
      console.log(res.data.data);
      if (res.data.success) {
        setInformation({ ...res.data.data });
      }
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Không thể tải thông tin người dùng";

      console.log(errorMessage);

      console.error("Lỗi khi load user profile:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, []);

  const features = [
    {
      icon: <Shield size={40} className="text-primary" />,
      title: "Môi trường an toàn",
      description:
        "Không gian được kiểm duyệt chặt chẽ, đảm bảo an toàn tuyệt đối cho mọi thành viên",
    },
    {
      icon: <Heart size={40} className="text-danger" />,
      title: "Thấu hiểu và đồng cảm",
      description:
        "Cộng đồng thấu hiểu những khó khăn và thách thức của người tự kỷ",
    },
    {
      icon: <Person size={40} className="text-success" />,
      title: "Kết nối cộng đồng",
      description:
        "Kết nối với những người có cùng trải nghiệm và quan tâm đến tự kỷ",
    },
    {
      icon: <Lightbulb size={40} className="text-warning" />,
      title: "Tài nguyên hữu ích",
      description:
        "Thư viện kiến thức và công cụ hỗ trợ phát triển kỹ năng xã hội",
    },
  ];

  const stats = [
    { number: `${information.countUser}+` || "Chưa Có", label: "Thành viên" },
    {
      number: `${information.admins.length}+` || "Chưa Có",
      label: "Chuyên gia",
    },
    {
      number: `${information.distinctProvinceCount}+` || "Chưa Có",
      label: "Tỉnh thành",
    },
    { number: `${information.activeWeb}` || "24/7", label: "Hỗ trợ" },
  ];

  return (
    <div className="home-contact-container">
      {/* Hero Section */}
      <section className="home-contact-hero">
        <Container>
          <Row className="align-items-center min-vh-100">
            <Col lg={6}>
              <Badge bg="light" text="dark" className="hero-badge mb-3">
                <Award className="me-2" />
                Cộng đồng tin cậy
              </Badge>
              <h1 className="hero-title">
                Autism Network - Kết nối yêu thương, Thấu hiểu đặc biệt
              </h1>
              <p className="hero-subtitle">
                Mạng xã hội đầu tiên tại Việt Nam dành riêng cho cộng đồng tự kỷ
                - nơi mọi thành viên được thấu hiểu, tôn trọng và hỗ trợ
              </p>
              <div className="hero-actions">
                <Button
                  variant="primary"
                  size="lg"
                  className="me-3"
                  href="/feed"
                >
                  <Person className="me-2" />
                  Khám phá ngay
                </Button>
                <Button variant="outline-light" size="lg" href="/about">
                  Tìm hiểu thêm
                </Button>
              </div>
            </Col>
            <Col lg={6}>
              <div className="hero-image">
                <div className="floating-card card-1">
                  <Person size={24} className="text-primary" />
                  <span>Cộng đồng</span>
                </div>
                <div className="floating-card card-2">
                  <Heart size={24} className="text-danger" />
                  <span>Yêu thương</span>
                </div>
                <div className="floating-card card-3">
                  <Shield size={24} className="text-success" />
                  <span>An toàn</span>
                </div>
                <div className="main-hero-image">
                  <div className="connection-dots d-flex justify-content-center align-items-center">
                    <img
                      src="/assets/images/logo.png"
                      className="img-fluid"
                      alt="SocialV Logo"
                      style={{ width: "12rem" }}
                    />
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Features Section */}
      <section className="features-section py-5">
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="section-title">Vì sao chọn Autism Network?</h2>
              <p className="section-subtitle">
                Chúng tôi xây dựng một môi trường hoàn toàn khác biệt, tập trung
                vào nhu cầu đặc biệt của cộng đồng tự kỷ
              </p>
            </Col>
          </Row>
          <Row>
            {features.map((feature, index) => (
              <Col lg={3} md={6} key={index} className="mb-4">
                <Card className="feature-card h-100">
                  <Card.Body className="text-center">
                    <div
                      className="feature-icon mb-3"
                      style={{
                        background:
                          "linear-gradient(135deg, #6f86ebff 0%, #12c6ef 100%)",
                      }}
                    >
                      {feature.icon}
                    </div>
                    <h5 className="feature-title">{feature.title}</h5>
                    <p className="feature-description">{feature.description}</p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Stats Section */}
      <section className="stats-section py-5 bg-light">
        <Container>
          <Row className="text-center">
            {stats.map((stat, index) => (
              <Col lg={3} md={6} key={index} className="mb-4">
                <div className="stat-item">
                  <h3 className="stat-number">{stat.number}</h3>
                  <p className="stat-label">{stat.label}</p>
                </div>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Contact & Appeal Section */}
      <section className="contact-appeal-section py-5">
        <Container>
          <Row>
            <Col lg={8}>
              {/* Appeal Form - Đã thay thế Contact Form */}
              <Card className="appeal-form-card mb-4">
                <Card.Header className="appeal-form-header bg-warning text-dark">
                  <ExclamationTriangle className="me-2" />
                  Kháng nghị
                </Card.Header>
                <Card.Body>
                  <Alert variant="info" className="mb-4">
                    <strong>Thông báo quan trọng:</strong> Nếu bạn gặp vấn đề
                    với tài khoản (bị khóa, bị report, nội dung bị xóa...), vui
                    lòng sử dụng form này để gửi kháng nghị.
                  </Alert>

                  <Form onSubmit={handleSubmit}>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Họ và tên *</Form.Label>
                          <Form.Control
                            type="text"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            required
                            placeholder="Nhập họ và tên của bạn"
                            className="appeal-form-input"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Email *</Form.Label>
                          <Form.Control
                            type="email"
                            name="email"
                            value={formData.email}
                            onChange={handleChange}
                            required
                            placeholder="email@example.com"
                            className="appeal-form-input"
                          />
                        </Form.Group>
                      </Col>
                    </Row>
                    <Row>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Số điện thoại</Form.Label>
                          <Form.Control
                            type="tel"
                            name="phone"
                            value={formData.phone}
                            onChange={handleChange}
                            placeholder="+84 776117577"
                            className="appeal-form-input"
                          />
                        </Form.Group>
                      </Col>
                      <Col md={6}>
                        <Form.Group className="mb-3">
                          <Form.Label>Loại kháng nghị *</Form.Label>
                          <Form.Select
                            name="subject"
                            value={formData.subject}
                            onChange={handleChange}
                            className="appeal-form-input"
                            required
                          >
                            <option value="">Chọn loại kháng nghị</option>
                            <option value="account_locked">
                              Tài khoản bị khóa
                            </option>
                            <option value="content_removed">
                              Nội dung bị xóa
                            </option>
                            <option value="false_report">Bị report sai</option>
                            <option value="system_error">Lỗi hệ thống</option>
                            <option value="privacy_issue">
                              Vấn đề bảo mật
                            </option>
                            <option value="other">Khác</option>
                          </Form.Select>
                        </Form.Group>
                      </Col>
                    </Row>
                    <Form.Group className="mb-4">
                      <Form.Label>Mô tả chi tiết *</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={9}
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        required
                        placeholder="Vui lòng mô tả chi tiết vấn đề bạn gặp phải, bao gồm thời gian, thiết bị sử dụng, và các thông tin liên quan..."
                        className="appeal-form-input"
                      />
                      <Form.Text className="text-muted">
                        Mô tả càng chi tiết càng giúp chúng tôi giải quyết vấn
                        đề nhanh chóng
                      </Form.Text>
                    </Form.Group>

                    <div className="d-flex justify-content-between align-items-center">
                      <Button
                        type="submit"
                        variant="warning"
                        disabled={isSubmitting}
                        className="appeal-submit-btn"
                      >
                        {isSubmitting ? (
                          <>
                            <Clock className="me-2" />
                            Đang gửi...
                          </>
                        ) : (
                          <>
                            <Send className="me-2" />
                            Gửi kháng nghị
                          </>
                        )}
                      </Button>

                      <a href="/appealForm" className="btn btn-outline-primary">
                        <ExclamationTriangle className="me-2" />
                        Form kháng nghị đầy đủ
                      </a>
                    </div>
                  </Form>
                </Card.Body>
              </Card>

              {/* Quick Appeal Card */}
              <Card className="appeal-quick-card">
                <Card.Body className="text-center py-4">
                  <h5 className="mb-3">Bạn muốn trò chuyện cùng ai?</h5>
                  <p className="text-muted mb-3">
                    Nếu bạn gặp vấn đề với hãy giải bầy tâm sự với tôi, AI chia
                    sẽ - đồng cảm
                  </p>
                  <Button
                    variant="outline-primary"
                    href="/aiChat"
                    className="appeal-quick-btn"
                  >
                    <Send className="me-2" />
                    Đến với Ai Chat
                  </Button>
                </Card.Body>
              </Card>

              {/* Quick Appeal Card */}
              <Card className="appeal-quick-card shadow-sm">
                <Card.Body className="text-center py-4">
                  <h5 className="mb-3 font-weight-bold">
                    Cần hỗ trợ từ ADMIN không?
                  </h5>
                  <p className="text-muted mb-4">
                    Nếu bạn đang gặp khó khăn, hãy chia sẻ với Admin. Admin sẽ
                    luôn lắng nghe và hỗ trợ bạn.
                  </p>
                  {information.admins[0] && (
                    <Button
                      variant="outline-info"
                      href={`/Chat/${information.admins[0]._id}`}
                      className="appeal-quick-btn"
                    >
                      <Send className="me-2" />
                      Liên Hệ Admin
                    </Button>
                  )}
                </Card.Body>
              </Card>
            </Col>

            <Col lg={4}>
              {/* Contact Info */}
              <Card className="contact-info-card">
                <Card.Header className="contact-info-header">
                  <Globe className="me-2" />
                  Thông tin liên hệ
                </Card.Header>
                <Card.Body>
                  <div className="contact-info-item mb-4">
                    <div className="contact-info-icon">
                      <Phone size={20} className="text-primary" />
                    </div>
                    <div className="contact-info-content">
                      <h6>Điện thoại</h6>
                      <p className="mb-1">0777840249</p>
                      <p className="mb-0">+84 776117577</p>
                    </div>
                  </div>

                  <div className="contact-info-item mb-4">
                    <div className="contact-info-icon">
                      <Envelope size={20} className="text-primary" />
                    </div>
                    <div className="contact-info-content">
                      <h6>Email</h6>
                      <p className="mb-1">dinhminh4424@gmail.com</p>
                      <p className="mb-0">dinhcongminh4424@gmail.com</p>
                    </div>
                  </div>

                  <div className="contact-info-item">
                    <div className="contact-info-icon">
                      <PinMap size={20} className="text-primary" />
                    </div>
                    <div className="contact-info-content">
                      <h6>Địa chỉ</h6>
                      <p className="mb-0">
                        1496/1, KP3, Trẳng Dài
                        <br />
                        Biên Hoà, Đồng Nai
                      </p>
                    </div>
                  </div>
                </Card.Body>
              </Card>

              {/* Appeal Process Info */}
              <Card className="appeal-process-card mt-4">
                <Card.Header className="appeal-process-header bg-info text-white">
                  <ExclamationTriangle className="me-2" />
                  Quy trình kháng nghị
                </Card.Header>
                <Card.Body>
                  <div className="process-step mb-3">
                    <div className="step-content">
                      <strong>1. Gửi kháng nghị</strong>
                      <p className="mb-0">
                        Điền đầy đủ thông tin và mô tả chi tiết
                      </p>
                    </div>
                  </div>
                  <div className="process-step mb-3">
                    <div className="step-content">
                      <strong>2. Xem xét</strong>
                      <p className="mb-0">Đội ngũ sẽ xem xét trong 24-48 giờ</p>
                    </div>
                  </div>
                  <div className="process-step mb-3">
                    <div className="step-content">
                      <strong>3. Phản hồi</strong>
                      <p className="mb-0">Nhận kết quả qua email đã đăng ký</p>
                    </div>
                  </div>
                  <div className="process-step">
                    <div className="step-content">
                      <strong>4. Giải quyết</strong>
                      <p className="mb-0">Vấn đề được giải quyết triệt để</p>
                    </div>
                  </div>
                </Card.Body>
              </Card>

              {/* Features Highlight */}
              <Card className="features-highlight-card mt-4">
                <Card.Header className="features-highlight-header">
                  <Star className="me-2" />
                  Điểm nổi bật
                </Card.Header>
                <Card.Body>
                  <div className="feature-highlight-item">
                    <CheckCircle size={16} className="text-success me-2" />
                    <span>Môi trường hoàn toàn không judgement</span>
                  </div>
                  <div className="feature-highlight-item">
                    <CheckCircle size={16} className="text-success me-2" />
                    <span>Đội ngũ chuyên gia tâm lý hỗ trợ 24/7</span>
                  </div>
                  <div className="feature-highlight-item">
                    <CheckCircle size={16} className="text-success me-2" />
                    <span>Tài nguyên giáo dục miễn phí</span>
                  </div>
                  <div className="feature-highlight-item">
                    <CheckCircle size={16} className="text-success me-2" />
                    <span>Cộng đồng cha mẹ chia sẻ kinh nghiệm</span>
                  </div>
                  <div className="feature-highlight-item">
                    <CheckCircle size={16} className="text-success me-2" />
                    <span>Sự kiện kết nối offline định kỳ</span>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="cta-section py-5 bg-primary text-white">
        <Container>
          <Row className="text-center">
            <Col>
              <h2 className="cta-title mb-3">
                Sẵn sàng tham gia cộng đồng của chúng tôi?
              </h2>
              <p className="cta-subtitle mb-4">
                Hãy cùng chúng tôi xây dựng một môi trường thực sự thấu hiểu và
                hỗ trợ cho cộng đồng tự kỷ
              </p>
              <Button
                href="/feed"
                variant="light"
                size="lg"
                className="cta-btn"
              >
                <Person className="me-2" />
                Khám phá ngay
              </Button>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default HomeContact;
