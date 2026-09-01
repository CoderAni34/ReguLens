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

function App() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem("regulens_theme") || "dark";
    } catch {
      return "dark";
    }
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem("regulens_theme", theme);
    } catch (e) {
      console.error("Failed to persist theme preference", e);
    }
  }, [theme]);

  const [currentDocument, setCurrentDocumentState] = useState(() => {
    try {
      const saved = sessionStorage.getItem("regulens_current_document");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [pendingFile, setPendingFile] = useState(null);

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

  return (
    <div className="app">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
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
          <Settings theme={theme} setTheme={setTheme} />
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