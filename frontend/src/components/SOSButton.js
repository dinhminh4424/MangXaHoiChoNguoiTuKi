// import React, { useState } from "react";
// import api from "../services/api";
// import NotificationService from "../services/notificationService"; // Import service

// function SOSButton({ userId }) {
//   const [showPopup, setShowPopup] = useState(false);
//   const [address, setAddress] = useState("");
//   const [phoneNumber, setPhoneNumber] = useState("");
//   const [loading, setLoading] = useState(false);

//   const sendSOS = () => {
//     if (!phoneNumber) {
//       NotificationService.error({
//         title: "Vui lòng nhập số điện thoại!",
//         text: "⚠️ Vui lòng nhập số điện thoại khẩn trước khi gửi SOS!",
//         confirmButtonText: "Đã hiểu",
//       });
//       return;
//     }

//     if (navigator.geolocation) {
//       setLoading(true);
//       navigator.geolocation.getCurrentPosition(async (pos) => {
//         const data = {
//           userId,
//           latitude: pos.coords.latitude,
//           longitude: pos.coords.longitude,
//           message: "Tôi đang gặp sự cố, cần hỗ trợ gấp!",
//           type: "panic",
//           isSilent: false,
//           phoneNumber,
//         };

//         try {
//           const response = await api.post(
//             `${
//               process.env.REACT_APP_API_URL || "http://localhost:5000"
//             }/api/emergency/sos`,
//             data
//           );

//           const result = await response.data;

//           if (result.success) {
//             setAddress(result.address || "Không xác định vị trí cụ thể");
//             NotificationService.success({
//               title: "Gửi tín hiệu SOS thành công!",
//               text: "🚨 Đã gửi tín hiệu SOS thành công!",
//               timer: 2000,
//               showConfirmButton: false,
//             });
//           } else {
//             NotificationService.error({
//               title: "Gửi SOS thất bại",
//               text: "❌ Gửi SOS thất bại: " + (result.message || ""),
//               confirmButtonText: "Đã hiểu",
//             });
//           }
//         } catch (error) {
//           console.error(error);
//           alert("Không thể gửi tín hiệu SOS");
//         } finally {
//           setLoading(false);
//           setShowPopup(false);
//         }
//       });
//     } else {
//       alert("Trình duyệt không hỗ trợ định vị GPS.");
//     }
//   };

//   return (
//     <>
//       {/* 🚨 Nút SOS cố định góc phải */}
//       <button
//         onClick={() => setShowPopup(true)}
//         style={{
//           position: "fixed",
//           bottom: "20px",
//           right: "20px",
//           backgroundColor: "#ff0000",
//           color: "white",
//           border: "none",
//           borderRadius: "50%",
//           width: "70px",
//           height: "70px",
//           fontSize: "22px",
//           fontWeight: "bold",
//           boxShadow: "0px 4px 12px rgba(0,0,0,0.3)",
//           cursor: "pointer",
//           zIndex: 9999,
//           transition: "transform 0.2s ease-in-out",
//         }}
//         onMouseEnter={(e) => (e.target.style.transform = "scale(1.1)")}
//         onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
//         title="Gửi tín hiệu khẩn cấp"
//       >
//         <i className="fas fa-exclamation-triangle"></i>
//       </button>

//       {/* 🧭 Popup SOS */}
//       {showPopup && (
//         <div
//           style={{
//             position: "fixed",
//             bottom: "110px",
//             right: "20px",
//             backgroundColor: "#fff",
//             border: "2px solid #1976d2",
//             borderRadius: "10px",
//             padding: "15px",
//             width: "320px",
//             boxShadow: "0 4px 1~0px rgba(0,0,0,0.2)",
//             zIndex: 9999,
//             overflowY: "auto",
//             maxHeight: "80vh",
//           }}
//         >
//           <h5 style={{ marginBottom: "10px" }}>📞 Gửi tín hiệu khẩn cấp</h5>

