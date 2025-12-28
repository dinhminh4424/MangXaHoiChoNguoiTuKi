import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import TooltipWrapper from "../TooltipWrapper";
import AdminNotifications from "../notification/AdminNotifications";
import "./NavbarAdmin.css";

function NavbarAdmin({ isCollapsed, onToggleSidebar }) {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  const isActiveParent = (paths) => {
    return paths.some((path) => location.pathname.startsWith(path));
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Admin navigation items - thiết kế giống hệt Navbar user
  const adminNavItems = [
    { path: "/admin", icon: "ri-dashboard-line", label: "Thống kê" },
    {
      path: "/admin/users",
      icon: "ri-user-line",
      label: "Người Dùng",
      children: [
        {
          path: "/admin/users",
          icon: "ri-list-check",
          label: "Các Người Dùng",
        },
        {
          path: "/admin/users/reports",
          icon: "ri-alarm-warning-line",
          label: "Báo Cáo Người Dùng",
        },
      ],
    },
    {
      path: "/admin/content",
      icon: "ri-file-text-line",
      label: "Quản Lý Trang Web",
      children: [
        {
          path: "/admin/content",
          icon: "ri-article-line",
          label: "Bài Viết",
        },
        {
          path: "/admin/content/reportsComment",
          icon: "ri-chat-3-line",
          label: "Báo Cáo Bình Luận",
        },
        {
          path: "/admin/content/reports",
          icon: "ri-flag-line",
          label: "Báo Cáo Bài Viết",
        },
      ],
    },
    {
      path: "/admin/groups",
      icon: "ri-group-line",
      label: "Quản Lý Hội Nhóm",
      children: [
        { path: "/admin/groups", icon: "ri-team-line", label: "All Groups" },
        {
          path: "/admin/groups/reports",
          icon: "ri-alarm-warning-line",
          label: "Báo Cáo Nhóm",
        },
      ],
    },
    {
      path: "/admin/journals",
      icon: "ri-book-open-line",
      label: "Quản Lý Nhật Kí",
    },
    {
      path: "/admin/chats",
      icon: "ri-chat-1-line",
      label: "Chats",
    },
    {
      path: "/admin/appeals",
      icon: "ri-file-list-3-line", //kháng nghị
      label: "Quản Lý Kháng Nghị",
    },
    {
      path: "/admin/quotes",
      icon: "ri-double-quotes-l", // icon câu trích dẫn / châm ngôn
      label: "Châm Ngôn",
    },
    {
      path: "/admin/emergencies",
      icon: "ri-alarm-warning-line", // icon cảnh báo / khẩn cấp
      label: "Khẩn Cấp",
    },

    {
      path: "/admin/system",
      icon: "ri-settings-3-line",
      label: "Cài Đặt Hệ Thống",
      children: [
        {
          path: "/admin/imagemanager",
          icon: "ri-image-line",
          label: "Hình Ảnh",
        },
        {
          path: "/admin/security",
          icon: "ri-shield-line",
          label: "Bảo mật",
        },
        // {
        //   path: "/admin/system/backup",
        //   icon: "ri-database-2-line",
        //   label: "Backup & Restore",
        // },

        {
          label: "Backup & Restore", // <-- SỬA: "title" đổi thành "label"
          icon: "ri-database-2-line",

          label: "Sao lưu & Khôi phục",

          children: [
            // <-- Component của bạn có thể tìm "items" hoặc "children"
            {
              label: "Quản lý Backup", // <-- SỬA: "title" đổi thành "label"
              path: "/admin/backup",
              icon: "ri-save-3-line",
            },
            {
              label: "Lịch sử Backup", // <-- SỬA: "title" đổi thành "label"
              path: "/admin/backup/logs",
              icon: "ri-history-line",
            },
          ],
        },
      ],
    },
    {
      path: "/admin/analytics",
      icon: "ri-bar-chart-line",
      label: "Phân tích",
      children: [
        {
          path: "/admin/analytics/overview",
          icon: "ri-dashboard-line",
          label: "Tổng quan",
        },
        {
          path: "/admin/analytics/users",
          icon: "ri-user-heart-line",
          label: "Người dùng",
        },
        {
          path: "/admin/analytics/content",
          icon: "ri-line-chart-line",
          label: "Nội dung",
        },
      ],
    },
    { path: "/admin/logs", icon: "ri-file-list-3-line", label: "System Logs" },
    {
      path: "/admin/appealsForUser",
      icon: "ri-question-answer-line", //kháng nghị
      label: "Quản lý hỗ trợ",
    },
  ];

  return (
    <>
      {/* Sidebar Navigation bên trái - GIỐNG HỆT Navbar user */}
      <div
        className={`iq-sidebar sidebar-default admin-sidebar ${
          isCollapsed ? "sidebar-mini" : ""
        }`}
      >
        <div
          id="sidebar-scrollbar"
          style={{
            overflowY: "auto",
            scrollbarWidth: "none", // Firefox
            msOverflowStyle: "none", // IE/Edge
          }}
          onScroll={(e) => {
            e.currentTarget.style.scrollbarWidth = "none";
          }}
        >
          <nav className="iq-sidebar-menu">
            <ul id="iq-sidebar-toggle" className="iq-menu">
              {/* Admin Header trong sidebar */}
              <li className="sidebar-header">
                {/* Bọc trong thẻ <a> để CSS hoạt động đúng */}
                <a
                  href="#!"
                  onClick={(e) => e.preventDefault()}
                  className="d-flex align-items-center p-3 border-bottom border-secondary text-decoration-none"
                >
                  <div className="admin-avatar">
                    <i className="ri-admin-line text-primary fs-3"></i>
                  </div>
                  <span className="ms-3">
                    <h6 className="mb-0 text">Admin Panel</h6>
                    <small className="text-secondary-50">
                      Quản trị hệ thống
                    </small>
                  </span>
                </a>
              </li>

              {adminNavItems.map((item, idx) => {
                const childrenArr = Array.isArray(item.children)
                  ? item.children
                  : [];
                const hasChildren = childrenArr.length > 0;
                const isActive = hasChildren
                  ? isActiveParent(childrenArr.map((child) => child.path))
                  : isActiveRoute(item.path);
                const isExpanded = hasChildren && isActive;

                const rawId =
                  (item.path && String(item.path)) ||
                  (item.label && String(item.label)) ||
                  `menu-${idx}`;
                const submenuId =
                  rawId.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") ||
                  `menu-${idx}`;

                return (
                  <li
                    key={rawId || submenuId || idx}
                    className={isActive ? "active" : ""}
                  >
                    {hasChildren ? (
                      <>
                        <a
                          href={`#${submenuId}`}
                          data-bs-toggle="collapse"
                          className={isExpanded ? "" : "collapsed"}
                          aria-expanded={isExpanded}
                          aria-controls={submenuId}
                        >
                          <i className={item.icon}></i>
                          <span>{item.label}</span>
                          <i className="ri-arrow-right-s-line iq-arrow-right"></i>
                        </a>

                        <ul
                          id={submenuId}
                          className={`iq-submenu ${
                            isExpanded ? "show" : "collapse"
                          }`}
                          data-bs-parent="#iq-sidebar-toggle"
                        >
                          {(childrenArr || []).map((child, cidx) => {
                            const grandChildrenArr = Array.isArray(
                              child.children
                            )
                              ? child.children
                              : [];
                            const childHasChildren =
                              grandChildrenArr.length > 0;

                            const childRawId =
                              (child.path && String(child.path)) ||
                              (child.label && String(child.label)) ||
                              `${submenuId}-child-${cidx}`;
                            const childSubmenuId =
                              childRawId
                                .replace(/[^a-z0-9]+/gi, "-")
                                .replace(/^-|-$/g, "") ||
                              `${submenuId}-child-${cidx}`;

                            if (childHasChildren) {
                              const childActive = isActiveParent(
                                grandChildrenArr.map((gc) => gc.path)
                              );
                              return (
                                <li
                                  key={childRawId}
                                  className={childActive ? "active" : ""}
                                >
                                  <a
                                    href={`#${childSubmenuId}`}
                                    data-bs-toggle="collapse"
                                    className={childActive ? "" : "collapsed"}
                                    aria-expanded={childActive}
                                    aria-controls={childSubmenuId}
                                  >
                                    <i className={child.icon}></i>
                                    <span>{child.label}</span>
                                    <i className="ri-arrow-right-s-line iq-arrow-right"></i>
                                  </a>

                                  <ul
                                    id={childSubmenuId}
                                    className={`iq-submenu ${
                                      childActive ? "show" : "collapse"
                                    }`}
                                  >
                                    {(grandChildrenArr || []).map(
                                      (grand, gidx) => {
                                        const grandKey =
                                          grand.path ||
                                          grand.label ||
                                          `${childRawId}-grand-${gidx}`;
                                        return (
                                          <li
                                            key={grandKey}
                                            className={
                                              isActiveRoute(grand.path)
                                                ? "active"
                                                : ""
                                            }
                                          >
                                            <Link
                                              to={grand.path || "#"}
                                              className={
                                                isActiveRoute(grand.path)
                                                  ? "active"
                                                  : ""
                                              }
                                            >
                                              <i className={grand.icon}></i>
                                              <span>{grand.label}</span>
                                            </Link>
                                          </li>
                                        );
                                      }
                                    )}
                                  </ul>
                                </li>
                              );
                            }

                            // regular child (no grandchildren)
                            const childKey =
                              child.path ||
                              child.label ||
                              `${rawId}-child-${cidx}`;
                            return (
                              <li
                                key={childKey}
                                className={
                                  isActiveRoute(child.path) ? "active" : ""
                                }
                              >
                                <Link
                                  to={child.path || "#"}
                                  className={
                                    isActiveRoute(child.path) ? "active" : ""
                                  }
                                >
                                  <i className={child.icon}></i>
                                  <span>{child.label}</span>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </>
                    ) : (
                      <TooltipWrapper title={item.label} placement="right">
                        <Link
                          to={item.path || "#"}
                          className={`nav-link ${
                            isActiveRoute(item.path) ? "active" : ""
                          }`}
                        >
                          <i className={item.icon}></i>
                          <span>{item.label}</span>
                        </Link>
                      </TooltipWrapper>
                    )}
                  </li>
                );
              })}

              {/* Footer actions */}
              <li className="sidebar-footer mt-auto pt-3 border-top border-secondary">
                <TooltipWrapper title="Về ứng dụng" placement="right">
                  <Link to="/feed" className="nav-link sidebar-footer-item">
                    <i className="ri-arrow-left-line"></i>
                    <span>Về ứng dụng</span>
                  </Link>
                </TooltipWrapper>
              </li>
              <li>
                <TooltipWrapper title="Đăng xuất" placement="right">
                  <a
                    className="nav-link sidebar-footer-item text-danger"
                    onClick={handleLogout}
                    style={{
                      background: "none",
                      border: "none",
                      width: "100%",
                    }}
                  >
                    <i className="ri-logout-box-r-line"></i>
                    <span>Đăng xuất</span>
                  </a>
                </TooltipWrapper>
              </li>
            </ul>
          </nav>
          <div className="p-5"></div>
        </div>
      </div>

      {/* Top Navigation Bar - bên trên */}
      <div className="iq-top-navbar a">
        <div className="iq-navbar-custom">
          <nav className="navbar navbar-expand-lg navbar-light p-0">
            <div className="iq-navbar-logo d-flex justify-content-between">
              <Link to="/admin">
                <img
                  src="/assets/images/logo.png"
                  className="img-fluid"
                  alt="SocialV Admin"
                />
                <span>Connect Admin</span>
              </Link>
              <div
                className="iq-menu-bt align-self-center"
                onClick={onToggleSidebar}
              >
                <div className="wrapper-menu">
                  <div className="main-circle">
                    <i className="ri-menu-line"></i>
                  </div>
                </div>
              </div>
            </div>

            {/* Search Bar */}
            <div className="iq-search-bar device-search">
              <form action="#" className="searchbox">
                <a className="search-link" href="#">
                  <i className="ri-search-line"></i>
                </a>
                <input
                  type="text"
                  className="text search-input"
                  placeholder="Search in admin..."
                />
              </form>
            </div>

            <button
              className="navbar-toggler"
              type="button"
              data-bs-toggle="collapse"
              data-bs-target="#navbarSupportedContent"
              aria-controls="navbarSupportedContent"
              aria-label="Toggle navigation"
            >
              <i className="ri-menu-3-line"></i>
            </button>

            <div
              className="collapse navbar-collapse"
              id="navbarSupportedContent"
            >
              <ul className="navbar-nav ms-auto navbar-list">
                {/* Dashboard */}
                <li>
                  <Link to="/admin" className="d-flex align-items-center">
                    <i className="ri-dashboard-line"></i>
                  </Link>
                </li>

                {/* Quick Stats */}
                {/* <li className="nav-item dropdown">
                  <a
                    href="#"
                    className="dropdown-toggle"
                    id="stats-drop"
                    data-bs-toggle="dropdown"
                    aria-haspopup="true"
                    aria-expanded="false"
                  >
                    <i className="ri-bar-chart-line"></i>
                  </a>
                  <div
                    className="sub-drop sub-drop-large dropdown-menu dropdown-menu-end"
                    aria-labelledby="stats-drop"
                  >
                    <div className="card shadow-none m-0">
                      <div className="card-header d-flex justify-content-between bg-primary">
                        <div className="header-title">
                          <h5 className="mb-0 text-white">Thống kê hệ thống</h5>
                        </div>
                        <small className="badge bg-light text-dark">Live</small>
                      </div>
                      <div className="card-body p-0">
                        <div className="p-3">
                          <div className="d-flex justify-content-between mb-2">
                            <span>Người dùng đang hoạt động:</span>
                            <strong>1,234</strong>
                          </div>
                          <div className="d-flex justify-content-between mb-2">
                            <span>Bài viết mới:</span>
                            <strong>56</strong>
                          </div>
                          <div className="d-flex justify-content-between mb-2">
                            <span>Đang chờ kiểm duyệt:</span>
                            <strong className="text-warning">23</strong>
                          </div>
                          <div className="d-flex justify-content-between">
                            <span>System Load:</span>
                            <strong className="text-success">45%</strong>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li> */}
                <li>
                  <Link
                    to="/admin/analytics/overview"
                    className="d-flex align-items-center"
                    title="Tổng Quan"
                  >
                    <i className="ri-bar-chart-line"></i>
                  </Link>
                </li>

                <AdminNotifications />

                {/* System Status */}
                {/* <li className="nav-item dropdown">
                  <a
                    href="#"
                    className="dropdown-toggle"
                    id="system-drop"
                    data-bs-toggle="dropdown"
                    aria-haspopup="true"
                    aria-expanded="false"
                  >
                    <i className="ri-server-line"></i>
                  </a>
                  <div
                    className="sub-drop dropdown-menu dropdown-menu-end"
                    aria-labelledby="system-drop"
                  >
                    <div className="card shadow-none m-0">
                      <div className="card-header d-flex justify-content-between bg-primary">
                        <div className="header-title">
                          <h5 className="mb-0 text-white">
                            Trạng thái hệ thống
                          </h5>
                        </div>
                        <small className="badge bg-success">Healthy</small>
                      </div>
                      <div className="card-body p-0">
                        <div className="p-3">
                          <div className="d-flex justify-content-between mb-2">
                            <span>CPU Usage:</span>
                            <span className="text-success">45%</span>
                          </div>
                          <div className="d-flex justify-content-between mb-2">
                            <span>Memory:</span>
                            <span className="text-warning">68%</span>
                          </div>
                          <div className="d-flex justify-content-between mb-2">
                            <span>Storage:</span>
                            <span className="text-info">32%</span>
                          </div>
                          <div className="d-flex justify-content-between">
                            <span>Uptime:</span>
                            <span className="text-primary">15 days</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </li> */}

                <li>
                  <Link
                    to="/admin/backup"
                    className="d-flex align-items-center"
                    title="Backup & Restore"
                  >
                    <i className="ri-server-line"></i>
                  </Link>
                </li>

                {/* User Profile Dropdown */}
                <li className="nav-item dropdown">
                  <a
                    href="#"
                    className="d-flex align-items-center dropdown-toggle"
                    id="drop-down-arrow"
                    data-bs-toggle="dropdown"
                    aria-haspopup="true"
                    aria-expanded="false"
                  >
                    <img
                      src={user?.profile?.avatar || "/assets/images/user/1.jpg"}
                      className="img-fluid rounded-circle me-3"
                      alt="user"
                    />
                    {/* <div className="admin-avatar-small me-2">
                      <i className="ri-admin-line text-white"></i>
                    </div> */}
                    <div className="caption">
                      <h6 className="mb-0 line-height ">
                        {user?.username || "Admin"}
                      </h6>
                      <small className="">Administrator</small>
                    </div>
                  </a>
                  <div
                    className="sub-drop dropdown-menu dropdown-menu-end caption-menu"
                    aria-labelledby="drop-down-arrow"
                  >
                    <div className="card shadow-none m-0">
                      <div className="card-header bg-primary">
                        <div className="header-title">
                          <h6 className="mb-0 ">Admin Panel</h6>
                          <h6 className="mb-0 ">{user?.username || "Admin"}</h6>
                          <span className="text-white font-size-12">
                            System Administrator
                          </span>
                        </div>
                      </div>
                      <div className="card-body p-0">
                        <Link
                          to="/profile"
                          className="iq-sub-card iq-bg-primary-hover"
                        >
                          <div className="d-flex align-items-center">
                            <div className="rounded card-icon bg-soft-primary">
                              <i className="ri-user-line"></i>
                            </div>
                            <div className="ms-3">
                              <h6 className="mb-0">Trang cá nhân admin</h6>
                              <p className="mb-0 font-size-12">
                                Xem và chỉnh sửa thông tin cá nhân admin
                              </p>
                            </div>
                          </div>
                        </Link>
                        <Link
                          to="/admin/security"
                          className="iq-sub-card iq-bg-warning-hover"
                        >
                          <div className="d-flex align-items-center">
                            <div className="rounded card-icon bg-soft-warning">
                              <i className="ri-settings-3-line"></i>
                            </div>
                            <div className="ms-3">
                              <h6 className="mb-0">Cài đặt hệ thống</h6>
                              <p className="mb-0 font-size-12">
                                Quản lý cài đặt hệ thống và tùy chọn.
                              </p>
                            </div>
                          </div>
                        </Link>
                        <Link
                          to="/feed"
                          className="iq-sub-card iq-bg-info-hover"
                        >
                          <div className="d-flex align-items-center">
                            <div className="rounded card-icon bg-soft-info">
                              <i className="ri-arrow-left-line"></i>
                            </div>
                            <div className="ms-3">
                              <h6 className="mb-0">Quay lại trang chủ</h6>
                              <p className="mb-0 font-size-12">
                                Trở về giao diện người dùng chính.
                              </p>
                            </div>
                          </div>
                        </Link>
                        <div className="d-inline-block w-100 text-center p-3">
                          <button
                            className="btn btn-primary iq-sign-btn"
                            onClick={handleLogout}
                          >
                            Đăng xuất<i className="ri-login-box-line ms-2"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              </ul>
            </div>
          </nav>
        </div>
      </div>

      {/* Right Sidebar - Simplified for Admin */}
      {/* <div className="right-sidebar-mini right-sidebar">
        <div className="right-sidebar-panel p-0">
          <div className="card shadow-none">
            <div className="card-body p-0">
              <div className="media-height p-3" data-scrollbar="init">
                <h6 className="mb-3">Quick Actions</h6>
                <div className="quick-actions">
                  <Link
                    to="/admin/users/create"
                    className="btn btn-primary btn-sm w-100 mb-2"
                  >
                    <i className="ri-user-add-line me-1"></i>Add User
                  </Link>
                  <Link
                    to="/admin/content"
                    className="btn btn-warning btn-sm w-100 mb-2"
                  >
                    <i className="ri-article-line me-1"></i>Moderate
                  </Link>
                  <Link
                    to="/admin/analytics"
                    className="btn btn-info btn-sm w-100"
                  >
                    <i className="ri-bar-chart-line me-1"></i>Analytics
                  </Link>
                </div>
              </div>
              <div className="right-sidebar-toggle bg-primary text-white mt-3">
                <i className="ri-arrow-left-line side-left-icon"></i>
                <i className="ri-arrow-right-line side-right-icon">
                  <span className="ms-3 d-inline-block">Close Menu</span>
                </i>
              </div>
            </div>
          </div>
        </div>
      </div> */}
    </>
  );
}

export default NavbarAdmin;
