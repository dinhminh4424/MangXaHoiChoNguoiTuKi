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
    {
      value: "panic",
      label: "🚨 Khẩn cấp chung",
      color: "#d32f2f",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="29"
          height="29"
          viewBox="0 0 48 48"
        >
          <defs>
            <path
              id="streamlineEmojisPoliceCarLight0"
              fill="#ff6242"
              d="m12.86 38.1l1.9-16.33a2.6 2.6 0 0 1 2.58-2.3h13.45a2.6 2.6 0 0 1 2.58 2.3l1.9 16.33Z"
            />
          </defs>
          <use href="#streamlineEmojisPoliceCarLight0" />
          <use href="#streamlineEmojisPoliceCarLight0" />
          <path
            fill="#ff866e"
            d="M16.9 22.87h14.33a2.8 2.8 0 0 1 2.43 1.36l-.29-2.46a2.6 2.6 0 0 0-2.58-2.3H17.34a2.6 2.6 0 0 0-2.58 2.3l-.29 2.46a2.79 2.79 0 0 1 2.43-1.36Z"
          />
          <path
            fill="none"
            stroke="#45413c"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m12.86 38.1l1.9-16.33a2.6 2.6 0 0 1 2.58-2.3h13.45a2.6 2.6 0 0 1 2.58 2.3l1.9 16.33Z"
          />
          <path fill="#c0dceb" d="M11.37 38.1H36.5V42H11.37Z" />
          <path
            fill="#daedf7"
            d="M35.64 38.1h-23.4a.87.87 0 0 0-.87.87v2a.87.87 0 0 1 .87-.87h23.4a.86.86 0 0 1 .86.87V39a.86.86 0 0 0-.86-.9Z"
          />
          <path
            fill="none"
            stroke="#45413c"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.37 38.1H36.5V42H11.37Z"
          />
          <path fill="#87898c" d="M22.27 33.33h3.47v4.77h-3.47z" />
          <path fill="#656769" d="M22.27 33.33h3.47v1.61h-3.47z" />
          <path
            fill="none"
            stroke="#45413c"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M22.27 33.33h3.47v4.77h-3.47z"
          />
          <path
            fill="#ffe500"
            d="M24 26.4a3 3 0 0 0-3 3v3a.86.86 0 0 0 .86.86h4.34a.86.86 0 0 0 .86-.86v-3a3 3 0 0 0-3.06-3Z"
          />
          <path
            fill="#fff48c"
            d="M24 26.4a3 3 0 0 0-3 3v1.95a3 3 0 1 1 6.06 0v-1.91A3 3 0 0 0 24 26.4Z"
          />
          <path
            fill="none"
            stroke="#45413c"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M24 26.4a3 3 0 0 0-3 3v3a.86.86 0 0 0 .86.86h4.34a.86.86 0 0 0 .86-.86v-3a3 3 0 0 0-3.06-3Z"
          />
          <path
            fill="#ffe500"
            stroke="#45413c"
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M36.34 9.12a.51.51 0 0 0-.45-.12a.54.54 0 0 0-.38.28l-3.29 6.27a.52.52 0 0 0 .11.64a.53.53 0 0 0 .65 0l5.78-3.93a.51.51 0 0 0 .23-.4a.53.53 0 0 0-.16-.43ZM22.22 5.4a.58.58 0 0 0-.45.2a.51.51 0 0 0-.1.46l1.91 6.85a.55.55 0 0 0 .54.4a.56.56 0 0 0 .54-.41l1.67-6.81a.5.5 0 0 0-.1-.44a.55.55 0 0 0-.43-.21Zm24.2 17.54a.53.53 0 0 1-.42.73l-7 .9a.53.53 0 0 1-.37-1l5.71-4a.52.52 0 0 1 .45-.08a.53.53 0 0 1 .34.31Zm-.25 12.5a.5.5 0 0 1-.3.35a.49.49 0 0 1-.47 0l-6.14-3.54a.53.53 0 0 1 .28-1l7 .23a.55.55 0 0 1 .41.21a.56.56 0 0 1 .09.45ZM11.66 9.12a.51.51 0 0 1 .45-.12a.54.54 0 0 1 .38.28l3.29 6.27a.52.52 0 0 1-.11.64a.53.53 0 0 1-.65 0l-5.78-3.91a.51.51 0 0 1-.23-.4a.53.53 0 0 1 .16-.43ZM1.58 22.94a.49.49 0 0 0 0 .47a.49.49 0 0 0 .39.26l7 .9a.53.53 0 0 0 .37-1l-5.71-4a.52.52 0 0 0-.45-.08a.53.53 0 0 0-.34.31Zm.25 12.5a.5.5 0 0 0 .3.35a.49.49 0 0 0 .47 0l6.14-3.54a.53.53 0 0 0-.28-1l-7 .23a.55.55 0 0 0-.41.21a.56.56 0 0 0-.09.45Z"
          />
          <path
            fill="#45413c"
            d="M10 42.5a14 1.5 0 1 0 28 0a14 1.5 0 1 0-28 0Z"
            opacity=".15"
          />
        </svg>
      ),
    },
    {
      value: "medical",
      label: "🏥 Y tế",
      color: "#1976d2",
      icon: (
        <svg
          width="29"
          height="29"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 14 14"
        >
          <g fill="none" fillRule="evenodd" clipRule="evenodd">
            <path
              fill="#2859c5"
              d="M3.656.469A2.12 2.12 0 0 1 4.999 0H9c.474 0 .96.153 1.343.469c.389.32.658.8.658 1.354V3.47a1 1 0 1 1-2 0V2H4.998v1.47a1 1 0 1 1-2 0V1.823c0-.553.268-1.034.657-1.354Z"
            />
            <path
              fill="#8fbffa"
              d="M1.5 3.366C.69 3.366 0 4 0 4.826v7.684c0 .825.69 1.46 1.5 1.46h11c.81 0 1.5-.635 1.5-1.46V4.826c0-.825-.69-1.46-1.5-1.46z"
            />
            <path
              fill="#2859c5"
              d="M7.625 6.668a.625.625 0 1 0-1.25 0v1.375H5a.625.625 0 1 0 0 1.25h1.375v1.375a.625.625 0 1 0 1.25 0V9.293H9a.625.625 0 1 0 0-1.25H7.625z"
            />
          </g>
        </svg>
      ),
    },
    {
      value: "fire",
      label: "🔥 Hỏa hoạn",
      color: "#f57c00",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="29"
          height="29"
          viewBox="0 0 64 64"
        >
          <path
            fill="#dc603a"
            d="M13.825 59.29c6.132 2.422 14.432 4.941 21.05 4.349c9.646-.863 28.496-4.827 28.496-21.414c0-.161-.385-1.363-.518-1.41c-.773-2.01-1.688-3.815-3.03-5.704c-1.783-2.515-3.66-11.853-2.58-14.859c.062-.169-.277-.318-.428-.31c-3.863.263-7.578 6.06-8.02 9.388C36.003 15.077 38.851 3.27 40.775.381a.097.097 0 0 0 .029-.095c.002-.176-.346-.352-.523-.263c-12.213 2.34-26.984 24.403-26.28 27.714c-2.549-1.622-.889-10.362.062-12.818c.078-.199-.381-.385-.546-.275c-2.752 1.825-7.116 7.08-11.732 20.843s5.649 21.271 12.04 23.803"
          />
          <path
            fill="#f1ea37"
            d="M55.03 38.39c-.809 3.108-1.281 6.589-5.766 7.55c-7.559 1.626-3.629-9.951-3.943-12.742c-.531-4.628-5.562-7.8-10.729-9.536c-.201-.068 5.926 8.02-3.464 9.956c-2.928.605-5.839-.97-6.259-3.536c-.195-1.224.461-4.793.22-4.624c-2.316 1.605-4.611 3.421-4.874 5.937c-.169 1.673.665 3.485 1.01 5.12c.559 2.693-.479 4.92-4.442 4.946c-4.87.029-3.417-8.508-3.426-8.487c-.099-.08-18.435 17.15 9.283 29.12c8.07 3.485 21.808.915 28.753-3.519c9-5.746 4.223-22.447 3.639-20.19"
          />
        </svg>
      ),
    },
    {
      value: "police",
      label: "👮 Cảnh sát",
      color: "#303f9f",
      icon: (
        <svg
          width="29"
          height="29"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
        >
          <g fill="none">
            <path
              fill="#fff"
              d="M21.8 20.33L12 18.37l-9.8 1.96l-.98 2.94h21.56zM6.12 8.57v.98H4.16V12l1.96.98v1.96L12 17.39l5.88-2.45v-1.96l1.96-.98V9.55h-1.96v-.98l.49-1.96l2.94-1.47l-2.45-2.45L12 .73L5.14 2.69L2.69 5.14l2.94 1.47z"
            />
            <path
              fill="#bbd8ff"
              d="M18.37 6.61H12v3.43l5.88-1.47zm-4.998 14.602L12 18.37l-1.372 2.842L12 23.27zM18.468 4.65L12.98 2.984V4.16l-.98.98l-.98-.98V2.984L5.532 4.65L4.258 5.924l1.372.686h12.74l1.372-.686z"
            />
            <path
              stroke="#092f63"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeMiterlimit="10"
              d="M17.88 8.57v6.37L12 17.39l-5.88-2.45V8.57m11.76.98h1.96V12l-1.96.98M6.12 9.55H4.16V12l1.96.98m3.92-2.45v.98m3.92-.98v.98"
            />
            <path
              stroke="#092f63"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeMiterlimit="10"
              d="m10.53 14.45l1.47.49l1.47-.49m-6.86 4.998l-.98 1.862l1.96 1.96m9.8-3.822l.98 1.862l-1.96 1.96m-1.47-4.312L12 23.27l-2.94-4.312"
            />
            <path
              stroke="#092f63"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeMiterlimit="10"
              d="m22.78 23.27l-.98-2.94l-9.8-1.96l-9.8 1.96l-.98 2.94M18.37 6.61l-.49 1.96L12 10.04L6.12 8.57l-.49-1.96m7.35-2.45l-.98.98l-.98-.98V2.69h1.96z"
            />
            <path
              stroke="#092f63"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeMiterlimit="10"
              d="m18.37 6.61l2.94-1.47l-2.45-2.45L12 .73L5.14 2.69L2.69 5.14l2.94 1.47zm-4.998 14.602L12 18.37l-1.372 2.842L12 23.27z"
            />
          </g>
        </svg>
      ),
    },
    {
      value: "other",
      label: "📋 Khác",
      color: "#5d4037",
      icon: (
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="29"
          height="29"
          viewBox="0 0 24 24"
        >
          <path
            fill="#372020"
            d="M15.25 18.75q.3 0 .525-.225T16 18q0-.3-.225-.525t-.525-.225q-.3 0-.525.225T14.5 18q0 .3.225.525t.525.225Zm2.75 0q.3 0 .525-.225T18.75 18q0-.3-.225-.525T18 17.25q-.3 0-.525.225T17.25 18q0 .3.225.525t.525.225Zm2.75 0q.3 0 .525-.225T21.5 18q0-.3-.225-.525t-.525-.225q-.3 0-.525.225T20 18q0 .3.225.525t.525.225ZM18 23q-2.075 0-3.538-1.463T13 18q0-2.075 1.463-3.538T18 13q2.075 0 3.538 1.463T23 18q0 2.075-1.463 3.538T18 23ZM8 9h8q.425 0 .713-.288T17 8q0-.425-.288-.713T16 7H8q-.425 0-.713.288T7 8q0 .425.288.713T8 9Zm3.675 12H5q-.825 0-1.413-.588T3 19V5q0-.825.588-1.413T5 3h14q.825 0 1.413.588T21 5v6.7q-.725-.35-1.463-.525T18 11q-.275 0-.513.012t-.487.063q-.225-.05-.5-.062T16 11H8q-.425 0-.713.288T7 12q0 .425.288.713T8 13h5.125q-.45.425-.813.925T11.675 15H8q-.425 0-.713.288T7 16q0 .425.288.713T8 17h3.075q-.05.25-.063.488T11 18q0 .825.15 1.538T11.675 21Z"
          />
        </svg>
      ),
    },
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
  // Hàm lấy vị trí - PHIÊN BẢN CẢI TIẾN
  const getLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error("Trình duyệt không hỗ trợ định vị GPS."));
        return;
      }

      const tryGetPosition = (options) => {
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
            if (error.code === error.TIMEOUT) {
              errorMessage = "Yêu cầu vị trí đã hết thời gian chờ.";
            } else if (error.code === error.PERMISSION_DENIED) {
              errorMessage = "Bạn đã từ chối quyền truy cập vị trí.";
            } else if (error.code === error.POSITION_UNAVAILABLE) {
              errorMessage = "Thông tin vị trí không khả dụng.";
            }

            // Fallback: nếu timeout và đang dùng high accuracy → thử lại với low accuracy
            if (error.code === error.TIMEOUT && options.enableHighAccuracy) {
              console.log(
                "Timeout với high accuracy → thử lại với low accuracy"
              );
              tryGetPosition({
                enableHighAccuracy: false,
                timeout: 15000,
                maximumAge: 60000,
              });
              return;
            }

            reject(new Error(errorMessage));
          },
          options
        );
      };

      // Bắt đầu với high accuracy + timeout dài hơn
      tryGetPosition({
        enableHighAccuracy: true,
        timeout: 30000, // Tăng từ 10s → 30s
        maximumAge: 60000, // Cho phép cache vị trí trong 1 phút
      });
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
                      {/* {type.label.split(" ")[0]} */}
                      {type?.icon ?? type.label.split(" ")[0]}
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
                <span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="25"
                    height="25"
                    viewBox="0 0 128 128"
                  >
                    <path
                      fill="#fff"
                      d="M51.5 112.44c11.71-11.39 29.92-29.4 33.82-33.47c4.85-5.05 3.4-9.17 1.34-13.71c-.67-1.49-11.67-26.33-18.74-42.36c.29-.14 2.98-2.04 3.64-2.33c2.1-.94 3.48.64 4.41 2.6c.68 1.45 16.51 46.98 20.37 57.32c.63 1.68 2.14 3.88 1.29 5.73c-.95 2.07-4.79 3.36-6.63 4.49c-2.33 1.42-4.72 2.74-7.13 4.01c-4.76 2.51-9.61 4.86-14.27 7.55c-5.6 3.23-11.27 6.29-16.9 9.45c-.39.23-.79.48-1.2.72z"
                    />
                    <path
                      fill="#fff"
                      d="M110.92 101.1c-.77.33-1.61.56-2.13.76c-10.77 4.13-22 6.84-33.11 9.9c-6.21 1.71-12.4 3.53-18.57 5.37c-.88.27-2.03.64-3.31 1.06c5.29-2.93 10.61-5.8 15.84-8.83c3.96-2.29 8.01-4.39 12.05-6.53c4.84-2.56 9.66-5.17 14.25-8.16c2.15-1.41 5.05-2.1 6.7-4.19c1.7-2.14 1.6-5.25.84-7.74c-3.63-11.72-7.28-23.45-11.86-34.83c-2.17-5.41-4.35-10.82-6.01-16.41c-.26-.86-.53-1.82-.8-2.82c4.45-2.53 3.9-.83 5.93 3.81c3.41 7.79 6.56 15.51 9.12 23.62c.77 2.41 1.51 4.81 2.26 7.22c2.04 6.54 4.09 13.08 6.13 19.62c.94 3.03 1.89 6.07 2.85 9.1c.82 2.71 3.54 7.47-.18 9.05z"
                    />
                    <path
                      fill="#2f2f2f"
                      d="M17.21 40.16c-1.75 2.11-5.68 6.84-6.08 7.32c-3.02 3.58-3.17 7.66-2.67 10.39c.92 5.06 12.68 49.12 19.42 63.4c.72 1.54 1.57 2.59 2.51 3.28c5.37 7.05 22.41.16 28.39-1.45c8.73-2.36 17.55-4.46 26.24-7.01c8.72-2.56 17.24-5.5 25.88-8.29c2.73-.88 5.9-1.95 7.57-4.46c2.06-3.09 1.32-7.39.32-11.04c-2.1-7.61-5.05-14.94-7.69-22.37c-3.45-9.71-6.32-19.63-10.27-29.16c-1.24-3-2.52-5.97-3.85-8.93c-1.06-2.36-1.67-4.94-2.92-7.21c-1.94-3.48-3.73-4.03-7.5-2.64c-.93.35-2.54 1.08-3.5.5c-.73-.44-.86-1.69-1.12-2.43c-.51-1.45-1.12-3.19-2-4.47c-.33-.48-.69-1.04-1.06-1.48c-.5-.59-3.54-2.01-8.57.12c-1.22.52-16.11 9.48-16.11 9.48L17.21 40.16zm34.29 72.28C36.77 89.12 42.29 49.37 67.93 22.9c.29-.14 2.98-2.04 3.64-2.33c2.1-.94 3.48.64 4.41 2.6c.68 1.45 16.51 46.98 20.37 57.32c.63 1.68 2.14 3.88 1.29 5.73c-.95 2.07-4.79 3.36-6.63 4.49c-2.33 1.42-4.72 2.74-7.13 4.01c-4.76 2.51-9.61 4.86-14.27 7.55c-5.6 3.23-11.27 6.29-16.9 9.45c-.4.23-.8.48-1.21.72zm59.42-11.34c-.77.33-1.61.56-2.13.76c-10.77 4.13-22 6.84-33.11 9.9c-6.21 1.71-12.4 3.53-18.57 5.37c-.88.27-2.03.64-3.31 1.06c5.29-2.93 10.61-5.8 15.84-8.83c3.96-2.29 8.01-4.39 12.05-6.53c4.84-2.56 9.66-5.17 14.25-8.16c2.15-1.41 5.05-2.1 6.7-4.19c1.7-2.14 1.6-5.25.84-7.74c-3.63-11.72-7.28-23.45-11.86-34.83c-2.17-5.41-4.35-10.82-6.01-16.41c-.26-.86-.53-1.82-.8-2.82c4.45-2.53 3.9-.83 5.93 3.81c3.41 7.79 6.56 15.51 9.12 23.62c.77 2.41 1.51 4.81 2.26 7.22c2.04 6.54 4.09 13.08 6.13 19.62c.94 3.03 1.89 6.07 2.85 9.1c.82 2.71 3.54 7.47-.18 9.05z"
                    />
                    <path
                      fill="#fcc21b"
                      d="m45.07 118.27l9.82-9.13c11.56-11.29 26.89-26.47 30.43-30.16c4.85-5.05 3.4-9.17 1.34-13.71c-.44-.98-25.68-58.43-26.29-59.72C58.48 1.59 55.96-.22 53.52.5c-.82.24-1.58.59-2.3 1.02c-1.18.71-3.65 2.94-5.9 5.1c-1.47 1.4-18.62 22.09-28.11 33.54c0 0 24.14 74.4 24.96 77.2c.82 2.81 2.9.91 2.9.91z"
                    />
                    <path
                      fill="#2f2f2f"
                      d="M50.3 35.27c.54-.45 1.14-.89 1.65-1.38c.78-.76 2.26-2.05 2.12-3.23c-.07-.66-.41-1.18-.93-1.45c-.23-.12-.51-.19-.82-.2c-1.86-.03-3.88 1.63-5.18 2.77c-.9.78-1.92 1.44-2.85 2.17c-1.97 1.55-3.62 3.51-5.48 5.2c-1.71 1.57-3.04 3.48-4.56 5.21c-1.5 1.7-3.18 3.21-4.61 4.98c-.52.64-1.06 1.16-.95 2.03c.11.86.78 1.9 1.58 2.26c1.27.57 2.39-1.07 3.17-1.78c5.9-5.31 10.74-11.48 16.86-16.58zm5.22 3.24c-1.67.79-3.46 2.75-4.17 3.45c-2.41 2.37-5.4 4.44-7.62 6.93c-1.34 1.5-2.7 2.99-4.2 4.33c-1.71 1.52-3.92 3.03-5.12 5.01c-.76 1.24-1.01 3.62.79 4.13c2.26.65 3.44-2.66 4.82-3.86c2.04-1.78 4.33-3.28 6.27-5.19c2.29-2.27 4.4-4.71 6.69-6.99c1.26-1.25 5.78-3.9 5.77-5.72c0-.77-.24-1.25-.74-1.84c-.63-.76-1.54-.69-2.49-.25z"
                    />
                  </svg>{" "}
                  Hướng dẫn sơ cứu & số điện thoại khẩn cấp
                </span>
              </button>

              {showInstructions && (
                <div className="instructions-content">
                  <div className="first-aid-tips">
                    <h6>
                      <svg
                        width="25"
                        height="25"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 24 24"
                      >
                        <g fill="none">
                          <path
                            fill="#e3e3e3"
                            d="M18.695 20.13a1.913 1.913 0 1 0 0-3.826a1.913 1.913 0 0 0 0 3.826"
                          />
                          <path
                            fill="#fff"
                            d="M18.695 16.304a1.913 1.913 0 0 0-1.36 3.257l2.704-2.704a1.9 1.9 0 0 0-1.344-.553"
                          />
                          <path
                            fill="#66e1ff"
                            d="M13.913 1H7.217a.957.957 0 0 0-.956.957v10.521c0 .529.428.957.956.957h6.696a.957.957 0 0 0 .956-.957V1.957A.956.956 0 0 0 13.913 1"
                          />
                          <path
                            fill="#c2f3ff"
                            d="M14.7 1.444A.94.94 0 0 0 13.912 1H7.217a.957.957 0 0 0-.956.957v7.925z"
                          />
                          <path
                            stroke="#191919"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M10.565 17.26v3.827a1.913 1.913 0 0 0 3.826 0v-.478a2.39 2.39 0 0 1 2.391-2.392"
                          />
                          <path
                            stroke="#191919"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M18.695 20.13a1.913 1.913 0 1 0 0-3.826a1.913 1.913 0 0 0 0 3.826M13.913 1H7.217a.957.957 0 0 0-.956.957v10.521c0 .529.428.957.956.957h6.696a.957.957 0 0 0 .956-.957V1.957A.956.956 0 0 0 13.913 1"
                          />
                          <path
                            stroke="#191919"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M10.565 10.326a.24.24 0 0 1 .24.24"
                          />
                          <path
                            stroke="#191919"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M10.326 10.565a.24.24 0 0 1 .239-.239m0 .478a.24.24 0 0 1-.24-.239"
                          />
                          <path
                            stroke="#191919"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M10.804 10.565a.24.24 0 0 1-.24.24"
                          />
                          <path
                            stroke="#191919"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M16.782 5.783a.957.957 0 0 1 .957.956v3.348a7.174 7.174 0 0 1-14.348 0V6.739a.957.957 0 0 1 .957-.956"
                          />
                        </g>
                      </svg>{" "}
                      Hướng dẫn sơ cứu nhanh:
                    </h6>
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
                    <h6>
                      <svg
                        width="30"
                        height="30"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 14 14"
                      >
                        <g fill="none" fillRule="evenodd" clipRule="evenodd">
                          <path
                            fill="#8fbffa"
                            d="M6.177 2.796a31 31 0 0 0-3.618.059c-.959.07-1.702.853-1.784 1.81C.678 5.803.582 6.978.582 8.18s.096 2.377.193 3.513c.082.958.825 1.74 1.784 1.811c1.576.116 3.066.116 4.642 0c.958-.07 1.701-.853 1.784-1.81c.095-1.11.188-2.255.193-3.427a2 2 0 0 1-1.112-1.066H7A1.75 1.75 0 0 1 5.657 4.33l.048-.057c.302-.361.467-.816.467-1.287q0-.094.005-.19"
                          />
                          <path
                            fill="#2859c5"
                            d="M3.514 11.02a.75.75 0 0 1 .75-.75h1.232a.75.75 0 0 1 0 1.5H4.264a.75.75 0 0 1-.75-.75m4.663-9.858a2.578 2.578 0 0 1 4.401 1.823c0 .763.268 1.502.757 2.088l.049.058a.5.5 0 0 1-.384.82h-2.35v.45a.75.75 0 0 1-1.5 0v-.45H7a.5.5 0 0 1-.384-.82l.049-.058a3.26 3.26 0 0 0 .757-2.088c0-.683.272-1.34.755-1.823"
                          />
                        </g>
                      </svg>{" "}
                      Số điện thoại khẩn cấp:
                    </h6>
                    <div className="contact-grid">
                      <div className="contact-item">
                        <div className="contact-icon">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="32"
                            height="32"
                            viewBox="0 0 48 48"
                          >
                            <path
                              fill="#00b8f0"
                              d="M16.28 12.08a1.65 1.65 0 0 0 1.66 1.65h4.41v-3.3h-4.41a1.65 1.65 0 0 0-1.66 1.65Z"
                            />
                            <path
                              fill="#4acfff"
                              d="M17.94 10.43a1.65 1.65 0 0 0-1.66 1.65a1.7 1.7 0 0 0 .23.83a1.65 1.65 0 0 1 1.43-.83h4.41v-1.65Z"
                            />
                            <path
                              fill="none"
                              stroke="#45413c"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M16.28 12.08a1.65 1.65 0 0 0 1.66 1.65h4.41v-3.3h-4.41a1.65 1.65 0 0 0-1.66 1.65Z"
                            />
                            <path
                              fill="#ff6242"
                              d="M31.72 12.08a1.65 1.65 0 0 1-1.66 1.65h-4.41v-3.3h4.41a1.65 1.65 0 0 1 1.66 1.65Z"
                            />
                            <path
                              fill="#ff866e"
                              d="M30.06 10.43a1.65 1.65 0 0 1 1.66 1.65a1.7 1.7 0 0 1-.23.83a1.65 1.65 0 0 0-1.43-.83h-4.41v-1.65Z"
                            />
                            <path
                              fill="none"
                              stroke="#45413c"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M31.72 12.08a1.65 1.65 0 0 1-1.66 1.65h-4.41v-3.3h4.41a1.65 1.65 0 0 1 1.66 1.65Z"
                            />
                            <path
                              fill="#87898c"
                              d="M22.9 9.88h2.2a.55.55 0 0 1 .55.55v3.31h-3.3v-3.31a.55.55 0 0 1 .55-.55Z"
                            />
                            <path
                              fill="#bdbec0"
                              d="M25.1 9.88h-2.2a.54.54 0 0 0-.55.55v1.62a.55.55 0 0 1 .55-.56h2.2a.55.55 0 0 1 .55.56v-1.62a.54.54 0 0 0-.55-.55Z"
                            />
                            <path
                              fill="none"
                              stroke="#45413c"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M22.9 9.88h2.2a.55.55 0 0 1 .55.55v3.31h0h-3.3h0v-3.31a.55.55 0 0 1 .55-.55Z"
                            />
                            <path
                              fill="#45413c"
                              d="M7.46 43.35a16.54 1.65 0 1 0 33.08 0a16.54 1.65 0 1 0-33.08 0Z"
                              opacity=".15"
                            />
                            <path
                              fill="#656769"
                              d="M10.22 35.23h5.51v8.27h-5.51Z"
                            />
                            <path
                              fill="#525252"
                              d="M10.22 35.23h5.51v6.25h-5.51Z"
                            />
                            <path
                              fill="none"
                              stroke="#45413c"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M10.22 35.23h5.51v8.27h-5.51Z"
                            />
                            <path
                              fill="#656769"
                              d="M32.27 35.23h5.51v8.27h-5.51Z"
                            />
                            <path
                              fill="#525252"
                              d="M32.27 35.23h5.51v6.25h-5.51Z"
                            />
                            <path
                              fill="none"
                              stroke="#45413c"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M32.27 35.23h5.51v8.27h-5.51Z"
                            />
                            <path
                              fill="#fff"
                              d="m36.84 25.66l-.75-4.37a8.92 8.92 0 0 0-8.84-7.7h-6.5a8.92 8.92 0 0 0-8.84 7.7l-.75 4.37a6.16 6.16 0 0 0-2 4.58v1.54h29.72v-1.54a6.16 6.16 0 0 0-2.04-4.58Z"
                            />
                            <path
                              fill="#f0f0f0"
                              d="M38.88 30.39a5.49 5.49 0 0 0 0-.58a20 20 0 0 0-9.61-2.3H18.76a20 20 0 0 0-9.61 2.3a5.49 5.49 0 0 0 0 .58v1.53h29.73Z"
                            />
                            <path
                              fill="none"
                              stroke="#45413c"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m36.84 25.67l-.75-4.37a8.91 8.91 0 0 0-8.84-7.7h-6.5a8.91 8.91 0 0 0-8.84 7.7l-.75 4.37a6.16 6.16 0 0 0-2 4.58v1.67h29.72v-1.67a6.16 6.16 0 0 0-2.04-4.58Z"
                            />
                            <path
                              fill="#87898c"
                              d="M8.57 31.92h30.87v6.61H8.57Z"
                            />
                            <path
                              fill="#656769"
                              d="M38.43 36.75H9.57a1 1 0 0 1-1-1v1.8a1 1 0 0 0 1 1h28.86a1 1 0 0 0 1-1v-1.8a1 1 0 0 1-1 1Z"
                            />
                            <path
                              fill="none"
                              stroke="#45413c"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M8.57 31.92h30.87v6.61H8.57Z"
                            />
                            <path
                              fill="#daedf7"
                              d="M18.76 31.92h10.48v3.31a1.1 1.1 0 0 1-1.1 1.1h-8.27a1.1 1.1 0 0 1-1.1-1.1v-3.31h-.01Z"
                            />
                            <path
                              fill="#c0dceb"
                              d="M28.13 34.54h-8.26a1.11 1.11 0 0 1-1.11-1.1v1.79a1.11 1.11 0 0 0 1.11 1.1h8.26a1.11 1.11 0 0 0 1.11-1.1v-1.79a1.11 1.11 0 0 1-1.11 1.1Z"
                            />
                            <path
                              fill="none"
                              stroke="#45413c"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M18.76 31.92h10.48v3.31a1.1 1.1 0 0 1-1.1 1.1h-8.27a1.1 1.1 0 0 1-1.1-1.1v-3.31h-.01Z"
                            />
                            <path
                              fill="#00b8f0"
                              stroke="#45413c"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M14.19 24.58a.54.54 0 0 0 .6.63a81.68 81.68 0 0 1 9.21-.45a81.84 81.84 0 0 1 9.21.45a.54.54 0 0 0 .6-.63l-.75-3.68a5.67 5.67 0 0 0-5.64-4.41h-6.89a5.65 5.65 0 0 0-5.62 4.36Z"
                            />
                            <path
                              fill="#ffe500"
                              d="M11.33 31.37a2.2 2.2 0 1 0 4.4 0a2.2 2.2 0 1 0-4.4 0Zm20.94 0a2.2 2.2 0 1 0 4.4 0a2.2 2.2 0 1 0-4.4 0Z"
                            />
                            <path
                              fill="#ebcb00"
                              d="M13.53 31.92a2.19 2.19 0 0 1-2-1.37a2 2 0 0 0-.17.82a2.21 2.21 0 1 0 4.25-.82a2.21 2.21 0 0 1-2.08 1.37Zm20.94 0a2.21 2.21 0 0 1-2-1.37a2.21 2.21 0 1 0 4.25.82a2 2 0 0 0-.17-.82a2.19 2.19 0 0 1-2.08 1.37Z"
                            />
                            <path
                              fill="none"
                              stroke="#45413c"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M11.33 31.37a2.2 2.2 0 1 0 4.4 0a2.2 2.2 0 1 0-4.4 0Zm20.94 0a2.2 2.2 0 1 0 4.4 0a2.2 2.2 0 1 0-4.4 0Z"
                            />
                            <path
                              fill="#87898c"
                              d="M6.37 25.59a2.2 1.93 0 1 0 4.4 0a2.2 1.93 0 1 0-4.4 0Zm30.86 0a2.2 1.93 0 1 0 4.4 0a2.2 1.93 0 1 0-4.4 0Z"
                            />
                            <path
                              fill="#656769"
                              d="M8.57 25.59a2.27 2.27 0 0 1-1.9-1a1.75 1.75 0 0 0-.31 1a2.08 2.08 0 0 0 2.21 1.92a2.08 2.08 0 0 0 2.2-1.92a1.75 1.75 0 0 0-.31-1a2.27 2.27 0 0 1-1.89 1Zm30.86 0a2.27 2.27 0 0 1-1.89-1a1.75 1.75 0 0 0-.31 1a2.23 2.23 0 0 0 4.41 0a1.75 1.75 0 0 0-.31-1a2.27 2.27 0 0 1-1.9 1Z"
                            />
                            <path
                              fill="none"
                              stroke="#45413c"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M6.37 25.59a2.2 1.93 0 1 0 4.4 0a2.2 1.93 0 1 0-4.4 0Zm30.86 0a2.2 1.93 0 1 0 4.4 0a2.2 1.93 0 1 0-4.4 0Z"
                            />
                            <path
                              fill="#ffe500"
                              stroke="#45413c"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M24.01 5.31L22.37 1.4h3.26l-1.62 3.91zm-5.38 1.42l-3.18-2.81l2.94-1.41l.24 4.22zm-3.59 3.34l-4.21-.52l1.63-2.82l2.58 3.34zm14.33-3.34l3.18-2.81l-2.94-1.41l-.24 4.22zm3.59 3.34l4.21-.52l-1.62-2.82l-2.59 3.34z"
                            />
                          </svg>
                        </div>
                        <div>
                          <strong>Công an</strong>
                          <div className="contact-number">113</div>
                        </div>
                      </div>
                      <div className="contact-item">
                        <div className="contact-icon">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="32"
                            height="32"
                            viewBox="0 0 48 48"
                          >
                            <path
                              fill="#45413c"
                              d="M4.19 44.14a19.81 1.86 0 1 0 39.62 0a19.81 1.86 0 1 0-39.62 0Z"
                              opacity=".15"
                            />
                            <path
                              fill="#fff"
                              d="m8.68 20.9l-1 3.44a2.49 2.49 0 0 1-1.15 1.47l-1.77 1a3.37 3.37 0 0 0-1.69 2.92v4.87a1.23 1.23 0 0 0 1.24 1.23h18V16.64h-8a5.87 5.87 0 0 0-5.63 4.26Z"
                            />
                            <path
                              fill="#f0f0f0"
                              d="M3.09 32.12v2.48a1.23 1.23 0 0 0 1.24 1.23h18v-2.47h-18a1.24 1.24 0 0 1-1.24-1.24Z"
                            />
                            <path
                              fill="none"
                              stroke="#45413c"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m8.68 20.9l-1 3.44a2.49 2.49 0 0 1-1.15 1.47l-1.77 1a3.37 3.37 0 0 0-1.69 2.92v4.87a1.23 1.23 0 0 0 1.24 1.23h18V16.64h-8a5.87 5.87 0 0 0-5.63 4.26Z"
                            />
                            <path
                              fill="#adc4d9"
                              d="M3.71 35.83h31.57v5H3.71a1.24 1.24 0 0 1-1.24-1.24v-2.52a1.24 1.24 0 0 1 1.24-1.24Z"
                            />
                            <path
                              fill="#8ca4b8"
                              d="M2.47 37.46v2.09a1.24 1.24 0 0 0 1.24 1.24h31.57V38.7H3.71a1.24 1.24 0 0 1-1.24-1.24Z"
                            />
                            <path
                              fill="none"
                              stroke="#45413c"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3.71 35.83h31.57v5h0H3.71a1.24 1.24 0 0 1-1.24-1.24v-2.52a1.24 1.24 0 0 1 1.24-1.24Z"
                            />
                            <path
                              fill="#fff"
                              d="M22.28 11.07h22.29v29.71H22.28Z"
                            />
                            <path
                              fill="#f0f0f0"
                              d="M42.09 35.83H24.76a2.48 2.48 0 0 1-2.48-2.47v5a2.48 2.48 0 0 0 2.48 2.48h17.33a2.48 2.48 0 0 0 2.48-2.48v-5a2.48 2.48 0 0 1-2.48 2.47Z"
                            />
                            <path
                              fill="none"
                              stroke="#45413c"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M22.28 11.07h22.29v29.71H22.28Z"
                            />
                            <path
                              fill="#656769"
                              d="M9.28 39.55a4.95 4.95 0 1 0 9.9 0a4.95 4.95 0 1 0-9.9 0Z"
                            />
                            <path
                              fill="#87898c"
                              d="M14.23 37.07A4.93 4.93 0 0 1 19 40.79a5.08 5.08 0 0 0 .17-1.24a4.95 4.95 0 0 0-9.9 0a4.65 4.65 0 0 0 .18 1.24a4.93 4.93 0 0 1 4.78-3.72Z"
                            />
                            <path
                              fill="none"
                              stroke="#45413c"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9.28 39.55a4.95 4.95 0 1 0 9.9 0a4.95 4.95 0 1 0-9.9 0Z"
                            />
                            <path
                              fill="#656769"
                              d="M30.95 39.55a4.95 4.95 0 1 0 9.9 0a4.95 4.95 0 1 0-9.9 0Z"
                            />
                            <path
                              fill="#87898c"
                              d="M35.9 37.07a5 5 0 0 1 4.78 3.72a5.08 5.08 0 0 0 .17-1.24a4.95 4.95 0 0 0-9.9 0a5.08 5.08 0 0 0 .17 1.24a4.93 4.93 0 0 1 4.78-3.72Z"
                            />
                            <path
                              fill="none"
                              stroke="#45413c"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M30.95 39.55a4.95 4.95 0 1 0 9.9 0a4.95 4.95 0 1 0-9.9 0Z"
                            />
                            <path
                              fill="#00b8f0"
                              d="M18 25.93h-5.32a1.24 1.24 0 0 1-1.21-1.51l.53-2.13a2.46 2.46 0 0 1 2.41-1.93H18a1.23 1.23 0 0 1 1.23 1.24v3.09A1.24 1.24 0 0 1 18 25.93Z"
                            />
                            <path
                              fill="#4acfff"
                              d="M14.36 20.36A2.46 2.46 0 0 0 12 22.29l-.48 2.13a1.23 1.23 0 0 0 1.15 1.5l4.29-5.56Z"
                            />
                            <path
                              fill="none"
                              stroke="#45413c"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M18 25.93h-5.32a1.24 1.24 0 0 1-1.21-1.51l.53-2.13a2.46 2.46 0 0 1 2.41-1.93H18a1.23 1.23 0 0 1 1.23 1.24v3.09A1.24 1.24 0 0 1 18 25.93Z"
                            />
                            <path
                              fill="#ff6242"
                              stroke="#45413c"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3.09 29.74v2.38h19.19V28.4H3.39a3.4 3.4 0 0 0-.3 1.34Zm19.19-1.34h22.29v3.71H22.28z"
                            />
                            <path
                              fill="#ffe500"
                              stroke="#45413c"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M3.09 29.74h1.86A1.24 1.24 0 0 1 6.18 31v1.15a1.24 1.24 0 0 1-1.24 1.24H3.09h0v-3.65h0Z"
                            />
                            <path
                              fill="#ff6242"
                              stroke="#45413c"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M37.76 17.88h-2.48V15.4h-3.71v2.48h-2.48v3.71h2.48v2.48h3.71v-2.48h2.48v-3.71z"
                            />
                            <path
                              fill="#ff8a14"
                              d="M16.09 12.31a2.48 2.48 0 0 0-2.48 2.48v1.85h5v-1.85a2.48 2.48 0 0 0-2.52-2.48Z"
                            />
                            <path
                              fill="#ffaa54"
                              d="M16.09 12.31a2.48 2.48 0 0 0-2.48 2.48v1.75a2.48 2.48 0 0 1 5 0v-1.75a2.48 2.48 0 0 0-2.52-2.48Z"
                            />
                            <path
                              fill="none"
                              stroke="#45413c"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M16.09 12.31a2.48 2.48 0 0 0-2.48 2.48v1.85h5v-1.85a2.48 2.48 0 0 0-2.52-2.48Z"
                            />
                            <path
                              fill="#c0dceb"
                              stroke="#45413c"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M12.37 39.55a1.86 1.86 0 1 0 3.72 0a1.86 1.86 0 1 0-3.72 0Zm21.67 0a1.86 1.86 0 1 0 3.72 0a1.86 1.86 0 1 0-3.72 0Z"
                            />
                            <path
                              fill="#ffe500"
                              stroke="#45413c"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="m16.09 7.2l-1.85-4.39h3.67L16.09 7.2zm-5.38 1.85L6.3 7.26l2.59-2.59l1.82 4.38zM8.9 14.13l-4.39 1.84v-3.66l4.39 1.82zm12.31-5.08l4.41-1.79l-2.59-2.59l-1.82 4.38z"
                            />
                          </svg>
                        </div>
                        <div>
                          <strong>Cấp cứu</strong>
                          <div className="contact-number">115</div>
                        </div>
                      </div>
                      <div className="contact-item">
                        <div className="contact-icon">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="32"
                            height="32"
                            viewBox="0 0 64 64"
                          >
                            <g fill="#f14e3a">
                              <path d="M18.9 23h-11c-1.1 0-2 .9-2 2s.9 2 2 2h11v-4m43 10l-6-6h-26c-1.1 0-2 .9-2 2v22h34V33" />
                              <path d="M19.9 23h-8.2c-1.1 0-1.7.9-1.8 2L7 36l-1.6 1.1c-.9.6-1.9 1.8-2.1 2.9L2 49c-.2 1.1.6 2 1.7 2H22V25c-.1-1.1-1-2-2.1-2" />
                            </g>
                            <path
                              fill="#3e4347"
                              d="m11.3 33l.7-5c.1-.5-.3-1-.9-1h-2L7 36m12.9-4c0 .6-.4 1.3-.9 1.5L14.7 35c-.5.2-.8-.2-.7-.7l.7-6.2c.1-.6.5-1 1-1h3.4c.5 0 .9.4.8 1V32"
                            />
                            <g fill="#e1e8ed">
                              <path d="M15.8 49c1.3.7 2.3 1.7 3.1 3H22v-3h-6.2M0 51v4c0 1.1.9 2 2 2h2c0-.3-.1-.7-.1-1c0-3 1.6-5.6 4.1-7H2c-1.1 0-2 .9-2 2" />
                              <path d="M20.9 52c-1.5-3.5-5-6-9-6s-7.5 2.5-9 6h18" />
                            </g>
                            <circle cx="11.9" cy="56" r="8" fill="#3e4347" />
                            <circle cx="11.9" cy="56" r="5" fill="#b2c1c0" />
                            <g fill="#3e4347">
                              <path d="M11.9 51.7c-.8 0-1.2.5-.9 1.2l.5 1.4c.2.6.6.6.9 0l.5-1.4c.2-.7-.2-1.2-1-1.2m-4 3c-.3.7.1 1.3.8 1.2l1.4-.1c.7 0 .8-.4.3-.8l-1.1-.9c-.6-.4-1.2-.1-1.4.6m1.5 4.8c.6.4 1.3.3 1.4-.4l.4-1.4c.2-.7-.1-.9-.7-.5l-1.1.8c-.6.3-.6 1 0 1.5m5.1 0c.6-.4.6-1.1.1-1.5l-1.2-.8c-.6-.4-.9-.2-.7.5l.4 1.4c.1.6.7.8 1.4.4m1.5-4.8c-.2-.7-.9-1-1.4-.5l-1.1.8c-.5.4-.4.8.3.8l1.4.1c.7.1 1-.5.8-1.2" />
                              <circle cx="37.9" cy="56" r="8" />
                            </g>
                            <circle cx="37.9" cy="56" r="5" fill="#b2c1c0" />
                            <g fill="#3e4347">
                              <path d="M37.9 51.7c-.8 0-1.2.5-.9 1.2l.5 1.4c.2.6.6.6.9 0l.5-1.4c.2-.7-.2-1.2-1-1.2m-4 3c-.2.7.1 1.3.8 1.2l1.4-.1c.7 0 .8-.4.3-.8l-1.1-.9c-.6-.4-1.2-.1-1.4.6m1.5 4.8c.6.4 1.3.3 1.4-.4l.4-1.4c.2-.7-.1-.9-.7-.5l-1.2.8c-.5.3-.5 1 .1 1.5m5.1 0c.6-.4.6-1.1.1-1.5l-1.2-.8c-.6-.4-.9-.2-.7.5l.4 1.4c.1.6.7.8 1.4.4m1.5-4.8c-.2-.7-.9-1-1.4-.5l-1.1.8c-.5.4-.4.8.3.8l1.4.1c.7.1 1-.5.8-1.2" />
                              <circle cx="54.9" cy="56" r="8" />
                            </g>
                            <circle cx="54.9" cy="56" r="5" fill="#b2c1c0" />
                            <path
                              fill="#3e4347"
                              d="M54.9 51.7c-.8 0-1.2.5-.9 1.2l.5 1.4c.2.6.6.6.9 0l.5-1.4c.2-.7-.2-1.2-1-1.2m-4 3c-.2.7.1 1.3.8 1.2l1.4-.1c.7 0 .8-.4.3-.8l-1.1-.9c-.6-.4-1.2-.1-1.4.6m1.5 4.8c.6.4 1.3.3 1.4-.4l.4-1.4c.2-.7-.1-.9-.7-.5l-1.2.8c-.5.3-.5 1 .1 1.5m5.1 0c.6-.4.6-1.1.1-1.5l-1.2-.8c-.6-.4-.9-.2-.7.5l.4 1.4c.1.6.7.8 1.4.4m1.5-4.8c-.2-.7-.9-1-1.4-.5l-1.1.8c-.5.4-.4.8.3.8l1.4.1c.7.1 1-.5.8-1.2"
                            />
                            <path
                              fill="#b3bdc4"
                              d="M26.9 35h-4c-.5 0-1 .5-1 1v16h6V36c0-.5-.4-1-1-1"
                            />
                            <path
                              fill="#e1e8ed"
                              d="M62 49c-1.8-1.8-4.3-3-7.1-3h-17c-2.7 0-5.2 1.2-7 3h-3v3H31c1.4-2.4 4-4 6.9-4c3 0 5.5 1.6 6.9 4H48c1.4-2.4 4-4 6.9-4c4.4 0 8 3.6 8 8v.8c.7-.3 1.1-1 1.1-1.8v-4c0-1.1-.9-2-2-2M18.9 19h-2c0-.5-.4-1-1-1h-3c-2.2 0-4 1.8-4 4v1h11l-1-4"
                            />
                            <path
                              fill="#42ade2"
                              d="M14.9 19h-2c-1.7 0-3 1.3-3 3v1h6v-3c0-.5-.4-1-1-1"
                            />
                            <g fill="#b8331e">
                              <path d="M53.9 43h-16c-1.7 0-3-1.3-3-3v-6c0-1.7 1.3-3 3-3h16c1.7 0 3 1.3 3 3v6c0 1.7-1.3 3-3 3m-16-10c-.6 0-1 .4-1 1v6c0 .6.4 1 1 1h16c.6 0 1-.4 1-1v-6c0-.6-.4-1-1-1h-16" />
                              <path d="M36.9 35h18v1h-18zm0 3h18v1h-18z" />
                            </g>
                            <path
                              fill="#b2c1c0"
                              d="m54.2 21.3l-2.9-11.1l-2.2-.6L52 20.7z"
                            />
                            <g fill="#3e4347">
                              <path d="M13.2 3.8c-.1.5-.7.8-1.2.7c-.5-.1-.9-.7-.7-1.2l.5-1.9c.1-.5.7-.9 1.2-.7c.5.1.9.7.7 1.2l-.5 1.9" />
                              <path d="m15.8 5.6l-4.5-2.3l.5-1.9l5.1.3z" />
                            </g>
                            <path
                              fill="#e1e8ed"
                              d="m19.746 6.63l1.035-3.864l28.977 7.764l-1.035 3.864z"
                            />
                            <path
                              fill="#b3bdc4"
                              d="M53.1 9.4L28.6 2.8l-2.2-.6l-.8.8l-4.1 4.1l-1 3.9l-7.6-2l-.5 1.9l25.1 6.7l1.4 2.4l12.6 3.4l.5-1.9l1.9.5l2-1.9v-5.8l-2.8-4.9m-30.4 2.1l1-3.9L26.4 5l2.1 8.2l-5.8-1.7m5.7-6.7l6.9 1.8l-5.1 5.1l-1.8-6.9m2.6 9l6-6l2.2 8.2l-8.2-2.2m10.4 2.7L39 7.6l8.8 2.4l-6.4 6.5"
                            />
                            <path
                              fill="#b2c1c0"
                              d="M20.3.6L18.4 0c-.5-.1-1.1.2-1.2.7l-2.3 8.7l3.9 1L21 1.8c.1-.6-.2-1.1-.7-1.2"
                            />
                            <g fill="#3e4347">
                              <circle cx="18.3" cy="4.2" r="1" />
                              <path d="m48.9 16l-7 7h-3v4h17V16z" />
                            </g>
                            <circle cx="51.1" cy="21" r="2" fill="#e1e8ed" />
                            <path
                              fill="#f14e3a"
                              d="M26.4 47c0-.5-.4-1-1-1h-1c-.5 0-1 .5-1 1v1c0 .5.5 1 1 1h1c.6 0 1-.5 1-1v-1"
                            />
                          </svg>
                        </div>
                        <div>
                          <strong>PCCC</strong>
                          <div className="contact-number">114</div>
                        </div>
                      </div>
                      <div className="contact-item">
                        <div className="contact-icon">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="32"
                            height="32"
                            viewBox="0 0 64 64"
                          >
                            <path
                              fill="#fbbf67"
                              d="M1.892 42.03c0 12.133 13.464 21.955 30.11 21.955c16.635 0 30.1-9.822 30.1-21.955c0-12.12-13.47-42.02-30.1-42.02c-16.646 0-30.11 29.902-30.11 42.02"
                            />
                            <path
                              fill="#25333a"
                              d="M26.17 42.771c0 2.967-1.998 5.378-4.44 5.378c-2.455 0-4.435-2.411-4.435-5.378s1.98-5.387 4.435-5.387c2.443 0 4.44 2.42 4.44 5.387m21.07 0c0 2.967-1.99 5.378-4.436 5.378c-2.462 0-4.43-2.411-4.43-5.378s1.968-5.387 4.43-5.387c2.446 0 4.436 2.42 4.436 5.387"
                            />
                            <path
                              fill="#c37929"
                              d="M28.442 53.55c0-1.685 1.441-1.655 3.399-1.655c1.97 0 3.705-.029 3.705 1.655c0 1.702-1.585 3.067-3.548 3.067c-1.959 0-3.556-1.365-3.556-3.067"
                              opacity=".6"
                            />
                            <path
                              fill="#916f62"
                              fillRule="evenodd"
                              d="M28.763 21.418c3.975 1.303 7.492-.245 9.409-2.515c1.368-1.618 2.435-3.878 1.875-6.665c-.595-2.973-3.14-5.691-6.727-5.673c-3.291.019-6.04 2.772-5.674 6.02c.204 1.736 1.47 3.277 3.22 3.684c1.702.392 3.244-.425 3.74-1.753c.62-1.649-.181-3.576-2.214-3.333a1.843 1.843 0 0 0-.938.408c-.224.191-.385.657-.53.584c.108-1.537 1.025-2.314 2.397-2.336c1.874-.035 3.422 1.614 3.563 3.51c.173 2.202-1.277 3.903-2.566 4.616c-3.542 1.968-7.422-.678-8.539-3.391c-1.331-3.247.348-6.699 2.163-8.302c1.616-1.423 3.64-2.266 6.253-1.989a9.186 9.186 0 0 1 5.548 2.619c.218-.062 2.331-.814 3.02-1.542a13.036 13.036 0 0 0-3.822-3.062c-2.62-1.38-6.452-1.716-9.361-.704c-2.932 1.029-4.847 2.888-6.133 5.206c-.725 1.299-1.179 2.511-1.344 4.324c-.482 5.36 2.87 9.05 6.665 10.291"
                            />
                            <path
                              fill="#fff"
                              d="M48.23 41.581c0 5.433-2.935 9.821-6.553 9.821c-3.622 0-6.56-4.389-6.56-9.821c0-5.42 2.938-9.816 6.56-9.816c3.619 0 6.553 4.396 6.553 9.816"
                            />
                            <path
                              fill="#25333a"
                              d="M45.914 41.581c0 2.841-1.894 5.149-4.235 5.149c-2.343 0-4.249-2.309-4.249-5.149c0-2.838 1.906-5.139 4.249-5.139c2.342 0 4.235 2.301 4.235 5.139"
                            />
                            <path
                              fill="#fff"
                              d="M29.431 41.581c0 5.433-2.935 9.821-6.555 9.821c-3.624 0-6.564-4.389-6.564-9.821c0-5.42 2.94-9.816 6.564-9.816c3.62 0 6.555 4.396 6.555 9.816"
                            />
                            <path
                              fill="#25333a"
                              d="M27.11 41.581c0 2.841-1.895 5.149-4.237 5.149c-2.348 0-4.25-2.309-4.25-5.149c0-2.838 1.902-5.139 4.25-5.139c2.343 0 4.237 2.301 4.237 5.139"
                            />
                          </svg>
                        </div>
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
