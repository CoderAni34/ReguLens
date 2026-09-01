import React, { useState, useEffect, useMemo } from "react";
import { getEvidenceList, updateEvidence } from "../services/api";

function Evidence() {
  const [selectedType, setSelectedType] = useState("All");
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [evidenceItems, setEvidenceItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchEvidenceData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getEvidenceList();
      setEvidenceItems(data || []);
    } catch (err) {
      console.error("Failed to load evidence:", err);
      setError(err.message || "Failed to load compliance evidence requirements from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvidenceData();
  }, []);

  const filteredEvidence = useMemo(() => {
    if (selectedType === "All") {
      return evidenceItems;
    }
    return evidenceItems.filter(
      (item) => (item.evidence_type || "Document").toLowerCase() === selectedType.toLowerCase()
    );
  }, [evidenceItems, selectedType]);

  const verifiedCount = useMemo(
    () => evidenceItems.filter((item) => (item.status || "").toLowerCase() === "verified").length,
    [evidenceItems]
  );

  const pendingCount = useMemo(
    () => evidenceItems.filter((item) => (item.status || "").toLowerCase() === "pending review").length,
    [evidenceItems]
  );

  const documentCount = useMemo(
    () => evidenceItems.filter((item) => (item.evidence_type || "").toLowerCase() === "document").length,
    [evidenceItems]
  );

  const handleStatusUpdate = async (evidenceId, newStatus) => {
    setUpdatingId(evidenceId);
    try {
      const updated = await updateEvidence(evidenceId, { status: newStatus });
      setEvidenceItems((prev) =>
        prev.map((ev) => (ev.id === evidenceId ? { ...ev, status: updated.status } : ev))
      );
      if (selectedEvidence && selectedEvidence.id === evidenceId) {
        setSelectedEvidence((prev) => ({ ...prev, status: updated.status }));
      }
    } catch (err) {
      alert(`Failed to update evidence status: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <main className="evidence-page">
      {/* HEADER */}
      <div className="evidence-header">
        <div className="evidence-header-content">
          <span className="page-badge">▱ EVIDENCE MANAGEMENT</span>
          <h1>Evidence</h1>
          <p>
            Manage and review supporting evidence requirements linked to your compliance obligations.
          </p>
        </div>
      </div>

      {/* ERROR BANNER */}
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
            onClick={fetchEvidenceData}
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
      <div className="evidence-stats">
        <div className="evidence-stat-card">
          <span>Total Evidence Requirements</span>
          <strong>{evidenceItems.length}</strong>
        </div>

        <div className="evidence-stat-card">
          <span>Verified</span>
          <strong className="success-text">{verifiedCount}</strong>
        </div>

        <div className="evidence-stat-card">
          <span>Pending Review</span>
          <strong className="warning-text">{pendingCount}</strong>
        </div>

        <div className="evidence-stat-card">
          <span>Documents</span>
          <strong className="info-text">{documentCount}</strong>
        </div>
      </div>

      {/* EVIDENCE SECTION */}
      <div className="evidence-section">
        <div className="evidence-toolbar">
          <div>
            <h2>Evidence Library</h2>
            <p>{filteredEvidence.length} evidence items found</p>
          </div>

          <div className="filter-buttons">
            {["All", "Document", "Policy", "Report"].map((type) => (
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

        <div className="evidence-divider" />

        {/* LOADING STATE */}
        {loading && (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "#94a3b8" }}>
            <div style={{ fontSize: "24px", marginBottom: "8px" }}>⏳</div>
            <p>Loading compliance evidence requirements from server...</p>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && filteredEvidence.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📂</div>
            <h3>No evidence requirements found.</h3>
            <p style={{ fontSize: "14px", maxWidth: "480px", margin: "0 auto 20px" }}>
              Upload and analyze regulatory documents to automatically identify required evidence proofs and compliance reports.
            </p>
          </div>
        )}

        {/* EVIDENCE LIST */}
        {!loading && filteredEvidence.length > 0 && (
          <div className="evidence-list">
            {filteredEvidence.map((item) => {
              const displayId = `EV-${String(item.id).padStart(3, "0")}`;
              const statusStr = item.status || "Pending Review";
              const statusClass = statusStr.toLowerCase().replace(" ", "-");

              return (
                <div
                  className="evidence-card"
                  key={item.id}
                  onClick={() => setSelectedEvidence(item)}
                >
                  <div className="evidence-main">
                    <span className="evidence-id">{displayId}</span>
                    <h3>{item.title}</h3>
                    <p>{item.description}</p>
                  </div>

                  <div className="evidence-info">
                    <div className="info-item">
                      <span>TYPE</span>
                      <strong>{item.evidence_type || "Document"}</strong>
                    </div>

                    <div className="info-item">
                      <span>RELATED OBLIGATION</span>
                      <strong>
                        {item.obligation_id ? `OB-${String(item.obligation_id).padStart(3, "0")}` : "N/A"}
                      </strong>
                    </div>

                    <div className="info-item">
                      <span>STATUS</span>
                      <strong className={`evidence-status ${statusClass}`}>
                        {statusStr}
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

      {/* EVIDENCE DETAILS MODAL */}
      {selectedEvidence && (
        <div className="modal-overlay" onClick={() => setSelectedEvidence(null)}>
          <div className="obligation-modal evidence-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setSelectedEvidence(null)}>
              ×
            </button>

            <span className="evidence-id">
              {`EV-${String(selectedEvidence.id).padStart(3, "0")}`}
            </span>

            <h2>{selectedEvidence.title}</h2>

            <p className="modal-description">{selectedEvidence.description}</p>

            <div className="modal-grid">
              <div>
                <span>Evidence Type</span>
                <strong>{selectedEvidence.evidence_type || "Document"}</strong>
              </div>

              <div>
                <span>Related Obligation</span>
                <strong>
                  {selectedEvidence.obligation_id ? `OB-${String(selectedEvidence.obligation_id).padStart(3, "0")}` : "N/A"}
                </strong>
              </div>

              <div>
                <span>Status</span>
                <strong className={`evidence-status ${(selectedEvidence.status || "Pending Review").toLowerCase().replace(" ", "-")}`}>
                  {selectedEvidence.status || "Pending Review"}
                </strong>
              </div>

              <div>
                <span>Source Regulatory Document</span>
                <strong>
                  {selectedEvidence.source_document_id ? `Doc #${selectedEvidence.source_document_id}` : "Not linked"}
                </strong>
              </div>
            </div>

            {/* Quick Status Update */}
            <div style={{ marginTop: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "13px", color: "#94a3b8" }}>Verification Status:</span>
              {["Pending Review", "Verified"].map((st) => (
                <button
                  key={st}
                  disabled={updatingId === selectedEvidence.id}
                  onClick={() => handleStatusUpdate(selectedEvidence.id, st)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "6px",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    background:
                      (selectedEvidence.status || "Pending Review") === st
                        ? "var(--primary-color, #6366f1)"
                        : "transparent",
                    color: "#f8fafc",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  {st}
                </button>
              ))}
            </div>

            <div className="modal-actions" style={{ marginTop: "24px" }}>
              <button className="secondary-btn" onClick={() => setSelectedEvidence(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Evidence;