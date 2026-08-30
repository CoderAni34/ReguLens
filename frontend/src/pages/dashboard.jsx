import React, { useState, useEffect } from "react";
import { getDocuments, getObligations } from "../services/api";

function Dashboard({ setActivePage, onSelectDocument }) {
  const [documents, setDocuments] = useState([]);
  const [obligations, setObligations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState(null);

  useEffect(() => {
    async function loadDashboardData() {
      setLoading(true);
      try {
        const [docsData, obsData] = await Promise.all([
          getDocuments(),
          getObligations(),
        ]);
        setDocuments(docsData || []);
        setObligations(obsData || []);
      } catch (err) {
        console.warn("Failed to load live dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, []);

  const handleOpenDocument = (document) => {
    setSelectedDocument(document);
  };

  const closeDocumentModal = () => {
    setSelectedDocument(null);
  };

  const handleViewObligations = (doc) => {
    closeDocumentModal();
    if (onSelectDocument) {
      onSelectDocument(doc);
    } else {
      setActivePage("Obligations");
    }
  };

  const activeObligationsCount = obligations.length;
  const pendingReviewCount = obligations.filter(
    (o) => (o.status || "").toLowerCase() === "pending" || (o.status || "").toLowerCase() === "active"
  ).length;

  const completedDocsCount = documents.filter(
    (d) => (d.processing_status || "").toLowerCase() === "completed"
  ).length;

  // Format uploaded timestamp
  const formatUploadDate = (dateStr) => {
    if (!dateStr) return "Recently";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <main className="page-content">
      {/* HEADER */}
      <header className="top-header">
        <div>
          <h1>Welcome back, Compliance Officer</h1>
          <p>
            Here's what's happening across your regulatory compliance workspace.
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
          <p>DOCUMENTS INGESTED</p>
          <h2>{documents.length}</h2>
          <span className="muted">{completedDocsCount} analyzed & active</span>
        </button>

        <button
          className="stat-card clickable-card"
          onClick={() => setActivePage("Obligations")}
        >
          <p>ACTIVE OBLIGATIONS</p>
          <h2>{activeObligationsCount}</h2>
          <span className="muted">{pendingReviewCount} pending action</span>
        </button>

        <button
          className="stat-card warning-card clickable-card"
          onClick={() => setActivePage("Obligations")}
        >
          <p>HIGH PRIORITY ITEMS</p>
          <h2>
            {obligations.filter((o) => (o.priority || "").toLowerCase() === "high").length}
          </h2>
          <span className="warning-text">Require immediate attention</span>
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
            View all ({documents.length}) →
          </button>
        </div>

        <div className="table-wrapper">
          {loading ? (
            <div style={{ padding: "30px", textAlign: "center", color: "#94a3b8" }}>
              Loading compliance documents...
            </div>
          ) : documents.length === 0 ? (
            <div style={{
              padding: "40px 20px",
              textAlign: "center",
              color: "#94a3b8",
            }}>
              <p style={{ marginBottom: "12px" }}>No documents uploaded yet.</p>
              <button
                className="primary-btn"
                onClick={() => setActivePage("Upload")}
                style={{ padding: "8px 16px", fontSize: "13px" }}
              >
                Upload First Regulatory PDF
              </button>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>DOCUMENT NAME</th>
                  <th>STATUS</th>
                  <th>TYPE</th>
                  <th>UPLOADED</th>
                  <th>ACTION</th>
                </tr>
              </thead>

              <tbody>
                {documents.slice(0, 8).map((document) => {
                  const status = document.processing_status || "uploaded";
                  return (
                    <tr key={document.id}>
                      <td className="document-name">
                        <span className="file-icon">▧</span>
                        {document.title || document.filename}
                      </td>

                      <td>
                        <span className={`status ${status.toLowerCase()}`}>
                          {status}
                        </span>
                      </td>

                      <td>{document.document_type || "Regulatory Circular"}</td>

                      <td>{formatUploadDate(document.uploaded_at)}</td>

                      <td>
                        <button
                          className="open-btn"
                          onClick={() => handleOpenDocument(document)}
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* DOCUMENT PREVIEW MODAL */}
      {selectedDocument && (
        <div className="document-modal-overlay" onClick={closeDocumentModal}>
          <div className="document-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <p className="modal-label">DOCUMENT DETAILS</p>
                <h2>{selectedDocument.title || selectedDocument.filename}</h2>
              </div>

              <button className="modal-close" onClick={closeDocumentModal}>
                ×
              </button>
            </div>

            <div className="modal-content">
              <div className="modal-detail">
                <span>Document ID</span>
                <strong>#{selectedDocument.id}</strong>
              </div>

              <div className="modal-detail">
                <span>Processing Status</span>
                <strong className={`status ${(selectedDocument.processing_status || "uploaded").toLowerCase()}`}>
                  {selectedDocument.processing_status || "uploaded"}
                </strong>
              </div>

              <div className="modal-detail">
                <span>Document Type</span>
                <strong>{selectedDocument.document_type || "Regulatory Circular"}</strong>
              </div>

              <div className="modal-detail">
                <span>Uploaded Date</span>
                <strong>{formatUploadDate(selectedDocument.uploaded_at)}</strong>
              </div>
            </div>

            <div className="modal-actions">
              <button className="modal-secondary-btn" onClick={closeDocumentModal}>
                Close
              </button>

              <button
                className="upload-btn"
                onClick={() => handleViewObligations(selectedDocument)}
              >
                View Extracted Obligations →
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Dashboard;