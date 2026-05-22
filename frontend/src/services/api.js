const API_URL = "http://127.0.0.1:8000";

export async function getJobs(filters = {}) {
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
    throw new Error("Failed to fetch jobs");
  }

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
    throw new Error(errorData.detail || "Failed to create job");
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
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to delete job");
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
    throw new Error(errorData.detail || "Failed to update job");
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
    const errorData = await response.json();

    const message = Array.isArray(errorData.detail)
      ? errorData.detail.map((error) => error.msg).join(", ")
      : errorData.detail || "Failed to register";

    throw new Error(message);
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
    const errorData = await response.json();
    throw new Error(errorData.detail || "Failed to login");
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
    throw new Error("Failed to get current user");
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
    throw new Error(errorData.detail || "Failed to get saved jobs");
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
    throw new Error(errorData.detail || "Failed to save job");
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
    throw new Error(errorData.detail || "Failed to remove saved job");
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
    throw new Error(errorData.detail || "Failed to get company jobs");
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
    throw new Error(errorData.detail || "Failed to fetch Remotive jobs");
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
    throw new Error(errorData.detail || "Failed to get ingestion logs");
  }

  return response.json();
}

export async function getAnalyticsSummary(filters = {}) {
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

  const queryString = params.toString();

  const url = queryString
    ? `${API_URL}/analytics/summary?${queryString}`
    : `${API_URL}/analytics/summary`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error("Failed to get analytics summary");
  }

  return response.json();
}

export function exportJobsCsv(filters = {}) {
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

  const queryString = params.toString();

  const url = queryString
    ? `${API_URL}/jobs/export/csv?${queryString}`
    : `${API_URL}/jobs/export/csv`;

  window.open(url, "_blank");
}

export function exportAnalyticsCsv(filters = {}) {
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

  const queryString = params.toString();

  const url = queryString
    ? `${API_URL}/analytics/export/csv?${queryString}`
    : `${API_URL}/analytics/export/csv`;

  window.open(url, "_blank");
}