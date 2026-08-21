import React, { useState, useEffect, useMemo } from "react";
import {
  getObligationsByDocument,
  getObligations,
  getDocuments,
  createObligation,
  updateObligation,
  deleteObligation,
} from "../services/api";

function Obligations({ currentDocument, setCurrentDocument, setActivePage }) {
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedObligation, setSelectedObligation] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [allDocuments, setAllDocuments] = useState([]);
  const [obligations, setObligations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  const [newObligation, setNewObligation] = useState({
    title: "",
    description: "",
    deadline: "",
    priority: "Medium",
    responsible_unit: "",
    evidence_required: "",
    category: "Compliance",
  });

  // Fetch all documents for the switcher dropdown
  useEffect(() => {
    async function loadDocuments() {
      try {
        const docs = await getDocuments();
        setAllDocuments(docs || []);
      } catch (err) {
        console.warn("Could not load documents list for switcher:", err);
      }
    }
    loadDocuments();
  }, []);

  // Fetch obligations whenever currentDocument changes
  const fetchObligations = async () => {
    setLoading(true);
    setError(null);
    try {
      let data = [];
      if (currentDocument && currentDocument.id) {
        data = await getObligationsByDocument(currentDocument.id);
      } else {
        data = await getObligations();
      }
      setObligations(data || []);
    } catch (err) {
      console.error("Failed to load obligations:", err);
      setError(err.message || "Failed to load compliance obligations from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchObligations();
  }, [currentDocument]);

  const handleDocumentChange = (e) => {
    const docId = e.target.value;
    if (docId === "all") {
      setCurrentDocument(null);
    } else {
      const selected = allDocuments.find((d) => String(d.id) === String(docId));
      if (selected) {
        setCurrentDocument(selected);
      }
    }
  };

  // Filter logic
  const filteredObligations = useMemo(() => {
    if (selectedStatus === "All") {
      return obligations;
    }
    return obligations.filter((obligation) => {
      const status = (obligation.status || "Pending").toLowerCase();
      const target = selectedStatus.toLowerCase();
      if (target === "pending") {
        return status === "pending" || status === "active";
      }
      return status === target;
    });
  }, [obligations, selectedStatus]);

  // Dynamic Statistics
  const highPriorityCount = useMemo(
    () => obligations.filter((o) => (o.priority || "").toLowerCase() === "high").length,
    [obligations]
  );

  const pendingCount = useMemo(
    () => obligations.filter((o) => {
      const s = (o.status || "Pending").toLowerCase();
      return s === "pending" || s === "active";
    }).length,
    [obligations]
  );

  const completedCount = useMemo(
    () => obligations.filter((o) => (o.status || "").toLowerCase() === "completed").length,
    [obligations]
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewObligation((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddObligation = async () => {
    if (
      !newObligation.title.trim() ||
      !newObligation.description.trim() ||
      !newObligation.deadline
    ) {
      alert("Please fill in the required fields (Title, Description, Deadline).");
      return;
    }

    try {
      const docId = currentDocument?.id || (allDocuments.length > 0 ? allDocuments[0].id : 1);
      const payload = {
        document_id: docId,
        title: newObligation.title.trim(),
        description: newObligation.description.trim(),
        deadline: newObligation.deadline,
        priority: newObligation.priority,
        responsible_unit: newObligation.responsible_unit.trim() || "Not specified",
        evidence_required: newObligation.evidence_required.trim() || "Not specified",
        penalty: "Not specified",
        category: newObligation.category || "Compliance",
        source_text: "Manually registered obligation",
        source_page: 1,
        confidence: 1.0,
        status: "Pending",
      };

      const created = await createObligation(payload);
      setObligations((prev) => [created, ...prev]);

      setNewObligation({
        title: "",
        description: "",
        deadline: "",
        priority: "Medium",
        responsible_unit: "",
        evidence_required: "",
        category: "Compliance",
      });

      setShowAddModal(false);
    } catch (err) {
      alert(`Failed to save obligation: ${err.message}`);
    }
  };

  const handleStatusUpdate = async (obligationId, newStatus) => {
    setUpdatingId(obligationId);
    try {
      const updated = await updateObligation(obligationId, { status: newStatus });
      setObligations((prev) =>
        prev.map((o) => (o.id === obligationId ? { ...o, status: updated.status } : o))
      );
      if (selectedObligation && selectedObligation.id === obligationId) {
        setSelectedObligation((prev) => ({ ...prev, status: updated.status }));
      }
    } catch (err) {
      alert(`Failed to update status: ${err.message}`);
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <main className="obligations-page">
      {/* HEADER */}
      <div className="obligations-header">
        <div className="obligations-header-content">
          <span className="page-badge">✦ AI EXTRACTED</span>
          <h1>Obligations</h1>
          <p>
            Review and manage compliance obligations extracted from your regulatory documents.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          {/* Document Switcher */}
          {allDocuments.length > 0 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ fontSize: "11px", textTransform: "uppercase", color: "#94a3b8", fontWeight: 600 }}>
                Active Document
              </label>
              <select
                value={currentDocument ? currentDocument.id : "all"}
                onChange={handleDocumentChange}
                style={{
                  background: "rgba(30, 41, 59, 0.8)",
                  border: "1px solid rgba(255, 255, 255, 0.1)",
                  color: "#f8fafc",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  fontSize: "13px",
                  maxWidth: "260px",
                }}
              >
                <option value="all">All Documents ({allDocuments.length})</option>
                {allDocuments.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.title || doc.filename}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            className="primary-btn"
            onClick={() => setShowAddModal(true)}
            style={{ alignSelf: "flex-end" }}
          >
            + Add Obligation
          </button>
        </div>
      </div>

      {/* DOCUMENT CONTEXT BAR */}
      {currentDocument && (
        <div style={{
          background: "rgba(99, 102, 241, 0.08)",
          border: "1px solid rgba(99, 102, 241, 0.2)",
          borderRadius: "8px",
          padding: "10px 16px",
          marginBottom: "20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "13px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ color: "var(--primary-color, #6366f1)", fontWeight: 600 }}>📄 Filtered by:</span>
            <strong style={{ color: "#f8fafc" }}>{currentDocument.title || currentDocument.filename}</strong>
            <span style={{ color: "#94a3b8" }}>(Document #{currentDocument.id})</span>
          </div>
          <button
            onClick={() => setCurrentDocument(null)}
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              fontSize: "12px",
              textDecoration: "underline",
            }}
          >
            Show All Obligations
          </button>
        </div>
      )}

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
            onClick={fetchObligations}
            style={{
              background: "rgba(239, 68, 68, 0.2)",
              border: "1px solid rgba(239, 68, 68, 0.4)",
              color: "#fff",
              padding: "4px 10px",
              borderRadius: "4px",
              cursor: "pointer",
              fontSize: "12px",
            }}
          >
            Retry
          </button>
        </div>
      )}

      {/* STATISTICS */}
      <div className="obligation-stats">
        <div className="obligation-stat-card">
          <span>Total Obligations</span>
          <strong>{obligations.length}</strong>
        </div>

        <div className="obligation-stat-card">
          <span>High Priority</span>
          <strong className="danger-text">{highPriorityCount}</strong>
        </div>

        <div className="obligation-stat-card">
          <span>Pending</span>
          <strong className="warning-text">{pendingCount}</strong>
        </div>

        <div className="obligation-stat-card">
          <span>Completed</span>
          <strong className="success-text">{completedCount}</strong>
        </div>
      </div>

      {/* OBLIGATIONS SECTION */}
      <div className="obligations-section">
        <div className="obligations-toolbar">
          <div>
            <h2>Extracted Obligations</h2>
            <p>{filteredObligations.length} obligations found</p>
          </div>

          <div className="filter-buttons">
            {["All", "Pending", "In Progress", "Completed"].map((status) => (
              <button
                key={status}
                className={selectedStatus === status ? "filter-btn active" : "filter-btn"}
                onClick={() => setSelectedStatus(status)}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="obligations-divider" />

        {/* LOADING STATE */}
        {loading && (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "#94a3b8" }}>
            <div style={{ fontSize: "24px", marginBottom: "8px" }}>⏳</div>
            <p>Loading compliance obligations from server...</p>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && filteredObligations.length === 0 && (
          <div style={{
            padding: "50px 20px",
            textAlign: "center",
            background: "rgba(255, 255, 255, 0.02)",
            borderRadius: "12px",
            border: "1px dashed rgba(255, 255, 255, 0.1)",
            margin: "20px 0",
          }}>
            <div style={{ fontSize: "36px", marginBottom: "12px" }}>📋</div>
            <h3 style={{ fontSize: "18px", color: "#f8fafc", marginBottom: "8px" }}>
              No analyzed obligations available yet.
            </h3>
            <p style={{ color: "#94a3b8", fontSize: "14px", maxWidth: "450px", margin: "0 auto 20px" }}>
              Upload a regulatory circular or compliance policy document to extract obligations automatically with AI.
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

        {/* OBLIGATION CARDS */}
        {!loading && filteredObligations.length > 0 && (
          <div className="obligations-list">
            {filteredObligations.map((obligation) => {
              const displayId = `OB-${String(obligation.id).padStart(3, "0")}`;
              const priorityClass = (obligation.priority || "medium").toLowerCase();
              const statusDisplay = obligation.status || "Pending";
              const statusClass = statusDisplay.toLowerCase().replace(" ", "-");
              const confidenceDisplay = obligation.confidence !== undefined && obligation.confidence !== null
                ? `${Math.round(obligation.confidence <= 1 ? obligation.confidence * 100 : obligation.confidence)}%`
                : "Not specified";

              return (
                <div
                  className="obligation-card"
                  key={obligation.id}
                  onClick={() => setSelectedObligation(obligation)}
                >
                  <div className="obligation-main">
                    <div style={{ display: "flex", gap: "8px", alignItems: "center", marginBottom: "4px" }}>
                      <span className="obligation-id">{displayId}</span>
                      {obligation.category && (
                        <span style={{
                          fontSize: "11px",
                          padding: "2px 8px",
                          borderRadius: "4px",
                          background: "rgba(255,255,255,0.06)",
                          color: "#94a3b8",
                        }}>
                          {obligation.category}
                        </span>
                      )}
                    </div>

                    <h3>{obligation.title}</h3>
                    <p>{obligation.description}</p>
                  </div>

                  <div className="obligation-info">
                    <div className="info-item">
                      <span>DEADLINE</span>
                      <strong>{obligation.deadline || "Not specified"}</strong>
                    </div>

                    <div className="info-item">
                      <span>PRIORITY</span>
                      <strong className={`priority ${priorityClass}`}>
                        {obligation.priority || "Medium"}
                      </strong>
                    </div>

                    <div className="info-item">
                      <span>STATUS</span>
                      <strong className={`obligation-status ${statusClass}`}>
                        {statusDisplay}
                      </strong>
                    </div>

                    <div className="info-item">
                      <span>AI CONFIDENCE</span>
                      <strong style={{ color: "var(--primary-color, #6366f1)" }}>
                        {confidenceDisplay}
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

      {/* DETAILS MODAL */}
      {selectedObligation && (
        <div className="modal-overlay" onClick={() => setSelectedObligation(null)}>
          <div className="obligation-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setSelectedObligation(null)}>
              ×
            </button>

            <div style={{ display: "flex", gap: "10px", alignItems: "center", marginBottom: "8px" }}>
              <span className="obligation-id">
                {`OB-${String(selectedObligation.id).padStart(3, "0")}`}
              </span>
              {selectedObligation.category && (
                <span className="page-badge">{selectedObligation.category}</span>
              )}
            </div>

            <h2>{selectedObligation.title}</h2>

            <p className="modal-description">{selectedObligation.description}</p>

            <div className="modal-grid">
              <div>
                <span>Deadline</span>
                <strong>{selectedObligation.deadline || "Not specified"}</strong>
              </div>

              <div>
                <span>Responsible Unit</span>
                <strong>{selectedObligation.responsible_unit || "Not specified"}</strong>
              </div>

              <div>
                <span>Evidence Required</span>
                <strong>{selectedObligation.evidence_required || "Not specified"}</strong>
              </div>

              <div>
                <span>Penalty / Consequence</span>
                <strong>{selectedObligation.penalty || "Not specified"}</strong>
              </div>

              <div>
                <span>Source Page</span>
                <strong>Page {selectedObligation.source_page || 1}</strong>
              </div>

              <div>
                <span>AI Confidence</span>
                <strong className="confidence">
                  {selectedObligation.confidence !== undefined && selectedObligation.confidence !== null
                    ? `${Math.round(selectedObligation.confidence <= 1 ? selectedObligation.confidence * 100 : selectedObligation.confidence)}%`
                    : "Not specified"}
                </strong>
              </div>
            </div>

            {/* Source Reference Quote */}
            {selectedObligation.source_text && (
              <div style={{
                marginTop: "16px",
                padding: "12px",
                background: "rgba(0, 0, 0, 0.25)",
                borderLeft: "3px solid var(--primary-color, #6366f1)",
                borderRadius: "4px",
              }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#94a3b8", display: "block", marginBottom: "4px" }}>
                  Exact Document Source Quote:
                </span>
                <p style={{ fontStyle: "italic", fontSize: "13px", color: "#cbd5e1", margin: 0 }}>
                  "{selectedObligation.source_text}"
                </p>
              </div>
            )}

            {/* Status Change Selector */}
            <div style={{ marginTop: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
              <span style={{ fontSize: "13px", color: "#94a3b8" }}>Update Status:</span>
              {["Pending", "In Progress", "Completed"].map((status) => (
                <button
                  key={status}
                  disabled={updatingId === selectedObligation.id}
                  onClick={() => handleStatusUpdate(selectedObligation.id, status)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "6px",
                    border: "1px solid rgba(255, 255, 255, 0.15)",
                    background:
                      (selectedObligation.status || "Pending") === status
                        ? "var(--primary-color, #6366f1)"
                        : "transparent",
                    color: "#f8fafc",
                    fontSize: "12px",
                    cursor: "pointer",
                  }}
                >
                  {status}
                </button>
              ))}
            </div>

            <div className="modal-actions" style={{ marginTop: "24px" }}>
              <button className="secondary-btn" onClick={() => setSelectedObligation(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD OBLIGATION MODAL */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="obligation-modal add-obligation-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowAddModal(false)}>
              ×
            </button>

            <span className="page-badge">NEW OBLIGATION</span>

            <h2>Add Obligation</h2>
            <p className="modal-description">Create a new compliance obligation manually.</p>

            <div className="add-form">
              <div className="form-group">
                <label>Obligation Title *</label>
                <input
                  type="text"
                  name="title"
                  value={newObligation.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Conduct annual cybersecurity audit"
                />
              </div>

              <div className="form-group">
                <label>Description *</label>
                <textarea
                  rows="3"
                  name="description"
                  value={newObligation.description}
                  onChange={handleInputChange}
                  placeholder="Describe what must be done to achieve compliance..."
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Deadline *</label>
                  <input
                    type="date"
                    name="deadline"
                    value={newObligation.deadline}
                    onChange={handleInputChange}
                  />
                </div>

                <div className="form-group">
                  <label>Priority</label>
                  <select
                    name="priority"
                    value={newObligation.priority}
                    onChange={handleInputChange}
                  >
                    <option>High</option>
                    <option>Medium</option>
                    <option>Low</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Responsible Unit</label>
                  <input
                    type="text"
                    name="responsible_unit"
                    value={newObligation.responsible_unit}
                    onChange={handleInputChange}
                    placeholder="e.g. Information Security Dept"
                  />
                </div>

                <div className="form-group">
                  <label>Category</label>
                  <select
                    name="category"
                    value={newObligation.category}
                    onChange={handleInputChange}
                  >
                    <option>Compliance</option>
                    <option>Academic</option>
                    <option>Financial</option>
                    <option>HR</option>
                    <option>Research</option>
                    <option>Student Welfare</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Evidence Required</label>
                <input
                  type="text"
                  name="evidence_required"
                  value={newObligation.evidence_required}
                  onChange={handleInputChange}
                  placeholder="e.g. Audit certificate and sign-off report"
                />
              </div>
            </div>

            <div className="modal-actions">
              <button className="secondary-btn" onClick={() => setShowAddModal(false)}>
                Cancel
              </button>

              <button className="primary-btn small-btn" onClick={handleAddObligation}>
                Save Obligation
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Obligations;