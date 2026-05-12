import { useEffect, useState } from "react";
import "./App.css";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

import HomePage from "./pages/HomePage";
import SavedJobsPage from "./pages/SavedJobsPage";
import DashboardPage from "./pages/DashboardPage";
import MarketAnalyticsPage from "./pages/MarketAnalyticsPage";
import AddJobPage from "./pages/AddJobPage";

import {
  getJobs,
  createJob,
  deleteJobById,
  updateJobById,
} from "./services/api";


function App() {
  const [page, setPage] = useState("home");
  const [jobs, setJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [savedJobs, setSavedJobs] = useState([]);
  const [editingJob, setEditingJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    try {
      setLoading(true);
      setError("");

      const data = await getJobs();
      setJobs(data);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setError("Failed to load jobs. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  async function addJob(newJob) {
    try {
      const savedJob = await createJob(newJob);

      setJobs([savedJob, ...jobs]);
      setPage("home");
    } catch (error) {
      console.error("Error adding job:", error);
    }
  }

  async function deleteJob(jobId) {
    try {
      await deleteJobById(jobId);

      setJobs(jobs.filter((job) => job.id !== jobId));
      setSavedJobs(savedJobs.filter((job) => job.id !== jobId));
    } catch (error) {
      console.error("Error deleting job:", error);
    }
  }

  function startEditJob(job) {
    setEditingJob(job);
    setPage("add-job");
  }

  async function updateJob(jobId, updatedJob) {
    try {
      const savedJob = await updateJobById(jobId, updatedJob);

      setJobs(jobs.map((job) => (job.id === jobId ? savedJob : job)));

      setSavedJobs(
        savedJobs.map((job) => (job.id === jobId ? savedJob : job))
      );

      setEditingJob(null);
      setPage("home");
    } catch (error) {
      console.error("Error updating job:", error);
    }
  }

  function toggleSaveJob(job) {
    const alreadySaved = savedJobs.some((savedJob) => savedJob.id === job.id);

    if (alreadySaved) {
      setSavedJobs(savedJobs.filter((savedJob) => savedJob.id !== job.id));
    } else {
      setSavedJobs([...savedJobs, job]);
    }
  }

  return (
    <div className="app">
      <Sidebar page={page} setPage={setPage} />

      <main className="main">
        <Header searchTerm={searchTerm} setSearchTerm={setSearchTerm} />

        <section className="content">
          {loading && <p className="status-message">Loading jobs...</p>}

          {error && (
            <div className="error-box">
              <p>{error}</p>
              <button onClick={fetchJobs}>Retry</button>
            </div>
          )}
          {page === "home" && (
            <HomePage
              jobs={jobs}
              searchTerm={searchTerm}
              typeFilter={typeFilter}
              setTypeFilter={setTypeFilter}
              savedJobs={savedJobs}
              onToggleSaveJob={toggleSaveJob}
              onDeleteJob={deleteJob}
              onStartEditJob={startEditJob}
            />
          )}

          {page === "saved" && (
            <SavedJobsPage
              savedJobs={savedJobs}
              onToggleSaveJob={toggleSaveJob}
            />
          )}

          {page === "dashboard" && <DashboardPage jobs={jobs} />}

          {page === "analytics" && <MarketAnalyticsPage jobs={jobs} />}

          {page === "add-job" && (
            <AddJobPage
              onAddJob={addJob}
              editingJob={editingJob}
              onUpdateJob={updateJob}
              onCancelEdit={() => {
                setEditingJob(null);
                setPage("home");
              }}
            />
          )}
        </section>
      </main>
    </div>
  );
}

export default App;