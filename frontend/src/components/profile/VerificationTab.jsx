// components/profile/VerificationTab.jsx
import React, { useState, useEffect } from "react";
import IdCardVerification from "./IdCardVerification";
import api from "../../services/api";

const VerificationTab = () => {
  const [verifiedData, setVerifiedData] = useState({
    verified: false,
    fullName: "",
    number: "",
    dob: "",
    address: "",
    cccdImage: null,
    selfieImage: null,
  });

  const [loading, setLoading] = useState(false);
  const [editMode, setEditMode] = useState(false);

  // Load từ /api/users/me
  useEffect(() => {
    const fetchVerifiedData = async () => {
      try {
        const res = await api.get("/api/users/me");
        if (res.data.success && res.data.data.user.profile?.idCard?.verified) {
          const idCard = res.data.data.user.profile.idCard;
          setVerifiedData({
            verified: true,
            fullName: idCard.fullName || "",
            number: idCard.number || "",
            dob: idCard.dob || "",
            address: idCard.address || "",
            cccdImage: idCard.frontImage || null,
            selfieImage: idCard.selfieImage || null,
          });
        }
      } catch (err) {
        console.log("Chưa xác minh danh tính");
      }
    };
    fetchVerifiedData();
  }, []);

  // Xác minh thành công
  const handleVerificationSuccess = async (verificationData) => {
    console.log("verificationData: ", verificationData);
    const { fullName, number, dob, address, cccdFile, selfieBlob } =
      verificationData;

    // const cccdURL = await fileToDataURL(cccdFile);
    // const selfieURL = await blobToDataURL(selfieBlob);

    // setVerifiedData({
    //   verified: true,
    //   fullName,
    //   number,
    //   dob,
    //   address,
    //   cccdImage: cccdURL,
    //   selfieImage: selfieURL,

    setVerifiedData({
      verified: true,
      fullName,
      number,
      dob,
      address,
      cccdImage: cccdFile,
      selfieImage: selfieBlob,
    });
    setEditMode(false);
  };

  const fileToDataURL = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(file);
    });

  const blobToDataURL = (blob) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setVerifiedData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const res = await api.post("/api/auth/update-id-info", {
        fullName: verifiedData.fullName,
        number: verifiedData.number,
        dob: verifiedData.dob,
        address: verifiedData.address,
      });
      if (res.data.success) {
        alert("Cập nhật thông tin thành công!");
        setEditMode(false);
      }
    } catch (err) {
      alert("Lỗi: " + (err.response?.data?.message || "Không thể lưu"));
    } finally {
      setLoading(false);
    }
  };

  const handleReverify = () => {
    if (
      window.confirm("Bạn có chắc muốn xác minh lại? Dữ liệu cũ sẽ bị xóa.")
    ) {
      setVerifiedData({
        verified: false,
        fullName: "",
        number: "",
        dob: "",
        address: "",
        cccdImage: null,
        selfieImage: null,
      });
      setEditMode(false);
    }
  };

  return (
    <div className="card border-0 shadow-lg">
      <div className="card-header bg-gradient-info text-white py-3">
        <h5 className="mb-0 text-center">
          Xác minh danh tính (CCCD + Khuôn mặt)
        </h5>
      </div>

      <div className="card-body p-4">
        {!verifiedData.verified ? (
          <IdCardVerification onSuccess={handleVerificationSuccess} />
        ) : (
          <>
            <div className="text-center mb-4">
              <i className="fas fa-check-circle fa-3x text-success mb-3"></i>
              <h5 className="text-success fw-bold">Xác minh thành công!</h5>
            </div>

            <div className="row g-4 mb-4">
              <div className="col-md-6 text-center">
                <h6 className="fw-bold text-primary">CCCD</h6>
                {verifiedData.cccdImage ? (
                  <img
                    src={verifiedData.cccdImage}
                    alt="CCCD"
                    className="img-fluid rounded shadow-sm"
                    style={{ maxHeight: "200px" }}
                  />
                ) : (
                  <div
                    className="bg-light border rounded d-flex align-items-center justify-content-center"
                    style={{ height: "200px" }}
                  >
                    <small className="text-muted">Không có ảnh</small>
                  </div>
                )}
              </div>

              <div className="col-md-6 text-center">
                <h6 className="fw-bold text-primary">Selfie</h6>
                {verifiedData.selfieImage ? (
                  <img
                    src={verifiedData.selfieImage}
                    alt="Selfie"
                    className="img-fluid rounded shadow-sm"
                    style={{ maxHeight: "200px" }}
                  />
                ) : (
                  <div
                    className="bg-light border rounded d-flex align-items-center justify-content-center"
                    style={{ height: "200px" }}
                  >
                    <small className="text-muted">Không có ảnh</small>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-light rounded p-4 mb-4">
              <div className="row g-3">
                {[
                  { name: "fullName", label: "Họ và tên" },
                  { name: "number", label: "Số CCCD" },
                  {
                    name: "dob",
                    label: "Ngày sinh",
                    placeholder: "dd/mm/yyyy",
                  },
                  { name: "address", label: "Địa chỉ" },
                ].map(({ name, label, placeholder }) => (
                  <div key={name} className="col-md-6">
                    <label className="form-label fw-bold text-primary">
                      {label}
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      name={name}
                      value={verifiedData[name]}
                      onChange={handleInputChange}
                      disabled={!editMode}
                      placeholder={placeholder}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="d-flex justify-content-between flex-wrap gap-2">
              <div>
                {editMode ? (
                  <>
                    <button
                      onClick={handleSave}
                      className="btn btn-success me-2"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2"></span>
                          Đang lưu...
                        </>
                      ) : (
                        <>Lưu thay đổi</>
                      )}
                    </button>
                    <button
                      onClick={() => setEditMode(false)}
                      className="btn btn-outline-secondary"
                      disabled={loading}
                    >
                      Hủy
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setEditMode(true)}
                    className="btn btn-outline-primary"
                  >
                    Chỉnh sửa
                  </button>
                )}
              </div>

              <button
                onClick={handleReverify}
                className="btn btn-outline-danger"
              >
                Xác minh lại
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default VerificationTab;
