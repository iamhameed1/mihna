import { t } from "@/i18n";
const API_URL = import.meta.env.VITE_API_URL || "/api";

async function accountRequest(path, data, token, method = "POST") {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(data),
  });
  return readAuthResponse(response, t("Could not update your account. Please try again."));
}

export const updateProfile = (data, token) => accountRequest("/users/me", data, token, "PATCH");
export const updatePassword = (data, token) => accountRequest("/users/me/password", data, token);
export const requestEmailChange = (data, token) => accountRequest("/users/me/change-email", data, token);
export const verifyNewEmail = (data, token) => accountRequest("/users/me/verify-new-email", data, token);
export const sendVerificationCode = (email) => accountRequest("/auth/send-verification-code", { email });
export const resendVerificationCode = (email) => accountRequest("/auth/resend-verification-code", { email });
export const verifyEmail = (data) => accountRequest("/auth/verify-email", data);
export const forgotPassword = (email) => accountRequest("/auth/forgot-password", { email });
export const verifyResetCode = (data) => accountRequest("/auth/verify-reset-code", data);
export const resetPassword = (data) => accountRequest("/auth/reset-password", data);

async function readAuthResponse(response, fallback) {
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = data?.detail;
    const message = typeof detail === "string"
      ? detail
      : Array.isArray(detail)
        ? detail.map((error) => error.msg).join(", ")
        : response.status >= 500
          ? t("The server could not complete sign-in. Please try again shortly.")
          : fallback;
    throw new Error(message);
  }
  if (!data) throw new Error(t("The server returned an unexpected response. Please try again."));
  return data;
}

function jobFilterParams(filters) {
  const params = new URLSearchParams();

  if (filters.search) {
    params.append("search", filters.search);
  }

  if (filters.type && filters.type !== "All") {
    params.append("type", filters.type);
  }

  if (filters.location && filters.location !== "All") {
    params.append("location", filters.location);
  }

  if (filters.source && filters.source !== "All") {
    params.append("source", filters.source);
  }

  if (filters.dateRange && filters.dateRange !== "All") {
    params.append("date_range", filters.dateRange);
  }

  return params;
}

export async function getJobs(filters = {}) {
  const params = jobFilterParams(filters);

  if (filters.sort && filters.sort !== "newest") {
    params.append("sort", filters.sort);
  }

  if (filters.page) {
    params.append("page", filters.page);
  }

  if (filters.pageSize) {
    params.append("page_size", filters.pageSize);
  }

  const queryString = params.toString();

  const url = queryString
    ? `${API_URL}/jobs?${queryString}`
    : `${API_URL}/jobs`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(t("Failed to fetch jobs"));
  }

  return response.json();
}
export async function getJobById(id, signal) {
  const response = await fetch(`${API_URL}/jobs/${encodeURIComponent(id)}`, { signal });
  if (response.status === 404) return null;
  if (!response.ok) throw new Error(t("Could not load this job. Please try again."));
  return response.json();
}

export async function createJob(jobData, token) {
  const response = await fetch(`${API_URL}/jobs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(jobData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || t("Failed to create job"));
  }

  return response.json();
}

export async function deleteJobById(jobId, token) {
  const response = await fetch(`${API_URL}/jobs/${jobId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(typeof errorData?.detail === "string"
      ? errorData.detail
      : t("Could not delete the job. Please try again shortly."));
  }

  return response.json();
}

export async function updateJobById(jobId, jobData, token) {
  const response = await fetch(`${API_URL}/jobs/${jobId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(jobData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || t("Failed to update job"));
  }

  return response.json();
}

export async function registerUser(userData) {
  const response = await fetch(`${API_URL}/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  if (!response.ok) {
    return readAuthResponse(response, t("Failed to register"));
  }

  return response.json();
}

export async function loginUser(loginData) {
  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(loginData),
  });

  if (!response.ok) {
    return readAuthResponse(response, t("Failed to login"));
  }

  return response.json();
}

export async function loginWithGoogle(data) {
  const response = await fetch(`${API_URL}/auth/google`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!response.ok) {
    return readAuthResponse(response, t("Google sign-in failed. Please try again."));
  }
  return response.json();
}

export async function getCurrentUser(token) {
  const response = await fetch(`${API_URL}/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    throw new Error(t("Failed to get current user"));
  }

  return response.json();
}

export async function getSavedJobs(token) {
  const response = await fetch(`${API_URL}/saved-jobs`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || t("Failed to get saved jobs"));
  }

  return response.json();
}

export async function saveJobById(jobId, token) {
  const response = await fetch(`${API_URL}/saved-jobs/${jobId}`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || t("Failed to save job"));
  }

  return response.json();
}

export async function removeSavedJobById(jobId, token) {
  const response = await fetch(`${API_URL}/saved-jobs/${jobId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || t("Failed to remove saved job"));
  }

  return response.json();
}

export async function getCompanyJobs(token) {
  const response = await fetch(`${API_URL}/company/jobs`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || t("Failed to get company jobs"));
  }

  return response.json();
}
export async function fetchRemotiveJobs(token) {
  const response = await fetch(`${API_URL}/company/fetch-remotive-jobs`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || t("Failed to fetch Remotive jobs"));
  }

  return response.json();
}

export async function getIngestionLogs(token) {
  const response = await fetch(`${API_URL}/company/ingestion-logs`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.detail || t("Failed to get ingestion logs"));
  }

  return response.json();
}

export async function getAnalyticsSummary(filters = {}) {
  const params = jobFilterParams(filters);

  const queryString = params.toString();

  const url = queryString
    ? `${API_URL}/analytics/summary?${queryString}`
    : `${API_URL}/analytics/summary`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(t("Failed to get analytics summary"));
  }

  return response.json();
}

export function exportJobsCsv(filters = {}) {
  const params = jobFilterParams(filters);

  const queryString = params.toString();

  const url = queryString
    ? `${API_URL}/jobs/export/csv?${queryString}`
    : `${API_URL}/jobs/export/csv`;

  window.open(url, "_blank");
}

export function exportAnalyticsCsv(filters = {}) {
  const params = jobFilterParams(filters);

  const queryString = params.toString();

  const url = queryString
    ? `${API_URL}/analytics/export/csv?${queryString}`
    : `${API_URL}/analytics/export/csv`;

  window.open(url, "_blank");
}
