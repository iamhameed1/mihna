const API_URL = "http://127.0.0.1:8000";

export async function getJobs() {
  const response = await fetch(`${API_URL}/jobs`);

  if (!response.ok) {
    throw new Error("Failed to fetch jobs");
  }

  return response.json();
}

export async function createJob(jobData) {
  const response = await fetch(`${API_URL}/jobs`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(jobData),
  });

  if (!response.ok) {
    throw new Error("Failed to create job");
  }

  return response.json();
}

export async function deleteJobById(jobId) {
  const response = await fetch(`${API_URL}/jobs/${jobId}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Failed to delete job");
  }

  return response.json();
}

export async function updateJobById(jobId, jobData) {
  const response = await fetch(`${API_URL}/jobs/${jobId}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(jobData),
  });

  if (!response.ok) {
    throw new Error("Failed to update job");
  }

  return response.json();
}