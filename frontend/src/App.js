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
import FaceLoginImage from "./pages/auth/FaceLoginImage";
import Register from "./pages/auth/Register";
import ForgotPassword from "./pages/auth/ForgotPassword";

import Home from "./pages/Home";
import HomeContact from "./pages/social/HomeContact";
import About from "./pages/social/About";
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
import MoodHistory from "./pages/emotions/MoodHistory";
import Group from "./pages/social/Group";
import GroupDetailPage from "./pages/social/GroupDetailPage";
import CreateGroupPage from "./pages/social/CreateGroupPage";

import CreateTodo from "./pages/todo/CreateTodo";
import EditTodo from "./pages/todo/EditTodo";
import TodoCalendar from "./pages/todo/TodoCalendar";
import TodoList from "./pages/todo/TodoList";
import TodoDetail from "./pages/todo/TodoDetail";

import SettingsDashboard from "./components/settings/SettingsDashboard";

import NotificationsPage from "./pages/notifications/NotificationsPage";

import ViolationHistory from "./pages/violations/ViolationHistory";

import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUserManagement from "./pages/admin/users/AdminUserManagement";
import AdminContentManagement from "./pages/admin/contens/AdminContentManagement";
import AdminGroupManagement from "./pages/admin/groups/AdminGroupManagement";
import AdminJournalManagement from "./pages/admin/journals/AdminJournalManagement";
import AnalyticsOverview from "./pages/admin/analytic/AnalyticsOverview";
import UserAnalytics from "./pages/admin/analytic/UserAnalytics";
import ContentAnalytics from "./pages/admin/analytic/ContentAnalytics";

import ImageManager from "./pages/admin/imagesManager/ImageManager";

import LogUserManager from "./pages/admin/logs/LogUserManager";

import ReportContent from "./pages/admin/reports/ReportContent";
import ReportComment from "./pages/admin/reports/ReportComment";

import ReportUser from "./pages/admin/reports/ReportUser";
import ReportGroup from "./pages/admin/reports/ReportGroup";
import ProtectedAdminRoute from "./components/admin/ProtectedAdminRoute";

import AdminChatManagement from "./components/admin/chat/AdminChatManagement";

import AppealManagement from "./pages/admin/appeals/AppealManagement";

import BackupLogs from "./pages/admin/backup/BackupLogs";
import BackupManagement from "./pages/admin/backup/BackupManagement";

import AdminSecurity from "./pages/admin/security/AdminSecurity";

import AppealForm from "./components/appeals/AppealForm";
import CheckStatusAppeal from "./components/appeals/CheckStatus";
import AdminAppeals from "./components/admin/appeals/AdminAppeals";

import UserLayout from "./components/layouts/UserLayout";
import AdminLayout from "./components/layouts/AdminLayout";

import ErrorPage from "./components/error/pages-error";

import Test from "./pages/test";

