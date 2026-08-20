import React, { useEffect, useState } from "react";

function Processing({ setActivePage }) {
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    "Document uploaded",
    "Extracting text from document",
    "AI analyzing obligations",
    "Detecting deadlines",
    "Detecting evidence requirements",
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }

        return prev + 1;
      });
    }, 50);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const stepInterval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= steps.length - 1) {
          clearInterval(stepInterval);
          return prev;
        }

        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(stepInterval);
  }, []);

  useEffect(() => {
    if (progress === 100) {
      const timeout = setTimeout(() => {
        setActivePage("Obligations");
      }, 800);

      return () => clearTimeout(timeout);
    }
  }, [progress, setActivePage]);

  return (
    <main className="processing-page">
      <div className="processing-container">
        <div className="processing-header">
          <span className="ai-badge">✦ AI PROCESSING</span>

          <h1>Analyzing your document</h1>

          <p>
            Our AI is extracting obligations, deadlines, and compliance
            requirements.
          </p>
        </div>

        <div className="progress-card">
          <div className="progress-top">
            <span>Analysis Progress</span>
            <strong>{progress}%</strong>
          </div>

          <div className="progress-track">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="processing-steps">
          {steps.map((step, index) => (
            <div
              className={`processing-step ${
                index < currentStep
                  ? "completed"
                  : index === currentStep
                  ? "active"
                  : ""
              }`}
              key={step}
            >
              <div className="step-icon">
                {index < currentStep ? "✓" : index === currentStep ? "◌" : ""}
              </div>

              <span>{step}</span>

              {index < currentStep && (
                <small>Completed</small>
              )}

              {index === currentStep && progress < 100 && (
                <small>Processing...</small>
              )}
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

export default Processing;