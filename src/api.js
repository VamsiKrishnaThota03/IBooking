// In development the CRA proxy (package.json "proxy") forwards /api to http://localhost:5000.
// For a deployed build set REACT_APP_API_URL to the backend origin, e.g. https://ibooking-api.onrender.com
export const API_URL = (process.env.REACT_APP_API_URL || "").replace(/\/$/, "");

export const apiUrl = (path) => `${API_URL}/api${path}`;

export async function apiRequest(path, { method = "GET", body, token } = {}) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  if (token) headers["auth-token"] = token;
  const response = await fetch(apiUrl(path), {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = null;
  try {
    data = await response.json();
  } catch {
    // empty or non-JSON body
  }
  if (!response.ok) {
    const error = new Error((data && data.error) || `Request failed (${response.status})`);
    error.status = response.status;
    throw error;
  }
  return data;
}
