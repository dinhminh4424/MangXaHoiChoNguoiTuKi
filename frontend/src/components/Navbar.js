// import React, { useState, useEffect } from "react";
// import { Link, useNavigate, useLocation } from "react-router-dom";
// import { useAuth } from "../contexts/AuthContext";
// import { useJournal } from "../contexts/JournalContext";
// import TooltipWrapper from "../components/TooltipWrapper.jsx";
// import {
//   Home,
//   MessageCircle,
//   User,
//   BookOpen,
//   PlusCircle,
//   History,
//   LogOut,
//   LogIn,
//   UserPlus,
//   Newspaper,
//   Bookmark,
//   ChevronDown,
//   Settings,
//   UserCircle,
// } from "lucide-react";

// function Navbar() {
//   const { isAuthenticated, logout, user } = useAuth();
//   const navigate = useNavigate();
//   const location = useLocation();
//   const { todayJournal, fetchTodayJournal } = useJournal();
//   const [isJournalDropdownOpen, setIsJournalDropdownOpen] = useState(false);
//   const [isUserDropdownOpen, setIsUserDropdownOpen] = useState(false);

//   useEffect(() => {
//     if (isAuthenticated && !todayJournal) {
//       fetchTodayJournal();
//     }
//   }, [isAuthenticated, todayJournal, fetchTodayJournal]);

//   const handleLogout = () => {
//     logout();
//     navigate("/login");
//     setIsUserDropdownOpen(false);
//   };

//   const isActiveRoute = (path) => {
//     return location.pathname === path;
//   };

//   const NavItem = ({
//     to,
//     icon: Icon,
//     children,
//     tooltip,
//     onClick,
//     isActive,
//   }) => (
//     <li className="nav-item">
//       <TooltipWrapper title={tooltip} placement="bottom">
//         <Link
//           className={`nav-link d-flex align-items-center gap-2 px-3 py-2 rounded-2 transition-all ${
//             isActive
//               ? "active text-primary bg-primary-soft"
//               : "text-gray-600 hover-bg-light"
//           }`}
//           to={to}
//           onClick={onClick}
//         >
//           <Icon size={18} />
//           <span className="fw-medium">{children}</span>
//         </Link>
//       </TooltipWrapper>
//     </li>
//   );

//   const DropdownItem = ({
//     to,
//     icon: Icon,
//     children,
//     tooltip,
//     onClick,
//     isDanger = false,
//   }) => (
//     <li>
//       <TooltipWrapper title={tooltip} placement="right">
//         <Link
//           className={`dropdown-item d-flex align-items-center gap-3 py-2 px-3 rounded-2 transition-all ${
//             isDanger ? "text-danger hover-bg-danger-soft" : "hover-bg-light"
//           }`}
//           to={to}
//           onClick={onClick}
//         >
//           <div
//             className="d-flex align-items-center justify-content-center"
//             style={{ width: "20px" }}
//           >
//             <Icon size={16} />
//           </div>
//           <span className={`fw-medium ${isDanger ? "text-danger" : ""}`}>
//             {children}
//           </span>
//         </Link>
//       </TooltipWrapper>
//     </li>
//   );

//   return (
//     <nav className="navbar navbar-expand-lg navbar-light bg-white border-bottom shadow-sm">
//       <div className="container">
//         {/* Brand */}
//         <Link className="navbar-brand fw-bold text-primary fs-3" to="/">
//           🌟 MindSpace
//         </Link>

//         {/* Toggler */}
//         <button
//           className="navbar-toggler border-0"
//           type="button"
//           data-bs-toggle="collapse"
//           data-bs-target="#navbarNav"
//           aria-controls="navbarNav"
//           aria-expanded="false"
//           aria-label="Toggle navigation"
//         >
//           <span className="navbar-toggler-icon"></span>
//         </button>

//         {/* Navigation */}
//         <div className="collapse navbar-collapse" id="navbarNav">
//           {/* Left Navigation */}
//           <ul className="navbar-nav me-auto">
//             <NavItem
//               to="/home"
//               icon={Home}
//               tooltip="Trang chủ"
//               isActive={isActiveRoute("/home")}
//             >
//               Trang Chủ
//             </NavItem>