import AIChat from "./components/ai/AIChat";
import AiChatScreen from "./components/ai/AiChatScreen";
// import 'animate.css';

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
  { path: "/faceLoginImage", component: FaceLoginImage, isPublic: true },
  { path: "/register", component: Register, isPublic: true },
  { path: "/forgot-password", component: ForgotPassword, isPublic: true },
  { path: "/AppealForm", component: AppealForm, isPublic: true },
  { path: "/appealCheckStatus", component: CheckStatusAppeal, isPublic: true },

  { path: "/test", component: Test, layout: UserLayout },
  { path: "/aiChat", component: AIChat, layout: UserLayout },
  { path: "/aiChatScreen", component: AiChatScreen, layout: UserLayout },

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
  { path: "/homeContact", component: HomeContact, layout: UserLayout },
  { path: "/about", component: About, layout: UserLayout },

  // Protected User Routes - Group
  { path: "/group", component: Group, layout: UserLayout },
  { path: "/group/:groupId", component: GroupDetailPage, layout: UserLayout },
  { path: "/create-group", component: CreateGroupPage, layout: UserLayout },
  {
    path: "/group/createPost/:groupId",
    component: CreatePost,
    layout: UserLayout,
  },

  // Protected User Routes - Journal
  { path: "/journal", component: Journal, layout: UserLayout },
  { path: "/journal/create", component: CreateJournal, layout: UserLayout },
  { path: "/journal/history", component: JournalHistory, layout: UserLayout },
  { path: "/journal/:id", component: JournalDetail, layout: UserLayout },

  // todo
  { path: "/todo", component: TodoCalendar, layout: UserLayout },
  { path: "/todo/list", component: TodoList, layout: UserLayout },
  { path: "/todo/calendar", component: TodoCalendar, layout: UserLayout },
  { path: "/todo/create", component: CreateTodo, layout: UserLayout },
  { path: "/todo/edit/:id", component: EditTodo, layout: UserLayout },
  { path: "/todo/:id", component: TodoDetail, layout: UserLayout },

  // Protected User Routes - Support
  { path: "/contact", component: Contact, layout: UserLayout },
  { path: "/resources", component: Resources, layout: UserLayout },

  // Protected User Routes - Emotion
  { path: "/nhandien", component: Emotion, layout: UserLayout },
  { path: "/mood-history", component: MoodHistory, layout: UserLayout }, // MoodHistory

  // Protected User Setting
  { path: "/settings", component: SettingsDashboard, layout: UserLayout },

  // Protected NotificationsPage
  { path: "/notifications", component: NotificationsPage, layout: UserLayout },

  // Protected NotificationsPage
  { path: "/violations", component: ViolationHistory, layout: UserLayout },

  // Admin Routes

  {
    path: "/admin",
    component: AdminDashboard,
    layout: AdminLayout,
    isAdmin: true,
  },
  {
    path: "/admin/appealsForUser",
    component: AdminAppeals,
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
  {
    path: "/admin/groups",
    component: AdminGroupManagement,
    layout: AdminLayout,
    isAdmin: true,
  },
  {
    path: "/admin/journals",
    component: AdminJournalManagement,
    layout: AdminLayout,
    isAdmin: true,
  },
  {
    path: "/admin/analytics/overview",
    component: AnalyticsOverview,
    layout: AdminLayout,
    isAdmin: true,
  }, // AnalyticsOverview
  {
    path: "/admin/analytics/users",
    component: UserAnalytics,
    layout: AdminLayout,
    isAdmin: true,
  }, // UserAnalytics
  {
    path: "/admin/analytics/content",
    component: ContentAnalytics,
    layout: AdminLayout,
    isAdmin: true,
  }, // ContentAnalytics
  {
    path: "/admin/groups/reports",
    component: ReportGroup,
    layout: AdminLayout,
    isAdmin: true,
  },
  {
    path: "/admin/groups/reports/:id",
    component: ReportGroup, // ReportGroup
    layout: AdminLayout,
    isAdmin: true,
  }, //
  {
    path: "/admin/chats",
    component: AdminChatManagement,
    layout: AdminLayout,
    isAdmin: true,
  }, //

  {
    path: "/admin/appeals",
    component: AppealManagement, // Kháng Nghị
    layout: AdminLayout,
    isAdmin: true,
  },
  {
    path: "/admin/appeals/:idViodation",
    component: AppealManagement, // Kháng Nghị
    layout: AdminLayout,
    isAdmin: true,
  }, // ImageManager
  {
    path: "/admin/imageManager",
    component: ImageManager,
    layout: AdminLayout,
    isAdmin: true,
  }, // LogUserManager
  {
    path: "/admin/logs",
    component: LogUserManager,
    layout: AdminLayout,
    isAdmin: true,
  },
  {
    path: "/admin/backup",
    component: BackupManagement,
    layout: AdminLayout,
    isAdmin: true,
  },
  {
    path: "/admin/backup/logs",
    component: BackupLogs,
    layout: AdminLayout,
    isAdmin: true,
  },
  {
    path: "/admin/security",
    component: AdminSecurity,
    layout: AdminLayout,
    isAdmin: true,
  }, // AdminSecurity
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
