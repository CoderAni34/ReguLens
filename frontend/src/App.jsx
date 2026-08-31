import React, { useState, useEffect } from "react";

import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/dashboard";
import Upload from "./pages/Upload";
import Processing from "./pages/Processing";
import Documents from "./pages/document";
import Obligations from "./pages/obligations";
import Tasks from "./pages/Tasks";
import Conflicts from "./pages/Conflicts";
import Evidence from "./pages/Evidence";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import Login from "./pages/Login";

import {
  getStoredToken,
  getStoredUser,
  getCurrentUser,
  logoutUser,
  setAuthSession,
} from "./services/api";

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [token, setToken] = useState(() => getStoredToken());
  const [user, setUser] = useState(() => getStoredUser());
  const [authLoading, setAuthLoading] = useState(true);

  const [currentDocument, setCurrentDocumentState] = useState(() => {
    try {
      const saved = sessionStorage.getItem("regulens_current_document");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [pendingFile, setPendingFile] = useState(null);

  // Validate or restore authentication session on initial app load
  useEffect(() => {
    async function restoreSession() {
      const existingToken = getStoredToken();
      if (!existingToken) {
        setAuthLoading(false);
        return;
      }

      try {
        const profile = await getCurrentUser();
        setUser(profile);
      } catch (err) {
        console.warn("Session expired or invalid, clearing credentials:", err.message);
        logoutUser();
        setToken(null);
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    }

    restoreSession();
  }, []);

  const handleLoginSuccess = (newToken, newUser, rememberMe) => {
    setToken(newToken);
    setUser(newUser);
    setAuthSession(newToken, newUser, rememberMe);
    setActivePage("Dashboard");
  };

  const handleLogout = async () => {
    await logoutUser();
    setToken(null);
    setUser(null);
    setActivePage("Dashboard");
  };

  const setCurrentDocument = (doc) => {
    setCurrentDocumentState(doc);
    try {
      if (doc) {
        sessionStorage.setItem("regulens_current_document", JSON.stringify(doc));
      } else {
        sessionStorage.removeItem("regulens_current_document");
      }
    } catch (e) {
      console.error("Failed to persist current document to sessionStorage", e);
    }
  };

  // Helper to open obligations directly for a specific document
  const handleViewDocumentObligations = (doc) => {
    setCurrentDocument(doc);
    setActivePage("Obligations");
  };

  // Initial Auth Verification Loading Splash
  if (authLoading) {
    return (
      <div style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "#070b10",
        color: "#94a3b8",
        fontFamily: "Inter, system-ui, -apple-system, sans-serif",
      }}>
        <div style={{
          width: "48px",
          height: "48px",
          borderRadius: "10px",
          background: "rgba(229, 166, 9, 0.15)",
          border: "1px solid rgba(229, 166, 9, 0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#e5a609",
          fontSize: "28px",
          fontWeight: "700",
          marginBottom: "16px",
        }}>
          ⬡
        </div>
        <p style={{ fontSize: "14px", color: "#cbd5e1" }}>Initializing ReguLens Workspace...</p>
      </div>
    );
  }

  // Unauthenticated user -> render Login page
  if (!token || !user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="app">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
        user={user}
        onLogout={handleLogout}
      />

      <div className="main-area">

        {activePage === "Dashboard" && (
          <Dashboard
            setActivePage={setActivePage}
            onSelectDocument={handleViewDocumentObligations}
          />
        )}

        {activePage === "Upload" && (
          <Upload
            setActivePage={setActivePage}
            setPendingFile={setPendingFile}
            setCurrentDocument={setCurrentDocument}
          />
        )}

        {activePage === "Processing" && (
          <Processing
            setActivePage={setActivePage}
            pendingFile={pendingFile}
            setPendingFile={setPendingFile}
            currentDocument={currentDocument}
            setCurrentDocument={setCurrentDocument}
          />
        )}

        {activePage === "Documents" && (
          <Documents
            setActivePage={setActivePage}
            onSelectDocument={handleViewDocumentObligations}
            setPendingFile={setPendingFile}
          />
        )}

        {activePage === "Obligations" && (
          <Obligations
            currentDocument={currentDocument}
            setCurrentDocument={setCurrentDocument}
            setActivePage={setActivePage}
          />
        )}

        {activePage === "Tasks" && (
          <Tasks />
        )}

        {activePage === "Conflicts" && (
          <Conflicts />
        )}

        {activePage === "Evidence" && (
          <Evidence />
        )}

        {activePage === "Reports" && (
          <Reports />
        )}

        {activePage === "Settings" && (
          <Settings />
        )}

        {![
          "Dashboard",
          "Upload",
          "Processing",
          "Documents",
          "Obligations",
          "Tasks",
          "Conflicts",
          "Evidence",
          "Reports",
          "Settings",
        ].includes(activePage) && (
          <main className="placeholder-page">
            <h1>{activePage}</h1>
            <p>This page will be built next.</p>
          </main>
        )}

      </div>
    </div>
  );
}

export default App;