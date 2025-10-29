import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import TooltipWrapper from "./TooltipWrapper";
import UserNotifications from "./notification/UserNotifications";
function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();
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

  // Main navigation items
  const mainNavItems = [
    { path: "/", icon: "fa-solid fa-house", label: "Home" },
    { path: "/feed", icon: "las la-newspaper", label: "Newsfeed" },
    { path: "/profile", icon: "las la-user", label: "Profile" },
    { path: "/chat", icon: "las la-comments", label: "Chat" },
    { path: "/group", icon: "las la-users", label: "Group" },
    { path: "/todo", icon: "las la-check-circle", label: "Todo" },
    {
      path: "/journal",
      icon: "las la-book",
      label: "Journal",
      children: [
        { path: "/journal", icon: "las la-list", label: "Overview" },
        { path: "/journal/history", icon: "las la-history", label: "History" },
      ],
    },
    { path: "/calendar", icon: "las la-calendar", label: "Calendar" },
    {
      path: "/email",
      icon: "ri-mail-line",
      label: "Email",
      children: [
        { path: "/email/inbox", icon: "ri-inbox-line", label: "Inbox" },
        {
          path: "/email/compose",
          icon: "ri-edit-line",
          label: "Email Compose",
        },
      ],
    },
    {
      path: "/ui-elements",
      icon: "ri-focus-2-line",
      label: "UI Elements",
      children: [
        { path: "/ui/colors", icon: "ri-font-color", label: "Colors" },
        { path: "/ui/typography", icon: "ri-text", label: "Typography" },
        {
          path: "/ui/buttons",
          icon: "ri-checkbox-blank-line",
          label: "Buttons",
        },
        { path: "/ui/cards", icon: "ri-bank-card-line", label: "Cards" },
      ],
    },
    {
      path: "/pages",
      icon: "ri-pages-line",
      label: "Pages",
      children: [
        { path: "/login", icon: "ri-login-box-line", label: "Login" },
        { path: "/register", icon: "ri-login-circle-line", label: "Register" },
        { path: "/pricing", icon: "ri-price-tag-line", label: "Pricing" },
      ],
    },
  ];

  return (
    <>
      {/* Sidebar Navigation bên trái */}
      <div className="iq-sidebar sidebar-default">
        <div id="sidebar-scrollbar">
          <nav className="iq-sidebar-menu">
            <ul id="iq-sidebar-toggle" className="iq-menu">
              {mainNavItems.map((item) => {
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
                          href={`#${item.path.replace("/", "")}`}
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
                          id={item.path.replace("/", "")}
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
            </ul>
          </nav>
          <div className="p-5"></div>
        </div>
      </div>

      {/* Top Navigation Bar - bên trên  */}
      <div className="iq-top-navbar">
        <div className="iq-navbar-custom">
          <nav className="navbar navbar-expand-lg navbar-light p-0">
            <div className="iq-navbar-logo d-flex justify-content-between">
              <Link to="/feed">
                <img
                  src="/assets/images/logo.png"
                  className="img-fluid"
                  alt="SocialV Logo"
                />
                <span>SocialV</span>
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
                  placeholder="Search here..."
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
                {/* Home */}
                <li>
                  <Link to="/feed" className="d-flex align-items-center">
                    <i className="ri-home-line"></i>
                  </Link>
                </li>

                {/* nhận diện gợi ý  */}
                <li>
                  <Link to="/nhandien" className="d-flex align-items-center">
                    <i className="lab la-buffer"></i>
                  </Link>
                </li>
                {/* Friend Requests Dropdown */}
                <li className="nav-item dropdown">
                  <a
                    href="#"
                    className="dropdown-toggle"
                    id="group-drop"
                    data-bs-toggle="dropdown"
                    aria-haspopup="true"
                    aria-expanded="false"
                  >
                    <i className="ri-group-line"></i>
                  </a>
                  <div
                    className="sub-drop sub-drop-large dropdown-menu dropdown-menu-end"
                    aria-labelledby="group-drop"
                  >
                    <div className="card shadow-none m-0">
                      <div className="card-header d-flex justify-content-between bg-primary">
                        <div className="header-title">
                          <h5 className="mb-0 text-white">Friend Request</h5>
                        </div>
                        <small className="badge bg-light text-dark">
                          99999
                        </small>
                      </div>
                      <div className="card-body p-0">
                        <div className="text-center p-3">
                          <p className="mb-2">
                            Friend requests will appear here
                          </p>
                          <Link
                            to="/friends/requests"
                            className="btn text-primary"
                          >
                            View Friend Requests
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>

                <UserNotifications />

                {/* Notifications Dropdown */}
                {/* <li className="nav-item dropdown ">
                  <a
                    href="#"
                    className="search-toggle dropdown-toggle"
                    id="notification-drop"
                    data-bs-toggle="dropdown"
                  >
                    <i className="ri-notification-4-line"></i>
                  </a>
                  <div
                    className="sub-drop dropdown-menu dropdown-menu-end"
                    aria-labelledby="notification-drop"
                  >
                    <div className="card shadow-none m-0">
                      <div className="card-header d-flex justify-content-between bg-primary">
                        <div className="header-title bg-primary">
                          <h5 className="mb-0 text-white">All Notifications</h5>
                        </div>
                        <small className="badge bg-light text-dark">100</small>
                      </div>
                      <div className="card-body p-0">
                        <div className="text-center p-3">
                          <p className="mb-2">No new notifications</p>
                          <Link
                            to="/notifications"
                            className="btn text-primary"
                          >
                            View All Notifications
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </li> */}

                {/* Messages Dropdown */}
                {/* <li className="nav-item dropdown">
                  <a
                    href="#"
                    className="dropdown-toggle"
                    id="mail-drop"
                    data-bs-toggle="dropdown"
                    aria-haspopup="true"
                    aria-expanded="false"
                  >
                    <i className="ri-mail-line"></i>
                  </a>
                  <div
                    className="sub-drop dropdown-menu dropdown-menu-end"
                    aria-labelledby="mail-drop"
                  >
                    <div className="card shadow-none m-0">
                      <div className="card-header d-flex justify-content-between bg-primary">
                        <div className="header-title bg-primary">
                          <h5 className="mb-0 text-white">All Messages</h5>
                        </div>
                        <small className="badge bg-light text-dark">10</small>
                      </div>
                      <div className="card-body p-0">
                        <div className="text-center p-3">
                          <p className="mb-2">No new messages</p>
                          <Link to="/chat" className="btn text-primary">
                            View All Messages
                          </Link>
                        </div>
                      </div>
                    </div>
                  </div>
                </li> */}

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
                    <div className="caption">
                      <h6 className="mb-0 line-height">
                        {user?.fullName || "User"}
                      </h6>
                    </div>
                  </a>
                  <div
                    className="sub-drop dropdown-menu dropdown-menu-end caption-menu"
                    aria-labelledby="drop-down-arrow"
                  >
                    <div className="card shadow-none m-0">
                      <div className="card-header bg-primary">
                        <div className="header-title">
                          <h6 className="mb-0 text-white">Hello</h6>
                          <h6 className="mb-0 text-white">
                            {user?.username || "User"}
                          </h6>
                          <span className="text-white font-size-12">
                            Available
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
                              <i className="ri-file-user-line"></i>
                            </div>
                            <div className="ms-3">
                              <h6 className="mb-0">My Profile</h6>
                              <p className="mb-0 font-size-12">
                                View personal profile details.
                              </p>
                            </div>
                          </div>
                        </Link>
                        <Link
                          to="/profile/dashboard"
                          className="iq-sub-card iq-bg-warning-hover"
                        >
                          <div className="d-flex align-items-center">
                            <div className="rounded card-icon bg-soft-warning">
                              <i className="ri-profile-line"></i>
                            </div>
                            <div className="ms-3">
                              <h6 className="mb-0">Thống Kê</h6>
                              <p className="mb-0 font-size-12">
                                Chi tiết thống kê tài khoản
                              </p>
                            </div>
                          </div>
                        </Link>
                        <Link
                          to="/settings"
                          className="iq-sub-card iq-bg-info-hover"
                        >
                          <div className="d-flex align-items-center">
                            <div className="rounded card-icon bg-soft-info">
                              <i className="ri-account-box-line"></i>
                            </div>
                            <div className="ms-3">
                              <h6 className="mb-0">Account settings</h6>
                              <p className="mb-0 font-size-12">
                                Manage your account parameters.
                              </p>
                            </div>
                          </div>
                        </Link>
                        {user?.role === "admin" && (
                          <Link
                            to="/admin"
                            className="iq-sub-card iq-bg-danger-hover"
                          >
                            <div className="d-flex align-items-center">
                              <div className="rounded card-icon bg-soft-danger">
                                <i className="ri-admin-line"></i>
                              </div>
                              <div className="ms-3">
                                <h6 className="mb-0">Admin Panel</h6>
                                <p className="mb-0 font-size-12">
                                  Quản trị hệ thống.
                                </p>
                              </div>
                            </div>
                          </Link>
                        )}
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

      {/* Right Sidebar - Simplified */}
      <div className="right-sidebar-mini right-sidebar">
        <div className="right-sidebar-panel p-0">
          <div className="card shadow-none">
            <div className="card-body p-0">
              <div className="media-height p-3" data-scrollbar="init">
                <h6 className="mb-3">Online Friends</h6>
                <div className="text-center">
                  <p className="text-muted">No friends online</p>
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

export default Navbar;
