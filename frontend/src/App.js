// import React from "react";
// import {
//   BrowserRouter as Router,
//   Routes,
//   Route,
//   Navigate,
// } from "react-router-dom";

// // context
// import { AuthProvider, useAuth } from "./contexts/AuthContext";
// import { ChatProvider } from "./contexts/ChatContext";
// import { ProfileProvider } from "./contexts/ProfileContext";
// import { JournalProvider } from "./contexts/JournalContext";
// import { PostProvider } from "./contexts/PostContext";

// import "bootstrap/dist/css/bootstrap.min.css";

// // Import các trang
// import Login from "./pages/auth/Login";
// import Register from "./pages/auth/Register";
// import Home from "./pages/Home";
// import Chat from "./pages/chat/Chat";
// import Feed from "./pages/social/Feed";
// import Profile from "./pages/social/Profile";

// import Journal from "./pages/journal/Journal";
// import JournalDetail from "./pages/journal/JournalDetail";
// import JournalHistory from "./pages/journal/JournalHistory";
// import CreateJournal from "./pages/journal/CreateJournal";

// import CreatePost from "./pages/social/CreatePost";
// import UpdatePost from "./pages/social/EditPost";
// import Explore from "./pages/social/Explore";
// import Contact from "./pages/support/Contact";
// import Resources from "./pages/support/Resources";

// import Emotion from "./pages/emotions/emotion";
// import Group from "./pages/social/Group";
// import GroupDetailPage from "./pages/social/GroupDetailPage";
// import CreateGroupPage from "./pages/social/CreateGroupPage";

// // Import các trang admin
// import AdminDashboard from "./pages/admin/AdminDashboard";
// import AdminUserManagement from "./pages/admin/AdminUserManagement";
// import AdminContentManagement from "./pages/admin/AdminContentManagement";
// import ProtectedAdminRoute from "./components/admin/ProtectedAdminRoute";

// // Import layout
// import UserLayout from "./components/layouts/UserLayout";
// import AdminLayout from "./components/layouts/AdminLayout";

// /**
//  * COMPONENT: ProtectedRoute
//  * MỤC ĐÍCH: Bảo vệ các route yêu cầu đăng nhập
//  * CƠ CHẾ:
//  * - Kiểm tra trạng thái isAuthenticated từ AuthContext
//  * - Nếu đã đăng nhập: hiển thị children (nội dung được bảo vệ - là cái mà trong trang web á)
//  * - Nếu chưa đăng nhập: chuyển hướng về trang /login
//  * SỬ DỤNG: Bao bọc các component cần đăng nhập
//  */
// // Route bảo vệ để chỉ cho phép truy cập khi đã đăng nhập và ngược lại
// function ProtectedRoute({ children }) {
//   const { isAuthenticated } = useAuth();
//   // return isAuthenticated ? children : <Navigate to="/login" />;
//   return isAuthenticated ? children : <Navigate to="/home" />;
// }

// /**
//  * COMPONENT: PublicRoute
//  * MỤC ĐÍCH: Chỉ cho phép truy cập khi chưa đăng nhập
//  * CƠ CHẾ:
//  * - Kiểm tra trạng thái isAuthenticated từ AuthContext
//  * - Nếu chưa đăng nhập: hiển thị children (nội dung công khai)
//  * - Nếu đã đăng nhập: chuyển hướng về trang /chat
//  * SỬ DỤNG: Bao bọc các component như Login, Register
//  */
// // Route công khai để chỉ cho phép truy cập khi chưa đăng nhập
// function PublicRoute({ children }) {
//   const { isAuthenticated } = useAuth();
//   // return !isAuthenticated ? children : <Navigate to="/chat" />;
//   return !isAuthenticated ? children : <Navigate to="/home" />;
// }

// /**
//  * COMPONENT: AppContent
//  * MỤC ĐÍCH: Component chính chứa logic hiển thị layout
//  * TÁC DỤNG:
//  * - Quyết định hiển thị Navbar dựa trên trạng thái đăng nhập
//  * - Định nghĩa tất cả routes của ứng dụng
//  * - Phân loại route công khai và route được bảo vệ
//  */
// function AppContent() {
//   const { isAuthenticated, user } = useAuth();

