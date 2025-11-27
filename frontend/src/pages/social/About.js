// About.js
import React from "react";
import { Container, Row, Col, Card, ProgressBar, Badge } from "react-bootstrap";
import {
  Heart,
  Person,
  Shield,
  Star,
  Award,
  Lightbulb,
  Globe,
  Clock,
  CheckCircle,
  Eye,
  HandThumbsUp,
  ChatHeart,
  Book,
  PersonCheck,
  ShieldCheck,
  People,
  GraphUp,
  CalendarCheck,
  Telephone,
} from "react-bootstrap-icons";
import "./About.css";

const About = () => {
  const teamMembers = [
    {
      name: "Dr. Sarah Johnson",
      role: "Chuyên gia tâm lý",
      specialization: "Chuyên gia can thiệp sớm",
      experience: "15 năm",
      image: "/team/sarah.jpg",
      badges: ["PhD Tâm lý", "Chứng chỉ ABA"],
    },
    {
      name: "Michael Chen",
      role: "Kỹ sư công nghệ",
      specialization: "Phát triển nền tảng",
      experience: "8 năm",
      image: "/team/michael.jpg",
      badges: ["Thạc sĩ AI", "Chuyên gia UX"],
    },
    {
      name: "Emily Davis",
      role: "Chuyên gia giáo dục",
      specialization: "Thiết kế chương trình",
      experience: "12 năm",
      image: "/team/emily.jpg",
      badges: ["M.Ed Giáo dục", "Chứng chỉ TEACCH"],
    },
    {
      name: "David Wilson",
      role: "Quản lý cộng đồng",
      specialization: "Hỗ trợ phụ huynh",
      experience: "10 năm",
      image: "/team/david.jpg",
      badges: ["MSW Công tác xã hội", "Chứng nhận CPS"],
    },
  ];

  const milestones = [
    {
      year: "2020",
      event: "Thành lập Autism Network",
      description: "Bắt đầu hành trình hỗ trợ cộng đồng tự kỷ",
    },
    {
      year: "2021",
      event: "Ra mắt nền tảng",
      description: "Chính thức ra mắt phiên bản đầu tiên",
    },
    {
      year: "2022",
      event: "10,000 thành viên",
      description: "Đạt mốc 10,000 thành viên đăng ký",
    },
    {
      year: "2023",
      event: "Mở rộng quốc tế",
      description: "Mở rộng sang 5 quốc gia Đông Nam Á",
    },
    {
      year: "2024",
      event: "AI hỗ trợ",
      description: "Triển khai AI phân tích và hỗ trợ",
    },
  ];

  const values = [
    {
      icon: <Heart size={40} className="text-danger" />,
      title: "Thấu cảm",
      description:
        "Chúng tôi thấu hiểu sâu sắc những thách thức mà cộng đồng tự kỷ phải đối mặt hàng ngày",
    },
    {
      icon: <Shield size={40} className="text-primary" />,
      title: "An toàn",
      description:
        "Cam kết tạo ra môi trường an toàn tuyệt đối, không có sự kỳ thị hay phân biệt đối xử",
    },
    {
      icon: <Person size={40} className="text-success" />,
      title: "Cộng đồng",
      description:
        "Xây dựng mạng lưới hỗ trợ mạnh mẽ, nơi mọi người có thể kết nối và chia sẻ",
    },
    {
      icon: <Lightbulb size={40} className="text-warning" />,
      title: "Đổi mới",
      description:
        "Liên tục cải tiến công nghệ để mang lại trải nghiệm tốt nhất cho người dùng",
    },
  ];

  const stats = [
    {
      icon: <Person size={24} />,
      number: "15,000+",
      label: "Thành viên",
      color: "primary",
    },
    {
      icon: <PersonCheck size={24} />,
      number: "200+",
      label: "Chuyên gia",
      color: "success",
    },
    {
      icon: <CalendarCheck size={24} />,
      number: "500+",
      label: "Sự kiện",
      color: "warning",
    },
    {
      icon: <Book size={24} />,
      number: "1,000+",
      label: "Tài liệu",
      color: "info",
    },
  ];

  return (
    <div className="about-container">
      {/* Hero Section */}
      <section className="about-hero">
        <Container>
          <Row className="align-items-center min-vh-80">
            <Col lg={6}>
              <Badge bg="light" text="dark" className="hero-badge mb-3">
                <Award className="me-2" />
                Về chúng tôi
              </Badge>
              <h1 className="hero-title">
                Autism Network - Hành trình thấu hiểu và kết nối
              </h1>
              <p className="hero-subtitle">
                Từ năm 2020, chúng tôi đã dành trọn tâm huyết để xây dựng một
                cộng đồng nơi mọi cá nhân trên phổ tự kỷ đều tìm thấy tiếng nói,
                sự thấu hiểu và cơ hội phát triển.
              </p>
              <div className="hero-stats">
                <Row>
                  {stats.map((stat, index) => (
                    <Col xs={6} sm={3} key={index}>
                      <div className="stat-item">
                        <div className={`stat-icon text-${stat.color}`}>
                          {stat.icon}
                        </div>
                        <h4 className="stat-number">{stat.number}</h4>
                        <p className="stat-label">{stat.label}</p>
                      </div>
                    </Col>
                  ))}
                </Row>
              </div>
            </Col>
            <Col lg={6}>
              <div className="hero-visual">
                <div className="floating-element element-1">
                  <ShieldCheck size={32} className="text-success" />
                </div>
                <div className="floating-element element-2">
                  <ChatHeart size={32} className="text-primary" />
                </div>
                <div className="floating-element element-3">
                  <HandThumbsUp size={32} className="text-warning" />
                </div>
                <div className="main-visual">
                  <div className="connection-lines"></div>
                  <div className="visual-center">
                    <People size={64} className="text-white" />
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Mission Section */}
      <section className="mission-section py-5">
        <Container>
          <Row className="align-items-center">
            <Col lg={6}>
              <h2 className="section-title">Sứ mệnh của chúng tôi</h2>
              <p className="mission-text">
                Chúng tôi tin rằng mỗi cá nhân trên phổ tự kỷ đều có những điểm
                mạnh độc đáo và xứng đáng có một cộng đồng thực sự thấu hiểu và
                hỗ trợ họ.
              </p>
              <div className="mission-points">
                <div className="mission-point">
                  <CheckCircle size={20} className="text-success me-3" />
                  <span>
                    Xây dựng môi trường kỹ thuật số an toàn và thân thiện
                  </span>
                </div>
                <div className="mission-point">
                  <CheckCircle size={20} className="text-success me-3" />
                  <span>
                    Cung cấp công cụ và tài nguyên hỗ trợ phát triển kỹ năng
                  </span>
                </div>
                <div className="mission-point">
                  <CheckCircle size={20} className="text-success me-3" />
                  <span>Kết nối gia đình, chuyên gia và cộng đồng</span>
                </div>
                <div className="mission-point">
                  <CheckCircle size={20} className="text-success me-3" />
                  <span>Nâng cao nhận thức và thay đổi nhận thức về tự kỷ</span>
                </div>
              </div>
            </Col>
            <Col lg={6}>
              <Card className="mission-card">
                <Card.Body className="p-4">
                  <h4 className="mb-4">Tầm nhìn 2025</h4>

                  <div className="vision-item mb-4">
                    <div className="d-flex justify-content-between mb-2">
                      <span>Mở rộng sang 10 quốc gia</span>
                      <span>80%</span>
                    </div>
                    <ProgressBar
                      now={80}
                      variant="primary"
                      className="vision-progress"
                    />
                  </div>

                  <div className="vision-item mb-4">
                    <div className="d-flex justify-content-between mb-2">
                      <span>Phát triển công nghệ AI hỗ trợ</span>
                      <span>65%</span>
                    </div>
                    <ProgressBar
                      now={65}
                      variant="success"
                      className="vision-progress"
                    />
                  </div>

                  <div className="vision-item mb-4">
                    <div className="d-flex justify-content-between mb-2">
                      <span>Đào tạo chuyên gia cộng đồng</span>
                      <span>75%</span>
                    </div>
                    <ProgressBar
                      now={75}
                      variant="warning"
                      className="vision-progress"
                    />
                  </div>

                  <div className="vision-item">
                    <div className="d-flex justify-content-between mb-2">
                      <span>Hợp tác với tổ chức giáo dục</span>
                      <span>90%</span>
                    </div>
                    <ProgressBar
                      now={90}
                      variant="info"
                      className="vision-progress"
                    />
                  </div>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>

      {/* Values Section */}
      <section className="values-section py-5 bg-light">
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="section-title">Giá trị cốt lõi</h2>
              <p className="section-subtitle">
                Những nguyên tắc định hướng cho mọi hoạt động của chúng tôi
              </p>
            </Col>
          </Row>
          <Row>
            {values.map((value, index) => (
              <Col lg={3} md={6} key={index} className="mb-4">
                <Card className="value-card h-100">
                  <Card.Body className="text-center p-4">
                    <div className="value-icon mb-3">{value.icon}</div>
                    <h5 className="value-title">{value.title}</h5>
                    <p className="value-description">{value.description}</p>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Team Section */}
      <section className="team-section py-5">
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="section-title">Đội ngũ của chúng tôi</h2>
              <p className="section-subtitle">
                Những chuyên gia tâm huyết đằng sau Autism Network
              </p>
            </Col>
          </Row>
          <Row>
            {teamMembers.map((member, index) => (
              <Col lg={3} md={6} key={index} className="mb-4">
                <Card className="team-card h-100">
                  <div className="team-image">
                    <div className="image-placeholder">
                      <People size={48} className="text-muted" />
                    </div>
                    <div className="team-experience">
                      <Clock size={14} className="me-1" />
                      {member.experience}
                    </div>
                  </div>
                  <Card.Body className="text-center">
                    <h5 className="team-name">{member.name}</h5>
                    <p className="team-role text-primary">{member.role}</p>
                    <p className="team-specialization text-muted small">
                      {member.specialization}
                    </p>
                    <div className="team-badges">
                      {member.badges.map((badge, badgeIndex) => (
                        <Badge
                          key={badgeIndex}
                          bg="outline-primary"
                          className="me-1 mb-1"
                        >
                          {badge}
                        </Badge>
                      ))}
                    </div>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>
        </Container>
      </section>

      {/* Timeline Section */}
      <section className="timeline-section py-5 bg-light">
        <Container>
          <Row className="text-center mb-5">
            <Col>
              <h2 className="section-title">Hành trình phát triển</h2>
              <p className="section-subtitle">
                Những cột mốc quan trọng trong hành trình của chúng tôi
              </p>
            </Col>
          </Row>
          <Row>
            <Col>
              <div className="timeline">
                {milestones.map((milestone, index) => (
                  <div
                    key={index}
                    className={`timeline-item ${
                      index % 2 === 0 ? "left" : "right"
                    }`}
                  >
                    <div className="timeline-content">
                      <div className="timeline-year">{milestone.year}</div>
                      <h5 className="timeline-event">{milestone.event}</h5>
                      <p className="timeline-description">
                        {milestone.description}
                      </p>
                    </div>
                    <div className="timeline-marker">
                      <div className="timeline-dot"></div>
                    </div>
                  </div>
                ))}
              </div>
            </Col>
          </Row>
        </Container>
      </section>

      {/* CTA Section */}
      <section className="about-cta-section py-5">
        <Container>
          <Row className="text-center">
            <Col lg={8} className="mx-auto">
              <h2 className="cta-title mb-3">
                Sẵn sàng tham gia hành trình cùng chúng tôi?
              </h2>
              <p className="cta-subtitle mb-4">
                Dù bạn là phụ huynh, chuyên gia hay cá nhân quan tâm đến tự kỷ,
                hãy cùng chúng tôi tạo ra sự khác biệt tích cực cho cộng đồng.
              </p>
              <div className="cta-actions">
                <a href="/homeContact" className="btn btn-primary btn-lg me-3">
                  <Telephone className="me-2" />
                  Liên hệ ngay
                </a>
                <a
                  href="/AppealForm"
                  className="btn btn-outline-primary btn-lg"
                >
                  <ShieldCheck className="me-2" />
                  Gửi kháng nghị
                </a>
              </div>
            </Col>
          </Row>
        </Container>
      </section>
    </div>
  );
};

export default About;
