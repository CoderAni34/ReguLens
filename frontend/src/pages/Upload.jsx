import React, { useRef, useState } from "react";

function Upload({ setActivePage }) {
  const fileInputRef = useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [language, setLanguage] = useState("Auto Detect");
  const [documentType, setDocumentType] = useState("Circular");

  const handleFileChange = (event) => {
    const file = event.target.files[0];

    if (file) {
      setSelectedFile(file);
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current.click();
  };

const handleAnalyze = () => {
  if (!selectedFile) {
    alert("Please select a document first.");
    return;
  }

  setActivePage("Processing");
};

  return (
    <main className="upload-page">
      <div className="upload-header">
        <h1>Upload Regulatory Document</h1>
        <p>
          Upload a document to extract obligations and compliance requirements.
        </p>
      </div>

      <div className="upload-layout">
        <section className="upload-panel">
          <div className="drop-zone">
            <div className="upload-icon">⇧</div>

            {selectedFile ? (
              <>
                <h3>{selectedFile.name}</h3>
                <p>
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </>
            ) : (
              <>
                <h3>Drag & Drop your PDF here</h3>
                <p>or</p>

                <button
                  className="browse-btn"
                  onClick={handleBrowseClick}
                >
                  Browse File
                </button>

                <p className="file-support">
                  Supports PDF, DOCX, TXT
                  <br />
                  Max file size: 20 MB
                </p>
              </>
            )}

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileChange}
              hidden
            />
          </div>

          <button
            className="analyze-btn"
            onClick={handleAnalyze}
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
              <input type="checkbox" defaultChecked />
              Extract obligations
            </label>

            <label>
              <input type="checkbox" defaultChecked />
              Detect deadlines
            </label>

            <label>
              <input type="checkbox" defaultChecked />
              Detect evidence requirements
            </label>

            <label>
              <input type="checkbox" defaultChecked />
              Compare with previous versions
            </label>
          </div>
        </aside>
      </div>
    </main>
  );
}

export default Upload;