//   return (
//     <div className="App">
//       {/* Hiển thị Navbar nếu đã đăng nhập */}
//       {/* {isAuthenticated &&
//         (user?.role === "admin" ? <NavbarAdmin /> : <Navbar />)} */}

//       {/*
//         ĐỊNH NGHĨA ROUTES:
//         - Routes component bao bọc tất cả các route con
//         - Mỗi Route định nghĩa một URL path và component tương ứng
//       */}
//       <Routes>
//         {/*
//           ROUTE CÔNG KHAI - CHỈ TRUY CẬP KHI CHƯA ĐĂNG NHẬP
//         */}
//         <Route
//           path="/login"
//           element={
//             <PublicRoute>
//               <Login />
//             </PublicRoute>
//           }
//         />
//         <Route
//           path="/register"
//           element={
//             <PublicRoute>
//               <Register />
//             </PublicRoute>
//           }
//         />

//         {/*
//           ROUTE ĐƯỢC BẢO VỆ - CHỈ TRUY CẬP KHI ĐÃ ĐĂNG NHẬP
//           LƯU Ý: Các route này đã được import nhưng chưa được sử dụng
//           Để sử dụng, cần thêm vào đây tương tự như route /chat
//         */}

//         <Route
//           path="/chat"
//           element={
//             <ProtectedRoute>
//               <UserLayout>
//                 <Chat />
//               </UserLayout>
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/chat/:chatUserId"
//           element={
//             <ProtectedRoute>
//               <UserLayout>
//                 <Chat />
//               </UserLayout>
//             </ProtectedRoute>
//           }
//         />

//         <Route
//           path="/feed"
//           element={
//             <ProtectedRoute>
//               <UserLayout>
//                 <Feed />
//               </UserLayout>
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/profile"
//           element={
//             <ProtectedRoute>
//               <UserLayout>
//                 <Profile />
//               </UserLayout>
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/nhandien"
//           element={
//             <ProtectedRoute>
//               <UserLayout>
//                 <Emotion />
//               </UserLayout>
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/Group"
//           element={
//             <ProtectedRoute>
//               <UserLayout>
//                 <Group />
//               </UserLayout>
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/group/:groupId"
//           element={
//             <ProtectedRoute>
//               <UserLayout>
//                 <GroupDetailPage />
//               </UserLayout>
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/create-group"
//           element={
//             <ProtectedRoute>
//               <UserLayout>
//                 <CreateGroupPage />
//               </UserLayout>
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/profile/:userId"
//           element={
//             <ProtectedRoute>
//               <UserLayout>
//                 <Profile />
//               </UserLayout>
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/posts/createPost"
//           element={
//             <ProtectedRoute>
//               <UserLayout>
//                 <CreatePost />
//               </UserLayout>
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/posts/edit/:postId"
//           element={
//             <ProtectedRoute>
//               <UserLayout>
//                 <UpdatePost />
//               </UserLayout>
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/explore"
//           element={
//             <ProtectedRoute>
//               <UserLayout>
//                 <Explore />
//               </UserLayout>
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/contact"
//           element={
//             <ProtectedRoute>
//               <UserLayout>
//                 <Contact />
//               </UserLayout>
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/resources"
//           element={
//             <ProtectedRoute>
//               <UserLayout>
//                 <Resources />
//               </UserLayout>
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/journal"
//           element={
//             <ProtectedRoute>
//               <UserLayout>
//                 <Journal />
//               </UserLayout>
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/journal/create"
//           element={
//             <ProtectedRoute>
//               <UserLayout>
//                 <CreateJournal />
//               </UserLayout>
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/journal/history"
//           element={
//             <ProtectedRoute>
//               <UserLayout>
//                 <JournalHistory />
//               </UserLayout>
//             </ProtectedRoute>
//           }
//         />
//         <Route
//           path="/journal/:id"
//           element={
//             <ProtectedRoute>
//               <UserLayout>
//                 <JournalDetail />
//               </UserLayout>
//             </ProtectedRoute>
//           }
//         />
//         <Route path="/home" element={<Home />} />

