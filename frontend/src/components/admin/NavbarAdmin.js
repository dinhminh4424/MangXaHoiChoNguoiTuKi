import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import TooltipWrapper from "../TooltipWrapper";
import AdminNotifications from "../notification/AdminNotifications";

function NavbarAdmin() {
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
          path: "/admin/users/create",
          icon: "ri-user-add-line",
          label: "Thêm Người Dùng",
        },
        {
          path: "/admin/users/roles",
          icon: "ri-shield-keyhole-line",
          label: "Quản Lý Phân Quyền",
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
      path: "/admin/system",
      icon: "ri-settings-3-line",
      label: "System Settings",
      children: [
        {
          path: "/admin/system/general",
          icon: "ri-settings-line",
          label: "General Settings",
        },
        {
          path: "/admin/system/security",
          icon: "ri-shield-line",
          label: "Security",
        },
        {
          path: "/admin/system/backup",
          icon: "ri-database-2-line",
          label: "Backup & Restore",
        },
      ],
    },
    {
      path: "/admin/analytics",
      icon: "ri-bar-chart-line",
      label: "Analytics",
      children: [
        {
          path: "/admin/analytics/overview",
          icon: "ri-dashboard-line",
          label: "Overview",
        },
        {
          path: "/admin/analytics/users",
          icon: "ri-user-heart-line",
          label: "User Analytics",
        },
        {
          path: "/admin/analytics/content",
          icon: "ri-line-chart-line",
          label: "Content Analytics",
        },
      ],
    },
    { path: "/admin/logs", icon: "ri-file-list-3-line", label: "System Logs" },
  ];

  return (
    <>
      {/* Sidebar Navigation bên trái - GIỐNG HỆT Navbar user */}
      <div className="iq-sidebar sidebar-default admin-sidebar">
        <div id="sidebar-scrollbar">
          <nav className="iq-sidebar-menu">
            <ul id="iq-sidebar-toggle" className="iq-menu">
              {/* Admin Header trong sidebar */}
              <li className="sidebar-header">
                <div className="d-flex align-items-center p-3 border-bottom border-secondary">
                  <div className="admin-avatar me-3">
                    <i className="ri-admin-line text-primary fs-3"></i>
                  </div>
                  <div className="admin-details">
                    <h6 className="mb-0 text">Admin Panel</h6>
                    <small className="text-secondary-50">
                      Quản trị hệ thống
                    </small>
                  </div>
                </div>
              </li>

              {adminNavItems.map((item) => {
                const hasChildren =
                  Array.isArray(item.children) && item.children.length > 0;
                const isActive = hasChildren
                  ? isActiveParent(item.children.map((child) => child.path))
                  : isActiveRoute(item.path);
                const isExpanded = hasChildren && isActive;

                return (
                  <li key={item.path} className={isActive ? "active" : ""}>
                    {hasChildren ? (
                      <>
                        <a
                          href={`#${item.path.replace("/admin/", "")}`}
                          data-bs-toggle="collapse"
                          className={`collapsed ${
                            isExpanded ? "" : "collapsed"
                          }`}
                          aria-expanded={isExpanded}
                        >
                          <i className={item.icon}></i>
                          <span>{item.label}</span>
                          <i className="ri-arrow-right-s-line iq-arrow-right"></i>
                        </a>
                        <ul
                          id={item.path.replace("/admin/", "")}
                          className={`iq-submenu ${
                            isExpanded ? "show" : "collapse"
                          }`}
                          data-bs-parent="#iq-sidebar-toggle"
                        >
                          {item.children.map((child) => (
                            <li
                              key={child.path}
                              className={
                                isActiveRoute(child.path) ? "active" : ""
                              }
                            >
                              <Link
                                to={child.path}
                                className={
                                  isActiveRoute(child.path) ? "active" : ""
                                }
                              >
                                <i className={child.icon}></i>
                                <span>{child.label}</span>
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <TooltipWrapper title={item.label} placement="right">
                        <Link
                          to={item.path}
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
              <li className="sidebar-footer mt-3">
                <div className="p-3 border-top border-secondary">
                  <Link
                    to="/feed"
                    className="btn btn-outline-light btn-sm w-100 mb-2"
                  >
                    <i className="ri-arrow-left-line me-2"></i>
                    Về ứng dụng
                  </Link>
                  <button
                    className="btn btn-danger btn-sm w-100"
                    onClick={handleLogout}
                  >
                    <i className="ri-logout-box-r-line me-2"></i>
                    Đăng xuất
                  </button>
                </div>
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
                <span>SocialV Admin</span>
              </Link>
              <div className="iq-menu-bt align-self-center">
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
                <li className="nav-item dropdown">
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
                          <h5 className="mb-0 text-white">System Stats</h5>
                        </div>
                        <small className="badge bg-light text-dark">Live</small>
                      </div>
                      <div className="card-body p-0">
                        <div className="p-3">
                          <div className="d-flex justify-content-between mb-2">
                            <span>Users Online:</span>
                            <strong>1,234</strong>
                          </div>
                          <div className="d-flex justify-content-between mb-2">
                            <span>New Posts:</span>
                            <strong>56</strong>
                          </div>
                          <div className="d-flex justify-content-between mb-2">
                            <span>Pending Moderation:</span>
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
                </li>

                {/* Notifications Dropdown */}
                {/* <li className="nav-item dropdown">
                  <a
                    href="#"
                    className="search-toggle dropdown-toggle"
                    id="notification-drop"
                    data-bs-toggle="dropdown"
                  >
                    <i className="ri-notification-4-line"></i>
                    <span className="badge bg-danger notification-badge">
                      5
                    </span>
                  </a>
                  <div
                    className="sub-drop dropdown-menu dropdown-menu-end"
                    aria-labelledby="notification-drop"
                  >
                    <div className="card shadow-none m-0">
                      <div className="card-header d-flex justify-content-between bg-primary">
                        <div className="header-title bg-primary">
                          <h5 className="mb-0 text-white">Admin Alerts</h5>
                        </div>
                        <small className="badge bg-light text-dark">5</small>
                      </div>
                      <div className="card-body p-0">
                        <div className="p-3">
                          <div className="alert alert-warning p-2 mb-2">
                            <small>3 users reported</small>
                          </div>
                          <div className="alert alert-danger p-2 mb-2">
                            <small>System backup required</small>
                          </div>
                          <div className="alert alert-info p-2">
                            <small>New version available</small>
                          </div>
                        </div>
                        <div className="text-center p-2 border-top">
                          <Link
                            to="/admin/notifications"
                            className="btn text-primary"
                          >
                            View All Alerts
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </li> */}

                <AdminNotifications />

                {/* System Status */}
                <li className="nav-item dropdown">
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
                          <h5 className="mb-0 text-white">System Status</h5>
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
                            Super Administrator
                          </span>
                        </div>
                      </div>
                      <div className="card-body p-0">
                        <Link
                          to="/admin/profile"
                          className="iq-sub-card iq-bg-primary-hover"
                        >
                          <div className="d-flex align-items-center">
                            <div className="rounded card-icon bg-soft-primary">
                              <i className="ri-user-line"></i>
                            </div>
                            <div className="ms-3">
                              <h6 className="mb-0">Admin Profile</h6>
                              <p className="mb-0 font-size-12">
                                View admin profile details.
                              </p>
                            </div>
                          </div>
                        </Link>
                        <Link
                          to="/admin/settings"
                          className="iq-sub-card iq-bg-warning-hover"
                        >
                          <div className="d-flex align-items-center">
                            <div className="rounded card-icon bg-soft-warning">
                              <i className="ri-settings-3-line"></i>
                            </div>
                            <div className="ms-3">
                              <h6 className="mb-0">System Settings</h6>
                              <p className="mb-0 font-size-12">
                                Configure system parameters.
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
                              <h6 className="mb-0">Back to App</h6>
                              <p className="mb-0 font-size-12">
                                Return to user application.
                              </p>
                            </div>
                          </div>
                        </Link>
                        <div className="d-inline-block w-100 text-center p-3">
                          <button
                            className="btn btn-primary iq-sign-btn"
                            onClick={handleLogout}
                          >
                            Sign out<i className="ri-login-box-line ms-2"></i>
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
      <div className="right-sidebar-mini right-sidebar">
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
      </div>
    </>
  );
}

export default NavbarAdmin;
