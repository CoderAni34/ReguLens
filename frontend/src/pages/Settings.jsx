import React, { useState } from "react";

function Settings({ theme = "dark", setTheme }) {
  const [activeSection, setActiveSection] = useState("General");

  const [settings, setSettings] = useState({
    workspaceName: "ReguLens Workspace",
    organization: "ReguLens",
    email: "admin@regulens.com",
    emailNotifications: true,
    deadlineReminders: true,
    conflictAlerts: true,
    aiSuggestions: true,
    autoAnalysis: true,
  });

  const updateSetting = (key, value) => {
    setSettings({
      ...settings,
      [key]: value,
    });
  };

  const sections = [
    "General",
    "Notifications",
    "AI & Analysis",
    "Security",
    "Appearance",
  ];

  return (
    <main className="settings-page">
      {/* HEADER */}
      <div className="settings-header">
        <div>
          <span className="page-badge">
            ⚙ WORKSPACE SETTINGS
          </span>

          <h1>Settings</h1>

          <p>
            Manage your workspace preferences, notifications, and ReguLens
            configuration.
          </p>
        </div>
      </div>

      <div className="settings-layout">
        {/* SETTINGS SIDEBAR */}
        <div className="settings-nav">
          <h3>SETTINGS</h3>

          {sections.map((section) => (
            <button
              key={section}
              className={
                activeSection === section
                  ? "settings-nav-item active"
                  : "settings-nav-item"
              }
              onClick={() => setActiveSection(section)}
            >
              {section}
            </button>
          ))}
        </div>

        {/* SETTINGS CONTENT */}
        <div className="settings-content">

          {/* GENERAL */}
          {activeSection === "General" && (
            <section className="settings-panel">
              <div className="settings-panel-header">
                <h2>General Settings</h2>

                <p>
                  Manage your workspace and organization information.
                </p>
              </div>

              <div className="settings-divider" />

              <div className="settings-form">

                <div className="form-group">
                  <label>Workspace Name</label>

                  <input
                    type="text"
                    value={settings.workspaceName}
                    onChange={(e) =>
                      updateSetting(
                        "workspaceName",
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Organization</label>

                  <input
                    type="text"
                    value={settings.organization}
                    onChange={(e) =>
                      updateSetting(
                        "organization",
                        e.target.value
                      )
                    }
                  />
                </div>

                <div className="form-group">
                  <label>Administrator Email</label>

                  <input
                    type="email"
                    value={settings.email}
                    onChange={(e) =>
                      updateSetting(
                        "email",
                        e.target.value
                      )
                    }
                  />
                </div>

              </div>
            </section>
          )}

          {/* NOTIFICATIONS */}
          {activeSection === "Notifications" && (
            <section className="settings-panel">
              <div className="settings-panel-header">
                <h2>Notifications</h2>

                <p>
                  Choose which compliance events you want to be notified about.
                </p>
              </div>

              <div className="settings-divider" />

              <div className="settings-options">

                <div className="setting-option">
                  <div>
                    <h3>Email Notifications</h3>

                    <p>
                      Receive important workspace updates by email.
                    </p>
                  </div>

                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={settings.emailNotifications}
                      onChange={(e) =>
                        updateSetting(
                          "emailNotifications",
                          e.target.checked
                        )
                      }
                    />

                    <span className="slider" />
                  </label>
                </div>

                <div className="setting-option">
                  <div>
                    <h3>Deadline Reminders</h3>

                    <p>
                      Get notified when compliance deadlines are approaching.
                    </p>
                  </div>

                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={settings.deadlineReminders}
                      onChange={(e) =>
                        updateSetting(
                          "deadlineReminders",
                          e.target.checked
                        )
                      }
                    />

                    <span className="slider" />
                  </label>
                </div>

                <div className="setting-option">
                  <div>
                    <h3>Conflict Alerts</h3>

                    <p>
                      Receive alerts when ReguLens detects requirement conflicts.
                    </p>
                  </div>

                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={settings.conflictAlerts}
                      onChange={(e) =>
                        updateSetting(
                          "conflictAlerts",
                          e.target.checked
                        )
                      }
                    />

                    <span className="slider" />
                  </label>
                </div>

              </div>
            </section>
          )}

          {/* AI & ANALYSIS */}
          {activeSection === "AI & Analysis" && (
            <section className="settings-panel">
              <div className="settings-panel-header">
                <h2>AI & Analysis</h2>

                <p>
                  Configure how ReguLens analyzes documents and identifies
                  compliance obligations.
                </p>
              </div>

              <div className="settings-divider" />

              <div className="settings-options">

                <div className="form-group" style={{ marginBottom: "20px" }}>
                  <label style={{ fontWeight: 600 }}>AI Engine API Key</label>
                  <p style={{ fontSize: "12px", marginBottom: "8px" }}>
                    Required for AI regulatory obligation extraction and conflict reasoning. Configure your workspace API credentials below.
                  </p>
                  <input
                    type="password"
                    placeholder="Enter API Key..."
                    value={settings.geminiApiKey || ""}
                    onChange={(e) => updateSetting("geminiApiKey", e.target.value)}
                    style={{ width: "100%", padding: "10px 14px", borderRadius: "8px" }}
                  />
                </div>

                <div className="setting-option">
                  <div>
                    <h3>AI Suggestions</h3>

                    <p>
                      Show AI-generated recommendations for obligations,
                      evidence, and conflicts.
                    </p>
                  </div>

                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={settings.aiSuggestions}
                      onChange={(e) =>
                        updateSetting(
                          "aiSuggestions",
                          e.target.checked
                        )
                      }
                    />

                    <span className="slider" />
                  </label>
                </div>

                <div className="setting-option">
                  <div>
                    <h3>Automatic Analysis</h3>

                    <p>
                      Automatically analyze newly uploaded compliance documents.
                    </p>
                  </div>

                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={settings.autoAnalysis}
                      onChange={(e) =>
                        updateSetting(
                          "autoAnalysis",
                          e.target.checked
                        )
                      }
                    />

                    <span className="slider" />
                  </label>
                </div>

              </div>
            </section>
          )}

          {/* SECURITY */}
          {activeSection === "Security" && (
            <section className="settings-panel">
              <div className="settings-panel-header">
                <h2>Security</h2>

                <p>
                  Manage access and security settings for your workspace.
                </p>
              </div>

              <div className="settings-divider" />

              <div className="settings-options">

                <div className="security-card">
                  <div>
                    <h3>Password</h3>

                    <p>
                      Update your account password to keep your workspace secure.
                    </p>
                  </div>

                  <button className="secondary-btn">
                    Change Password
                  </button>
                </div>

                <div className="security-card">
                  <div>
                    <h3>Two-Factor Authentication</h3>

                    <p>
                      Add an additional layer of security to your account.
                    </p>
                  </div>

                  <button className="secondary-btn">
                    Configure
                  </button>
                </div>

              </div>
            </section>
          )}

          {/* APPEARANCE */}
          {activeSection === "Appearance" && (
            <section className="settings-panel">
              <div className="settings-panel-header">
                <h2>Appearance</h2>

                <p>
                  Customize how the ReguLens workspace looks.
                </p>
              </div>

              <div className="settings-divider" />

              <div className="settings-options">

                <div className="setting-option">
                  <div>
                    <h3>{theme === "dark" ? "Dark Mode" : "Light Mode"}</h3>

                    <p>
                      {theme === "dark"
                        ? "Use the dark ReguLens interface."
                        : "Use the light ReguLens interface."}
                    </p>
                  </div>

                  <label className="switch">
                    <input
                      type="checkbox"
                      checked={theme === "dark"}
                      onChange={(e) =>
                        setTheme && setTheme(e.target.checked ? "dark" : "light")
                      }
                    />

                    <span className="slider" />
                  </label>
                </div>

              </div>
            </section>
          )}

        </div>
      </div>
    </main>
  );
}

export default Settings;