import React, { useState } from "react";

function Conflicts() {
  const [selectedSeverity, setSelectedSeverity] = useState("All");
  const [selectedConflict, setSelectedConflict] = useState(null);
  const [resolvedConflicts, setResolvedConflicts] = useState([]);

  const conflicts = [
    {
      id: "CF-001",
      title: "Conflicting reporting deadlines",
      description:
        "Two related compliance requirements specify different deadlines for submission of the annual compliance report.",
      severity: "High",
      type: "Deadline Conflict",
      sourceA: "OB-001",
      sourceB: "OB-003",
      recommendation:
        "Review the source regulations and confirm which reporting deadline takes precedence.",
    },
    {
      id: "CF-002",
      title: "Potential duplicate documentation requirement",
      description:
        "Two obligations appear to require similar documentation and may represent duplicate requirements.",
      severity: "Medium",
      type: "Duplicate Requirement",
      sourceA: "OB-002",
      sourceB: "OB-004",
      recommendation:
        "Compare both obligations and merge the requirements if they refer to the same documentation.",
    },
    {
      id: "CF-003",
      title: "Missing responsible department",
      description:
        "A compliance obligation does not have a clearly defined responsible department or owner.",
      severity: "Low",
      type: "Missing Information",
      sourceA: "OB-003",
      sourceB: "System Analysis",
      recommendation:
        "Assign a responsible department to ensure the obligation has a clear owner.",
    },
    {
      id: "CF-004",
      title: "Contradictory policy requirements",
      description:
        "Two policy statements appear to provide conflicting instructions for the same compliance process.",
      severity: "High",
      type: "Requirement Conflict",
      sourceA: "Policy Document A",
      sourceB: "Policy Document B",
      recommendation:
        "Escalate the conflict to the legal or compliance team for review.",
    },
  ];

  const activeConflicts = conflicts.filter(
    (conflict) => !resolvedConflicts.includes(conflict.id)
  );

  const filteredConflicts =
    selectedSeverity === "All"
      ? activeConflicts
      : activeConflicts.filter(
          (conflict) => conflict.severity === selectedSeverity
        );

  const highCount = activeConflicts.filter(
    (conflict) => conflict.severity === "High"
  ).length;

  const mediumCount = activeConflicts.filter(
    (conflict) => conflict.severity === "Medium"
  ).length;

  const lowCount = activeConflicts.filter(
    (conflict) => conflict.severity === "Low"
  ).length;

  const resolveConflict = () => {
    if (!selectedConflict) return;

    setResolvedConflicts([
      ...resolvedConflicts,
      selectedConflict.id,
    ]);

    setSelectedConflict(null);
  };

  return (
    <main className="obligations-page">
      {/* HEADER */}
      <div className="obligations-header">
        <div className="obligations-header-content">
          <span className="page-badge">
            ⚠ CONFLICT DETECTION
          </span>

          <h1>Conflicts</h1>

          <p>
            Review potential conflicts, inconsistencies, and overlapping
            requirements detected across your compliance documents.
          </p>
        </div>
      </div>

      {/* STATISTICS */}
      <div className="obligation-stats">
        <div className="obligation-stat-card">
          <span>Active Conflicts</span>
          <strong>{activeConflicts.length}</strong>
        </div>

        <div className="obligation-stat-card">
          <span>High Severity</span>
          <strong className="danger-text">
            {highCount}
          </strong>
        </div>

        <div className="obligation-stat-card">
          <span>Medium Severity</span>
          <strong className="warning-text">
            {mediumCount}
          </strong>
        </div>

        <div className="obligation-stat-card">
          <span>Low Severity</span>
          <strong className="success-text">
            {lowCount}
          </strong>
        </div>
      </div>

      {/* CONFLICTS SECTION */}
      <div className="obligations-section">
        <div className="obligations-toolbar">
          <div>
            <h2>Detected Conflicts</h2>

            <p>
              {filteredConflicts.length} active conflicts found
            </p>
          </div>

          <div className="filter-buttons">
            {[
              "All",
              "High",
              "Medium",
              "Low",
            ].map((severity) => (
              <button
                key={severity}
                className={
                  selectedSeverity === severity
                    ? "filter-btn active"
                    : "filter-btn"
                }
                onClick={() =>
                  setSelectedSeverity(severity)
                }
              >
                {severity}
              </button>
            ))}
          </div>
        </div>

        <div className="obligations-divider" />

        {/* CONFLICT LIST */}
        <div className="obligations-list">
          {filteredConflicts.length === 0 ? (
            <div className="empty-state">
              <h3>No conflicts found</h3>

              <p>
                There are no active conflicts in this category.
              </p>
            </div>
          ) : (
            filteredConflicts.map((conflict) => (
              <div
                className="obligation-card"
                key={conflict.id}
                onClick={() =>
                  setSelectedConflict(conflict)
                }
              >
                <div className="obligation-main">
                  <span className="obligation-id">
                    {conflict.id}
                  </span>

                  <h3>
                    {conflict.title}
                  </h3>

                  <p>
                    {conflict.description}
                  </p>
                </div>

                <div className="obligation-info">
                  <div className="info-item">
                    <span>TYPE</span>

                    <strong>
                      {conflict.type}
                    </strong>
                  </div>

                  <div className="info-item">
                    <span>SEVERITY</span>

                    <strong
                      className={`priority ${conflict.severity.toLowerCase()}`}
                    >
                      {conflict.severity}
                    </strong>
                  </div>

                  <div className="info-item">
                    <span>STATUS</span>

                    <strong className="obligation-status pending">
                      Unresolved
                    </strong>
                  </div>
                </div>

                <span className="arrow">
                  →
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CONFLICT DETAILS MODAL */}
      {selectedConflict && (
        <div
          className="modal-overlay"
          onClick={() =>
            setSelectedConflict(null)
          }
        >
          <div
            className="obligation-modal"
            onClick={(e) =>
              e.stopPropagation()
            }
          >
            <button
              className="close-modal"
              onClick={() =>
                setSelectedConflict(null)
              }
            >
              ×
            </button>

            <span className="obligation-id">
              {selectedConflict.id}
            </span>

            <h2>
              {selectedConflict.title}
            </h2>

            <p className="modal-description">
              {selectedConflict.description}
            </p>

            <div className="modal-grid">
              <div>
                <span>Conflict Type</span>

                <strong>
                  {selectedConflict.type}
                </strong>
              </div>

              <div>
                <span>Severity</span>

                <strong
                  className={`priority ${selectedConflict.severity.toLowerCase()}`}
                >
                  {selectedConflict.severity}
                </strong>
              </div>

              <div>
                <span>Source A</span>

                <strong>
                  {selectedConflict.sourceA}
                </strong>
              </div>

              <div>
                <span>Source B</span>

                <strong>
                  {selectedConflict.sourceB}
                </strong>
              </div>
            </div>

            <div className="conflict-recommendation">
              <span>
                RECOMMENDED ACTION
              </span>

              <p>
                {selectedConflict.recommendation}
              </p>
            </div>

            <div className="modal-actions">
              <button
                className="secondary-btn"
                onClick={() =>
                  setSelectedConflict(null)
                }
              >
                Close
              </button>

              <button
                className="primary-btn small-btn"
                onClick={resolveConflict}
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