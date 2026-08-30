import React, { useState, useEffect, useMemo } from "react";
import { getDocuments, deleteDocument } from "../services/api";

function Documents({ setActivePage, onSelectDocument, setPendingFile }) {
  const [selectedType, setSelectedType] = useState("All");
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDocs = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDocuments();
      setDocuments(data || []);
    } catch (err) {
      console.error("Failed to load documents:", err);
      setError(err.message || "Failed to load documents from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

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

  const filteredDocuments = useMemo(() => {
    if (selectedType === "All") {
      return documents;
    }
    return documents.filter((doc) => {
      const type = (doc.document_type || "Regulation").toLowerCase();
      return type.includes(selectedType.toLowerCase());
    });
  }, [documents, selectedType]);

  const completedCount = useMemo(
    () => documents.filter((d) => (d.processing_status || "").toLowerCase() === "completed").length,
    [documents]
  );

  const processingCount = useMemo(
    () => documents.filter((d) => (d.processing_status || "").toLowerCase() === "processing" || (d.processing_status || "").toLowerCase() === "uploaded").length,
    [documents]
  );

  const latestUploadDate = useMemo(() => {
    if (documents.length === 0) return "--";
    return formatUploadDate(documents[0].uploaded_at);
  }, [documents]);

  const handleDelete = async (docId, e) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this document and all its extracted obligations?")) {
      return;
    }
    try {
      await deleteDocument(docId);
      setDocuments((prev) => prev.filter((d) => d.id !== docId));
      if (selectedDocument && selectedDocument.id === docId) {
        setSelectedDocument(null);
      }
    } catch (err) {
      alert(`Failed to delete document: ${err.message}`);
    }
  };

  return (
    <main className="documents-page">
      {/* HEADER */}
      <div className="documents-header">
        <div className="documents-header-content">
          <span className="page-badge">▣ DOCUMENT MANAGEMENT</span>
          <h1>Documents</h1>
          <p>
            Manage and organize compliance documents, circulars, and regulatory policies.
          </p>
        </div>

        <button
          className="primary-btn"
          onClick={() => setActivePage && setActivePage("Upload")}
        >
          + Upload Document
        </button>
      </div>

      {error && (
        <div style={{
          backgroundColor: "rgba(239, 68, 68, 0.12)",
          border: "1px solid rgba(239, 68, 68, 0.3)",
          color: "#f87171",
          padding: "14px 18px",
          borderRadius: "8px",
          marginBottom: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <span>⚠️ {error}</span>
          <button
            onClick={fetchDocs}
            style={{
              background: "rgba(239, 68, 68, 0.2)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              color: "#fff",
              padding: "4px 10px",
              borderRadius: "4px",
              cursor: "pointer",
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* STATISTICS */}
      <div className="documents-stats">
        <div className="documents-stat-card">
          <span>Total Documents</span>
          <strong>{documents.length}</strong>
        </div>

        <div className="documents-stat-card">
          <span>Analyzed & Completed</span>
          <strong className="success-text">{completedCount}</strong>
        </div>

        <div className="documents-stat-card">
          <span>In Ingestion / Processing</span>
          <strong className="warning-text">{processingCount}</strong>
        </div>

        <div className="documents-stat-card">
          <span>Latest Upload</span>
          <strong className="info-text latest-date">{latestUploadDate}</strong>
        </div>
      </div>

      {/* DOCUMENTS SECTION */}
      <div className="documents-section">
        <div className="documents-toolbar">
          <div>
            <h2>Document Library</h2>
            <p>{filteredDocuments.length} documents available</p>
          </div>

          <div className="filter-buttons">
            {["All", "Regulation", "Circular", "Policy", "Guideline"].map((type) => (
              <button
                key={type}
                className={selectedType === type ? "filter-btn active" : "filter-btn"}
                onClick={() => setSelectedType(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="documents-divider" />

        {loading && (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "#94a3b8" }}>
            <div style={{ fontSize: "24px", marginBottom: "8px" }}>⏳</div>
            <p>Loading documents from database...</p>
          </div>
        )}

        {!loading && filteredDocuments.length === 0 && (
          <div style={{
            padding: "50px 20px",
            textAlign: "center",
            background: "rgba(255, 255, 255, 0.02)",
            borderRadius: "12px",
            border: "1px dashed rgba(255, 255, 255, 0.1)",
            margin: "20px 0",
          }}>
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>📂</div>
            <h3 style={{ fontSize: "18px", color: "#f8fafc", marginBottom: "8px" }}>
              No documents in your library yet.
            </h3>
            <p style={{ color: "#94a3b8", fontSize: "14px", maxWidth: "450px", margin: "0 auto 20px" }}>
              Upload your first regulatory document or circular to begin automated AI compliance analysis.
            </p>
            {setActivePage && (
              <button
                className="primary-btn"
                onClick={() => setActivePage("Upload")}
                style={{ padding: "10px 24px" }}
              >
                + Upload Document
              </button>
            )}
          </div>
        )}

        {/* DOCUMENT LIST */}
        {!loading && filteredDocuments.length > 0 && (
          <div className="documents-list">
            {filteredDocuments.map((document) => {
              const status = document.processing_status || "uploaded";
              return (
                <div
                  className="document-card"
                  key={document.id}
                  onClick={() => setSelectedDocument(document)}
                >
                  <div className="document-main">
                    <span className="document-id">DOC-{String(document.id).padStart(3, "0")}</span>
                    <h3>{document.title || document.filename}</h3>
                    <p style={{ wordBreak: "break-all" }}>{document.filename}</p>
                  </div>

                  <div className="document-info">
                    <div className="info-item">
                      <span>TYPE</span>
                      <strong>{document.document_type || "Regulation"}</strong>
                    </div>

                    <div className="info-item">
                      <span>UPLOADED</span>
                      <strong>{formatUploadDate(document.uploaded_at)}</strong>
                    </div>

                    <div className="info-item">
                      <span>STATUS</span>
                      <strong className={`document-status ${status.toLowerCase()}`}>
                        {status}
                      </strong>
                    </div>
                  </div>

                  <span className="arrow">→</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DOCUMENT DETAILS MODAL */}
      {selectedDocument && (
        <div className="modal-overlay" onClick={() => setSelectedDocument(null)}>
          <div className="obligation-modal document-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setSelectedDocument(null)}>
              ×
            </button>

            <span className="document-id">
              DOC-{String(selectedDocument.id).padStart(3, "0")}
            </span>

            <h2>{selectedDocument.title || selectedDocument.filename}</h2>

            <p className="modal-description">
              Uploaded file: <code>{selectedDocument.filename}</code>
            </p>

            <div className="modal-grid">
              <div>
                <span>Document Type</span>
                <strong>{selectedDocument.document_type || "Regulatory Circular"}</strong>
              </div>

              <div>
                <span>Processing Status</span>
                <strong className={`status ${(selectedDocument.processing_status || "uploaded").toLowerCase()}`}>
                  {selectedDocument.processing_status || "uploaded"}
                </strong>
              </div>

              <div>
                <span>Uploaded On</span>
                <strong>{formatUploadDate(selectedDocument.uploaded_at)}</strong>
              </div>

              <div>
                <span>Language</span>
                <strong>{selectedDocument.language || "English (en)"}</strong>
              </div>
            </div>

            <div className="modal-actions" style={{ marginTop: "24px" }}>
              <button
                className="secondary-btn"
                style={{ color: "#f87171", borderColor: "rgba(239, 68, 68, 0.3)" }}
                onClick={(e) => handleDelete(selectedDocument.id, e)}
              >
                Delete Document
              </button>

              <button
                className="secondary-btn"
                onClick={() => setSelectedDocument(null)}
              >
                Close
              </button>

              <button
                className="primary-btn small-btn"
                onClick={() => {
                  const doc = selectedDocument;
                  setSelectedDocument(null);
                  if (onSelectDocument) {
                    onSelectDocument(doc);
                  } else if (setActivePage) {
                    setActivePage("Obligations");
                  }
                }}
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

export default Documents;