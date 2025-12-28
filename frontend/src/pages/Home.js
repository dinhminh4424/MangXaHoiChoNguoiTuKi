import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Quote from "../components/QuoteComponent";
import "./Home.css";

function Home() {
  const { isAuthenticated } = useAuth();
  const features = [
    {
      icon: "fas fa-shield-alt",
      title: "An toàn & Bảo mật",
      description:
        "Môi trường được kiểm duyệt và bảo vệ, đảm bảo an toàn cho mọi thành viên trong cộng đồng.",
    },
    {
      icon: "fas fa-users",
      title: "Cộng đồng Thân thiện",
      description:
        "Kết nối với những người có cùng trải nghiệm, chia sẻ và hỗ trợ lẫn nhau trong hành trình.",
    },
    {
      icon: "fas fa-heart",
      title: "Hỗ trợ Tâm lý",
      description:
        "Truy cập các tài nguyên và công cụ hỗ trợ tâm lý, nhật ký cảm xúc và theo dõi sức khỏe tinh thần.",
    },
    {
      icon: "fas fa-comments",
      title: "Giao tiếp Dễ dàng",
      description:
        "Trò chuyện, chia sẻ bài viết và tương tác với bạn bè một cách thuận tiện và thân thiện.",
    },
    {
      icon: "fas fa-users-cog",
      title: "Nhóm & Hoạt động",
      description:
        "Tham gia các nhóm theo sở thích, tổ chức và tham gia các hoạt động cộng đồng ý nghĩa.",
    },
    {
      icon: "fas fa-chart-line",
      title: "Theo dõi Tiến độ",
      description:
        "Theo dõi và phân tích cảm xúc, tiến độ phát triển cá nhân qua các công cụ thống kê trực quan.",
    },
  ];

  return (
    <div className={`home-container ${isAuthenticated ? "authenticated" : ""}`}>
      {!isAuthenticated && (
        <div id="container-inside">
          <div id="circle-small"></div>
          <div id="circle-medium"></div>
          <div id="circle-large"></div>
          <div id="circle-xlarge"></div>
          <div id="circle-xxlarge"></div>
        </div>
      )}
      <div className="quote-wrapper">
        <Quote />
      </div>

      <div className="hero-section">
        <div className="container">
          <div className="hero-content">
            <h1 className="hero-title">
              Wellcome
              <br />
              <span
                style={{
                  color: isAuthenticated ? "rgb(28, 140, 238)" : "#87ceeb",
                }}
              >
                Connect
              </span>
            </h1>
            <p className="hero-subtitle">
              Mạng xã hội an toàn và thân thiện dành cho cộng đồng người tự kỷ.
              <br />
              Nơi bạn có thể kết nối, chia sẻ và phát triển cùng nhau.
            </p>
            {!isAuthenticated && (
              <div className="hero-buttons">
                <Link to="/login" className="hero-btn hero-btn-primary">
                  <i className="fas fa-sign-in-alt"></i>
                  Đăng nhập
                </Link>
                <Link to="/register" className="hero-btn hero-btn-outline">
                  <i className="fas fa-user-plus"></i>
                  Đăng ký ngay
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {isAuthenticated && (
        <div className="features-section">
          <div className="container">
            <h2 className="features-title">Tính năng nổi bật</h2>
            <div className="features-grid">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="feature-card"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="feature-icon">
                    <i className={feature.icon}></i>
                  </div>
                  <h3 className="feature-title">{feature.title}</h3>
                  <p className="feature-description">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
