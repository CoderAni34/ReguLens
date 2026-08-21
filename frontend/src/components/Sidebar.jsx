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

function Sidebar({ activePage, setActivePage }) {
  const [menuOpen, setMenuOpen] = useState(false);

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
      <div className="user-card">
        <div className="user-details">
          <div className="avatar">A</div>

          <div className="user-info">
            <strong>BANGGG</strong>
            <span>Admin</span>
          </div>
        </div>

        <button
          className="more-btn"
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
        >
          <MoreHorizontal size={20} />
        </button>

        {/* DROPDOWN */}
        {menuOpen && (
          <div className="user-menu">
            <button
              className="logout-btn"
              onClick={() => {
                alert("Logged out successfully");
                setMenuOpen(false);
              }}
            >
              <LogOut size={16} />
              Logout
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}

export default Sidebar;