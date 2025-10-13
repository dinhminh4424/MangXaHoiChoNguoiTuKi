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

  return (
    <div className="container-fluid vh-100 bg-light">
      <div className="row h-100 justify-content-center align-items-center">
        <div className="col-md-4">
          <div className="card shadow">
            <div className="card-body p-5">
              <div className="text-center mb-4">
                <h2 className="text-primary">Đăng nhập</h2>
                <p className="text-muted">Kết nối và hỗ trợ cộng đồng</p>
              </div>

              {error && (
                <div className="alert alert-danger" role="alert">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">
                    Email
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="mb-3">
                  <label htmlFor="password" className="form-label">
                    Mật khẩu
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  className="btn btn-primary w-100 py-2"
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
              </form>

              <div className="text-center mt-3">
                <p className="mb-0">
                  Chưa có tài khoản?{" "}
                  <Link to="/register" className="text-decoration-none">
                    Đăng ký ngay
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
