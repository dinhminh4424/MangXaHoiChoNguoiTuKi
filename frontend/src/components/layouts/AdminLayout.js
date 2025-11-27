import React, { useState, useMemo, useEffect } from "react";
import NavbarAdmin from "../admin/NavbarAdmin";

const SIDEBAR_EXPANDED_WIDTH = "16rem"; // 260px ≈ 16rem
const SIDEBAR_COLLAPSED_WIDTH = "5rem"; // 80px ≈ 5rem

const AdminLayout = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Detect screen size
  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const contentStyle = useMemo(() => {
    // Trên mobile, không có margin - sử dụng width: 100%
    if (isMobile) {
      return {
        width: "100%",
        marginLeft: 0,
        transition: "all 0.2s ease-in-out",
      };
    }

    // Trên desktop, sử dụng margin với đơn vị rem
    const ml = isSidebarCollapsed
      ? SIDEBAR_COLLAPSED_WIDTH
      : SIDEBAR_EXPANDED_WIDTH;

    return {
      marginLeft: ml,
      width: `calc(100% - ${ml})`,
      transition: "all 0.2s ease-in-out",
    };
  }, [isSidebarCollapsed, isMobile]);

  return (
    <div>
      <NavbarAdmin
        isCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
      />
      <div style={contentStyle}>{children}</div>
    </div>
  );
};

export default AdminLayout;
