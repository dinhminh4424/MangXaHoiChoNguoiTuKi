import React, { useState, useMemo, useEffect } from "react";
import Navbar from "../Navbar";

const SIDEBAR_EXPANDED_WIDTH = "16rem";
const SIDEBAR_COLLAPSED_WIDTH = "5rem";

const UserLayout = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);

    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  const contentStyle = useMemo(() => {
    if (isMobile) {
      return {
        width: "100%",
        marginLeft: 0,
        padding: "1rem",
        transition: "all 0.3s ease-in-out",
      };
    }

    const ml = isSidebarCollapsed
      ? SIDEBAR_COLLAPSED_WIDTH
      : SIDEBAR_EXPANDED_WIDTH;

    return {
      marginLeft: ml,
      width: `calc(100% - ${ml})`,
      padding: "1.5rem",
      transition: "all 0.3s ease-in-out",
    };
  }, [isSidebarCollapsed, isMobile]);

  return (
    <div>
      <Navbar
        isCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
      />
      <div style={contentStyle}>{children}</div>
    </div>
  );
};

export default UserLayout;
