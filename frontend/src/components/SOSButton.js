import React, { useState } from "react";
import api from "../services/api";
import NotificationService from "../services/notificationService"; // Import service

function SOSButton({ userId }) {
  const [showPopup, setShowPopup] = useState(false);
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const sendSOS = () => {
    if (!phoneNumber) {
      NotificationService.error({
        title: "Vui lòng nhập số điện thoại!",
        text: "⚠️ Vui lòng nhập số điện thoại khẩn trước khi gửi SOS!",
        confirmButtonText: "Đã hiểu",
      });
      return;
    }

    if (navigator.geolocation) {
      setLoading(true);
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const data = {
          userId,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          message: "Tôi đang gặp sự cố, cần hỗ trợ gấp!",
          type: "panic",
          isSilent: false,
          phoneNumber,
        };

        try {
          // const response = await fetch(
          //   `${
          //     process.env.REACT_APP_API_URL || "http://localhost:5000"
          //   }/api/emergency/sos`,
          //   {
          //     method: "POST",
          //     headers: { "Content-Type": "application/json" },
          //     body: JSON.stringify(data),
          //   }
          // );
          const response = await api.post(
            `${
              process.env.REACT_APP_API_URL || "http://localhost:5000"
            }/api/emergency/sos`,
            data
          );

          const result = await response.data;

          if (result.success) {
            setAddress(result.address || "Không xác định vị trí cụ thể");
            NotificationService.success({
              title: "Gửi tín hiệu SOS thành công!",
              text: "🚨 Đã gửi tín hiệu SOS thành công!",
              timer: 2000,
              showConfirmButton: false,
            });
          } else {
            NotificationService.error({
              title: "Gửi SOS thất bại",
              text: "❌ Gửi SOS thất bại: " + (result.message || ""),
              confirmButtonText: "Đã hiểu",
            });
          }
        } catch (error) {
          console.error(error);
          alert("Không thể gửi tín hiệu SOS");
        } finally {
          setLoading(false);
          setShowPopup(false);
        }
      });
    } else {
      alert("Trình duyệt không hỗ trợ định vị GPS.");
    }
  };

  return (
    <>
      {/* 🚨 Nút SOS cố định góc phải */}
      <button
        onClick={() => setShowPopup(true)}
        style={{
          position: "fixed",
          bottom: "20px",
          right: "20px",
          backgroundColor: "#ff0000",
          color: "white",
          border: "none",
          borderRadius: "50%",
          width: "70px",
          height: "70px",
          fontSize: "22px",
          fontWeight: "bold",
          boxShadow: "0px 4px 12px rgba(0,0,0,0.3)",
          cursor: "pointer",
          zIndex: 9999,
          transition: "transform 0.2s ease-in-out",
        }}
        onMouseEnter={(e) => (e.target.style.transform = "scale(1.1)")}
        onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
        title="Gửi tín hiệu khẩn cấp"
      >
        <i className="fas fa-exclamation-triangle"></i>
      </button>

      {/* 🧭 Popup SOS */}
      {showPopup && (
        <div
          style={{
            position: "fixed",
            bottom: "110px",
            right: "20px",
            backgroundColor: "#fff",
            border: "2px solid #1976d2",
            borderRadius: "10px",
            padding: "15px",
            width: "320px",
            boxShadow: "0 4px 1~0px rgba(0,0,0,0.2)",
            zIndex: 9999,
            overflowY: "auto",
            maxHeight: "80vh",
          }}
        >
          <h5 style={{ marginBottom: "10px" }}>📞 Gửi tín hiệu khẩn cấp</h5>

          <label
            style={{ fontSize: "14px", display: "block", marginBottom: "6px" }}
          >
            Nhập số điện thoại liên hệ:
          </label>
          <input
            type="tel"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            placeholder="Ví dụ: 0901234567"
            style={{
              width: "100%",
              padding: "6px",
              marginBottom: "10px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              outline: "none",
            }}
          />

          <button
            onClick={sendSOS}
            disabled={loading}
            style={{
              width: "100%",
              padding: "8px",
              backgroundColor: loading ? "#888" : "#d32f2f",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "bold",
              marginBottom: "10px",
            }}
          >
            {loading ? "Đang gửi..." : "🚨 Gửi SOS"}
          </button>

          {/* 🩺 Hướng dẫn sơ cứu */}
          <h5>🩺 Hướng dẫn sơ cứu</h5>
          <ul
            style={{ fontSize: "14px", lineHeight: "1.6", paddingLeft: "18px" }}
          >
            <li>Ngồi xuống, hít thở sâu.</li>
            <li>Giữ bình tĩnh, đếm từ 1 đến 10.</li>
            <li>Liên hệ người hỗ trợ qua các số điện thoại:</li>
            <ul style={{ marginTop: "6px", marginBottom: "10px" }}>
              <li>
                Tổng đài Quốc gia Bảo vệ Trẻ em: <strong>111</strong>
              </li>
              <li>
                Đường dây nóng "Ngày mai": <strong>1900 561 295</strong>
              </li>
              <li>
                Viện Sức khỏe Tâm thần: <strong>0984 104 115</strong>
              </li>
            </ul>
          </ul>

          {/* 📍 Hiển thị địa chỉ nếu có */}
          {address && (
            <p style={{ fontSize: "13px", marginTop: "10px", color: "#444" }}>
              <strong>📍 Vị trí hiện tại:</strong>
              <br />
              {address}
              <br />
              <button
                onClick={() =>
                  window.open(
                    `https://www.google.com/maps?q=${encodeURIComponent(
                      address
                    )}`,
                    "_blank"
                  )
                }
                style={{
                  marginTop: "6px",
                  padding: "5px 8px",
                  borderRadius: "5px",
                  border: "none",
                  backgroundColor: "#1976d2",
                  color: "white",
                  cursor: "pointer",
                }}
              >
                🗺️ Xem trên bản đồ
              </button>
            </p>
          )}

          <button
            onClick={() => setShowPopup(false)}
            style={{
              marginTop: "10px",
              width: "100%",
              padding: "6px",
              backgroundColor: "#1976d2",
              color: "white",
              border: "none",
              borderRadius: "6px",
              cursor: "pointer",
            }}
          >
            Đóng
          </button>
        </div>
      )}
    </>
  );
}

export default SOSButton;
