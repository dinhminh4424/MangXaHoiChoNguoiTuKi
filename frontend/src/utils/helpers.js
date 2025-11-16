/**
 * UTILITY HELPERS
 * Các hàm tiện ích dùng chung cho toàn bộ ứng dụng
 */

/**
 * Format bytes to human readable format
 * @param {number} bytes - Số bytes cần format
 * @param {number} decimals - Số chữ số thập phân (mặc định: 2)
 * @returns {string} Chuỗi đã được format (ví dụ: "2.5 MB")
 */
export const formatBytes = (bytes, decimals = 2) => {
  // Xử lý các trường hợp đặc biệt
  if (bytes === 0 || bytes === null || bytes === undefined) {
    return "0 Bytes";
  }

  if (typeof bytes !== "number" || isNaN(bytes)) {
    return "Invalid size";
  }

  if (bytes < 0) {
    return "0 Bytes";
  }

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB", "EB", "ZB", "YB"];

  // Tính toán chỉ số đơn vị
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  // Đảm bảo chỉ số nằm trong phạm vi hợp lệ
  const index = Math.min(i, sizes.length - 1);

  // Tính giá trị đã format
  const formattedValue = parseFloat((bytes / Math.pow(k, index)).toFixed(dm));

  // Trả về kết quả
  return `${formattedValue} ${sizes[index]}`;
};

/**
 * Format date to Vietnamese locale string
 * @param {string|Date} dateString - Chuỗi ngày hoặc đối tượng Date
 * @param {Object} options - Tùy chọn format
 * @returns {string} Chuỗi ngày đã được format
 */
export const formatDate = (dateString, options = {}) => {
  // Xử lý các trường hợp đặc biệt
  if (!dateString) {
    return "N/A";
  }

  let date;

  try {
    // Chuyển đổi thành Date object
    date = new Date(dateString);

    // Kiểm tra tính hợp lệ của Date
    if (isNaN(date.getTime())) {
      return "Invalid date";
    }
  } catch (error) {
    console.error("Error parsing date:", error);
    return "Invalid date";
  }

  // Tùy chọn mặc định cho format Việt Nam
  const defaultOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false, // Sử dụng 24h format
  };

  // Merge options với default options
  const formatOptions = { ...defaultOptions, ...options };

  try {
    return date.toLocaleString("vi-VN", formatOptions);
  } catch (error) {
    console.error("Error formatting date:", error);
    // Fallback format nếu có lỗi
    return date.toISOString().slice(0, 16).replace("T", " ");
  }
};

/**
 * Format date chỉ hiển thị ngày (không có giờ)
 * @param {string|Date} dateString - Chuỗi ngày hoặc đối tượng Date
 * @returns {string} Chuỗi ngày đã được format (ví dụ: "25/12/2023")
 */
export const formatDateOnly = (dateString) => {
  return formatDate(dateString, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: undefined,
    minute: undefined,
  });
};

/**
 * Format date chỉ hiển thị giờ (không có ngày)
 * @param {string|Date} dateString - Chuỗi ngày hoặc đối tượng Date
 * @returns {string} Chuỗi giờ đã được format (ví dụ: "14:30")
 */
export const formatTimeOnly = (dateString) => {
  return formatDate(dateString, {
    year: undefined,
    month: undefined,
    day: undefined,
    hour: "2-digit",
    minute: "2-digit",
  });
};

/**
 * Format date relative time (ví dụ: "2 giờ trước")
 * @param {string|Date} dateString - Chuỗi ngày hoặc đối tượng Date
 * @returns {string} Chuỗi thời gian tương đối
 */
