import React, { useEffect, useState, useRef } from "react";
import { uploadDocument, analyzeDocument } from "../services/api";

const STEPS = [
  { id: 0, label: "Uploading document to server", detail: "Transferring PDF payload to secure storage" },
  { id: 1, label: "Parsing document structure", detail: "Extracting regulatory text and page metadata" },
  { id: 2, label: "AI analyzing compliance obligations", detail: "Extracting regulatory requirements and obligations" },
  { id: 3, label: "Evaluating deadlines & evidence", detail: "Structuring categories, priorities, and confidence scores" },
  { id: 4, label: "Analysis complete", detail: "Compliance records synchronized successfully" },
];

function Processing({ setActivePage, pendingFile, setPendingFile, currentDocument, setCurrentDocument }) {
  const [progress, setProgress] = useState(10);
  const [currentStep, setCurrentStep] = useState(0);
  const [statusText, setStatusText] = useState("Initializing compliance pipeline...");
  const [error, setError] = useState(null);
  const [extractedCount, setExtractedCount] = useState(0);

  // Prevent duplicate execution on fast re-renders
  const executionRef = useRef(false);

  useEffect(() => {
    if (executionRef.current) return;
    executionRef.current = true;

    async function runPipeline() {
      setError(null);

      try {
        let docToAnalyze = currentDocument;

        // Stage 1: Upload document if we have a pendingFile
        if (pendingFile) {
          setCurrentStep(0);
          setProgress(25);
          setStatusText(`Uploading ${pendingFile.name}...`);

          const uploadedDoc = await uploadDocument(pendingFile);
          docToAnalyze = uploadedDoc;
          setCurrentDocument(uploadedDoc);
          if (setPendingFile) {
            setPendingFile(null);
          }
        }

        if (!docToAnalyze || !docToAnalyze.id) {
          throw new Error("No document is selected for processing. Please upload a PDF first.");
        }

        // Stage 2 & 3: Trigger real AI Analysis endpoint
        setCurrentStep(1);
        setProgress(45);
        setStatusText("Extracting document text and page indices...");

        await new Promise((r) => setTimeout(r, 400));

        setCurrentStep(2);
        setProgress(70);
        setStatusText("Running AI compliance analysis...");

        const analysisResult = await analyzeDocument(docToAnalyze.id);

        setCurrentStep(3);
        setProgress(90);
        setStatusText("Structuring obligations, evidence, and deadlines...");

        const obligationsFound = analysisResult.obligations ? analysisResult.obligations.length : 0;
        setExtractedCount(obligationsFound);

        // Update current document metadata
        if (analysisResult.document) {
          setCurrentDocument(analysisResult.document);
        }

        await new Promise((r) => setTimeout(r, 400));

        // Stage 4: Completed
        setCurrentStep(4);
        setProgress(100);
        setStatusText(`Extracted ${obligationsFound} obligations successfully! Redirecting...`);

        setTimeout(() => {
          setActivePage("Obligations");
        }, 1000);

      } catch (err) {
        console.error("Processing pipeline failed:", err);
        setError(err.message || "An unexpected error occurred during document processing.");
        setStatusText("Analysis halted due to an error.");
      }
    }

    runPipeline();
  }, []);

  const handleRetry = () => {
    executionRef.current = false;
    setError(null);
    setProgress(10);
    setCurrentStep(0);
    setActivePage("Upload");
  };

  return (
    <main className="processing-page">
      <div className="processing-container">
        <div className="processing-header">
          <span className="ai-badge">✦ AI COMPLIANCE ENGINE</span>
          <h1>{error ? "Processing Issue Encountered" : "Analyzing Your Regulatory Document"}</h1>
          <p>
            {error
              ? "The compliance extraction pipeline could not complete the operation."
              : "Our automated intelligence engine is extracting obligations, responsible units, deadlines, and required evidence."
            }
          </p>
        </div>

        {error ? (
          <div style={{
            backgroundColor: "rgba(239, 68, 68, 0.1)",
            border: "1px solid rgba(239, 68, 68, 0.3)",
            borderRadius: "12px",
            padding: "24px",
            marginTop: "20px",
            textAlign: "left",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#f87171", marginBottom: "12px" }}>
              <span style={{ fontSize: "20px" }}>❌</span>
              <strong style={{ fontSize: "16px" }}>Analysis Failed</strong>
            </div>
            <p style={{ color: "#e2e8f0", fontSize: "14px", lineHeight: "1.6", marginBottom: "20px" }}>
              {error}
            </p>
            <div style={{ display: "flex", gap: "12px" }}>
              <button
                className="primary-btn"
                onClick={handleRetry}
                style={{ padding: "10px 20px" }}
              >
                Upload Another Document
              </button>
              <button
                className="secondary-btn"
                onClick={() => setActivePage("Dashboard")}
                style={{ padding: "10px 20px" }}
              >
                Go to Dashboard
              </button>
            </div>
          </div>
        ) : (
          <>
            <div className="progress-card">
              <div className="progress-top">
                <span>{statusText}</span>
                <strong>{progress}%</strong>
              </div>

              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{ width: `${progress}%`, transition: "width 0.4s ease-in-out" }}
                />
              </div>
            </div>

            <div className="processing-steps">
              {STEPS.map((step) => {
                const isCompleted = step.id < currentStep || (step.id === 4 && progress === 100);
                const isActive = step.id === currentStep && progress < 100;

                return (
                  <div
                    className={`processing-step ${
                      isCompleted ? "completed" : isActive ? "active" : ""
                    }`}
                    key={step.id}
                  >
                    <div className="step-icon">
                      {isCompleted ? "✓" : isActive ? "◌" : "·"}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span>{step.label}</span>
                      <small style={{ opacity: 0.7, fontSize: "12px" }}>{step.detail}</small>
                    </div>

                    {isCompleted && (
                      <small style={{ marginLeft: "auto", color: "var(--success-color, #10b981)" }}>
                        Completed
                      </small>
                    )}

                    {isActive && (
                      <small style={{ marginLeft: "auto", color: "var(--primary-color, #6366f1)" }}>
                        Processing...
                      </small>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </main>
  );
}

export default Processing;