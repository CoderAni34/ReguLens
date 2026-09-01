import React, { useState, useEffect, useMemo } from "react";
import { getConflicts, updateConflict, runConflictDetection } from "../services/api";

function Conflicts() {
  const [selectedSeverity, setSelectedSeverity] = useState("All");
  const [selectedConflict, setSelectedConflict] = useState(null);
  const [conflicts, setConflicts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detecting, setDetecting] = useState(false);
  const [updatingId, setUpdatingId] = useState(null);

  const fetchConflictsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getConflicts();
      setConflicts(data || []);
    } catch (err) {
      console.error("Failed to load conflicts:", err);
      setError(err.message || "Failed to load compliance conflicts from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchConflictsData();
  }, []);

  const activeConflicts = useMemo(
    () => conflicts.filter((c) => (c.status || "Unresolved").toLowerCase() === "unresolved"),
    [conflicts]
  );

  const filteredConflicts = useMemo(() => {
    if (selectedSeverity === "All") {
      return activeConflicts;
    }
    return activeConflicts.filter(
      (c) => (c.severity || "Medium").toLowerCase() === selectedSeverity.toLowerCase()
    );
  }, [activeConflicts, selectedSeverity]);

  const highCount = useMemo(
    () => activeConflicts.filter((c) => (c.severity || "").toLowerCase() === "high").length,
    [activeConflicts]
  );

  const mediumCount = useMemo(
    () => activeConflicts.filter((c) => (c.severity || "").toLowerCase() === "medium").length,
    [activeConflicts]
  );

  const lowCount = useMemo(
    () => activeConflicts.filter((c) => (c.severity || "").toLowerCase() === "low").length,
    [activeConflicts]
  );

  const handleResolveConflict = async () => {
    if (!selectedConflict) return;
    setUpdatingId(selectedConflict.id);
    try {
      const updated = await updateConflict(selectedConflict.id, { status: "Resolved" });
      setConflicts((prev) =>
        prev.map((c) => (c.id === selectedConflict.id ? { ...c, status: updated.status } : c))
      );
      setSelectedConflict(null);
    } catch (err) {
      alert(`Failed to resolve conflict: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleRunDetection = async () => {
    setDetecting(true);
    try {
      await runConflictDetection();
      await fetchConflictsData();
    } catch (err) {
      alert(`Conflict detection failed: ${err.message}`);
    } finally {
      setDetecting(false);
    }
  };

  return (
    <main className="obligations-page">
      {/* HEADER */}
      <div className="obligations-header">
        <div className="obligations-header-content">
          <span className="page-badge">⚠ CONFLICT DETECTION</span>
          <h1>Conflicts</h1>
          <p>
            Review potential conflicts, inconsistencies, and overlapping requirements detected across your compliance documents.
          </p>
        </div>

        <button
          className="primary-btn"
          onClick={handleRunDetection}
          disabled={detecting}
          style={{ opacity: detecting ? 0.7 : 1 }}
        >
          {detecting ? "Analyzing..." : "🔍 Run Detection"}
        </button>
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
            onClick={fetchConflictsData}
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
      <div className="obligation-stats">
        <div className="obligation-stat-card">
          <span>Active Conflicts</span>
          <strong>{activeConflicts.length}</strong>
        </div>

        <div className="obligation-stat-card">
          <span>High Severity</span>
          <strong className="danger-text">{highCount}</strong>
        </div>

        <div className="obligation-stat-card">
          <span>Medium Severity</span>
          <strong className="warning-text">{mediumCount}</strong>
        </div>

        <div className="obligation-stat-card">
          <span>Low Severity</span>
          <strong className="success-text">{lowCount}</strong>
        </div>
      </div>

      {/* CONFLICTS SECTION */}
      <div className="obligations-section">
        <div className="obligations-toolbar">
          <div>
            <h2>Detected Conflicts</h2>
            <p>{filteredConflicts.length} active conflicts found</p>
          </div>

          <div className="filter-buttons">
            {["All", "High", "Medium", "Low"].map((severity) => (
              <button
                key={severity}
                className={selectedSeverity === severity ? "filter-btn active" : "filter-btn"}
                onClick={() => setSelectedSeverity(severity)}
              >
                {severity}
              </button>
            ))}
          </div>
        </div>

        <div className="obligations-divider" />

        {/* LOADING STATE */}
        {loading && (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "#94a3b8" }}>
            <div style={{ fontSize: "24px", marginBottom: "8px" }}>⏳</div>
            <p>Loading conflict detection records from server...</p>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && filteredConflicts.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">✅</div>
            <h3>No active conflicts detected.</h3>
            <p style={{ fontSize: "14px", maxWidth: "480px", margin: "0 auto 20px" }}>
              All regulatory circulars and policy documents in your library are consistent without overlapping contradictions.
            </p>
          </div>
        )}

        {/* CONFLICT LIST */}
        {!loading && filteredConflicts.length > 0 && (
          <div className="obligations-list">
            {filteredConflicts.map((conflict) => {
              const displayId = `CF-${String(conflict.id).padStart(3, "0")}`;
              const severityClass = (conflict.severity || "Medium").toLowerCase();

              return (
                <div
                  className="obligation-card"
                  key={conflict.id}
                  onClick={() => setSelectedConflict(conflict)}
                >
                  <div className="obligation-main">
                    <span className="obligation-id">{displayId}</span>
                    <h3>{conflict.title}</h3>
                    <p>{conflict.description}</p>
                  </div>

                  <div className="obligation-info">
                    <div className="info-item">
                      <span>TYPE</span>
                      <strong>{conflict.conflict_type || "Requirement Conflict"}</strong>
                    </div>

                    <div className="info-item">
                      <span>SEVERITY</span>
                      <strong className={`priority ${severityClass}`}>
                        {conflict.severity || "Medium"}
                      </strong>
                    </div>

                    <div className="info-item">
                      <span>STATUS</span>
                      <strong className="obligation-status pending">
                        {conflict.status || "Unresolved"}
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

      {/* CONFLICT DETAILS MODAL WITH SOURCE TRACEABILITY */}
      {selectedConflict && (
        <div className="modal-overlay" onClick={() => setSelectedConflict(null)}>
          <div className="obligation-modal" style={{ maxWidth: "680px" }} onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setSelectedConflict(null)}>
              ×
            </button>

            <span className="obligation-id">
              {`CF-${String(selectedConflict.id).padStart(3, "0")}`}
            </span>

            <h2>{selectedConflict.title}</h2>

            <p className="modal-description">{selectedConflict.description}</p>

            <div className="modal-grid">
              <div>
                <span>Conflict Type</span>
                <strong>{selectedConflict.conflict_type || "Requirement Conflict"}</strong>
              </div>

              <div>
                <span>Severity</span>
                <strong className={`priority ${(selectedConflict.severity || "Medium").toLowerCase()}`}>
                  {selectedConflict.severity || "Medium"}
                </strong>
              </div>

              <div>
                <span>Document A (Page {selectedConflict.page_a || 1})</span>
                <strong>Doc #{selectedConflict.document_a_id}</strong>
              </div>

              <div>
                <span>Document B (Page {selectedConflict.page_b || 1})</span>
                <strong>Doc #{selectedConflict.document_b_id}</strong>
              </div>
            </div>

            {/* FULL SOURCE TRACEABILITY BOXES */}
            <div style={{ marginTop: "16px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div style={{
                background: "rgba(0, 0, 0, 0.3)",
                borderLeft: "3px solid #f59e0b",
                padding: "10px 12px",
                borderRadius: "4px",
              }}>
                <span style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>
                  Source A (Doc #{selectedConflict.document_a_id}, Page {selectedConflict.page_a || 1}):
                </span>
                <p style={{ fontStyle: "italic", fontSize: "12px", color: "#cbd5e1", margin: 0 }}>
                  "{selectedConflict.source_text_a || "No direct quote recorded"}"
                </p>
              </div>

              <div style={{
                background: "rgba(0, 0, 0, 0.3)",
                borderLeft: "3px solid #ef4444",
                padding: "10px 12px",
                borderRadius: "4px",
              }}>
                <span style={{ fontSize: "11px", color: "#94a3b8", display: "block", marginBottom: "4px" }}>
                  Source B (Doc #{selectedConflict.document_b_id}, Page {selectedConflict.page_b || 1}):
                </span>
                <p style={{ fontStyle: "italic", fontSize: "12px", color: "#cbd5e1", margin: 0 }}>
                  "{selectedConflict.source_text_b || "No direct quote recorded"}"
                </p>
              </div>
            </div>

            {selectedConflict.recommendation && (
              <div className="conflict-recommendation" style={{ marginTop: "16px" }}>
                <span>RECOMMENDED ACTION</span>
                <p>{selectedConflict.recommendation}</p>
              </div>
            )}

            <div className="modal-actions" style={{ marginTop: "24px" }}>
              <button className="secondary-btn" onClick={() => setSelectedConflict(null)}>
                Close
              </button>

              <button
                className="primary-btn small-btn"
                disabled={updatingId === selectedConflict.id}
                onClick={handleResolveConflict}
              >
                Resolve Conflict
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Conflicts;