//             {isAuthenticated && (
//               <>
//                 <NavItem
//                   to="/chat"
//                   icon={MessageCircle}
//                   tooltip="Trò chuyện"
//                   isActive={isActiveRoute("/chat")}
//                 >
//                   Chat
//                 </NavItem>

//                 <NavItem
//                   to="/feed"
//                   icon={Newspaper}
//                   tooltip="Bài viết cộng đồng"
//                   isActive={isActiveRoute("/feed")}
//                 >
//                   Feed
//                 </NavItem>

//                 <NavItem
//                   to="/posts/createPost"
//                   icon={PlusCircle}
//                   tooltip="Tạo bài viết mới"
//                   isActive={isActiveRoute("/posts/createPost")}
//                 >
//                   Đăng Bài
//                 </NavItem>

//                 {/* Journal Dropdown */}
//                 <li className="nav-item dropdown">
//                   <TooltipWrapper title="Nhật ký cá nhân" placement="bottom">
//                     <a
//                       className={`nav-link d-flex align-items-center gap-2 px-3 py-2 rounded-2 cursor-pointer transition-all ${
//                         isJournalDropdownOpen
//                           ? "text-primary bg-primary-soft"
//                           : "text-gray-600 hover-bg-light"
//                       }`}
//                       role="button"
//                       data-bs-toggle="dropdown"
//                       aria-expanded="false"
//                       onClick={() =>
//                         setIsJournalDropdownOpen(!isJournalDropdownOpen)
//                       }
//                     >
//                       <div className="position-relative">
//                         <BookOpen size={18} />
//                         {!todayJournal && (
//                           <span className="position-absolute top-0 start-100 translate-middle p-1 bg-warning border border-light rounded-circle">
//                             <span className="visually-hidden">
//                               Chưa có nhật ký hôm nay
//                             </span>
//                           </span>
//                         )}
//                       </div>
//                       <span className="fw-medium">Nhật Ký</span>
//                       <ChevronDown
//                         size={14}
//                         className={`transition-transform ${
//                           isJournalDropdownOpen ? "rotate-180" : ""
//                         }`}
//                       />
//                     </a>
//                   </TooltipWrapper>

//                   <ul className="dropdown-menu border-0 shadow-lg rounded-3 p-2 min-w-200">
//                     <DropdownItem
//                       to="/journal"
//                       icon={todayJournal ? Bookmark : PlusCircle}
//                       tooltip="Viết nhật ký hôm nay"
//                     >
//                       <div className="d-flex flex-column">
//                         <span className="fw-semibold">Hôm Nay</span>
//                         <small className="text-muted">
//                           {todayJournal ? "Tiếp tục viết" : "Bắt đầu mới"}
//                         </small>
//                       </div>
//                     </DropdownItem>

//                     <li>
//                       <hr className="dropdown-divider my-2" />
//                     </li>

//                     <DropdownItem
//                       to="/journal/history"
//                       icon={History}
//                       tooltip="Xem lịch sử nhật ký"
//                     >
//                       <div className="d-flex flex-column">
//                         <span className="fw-semibold">Lịch Sử</span>
//                         <small className="text-muted">Nhật ký đã viết</small>
//                       </div>
//                     </DropdownItem>
//                   </ul>
//                 </li>
//               </>
//             )}
//           </ul>

//           {/* Right Navigation - User Dropdown */}
//           <ul className="navbar-nav">
//             {isAuthenticated ? (
//               /* User Dropdown khi đã đăng nhập */
//               <li className="nav-item dropdown">
//                 <a
//                   className={`nav-link d-flex align-items-center gap-2 px-3 py-2 rounded-2 cursor-pointer transition-all ${
//                     isUserDropdownOpen
//                       ? "text-primary bg-primary-soft"
//                       : "text-gray-600 hover-bg-light"
//                   }`}
//                   role="button"
//                   data-bs-toggle="dropdown"
//                   aria-expanded="false"
//                   onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
//                 >
//                   <div
//                     className="bg-primary rounded-circle d-flex align-items-center justify-content-center"
//                     style={{ width: "32px", height: "32px" }}
//                   >
//                     {/* <User size={16} className="text-white" /> */}

