import React, { useState } from "react";

function Obligations() {
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedObligation, setSelectedObligation] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const [obligations, setObligations] = useState([
    {
      id: "OB-001",
      title: "Submit annual compliance report",
      description:
        "Submit the annual compliance report to the regulatory authority within the specified reporting period.",
      deadline: "15 Dec 2026",
      priority: "High",
      status: "Pending",
      department: "Compliance",
      evidence: "Annual report and submission receipt",
      confidence: 96,
    },
    {
      id: "OB-002",
      title: "Maintain required documentation",
      description:
        "Maintain all required records and supporting documents for regulatory review.",
      deadline: "30 Dec 2026",
      priority: "Medium",
      status: "In Progress",
      department: "Operations",
      evidence: "Policies, records and supporting documents",
      confidence: 92,
    },
    {
      id: "OB-003",
      title: "Update internal compliance policies",
      description:
        "Review and update internal policies according to the latest regulatory requirements.",
      deadline: "10 Jan 2027",
      priority: "High",
      status: "Pending",
      department: "Legal",
      evidence: "Updated policy documents",
      confidence: 89,
    },
    {
      id: "OB-004",
      title: "Conduct internal compliance review",
      description:
        "Perform an internal review to verify compliance with the updated requirements.",
      deadline: "20 Jan 2027",
      priority: "Low",
      status: "Completed",
      department: "Internal Audit",
      evidence: "Compliance review report",
      confidence: 94,
    },
  ]);

  const [newObligation, setNewObligation] = useState({
    title: "",
    description: "",
    deadline: "",
    priority: "Medium",
    department: "",
  });

  const filteredObligations =
    selectedStatus === "All"
      ? obligations
      : obligations.filter(
          (obligation) => obligation.status === selectedStatus
        );

  const highPriorityCount = obligations.filter(
    (obligation) => obligation.priority === "High"
  ).length;

  const pendingCount = obligations.filter(
    (obligation) => obligation.status === "Pending"
  ).length;

  const completedCount = obligations.filter(
    (obligation) => obligation.status === "Completed"
  ).length;

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setNewObligation({
      ...newObligation,
      [name]: value,
    });
  };

  const handleAddObligation = () => {
    if (
      !newObligation.title.trim() ||
      !newObligation.description.trim() ||
      !newObligation.deadline ||
      !newObligation.department.trim()
    ) {
      alert("Please fill in all fields.");
      return;
    }

    const newId = `OB-${String(obligations.length + 1).padStart(
      3,
      "0"
    )}`;

    const formattedDate = new Date(
      newObligation.deadline
    ).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const obligationToAdd = {
      id: newId,
      title: newObligation.title,
      description: newObligation.description,
      deadline: formattedDate,
      priority: newObligation.priority,
      status: "Pending",
      department: newObligation.department,
      evidence: "No evidence added yet",
      confidence: 100,
    };

    setObligations([
      ...obligations,
      obligationToAdd,
    ]);

    setNewObligation({
      title: "",
      description: "",
      deadline: "",
      priority: "Medium",
      department: "",
    });

    setShowAddModal(false);
  };

  return (
    <main className="obligations-page">

      {/* HEADER */}
      <div className="obligations-header">
        <div className="obligations-header-content">
          <span className="page-badge">
            ✦ AI EXTRACTED
          </span>

          <h1>Obligations</h1>

          <p>
            Review and manage compliance obligations extracted from your
            document.
          </p>
        </div>

        <button
          className="primary-btn"
          onClick={() => setShowAddModal(true)}
        >
          + Add
          <br />
          Obligation
        </button>
      </div>

      {/* STATISTICS */}
      <div className="obligation-stats">
        <div className="obligation-stat-card">
          <span>Total Obligations</span>
          <strong>{obligations.length}</strong>
        </div>

        <div className="obligation-stat-card">
          <span>High Priority</span>
          <strong className="danger-text">
            {highPriorityCount}
          </strong>
        </div>

        <div className="obligation-stat-card">
          <span>Pending</span>
          <strong className="warning-text">
            {pendingCount}
          </strong>
        </div>

        <div className="obligation-stat-card">
          <span>Completed</span>
          <strong className="success-text">
            {completedCount}
          </strong>
        </div>
      </div>

      {/* OBLIGATIONS SECTION */}
      <div className="obligations-section">
        <div className="obligations-toolbar">
          <div>
            <h2>Extracted Obligations</h2>

            <p>
              {filteredObligations.length} obligations found
            </p>
          </div>

          <div className="filter-buttons">
            {[
              "All",
              "Pending",
              "In Progress",
              "Completed",
            ].map((status) => (
              <button
                key={status}
                className={
                  selectedStatus === status
                    ? "filter-btn active"
                    : "filter-btn"
                }
                onClick={() => setSelectedStatus(status)}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        <div className="obligations-divider" />

        {/* OBLIGATION CARDS */}
        <div className="obligations-list">
          {filteredObligations.map((obligation) => (
            <div
              className="obligation-card"
              key={obligation.id}
              onClick={() =>
                setSelectedObligation(obligation)
              }
            >
              <div className="obligation-main">
                <span className="obligation-id">
                  {obligation.id}
                </span>

                <h3>{obligation.title}</h3>

                <p>{obligation.description}</p>
              </div>

              <div className="obligation-info">
                <div className="info-item">
                  <span>DEADLINE</span>
                  <strong>{obligation.deadline}</strong>
                </div>

                <div className="info-item">
                  <span>PRIORITY</span>

                  <strong
                    className={`priority ${obligation.priority.toLowerCase()}`}
                  >
                    {obligation.priority}
                  </strong>
                </div>

                <div className="info-item">
                  <span>STATUS</span>

                  <strong
                    className={`obligation-status ${obligation.status
                      .toLowerCase()
                      .replace(" ", "-")}`}
                  >
                    {obligation.status}
                  </strong>
                </div>
              </div>

              <span className="arrow">→</span>
            </div>
          ))}
        </div>
      </div>

      {/* DETAILS MODAL */}
      {selectedObligation && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedObligation(null)}
        >
          <div
            className="obligation-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-modal"
              onClick={() => setSelectedObligation(null)}
            >
              ×
            </button>

            <span className="obligation-id">
              {selectedObligation.id}
            </span>

            <h2>{selectedObligation.title}</h2>

            <p className="modal-description">
              {selectedObligation.description}
            </p>

            <div className="modal-grid">
              <div>
                <span>Deadline</span>
                <strong>{selectedObligation.deadline}</strong>
              </div>

              <div>
                <span>Responsible Unit</span>
                <strong>{selectedObligation.department}</strong>
              </div>

              <div>
                <span>Evidence Required</span>
                <strong>{selectedObligation.evidence}</strong>
              </div>

              <div>
                <span>AI Confidence</span>
                <strong className="confidence">
                  {selectedObligation.confidence}%
                </strong>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="secondary-btn"
                onClick={() => setSelectedObligation(null)}
              >
                Close
              </button>

              <button className="primary-btn small-btn">
                Edit Obligation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ADD OBLIGATION MODAL */}
      {showAddModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowAddModal(false)}
        >
          <div
            className="obligation-modal add-obligation-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-modal"
              onClick={() => setShowAddModal(false)}
            >
              ×
            </button>

            <span className="page-badge">
              NEW OBLIGATION
            </span>

            <h2>Add Obligation</h2>

            <p className="modal-description">
              Create a new compliance obligation manually.
            </p>

            <div className="add-form">

              <div className="form-group">
                <label>Obligation Title</label>

                <input
                  type="text"
                  name="title"
                  value={newObligation.title}
                  onChange={handleInputChange}
                  placeholder="Enter obligation title"
                />
              </div>

              <div className="form-group">
                <label>Description</label>

                <textarea
                  rows="4"
                  name="description"
                  value={newObligation.description}
                  onChange={handleInputChange}
                  placeholder="Describe the obligation"
                />
              </div>

              <div className="form-row">

                <div className="form-group">
                  <label>Deadline</label>

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

              <div className="form-group">
                <label>Responsible Unit</label>

                <input
                  type="text"
                  name="department"
                  value={newObligation.department}
                  onChange={handleInputChange}
                  placeholder="e.g. Compliance"
                />
              </div>

            </div>

            <div className="modal-actions">
              <button
                className="secondary-btn"
                onClick={() => setShowAddModal(false)}
              >
                Cancel
              </button>

              <button
                className="primary-btn small-btn"
                onClick={handleAddObligation}
              >
                Add Obligation
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}

export default Obligations;