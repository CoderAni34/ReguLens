/**
 * ReguLens Centralized Frontend API Service
 * 
 * Secure API client connecting the React UI to the FastAPI backend.
 * All AI compliance processing remains server-side.
 */

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, "");

async function handleResponse(response, customErrorMessage) {
  if (!response.ok) {
    let errorDetail = "";
    try {
      const data = await response.json();
      errorDetail = data.detail || JSON.stringify(data);
    } catch {
      errorDetail = response.statusText || `HTTP ${response.status}`;
    }
    throw new Error(`${customErrorMessage}: ${errorDetail}`);
  }

  if (response.status === 204) {
    return null;
  }

  return response.json();
}

/** Health check endpoint */
export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return await handleResponse(response, "Health check failed");
  } catch (error) {
    throw new Error(`Cannot reach ReguLens backend at ${API_BASE_URL}: ${error.message}`);
  }
}

/* ==========================================================================
   DOCUMENTS & OBLIGATIONS API
   ========================================================================== */

export async function uploadDocument(file) {
  if (!file) {
    throw new Error("No file provided for upload.");
  }
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Only PDF files are supported.");
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    const response = await fetch(`${API_BASE_URL}/documents/upload`, {
      method: "POST",
      body: formData,
    });
    return await handleResponse(response, "Document upload failed");
  } catch (error) {
    throw new Error(error.message || "Failed to upload document.");
  }
}

export async function analyzeDocument(documentId) {
  if (!documentId) {
    throw new Error("Document ID is required for AI analysis.");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}/analyze`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    return await handleResponse(response, "AI Document Analysis failed");
  } catch (error) {
    throw new Error(error.message || "AI analysis encountered an error.");
  }
}

export async function getDocuments(skip = 0, limit = 100) {
  try {
    const response = await fetch(`${API_BASE_URL}/documents?skip=${skip}&limit=${limit}`);
    return await handleResponse(response, "Failed to fetch documents");
  } catch (error) {
    throw new Error(error.message || "Failed to retrieve documents.");
  }
}

export async function getDocument(documentId) {
  try {
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}`);
    return await handleResponse(response, `Failed to fetch document #${documentId}`);
  } catch (error) {
    throw new Error(error.message || "Failed to retrieve document details.");
  }
}

export async function deleteDocument(documentId) {
  try {
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
      method: "DELETE",
    });
    return await handleResponse(response, `Failed to delete document #${documentId}`);
  } catch (error) {
    throw new Error(error.message || "Failed to delete document.");
  }
}

export async function getObligations(skip = 0, limit = 100) {
  try {
    const response = await fetch(`${API_BASE_URL}/obligations?skip=${skip}&limit=${limit}`);
    return await handleResponse(response, "Failed to fetch obligations");
  } catch (error) {
    throw new Error(error.message || "Failed to retrieve obligations.");
  }
}

export async function getObligationsByDocument(documentId) {
  if (!documentId) {
    return [];
  }
  try {
    const response = await fetch(`${API_BASE_URL}/obligations/document/${documentId}`);
    return await handleResponse(response, `Failed to fetch obligations for document #${documentId}`);
  } catch (error) {
    throw new Error(error.message || "Failed to retrieve document obligations.");
  }
}

export async function getObligation(obligationId) {
  try {
    const response = await fetch(`${API_BASE_URL}/obligations/${obligationId}`);
    return await handleResponse(response, `Failed to fetch obligation #${obligationId}`);
  } catch (error) {
    throw new Error(error.message || "Failed to retrieve obligation details.");
  }
}

export async function createObligation(obligationData) {
  try {
    const response = await fetch(`${API_BASE_URL}/obligations`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(obligationData),
    });
    return await handleResponse(response, "Failed to create obligation");
  } catch (error) {
    throw new Error(error.message || "Failed to create obligation.");
  }
}

export async function updateObligation(obligationId, updateData) {
  try {
    const response = await fetch(`${API_BASE_URL}/obligations/${obligationId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });
    return await handleResponse(response, `Failed to update obligation #${obligationId}`);
  } catch (error) {
    throw new Error(error.message || "Failed to update obligation.");
  }
}

export async function deleteObligation(obligationId) {
  try {
    const response = await fetch(`${API_BASE_URL}/obligations/${obligationId}`, {
      method: "DELETE",
    });
    return await handleResponse(response, `Failed to delete obligation #${obligationId}`);
  } catch (error) {
    throw new Error(error.message || "Failed to delete obligation.");
  }
}

/* ==========================================================================
   TASKS API
   ========================================================================== */

export async function getTasks(status = "All", skip = 0, limit = 100) {
  try {
    const url = new URL(`${API_BASE_URL}/tasks`);
    url.searchParams.append("skip", skip);
    url.searchParams.append("limit", limit);
    if (status && status !== "All") {
      url.searchParams.append("status", status);
    }
    const response = await fetch(url.toString());
    return await handleResponse(response, "Failed to fetch tasks");
  } catch (error) {
    throw new Error(error.message || "Failed to retrieve compliance tasks.");
  }
}

export async function getTask(taskId) {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`);
    return await handleResponse(response, `Failed to fetch task #${taskId}`);
  } catch (error) {
    throw new Error(error.message || "Failed to retrieve task details.");
  }
}