//                     {user.profile.avatar ? (
//                       <img
//                         srcSet={user.profile.avatar}
//                         style={{
//                           width: "32px",
//                           height: "32px",
//                           border: "50%",
//                           objectFit: "cover",
//                         }}
//                         className="rounded-circle"
//                       />
//                     ) : (
//                       <User size={16} className="text-white" />
//                     )}
//                   </div>
//                   <span className="fw-medium text-primary">
//                     {user?.username}
//                   </span>
//                   <ChevronDown
//                     size={14}
//                     className={`transition-transform ${
//                       isUserDropdownOpen ? "rotate-180" : ""
//                     }`}
//                   />
//                 </a>

//                 <ul className="dropdown-menu dropdown-menu-end border-0 shadow-lg rounded-3 p-2 min-w-220">
//                   {/* User Info */}
//                   <li className="px-3 py-2 border-bottom">
//                     <div className="d-flex align-items-center">
//                       {/* Cột 1: Avatar */}
//                       <div
//                         className="rounded-circle bg-primary d-flex align-items-center justify-content-center me-3"
//                         style={{ width: "45px", height: "45px" }}
//                       >
//                         {user?.profile?.avatar ? (
//                           <img
//                             src={user.profile.avatar}
//                             alt="Avatar"
//                             className="rounded-circle"
//                             style={{
//                               width: "100%",
//                               height: "100%",
//                               objectFit: "cover",
//                             }}
//                           />
//                         ) : (
//                           <UserCircle size={24} className="text-white" />
//                         )}
//                       </div>

//                       {/* Cột 2: Thông tin user */}
//                       <div className="flex-grow-1">
//                         <span className="fw-bold text-dark d-block">
//                           {user?.username}
//                         </span>
//                         <small className="text-muted">{user?.email}</small>
//                       </div>
//                     </div>
//                   </li>

//                   <li>
//                     <hr className="dropdown-divider my-2" />
//                   </li>

//                   {/* Profile */}
//                   <DropdownItem
//                     to="/profile"
//                     icon={User}
//                     tooltip="Trang cá nhân"
//                     onClick={() => setIsUserDropdownOpen(false)}
//                   >
//                     Trang cá nhân
//                   </DropdownItem>

//                   {/* Settings */}
//                   <DropdownItem
//                     to="/settings"
//                     icon={Settings}
//                     tooltip="Cài đặt tài khoản"
//                     onClick={() => setIsUserDropdownOpen(false)}
//                   >
//                     Cài đặt
//                   </DropdownItem>

//                   <li>
//                     <hr className="dropdown-divider my-2" />
//                   </li>

//                   {/* Logout */}
//                   <DropdownItem
//                     to="/login"
//                     icon={LogOut}
//                     tooltip="Đăng xuất"
//                     onClick={handleLogout}
//                     isDanger={true}
//                   >
//                     Đăng xuất
//                   </DropdownItem>
//                 </ul>
//               </li>
//             ) : (
//               /* Login/Register khi chưa đăng nhập */
//               <li className="nav-item dropdown">
//                 <a
//                   className={`nav-link d-flex align-items-center gap-2 px-3 py-2 rounded-2 cursor-pointer transition-all ${
//                     isUserDropdownOpen
//                       ? "text-primary bg-primary-soft"
//                       : "text-gray-600 hover-bg-light"
//                   }`}
//                   role="button"
//                   data-bs-toggle="dropdown"
//                   aria-expanded="false"
//                   onClick={() => setIsUserDropdownOpen(!isUserDropdownOpen)}
//                 >
//                   <div
//                     className="bg-secondary rounded-circle d-flex align-items-center justify-content-center"
//                     style={{ width: "32px", height: "32px" }}
//                   >
//                     <User size={16} className="text-white" />
//                   </div>
//                   <span className="fw-medium">Tài khoản</span>
//                   <ChevronDown
//                     size={14}
//                     className={`transition-transform ${
//                       isUserDropdownOpen ? "rotate-180" : ""
//                     }`}
//                   />
//                 </a>

