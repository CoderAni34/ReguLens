/**
 * ReguLens Centralized Frontend API Service
 * 
 * Secure API client connecting the React UI to the FastAPI backend.
 * All Gemini AI processing remains server-side.
 */

const rawApiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";
const API_BASE_URL = rawApiBaseUrl.replace(/\/+$/, "");

const AUTH_TOKEN_KEY = "regulens_auth_token";
const AUTH_USER_KEY = "regulens_auth_user";

// ==========================================
// Authentication Storage Helpers
// ==========================================

export function getStoredToken() {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

export function getStoredUser() {
  try {
    const raw = localStorage.getItem(AUTH_USER_KEY) || sessionStorage.getItem(AUTH_USER_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setAuthSession(token, user, rememberMe = true) {
  try {
    clearAuthSession();
    const storage = rememberMe ? localStorage : sessionStorage;
    if (token) storage.setItem(AUTH_TOKEN_KEY, token);
    if (user) storage.setItem(AUTH_USER_KEY, JSON.stringify(user));
  } catch (err) {
    console.warn("Failed to persist auth session in storage:", err);
  }
}

export function clearAuthSession() {
  try {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    sessionStorage.removeItem(AUTH_TOKEN_KEY);
    sessionStorage.removeItem(AUTH_USER_KEY);
  } catch (err) {
    console.warn("Failed to clear auth session:", err);
  }
}

function getAuthHeaders(extraHeaders = {}) {
  const token = getStoredToken();
  const headers = { ...extraHeaders };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse(response, customErrorMessage) {
  if (!response.ok) {
    let errorDetail = "";
    try {
      const data = await response.json();
      errorDetail = data.detail || (typeof data === "string" ? data : JSON.stringify(data));
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

// ==========================================
// Authentication Endpoints
// ==========================================

/**
 * Log in with email and password
 * @param {Object} credentials - { email, password }
 */
export async function loginUser(credentials) {
  if (!credentials.email || !credentials.password) {
    throw new Error("Email and password are required.");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: credentials.email.trim(),
        password: credentials.password,
      }),
    });

    const data = await handleResponse(response, "Login failed");
    return data;
  } catch (error) {
    throw new Error(error.message || "Failed to log in.");
  }
}

/**
 * Register a new user
 * @param {Object} userData - { email, password, full_name, role }
 */
export async function registerUser(userData) {
  if (!userData.email || !userData.password) {
    throw new Error("Email and password are required.");
  }

  try {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: userData.email.trim(),
        password: userData.password,
        full_name: userData.full_name || undefined,
        role: userData.role || "Compliance Officer",
      }),
    });

    const data = await handleResponse(response, "Registration failed");
    return data;
  } catch (error) {
    throw new Error(error.message || "Failed to register user.");
  }
}

/**
 * Fetch the authenticated user profile
 */
export async function getCurrentUser() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      method: "GET",
      headers: getAuthHeaders(),
    });

    return await handleResponse(response, "Failed to fetch user profile");
  } catch (error) {
    throw new Error(error.message || "Authentication expired or invalid.");
  }
}

/**
 * Log out user from current session
 */
export async function logoutUser() {
  try {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: "POST",
      headers: getAuthHeaders(),
    });
  } catch (err) {
    console.warn("Backend logout notification skipped:", err);
  } finally {
    clearAuthSession();
  }
}

// ==========================================
// Document Management Endpoints
// ==========================================

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
      headers: getAuthHeaders(),
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
      headers: getAuthHeaders({
        "Content-Type": "application/json",
      }),
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
    const response = await fetch(`${API_BASE_URL}/documents?skip=${skip}&limit=${limit}`, {
      headers: getAuthHeaders(),
    });
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
    const response = await fetch(`${API_BASE_URL}/documents/${documentId}`, {
      headers: getAuthHeaders(),
    });
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
      headers: getAuthHeaders(),
    });
    return await handleResponse(response, `Failed to delete document #${documentId}`);
  } catch (error) {
    throw new Error(error.message || "Failed to delete document.");
  }
}

// ==========================================
// Compliance Obligations Endpoints
// ==========================================

/**
 * Retrieve all obligations across all documents
 * @param {number} skip
 * @param {number} limit
 */
export async function getObligations(skip = 0, limit = 100) {
  try {
    const response = await fetch(`${API_BASE_URL}/obligations?skip=${skip}&limit=${limit}`, {
      headers: getAuthHeaders(),
    });
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
    const response = await fetch(`${API_BASE_URL}/obligations/document/${documentId}`, {
      headers: getAuthHeaders(),
    });
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
    const response = await fetch(`${API_BASE_URL}/obligations/${obligationId}`, {
      headers: getAuthHeaders(),
    });
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
      headers: getAuthHeaders({
        "Content-Type": "application/json",
      }),
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
      headers: getAuthHeaders({
        "Content-Type": "application/json",
      }),
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
      headers: getAuthHeaders(),
    });
    return await handleResponse(response, `Failed to delete obligation #${obligationId}`);
  } catch (error) {
    throw new Error(error.message || "Failed to delete obligation.");
  }
}

export default {
  getStoredToken,
  getStoredUser,
  setAuthSession,
  clearAuthSession,
  loginUser,
  registerUser,
  getCurrentUser,
  logoutUser,
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
