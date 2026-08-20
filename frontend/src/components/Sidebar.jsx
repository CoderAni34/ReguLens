import React from "react";

const menuItems = [
  { icon: "⌂", label: "Dashboard" },
  { icon: "▣", label: "Documents" },
  { icon: "▤", label: "Obligations" },
  { icon: "✓", label: "Tasks" },
  { icon: "⚠", label: "Conflicts" },
  { icon: "▱", label: "Evidence" },
  { icon: "▥", label: "Reports" },
  { icon: "⚙", label: "Settings" },
];

function Sidebar({ activePage, setActivePage }) {
  return (
    <aside className="sidebar">
      <div className="logo">
        <div className="logo-icon">⬡</div>
        <span>ReguLens</span>
      </div>

      <nav className="nav-menu">
        {menuItems.map((item) => (
          <button
            key={item.label}
            className={`nav-item ${
              activePage === item.label ? "active" : ""
            }`}
            onClick={() => setActivePage(item.label)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span>{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="user-card">
        <div className="avatar">A</div>

        <div className="user-info">
          <strong>BANGGG</strong>
          <span>Admin</span>
        </div>

        <span className="more">•••</span>
      </div>
    </aside>
  );
}

export default Sidebar;