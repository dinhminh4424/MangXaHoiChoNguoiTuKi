import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import notificationService from "../../services/notificationService"; // Import service

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
    // if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.email || !formData.password) {
      setError("Vui lòng nhập đầy đủ thông tin");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await login(formData.email, formData.password);
      if (result.success) {
        // Thông báo thành công
        // await notificationService.success({
        //   title: "Đăng nhập thành công!",
        //   text: "Chào mừng bạn trở lại!",
        //   timer: 2000,
        //   showConfirmButton: false,
        // });
        // navigate("/");

        console.log("✅ Login successful, checking auth state...");
        console.log("📦 Token in localStorage:", localStorage.getItem("token"));
        console.log("🕒 Waiting 100ms before navigate...");

        // Thêm delay nhỏ để đảm bảo state được update

        console.log("🚀 Navigating to / ...");
        notificationService.success({
          title: "Đăng nhập thành công!",
          text: "Chào mừng bạn trở lại!: " + result.token,
          timer: 3000,
          showConfirmButton: false,
        });
        navigate("/");
      } else {
        // Hiển thị lỗi bằng SweetAlert2
        await notificationService.error({
          title: "Đăng nhập thất bại",
          text: result.message,
          confirmButtonText: "Thử lại",
          timer: 3000,
        });
        setError(result.message);
      }
    } catch (error) {
      // Xử lý lỗi không mong muốn
      await notificationService.error({
        title: "Lỗi hệ thống",
        text: "Có lỗi xảy ra, vui lòng thử lại sau!",
        confirmButtonText: "Đóng",
      });

      setError("Có lỗi xảy ra, vui lòng thử lại sau!");
    } finally {
      setLoading(false);
    }
  };

  // return (
  //   <div className="container-fluid vh-100 bg-light">
  //     <div className="row h-100 justify-content-center align-items-center">
  //       <div className="col-md-4">
  //         <div className="card shadow">
  //           <div className="card-body p-5">
  //             <div className="text-center mb-4">
  //               <h2 className="text-primary">Đăng nhập</h2>
  //               <p className="text-muted">Kết nối và hỗ trợ cộng đồng</p>
  //             </div>

  //             {error && (
  //               <div className="alert alert-danger" role="alert">
  //                 {error}
  //               </div>
  //             )}

  //             <form onSubmit={handleSubmit}>
  //               <div className="mb-3">
  //                 <label htmlFor="email" className="form-label">
  //                   Email
  //                 </label>
  //                 <input
  //                   type="email"
  //                   className="form-control"
  //                   id="email"
  //                   name="email"
  //                   value={formData.email}
  //                   onChange={handleChange}
  //                   required
  //                   disabled={loading}
  //                 />
  //               </div>

  //               <div className="mb-3">
  //                 <label htmlFor="password" className="form-label">
  //                   Mật khẩu
  //                 </label>
  //                 <input
  //                   type="password"
  //                   className="form-control"
  //                   id="password"
  //                   name="password"
  //                   value={formData.password}
  //                   onChange={handleChange}
  //                   required
  //                   disabled={loading}
  //                 />
  //               </div>

  //               <button
  //                 type="submit"
  //                 className="btn btn-primary w-100 py-2"
  //                 disabled={loading}
  //               >
  //                 {loading ? (
  //                   <>
  //                     <span className="spinner-border spinner-border-sm me-2" />
  //                     Đang đăng nhập...
  //                   </>
  //                 ) : (
  //                   "Đăng nhập"
  //                 )}
  //               </button>
  //             </form>

  //             <div className="text-center mt-3">
  //               <p className="mb-0">
  //                 Chưa có tài khoản?{" "}
  //                 <Link to="/register" className="text-decoration-none">
  //                   Đăng ký ngay
  //                 </Link>
  //               </p>
  //             </div>
  //           </div>
  //         </div>
  //       </div>
  //     </div>
  //   </div>
  // );

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
              <form className="mt-4" onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label" for="email">
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
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" for="password">
                    Mật Khẩu
                  </label>
                  <a href="#" className="float-end">
                    Quên mật khẩu?
                  </a>
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
                    <label className="form-check-label" for="customCheck11">
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
                <div className="sign-info">
                  <span className="dark-color d-inline-block line-height-2">
                    Bạn chưa có tài khoản?
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
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Login;
