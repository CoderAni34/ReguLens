/**
 * ReguLens Centralized Frontend API Service
 * 
 * Secure API client connecting the React UI to the FastAPI backend.
 * All Gemini AI processing remains server-side.
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

/**
 * Health check endpoint
 */
export async function checkHealth() {
  try {
    const response = await fetch(`${API_BASE_URL}/health`);
    return await handleResponse(response, "Health check failed");
  } catch (error) {
    throw new Error(`Cannot reach ReguLens backend at ${API_BASE_URL}: ${error.message}`);
  }
}

/**
 * Upload a PDF document
 * @param {File} file - PDF File object to upload
 */
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

/**
 * Trigger real AI analysis on an uploaded document
 * @param {number|string} documentId - ID of the uploaded document
 */
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

/**
 * Retrieve all documents with pagination
 * @param {number} skip
 * @param {number} limit
 */
export async function getDocuments(skip = 0, limit = 100) {
  try {
    const response = await fetch(`${API_BASE_URL}/documents?skip=${skip}&limit=${limit}`);
    return await handleResponse(response, "Failed to fetch documents");
  } catch (error) {
    throw new Error(error.message || "Failed to retrieve documents.");
  }
}

/**
 * Retrieve a single document by ID
 * @param {number|string} documentId
 */
export async function getDocument(documentId) {
  try {
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}`);
    return await handleResponse(response, `Failed to fetch document #${documentId}`);
  } catch (error) {
    throw new Error(error.message || "Failed to retrieve document details.");
  }
}

/**
 * Delete a document and its cascade relations
 * @param {number|string} documentId
 */
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

/**
 * Retrieve all obligations across all documents
 * @param {number} skip
 * @param {number} limit
 */
export async function getObligations(skip = 0, limit = 100) {
  try {
    const response = await fetch(`${API_BASE_URL}/obligations?skip=${skip}&limit=${limit}`);
    return await handleResponse(response, "Failed to fetch obligations");
  } catch (error) {
    throw new Error(error.message || "Failed to retrieve obligations.");
  }
}

/**
 * Retrieve obligations specifically extracted for a document
 * @param {number|string} documentId
 */
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

/**
 * Retrieve a single obligation by ID
 * @param {number|string} obligationId
 */
export async function getObligation(obligationId) {
  try {
    const response = await fetch(`${API_BASE_URL}/obligations/${obligationId}`);
    return await handleResponse(response, `Failed to fetch obligation #${obligationId}`);
  } catch (error) {
    throw new Error(error.message || "Failed to retrieve obligation details.");
  }
}

/**
 * Manually create a new compliance obligation
 * @param {Object} obligationData
 */
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

/**
 * Update an existing obligation (e.g. status or details)
 * @param {number|string} obligationId
 * @param {Object} updateData
 */
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

/**
 * Delete an obligation by ID
 * @param {number|string} obligationId
 */
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
};
