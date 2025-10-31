const User = require("../models/User");

function normalizeBaseUsername(input) {
  if (!input || typeof input !== "string") return "";
  let s = input.trim().toLowerCase();
  // Vietnamese diacritics removal
  s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  s = s.replace(/đ/g, "d").replace(/Đ/g, "d");
  // Replace spaces with nothing, remove non-alphanumeric
  s = s.replace(/\s+/g, "");
  s = s.replace(/[^a-z0-9_]/g, "");
  // Ensure not empty
  return s || "user";
}

async function generateUniqueUsernameFrom(name, fallback) {
  const base = normalizeBaseUsername(name) || normalizeBaseUsername(fallback) || "user";
  let candidate = base;
  let suffix = 0;
  // Try base, then base1, base2, ... up to a sensible cap
  // Use lean to speed up
  while (await User.exists({ username: candidate })) {
    suffix += 1;
    candidate = `${base}${suffix}`;
    if (suffix > 1000) {
      // Emergency fallback
      candidate = `${base}${Date.now()}`;
      break;
    }
  }
  return candidate;
}

module.exports = {
  normalizeBaseUsername,
  generateUniqueUsernameFrom,
};


