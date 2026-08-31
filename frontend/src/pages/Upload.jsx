import React, { useRef, useState } from "react";
import { FileText, X, UploadCloud } from "lucide-react";

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

    // Strict PDF extension check with full Unicode filename support
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      setErrorMessage("Only PDF files are supported by the regulatory intelligence engine.");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setErrorMessage("File size exceeds 20 MB limit.");
      return;
    }

    if (file.size === 0) {
      setErrorMessage("The selected file is empty (0 bytes). Please select a valid PDF.");
      return;
    }

    setSelectedFile(file);
  };

  const handleFileChange = (event) => {
    const file = event.target.files && event.target.files[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleBrowseClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleRemoveFile = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    setErrorMessage("");
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
          justifyContent: "space-between",
          gap: "8px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span>⚠️</span>
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage("")}
            style={{
              background: "transparent",
              border: "none",
              color: "#f87171",
              cursor: "pointer",
              fontSize: "16px",
              padding: "2px 6px",
            }}
            title="Dismiss"
          >
            ×
          </button>
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
              borderColor: isDragging ? "var(--primary-color, #e5a609)" : undefined,
              background: isDragging ? "rgba(229, 166, 9, 0.05)" : undefined,
            }}
          >
            {selectedFile ? (
              <div
                style={{
                  width: "100%",
                  maxWidth: "500px",
                  background: "#0b1016",
                  border: "1px solid #222d3d",
                  borderRadius: "10px",
                  padding: "18px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                  textAlign: "left",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px", minWidth: 0 }}>
                    <div style={{
                      width: "44px",
                      height: "44px",
                      borderRadius: "8px",
                      background: "rgba(229, 166, 9, 0.12)",
                      border: "1px solid rgba(229, 166, 9, 0.3)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#e5a609",
                      flexShrink: 0,
                    }}>
                      <FileText size={24} />
                    </div>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <h4 style={{
                        color: "#f1f5f9",
                        fontSize: "14px",
                        fontWeight: "600",
                        marginBottom: "4px",
                        wordBreak: "break-word",
                      }}>
                        {selectedFile.name}
                      </h4>
                      <p style={{ color: "#7e8997", fontSize: "12px", margin: 0 }}>
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Ready for ingestion
                      </p>
                    </div>
                  </div>

                  {/* Clearly visible Remove / Clear File button */}
                  <button
                    type="button"
                    onClick={handleRemoveFile}
                    title="Remove selected file"
                    aria-label="Remove selected file"
                    style={{
                      background: "rgba(239, 68, 68, 0.12)",
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      color: "#f87171",
                      width: "32px",
                      height: "32px",
                      borderRadius: "6px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = "rgba(239, 68, 68, 0.25)";
                      e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.6)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = "rgba(239, 68, 68, 0.12)";
                      e.currentTarget.style.borderColor = "rgba(239, 68, 68, 0.3)";
                    }}
                  >
                    <X size={18} />
                  </button>
                </div>

                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: "10px",
                  borderTop: "1px solid #1a2330",
                }}>
                  <span style={{ color: "#10b981", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>●</span> Validated PDF
                  </span>
                  <button
                    type="button"
                    className="browse-btn"
                    style={{ padding: "6px 14px", fontSize: "11px" }}
                    onClick={handleBrowseClick}
                  >
                    Choose Different File
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="upload-icon">
                  <UploadCloud size={44} style={{ color: "#8d98a7" }} />
                </div>
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
                  Supports Regulatory PDF Documents (English & Multilingual)
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
              <option>Hindi (हिंदी)</option>
              <option>Multilingual / Regional</option>
              <option>Spanish / Portuguese</option>
              <option>Japanese / Asian</option>
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