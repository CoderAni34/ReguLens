import React, { useState } from "react";

function Documents() {
  const [selectedType, setSelectedType] = useState("All");
  const [selectedDocument, setSelectedDocument] = useState(null);
  const [showUploadModal, setShowUploadModal] = useState(false);

  const documents = [
    {
      id: "DOC-001",
      title: "Annual Compliance Policy",
      description:
        "Primary compliance policy outlining organizational requirements and responsibilities.",
      type: "Policy",
      uploadedOn: "20 Jan 2027",
      status: "Active",
      owner: "Compliance Team",
    },
    {
      id: "DOC-002",
      title: "Data Protection Guidelines",
      description:
        "Guidelines for handling, storing, and protecting sensitive information.",
      type: "Guideline",
      uploadedOn: "18 Jan 2027",
      status: "Active",
      owner: "Legal Team",
    },
    {
      id: "DOC-003",
      title: "Annual Audit Report",
      description:
        "Detailed report containing findings from the annual compliance audit.",
      type: "Report",
      uploadedOn: "15 Jan 2027",
      status: "Review",
      owner: "Internal Audit",
    },
    {
      id: "DOC-004",
      title: "Risk Assessment Framework",
      description:
        "Framework used to identify and evaluate organizational compliance risks.",
      type: "Framework",
      uploadedOn: "12 Jan 2027",
      status: "Active",
      owner: "Risk Team",
    },
  ];

  const filteredDocuments =
    selectedType === "All"
      ? documents
      : documents.filter(
          (document) => document.type === selectedType
        );

  const activeCount = documents.filter(
    (document) => document.status === "Active"
  ).length;

  const reviewCount = documents.filter(
    (document) => document.status === "Review"
  ).length;

  return (
    <main className="documents-page">
      {/* HEADER */}
      <div className="documents-header">
        <div className="documents-header-content">
          <span className="page-badge">
            ▣ DOCUMENT MANAGEMENT
          </span>

          <h1>Documents</h1>

          <p>
            Manage and organize compliance documents, policies, and reports.
          </p>
        </div>

        <button
          className="primary-btn"
          onClick={() => setShowUploadModal(true)}
        >
          + Upload
          <br />
          Document
        </button>
      </div>

      {/* STATISTICS */}
      <div className="documents-stats">
        <div className="documents-stat-card">
          <span>Total Documents</span>
          <strong>{documents.length}</strong>
        </div>

        <div className="documents-stat-card">
          <span>Active</span>
          <strong className="success-text">
            {activeCount}
          </strong>
        </div>

        <div className="documents-stat-card">
          <span>Needs Review</span>
          <strong className="warning-text">
            {reviewCount}
          </strong>
        </div>

        <div className="documents-stat-card">
          <span>Latest Upload</span>
          <strong className="info-text latest-date">
            20 Jan
          </strong>
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
            {[
              "All",
              "Policy",
              "Guideline",
              "Report",
              "Framework",
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

        <div className="documents-divider" />

        {/* DOCUMENT LIST */}
        <div className="documents-list">
          {filteredDocuments.map((document) => (
            <div
              className="document-card"
              key={document.id}
              onClick={() => setSelectedDocument(document)}
            >
              <div className="document-main">
                <span className="document-id">
                  {document.id}
                </span>

                <h3>{document.title}</h3>

                <p>{document.description}</p>
              </div>

              <div className="document-info">
                <div className="info-item">
                  <span>TYPE</span>
                  <strong>{document.type}</strong>
                </div>

                <div className="info-item">
                  <span>UPLOADED</span>
                  <strong>{document.uploadedOn}</strong>
                </div>

                <div className="info-item">
                  <span>STATUS</span>
                  <strong
                    className={`document-status ${document.status.toLowerCase()}`}
                  >
                    {document.status}
                  </strong>
                </div>
              </div>

              <span className="arrow">→</span>
            </div>
          ))}
        </div>
      </div>

      {/* DOCUMENT DETAILS MODAL */}
      {selectedDocument && (
        <div
          className="modal-overlay"
          onClick={() => setSelectedDocument(null)}
        >
          <div
            className="obligation-modal document-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-modal"
              onClick={() => setSelectedDocument(null)}
            >
              ×
            </button>

            <span className="document-id">
              {selectedDocument.id}
            </span>

            <h2>{selectedDocument.title}</h2>

            <p className="modal-description">
              {selectedDocument.description}
            </p>

            <div className="modal-grid">
              <div>
                <span>Document Type</span>
                <strong>{selectedDocument.type}</strong>
              </div>

              <div>
                <span>Status</span>
                <strong>{selectedDocument.status}</strong>
              </div>

              <div>
                <span>Uploaded On</span>
                <strong>{selectedDocument.uploadedOn}</strong>
              </div>

              <div>
                <span>Owner</span>
                <strong>{selectedDocument.owner}</strong>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="secondary-btn"
                onClick={() => setSelectedDocument(null)}
              >
                Close
              </button>

              <button className="primary-btn small-btn">
                View Document
              </button>
            </div>
          </div>
        </div>
      )}

      {/* UPLOAD DOCUMENT MODAL */}
      {showUploadModal && (
        <div
          className="modal-overlay"
          onClick={() => setShowUploadModal(false)}
        >
          <div
            className="obligation-modal upload-document-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="close-modal"
              onClick={() => setShowUploadModal(false)}
            >
              ×
            </button>

            <span className="page-badge">
              UPLOAD DOCUMENT
            </span>

            <h2>Upload Document</h2>

            <p className="modal-description">
              Add a new document to your compliance library.
            </p>

            <div className="add-form">
              <div className="form-group">
                <label>Document Title</label>

                <input
                  type="text"
                  placeholder="Enter document title"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Document Type</label>

                  <select defaultValue="Policy">
                    <option>Policy</option>
                    <option>Guideline</option>
                    <option>Report</option>
                    <option>Framework</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Owner</label>

                  <input
                    type="text"
                    placeholder="Enter document owner"
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Description</label>

                <textarea
                  rows="4"
                  placeholder="Describe the document"
                />
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
                Upload Document
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default Documents;