export async function createTask(taskData) {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(taskData),
    });
    return await handleResponse(response, "Failed to create task");
  } catch (error) {
    throw new Error(error.message || "Failed to create task.");
  }
}

export async function updateTask(taskId, updateData) {
  try {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });
    return await handleResponse(response, `Failed to update task #${taskId}`);
  } catch (error) {
    throw new Error(error.message || "Failed to update task.");
  }
}

/* ==========================================================================
   EVIDENCE API
   ========================================================================== */

export async function getEvidenceList(evidenceType = "All", status = "All", skip = 0, limit = 100) {
  try {
    const url = new URL(`${API_BASE_URL}/evidence`);
    url.searchParams.append("skip", skip);
    url.searchParams.append("limit", limit);
    if (evidenceType && evidenceType !== "All") {
      url.searchParams.append("evidence_type", evidenceType);
    }
    if (status && status !== "All") {
      url.searchParams.append("status", status);
    }
    const response = await fetch(url.toString());
    return await handleResponse(response, "Failed to fetch evidence list");
  } catch (error) {
    throw new Error(error.message || "Failed to retrieve evidence items.");
  }
}

export async function getEvidence(evidenceId) {
  try {
    const response = await fetch(`${API_BASE_URL}/evidence/${evidenceId}`);
    return await handleResponse(response, `Failed to fetch evidence #${evidenceId}`);
  } catch (error) {
    throw new Error(error.message || "Failed to retrieve evidence details.");
  }
}

export async function updateEvidence(evidenceId, updateData) {
  try {
    const response = await fetch(`${API_BASE_URL}/evidence/${evidenceId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });
    return await handleResponse(response, `Failed to update evidence #${evidenceId}`);
  } catch (error) {
    throw new Error(error.message || "Failed to update evidence requirement.");
  }
}

/* ==========================================================================
   CONFLICTS API
   ========================================================================== */

export async function getConflicts(severity = "All", status = "All", skip = 0, limit = 100) {
  try {
    const url = new URL(`${API_BASE_URL}/conflicts`);
    url.searchParams.append("skip", skip);
    url.searchParams.append("limit", limit);
    if (severity && severity !== "All") {
      url.searchParams.append("severity", severity);
    }
    if (status && status !== "All") {
      url.searchParams.append("status", status);
    }
    const response = await fetch(url.toString());
    return await handleResponse(response, "Failed to fetch conflicts");
  } catch (error) {
    throw new Error(error.message || "Failed to retrieve compliance conflicts.");
  }
}

export async function getConflict(conflictId) {
  try {
    const response = await fetch(`${API_BASE_URL}/conflicts/${conflictId}`);
    return await handleResponse(response, `Failed to fetch conflict #${conflictId}`);
  } catch (error) {
    throw new Error(error.message || "Failed to retrieve conflict details.");
  }
}

export async function updateConflict(conflictId, updateData) {
  try {
    const response = await fetch(`${API_BASE_URL}/conflicts/${conflictId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    });
    return await handleResponse(response, `Failed to update conflict #${conflictId}`);
  } catch (error) {
    throw new Error(error.message || "Failed to update conflict.");
  }
}

export async function runConflictDetection(documentId = null) {
  try {
    const url = new URL(`${API_BASE_URL}/conflicts/detect`);
    if (documentId) {
      url.searchParams.append("document_id", documentId);
    }
    const response = await fetch(url.toString(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
    });
    return await handleResponse(response, "Cross-document conflict detection failed");
  } catch (error) {
    throw new Error(error.message || "Conflict detection encountered an error.");
  }
}

/* ==========================================================================
   REPORTS API
   ========================================================================== */

export async function getReports(skip = 0, limit = 100) {
  try {
    const response = await fetch(`${API_BASE_URL}/reports?skip=${skip}&limit=${limit}`);
    return await handleResponse(response, "Failed to fetch reports");
  } catch (error) {
    throw new Error(error.message || "Failed to retrieve compliance reports.");
  }
}

export async function getReport(reportId) {
  try {
    const response = await fetch(`${API_BASE_URL}/reports/${reportId}`);
    return await handleResponse(response, `Failed to fetch report #${reportId}`);
  } catch (error) {
    throw new Error(error.message || "Failed to retrieve report details.");
  }
}

export async function generateReport(reportData = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}/reports/generate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(reportData),
    });
    return await handleResponse(response, "Report generation failed");
  } catch (error) {
    throw new Error(error.message || "Failed to generate report.");
  }
}

export default {
  checkHealth,
  uploadDocument,
  analyzeDocument,
  getDocuments,
  getDocument,
  deleteDocument,
  getObligations,
  getObligationsByDocument,
  getObligation,
  createObligation,
  updateObligation,
  deleteObligation,
  getTasks,
  getTask,
  createTask,
  updateTask,
  getEvidenceList,
  getEvidence,
  updateEvidence,
  getConflicts,
  getConflict,
  updateConflict,
  runConflictDetection,
  getReports,
  getReport,
  generateReport,
};