//           <label
//             style={{ fontSize: "14px", display: "block", marginBottom: "6px" }}
//           >
//             Nhập số điện thoại liên hệ:
//           </label>
//           <input
//             type="tel"
//             value={phoneNumber}
//             onChange={(e) => setPhoneNumber(e.target.value)}
//             placeholder="Ví dụ: 0901234567"
//             style={{
//               width: "100%",
//               padding: "6px",
//               marginBottom: "10px",
//               borderRadius: "6px",
//               border: "1px solid #ccc",
//               outline: "none",
//             }}
//           />

//           <button
//             onClick={sendSOS}
//             disabled={loading}
//             style={{
//               width: "100%",
//               padding: "8px",
//               backgroundColor: loading ? "#888" : "#d32f2f",
//               color: "white",
//               border: "none",
//               borderRadius: "6px",
//               cursor: "pointer",
//               fontWeight: "bold",
//               marginBottom: "10px",
//             }}
//           >
//             {loading ? "Đang gửi..." : "🚨 Gửi SOS"}
//           </button>

//           {/* 🩺 Hướng dẫn sơ cứu */}
//           <h5>🩺 Hướng dẫn sơ cứu</h5>
//           <ul
//             style={{ fontSize: "14px", lineHeight: "1.6", paddingLeft: "18px" }}
//           >
//             <li>Ngồi xuống, hít thở sâu.</li>
//             <li>Giữ bình tĩnh, đếm từ 1 đến 10.</li>
//             <li>Liên hệ người hỗ trợ qua các số điện thoại:</li>
//             <ul style={{ marginTop: "6px", marginBottom: "10px" }}>
//               <li>
//                 Tổng đài Quốc gia Bảo vệ Trẻ em: <strong>111</strong>
//               </li>
//               <li>
//                 Đường dây nóng "Ngày mai": <strong>1900 561 295</strong>
//               </li>
//               <li>
//                 Viện Sức khỏe Tâm thần: <strong>0984 104 115</strong>
//               </li>
//             </ul>
//           </ul>

//           {/* 📍 Hiển thị địa chỉ nếu có */}
//           {address && (
//             <p style={{ fontSize: "13px", marginTop: "10px", color: "#444" }}>
//               <strong>📍 Vị trí hiện tại:</strong>
//               <br />
//               {address}
//               <br />
//               <button
//                 onClick={() =>
//                   window.open(
//                     `https://www.google.com/maps?q=${encodeURIComponent(
//                       address
//                     )}`,
//                     "_blank"
//                   )
//                 }
//                 style={{
//                   marginTop: "6px",
//                   padding: "5px 8px",
//                   borderRadius: "5px",
//                   border: "none",
//                   backgroundColor: "#1976d2",
//                   color: "white",
//                   cursor: "pointer",
//                 }}
//               >
//                 🗺️ Xem trên bản đồ
//               </button>
//             </p>
//           )}

//           <button
//             onClick={() => setShowPopup(false)}
//             style={{
//               marginTop: "10px",
//               width: "100%",
//               padding: "6px",
//               backgroundColor: "#1976d2",
//               color: "white",
//               border: "none",
//               borderRadius: "6px",
//               cursor: "pointer",
//             }}
//           >
//             Đóng
//           </button>
//         </div>
//       )}
//     </>
//   );
// }

// export default SOSButton;

import React, { useState, useEffect } from "react";
import api from "../services/api";
import NotificationService from "../services/notificationService";
import "./SOSButton.css"; // Tạo file CSS riêng cho styling

