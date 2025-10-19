import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// context
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { ChatProvider } from "./contexts/ChatContext";
import { ProfileProvider } from "./contexts/ProfileContext";
import { JournalProvider } from "./contexts/JournalContext";
import { PostProvider } from "./contexts/PostContext";

import Navbar from "./components/Navbar"; // Import Navbar

// import "bootstrap/dist/css/bootstrap.min.css";
// import "./App.css";

// Import các trang
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Home from "./pages/Home";
import Chat from "./pages/chat/Chat";
import Feed from "./pages/social/Feed";
import Profile from "./pages/social/Profile";

import CreatePost from "./pages/social/CreatePost";
import UpdatePost from "./pages/social/EditPost";
import Explore from "./pages/social/Explore";
import Contact from "./pages/support/Contact";
import Resources from "./pages/support/Resources";

import Emotion from "./pages/emotions/emotion";
import Group from "./pages/social/Group";
import GroupDetailPage from "./pages/social/GroupDetailPage";
import CreateGroupPage from "./pages/social/CreateGroupPage";

// Import các trang nhật ký
import Journal from "./pages/journal/Journal";
import JournalHistory from "./pages/journal/JournalHistory";
import CreateJournal from "./pages/journal/CreateJournal";
import JournalDetail from "./pages/journal/JournalDetail";

import ChatTest from "./pages/chat/test";
import ChatTest2 from "./pages/chat/test2";

/**
 * COMPONENT: ProtectedRoute
 * MỤC ĐÍCH: Bảo vệ các route yêu cầu đăng nhập
 * CƠ CHẾ:
 * - Kiểm tra trạng thái isAuthenticated từ AuthContext
 * - Nếu đã đăng nhập: hiển thị children (nội dung được bảo vệ)
 * - Nếu chưa đăng nhập: chuyển hướng về trang /login
 * SỬ DỤNG: Bao bọc các component cần đăng nhập
 */
// Route bảo vệ để chỉ cho phép truy cập khi đã đăng nhập và ngược lại
function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  // return isAuthenticated ? children : <Navigate to="/login" />;
  return isAuthenticated ? children : <Navigate to="/home" />;
}

/**
 * COMPONENT: PublicRoute
 * MỤC ĐÍCH: Chỉ cho phép truy cập khi chưa đăng nhập
 * CƠ CHẾ:
 * - Kiểm tra trạng thái isAuthenticated từ AuthContext
 * - Nếu chưa đăng nhập: hiển thị children (nội dung công khai)
 * - Nếu đã đăng nhập: chuyển hướng về trang /chat
 * SỬ DỤNG: Bao bọc các component như Login, Register
 */
// Route công khai để chỉ cho phép truy cập khi chưa đăng nhập
function PublicRoute({ children }) {
  const { isAuthenticated } = useAuth();
  // return !isAuthenticated ? children : <Navigate to="/chat" />;
  return !isAuthenticated ? children : <Navigate to="/home" />;
}

/**
 * COMPONENT: AppContent
 * MỤC ĐÍCH: Component chính chứa logic hiển thị layout
 * TÁC DỤNG:
 * - Quyết định hiển thị Navbar dựa trên trạng thái đăng nhập
 * - Định nghĩa tất cả routes của ứng dụng
 * - Phân loại route công khai và route được bảo vệ
 */
