const QRCode = require("qrcode");

class QRService {
  constructor() {
    this.defaultExpiryDays = 30; // Mặc định 30 ngày
  }

  /**
   * Tạo QR code data với tuỳ chọn expiry
   * @param {string} data - Dữ liệu cần mã hóa (URL, text, etc.)
   * @param {Object} options - Tùy chọn cho QR code
   * @param {number} options.expiryDays - Số ngày tồn tại (mặc định: 30)
   * @param {Date} options.expiryDate - Ngày hết hạn cụ thể
   * @returns {Promise<Object>} QR code data object
   * 
   * // 1. QR code 1 giờ
    const qr1h = await QRService.generateTemporaryQR('https://example.com', 1);

    // 2. QR code 7 ngày
    const qr7d = await QRService.generateQRData('https://example.com', {
    expiryDays: 7
    });

    // 3. QR code vĩnh viễn
    const qrPermanent = await QRService.generatePermanentQR('https://example.com');

    // 4. QR code từ preset
    const qrPreset = await QRService.generateQRFromPreset(
    'https://example.com', 
    'TEMPORARY_24H'
    );

    // 5. Kiểm tra validity
    const validation = QRService.validateQRData(qrData);
    if (validation.isValid && !validation.isExpired) {
    // QR code hợp lệ
    }

    // 6. Gia hạn QR code
    const extendedQR = await QRService.extendQRValidity(qrData, 30); // Thêm 30 ngày

    // 7. Kiểm tra có cần refresh không
    if (QRService.needsRefresh(qrData, 3)) {
    // Còn 3 ngày nữa là hết hạn, nên refresh
    }
   * 
   */

  async generateQRData(data, options = {}) {
    try {
      if (!data) {
        throw new Error("Data là bắt buộc");
      }

      const defaultOptions = {
        width: 300,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      };

      const mergedOptions = { ...defaultOptions, ...options };

      // Tạo Data URL
      const qrDataURL = await QRCode.toDataURL(data, mergedOptions);

      // TRẢ VỀ OBJECT PHÙ HỢP VỚI SCHEMA
      return {
        data: data, // URL profile
        dataURL: qrDataURL, // QR code base64
        options: mergedOptions,
        generatedAt: new Date(),
        expiresAt: null, // Hoặc set expiry nếu cần
        metadata: {
          dataType: this.getDataType(data),
          size: this.estimateSize(qrDataURL),
        },
      };
    } catch (error) {
      console.error("Error generating QR data:", error);
      throw new Error(`Không thể tạo QR code: ${error.message}`);
    }
  }

  /**
   * Tạo QR code và trả về buffer (cho API response)
   * @param {string} data - Dữ liệu cần mã hóa
   * @param {Object} options - Tùy chọn cho QR code
   * @returns {Promise<Buffer>} QR code buffer
   */
  async generateQRBuffer(data, options = {}) {
    try {
      if (!data) {
        throw new Error("Data là bắt buộc");
      }

      const defaultOptions = {
        width: 300,
        margin: 1,
        color: {
          dark: "#000000",
          light: "#FFFFFF",
        },
      };

      const mergedOptions = { ...defaultOptions, ...options };

      // Tạo buffer thay vì file
      const qrBuffer = await QRCode.toBuffer(data, mergedOptions);

      return qrBuffer;
    } catch (error) {
      console.error("Error generating QR buffer:", error);
      throw new Error(`Không thể tạo QR code: ${error.message}`);
    }
  }

  /**
   * Validate QR data và kiểm tra thời hạn
   * @param {Object} qrData - QR data object từ database
   * @param {boolean} checkExpiry - Có kiểm tra hết hạn không
   * @returns {Object} Kết quả validate
   */
  validateQRData(qrData, checkExpiry = true) {
    if (!qrData || !qrData.data || !qrData.dataURL) {
      return {
        isValid: false,
        reason: "QR data không đầy đủ",
        isExpired: false,
      };
    }

    // Kiểm tra định dạng dataURL
    if (!qrData.dataURL.startsWith("data:image/png;base64,")) {
      return {
        isValid: false,
        reason: "Định dạng QR data không hợp lệ",
        isExpired: false,
      };
    }

    // Kiểm tra thời hạn nếu được yêu cầu
    let isExpired = false;
    if (checkExpiry && qrData.expiresAt) {
      const now = new Date();
      const expiresAt = new Date(qrData.expiresAt);
      isExpired = now > expiresAt;

      if (isExpired) {
        return {
          isValid: false,
          reason: "QR code đã hết hạn",
          isExpired: true,
        };
      }
    }

    // Kiểm tra generatedAt hợp lệ
    if (qrData.generatedAt && isNaN(new Date(qrData.generatedAt).getTime())) {
      return {
        isValid: false,
        reason: "Thời gian tạo QR không hợp lệ",
        isExpired: false,
      };
    }

    return {
      isValid: true,
      reason: "QR code hợp lệ",
      isExpired: false,
      expiresIn: this.getTimeUntilExpiry(qrData),
    };
  }