function SOSButton({ userId, userProfile }) {
  const [showPopup, setShowPopup] = useState(false);
  const [address, setAddress] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [locationError, setLocationError] = useState(false);
  const [emergencyType, setEmergencyType] = useState("panic");
  const [message, setMessage] = useState("");
  const [isSilent, setIsSilent] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);

  // Danh sách loại khẩn cấp
  const emergencyTypes = [
    { value: "panic", label: "🚨 Khẩn cấp chung", color: "#d32f2f" },
    { value: "medical", label: "🏥 Y tế", color: "#1976d2" },
    { value: "fire", label: "🔥 Hỏa hoạn", color: "#f57c00" },
    { value: "police", label: "👮 Cảnh sát", color: "#303f9f" },
    { value: "other", label: "📋 Khác", color: "#5d4037" },
  ];

  // Danh sách tin nhắn mẫu
  const sampleMessages = [
    "Tôi đang gặp sự cố, cần hỗ trợ gấp!",
    "Cần hỗ trợ y tế khẩn cấp",
    "Báo cháy khẩn cấp",
    "Cần sự hỗ trợ của cảnh sát",
    "Gặp sự cố, cần trợ giúp",
  ];

  // Lấy thông tin từ userProfile nếu có
  useEffect(() => {
    if (userProfile?.phoneNumber) {
      setPhoneNumber(userProfile.phoneNumber);
    }
  }, [userProfile]);

  // Hàm lấy vị trí
  const getLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Trình duyệt không hỗ trợ định vị GPS."));
        return;
      }

      setLocationLoading(true);
      setLocationError(false);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationLoading(false);
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          });
        },
        (error) => {
          setLocationLoading(false);
          setLocationError(true);
          let errorMessage = "Không thể lấy vị trí.";

          switch (error.code) {
            case error.PERMISSION_DENIED:
              errorMessage = "Bạn đã từ chối quyền truy cập vị trí.";
              break;
            case error.POSITION_UNAVAILABLE:
              errorMessage = "Thông tin vị trí không khả dụng.";
              break;
            case error.TIMEOUT:
              errorMessage = "Yêu cầu vị trí đã hết thời gian chờ.";
              break;
          }

          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 0,
        }
      );
    });
  };

  // Hàm gửi SOS
  const sendSOS = async () => {
    // Validation
    if (!phoneNumber) {
      NotificationService.error({
        title: "Vui lòng nhập số điện thoại!",
        text: "⚠️ Vui lòng nhập số điện thoại liên hệ khẩn cấp",
        confirmButtonText: "Đã hiểu",
      });
      return;
    }

    if (!/^[0-9]{10,11}$/.test(phoneNumber.replace(/\D/g, ""))) {
      NotificationService.error({
        title: "Số điện thoại không hợp lệ!",
        text: "⚠️ Vui lòng nhập số điện thoại 10-11 chữ số",
        confirmButtonText: "Đã hiểu",
      });
      return;
    }

    setLoading(true);

    try {
      // Lấy vị trí
      const location = await getLocation();

      // Lấy địa chỉ từ tọa độ (nếu cần)
      let fullAddress = address;
      if (!fullAddress && location) {
        try {
          // Gọi API reverse geocoding
          const geocodeResponse = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${location.latitude}&lon=${location.longitude}`
          );
          const geocodeData = await geocodeResponse.json();
          fullAddress = geocodeData.display_name || "Không xác định địa chỉ";
          setAddress(fullAddress);
        } catch (error) {
          console.error("Reverse geocoding error:", error);
          fullAddress = "Không xác định địa chỉ";
        }
      }

      // Chuẩn bị dữ liệu gửi
      const emergencyData = {
        userId: userId || null,
        phoneNumber,
        type: emergencyType,
        latitude: location.latitude,
        longitude: location.longitude,
        locationAccuracy: location.accuracy,
        address: fullAddress,
        message: message || "Tôi đang gặp sự cố, cần hỗ trợ gấp!",
        isSilent,
        priority: emergencyType === "panic" ? "critical" : "high",
        deviceInfo: {
          battery: navigator.getBattery
            ? (await (await navigator.getBattery()).level) * 100
            : null,
          network: navigator.connection
            ? navigator.connection.effectiveType
            : "unknown",
          os: navigator.platform,
          appVersion: "1.0.0",
        },
      };

      // Gửi yêu cầu SOS
      const response = await api.post(
        `${
          process.env.REACT_APP_API_URL || "http://localhost:5000"
        }/api/emergency/sos`,
        emergencyData
      );

      const result = await response.data;

      if (result.success) {
        NotificationService.success({
          title: "🚨 Đã gửi tín hiệu SOS thành công!",
          text: `Yêu cầu khẩn cấp của bạn đã được ghi nhận. Đội ngũ hỗ trợ sẽ liên hệ với bạn qua số ${phoneNumber}`,
          timer: 5000,
          showConfirmButton: true,
          confirmButtonText: "Đã hiểu",
        });

        // Reset form
        setMessage("");
        setShowPopup(false);

        // Log activity
        console.log("SOS sent:", {
          type: emergencyType,
          location: { lat: location.latitude, lng: location.longitude },
          time: new Date().toLocaleString(),
        });
      } else {
        throw new Error(result.message || "Gửi SOS thất bại");
      }
    } catch (error) {
      console.error("SOS Error:", error);
      NotificationService.error({
        title: "❌ Gửi SOS thất bại",
        text: error.message || "Không thể gửi tín hiệu SOS. Vui lòng thử lại.",
        confirmButtonText: "Đã hiểu",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* 🚨 Nút SOS chính */}
      <div className="sos-button-container">
        <button
          className={`sos-button ${showPopup ? "active" : ""}`}
          onClick={() => setShowPopup(!showPopup)}
          title="Gửi tín hiệu khẩn cấp"
          aria-label="Gửi tín hiệu khẩn cấp"
        >
          <div className="sos-icon">
            <i className="fas fa-exclamation-triangle"></i>
          </div>
          <div className="sos-pulse-ring"></div>
          <div className="sos-pulse-ring delay-1"></div>
          <div className="sos-pulse-ring delay-2"></div>
        </button>

        {/* Nhãn SOS */}
        <div className="sos-label">SOS</div>
      </div>

      {/* 🧭 Popup SOS */}
      {showPopup && (
        <div className="sos-popup">
          {/* Header */}
          <div className="sos-popup-header">
            <div className="sos-popup-title">
              <i className="fas fa-exclamation-circle"></i>
              <h4>Gửi tín hiệu khẩn cấp</h4>
            </div>
            <button
              className="sos-popup-close"
              onClick={() => setShowPopup(false)}
              aria-label="Đóng popup"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>

          {/* Body */}
          <div className="sos-popup-body">
            {/* Loại khẩn cấp */}
            <div className="sos-section">
              <label className="sos-label">Loại khẩn cấp *</label>
              <div className="emergency-type-grid">
                {emergencyTypes.map((type) => (
                  <button
                    key={type.value}
                    className={`emergency-type-btn ${
                      emergencyType === type.value ? "selected" : ""
                    }`}
                    onClick={() => setEmergencyType(type.value)}
                    style={{
                      borderColor: type.color,
                      backgroundColor:
                        emergencyType === type.value ? type.color : "white",
                      color:
                        emergencyType === type.value ? "white" : type.color,
                    }}
                  >
                    <span className="type-icon">
                      {type.label.split(" ")[0]}
                    </span>
                    <span className="type-label">
                      {type.label.split(" ").slice(1).join(" ")}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Số điện thoại */}
            <div className="sos-section">
              <label className="sos-label">
                <i className="fas fa-phone"></i> Số điện thoại liên hệ *
              </label>
              <div className="phone-input-group">
                <div className="phone-prefix">+84</div>
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    const value = e.target.value.replace(/\D/g, "");
                    setPhoneNumber(value.slice(0, 11));
                  }}
                  placeholder="912345678"
                  className="sos-input"
                  maxLength="11"
                />
              </div>
              {phoneNumber && !/^[0-9]{10,11}$/.test(phoneNumber) && (
                <small className="text-danger">
                  ⚠️ Số điện thoại phải có 10-11 chữ số
                </small>
              )}
            </div>

            {/* Tin nhắn */}
            <div className="sos-section">
              <label className="sos-label">
                <i className="fas fa-comment-alt"></i> Tin nhắn khẩn cấp
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Mô tả tình huống của bạn..."
                className="sos-textarea"
                rows="3"
              />
              <div className="sample-messages">
                {sampleMessages.map((sample, index) => (
                  <button
                    key={index}
                    className="sample-message-btn"
                    onClick={() => setMessage(sample)}
                  >
                    {sample}
                  </button>
                ))}
              </div>
            </div>

            {/* Chế độ im lặng */}
            <div className="sos-section">
              <label className="sos-switch">
                <input
                  type="checkbox"
                  checked={isSilent}
                  onChange={(e) => setIsSilent(e.target.checked)}
                />
                <span className="sos-slider"></span>
                <span className="sos-switch-label">
                  <i className="fas fa-volume-mute"></i> Chế độ im lặng (không
                  phát âm thanh)
                </span>
              </label>
              <small className="text-muted">
                Chế độ này hữu ích khi bạn cần giữ im lặng
              </small>
            </div>

            {/* Vị trí */}
            <div className="sos-section">
              <div className="location-info">
                <div className="location-header">
                  <label className="sos-label">
                    <i className="fas fa-map-marker-alt"></i> Vị trí hiện tại
                  </label>
                  {locationLoading && (
                    <span className="location-loading">
                      <i className="fas fa-spinner fa-spin"></i> Đang lấy vị
                      trí...
                    </span>
                  )}
                </div>

                {locationError && (
                  <div className="location-error">
                    <i className="fas fa-exclamation-triangle"></i>
                    <span>
                      Không thể lấy vị trí. Vui lòng kiểm tra quyền truy cập
                      GPS.
                    </span>
                  </div>
                )}

                {address && (
                  <div className="address-display">
                    <strong>📍 Địa chỉ:</strong>
                    <p>{address}</p>
                    <button
                      className="view-map-btn"
                      onClick={() =>
                        window.open(
                          `https://maps.google.com/?q=${encodeURIComponent(
                            address
                          )}`,
                          "_blank"
                        )
                      }
                    >
                      <i className="fas fa-map"></i> Xem trên bản đồ
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Hướng dẫn nhanh */}
            <div className="sos-section">
              <button
                className="instructions-toggle"
                onClick={() => setShowInstructions(!showInstructions)}
              >
                <i
                  className={`fas fa-chevron-${
                    showInstructions ? "up" : "down"
                  }`}
                ></i>
                <span>📋 Hướng dẫn sơ cứu & số điện thoại khẩn cấp</span>
              </button>

              {showInstructions && (
                <div className="instructions-content">
                  <div className="first-aid-tips">
                    <h6>🩺 Hướng dẫn sơ cứu nhanh:</h6>
                    <ul>
                      <li>Giữ bình tĩnh, hít thở sâu và chậm</li>
                      <li>Tìm nơi an toàn để tránh nguy hiểm</li>
                      <li>Nếu bị thương, cố gắng cầm máu bằng vải sạch</li>
                      <li>
                        Chuẩn bị sẵn thông tin cá nhân và bệnh án (nếu có)
                      </li>
                    </ul>
                  </div>

                  <div className="emergency-contacts">
                    <h6>📞 Số điện thoại khẩn cấp:</h6>
                    <div className="contact-grid">
                      <div className="contact-item">
                        <div className="contact-icon">🚓</div>
                        <div>
                          <strong>Công an</strong>
                          <div className="contact-number">113</div>
                        </div>
                      </div>
                      <div className="contact-item">
                        <div className="contact-icon">🚑</div>
                        <div>
                          <strong>Cấp cứu</strong>
                          <div className="contact-number">115</div>
                        </div>
                      </div>
                      <div className="contact-item">
                        <div className="contact-icon">🚒</div>
                        <div>
                          <strong>PCCC</strong>
                          <div className="contact-number">114</div>
                        </div>
                      </div>
                      <div className="contact-item">
                        <div className="contact-icon">👶</div>
                        <div>
                          <strong>Trẻ em</strong>
                          <div className="contact-number">111</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="sos-popup-footer">
            <div className="sos-disclaimer">
              <small>
                <i className="fas fa-info-circle"></i>
                Sử dụng tính năng này chỉ trong trường hợp thực sự khẩn cấp
              </small>
            </div>
            <div className="sos-actions">
              <button
                className="sos-cancel-btn"
                onClick={() => setShowPopup(false)}
                disabled={loading}
              >
                Hủy
              </button>
              <button
                className="sos-submit-btn"
                onClick={sendSOS}
                disabled={loading || locationLoading || !phoneNumber}
                style={{
                  backgroundColor: emergencyTypes.find(
                    (t) => t.value === emergencyType
                  )?.color,
                }}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Đang gửi...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane"></i> GỬI TÍN HIỆU KHẨN CẤP
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SOSButton;
