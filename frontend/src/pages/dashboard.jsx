import React from "react";

const documents = [
  {
    name: "UGC Guidelines for Disciplinary & Pedagogy 2026.pdf",
    status: "Completed",
    obligations: "15 obligations",
    uploaded: "2 hours ago",
  },
  {
    name: "AICTE Approval Process Handbook 2025-2026.pdf",
    status: "Completed",
    obligations: "46 obligations",
    uploaded: "Yesterday",
  },
  {
    name: "SEBI_LRS_UPDATED_SEBI_GUIDELINES_2023.pdf",
    status: "Completed",
    obligations: "18 obligations",
    uploaded: "3 days ago",
  },
  {
    name: "NACC Revised Manual for Autonomous Colleges 2025.pdf",
    status: "Processing",
    obligations: "--",
    uploaded: "Just now",
  },
  {
    name: "MHRD Multiple Entry & Exit Implementation Directive.pdf",
    status: "Completed",
    obligations: "22 obligations",
    uploaded: "4 days ago",
  },
  {
    name: "State_Gazette_Notification_Concerning_2024.pdf",
    status: "Failed",
    obligations: "--",
    uploaded: "5 days ago",
  },
];

function Dashboard({ setActivePage }) {
  return (
    <main className="page-content">
      <header className="top-header">
        <div>
          <h1>Welcome back, BANGGG</h1>
          <p>Here's what's happening across your compliance workspace.</p>
        </div>

        <button
          className="upload-btn"
          onClick={() => setActivePage("Upload")}
        >
          + Upload Document
        </button>
      </header>

      <section className="stats-grid">
        <div className="stat-card">
          <p>DOCUMENTS PROCESSED</p>
          <h2>42</h2>
          <span className="muted">+8 from last month</span>
        </div>

        <div className="stat-card">
          <p>ACTIVE OBLIGATIONS</p>
          <h2>318</h2>
          <span className="muted">14 pending review</span>
        </div>

        <div className="stat-card warning-card">
          <p>DEADLINES THIS MONTH</p>
          <h2>12</h2>
          <span className="warning-text">4 due within 7 days</span>
        </div>
      </section>

      <section className="documents-section">
        <div className="section-header">
          <h2>Recent Documents</h2>
          <button className="view-all">View all →</button>
        </div>

        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>DOCUMENT NAME</th>
                <th>STATUS</th>
                <th>OBLIGATIONS EXTRACTED</th>
                <th>UPLOADED</th>
                <th>ACTION</th>
              </tr>
            </thead>

            <tbody>
              {documents.map((document, index) => (
                <tr key={index}>
                  <td className="document-name">
                    <span className="file-icon">▧</span>
                    {document.name}
                  </td>

                  <td>
                    <span
                      className={`status ${document.status.toLowerCase()}`}
                    >
                      {document.status}
                    </span>
                  </td>

                  <td>{document.obligations}</td>

                  <td>{document.uploaded}</td>

                  <td>
                    <button className="open-btn">Open</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}

export default Dashboard;