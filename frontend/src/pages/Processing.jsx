import React, { useEffect, useState, useRef } from "react";
import { uploadDocument, analyzeDocument } from "../services/api";

const STAGES = [
  {
    id: 1,
    title: "PDF Validated",
    detail: "Multi-layer format, size, and PDF integrity verified",
  },
  {
    id: 2,
    title: "Text Extracted",
    detail: "PyMuPDF extracted multilingual content and page boundaries",
  },
  {
    id: 3,
    title: "Analyzing Regulatory Requirements",
    detail: "AI compliance engine performing deep regulatory analysis",
  },
  {
    id: 4,
    title: "Structuring Compliance Obligations",
    detail: "Validating deadlines, responsible units, penalties, and evidence schemas",
  },
  {
    id: 5,
    title: "Analysis Complete",
    detail: "Compliance obligations persisted and synchronized with workspace",
  },
];

function Processing({
  setActivePage,
  pendingFile,
  setPendingFile,
  currentDocument,
  setCurrentDocument,
}) {
  const [currentStageId, setCurrentStageId] = useState(1);
  const [statusMessage, setStatusMessage] = useState("Initializing compliance pipeline...");
  const [error, setError] = useState(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [extractedCount, setExtractedCount] = useState(0);

  const executionRef = useRef(false);

  // Live elapsed timer so user always sees continuous activity
  useEffect(() => {
    if (error || currentStageId === 5) return;
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [error, currentStageId]);

  const formatElapsed = (totalSecs) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  useEffect(() => {
    if (executionRef.current) return;
    executionRef.current = true;

    async function runPipeline() {
      setError(null);
      setElapsedSeconds(0);

      try {
        let docToAnalyze = currentDocument;

        // Stage 1: Upload and validate PDF
        if (pendingFile) {
          setCurrentStageId(1);
          setStatusMessage(`Uploading and validating ${pendingFile.name}...`);

          const uploadedDoc = await uploadDocument(pendingFile);
          docToAnalyze = uploadedDoc;
          setCurrentDocument(uploadedDoc);
          if (setPendingFile) {
            setPendingFile(null);
          }
        }

        if (!docToAnalyze || !docToAnalyze.id) {
          throw new Error("No document is selected for analysis. Please upload a regulatory PDF first.");
        }

        // Stage 2: Text extraction confirmed
        setCurrentStageId(2);
        setStatusMessage("Extracting text and indexing regulatory sections with PyMuPDF...");
        await new Promise((r) => setTimeout(r, 400));

        // Stage 3: Deep AI Reasoning with Primary Provider
        setCurrentStageId(3);
        setStatusMessage("AI analyzing regulatory requirements with Google Gemini...");

        // Trigger real server-side analysis
        const analysisResult = await analyzeDocument(docToAnalyze.id);

        // Stage 4: Structure & Schema Validation
        setCurrentStageId(4);
        setStatusMessage("Structuring obligations, validating Pydantic schemas, and persisting to database...");

        const obligationsFound = analysisResult.obligations ? analysisResult.obligations.length : 0;
        setExtractedCount(obligationsFound);

        if (analysisResult.document) {
          setCurrentDocument(analysisResult.document);
        }

        await new Promise((r) => setTimeout(r, 400));

        // Stage 5: Complete
        setCurrentStageId(5);
        setStatusMessage(`Successfully extracted and persisted ${obligationsFound} obligations!`);

        setTimeout(() => {
          setActivePage("Obligations");
        }, 1200);

      } catch (err) {
        console.error("Processing pipeline failed:", err);
        setError(err.message || "An unexpected error occurred during document processing.");
        setStatusMessage("Analysis halted due to an error.");
      }
    }

    runPipeline();
  }, []);

  const handleRetry = () => {
    executionRef.current = false;
    setError(null);
    setCurrentStageId(1);
    setActivePage("Upload");
  };

  return (
    <main className="processing-page">
      <div className="processing-container">
        <div className="processing-header">
          <span className="ai-badge">✦ REGULENS AI COMPLIANCE ENGINE</span>
          <h1>{error ? "Processing Issue Encountered" : "Analyzing Regulatory Document"}</h1>
          <p>
            {error
              ? "The compliance extraction pipeline could not complete the operation."
              : "ReguLens is extracting regulatory obligations, responsible units, deadlines, and required evidence."
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
            {/* ACTIVE STATUS & TIMER CARD */}
            <div style={{
              background: "linear-gradient(135deg, rgba(229, 166, 9, 0.08) 0%, rgba(11, 16, 22, 0.8) 100%)",
              border: "1px solid rgba(229, 166, 9, 0.25)",
              borderRadius: "12px",
              padding: "20px 24px",
              marginBottom: "28px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "16px",
              flexWrap: "wrap",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <div style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  background: "rgba(229, 166, 9, 0.15)",
                  border: "2px solid #e5a609",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  animation: currentStageId < 5 ? "spin 2s linear infinite" : "none",
                  fontSize: "16px",
                }}>
                  {currentStageId === 5 ? "✓" : "⚡"}
                </div>
                <div>
                  <div style={{ color: "#f8fafc", fontWeight: 600, fontSize: "15px", marginBottom: "4px" }}>
                    {statusMessage}
                  </div>
                  <div style={{ color: "#94a3b8", fontSize: "13px" }}>
                    Stage {currentStageId} of 5 · Multi-Layer Regulatory Intelligence
                  </div>
                </div>
              </div>

              <div style={{
                background: "rgba(0, 0, 0, 0.4)",
                padding: "8px 14px",
                borderRadius: "8px",
                border: "1px solid rgba(255, 255, 255, 0.08)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontFamily: "monospace",
                color: "#e5a609",
                fontSize: "14px",
              }}>
                <span>⏱</span>
                <span>{formatElapsed(elapsedSeconds)}</span>
              </div>
            </div>

            {/* MEANINGFUL STAGES STEPPER */}
            <div className="processing-steps">
              {STAGES.map((stage) => {
                const isCompleted = stage.id < currentStageId || (stage.id === 5 && currentStageId === 5);
                const isActive = stage.id === currentStageId && currentStageId < 5;

                return (
                  <div
                    className={`processing-step ${
                      isCompleted ? "completed" : isActive ? "active" : ""
                    }`}
                    key={stage.id}
                  >
                    <div className="step-icon">
                      {isCompleted ? "✓" : isActive ? "◌" : "·"}
                    </div>

                    <div style={{ display: "flex", flexDirection: "column" }}>
                      <span style={{ fontWeight: isActive ? 600 : 500 }}>{stage.title}</span>
                      <small style={{ opacity: 0.75, fontSize: "12px", marginTop: "2px" }}>{stage.detail}</small>
                    </div>

                    {isCompleted && (
                      <small style={{ marginLeft: "auto", color: "var(--success-color, #10b981)", fontWeight: 600 }}>
                        Completed
                      </small>
                    )}

                    {isActive && (
                      <small style={{ marginLeft: "auto", color: "var(--primary-color, #e5a609)", fontWeight: 600 }}>
                        In Progress...
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