  /**
   * Tính thời gian còn lại đến khi hết hạn
   * @param {Object} qrData - QR data object
   * @returns {Object} Thời gian còn lại
   */
  getTimeUntilExpiry(qrData) {
    if (!qrData.expiresAt) {
      return { days: Infinity, hours: 0, minutes: 0, expired: false };
    }

    const now = new Date();
    const expiresAt = new Date(qrData.expiresAt);
    const diffMs = expiresAt - now;

    if (diffMs <= 0) {
      return { days: 0, hours: 0, minutes: 0, expired: true };
    }

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return {
      days,
      hours,
      minutes,
      expired: false,
      totalMinutes: Math.floor(diffMs / (1000 * 60)),
    };
  }

  /**
   * Update QR data với tuỳ chọn expiry mới
   * @param {Object} currentQRData - QR data hiện tại
   * @param {string} newData - Data mới
   * @param {Object} newOptions - Options mới (tuỳ chọn)
   * @returns {Promise<Object>} QR data mới
   */
  async updateQRData(currentQRData, newData, newOptions = {}) {
    try {
      // Giữ nguyên options cũ nếu không có options mới
      const options =
        Object.keys(newOptions).length > 0
          ? { ...currentQRData.options, ...newOptions }
          : currentQRData.options;

      // Giữ nguyên expiry settings nếu không có mới
      const expiryOptions = {
        expiryDays:
          newOptions.expiryDays || this.getExpiryDaysFromData(currentQRData),
        expiryDate: newOptions.expiryDate || currentQRData.expiresAt,
      };

      return await this.generateQRData(newData, {
        ...options,
        ...expiryOptions,
      });
    } catch (error) {
      console.error("Error updating QR data:", error);
      throw new Error(`Không thể cập nhật QR code: ${error.message}`);
    }
  }

  /**
   * Lấy số ngày expiry từ QR data hiện tại
   */
  getExpiryDaysFromData(qrData) {
    if (!qrData.expiresAt || !qrData.generatedAt) {
      return this.defaultExpiryDays;
    }

    const generatedAt = new Date(qrData.generatedAt);
    const expiresAt = new Date(qrData.expiresAt);
    const diffDays = Math.ceil(
      (expiresAt - generatedAt) / (1000 * 60 * 60 * 24)
    );

    return diffDays > 0 ? diffDays : this.defaultExpiryDays;
  }

  /**
   * Gia hạn QR code
   * @param {Object} qrData - QR data hiện tại
   * @param {number} extendDays - Số ngày gia hạn thêm
   * @returns {Promise<Object>} QR data mới
   */
  async extendQRValidity(qrData, extendDays = 30) {
    try {
      const validation = this.validateQRData(qrData, false);
      if (!validation.isValid) {
        throw new Error(validation.reason);
      }

      const newExpiryDate = new Date();
      newExpiryDate.setDate(newExpiryDate.getDate() + extendDays);

      return await this.generateQRData(qrData.data, {
        ...qrData.options,
        expiryDate: newExpiryDate,
      });
    } catch (error) {
      console.error("Error extending QR validity:", error);
      throw new Error(`Không thể gia hạn QR code: ${error.message}`);
    }
  }

  /**
   * Tạo QR code với thời hạn đặc biệt
   */
  async generateTemporaryQR(data, hours = 24, options = {}) {
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + hours);