function AppContent() {
  const { isAuthenticated } = useAuth();

  return (
    <div className="App">
      {/* Hiển thị Navbar nếu đã đăng nhập */}
      {isAuthenticated && <Navbar />}

      {/*
        ĐỊNH NGHĨA ROUTES:
        - Routes component bao bọc tất cả các route con
        - Mỗi Route định nghĩa một URL path và component tương ứng
      */}
      <Routes>
        {/* 
          ROUTE CÔNG KHAI - CHỈ TRUY CẬP KHI CHƯA ĐĂNG NHẬP 
        */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          }
        />

        {/* 
          ROUTE ĐƯỢC BẢO VỆ - CHỈ TRUY CẬP KHI ĐÃ ĐĂNG NHẬP 
          LƯU Ý: Các route này đã được import nhưng chưa được sử dụng
          Để sử dụng, cần thêm vào đây tương tự như route /chat
        */}

        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <Chat />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chattest"
          element={
            <ProtectedRoute>
              <ChatTest />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chattest2"
          element={
            <ProtectedRoute>
              <ChatTest2 />
            </ProtectedRoute>
          }
        />

        <Route
          path="/feed"
          element={
            <ProtectedRoute>
              <Feed />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/nhandien"
          element={
            <ProtectedRoute>
              <Emotion />
            </ProtectedRoute>
          }
        />
        <Route
          path="/Group"
          element={
            <ProtectedRoute>
              <Group />
            </ProtectedRoute>
          }
        />
        <Route
          path="/group/:groupId"
          element={
            <ProtectedRoute>
              <GroupDetailPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-group"
          element={
            <ProtectedRoute>
              <CreateGroupPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile/:userId"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />
        <Route
          path="/posts/createPost"
          element={
            <ProtectedRoute>
              <CreatePost />
            </ProtectedRoute>
          }
        />
        <Route
          path="/posts/edit/:postId"
          element={
            <ProtectedRoute>
              <UpdatePost />
            </ProtectedRoute>
          }
        />
        <Route
          path="/explore"
          element={
            <ProtectedRoute>
              <Explore />
            </ProtectedRoute>
          }
        />
        <Route
          path="/contact"
          element={
            <ProtectedRoute>
              <Contact />
            </ProtectedRoute>
          }
        />
        <Route
          path="/resources"
          element={
            <ProtectedRoute>
              <Resources />
            </ProtectedRoute>
          }
        />
        <Route
          path="/journal"
          element={
            <ProtectedRoute>
              <Journal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/journal/create"
          element={
            <ProtectedRoute>
              <CreateJournal />
            </ProtectedRoute>
          }
        />
        <Route
          path="/journal/history"
          element={
            <ProtectedRoute>
              <JournalHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/journal/:id"
          element={
            <ProtectedRoute>
              <JournalDetail />
            </ProtectedRoute>
          }
        />
        <Route path="/home" element={<Home />} />

        {/* 
          ROUTE MẶC ĐỊNH: 
          - Khi truy cập root path "/", tự động chuyển hướng đến "/home"
          - Có thể thay đổi thành "/xxxxxx" nếu muốn trang chủ mặc định
        */}
        <Route path="/" element={<Navigate to="/home" />} />

        {/* 
          ROUTE DỰ PHÒNG (chưa có):
          - Có thể thêm route "*" để xử lý các URL không tồn tại
          - Ví dụ: <Route path="*" element={<NotFound />} />
        */}
      </Routes>
    </div>
  );
}

/**
 * COMPONENT: App
 * MỤC ĐÍCH: Component gốc của ứng dụng
 * CẤU TRÚC PROVIDERS:
 * - AuthProvider: Cung cấp context xác thực cho toàn bộ app
 * - ChatProvider: Cung cấp context chat cho toàn bộ app
 * - Router: Cung cấp routing functionality
 * LUỒNG DỮ LIỆU: Providers được wrap từ ngoài vào trong
 */

function App() {
  return (
    /* 
      AUTH PROVIDER:
      - Quản lý trạng thái đăng nhập, thông tin user
      - Cung cấp functions: login, logout, register
    */
    <AuthProvider>
      {/* 
        PROFILE PROVIDER:
        - Quản lý trạng thái profile người dùng
        - Cung cấp functions: fetchProfile, updateProfile
      */}
      <ProfileProvider>
        {/* CHAT PROVIDER:
        - Quản lý trạng thái chat, messages, conversations
        - Cung cấp functions: sendMessage, loadConversations 
        */}
        <ChatProvider>
          {/* JOURNAL PROVIDER:
        - Quản lý trạng thái nhật ký, các entries
        - Cung cấp functions: createJournal, updateJournal, fetchJournal
        */}
          <JournalProvider>
            <PostProvider>
              {/* 
                ROUTER:
                - Cung cấp chức năng routing cho SPA (Single Page Application)
                - Theo dõi URL và render component tương ứng
              */}
              <Router>
                {/* 
                APP CONTENT:
                - Component chứa toàn bộ nội dung ứng dụng
                - Bao gồm Navbar và Routes
              */}
                <AppContent />
              </Router>
            </PostProvider>
          </JournalProvider>
        </ChatProvider>
      </ProfileProvider>
    </AuthProvider>
  );
}

export default App;
