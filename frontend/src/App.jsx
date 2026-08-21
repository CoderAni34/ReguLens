import React, { useState } from "react";

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

  return (
    <div className="app">
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
      />

      <div className="main-area">

        {activePage === "Dashboard" && (
          <Dashboard setActivePage={setActivePage} />
        )}

        {activePage === "Upload" && (
          <Upload setActivePage={setActivePage} />
        )}

        {activePage === "Processing" && (
          <Processing setActivePage={setActivePage} />
        )}

        {activePage === "Documents" && (
          <Documents />
        )}

        {activePage === "Obligations" && (
          <Obligations />
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