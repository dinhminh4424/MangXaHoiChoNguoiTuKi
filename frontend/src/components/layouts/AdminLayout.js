import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import NavbarAdmin from "../admin/NavbarAdmin";

const AdminLayout = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div>
      {/* Admin Sidebar */}
      <NavbarAdmin />

      {/* Page Content */}
      {children}
    </div>
  );
};

export default AdminLayout;
