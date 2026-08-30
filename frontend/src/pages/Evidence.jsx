import React, { useState } from "react";

function Evidence() {
  const [selectedType, setSelectedType] = useState("All");
  const [selectedEvidence, setSelectedEvidence] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const evidenceItems = [
    {
      id: "EV-001",
      title: "Annual Compliance Report",
      description:
        "Final annual compliance report prepared for submission to the regulatory authority.",
      type: "Document",
      relatedTo: "OB-001",
      uploadedBy: "Compliance Team",
      date: "08 Dec 2026",
      status: "Verified",
    },
    {
      id: "EV-002",
      title: "Supporting Documentation",
      description:
        "Supporting records and documents required to demonstrate compliance.",
      type: "Document",
      relatedTo: "OB-002",
      uploadedBy: "Operations Team",
      date: "09 Dec 2026",
      status: "Pending Review",
    },
    {
      id: "EV-003",
      title: "Updated Compliance Policy",
      description:
        "Updated internal policy document reflecting the latest regulatory requirements.",
      type: "Policy",
      relatedTo: "OB-003",
      uploadedBy: "Legal Team",
      date: "05 Jan 2027",
      status: "Verified",
    },
    {
      id: "EV-004",
      title: "Internal Review Report",
      description:
        "Report documenting the results of the internal compliance review.",
      type: "Report",
      relatedTo: "OB-004",
      uploadedBy: "Internal Audit",
      date: "18 Jan 2027",
      status: "Pending Review",
    },
  ];

  const filteredEvidence =
    selectedType === "All"
      ? evidenceItems
      : evidenceItems.filter((item) => item.type === selectedType);

  const verifiedCount = evidenceItems.filter(
    (item) => item.status === "Verified"
  ).length;

  const pendingCount = evidenceItems.filter(
    (item) => item.status === "Pending Review"
  ).length;

  const documentCount = evidenceItems.filter(
    (item) => item.type === "Document"
  ).length;

  return (
    <main className="evidence-page">
      {/* HEADER */}
      <div className="evidence-header">
        <div className="evidence-header-content">
          <span className="page-badge">
            ▱ EVIDENCE MANAGEMENT
          </span>

          <h1>Evidence</h1>

          <p>
            Manage and review supporting evidence linked to your compliance
            obligations.
          </p>
        </div>

        <button
          className="primary-btn"
          onClick={() => setShowUploadModal(true)}
        >
          + Upload
          <br />
          Evidence
        </button>
      </div>

      {/* STATISTICS */}
      <div className="evidence-stats">
        <div className="evidence-stat-card">
          <span>Total Evidence</span>
          <strong>{evidenceItems.length}</strong>
        </div>

        <div className="evidence-stat-card">
          <span>Verified</span>
          <strong className="success-text">
            {verifiedCount}
          </strong>
        </div>

        <div className="evidence-stat-card">
          <span>Pending Review</span>
          <strong className="warning-text">
            {pendingCount}
          </strong>
        </div>

        <div className="evidence-stat-card">
          <span>Documents</span>
          <strong className="info-text">
            {documentCount}
          </strong>
        </div>
      </div>

      {/* EVIDENCE SECTION */}
      <div className="evidence-section">
        <div className="evidence-toolbar">
          <div>
            <h2>Evidence Library</h2>

            <p>
              {filteredEvidence.length} evidence items found
            </p>
          </div>

          <div className="filter-buttons">
            {["All", "Document", "Policy", "Report"].map((type) => (
              <button
                key={type}
                className={
                  selectedType === type
                    ? "filter-btn active"
                    : "filter-btn"
                }
                onClick={() => setSelectedType(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        <div className="evidence-divider" />

        {/* EVIDENCE LIST */}
        <div className="evidence-list">
          {filteredEvidence.map((item) => (
            <div
              className="evidence-card"
              key={item.id}
              onClick={() => setSelectedEvidence(item)}
            >
              <div className="evidence-main">
                <span className="evidence-id">
                  {item.id}
                </span>

                <h3>{item.title}</h3>

                <p>{item.description}</p>
              </div>

              <div className="evidence-info">
                <div className="info-item">
                  <span>TYPE</span>

                  <strong>{item.type}</strong>
                </div>

                <div className="info-item">
                  <span>RELATED TO</span>

                  <strong>{item.relatedTo}</strong>
                </div>

                <div className="info-item">
                  <span>STATUS</span>

                  <strong
                    className={`evidence-status ${item.status
                      .toLowerCase()
                      .replace(" ", "-")}`}
                  >
                    {item.status}
                  </strong>
                </div>
              </div>

              <span className="arrow">→</span>
            </div>
          ))}
        </div>
      </div>

      {/* EVIDENCE DETAILS MODAL */}
      {selectedEvidence && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedEvidence(null)}
        >
          <div
            className="obligation-modal evidence-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-modal"
              onClick={() => setSelectedEvidence(null)}
            >
              ×
            </button>

            <span className="evidence-id">
              {selectedEvidence.id}
            </span>

            <h2>{selectedEvidence.title}</h2>

            <p className="modal-description">
              {selectedEvidence.description}
            </p>

            <div className="modal-grid">
              <div>
                <span>Evidence Type</span>

                <strong>
                  {selectedEvidence.type}
                </strong>
              </div>

              <div>
                <span>Related Obligation</span>

                <strong>
                  {selectedEvidence.relatedTo}
                </strong>
              </div>

              <div>
                <span>Uploaded By</span>

                <strong>
                  {selectedEvidence.uploadedBy}
                </strong>
              </div>

              <div>
                <span>Upload Date</span>

                <strong>
                  {selectedEvidence.date}
                </strong>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="secondary-btn"
                onClick={() => setSelectedEvidence(null)}
              >
                Close
              </button>

              <button className="primary-btn small-btn">
                View Evidence
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD EVIDENCE MODAL */}
      {showUploadModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowUploadModal(false)}
        >
          <div
            className="obligation-modal add-evidence-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-modal"
              onClick={() => setShowUploadModal(false)}
            >
              ×
            </button>

            <span className="page-badge">
              UPLOAD EVIDENCE
            </span>

            <h2>Upload Evidence</h2>

            <p className="modal-description">
              Add supporting documentation for a compliance obligation.
            </p>

            <div className="add-form">
              <div className="form-group">
                <label>Evidence Title</label>

                <input
                  type="text"
                  placeholder="Enter evidence title"
                />
              </div>

              <div className="form-group">
                <label>Description</label>

                <textarea
                  rows="4"
                  placeholder="Describe the evidence"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Evidence Type</label>

                  <select defaultValue="Document">
                    <option>Document</option>
                    <option>Policy</option>
                    <option>Report</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Related Obligation</label>

                  <input
                    type="text"
                    placeholder="e.g. OB-001"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Select File</label>

                <input type="file" />
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="secondary-btn"
                onClick={() => setShowUploadModal(false)}
              >
                Cancel
              </button>

              <button
                className="primary-btn small-btn"
                onClick={() => setShowUploadModal(false)}
              >
                Upload Evidence
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Evidence;