export const formatRelativeTime = (dateString) => {
  if (!dateString) return "N/A";

  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now - date;
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);

  if (diffInSeconds < 60) {
    return "Vừa xong";
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} phút trước`;
  } else if (diffInHours < 24) {
    return `${diffInHours} giờ trước`;
  } else if (diffInDays < 7) {
    return `${diffInDays} ngày trước`;
  } else {
    return formatDate(dateString);
  }
};

/**
 * Format số với dấu phân cách hàng nghìn
 * @param {number} number - Số cần format
 * @param {number} decimals - Số chữ số thập phân
 * @returns {string} Chuỗi số đã được format
 */
export const formatNumber = (number, decimals = 0) => {
  if (number === null || number === undefined || isNaN(number)) {
    return "0";
  }

  return number.toLocaleString("vi-VN", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

/**
 * Format phần trăm
 * @param {number} value - Giá trị phần trăm (0-1 hoặc 0-100)
 * @param {boolean} isDecimal - True nếu value là decimal (0-1), false nếu là phần trăm (0-100)
 * @param {number} decimals - Số chữ số thập phân
 * @returns {string} Chuỗi phần trăm đã được format
 */
export const formatPercentage = (value, isDecimal = true, decimals = 1) => {
  if (value === null || value === undefined || isNaN(value)) {
    return "0%";
  }

  const percentageValue = isDecimal ? value * 100 : value;

  return `${percentageValue.toFixed(decimals)}%`;
};

/**
 * Truncate text với độ dài tối đa
 * @param {string} text - Chuỗi cần truncate
 * @param {number} maxLength - Độ dài tối đa
 * @returns {string} Chuỗi đã được truncate
 */
export const truncateText = (text, maxLength = 50) => {
  if (!text || typeof text !== "string") {
    return "";
  }

  if (text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength) + "...";
};

/**
 * Capitalize chữ cái đầu tiên
 * @param {string} text - Chuỗi cần capitalize
 * @returns {string} Chuỗi đã được capitalize
 */
export const capitalizeFirst = (text) => {
  if (!text || typeof text !== "string") {
    return "";
  }

  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
};

/**
 * Format tiền tệ Việt Nam
 * @param {number} amount - Số tiền
 * @param {string} currency - Loại tiền tệ (mặc định: 'VND')
 * @returns {string} Chuỗi tiền tệ đã được format
 */
export const formatCurrency = (amount, currency = "VND") => {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return "0 ₫";
  }

  return amount.toLocaleString("vi-VN", {
    style: "currency",
    currency: currency,
  });
};

/**
 * Kiểm tra và parse JSON an toàn
 * @param {string} jsonString - Chuỗi JSON
 * @returns {Object|null} Object đã parse hoặc null nếu lỗi
 */
export const safeJsonParse = (jsonString) => {
  try {
    return JSON.parse(jsonString);
  } catch (error) {
    console.error("JSON parse error:", error);
    return null;
  }
};

/**
 * Tạo ID ngẫu nhiên
 * @param {number} length - Độ dài ID
 * @returns {string} ID ngẫu nhiên
 */
export const generateId = (length = 8) => {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * Debounce function
 * @param {Function} func - Hàm cần debounce
 * @param {number} delay - Thời gian delay (ms)
 * @returns {Function} Hàm đã được debounce
 */
export const debounce = (func, delay) => {
  let timeoutId;
  return (...args) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func.apply(null, args), delay);
  };
};

/**
 * Deep clone object
 * @param {Object} obj - Object cần clone
 * @returns {Object} Object đã được clone
 */
export const deepClone = (obj) => {
  if (obj === null || typeof obj !== "object") {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime());
  }

  if (obj instanceof Array) {
    return obj.reduce((arr, item, i) => {
      arr[i] = deepClone(item);
      return arr;
    }, []);
  }

  if (obj instanceof Object) {
    return Object.keys(obj).reduce((newObj, key) => {
      newObj[key] = deepClone(obj[key]);
      return newObj;
    }, {});
  }
};

export default {
  formatBytes,
  formatDate,
  formatDateOnly,
  formatTimeOnly,
  formatRelativeTime,
  formatNumber,
  formatPercentage,
  truncateText,
  capitalizeFirst,
  formatCurrency,
  safeJsonParse,
  generateId,
  debounce,
  deepClone,
};
