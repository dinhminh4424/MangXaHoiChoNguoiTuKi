// export default AdminUserManagement;
import React, { useState, useEffect } from "react";
import {
  getAllUsers,
  updateUserRole,
  deleteUser,
  updateActiveUser,
  createUser,
  updateUser,
} from "../../../services/adminService";
import "./AdminUserManagement.css";
import NotificationService from "../../../services/notificationService";

// Import Bootstrap Modal
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import Card from "react-bootstrap/Card";
import Table from "react-bootstrap/Table";
import Pagination from "react-bootstrap/Pagination";

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
    status: "",
    dateFrom: "",
    dateTo: "",
  });

  // Modal states
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [modalMode, setModalMode] = useState("create");

  // Form state
  const [userForm, setUserForm] = useState({
    username: "",
    email: "",
    password: "",
    fullName: "",
    role: "user",
    profile: {
      bio: "",
      location: "",
      skills: [],
    },
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

  // Modal handlers
  const handleShowUserModal = (user = null) => {
    setSelectedUser(user);
    setModalMode(user ? "edit" : "create");
    if (user) {
      setUserForm({
        username: user.username,
        email: user.email,
        password: "",
        fullName: user.fullName || "",
        role: user.role,
        profile: {
          bio: user.profile?.bio || "",
          location: user.profile?.location || "",
          skills: user.profile?.skills || [],
        },
      });
    } else {
      setUserForm({
        username: "",
        email: "",
        password: "",
        fullName: "",
        role: "user",
        profile: {
          bio: "",
          location: "",
          skills: [],
        },
      });
    }
    setShowUserModal(true);
  };

  const handleShowDetailModal = (user) => {
    setSelectedUser(user);
    setShowDetailModal(true);
  };

  const handleCloseModals = () => {
    setShowUserModal(false);
    setShowDetailModal(false);
    setSelectedUser(null);
  };

  // Form handlers
  const handleFormChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith("profile.")) {
      const profileField = name.split(".")[1];
      setUserForm((prev) => ({
        ...prev,
        profile: {
          ...prev.profile,
          [profileField]: value,
        },
      }));
    } else {
      setUserForm((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      const response = await createUser(userForm);
      NotificationService.success({
        title: "Thành công",
        text: "Đã tạo người dùng mới thành công",
      });
      handleCloseModals();
      fetchUsers();
    } catch (error) {
      NotificationService.error({
        title: "Lỗi",
        text: error.response?.data?.message || "Không thể tạo người dùng",
      });
    }
  };

  const handleUpdateUser = async (e) => {
    e.preventDefault();
    try {
      const dataFrom = {
        username: userForm.fullName,
        email: userForm.email,
        password: userForm.password,
        fullName: userForm.fullName,
        role: userForm.role,
        profile: userForm.profile,
      };
      const res = await updateUser(selectedUser._id, dataFrom);
      if (res.success) {
        NotificationService.success({
          title: "Thành công",
          text: "Đã cập nhật thông tin người dùng",
        });
        handleCloseModals();
        fetchUsers();
      }
    } catch (error) {
      NotificationService.error({
        title: "Lỗi",
        text: error.response?.data?.message || "Không thể cập nhật người dùng",
      });
    }
  };

  // Filter handlers
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

  const handleStatusFilter = (e) => {
    setFilters((prev) => ({
      ...prev,
      status: e.target.value,
      page: 1,
    }));
  };

  const handleDateFilter = (field, value) => {
    setFilters((prev) => ({
      ...prev,
      [field]: value,
      page: 1,
    }));
  };

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      search: "",
      role: "",
      status: "",
      dateFrom: "",
      dateTo: "",
    });
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
      NotificationService.success({
        title: "Thành công",
        text: "Đã cập nhật vai trò người dùng",
      });
    } catch (err) {
      NotificationService.error({
        title: "Lỗi",
        text: "Không thể cập nhật vai trò",
      });
    }
  };

  const handleDeleteUser = async (userId, username) => {
    let check = await NotificationService.confirm({
      title: `Bạn có chắc chắn muốn xóa người dùng "${username}"?`,
      confirmText: "Chắc chắn xoá",
      cancelText: "Huỷ xoá",
    });
    if (check.isConfirmed) {
      try {
        await deleteUser(userId);
        setUsers(users.filter((user) => user._id !== userId));
        NotificationService.success({
          title: "Thành công",
          text: "Đã xóa người dùng thành công",
        });
      } catch (error) {
        NotificationService.error({
          title: "Lỗi",
          text: "Không thể xóa người dùng",
        });
      }
    }
  };

  const handleActiveUser = async (userId, active) => {
    try {
      let check = await NotificationService.confirm({
        title: `Bạn có chắc muốn ${active ? "Khoá" : "Mở Khoá"} (${
          active ? "Dừng" : "Cho Phép"
        } Hoạt Động) tài khoản này?`,
        confirmText: `Chắc chắn ${active ? "Khoá" : "Mở Khoá"}`,
        cancelText: "Huỷ",
      });
      if (check.isConfirmed) {
        try {
          const res = await updateActiveUser(userId);
          if (res.success) {
            NotificationService.success({
              title: "Cập nhật thành công!",
              text: `Đã ${active ? "Khoá" : "Mở Khoá"} Tài khoản thành công!`,
              timer: 3000,
              showConfirmButton: false,
            });

            setUsers((prev) =>
              prev.map((user) =>
                user._id === userId ? { ...user, active: !active } : user
              )
            );
          } else {
            NotificationService.error({
              title: "Cập nhật thất bại!",
              text: `Đã ${active ? "Khoá" : "Mở Khoá"} Tài khoản thất bại!`,
              timer: 3000,
              showConfirmButton: false,
            });
          }
        } catch (error) {
          console.error("error:", error.response);
          NotificationService.error({
            title: "Cập nhật thất bại!",
            text: `Đã ${
              active ? "Khoá" : "Mở Khoá"
            } Tài khoản thất bại! : ${error.toString()} `,
            timer: 3000,
            showConfirmButton: false,
          });
        }
      }
    } catch (error) {}
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case "admin":
        return "bg-danger";
      case "supporter":
        return "bg-warning text-dark";
      case "doctor":
        return "bg-primary";
      default:
        return "bg-secondary";
    }
  };

  const getStatusBadgeClass = (user) => {
    if (!user.active) return "bg-danger";
    return user.isOnline ? "bg-success" : "bg-secondary";
  };

  const getStatusText = (user) => {
    if (!user.active) return "Đã khóa";
    return user.isOnline ? "Trực tuyến" : "Ngoại tuyến";
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

  return (
    <div className="admin-user-management">
      <div className="page-header d-flex justify-content-between align-items-center mb-4">
        <div>
          <h1 className="h3 mb-1">Quản lý người dùng</h1>
          <p className="text-muted mb-0">
            Quản lý tài khoản và quyền hạn của người dùng
          </p>
        </div>
        <Button variant="primary" onClick={() => handleShowUserModal()}>
          <i className="ri-user-add-line me-2"></i> Thêm người dùng
        </Button>
      </div>

      {/* Advanced Filters */}
      <Card className="mb-4">
        <Card.Body>
          <div className="row g-3">
            <div className="col-md-3">
              <Form.Label>Tìm kiếm</Form.Label>
              <Form.Control
                type="text"
                placeholder="Tìm theo tên, email..."
                value={filters.search}
                onChange={handleSearch}
              />
            </div>
            <div className="col-md-2">
              <Form.Label>Vai trò</Form.Label>
              <Form.Select value={filters.role} onChange={handleRoleFilter}>
                <option value="">Tất cả vai trò</option>
                <option value="user">Người dùng</option>
                <option value="supporter">Hỗ trợ</option>
                <option value="doctor">Bác sĩ</option>
                <option value="admin">Quản trị viên</option>
              </Form.Select>
            </div>
            <div className="col-md-2">
              <Form.Label>Trạng thái</Form.Label>
              <Form.Select value={filters.status} onChange={handleStatusFilter}>
                <option value="">Tất cả trạng thái</option>
                <option value="active">Đang hoạt động</option>
                <option value="banned">Đã khóa</option>
                <option value="online">Đang online</option>
                <option value="offline">Đang offline</option>
              </Form.Select>
            </div>
            <div className="col-md-2">
              <Form.Label>Từ ngày</Form.Label>
              <Form.Control
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleDateFilter("dateFrom", e.target.value)}
              />
            </div>
            <div className="col-md-2">
              <Form.Label>Đến ngày</Form.Label>
              <Form.Control
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleDateFilter("dateTo", e.target.value)}
              />
            </div>
            <div className="col-md-1 d-flex align-items-end">
              <Button
                variant="outline-secondary"
                className="w-100"
                onClick={handleResetFilters}
                title="Reset bộ lọc"
              >
                <i className="ri-refresh-line"></i>
              </Button>
            </div>
          </div>
        </Card.Body>
      </Card>

      {loading && (
        <div className="admin-user-management">
          <div className="loading-container d-flex flex-column align-items-center justify-content-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Đang tải danh sách người dùng...</p>
          </div>
        </div>
      )}

      {/* Users Table */}
      <Card>
        <Card.Body>
          <div className="table-responsive">
            <Table hover>
              <thead>
                <tr>
                  <th>Người dùng</th>
                  <th>Email</th>
                  <th>Vai trò</th>
                  <th>Ngày tạo</th>
                  <th>Trạng thái</th>
                  <th width="150">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user._id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <div className="avatar me-3">
                          {user.profile?.avatar ? (
                            <img
                              src={user.profile.avatar}
                              alt={user.username}
                              className="rounded-circle"
                              width="40"
                              height="40"
                            />
                          ) : (
                            <div
                              className="bg-light rounded-circle d-flex align-items-center justify-content-center"
                              style={{ width: "40px", height: "40px" }}
                            >
                              <i className="ri-user-line text-muted"></i>
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="fw-semibold">{user.username}</div>
                          <small className="text-muted">
                            {user.fullName || "Chưa cập nhật"}
                          </small>
                        </div>
                      </div>
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <Form.Select
                        size="sm"
                        value={user.role}
                        onChange={(e) =>
                          handleRoleUpdate(user._id, e.target.value)
                        }
                        className={getRoleBadgeClass(user.role)}
                      >
                        <option value="user">Người dùng</option>
                        <option value="doctor">Bác sĩ</option>
                        <option value="admin">Quản trị viên</option>
                      </Form.Select>
                    </td>
                    <td>
                      {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                    </td>
                    <td>
                      <span className={`badge ${getStatusBadgeClass(user)}`}>
                        {getStatusText(user)}
                      </span>
                    </td>
                    <td>
                      <div className="btn-group btn-group-sm">
                        <Button
                          variant="outline-info"
                          size="sm"
                          onClick={() => handleShowDetailModal(user)}
                          title="Xem chi tiết"
                        >
                          <i className="ri-information-line"></i>
                        </Button>
                        <Button
                          variant="outline-warning"
                          size="sm"
                          onClick={() => handleShowUserModal(user)}
                          title="Chỉnh sửa"
                        >
                          <i className="ri-edit-line"></i>
                        </Button>
                        <Button
                          variant="outline-danger"
                          size="sm"
                          onClick={() =>
                            handleDeleteUser(user._id, user.username)
                          }
                          title="Xoá tài khoản"
                        >
                          <i className="ri-delete-bin-line"></i>
                        </Button>
                        <Button
                          variant="outline-secondary"
                          size="sm"
                          onClick={() =>
                            handleActiveUser(user._id, user.active)
                          }
                          title={
                            user.active ? "Khóa tài khoản" : "Mở khóa tài khoản"
                          }
                        >
                          <i
                            className={
                              user.active
                                ? "ri-lock-line"
                                : "ri-lock-unlock-line"
                            }
                          ></i>
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="d-flex justify-content-between align-items-center mt-4">
          <div className="text-muted">
            Hiển thị {users.length} trong tổng số {pagination.total} người dùng
          </div>
          <Pagination>
            <Pagination.Prev
              disabled={filters.page === 1}
              onClick={() => handlePageChange(filters.page - 1)}
            />
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map(
              (page) => (
                <Pagination.Item
                  key={page}
                  active={filters.page === page}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Pagination.Item>
              )
            )}
            <Pagination.Next
              disabled={filters.page === pagination.pages}
              onClick={() => handlePageChange(filters.page + 1)}
            />
          </Pagination>
        </div>
      )}

      {/* User Detail Modal */}
      <Modal
        show={showDetailModal}
        onHide={handleCloseModals}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Chi tiết người dùng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedUser && (
            <div className="row">
              <div className="col-md-4 text-center">
                <div className="mb-3">
                  {selectedUser.profile?.avatar ? (
                    <img
                      src={selectedUser.profile.avatar}
                      alt={selectedUser.username}
                      className="rounded-circle"
                      width="120"
                      height="120"
                    />
                  ) : (
                    <div
                      className="bg-light rounded-circle d-flex align-items-center justify-content-center mx-auto"
                      style={{ width: "120px", height: "120px" }}
                    >
                      <i
                        className="ri-user-line text-muted"
                        style={{ fontSize: "3rem" }}
                      ></i>
                    </div>
                  )}
                </div>
                <h4
                  style={{
                    // maxWidth: "150px", // Giới hạn chiều rộng tối đa
                    wordWrap: "break-word",
                    overflowWrap: "break-word",
                    whiteSpace: "normal",
                  }}
                >
                  {selectedUser.username}
                </h4>

                <p className="text-muted">
                  {selectedUser.fullName || "Chưa cập nhật"}
                </p>
              </div>
              <div className="col-md-8">
                <div className="row mb-3">
                  <div className="col-6">
                    <Form.Label className="fw-semibold">Email</Form.Label>
                    <p>{selectedUser.email}</p>
                  </div>
                  <div className="col-6">
                    <Form.Label className="fw-semibold">Vai trò</Form.Label>
                    <p>
                      <span
                        className={`badge ${getRoleBadgeClass(
                          selectedUser.role
                        )}`}
                      >
                        {getRoleDisplayName(selectedUser.role)}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-6">
                    <Form.Label className="fw-semibold">Số report</Form.Label>
                    <p>{selectedUser.violationCount}</p>
                  </div>
                  <div className="col-6">
                    <Form.Label className="fw-semibold">Số warning</Form.Label>
                    <p>{selectedUser.warningCount}</p>
                  </div>
                </div>
                <div className="row mb-3">
                  <div className="col-6">
                    <Form.Label className="fw-semibold">Trạng thái</Form.Label>
                    <p>
                      <span
                        className={`badge ${getStatusBadgeClass(selectedUser)}`}
                      >
                        {getStatusText(selectedUser)}
                      </span>
                    </p>
                  </div>
                  <div className="col-6">
                    <Form.Label className="fw-semibold">Ngày tạo</Form.Label>
                    <p>
                      {new Date(selectedUser.createdAt).toLocaleString("vi-VN")}
                    </p>
                  </div>
                </div>
                {selectedUser.profile?.bio && (
                  <div className="mb-3">
                    <Form.Label className="fw-semibold">Giới thiệu</Form.Label>
                    <p>{selectedUser.profile.bio}</p>
                  </div>
                )}
                {selectedUser.profile?.location && (
                  <div className="mb-3">
                    <Form.Label className="fw-semibold">Địa chỉ</Form.Label>
                    <p>{selectedUser.profile.location}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModals}>
            Đóng
          </Button>
          <Button
            variant="primary"
            onClick={() => {
              handleCloseModals();
              handleShowUserModal(selectedUser);
            }}
          >
            Chỉnh sửa
          </Button>
        </Modal.Footer>
      </Modal>

      {/* User Form Modal */}
      <Modal show={showUserModal} onHide={handleCloseModals} centered size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            {modalMode === "create"
              ? "Thêm người dùng mới"
              : "Chỉnh sửa người dùng"}
          </Modal.Title>
        </Modal.Header>
        <Form
          onSubmit={
            modalMode === "create" ? handleCreateUser : handleUpdateUser
          }
        >
          <Modal.Body>
            <div className="row">
              <div className="col-md-6 mb-3">
                <Form.Label>Tên đăng nhập *</Form.Label>
                <Form.Control
                  type="text"
                  name="username"
                  value={userForm.username}
                  onChange={handleFormChange}
                  required
                />
              </div>
              <div className="col-md-6 mb-3">
                <Form.Label>Email *</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={userForm.email}
                  onChange={handleFormChange}
                  required
                />
              </div>
            </div>
            {modalMode === "create" && (
              <div className="mb-3">
                <Form.Label>Mật khẩu *</Form.Label>
                <Form.Control
                  type="password"
                  name="password"
                  value={userForm.password}
                  onChange={handleFormChange}
                  required
                />
              </div>
            )}
            <div className="row">
              <div className="col-md-6 mb-3">
                <Form.Label>Họ và tên</Form.Label>
                <Form.Control
                  type="text"
                  name="fullName"
                  value={userForm.fullName}
                  onChange={handleFormChange}
                />
              </div>
              <div className="col-md-6 mb-3">
                <Form.Label>Vai trò</Form.Label>
                <Form.Select
                  name="role"
                  value={userForm.role}
                  onChange={handleFormChange}
                >
                  <option value="user">Người dùng</option>
                  <option value="doctor">Bác sĩ</option>
                  <option value="admin">Quản trị viên</option>
                </Form.Select>
              </div>
            </div>
            <div className="mb-3">
              <Form.Label>Giới thiệu</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                name="profile.bio"
                value={userForm.profile.bio}
                onChange={handleFormChange}
              />
            </div>
            <div className="mb-3">
              <Form.Label>Địa chỉ</Form.Label>
              <Form.Control
                type="text"
                name="profile.location"
                value={userForm.profile.location}
                onChange={handleFormChange}
              />
            </div>
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={handleCloseModals}>
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              {modalMode === "create" ? "Tạo người dùng" : "Cập nhật"}
            </Button>
          </Modal.Footer>
        </Form>
      </Modal>
    </div>
  );
};

export default AdminUserManagement;
