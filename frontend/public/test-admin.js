// Test script để kiểm tra admin panel
console.log("🔍 Kiểm tra Admin Panel...");

// Kiểm tra localStorage
const token = localStorage.getItem("token");
console.log("Token:", token ? "✅ Có" : "❌ Không có");

// Kiểm tra user info
const userInfo = JSON.parse(localStorage.getItem("userInfo") || "null");
console.log("User Info:", userInfo);

// Kiểm tra role
if (userInfo && userInfo.role) {
  console.log("Role:", userInfo.role);
  if (userInfo.role === "admin") {
    console.log("✅ User có quyền admin");
  } else {
    console.log("❌ User không có quyền admin");
  }
} else {
  console.log("❌ Không có thông tin user");
}

// Test API call
async function testAdminAPI() {
  try {
    const response = await fetch("/api/admin/dashboard", {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    });

    console.log("API Response Status:", response.status);

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Admin API hoạt động:", data);
    } else {
      const error = await response.json();
      console.log("❌ Admin API lỗi:", error);
    }
  } catch (error) {
    console.log("❌ Network error:", error);
  }
}

// Chạy test
if (token) {
  testAdminAPI();
} else {
  console.log("❌ Không có token để test API");
}