//         {/*
//           ADMIN ROUTES - CHỈ CHO PHÉP ADMIN TRUY CẬP
//         */}
//         <Route
//           path="/admin"
//           element={
//             <ProtectedAdminRoute>
//               <AdminLayout>
//                 <AdminDashboard />
//               </AdminLayout>
//             </ProtectedAdminRoute>
//           }
//         />
//         <Route
//           path="/admin/users"
//           element={
//             <ProtectedAdminRoute>
//               <AdminLayout>
//                 <AdminUserManagement />
//               </AdminLayout>
//             </ProtectedAdminRoute>
//           }
//         />
//         <Route
//           path="/admin/content"
//           element={
//             <ProtectedAdminRoute>
//               <AdminLayout>
//                 <AdminContentManagement />
//               </AdminLayout>
//             </ProtectedAdminRoute>
//           }
//         />

//         {/*
//           ROUTE MẶC ĐỊNH:
//           - Khi truy cập root path "/", tự động chuyển hướng đến "/home"
//           - Có thể thay đổi thành "/xxxxxx" nếu muốn trang chủ mặc định
//         */}
//         <Route path="/" element={<Navigate to="/home" />} />

//         {/*
//           ROUTE DỰ PHÒNG (chưa có):
//           - Có thể thêm route "*" để xử lý các URL không tồn tại
//           - Ví dụ: <Route path="*" element={<NotFound />} />
//         */}
//       </Routes>
//     </div>
//   );
// }

// /**
//  * COMPONENT: App
//  * MỤC ĐÍCH: Component gốc của ứng dụng
//  * CẤU TRÚC PROVIDERS:
//  * - AuthProvider: Cung cấp context xác thực cho toàn bộ app
//  * - ChatProvider: Cung cấp context chat cho toàn bộ app
//  * - Router: Cung cấp routing functionality
//  * LUỒNG DỮ LIỆU: Providers được wrap từ ngoài vào trong
//  */

// function App() {
//   return (
//     /*
//       AUTH PROVIDER:
//       - Quản lý trạng thái đăng nhập, thông tin user
//       - Cung cấp functions: login, logout, register
//     */
//     <AuthProvider>
//       {/*
//         PROFILE PROVIDER:
//         - Quản lý trạng thái profile người dùng
//         - Cung cấp functions: fetchProfile, updateProfile
//       */}
//       <ProfileProvider>
//         {/* CHAT PROVIDER:
//         - Quản lý trạng thái chat, messages, conversations
//         - Cung cấp functions: sendMessage, loadConversations
//         */}
//         <ChatProvider>
//           {/* JOURNAL PROVIDER:
//         - Quản lý trạng thái nhật ký, các entries
//         - Cung cấp functions: createJournal, updateJournal, fetchJournal
//         */}
//           <JournalProvider>
//             <PostProvider>
//               {/*
//                 ROUTER:
//                 - Cung cấp chức năng routing cho SPA (Single Page Application)
//                 - Theo dõi URL và render component tương ứng
//               */}
//               <Router>
//                 {/*
//                 APP CONTENT:
//                 - Component chứa toàn bộ nội dung ứng dụng
//                 - Bao gồm Navbar và Routes
//               */}
//                 <AppContent />
//               </Router>
//             </PostProvider>
//           </JournalProvider>
//         </ChatProvider>
//       </ProfileProvider>
//     </AuthProvider>
//   );
// }

// export default App;

// ===========================================================================================

import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Context imports
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ChatProvider } from "./contexts/ChatContext";
import { ProfileProvider } from "./contexts/ProfileContext";
import { JournalProvider } from "./contexts/JournalContext";
import { PostProvider } from "./contexts/PostContext";
import AuthCallback from "./components/AuthCallback";
import SOSButton from "./components/SOSButton";

