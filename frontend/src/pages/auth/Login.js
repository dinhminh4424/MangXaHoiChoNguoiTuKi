import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import notificationService from "../../services/notificationService"; // Import service
import api from "../../services/api"; // Import api service để gọi API khôi phục

const Login = () => {
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Xóa lỗi khi người dùng bắt đầu nhập lại
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); // Quan trọng: ngăn reload trang

    console.log("Form submitted - page should NOT reload");

    if (!formData.email || !formData.password) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await login(formData.email, formData.password);

      if (result.success) {
        const { user } = result.data;

        // Hàm điều hướng sau khi xử lý xong
        const navigateHome = () => {
          notificationService.success({
            title: "Đăng nhập thành công!",
            text: "Chào mừng bạn trở lại!",
            timer: 2000,
            showConfirmButton: false,
          });
          navigate("/");
        };

        // Xử lý logic mất chuỗi
        if (user.hasLostStreak) {
          if (user.canRestore) {
            // Hiển thị popup hỏi khôi phục
            notificationService
              .confirm({
                title: "Ôi không! Bạn đã mất chuỗi!",
                html: `Bạn đã bỏ lỡ một ngày và làm mất chuỗi <b>${user.streakToRestore} ngày</b> của mình.<br/>Bạn có muốn dùng 1 lượt khôi phục để lấy lại chuỗi không?`,
                icon: "warning",
                confirmButtonText: "Khôi phục chuỗi",
                cancelButtonText: "Bỏ qua",
                showCancelButton: true,
              })
              .then(async (dialogResult) => {
                if (dialogResult.isConfirmed) {
                  // Người dùng chọn "Khôi phục"
                  await api.post("/api/auth/streaks/restore");
                  notificationService.success({
                    title: "Đã khôi phục!",
                    text: "Chuỗi của bạn đã được bảo toàn.",
                  });
                } else {
                  // Người dùng chọn "Bỏ qua"
                  await api.post("/api/auth/streaks/dismiss");
                  notificationService.info({
                    title: "Tiếc quá!",
                    text: "Chuỗi của bạn đã được reset về 0.",
                  });
                }
                navigateHome();
              });
          } else {
            // Mất chuỗi và không thể khôi phục
            await api.post("/api/auth/streaks/dismiss"); // Tự động reset
            notificationService.error({
              title: "Bạn đã mất chuỗi!",
              text: "Bạn đã hết lượt khôi phục trong tuần này. Chuỗi của bạn đã reset về 0.",
              confirmButtonText: "Đã hiểu",
            });
            navigateHome();
          }
        } else {
          // Không mất chuỗi, đăng nhập bình thường
          navigateHome();
        }
      } else {
        // Hiển thị lỗi bằng SweetAlert2
        notificationService.error({
          title: "Đăng nhập thất bại",
          text: result.message,
          confirmButtonText: "Thử lại",
        });
        setError(result.message);
      }
    } catch (error) {
      console.error("Login error:", error);

      notificationService.error({
        title: "Lỗi hệ thống",
        text: "Có lỗi xảy ra, vui lòng thử lại sau!",
        confirmButtonText: "Đóng",
      });

      setError("Có lỗi xảy ra, vui lòng thử lại sau!");
    } finally {
      setLoading(false);
    }
  };

  // const BACKEND_URL = "http://localhost:5000"; // process.env.REACT_APP_API_URL
  const BACKEND_URL = process.env.REACT_APP_API_URL; // process.env.REACT_APP_API_URL

  return (
    <section className="sign-in-page">
      <div id="container-inside">
        <div id="circle-small"></div>
        <div id="circle-medium"></div>
        <div id="circle-large"></div>
        <div id="circle-xlarge"></div>
        <div id="circle-xxlarge"></div>
      </div>
      <div className="container p-0">
        <div className="row no-gutters">
          <div className="col-md-6 text-center pt-5">
            <div className="sign-in-detail text-white">
              <a className="sign-in-logo mb-5" href="#">
                <img
                  src="assets/images/logo-full.png"
                  className="img-fluid"
                  alt="logo"
                />
              </a>
              <div className="sign-slider overflow-hidden">
                <ul className="swiper-wrapper list-inline m-0 p-0">
                  <li className="swiper-slide">
                    <img
                      src="assets/images/login/1.png"
                      className="img-fluid mb-4"
                      alt="logo"
                    />
                    <h4 className="mb-1 text-white">Tìm bạn mới</h4>
                    <p>
                      Một sự thật đã được chứng minh từ lâu là người đọc sẽ bị
                      phân tâm bởi nội dung dễ đọc.
                    </p>
                  </li>
                  <li className="swiper-slide">
                    <img
                      src="assets/images/login/2.png"
                      className="img-fluid mb-4"
                      alt="logo"
                    />
                    <h4 className="mb-1 text-white">Connect with the world</h4>
                    <p>
                      It is a long established fact that a reader will be
                      distracted by the readable content.
                    </p>
                  </li>
                  <li className="swiper-slide">
                    <img
                      src="assets/images/login/3.png"
                      className="img-fluid mb-4"
                      alt="logo"
                    />
                    <h4 className="mb-1 text-white">Create new events</h4>
                    <p>
                      It is a long established fact that a reader will be
                      distracted by the readable content.
                    </p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="col-md-6 bg-white pt-5 pt-5 pb-lg-0 pb-5">
            <div className="sign-in-from">
              <h1 className="mb-0">Đăng Nhập</h1>
              <p>
                Nhập địa chỉ email và mật khẩu của bạn để truy cập vào bảng quản
                trị.
              </p>
              {/* hiển thị lỗi */}
              {error && (
                <div
                  className="alert alert-danger alert-dismissible fade show"
                  role="alert"
                >
                  {error}
                  <button
                    type="button"
                    className="btn-close"
                    data-bs-dismiss="alert"
                    aria-label="Close"
                  ></button>
                </div>
              )}

              <form className="mt-4" onSubmit={handleSubmit} autoComplete="off">
                {/* hidden dummy fields to reduce browser autofill */}
                <input
                  type="text"
                  name="fakeusernameremembered"
                  id="fakeuser"
                  autoComplete="off"
                  style={{ display: "none" }}
                />
                <input
                  type="password"
                  name="fakepasswordremembered"
                  id="fakepass"
                  autoComplete="off"
                  style={{ display: "none" }}
                />
                <div className="form-group">
                  <label className="form-label" htmlFor="email">
                    Email
                  </label>
                  <input
                    type="email"
                    className="form-control mb-0"
                    placeholder="Nhập Email"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    autoComplete="email" // gợi ý các lịch sử
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="password">
                    Mật Khẩu
                  </label>
                  <Link
                    to="/forgot-password"
                    className="float-end text-decoration-none"
                  >
                    Quên mật khẩu?
                  </Link>
                  <input
                    type="password"
                    className="form-control mb-0"
                    placeholder="Nhập Mật Khẩu"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>
                <div className="d-inline-block w-100">
                  <div className="form-check d-inline-block mt-2 pt-1">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="customCheck11"
                    />
                    <label className="form-check-label" htmlFor="customCheck11">
                      Ghi nhớ tôi!
                    </label>
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary float-end py-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Đang đăng nhập...
                      </>
                    ) : (
                      "Đăng nhập"
                    )}
                  </button>
                </div>

                {/* --- NEW: Social Login Section --- */}
                <div className="mt-4 mb-3 text-center">
                  <div
                    className="d-flex align-items-center justify-content-center"
                    style={{
                      height: "1px",
                      backgroundColor: "#e0e0e0",
                      width: "100%",
                    }}
                  >
                    <span
                      className="bg-white px-3 text-muted"
                      style={{ marginTop: "-2px" }}
                    >
                      Hoặc đăng nhập bằng
                    </span>
                  </div>
                </div>

                <div className="d-flex flex-column gap-2">
                  <a
                    href={`${BACKEND_URL}/api/auth/google`}
                    className="btn btn-danger d-flex align-items-center justify-content-center py-2"
                    style={{ textDecoration: "none" }}
                  >
                    {/* Bạn có thể cần thư viện icon (ví dụ: 'ri-google-fill') */}
                    {/* <i className="ri-google-fill me-2"></i> */}
                    Đăng nhập với Google
                  </a>
                  <a
                    href={`${BACKEND_URL}/api/auth/facebook`}
                    className="btn btn-primary d-flex align-items-center justify-content-center py-2"
                    style={{ textDecoration: "none" }}
                  >
                    {/* <i className="ri-facebook-box-fill me-2"></i> */}
                    Đăng nhập với Facebook
                  </a>
                </div>
                {/* --- END: Social Login Section --- */}

                <div className="sign-info mt-4">
                  <span className="dark-color d-inline-block line-height-2">
                    Bạn chưa có tài khoản?{" "}
                    <Link to="/register" className="text-decoration-none">
                      Đăng ký
                    </Link>
                  </span>
                  <ul className="iq-social-media">
                    <li>
                      <a href="#">
                        <i className="ri-facebook-box-line"></i>
                      </a>
                    </li>
                    <li>
                      <a href="#">
                        <i className="ri-twitter-line"></i>
                      </a>
                    </li>
                    <li>
                      <a href="#">
                        <i className="ri-instagram-line"></i>
                      </a>
                    </li>
                  </ul>
                </div>
                <div className="sign-info">
                  <span className="dark-color d-inline-block line-height-2">
                    Bạn chưa muốn đăng nhập bằng khuôn mặt (Camera)
                    <Link to="/faceLogin" className="text-decoration-none">
                      Đăng nhập
                    </Link>
                  </span>
                  <span className="dark-color d-inline-block line-height-2">
                    Bạn chưa muốn đăng nhập bằng khuôn mặt (Hình ảnh)
                    <Link to="/faceLoginImage" className="text-decoration-none">
                      Đăng nhập
                    </Link>
                  </span>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Login;
