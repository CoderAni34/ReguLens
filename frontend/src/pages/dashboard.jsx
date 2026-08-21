import React, { useState } from "react";

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
  const [selectedDocument, setSelectedDocument] = useState(null);

  const handleOpenDocument = (document) => {
    setSelectedDocument(document);
  };

  const closeDocumentModal = () => {
    setSelectedDocument(null);
  };

  return (
    <main className="page-content">
      {/* HEADER */}
      <header className="top-header">
        <div>
          <h1>Welcome back, BANGGG</h1>

          <p>
            Here's what's happening across your compliance workspace.
          </p>
        </div>

        <div className="header-actions">
          <button
            className="upload-btn"
            onClick={() => setActivePage("Upload")}
          >
            + Upload Document
          </button>
        </div>
      </header>

      {/* STATISTICS */}
      <section className="stats-grid">
        <button
          className="stat-card clickable-card"
          onClick={() => setActivePage("Documents")}
        >
          <p>DOCUMENTS PROCESSED</p>
          <h2>42</h2>
          <span className="muted">+8 from last month</span>
        </button>

        <button
          className="stat-card clickable-card"
          onClick={() => setActivePage("Obligations")}
        >
          <p>ACTIVE OBLIGATIONS</p>
          <h2>318</h2>
          <span className="muted">14 pending review</span>
        </button>

        <button
          className="stat-card warning-card clickable-card"
          onClick={() => setActivePage("Tasks")}
        >
          <p>DEADLINES THIS MONTH</p>
          <h2>12</h2>

          <span className="warning-text">
            4 due within 7 days
          </span>
        </button>
      </section>

      {/* RECENT DOCUMENTS */}
      <section className="documents-section">
        <div className="section-header">
          <h2>Recent Documents</h2>

          <button
            className="view-all"
            onClick={() => setActivePage("Documents")}
          >
            View all →
          </button>
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
                    <button
                      className="open-btn"
                      onClick={() => handleOpenDocument(document)}
                    >
                      Open
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* DOCUMENT PREVIEW MODAL */}
      {selectedDocument && (
        <div
          className="document-modal-overlay"
          onClick={closeDocumentModal}
        >
          <div
            className="document-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <p className="modal-label">DOCUMENT DETAILS</p>
                <h2>{selectedDocument.name}</h2>
              </div>

              <button
                className="modal-close"
                onClick={closeDocumentModal}
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              <div className="modal-detail">
                <span>Status</span>

                <strong
                  className={`status ${selectedDocument.status.toLowerCase()}`}
                >
                  {selectedDocument.status}
                </strong>
              </div>

              <div className="modal-detail">
                <span>Obligations Extracted</span>
                <strong>{selectedDocument.obligations}</strong>
              </div>

              <div className="modal-detail">
                <span>Uploaded</span>
                <strong>{selectedDocument.uploaded}</strong>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="modal-secondary-btn"
                onClick={closeDocumentModal}
              >
                Close
              </button>

              <button
                className="upload-btn"
                onClick={() => {
                  closeDocumentModal();
                  setActivePage("Documents");
                }}
              >
                View Document
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Dashboard;