//                 <ul className="dropdown-menu dropdown-menu-end border-0 shadow-lg rounded-3 p-2 min-w-200">
//                   {/* Login */}
//                   <DropdownItem
//                     to="/login"
//                     icon={LogIn}
//                     tooltip="Đăng nhập"
//                     onClick={() => setIsUserDropdownOpen(false)}
//                   >
//                     <div className="d-flex flex-column">
//                       <span className="fw-semibold">Đăng nhập</span>
//                       <small className="text-muted">Truy cập tài khoản</small>
//                     </div>
//                   </DropdownItem>

//                   <li>
//                     <hr className="dropdown-divider my-2" />
//                   </li>

//                   {/* Register */}
//                   <DropdownItem
//                     to="/register"
//                     icon={UserPlus}
//                     tooltip="Đăng ký tài khoản"
//                     onClick={() => setIsUserDropdownOpen(false)}
//                   >
//                     <div className="d-flex flex-column">
//                       <span className="fw-semibold">Đăng ký</span>
//                       <small className="text-muted">Tạo tài khoản mới</small>
//                     </div>
//                   </DropdownItem>
//                 </ul>
//               </li>
//             )}
//           </ul>
//         </div>
//       </div>

//       <style jsx>{`
//         .hover-bg-light:hover {
//           background-color: #f8f9fa !important;
//         }
//         .hover-bg-danger-soft:hover {
//           background-color: rgba(220, 53, 69, 0.1) !important;
//         }
//         .bg-primary-soft {
//           background-color: rgba(13, 110, 253, 0.1) !important;
//         }
//         .min-w-200 {
//           min-width: 200px;
//         }
//         .min-w-220 {
//           min-width: 220px;
//         }
//         .transition-all {
//           transition: all 0.2s ease-in-out;
//         }
//         .rotate-180 {
//           transform: rotate(180deg);
//         }
//         .cursor-pointer {
//           cursor: pointer;
//         }
//         .nav-link.active {
//           color: #0d6efd !important;
//           font-weight: 600;
//         }
//       `}</style>
//     </nav>
//   );
// }

// export default Navbar;

import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import TooltipWrapper from "./TooltipWrapper";

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
                    className="sub-drop sub-drop-large dropdown-menu"
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

                {/* Notifications Dropdown */}
                <li className="nav-item dropdown">
                  <a
                    href="#"
                    className="search-toggle dropdown-toggle"
                    id="notification-drop"
                    data-bs-toggle="dropdown"
                  >
                    <i className="ri-notification-4-line"></i>
                  </a>
                  <div
                    className="sub-drop dropdown-menu"
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
                </li>

                {/* Messages Dropdown */}
                <li className="nav-item dropdown">
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
                    className="sub-drop dropdown-menu"
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
                    <div className="caption">
                      <h6 className="mb-0 line-height">
                        {user?.fullName || "User"}
                      </h6>
                    </div>
                  </a>
                  <div
                    className="sub-drop dropdown-menu caption-menu"
                    aria-labelledby="drop-down-arrow"
                  >
                    <div className="card shadow-none m-0">
                      <div className="card-header bg-primary">
                        <div className="header-title">
                          <h5 className="mb-0 text-white">
                            Hello {user?.username || "User"}
                          </h5>
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
                          to="/profile/edit"
                          className="iq-sub-card iq-bg-warning-hover"
                        >
                          <div className="d-flex align-items-center">
                            <div className="rounded card-icon bg-soft-warning">
                              <i className="ri-profile-line"></i>
                            </div>
                            <div className="ms-3">
                              <h6 className="mb-0">Edit Profile</h6>
                              <p className="mb-0 font-size-12">
                                Modify your personal details.
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
