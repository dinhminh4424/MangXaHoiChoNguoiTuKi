// logging/mask.js
// Hàm đơn giản để mask email/phone trong chuỗi hoặc object
function maskEmail(s) {
  return s.replace(
    /([a-zA-Z0-9._%+-])([a-zA-Z0-9._%+-]*?)@/,
    (m, p1) => p1 + "***@"
  );
}
function maskPhone(s) {
  return s.replace(/(\+?\d{2,4})?(\d{3,})/, (m, p1) => (p1 || "") + "***");
}

function maskPIIInObject(obj) {
  if (!obj || typeof obj !== "object") return obj;
  const clone = Array.isArray(obj) ? [] : {};
  for (const k of Object.keys(obj)) {
    const v = obj[k];
    if (typeof v === "string") {
      let tmp = v;
      tmp = tmp.replace(
        /\b([A-Za-z0-9._%+-]+)@([A-Za-z0-9.-]+\.[A-Za-z]{2,})\b/g,
        (m) => maskEmail(m)
      );
      tmp = tmp.replace(/(\+?\d[\d\-\s]{6,}\d)/g, (m) => maskPhone(m));
      clone[k] = tmp;
    } else if (typeof v === "object" && v !== null) {
      clone[k] = maskPIIInObject(v);
    } else {
      clone[k] = v;
    }
  }
  return clone;
}

module.exports = { maskPIIInObject };
