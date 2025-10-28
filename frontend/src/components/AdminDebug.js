import React from "react";
import { useAuth } from "../contexts/AuthContext";

const AdminDebug = () => {
  const { user, isAuthenticated } = useAuth();

  return (
    <div
      style={{
        position: "fixed",
        top: "10px",
        right: "10px",
        background: "white",
        padding: "10px",
        border: "1px solid #ccc",
        borderRadius: "5px",
        zIndex: 9999,
        fontSize: "12px",
      }}
    >
      <h4>Admin Debug</h4>
      <p>
        <strong>Authenticated:</strong> {isAuthenticated ? "✅" : "❌"}
      </p>
      <p>
        <strong>User:</strong> {user ? user.username : "None"}
      </p>
      <p>
        <strong>Role:</strong> {user ? user.role : "None"}
      </p>
      <p>
        <strong>Is Admin:</strong> {user?.role === "admin" ? "✅" : "❌"}
      </p>
      <p>
        <strong>Token:</strong> {localStorage.getItem("token") ? "✅" : "❌"}
      </p>
    </div>
  );
};

export default AdminDebug;
