import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import notificationService from "../../services/notificationService";

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: Request OTP, 2: Verify OTP, 3: Reset Password
  const [formData, setFormData] = useState({
    email: "",
    otp: "",
    newPassword: "",
    confirmPassword: "",
  });
  const { resetPassword, forgotPassword } = useAuth();
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Gửi yêu cầu OTP
  const handleRequestOTP = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await forgotPassword({
        email: formData.email,
      });

      if (response.success) {
        notificationService.success({
          title: "Thành công!",
          text: "Mã OTP đã được gửi đến email của bạn",
          timer: 3000,
        });
        setStep(2);
        startCountdown(600); // 10 phút
      } else {
        notificationService.error({
          title: "Thất Bại!",
          text: response.message,
          timer: 3000,
        });
      }
    } catch (error) {
      console.log(error);
      notificationService.error({
        title: "Lỗi",
        text: error.response?.data?.message || "Có lỗi xảy ra",
        confirmButtonText: "Thử lại",
      });
    } finally {
      setLoading(false);
    }
  };

  // Xác minh OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (!formData.otp) {
      notificationService.error({
        title: "Lỗi",
        text: "Vui lòng nhập mã OTP",
      });
      return;
    }

    setStep(3);
  };

  // Đặt lại mật khẩu
  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (formData.newPassword !== formData.confirmPassword) {
      notificationService.error({
        title: "Lỗi",
        text: "Mật khẩu xác nhận không khớp",
      });
      return;
    }

    if (formData.newPassword.length < 6) {
      notificationService.error({
        title: "Lỗi",
        text: "Mật khẩu phải có ít nhất 6 ký tự",
      });
      return;
    }

    setLoading(true);

    try {
      const response = await resetPassword({
        email: formData.email,
        otp: formData.otp,
        newPassword: formData.newPassword,
      });

      if (response.success) {
        notificationService.success({
          title: "Thành công!",
          text: "Mật khẩu đã được đặt lại thành công",
          timer: 3000,
        });

        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      }
    } catch (error) {
      console.log(error);
      notificationService.error({
        title: "Lỗi",
        text: error.response?.data?.message || "Có lỗi xảy ra",
        confirmButtonText: "Thử lại",
      });
    } finally {
      setLoading(false);
    }
  };

  // Đếm ngược thời gian OTP
  const startCountdown = (seconds) => {
    setCountdown(seconds);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

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
                    <h4 className="mb-1 text-white">Quên mật khẩu?</h4>
                    <p>Đừng lo lắng, chúng tôi sẽ giúp bạn lấy lại tài khoản</p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
          <div className="col-md-6 bg-white pt-5 pt-5 pb-lg-0 pb-5">
            <div className="sign-in-from">
              <h1 className="mb-0">
                {step === 1 && "Quên Mật Khẩu"}
                {step === 2 && "Xác Minh OTP"}
                {step === 3 && "Đặt Lại Mật Khẩu"}
              </h1>

              <p>
                {step === 1 && "Nhập email để nhận mã OTP đặt lại mật khẩu"}
                {step === 2 && "Nhập mã OTP đã gửi đến email của bạn"}
                {step === 3 && "Tạo mật khẩu mới cho tài khoản của bạn"}
              </p>

              {/* Bước 1: Yêu cầu OTP */}
              {step === 1 && (
                <form className="mt-4" onSubmit={handleRequestOTP}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="email">
                      Email
                    </label>
                    <input
                      type="email"
                      className="form-control mb-0"
                      placeholder="Nhập email đăng ký"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="d-inline-block w-100">
                    <button
                      type="submit"
                      className="btn btn-primary float-end py-2"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Đang gửi...
                        </>
                      ) : (
                        "Gửi mã OTP"
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Bước 2: Xác minh OTP */}
              {step === 2 && (
                <form className="mt-4" onSubmit={handleVerifyOTP}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="otp">
                      Mã OTP
                    </label>
                    <input
                      type="text"
                      className="form-control mb-0"
                      placeholder="Nhập mã OTP 6 số"
                      id="otp"
                      name="otp"
                      value={formData.otp}
                      onChange={handleChange}
                      required
                      maxLength={6}
                      disabled={loading}
                    />
                    {countdown > 0 && (
                      <small className="text-muted">
                        Mã OTP hết hạn sau: {formatTime(countdown)}
                      </small>
                    )}
                    {countdown === 0 && (
                      <small className="text-danger">
                        Mã OTP đã hết hạn.{" "}
                        <button
                          type="button"
                          className="btn btn-link p-0"
                          onClick={() => setStep(1)}
                        >
                          Gửi lại mã
                        </button>
                      </small>
                    )}
                  </div>

                  <div className="d-inline-block w-100">
                    <button
                      type="submit"
                      className="btn btn-primary float-end py-2"
                      disabled={loading || countdown === 0}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Đang xác minh...
                        </>
                      ) : (
                        "Xác Minh OTP"
                      )}
                    </button>
                  </div>
                </form>
              )}

              {/* Bước 3: Đặt lại mật khẩu */}
              {step === 3 && (
                <form className="mt-4" onSubmit={handleResetPassword}>
                  <div className="form-group">
                    <label className="form-label" htmlFor="newPassword">
                      Mật Khẩu Mới
                    </label>
                    <input
                      type="password"
                      className="form-control mb-0"
                      placeholder="Nhập mật khẩu mới"
                      id="newPassword"
                      name="newPassword"
                      value={formData.newPassword}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label" htmlFor="confirmPassword">
                      Xác Nhận Mật Khẩu
                    </label>
                    <input
                      type="password"
                      className="form-control mb-0"
                      placeholder="Nhập lại mật khẩu mới"
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      disabled={loading}
                    />
                  </div>

                  <div className="d-inline-block w-100">
                    <button
                      type="submit"
                      className="btn btn-primary float-end py-2"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" />
                          Đang xử lý...
                        </>
                      ) : (
                        "Đặt Lại Mật Khẩu"
                      )}
                    </button>
                  </div>
                </form>
              )}

              <div className="sign-info">
                <span className="dark-color d-inline-block line-height-2">
                  Nhớ mật khẩu?{" "}
                  <Link to="/login" className="text-decoration-none">
                    Đăng nhập ngay
                  </Link>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ForgotPassword;
