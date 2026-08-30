import React, { useState } from "react";

function Reports() {
  const [selectedType, setSelectedType] = useState("All");
  const [selectedReport, setSelectedReport] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const reports = [
    {
      id: "RP-001",
      title: "Annual Compliance Summary",
      description:
        "A complete summary of compliance obligations, statuses, and evidence for the annual reporting period.",
      type: "Compliance",
      generatedOn: "20 Jan 2027",
      period: "Annual",
      status: "Ready",
      createdBy: "Compliance Team",
    },
    {
      id: "RP-002",
      title: "Obligation Status Report",
      description:
        "Overview of all obligations and their current completion status.",
      type: "Obligations",
      generatedOn: "18 Jan 2027",
      period: "Monthly",
      status: "Ready",
      createdBy: "Compliance Team",
    },
    {
      id: "RP-003",
      title: "Conflict Analysis Report",
      description:
        "Detailed analysis of detected conflicts and inconsistencies across compliance requirements.",
      type: "Conflicts",
      generatedOn: "17 Jan 2027",
      period: "Monthly",
      status: "Review",
      createdBy: "Legal Team",
    },
    {
      id: "RP-004",
      title: "Evidence Verification Report",
      description:
        "Summary of submitted evidence, verification status, and pending reviews.",
      type: "Evidence",
      generatedOn: "15 Jan 2027",
      period: "Monthly",
      status: "Ready",
      createdBy: "Internal Audit",
    },
  ];

  const filteredReports =
    selectedType === "All"
      ? reports
      : reports.filter((report) => report.type === selectedType);

  const readyCount = reports.filter(
    (report) => report.status === "Ready"
  ).length;

  const reviewCount = reports.filter(
    (report) => report.status === "Review"
  ).length;

  return (
    <main className="reports-page">
      {/* HEADER */}
      <div className="reports-header">
        <div className="reports-header-content">
          <span className="page-badge">
            ▥ REPORTING & ANALYTICS
          </span>

          <h1>Reports</h1>

          <p>
            Generate and review compliance reports, summaries, and analysis.
          </p>
        </div>

        <button
          className="primary-btn"
          onClick={() => setShowCreateModal(true)}
        >
          + Create
          <br />
          Report
        </button>
      </div>

      {/* STATISTICS */}
      <div className="reports-stats">
        <div className="reports-stat-card">
          <span>Total Reports</span>
          <strong>{reports.length}</strong>
        </div>

        <div className="reports-stat-card">
          <span>Ready</span>
          <strong className="success-text">
            {readyCount}
          </strong>
        </div>

        <div className="reports-stat-card">
          <span>Needs Review</span>
          <strong className="warning-text">
            {reviewCount}
          </strong>
        </div>

        <div className="reports-stat-card">
          <span>Latest Report</span>
          <strong className="info-text latest-date">
            20 Jan
          </strong>
        </div>
      </div>

      {/* REPORTS SECTION */}
      <div className="reports-section">
        <div className="reports-toolbar">
          <div>
            <h2>Generated Reports</h2>

            <p>
              {filteredReports.length} reports available
            </p>
          </div>

          <div className="filter-buttons">
            {[
              "All",
              "Compliance",
              "Obligations",
              "Conflicts",
              "Evidence",
            ].map((type) => (
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

        <div className="reports-divider" />

        {/* REPORT LIST */}
        <div className="reports-list">
          {filteredReports.map((report) => (
            <div
              className="report-card"
              key={report.id}
              onClick={() => setSelectedReport(report)}
            >
              <div className="report-main">
                <span className="report-id">
                  {report.id}
                </span>

                <h3>{report.title}</h3>

                <p>{report.description}</p>
              </div>

              <div className="report-info">
                <div className="info-item">
                  <span>TYPE</span>
                  <strong>{report.type}</strong>
                </div>

                <div className="info-item">
                  <span>GENERATED</span>
                  <strong>{report.generatedOn}</strong>
                </div>

                <div className="info-item">
                  <span>STATUS</span>

                  <strong
                    className={`report-status ${report.status.toLowerCase()}`}
                  >
                    {report.status}
                  </strong>
                </div>
              </div>

              <span className="arrow">→</span>
            </div>
          ))}
        </div>
      </div>

      {/* REPORT DETAILS MODAL */}
      {selectedReport && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedReport(null)}
        >
          <div
            className="obligation-modal report-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-modal"
              onClick={() => setSelectedReport(null)}
            >
              ×
            </button>

            <span className="report-id">
              {selectedReport.id}
            </span>

            <h2>{selectedReport.title}</h2>

            <p className="modal-description">
              {selectedReport.description}
            </p>

            <div className="modal-grid">
              <div>
                <span>Report Type</span>
                <strong>{selectedReport.type}</strong>
              </div>

              <div>
                <span>Reporting Period</span>
                <strong>{selectedReport.period}</strong>
              </div>

              <div>
                <span>Generated On</span>
                <strong>{selectedReport.generatedOn}</strong>
              </div>

              <div>
                <span>Created By</span>
                <strong>{selectedReport.createdBy}</strong>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="secondary-btn"
                onClick={() => setSelectedReport(null)}
              >
                Close
              </button>

              <button className="primary-btn small-btn">
                View Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE REPORT MODAL */}
      {showCreateModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="obligation-modal create-report-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-modal"
              onClick={() => setShowCreateModal(false)}
            >
              ×
            </button>

            <span className="page-badge">
              CREATE REPORT
            </span>

            <h2>Create Report</h2>

            <p className="modal-description">
              Generate a new report from your compliance data.
            </p>

            <div className="add-form">
              <div className="form-group">
                <label>Report Title</label>

                <input
                  type="text"
                  placeholder="Enter report title"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Report Type</label>

                  <select defaultValue="Compliance">
                    <option>Compliance</option>
                    <option>Obligations</option>
                    <option>Conflicts</option>
                    <option>Evidence</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Reporting Period</label>

                  <select defaultValue="Monthly">
                    <option>Monthly</option>
                    <option>Quarterly</option>
                    <option>Annual</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>

                <textarea
                  rows="4"
                  placeholder="Describe the report"
                />
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="secondary-btn"
                onClick={() => setShowCreateModal(false)}
              >
                Cancel
              </button>

              <button
                className="primary-btn small-btn"
                onClick={() => setShowCreateModal(false)}
              >
                Create Report
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Reports;