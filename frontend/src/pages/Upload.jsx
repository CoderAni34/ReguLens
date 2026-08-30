import React, { useRef, useState } from "react";

function Upload({ setActivePage, setPendingFile }) {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [language, setLanguage] = useState("Auto Detect");
  const [documentType, setDocumentType] = useState("Circular");
  const [errorMessage, setErrorMessage] = useState("");
  const [isDragging, setIsDragging] = useState(false);

  const validateAndSetFile = (file) => {
    setErrorMessage("");
    if (!file) return;

    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Only PDF files are supported by the regulatory intelligence engine.");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setErrorMessage("File size exceeds 20 MB limit.");
      return;
    }

    setSelectedFile(file);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    validateAndSetFile(file);
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleAnalyze = () => {
    if (!selectedFile) {
      setErrorMessage("Please select a valid regulatory PDF document to begin extraction.");
      return;
    }

    if (setPendingFile) {
      setPendingFile(selectedFile);
    }
    setActivePage("Processing");
  };

  return (
    <main className="upload-page">
      <div className="upload-header">
        <h1>Upload Regulatory Document</h1>
        <p>
          Upload a compliance circular, regulation, or policy PDF to extract actionable obligations and compliance requirements.
        </p>
      </div>

      {errorMessage && (
        <div style={{
          backgroundColor: "rgba(239, 68, 68, 0.15)",
          border: "1px solid rgba(239, 68, 68, 0.4)",
          color: "#f87171",
          padding: "12px 16px",
          borderRadius: "8px",
          marginBottom: "20px",
          fontSize: "14px",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}>
          <span>⚠️</span>
          <span>{errorMessage}</span>
        </div>
      )}

      <div className="upload-layout">
        <section className="upload-panel">
          <div
            className={`drop-zone ${isDragging ? "dragging" : ""}`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            style={{
              borderColor: isDragging ? "var(--primary-color, #6366f1)" : undefined,
              background: isDragging ? "rgba(99, 102, 241, 0.05)" : undefined,
            }}
          >
            <div className="upload-icon">⇧</div>

            {selectedFile ? (
              <>
                <h3 style={{ wordBreak: "break-word" }}>{selectedFile.name}</h3>
                <p>
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready for ingestion
                </p>
                <button
                  className="browse-btn"
                  style={{ marginTop: "12px" }}
                  onClick={handleBrowseClick}
                >
                  Choose Different File
                </button>
              </>
            ) : (
              <>
                <h3>Drag & Drop your PDF here</h3>
                <p>or</p>

                <button
                  type="button"
                  className="browse-btn"
                  onClick={handleBrowseClick}
                >
                  Browse File
                </button>

                <p className="file-support">
                  Supports Regulatory PDF Documents
                  <br />
                  Max file size: 20 MB
                </p>
              </>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf,.pdf"
              onChange={handleFileChange}
              hidden
            />
          </div>

          <button
            className="analyze-btn"
            onClick={handleAnalyze}
            disabled={!selectedFile}
            style={{
              opacity: selectedFile ? 1 : 0.6,
              cursor: selectedFile ? "pointer" : "not-allowed",
            }}
          >
            Analyze Document
          </button>
        </section>

        <aside className="upload-options">
          <div className="form-group">
            <label>Document Language</label>

            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
            >
              <option>Auto Detect</option>
              <option>English</option>
              <option>Hindi</option>
            </select>
          </div>

          <div className="form-group">
            <label>Document Type</label>

            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value)}
            >
              <option>Circular</option>
              <option>Regulation</option>
              <option>Policy</option>
              <option>Guideline</option>
              <option>Notification</option>
            </select>
          </div>

          <div className="processing-options">
            <h3>Processing Options</h3>

            <label>
              <input type="checkbox" defaultChecked readOnly />
              Extract obligations
            </label>

            <label>
              <input type="checkbox" defaultChecked readOnly />
              Detect deadlines
            </label>

            <label>
              <input type="checkbox" defaultChecked readOnly />
              Detect evidence requirements
            </label>

            <label>
              <input type="checkbox" defaultChecked readOnly />
              Categorize & calculate priority
            </label>
          </div>
        </aside>
      </div>
    </main>
  );
}

export default Upload;