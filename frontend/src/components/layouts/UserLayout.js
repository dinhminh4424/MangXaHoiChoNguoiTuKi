import React, { useState, useMemo } from "react";
import Navbar from "../Navbar";

const SIDEBAR_EXPANDED_WIDTH = 260; // px
const SIDEBAR_COLLAPSED_WIDTH = 80; // px

const UserLayout = ({ children }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const contentStyle = useMemo(() => {
    const ml = isSidebarCollapsed
      ? SIDEBAR_COLLAPSED_WIDTH
      : SIDEBAR_EXPANDED_WIDTH;
    return {
      marginLeft: ml,
      transition: "margin-left 0.2s ease-in-out",
    };
  }, [isSidebarCollapsed]);

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
