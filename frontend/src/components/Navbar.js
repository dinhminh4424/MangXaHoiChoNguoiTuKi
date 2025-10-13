import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useJournal } from "../contexts/JournalContext";
import TooltipWrapper from "../components/TooltipWrapper.jsx";
import {
  Home,
  MessageCircle,
  User,
  BookOpen,
  PlusCircle,
  History,
  LogOut,
  LogIn,
  UserPlus,
  Newspaper,
  Bookmark,
  ChevronDown,
  Settings,
  UserCircle,
} from "lucide-react";

function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { todayJournal, fetchTodayJournal } = useJournal();
  const [isJournalDropdownOpen, setIsJournalDropdownOpen] = useState(false);
  const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !todayJournal) {
      fetchTodayJournal();
    }
  }, [isAuthenticated, todayJournal, fetchTodayJournal]);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setIsUserDropdownOpen(false);
  };

  const isActiveRoute = (path) => {
    return location.pathname === path;
  };

  const NavItem = ({
    to,
    icon: Icon,
    children,
    tooltip,
    onClick,
    isActive,
  }) => (
    <li className="nav-item">
      <TooltipWrapper title={tooltip} placement="bottom">
        <Link
          className={`nav-link d-flex align-items-center gap-2 px-3 py-2 rounded-2 transition-all ${
            isActive
              ? "active text-primary bg-primary-soft"
              : "text-gray-600 hover-bg-light"
          }`}
          to={to}
          onClick={onClick}
        >
          <Icon size={18} />
          <span className="fw-medium">{children}</span>
        </Link>
      </TooltipWrapper>
    </li>
  );

  const DropdownItem = ({
    to,
    icon: Icon,
    children,
    tooltip,
    onClick,
    isDanger = false,
  }) => (
    <li>
      <TooltipWrapper title={tooltip} placement="right">
        <Link
          className={`dropdown-item d-flex align-items-center gap-3 py-2 px-3 rounded-2 transition-all ${
            isDanger ? "text-danger hover-bg-danger-soft" : "hover-bg-light"
          }`}
          to={to}
          onClick={onClick}
        >
          <div
            className="d-flex align-items-center justify-content-center"
            style={{ width: "20px" }}
          >
            <Icon size={16} />
          </div>
          <span className={`fw-medium ${isDanger ? "text-danger" : ""}`}>
            {children}
          </span>
        </Link>
      </TooltipWrapper>
    </li>
  );

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm">
      <div className="container">
        {/* Brand */}
        <Link className="navbar-brand fw-bold text-primary fs-3" to="/">
          🌟 MindSpace
        </Link>

        {/* Toggler */}
        <button
          className="navbar-toggler border-0"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Navigation */}
        <div className="collapse navbar-collapse" id="navbarNav">
          {/* Left Navigation */}
          <ul className="navbar-nav me-auto">
            <NavItem
              to="/home"
              icon={Home}
              tooltip="Trang chủ"
              isActive={isActiveRoute("/home")}
            >
              Trang Chủ
            </NavItem>

            {isAuthenticated && (
              <>
                <NavItem
                  to="/chat"
                  icon={MessageCircle}
                  tooltip="Trò chuyện"
                  isActive={isActiveRoute("/chat")}
                >
                  Chat
                </NavItem>

                <NavItem
                  to="/feed"
                  icon={Newspaper}
                  tooltip="Bài viết cộng đồng"
                  isActive={isActiveRoute("/feed")}
                >
                  Feed
                </NavItem>

                <NavItem
                  to="/posts/createPost"
                  icon={PlusCircle}
                  tooltip="Tạo bài viết mới"
                  isActive={isActiveRoute("/posts/createPost")}
                >
                  Đăng Bài
                </NavItem>

                {/* Journal Dropdown */}
                <li className="nav-item dropdown">
                  <TooltipWrapper title="Nhật ký cá nhân" placement="bottom">
                    <a
                      className={`nav-link d-flex align-items-center gap-2 px-3 py-2 rounded-2 cursor-pointer transition-all ${
                        isJournalDropdownOpen
                          ? "text-primary bg-primary-soft"
                          : "text-gray-600 hover-bg-light"
                      }`}
                      role="button"
                      data-bs-toggle="dropdown"
                      aria-expanded="false"
                      onClick={() =>
                        setIsJournalDropdownOpen(!isJournalDropdownOpen)
                      }
                    >
                      <div className="position-relative">
                        <BookOpen size={18} />
                        {!todayJournal && (
                          <span className="position-absolute top-0 start-100 translate-middle p-1 bg-warning border border-light rounded-circle">
                            <span className="visually-hidden">
                              Chưa có nhật ký hôm nay
                            </span>
                          </span>
                        )}
                      </div>
                      <span className="fw-medium">Nhật Ký</span>
                      <ChevronDown
                        size={14}
                        className={`transition-transform ${
                          isJournalDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </a>
                  </TooltipWrapper>

                  <ul className="dropdown-menu border-0 shadow-lg rounded-3 p-2 min-w-200">
                    <DropdownItem
                      to="/journal"
                      icon={todayJournal ? Bookmark : PlusCircle}
                      tooltip="Viết nhật ký hôm nay"
                    >
                      <div className="d-flex flex-column">
                        <span className="fw-semibold">Hôm Nay</span>
                        <small className="text-muted">
                          {todayJournal ? "Tiếp tục viết" : "Bắt đầu mới"}
                        </small>
                      </div>
                    </DropdownItem>

                    <li>
                      <hr className="dropdown-divider my-2" />
                    </li>

                    <DropdownItem
                      to="/journal/history"
                      icon={History}
                      tooltip="Xem lịch sử nhật ký"
                    >
                      <div className="d-flex flex-column">
                        <span className="fw-semibold">Lịch Sử</span>
                        <small className="text-muted">Nhật ký đã viết</small>
                      </div>
                    </DropdownItem>
                  </ul>
                </li>
              </>
            )}
          </ul>

          {/* Right Navigation - User Dropdown */}
          <ul className="navbar-nav">
            {isAuthenticated ? (
              /* User Dropdown khi đã đăng nhập */
              <li className="nav-item dropdown">
                <a
                  className={`nav-link d-flex align-items-center gap-2 px-3 py-2 rounded-2 cursor-pointer transition-all ${
                    isUserDropdownOpen
                      ? "text-primary bg-primary-soft"
                      : "text-gray-600 hover-bg-light"
                  }`}
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                >
                  <div
                    className="bg-primary rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: "32px", height: "32px" }}
                  >
                    {/* <User size={16} className="text-white" /> */}

                    {user.profile.avatar ? (
                      <img
                        srcSet={user.profile.avatar}
                        style={{
                          width: "32px",
                          height: "32px",
                          border: "50%",
                          objectFit: "cover",
                        }}
                        className="rounded-circle"
                      />
                    ) : (
                      <User size={16} className="text-white" />
                    )}
                  </div>
                  <span className="fw-medium text-primary">
                    {user?.username}
                  </span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${
                      isUserDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </a>

                <ul className="dropdown-menu dropdown-menu-end border-0 shadow-lg rounded-3 p-2 min-w-220">
                  {/* User Info */}
                  <li className="px-3 py-2 border-bottom">
                    <div className="d-flex align-items-center">
                      {/* Cột 1: Avatar */}
                      <div
                        className="rounded-circle bg-primary d-flex align-items-center justify-content-center me-3"
                        style={{ width: "45px", height: "45px" }}
                      >
                        {user?.profile?.avatar ? (
                          <img
                            src={user.profile.avatar}
                            alt="Avatar"
                            className="rounded-circle"
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <UserCircle size={24} className="text-white" />
                        )}
                      </div>

                      {/* Cột 2: Thông tin user */}
                      <div className="flex-grow-1">
                        <span className="fw-bold text-dark d-block">
                          {user?.username}
                        </span>
                        <small className="text-muted">{user?.email}</small>
                      </div>
                    </div>
                  </li>

                  <li>
                    <hr className="dropdown-divider my-2" />
                  </li>

                  {/* Profile */}
                  <DropdownItem
                    to="/profile"
                    icon={User}
                    tooltip="Trang cá nhân"
                    onClick={() => setIsUserDropdownOpen(false)}
                  >
                    Trang cá nhân
                  </DropdownItem>

                  {/* Settings */}
                  <DropdownItem
                    to="/settings"
                    icon={Settings}
                    tooltip="Cài đặt tài khoản"
                    onClick={() => setIsUserDropdownOpen(false)}
                  >
                    Cài đặt
                  </DropdownItem>

                  <li>
                    <hr className="dropdown-divider my-2" />
                  </li>

                  {/* Logout */}
                  <DropdownItem
                    to="/login"
                    icon={LogOut}
                    tooltip="Đăng xuất"
                    onClick={handleLogout}
                    isDanger={true}
                  >
                    Đăng xuất
                  </DropdownItem>
                </ul>
              </li>
            ) : (
              /* Login/Register khi chưa đăng nhập */
              <li className="nav-item dropdown">
                <a
                  className={`nav-link d-flex align-items-center gap-2 px-3 py-2 rounded-2 cursor-pointer transition-all ${
                    isUserDropdownOpen
                      ? "text-primary bg-primary-soft"
                      : "text-gray-600 hover-bg-light"
                  }`}
                  role="button"
                  data-bs-toggle="dropdown"
                  aria-expanded="false"
                  onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
                >
                  <div
                    className="bg-secondary rounded-circle d-flex align-items-center justify-content-center"
                    style={{ width: "32px", height: "32px" }}
                  >
                    <User size={16} className="text-white" />
                  </div>
                  <span className="fw-medium">Tài khoản</span>
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${
                      isUserDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </a>

                <ul className="dropdown-menu dropdown-menu-end border-0 shadow-lg rounded-3 p-2 min-w-200">
                  {/* Login */}
                  <DropdownItem
                    to="/login"
                    icon={LogIn}
                    tooltip="Đăng nhập"
                    onClick={() => setIsUserDropdownOpen(false)}
                  >
                    <div className="d-flex flex-column">
                      <span className="fw-semibold">Đăng nhập</span>
                      <small className="text-muted">Truy cập tài khoản</small>
                    </div>
                  </DropdownItem>

                  <li>
                    <hr className="dropdown-divider my-2" />
                  </li>

                  {/* Register */}
                  <DropdownItem
                    to="/register"
                    icon={UserPlus}
                    tooltip="Đăng ký tài khoản"
                    onClick={() => setIsUserDropdownOpen(false)}
                  >
                    <div className="d-flex flex-column">
                      <span className="fw-semibold">Đăng ký</span>
                      <small className="text-muted">Tạo tài khoản mới</small>
                    </div>
                  </DropdownItem>
                </ul>
              </li>
            )}
          </ul>
        </div>
      </div>

      <style jsx>{`
        .hover-bg-light:hover {
          background-color: #f8f9fa !important;
        }
        .hover-bg-danger-soft:hover {
          background-color: rgba(220, 53, 69, 0.1) !important;
        }
        .bg-primary-soft {
          background-color: rgba(13, 110, 253, 0.1) !important;
        }
        .min-w-200 {
          min-width: 200px;
        }
        .min-w-220 {
          min-width: 220px;
        }
        .transition-all {
          transition: all 0.2s ease-in-out;
        }
        .rotate-180 {
          transform: rotate(180deg);
        }
        .cursor-pointer {
          cursor: pointer;
        }
        .nav-link.active {
          color: #0d6efd !important;
          font-weight: 600;
        }
      `}</style>
    </nav>
  );
}

export default Navbar;