// Style imports
import "bootstrap/dist/css/bootstrap.min.css";

// Page imports
import Login from "./pages/auth/Login";
import FaceLogin from "./pages/auth/FaceLogin";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";

import Home from "./pages/Home";
import Chat from "./pages/chat/Chat";
import Feed from "./pages/social/Feed";
import Profile from "./pages/social/Profile";
import Statistical from "./pages/social/statistical";
import SearchPage from "./pages/search/SearchPage";
import Journal from "./pages/journal/Journal";
import JournalDetail from "./pages/journal/JournalDetail";
import JournalHistory from "./pages/journal/JournalHistory";
import CreateJournal from "./pages/journal/CreateJournal";
import CreatePost from "./pages/social/CreatePost";
import PostDetail from "./pages/social/PostDetail";
import UpdatePost from "./pages/social/EditPost";
import Explore from "./pages/social/Explore";
import Contact from "./pages/support/Contact";
import Resources from "./pages/support/Resources";
import Emotion from "./pages/emotions/emotion";
import Group from "./pages/social/Group";
import GroupDetailPage from "./pages/social/GroupDetailPage";
import CreateGroupPage from "./pages/social/CreateGroupPage";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUserManagement from "./pages/admin/users/AdminUserManagement";
import AdminContentManagement from "./pages/admin/contens/AdminContentManagement";
import ReportContent from "./pages/admin/reports/ReportContent";
import ReportComment from "./pages/admin/reports/ReportComment";
import ReportUser from "./pages/admin/reports/ReportUser";
import ProtectedAdminRoute from "./components/admin/ProtectedAdminRoute";

import UserLayout from "./components/layouts/UserLayout";
import AdminLayout from "./components/layouts/AdminLayout";

import Navbar from "./components/Navbar";
import ErrorPage from "./components/error/pages-error";

import Test from "./pages/test";

import AIChat from "./components/ai/AIChat";

/**
 * COMPONENT: ProtectedRoute
 */
function ProtectedRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  return isAuthenticated ? children : <Navigate to="/login" />;
}

/**
 * COMPONENT: PublicRoute
 */
function PublicRoute({ children }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading-spinner">Loading...</div>;
  }

  return !isAuthenticated ? children : <Navigate to="/home" />;
}

/**
 * Route configurations
 */
const routeConfigs = [
  // Public Routes
  { path: "/login", component: Login, isPublic: true },
  { path: "/faceLogin", component: FaceLogin, isPublic: true },
  { path: "/register", component: Register, isPublic: true },
  { path: "/forgot-password", component: ForgotPassword, isPublic: true },

  { path: "/test", component: Test, layout: UserLayout },
  { path: "/aiChat", component: AIChat, layout: UserLayout },

  // Protected User Routes - Chat
  { path: "/chat", component: Chat, layout: UserLayout },
  { path: "/chat/:chatUserId", component: Chat, layout: UserLayout },

  // Protected User Routes - Social
  { path: "/search", component: SearchPage, layout: UserLayout },
  { path: "/profile", component: Profile, layout: UserLayout },
  { path: "/profile/:userId", component: Profile, layout: UserLayout },
  { path: "/profile/dashboard", component: Statistical, layout: UserLayout },

  { path: "/feed", component: Feed, layout: UserLayout },
  { path: "/posts/:postId", component: PostDetail, layout: UserLayout },
  { path: "/posts/createPost", component: CreatePost, layout: UserLayout },
  { path: "/posts/edit/:postId", component: UpdatePost, layout: UserLayout },
  { path: "/explore", component: Explore, layout: UserLayout },

  // Protected User Routes - Group
  { path: "/group", component: Group, layout: UserLayout },
  { path: "/group/:groupId", component: GroupDetailPage, layout: UserLayout },
  { path: "/create-group", component: CreateGroupPage, layout: UserLayout },

  // Protected User Routes - Journal
  { path: "/journal", component: Journal, layout: UserLayout },
  { path: "/journal/create", component: CreateJournal, layout: UserLayout },
  { path: "/journal/history", component: JournalHistory, layout: UserLayout },
  { path: "/journal/:id", component: JournalDetail, layout: UserLayout },

  // Protected User Routes - Support
  { path: "/contact", component: Contact, layout: UserLayout },
  { path: "/resources", component: Resources, layout: UserLayout },

  // Protected User Routes - Emotion
  { path: "/nhandien", component: Emotion, layout: UserLayout },

  // Admin Routes
  {
    path: "/admin",
    component: AdminDashboard,
    layout: AdminLayout,
    isAdmin: true,
  },
  {
    path: "/admin/users",
    component: AdminUserManagement,
    layout: AdminLayout,
    isAdmin: true,
  },
  {
    path: "/admin/users/reports",
    component: ReportUser,
    layout: AdminLayout,
    isAdmin: true,
  },
  {
    path: "/admin/content",
    component: AdminContentManagement,
    layout: AdminLayout,
    isAdmin: true,
  },
  {
    path: "/admin/content/reports",
    component: ReportContent,
    layout: AdminLayout,
    isAdmin: true,
  },
  {
    path: "/admin/content/reports/:id",
    component: ReportContent,
    layout: AdminLayout,
    isAdmin: true,
  },
  {
    path: "/admin/content/reportsComment",
    component: ReportComment, // ReportComment
    layout: AdminLayout,
    isAdmin: true,
  },
  {
    path: "/admin/content/reportsComment/:id",
    component: ReportComment, // ReportComment
    layout: AdminLayout,
    isAdmin: true,
  },
];

