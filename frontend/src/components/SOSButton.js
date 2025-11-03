import React, { useState } from "react";
import Guideline from "./Guideline"; // Nếu chưa có, em có thể bỏ dòng này

function SOSButton({ userId }) {
  const [showGuideline, setShowGuideline] = useState(false);

  const sendSOS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(async (pos) => {
        const data = {
          userId,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          message: "Tôi đang gặp sự cố, cần hỗ trợ gấp!",
          type: "panic",
          isSilent: false,
        };

        try {
          await fetch("http://localhost:5000/api/emergency/sos", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
          });
          alert("🚨 Đã gửi tín hiệu SOS thành công!");
          setShowGuideline(true);
        } catch (error) {
          console.error(error);
          alert("Không thể gửi tín hiệu SOS");
        }
      });
    } else {
      alert("Trình duyệt không hỗ trợ định vị GPS.");
    }
  };

  return (
    <>
      {/* Nút SOS cố định */}
      <button
        onClick={sendSOS}
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
        }}
        title="Gửi tín hiệu khẩn cấp"
      >
        🚨
      </button>

      {/* Popup hướng dẫn (tuỳ chọn) */}
      {showGuideline && (
        <div
          style={{
            position: "fixed",
            bottom: "110px",
            right: "20px",
            backgroundColor: "#fff",
            border: "2px solid #1976d2",
            borderRadius: "10px",
            padding: "15px",
            width: "280px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
            zIndex: 9999,
          }}
        >
          <h5>🩺 Hướng dẫn sơ cứu</h5>
          <ul>
            <li>Ngồi xuống, hít thở sâu.</li>
            <li>Giữ bình tĩnh, đếm từ 1 đến 10.</li>
            <li>Liên hệ người hỗ trợ qua ứng dụng.</li>
          </ul>
          <button
            onClick={() => setShowGuideline(false)}
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
