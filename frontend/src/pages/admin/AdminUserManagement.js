import React, { useState, useEffect } from "react";
import {
  getAllUsers,
  updateUserRole,
  deleteUser,
} from "../../services/adminService";
import "./AdminUserManagement.css";

const AdminUserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({});
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    search: "",
    role: "",
  });

  useEffect(() => {
    fetchUsers();
  }, [filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await getAllUsers(filters);
      setUsers(response.data.data.users);
      setPagination(response.data.data.pagination);
    } catch (err) {
      setError("Không thể tải danh sách người dùng");
      console.error("Fetch users error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    setFilters((prev) => ({
      ...prev,
      search: e.target.value,
      page: 1,
    }));
  };

  const handleRoleFilter = (e) => {
    setFilters((prev) => ({
      ...prev,
      role: e.target.value,
      page: 1,
    }));
  };

  const handlePageChange = (page) => {
    setFilters((prev) => ({
      ...prev,
      page,
    }));
  };

  const handleRoleUpdate = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      setUsers(
        users.map((user) =>
          user._id === userId ? { ...user, role: newRole } : user
        )
      );
    } catch (err) {
      alert("Không thể cập nhật role");
      console.error("Update role error:", err);
    }
  };

  const handleDeleteUser = async (userId, username) => {
    if (window.confirm(`Bạn có chắc chắn muốn xóa người dùng "${username}"?`)) {
      try {
        await deleteUser(userId);
        setUsers(users.filter((user) => user._id !== userId));
      } catch (err) {
        alert("Không thể xóa người dùng");
        console.error("Delete user error:", err);
      }
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case "admin":
        return "role-admin";
      case "supporter":
        return "role-supporter";
      case "doctor":
        return "role-doctor";
      default:
        return "role-user";
    }
  };

  const getRoleDisplayName = (role) => {
    switch (role) {
      case "admin":
        return "Quản trị viên";
      case "supporter":
        return "Hỗ trợ";
      case "doctor":
        return "Bác sĩ";
      default:
        return "Người dùng";
    }
  };

  if (loading) {
    return (
      <div className="admin-user-management">
        <div className="loading-container">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p>Đang tải danh sách người dùng...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-user-management">
      <div className="page-header">
        <h1>Quản lý người dùng</h1>
        <p>Quản lý tài khoản và quyền hạn của người dùng</p>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Tìm kiếm theo tên, email..."
            value={filters.search}
            onChange={handleSearch}
            className="form-control"
          />
        </div>
        <div className="filter-group">
          <select
            value={filters.role}
            onChange={handleRoleFilter}
            className="form-select"
          >
            <option value="">Tất cả vai trò</option>
            <option value="user">Người dùng</option>
            <option value="supporter">Hỗ trợ</option>
            <option value="doctor">Bác sĩ</option>
            <option value="admin">Quản trị viên</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="users-table-container">
        <div className="table-responsive">
          <table className="table">
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Email</th>
                <th>Vai trò</th>
                <th>Ngày tạo</th>
                <th>Trạng thái</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user._id}>
                  <td>
                    <div className="user-info">
                      <div className="avatar">
                        {user.profile?.avatar ? (
                          <img src={user.profile.avatar} alt={user.username} />
                        ) : (
                          <i className="ri-user-line"></i>
                        )}
                      </div>
                      <div className="details">
                        <h4>{user.username}</h4>
                        <p>{user.fullName || "Chưa cập nhật"}</p>
                      </div>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    <select
                      value={user.role}
                      onChange={(e) =>
                        handleRoleUpdate(user._id, e.target.value)
                      }
                      className={`form-select role-select ${getRoleBadgeClass(
                        user.role
                      )}`}
                    >
                      <option value="user">Người dùng</option>
                      <option value="supporter">Hỗ trợ</option>
                      <option value="doctor">Bác sĩ</option>
                      <option value="admin">Quản trị viên</option>
                    </select>
                  </td>
                  <td>
                    {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td>
                    <span
                      className={`status-badge ${
                        user.isOnline ? "online" : "offline"
                      }`}
                    >
                      {user.isOnline ? "Trực tuyến" : "Ngoại tuyến"}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() =>
                          window.open(`/profile/${user._id}`, "_blank")
                        }
                      >
                        <i className="ri-eye-line"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() =>
                          handleDeleteUser(user._id, user.username)
                        }
                      >
                        <i className="ri-delete-bin-line"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="pagination-container">
          <nav>
            <ul className="pagination">
              <li
                className={`page-item ${filters.page === 1 ? "disabled" : ""}`}
              >
                <button
                  className="page-link"
                  onClick={() => handlePageChange(filters.page - 1)}
                  disabled={filters.page === 1}
                >
                  Trước
                </button>
              </li>

              {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(
                (page) => (
                  <li
                    key={page}
                    className={`page-item ${
                      filters.page === page ? "active" : ""
                    }`}
                  >
                    <button
                      className="page-link"
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </button>
                  </li>
                )
              )}

              <li
                className={`page-item ${
                  filters.page === pagination.pages ? "disabled" : ""
                }`}
              >
                <button
                  className="page-link"
                  onClick={() => handlePageChange(filters.page + 1)}
                  disabled={filters.page === pagination.pages}
                >
                  Sau
                </button>
              </li>
            </ul>
          </nav>
        </div>
      )}

      {/* Summary */}
      <div className="summary-section">
        <p>
          Hiển thị {users.length} trong tổng số {pagination.total} người dùng
        </p>
      </div>
    </div>
  );
};

export default AdminUserManagement;
