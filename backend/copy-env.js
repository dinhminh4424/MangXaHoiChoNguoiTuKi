/**
 * copy-env.js
 * Sao chép biến môi trường từ backend/.env sang frontend/.env.development.local
 * để frontend và backend luôn đồng bộ.
 */

const fs = require("fs");
const path = require("path");

const backendEnvPath = path.join(__dirname, ".env");
const frontendEnvPath = path.join(
  __dirname,
  "../frontend/.env.development.local"
);

try {
  if (!fs.existsSync(backendEnvPath)) {
    console.error("❌ Không tìm thấy backend/.env");
    process.exit(1);
  }

  const envData = fs.readFileSync(backendEnvPath, "utf8");

  // Chỉ lấy các dòng bắt đầu bằng REACT_APP_ hoặc FRONTEND_URL hoặc HOST_IP
  const filteredLines = envData
    .split("\n")
    .filter((line) =>
      /^(REACT_APP_|FRONTEND_URL|HOST_IP|BACKEND_PORT|FRONTEND_PORT)/.test(line)
    )
    .join("\n");

  fs.writeFileSync(frontendEnvPath, filteredLines);
  console.log("✅ Đồng bộ biến môi trường sang frontend thành công!");
  console.log(`📁 Ghi tại: ${frontendEnvPath}`);
} catch (error) {
  console.error("⚠️ Lỗi khi sao chép .env:", error);
}