    return await this.generateQRData(data, {
      ...options,
      expiryDate,
      metadata: {
        ...options.metadata,
        temporary: true,
        durationHours: hours,
      },
    });
  }

  /**
   * Tạo QR code vĩnh viễn (không bao giờ hết hạn)
   */
  async generatePermanentQR(data, options = {}) {
    const qrData = await this.generateQRData(data, options);
    // Vĩnh viễn = không có expiresAt
    delete qrData.expiresAt;
    return qrData;
  }

  /**
   * Get QR as data URL (từ data đã có)
   * @param {Object} qrData - QR data từ database
   * @param {boolean} checkExpiry - Có kiểm tra hết hạn không
   * @returns {string} Data URL
   */
  getQRDataURL(qrData, checkExpiry = true) {
    const validation = this.validateQRData(qrData, checkExpiry);
    if (!validation.isValid) {
      throw new Error(validation.reason);
    }
    return qrData.dataURL;
  }

  /**
   * Extract thông tin từ QR data
   * @param {Object} qrData - QR data từ database
   * @returns {Object} Thông tin extracted
   */
  getQRInfo(qrData) {
    const validation = this.validateQRData(qrData, false);

    if (!validation.isValid && !validation.isExpired) {
      throw new Error(validation.reason);
    }

    const timeUntilExpiry = this.getTimeUntilExpiry(qrData);

    return {
      data: qrData.data,
      dataType: this.getDataType(qrData.data),
      options: qrData.options,
      generatedAt: qrData.generatedAt,
      expiresAt: qrData.expiresAt,
      size: this.estimateSize(qrData.dataURL),
      validity: {
        isValid: validation.isValid,
        isExpired: timeUntilExpiry.expired,
        expiresIn: timeUntilExpiry,
        daysUntilExpiry: timeUntilExpiry.days,
      },
      metadata: qrData.metadata || {},
    };
  }

  /**
   * Xác định loại data
   * @param {string} data
   * @returns {string}
   */
  getDataType(data) {
    if (data.startsWith("http")) return "url";
    if (data.startsWith("tel:")) return "phone";
    if (data.startsWith("mailto:")) return "email";
    if (data.startsWith("BEGIN:VCARD")) return "vcard";
    if (data.startsWith("WIFI:")) return "wifi";
    if (data.startsWith("SMSTO:")) return "sms";
    if (data.match(/^[0-9a-fA-F]{24}$/)) return "user_id";
    return "text";
  }

  /**
   * Ước tính kích thước data
   * @param {string} dataURL
   * @returns {string}
   */
  estimateSize(dataURL) {
    try {
      const base64Data = dataURL.split(",")[1];
      if (!base64Data) return "0 B";

      const sizeInBytes = Math.ceil((base64Data.length * 3) / 4);

      if (sizeInBytes < 1024) return `${sizeInBytes} B`;
      if (sizeInBytes < 1024 * 1024)
        return `${(sizeInBytes / 1024).toFixed(2)} KB`;
      return `${(sizeInBytes / (1024 * 1024)).toFixed(2)} MB`;
    } catch (error) {
      return "Unknown";
    }
  }

  /**
   * Kiểm tra xem QR code có cần refresh không
   * @param {Object} qrData - QR data hiện tại
   * @param {number} thresholdDays - Số ngày threshold để refresh
   * @returns {boolean}
   */
  needsRefresh(qrData, thresholdDays = 7) {
    if (!qrData.expiresAt) return false;

    const timeUntilExpiry = this.getTimeUntilExpiry(qrData);
    return timeUntilExpiry.days <= thresholdDays && !timeUntilExpiry.expired;
  }

  /**
   * Lấy danh sách các preset expiry options
   */
  getExpiryPresets() {
    return {
      TEMPORARY_1H: { hours: 1, label: "1 Giờ" },
      TEMPORARY_24H: { hours: 24, label: "24 Giờ" },
      SHORT_TERM: { days: 7, label: "7 Ngày" },
      MEDIUM_TERM: { days: 30, label: "30 Ngày" },
      LONG_TERM: { days: 90, label: "90 Ngày" },
      PERMANENT: { permanent: true, label: "Vĩnh viễn" },
    };
  }

  /**
   * Tạo QR code từ preset
   */
  async generateQRFromPreset(data, presetKey, options = {}) {
    const presets = this.getExpiryPresets();
    const preset = presets[presetKey];

    if (!preset) {
      throw new Error(`Preset '${presetKey}' không tồn tại`);
    }

    if (preset.permanent) {
      return await this.generatePermanentQR(data, options);
    } else if (preset.hours) {
      return await this.generateTemporaryQR(data, preset.hours, options);
    } else if (preset.days) {
      return await this.generateQRData(data, {
        ...options,
        expiryDays: preset.days,
      });
    }
  }
}

module.exports = new QRService();
