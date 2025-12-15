import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    fullName: "",
    role: "user",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [check, setCheck] = useState(false);

  const { register } = useAuth();

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!check) {
      setError("Bạn phải chấp nhận Điều khoản và Điều kiện");
      setLoading(false);
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      setLoading(false);
      return;
    }

    const { confirmPassword, ...registerData } = formData;
    const result = await register(registerData);

    if (result.success) {
      navigate("/home");
    } else {
      setError(result.message);
    }

    setLoading(false);
  };

  // --- NEW: URL Backend cho Social Login ---
  // !! QUAN TRỌNG: Đổi URL này nếu backend của bạn không chạy ở port 5000
  const BACKEND_URL = "http://localhost:5000";

  return (
    <>
      <section className="sign-in-page overflow-y-scroll ">
        <div id="container-inside">
          <div id="circle-small"></div>
          <div id="circle-medium"></div>
          <div id="circle-large"></div>
          <div id="circle-xlarge"></div>
          <div id="circle-xxlarge"></div>
        </div>
        <div className="container p-0 ">
          <div className="row no-gutters">
            <div className="col-md-6 bg-white pt-5 pb-lg-0 pb-5">
              <div className="sign-in-from">
                <h1 className="mb-0">Đăng Kí</h1>
                <p>
                  Nhập địa chỉ email và mật khẩu của bạn để truy cập vào bảng
                  quản trị.
                </p>

                {error && (
                  <div className="alert alert-danger" role="alert">
                    {error}
                  </div>
                )}
                <form className="mt-4" onSubmit={handleSubmit}>
                  <div className="form-group">
                    <label
                      htmlFor="fullName"
                      className="form-label"
                      for="fullName"
                    >
                      Họ và Tên
                    </label>
                    <input
                      type="text"
                      className="form-control mb-0"
                      placeholder="Họ và tên của bạn"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label
                      htmlFor="username"
                      className="form-label"
                      for="username"
                    >
                      UserName
                    </label>
                    <input
                      type="text"
                      className="form-control mb-0"
                      placeholder="Tên Tài Khoản"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="email" className="form-label" for="email">
                      Địa chỉ Email
                    </label>
                    <input
                      type="email"
                      className="form-control mb-0"
                      id="email"
                      placeholder="Nhập email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group">
                    <label
                      htmlFor="password"
                      className="form-label"
                      for="password"
                    >
                      Mật Khẩu
                    </label>
                    <input
                      type="password"
                      className="form-control mb-0"
                      id="password"
                      placeholder="Password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="form-group">
                    <label
                      htmlFor="confirmPassword"
                      className="form-label"
                      for="confirmPassword"
                    >
                      Xác Nhận Mật Khẩu
                    </label>
                    <input
                      type="password"
                      className="form-control mb-0"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>
                  <div className="mb-3 form-group">
                    <label htmlFor="role" className="form-label" for="role">
                      Vai trò
                    </label>
                    <select
                      className="form-select"
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      disabled={loading}
                    >
                      <option value="user">Người Dùng</option>
                      <option value="supporter">Người hỗ trợ</option>
                      <option value="doctor">Chuyên Gia</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  <div className="d-inline-block w-100">
                    <div className="form-check d-inline-block mt-2 pt-1">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        id="customCheck1"
                        checked={check}
                        onChange={() => setCheck(!check)}
                      />
                      <label className="form-check-label" for="customCheck1">
                        Tôi chấp nhận <a href="#">Điều khoản và Điều kiện</a>
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
                          Đang đăng ký...
                        </>
                      ) : (
                        "Đăng ký"
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
                        Hoặc đăng ký bằng
                      </span>
                    </div>
                  </div>

                  <div className="d-flex flex-column gap-2">
                    <a
                      href={`${BACKEND_URL}/api/auth/google`}
                      className="btn btn-danger d-flex align-items-center justify-content-center py-2"
                      style={{ textDecoration: "none" }}
                    >
                      {/* <i className="ri-google-fill me-2"></i> */}
                      Đăng ký với Google
                    </a>
                    <a
                      href={`${BACKEND_URL}/api/auth/facebook`}
                      className="btn btn-primary d-flex align-items-center justify-content-center py-2"
                      style={{ textDecoration: "none" }}
                    >
                      {/* <i className="ri-facebook-box-fill me-2"></i> */}
                      Đăng ký với Facebook
                    </a>
                  </div>
                  {/* --- END: Social Login Section --- */}

                  <div className="sign-info mt-4">
                    <span className="dark-color d-inline-block line-height-2">
                      Đã có tài khoản?{" "}
                      <Link to="/login" className="text-decoration-none">
                        Đăng nhập ngay
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
                </form>
              </div>
            </div>
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
                      <h4 className="mb-1 text-white">Find new friends</h4>
                      <p>
                        It is a long established fact that a reader will be
                        distracted by the readable content.
                      </p>
                    </li>
                    <li className="swiper-slide">
                      <img
                        src="assets/images/login/2.png"
                        className="img-fluid mb-4"
                        alt="logo"
                      />
                      <h4 className="mb-1 text-white">
                        Connect with the world
                      </h4>
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
          </div>
        </div>
      </section>
    </>
  );
};

export default Register;
