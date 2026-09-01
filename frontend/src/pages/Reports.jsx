import React, { useState, useEffect, useMemo } from "react";
import { getReports, generateReport } from "../services/api";

function Reports() {
  const [selectedType, setSelectedType] = useState("All");
  const [selectedReport, setSelectedReport] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [generating, setGenerating] = useState(false);

  const [newReportForm, setNewReportForm] = useState({
    title: "",
    report_type: "Compliance",
    period: "Monthly",
    description: "",
  });

  const fetchReportsData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getReports();
      setReports(data || []);
    } catch (err) {
      console.error("Failed to load reports:", err);
      setError(err.message || "Failed to load compliance reports from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, []);

  const formatReportDate = (dateStr) => {
    if (!dateStr) return "Recent";
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

  const filteredReports = useMemo(() => {
    if (selectedType === "All") {
      return reports;
    }
    return reports.filter(
      (r) => (r.report_type || "Compliance").toLowerCase() === selectedType.toLowerCase()
    );
  }, [reports, selectedType]);

  const readyCount = useMemo(
    () => reports.filter((r) => (r.status || "").toLowerCase() === "ready").length,
    [reports]
  );

  const reviewCount = useMemo(
    () => reports.filter((r) => (r.status || "").toLowerCase() === "review").length,
    [reports]
  );

  const latestDateDisplay = useMemo(() => {
    if (reports.length === 0) return "--";
    return formatReportDate(reports[0].generated_at);
  }, [reports]);

  const handleGenerateReport = async () => {
    setGenerating(true);
    try {
      const payload = {
        title: newReportForm.title.trim() || undefined,
        report_type: newReportForm.report_type,
        period: newReportForm.period,
        description: newReportForm.description.trim() || undefined,
      };

      const created = await generateReport(payload);
      setReports((prev) => [created, ...prev]);

      setNewReportForm({
        title: "",
        report_type: "Compliance",
        period: "Monthly",
        description: "",
      });

      setShowCreateModal(false);
    } catch (err) {
      alert(`Report generation failed: ${err.message}`);
    } finally {
      setGenerating(false);
    }
  };

  // Helper to safely parse metrics JSON if available
  const parseMetrics = (metricsJsonStr) => {
    if (!metricsJsonStr) return null;
    try {
      return JSON.parse(metricsJsonStr);
    } catch {
      return null;
    }
  };

  return (
    <main className="reports-page">
      {/* HEADER */}
      <div className="reports-header">
        <div className="reports-header-content">
          <span className="page-badge">▥ REPORTING & ANALYTICS</span>
          <h1>Reports</h1>
          <p>
            Generate and review compliance reports, summaries, and analysis snapshots.
          </p>
        </div>

        <button
          className="primary-btn"
          onClick={() => setShowCreateModal(true)}
        >
          + Create Report
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
            onClick={fetchReportsData}
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
      <div className="reports-stats">
        <div className="reports-stat-card">
          <span>Total Reports</span>
          <strong>{reports.length}</strong>
        </div>

        <div className="reports-stat-card">
          <span>Ready</span>
          <strong className="success-text">{readyCount}</strong>
        </div>

        <div className="reports-stat-card">
          <span>Needs Review</span>
          <strong className="warning-text">{reviewCount}</strong>
        </div>

        <div className="reports-stat-card">
          <span>Latest Report</span>
          <strong className="info-text latest-date">{latestDateDisplay}</strong>
        </div>
      </div>

      {/* REPORTS SECTION */}
      <div className="reports-section">
        <div className="reports-toolbar">
          <div>
            <h2>Generated Reports</h2>
            <p>{filteredReports.length} reports available</p>
          </div>

          <div className="filter-buttons">
            {["All", "Compliance", "Obligations", "Conflicts", "Evidence"].map((type) => (
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

        <div className="reports-divider" />

        {/* LOADING STATE */}
        {loading && (
          <div style={{ padding: "40px 20px", textAlign: "center", color: "#94a3b8" }}>
            <div style={{ fontSize: "24px", marginBottom: "8px" }}>⏳</div>
            <p>Loading compliance reports from database...</p>
          </div>
        )}

        {/* EMPTY STATE */}
        {!loading && filteredReports.length === 0 && (
          <div className="empty-state">
            <div className="empty-state-icon">📊</div>
            <h3>No reports generated yet.</h3>
            <p style={{ fontSize: "14px", maxWidth: "480px", margin: "0 auto 20px" }}>
              Click "+ Create Report" to dynamically snapshot your live compliance database metrics into an executive report.
            </p>
          </div>
        )}

        {/* REPORT LIST */}
        {!loading && filteredReports.length > 0 && (
          <div className="reports-list">
            {filteredReports.map((report) => {
              const displayId = `RP-${String(report.id).padStart(3, "0")}`;
              const statusStr = report.status || "Ready";
              const statusClass = statusStr.toLowerCase();

              return (
                <div
                  className="report-card"
                  key={report.id}
                  onClick={() => setSelectedReport(report)}
                >
                  <div className="report-main">
                    <span className="report-id">{displayId}</span>
                    <h3>{report.title}</h3>
                    <p>{report.description}</p>
                  </div>

                  <div className="report-info">
                    <div className="info-item">
                      <span>TYPE</span>
                      <strong>{report.report_type || "Compliance"}</strong>
                    </div>

                    <div className="info-item">
                      <span>GENERATED</span>
                      <strong>{formatReportDate(report.generated_at)}</strong>
                    </div>

                    <div className="info-item">
                      <span>STATUS</span>
                      <strong className={`report-status ${statusClass}`}>
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

      {/* REPORT DETAILS MODAL */}
      {selectedReport && (
        <div className="modal-overlay" onClick={() => setSelectedReport(null)}>
          <div className="obligation-modal report-modal" style={{ maxWidth: "650px" }} onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setSelectedReport(null)}>
              ×
            </button>

            <span className="report-id">
              {`RP-${String(selectedReport.id).padStart(3, "0")}`}
            </span>

            <h2>{selectedReport.title}</h2>

            <p className="modal-description">{selectedReport.description}</p>

            <div className="modal-grid">
              <div>
                <span>Report Type</span>
                <strong>{selectedReport.report_type || "Compliance"}</strong>
              </div>

              <div>
                <span>Reporting Period</span>
                <strong>{selectedReport.period || "Monthly"}</strong>
              </div>

              <div>
                <span>Generated On</span>
                <strong>{formatReportDate(selectedReport.generated_at)}</strong>
              </div>

              <div>
                <span>Created By</span>
                <strong>{selectedReport.created_by || "Compliance Officer"}</strong>
              </div>
            </div>

            {/* EXECUTIVE SUMMARY BOX */}
            {selectedReport.executive_summary && (
              <div style={{
                marginTop: "16px",
                padding: "14px 16px",
                background: "rgba(99, 102, 241, 0.08)",
                borderLeft: "3px solid var(--primary-color, #6366f1)",
                borderRadius: "6px",
              }}>
                <span style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--primary-color, #6366f1)", fontWeight: 700, display: "block", marginBottom: "6px" }}>
                  ✦ AI Executive Summary (Factual Synthesis):
                </span>
                <p style={{ fontSize: "13px", color: "#e2e8f0", lineHeight: 1.6, margin: 0 }}>
                  {selectedReport.executive_summary}
                </p>
              </div>
            )}

            {/* FACTUAL METRICS SNAPSHOT BREAKDOWN */}
            {selectedReport.metrics_json && (() => {
              const metrics = parseMetrics(selectedReport.metrics_json);
              if (!metrics) return null;
              return (
                <div style={{
                  marginTop: "16px",
                  background: "rgba(0, 0, 0, 0.25)",
                  padding: "12px 16px",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}>
                  <span style={{ textTransform: "uppercase", color: "#94a3b8", fontWeight: 600, display: "block", marginBottom: "8px" }}>
                    Factual Metrics Snapshot:
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px", color: "#cbd5e1" }}>
                    <div>📄 Docs: <strong>{metrics.documents?.total_ingested || 0}</strong></div>
                    <div>📋 Obligations: <strong>{metrics.obligations?.total_extracted || 0}</strong></div>
                    <div>☑️ Tasks Completed: <strong>{metrics.tasks?.completed || 0} / {metrics.tasks?.total || 0}</strong></div>
                    <div>⚠️ High Conflicts: <strong style={{ color: "#ef4444" }}>{metrics.conflicts?.high_severity || 0}</strong></div>
                    <div>▱ Evidence Verified: <strong>{metrics.evidence?.verified || 0} / {metrics.evidence?.total || 0}</strong></div>
                    <div>⏳ Pending Action: <strong>{metrics.obligations?.pending_action || 0}</strong></div>
                  </div>
                </div>
              );
            })()}

            <div className="modal-actions" style={{ marginTop: "24px" }}>
              <button className="secondary-btn" onClick={() => setSelectedReport(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CREATE REPORT MODAL */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="obligation-modal create-report-modal" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setShowCreateModal(false)}>
              ×
            </button>

            <span className="page-badge">CREATE REPORT</span>

            <h2>Create Report</h2>

            <p className="modal-description">
              Generate an executive compliance report snapshot from live database metrics.
            </p>

            <div className="add-form">
              <div className="form-group">
                <label>Report Title</label>
                <input
                  type="text"
                  placeholder="e.g. Q1 Compliance Risk & Obligations Summary"
                  value={newReportForm.title}
                  onChange={(e) => setNewReportForm({ ...newReportForm, title: e.target.value })}
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Report Type</label>
                  <select
                    value={newReportForm.report_type}
                    onChange={(e) => setNewReportForm({ ...newReportForm, report_type: e.target.value })}
                  >
                    <option>Compliance</option>
                    <option>Obligations</option>
                    <option>Conflicts</option>
                    <option>Evidence</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Reporting Period</label>
                  <select
                    value={newReportForm.period}
                    onChange={(e) => setNewReportForm({ ...newReportForm, period: e.target.value })}
                  >
                    <option>Monthly</option>
                    <option>Quarterly</option>
                    <option>Annual</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  rows="3"
                  placeholder="Optional scope or notes for this report snapshot"
                  value={newReportForm.description}
                  onChange={(e) => setNewReportForm({ ...newReportForm, description: e.target.value })}
                />
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="secondary-btn"
                onClick={() => setShowCreateModal(false)}
                disabled={generating}
              >
                Cancel
              </button>

              <button
                className="primary-btn small-btn"
                onClick={handleGenerateReport}
                disabled={generating}
                style={{ opacity: generating ? 0.7 : 1 }}
              >
                {generating ? "Generating..." : "Generate Report"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Reports;