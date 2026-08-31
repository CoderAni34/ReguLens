import React, { useState } from "react";
import {
  LayoutDashboard,
  FileText,
  ClipboardList,
  CheckSquare,
  TriangleAlert,
  FileCheck,
  BarChart3,
  Settings,
  MoreHorizontal,
  LogOut,
} from "lucide-react";

const menuItems = [
  { icon: LayoutDashboard, label: "Dashboard" },
  { icon: FileText, label: "Documents" },
  { icon: ClipboardList, label: "Obligations" },
  { icon: CheckSquare, label: "Tasks" },
  { icon: TriangleAlert, label: "Conflicts" },
  { icon: FileCheck, label: "Evidence" },
  { icon: BarChart3, label: "Reports" },
  { icon: Settings, label: "Settings" },
];

function Sidebar({ activePage, setActivePage, user, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const displayName = user?.full_name || user?.email?.split("@")[0] || "Officer";
  const displayRole = user?.role || "Compliance Officer";
  const avatarInitial = (displayName.charAt(0) || "U").toUpperCase();

  const handleLogoutClick = () => {
    setMenuOpen(false);
    if (onLogout) {
      onLogout();
    }
  };

  return (
    <aside className="sidebar">
      {/* LOGO */}
      <div className="logo">
        <div className="logo-icon">⬡</div>
        <span>ReguLens</span>
      </div>

      {/* NAVIGATION */}
      <nav className="nav-menu">
        {menuItems.map((item) => {
          const Icon = item.icon;

          return (
            <button
              key={item.label}
              className={`nav-item ${
                activePage === item.label ? "active" : ""
              }`}
              onClick={() => setActivePage(item.label)}
            >
              <span className="nav-icon">
                <Icon size={19} />
              </span>

              <span className="nav-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* USER */}
      <div className="user-card" style={{ position: "relative" }}>
        <div className="user-details" style={{ minWidth: 0, overflow: "hidden" }}>
          <div className="avatar">{avatarInitial}</div>

          <div className="user-info" style={{ minWidth: 0 }}>
            <strong style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={displayName}>
              {displayName}
            </strong>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {displayRole}
            </span>
          </div>
        </div>

        <button
          className="more-btn"
          type="button"
          aria-label="User menu"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <MoreHorizontal size={20} />
        </button>

        {/* DROPDOWN */}
        {menuOpen && (
          <div
            className="user-menu"
            style={{
              position: "absolute",
              bottom: "100%",
              left: "14px",
              right: "14px",
              marginBottom: "8px",
              background: "#131a23",
              border: "1px solid #273444",
              borderRadius: "8px",
              padding: "6px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
              zIndex: 100,
            }}
          >
            <div style={{ padding: "6px 8px", borderBottom: "1px solid #1e293b", marginBottom: "4px" }}>
              <div style={{ fontSize: "11px", color: "#64748b" }}>Signed in as</div>
              <div style={{ fontSize: "12px", color: "#e2e8f0", fontWeight: "600", wordBreak: "break-all" }}>
                {user?.email || "admin@regulens.ai"}
              </div>
            </div>
            <button
              className="logout-btn"
              type="button"
              onClick={handleLogoutClick}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 10px",
                background: "transparent",
                border: "none",
                borderRadius: "6px",
                color: "#f87171",
                fontSize: "12px",
                fontWeight: "600",
                cursor: "pointer",
                textAlign: "left",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239, 68, 68, 0.15)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
            >
              <LogOut size={15} />
              Sign Out
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;