/**
 * COMPONENT: AppRoutes
 * PURPOSE: Định nghĩa tất cả routes sử dụng map
 */
function AppRoutes() {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      {/* --- NEW: Route xử lý callback từ Social Login --- */}
      <Route path="/auth/callback" element={<AuthCallback />} />

      {/* Render tất cả routes từ config */}
      {routeConfigs.map((route) => {
        const {
          path,
          component: Component,
          layout: Layout = React.Fragment,
          isPublic = false,
          isAdmin = false,
        } = route;

        let routeElement;

        if (isPublic) {
          routeElement = (
            <PublicRoute>
              <Component />
            </PublicRoute>
          );
        } else if (isAdmin) {
          routeElement = (
            <ProtectedAdminRoute>
              <Layout>
                <Component />
              </Layout>
            </ProtectedAdminRoute>
          );
        } else {
          routeElement = (
            <ProtectedRoute>
              <Layout>
                <Component />
              </Layout>
            </ProtectedRoute>
          );
        }

        return <Route key={path} path={path} element={routeElement} />;
      })}

      {/* Home Route - Public/Protected */}
      <Route
        path="/home"
        element={
          isAuthenticated ? (
            <ProtectedRoute>
              <UserLayout>
                <Home />
              </UserLayout>
            </ProtectedRoute>
          ) : (
            <Home />
          )
        }
      />

      {/* Default Route */}
      <Route path="/" element={<Navigate to="/home" replace />} />

      {/* 404 Route */}
      <Route path="*" element={<ErrorPage />} />
    </Routes>
  );
}

/**
 * COMPONENT: AppContent
 */
function AppContent() {
  const { user } = useAuth();
  const userId = user?._id || user?.id || null;
  
  return (
    <div className="App">
      <AppRoutes />
      {/* ✅ Nút SOS hiển thị trên mọi trang */}
      {userId && <SOSButton userId={userId} />}
    </div>
  );
}

/**
 * COMPONENT: AppProviders
 */
function AppProviders({ children }) {
  return (
    <AuthProvider>
      <ProfileProvider>
        <ChatProvider>
          <JournalProvider>
            <PostProvider>{children}</PostProvider>
          </JournalProvider>
        </ChatProvider>
      </ProfileProvider>
    </AuthProvider>
  );
}

/**
 * COMPONENT: App
 */
function App() {
  return (
    <AppProviders>
      <Router>
        <AppContent />
      </Router>
    </AppProviders>
  );
}

export default App;
