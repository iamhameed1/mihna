import { useEffect, useState } from "react";
import "./App.css";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

import HomePage from "./pages/HomePage";
import SavedJobsPage from "./pages/SavedJobsPage";
import DashboardPage from "./pages/DashboardPage";
import MarketAnalyticsPage from "./pages/MarketAnalyticsPage";
import AddJobPage from "./pages/AddJobPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import CompanyJobsPage from "./pages/CompanyJobsPage";
import AccountPage from "./pages/AccountPage";
import JobDetailsPage from "./pages/JobDetailsPage";
import IngestionLogsPage from "./pages/IngestionLogsPage";

import {
  getJobs,
  createJob,
  deleteJobById,
  updateJobById,
  loginUser,
  registerUser,
  getCurrentUser,
  getSavedJobs,
  saveJobById,
  removeSavedJobById,
  getCompanyJobs,
  fetchRemotiveJobs,
  getIngestionLogs,
} from "./services/api";


function App() {
  const [page, setPage] = useState("home");
  const [jobs, setJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [savedJobs, setSavedJobs] = useState([]);
  const [editingJob, setEditingJob] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("mihna_token") || "");
  const [companyJobs, setCompanyJobs] = useState([]);
  const [authMessage, setAuthMessage] = useState("");
  const [theme, setTheme] = useState(localStorage.getItem("mihna_theme") || "dark");
  const [selectedJob, setSelectedJob] = useState(null);
  const [ingestionLogs, setIngestionLogs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const pageSize = 10;


  useEffect(() => {
    fetchJobs();
  }, []);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      fetchJobs({
        search: searchTerm,
        type: typeFilter,
        location: locationFilter,
        source: sourceFilter,
        page: 1,
      });
    }, 400);

    return () => clearTimeout(delaySearch);
  }, [searchTerm, typeFilter, locationFilter, sourceFilter]);

  useEffect(() => {
    if (token) {
      loadCurrentUser();
    }
  }, [token]);

  useEffect(() => {
    const guestAllowedPages = ["home", "login", "register", "job-details"];
    const jobSeekerAllowedPages = [
      "home",
      "saved",
      "account",
      "login",
      "register",
      "job-details",
    ];

    const companyAllowedPages = [
      "home",
      "dashboard",
      "analytics",
      "add-job",
      "company-jobs",
      "account",
      "login",
      "register",
      "job-details",
      "ingestion-logs",
    ];

    if (!currentUser && !guestAllowedPages.includes(page)) {
      setPage("home");
      return;
    }

    if (
      currentUser?.role === "job_seeker" &&
      !jobSeekerAllowedPages.includes(page)
    ) {
      setPage("home");
      return;
    }

    if (
      currentUser?.role === "company" &&
      !companyAllowedPages.includes(page)
    ) {
      setPage("home");
    }
  }, [currentUser, page]);

  async function handleFetchRemotiveJobs() {
    try {
      const result = await fetchRemotiveJobs(token);

      alert(
        `Remotive import finished.\nAdded: ${result.added}\nSkipped duplicates: ${result.skipped_duplicates}`
      );

      const allJobs = await getJobs();
      setJobs(allJobs);

      const companyData = await getCompanyJobs(token);
      setCompanyJobs(companyData);

      const logs = await getIngestionLogs(token);
      setIngestionLogs(logs);

      setPage("company-jobs");
    } catch (error) {
      console.error("Error fetching Remotive jobs:", error);
      alert(error.message);
    }
  }

  async function loadIngestionLogs() {
    try {
      const logs = await getIngestionLogs(token);
      setIngestionLogs(logs);
    } catch (error) {
      console.error("Error loading ingestion logs:", error);
      alert(error.message);
    }
  }

  function openJobDetails(job) {
    setSelectedJob(job);
    setPage("job-details");
  }

  async function loadCurrentUser() {
    try {
      const user = await getCurrentUser(token);
      setCurrentUser(user);

      if (user.role === "job_seeker") {
        const saved = await getSavedJobs(token);
        setSavedJobs(saved);
      } else if (user.role === "company") {
        setSavedJobs([]);

        const companyData = await getCompanyJobs(token);
        setCompanyJobs(companyData);

        const logs = await getIngestionLogs(token);
        setIngestionLogs(logs);
      } else {
        setSavedJobs([]);
        setCompanyJobs([]);
        setIngestionLogs([]);
      }
    } catch (error) {
      console.error("Error loading current user:", error);
      localStorage.removeItem("mihna_token");
      setToken("");
      setCurrentUser(null);
      setSavedJobs([]);
    }
  }

  function toggleTheme() {
    const newTheme = theme === "dark" ? "light" : "dark";

    setTheme(newTheme);
    localStorage.setItem("mihna_theme", newTheme);
  }

  async function handleLogin(loginData) {
    const data = await loginUser(loginData);

    localStorage.setItem("mihna_token", data.access_token);
    setToken(data.access_token);
    setCurrentUser(data.user);
    setAuthMessage("");

    if (data.user.role === "job_seeker") {
      const saved = await getSavedJobs(data.access_token);
      setSavedJobs(saved);
    } else if (data.user.role === "company") {
      setSavedJobs([]);
      const companyData = await getCompanyJobs(data.access_token);
      setCompanyJobs(companyData);
      const logs = await getIngestionLogs(data.access_token);
      setIngestionLogs(logs);
    } else {
      setSavedJobs([]);
      setCompanyJobs([]);
      setIngestionLogs([]);
    }

    setPage("home");
  }

  async function handleRegister(userData) {
    await registerUser(userData);

    setAuthMessage("Account created successfully. Please login.");
    setPage("login");
  }

  function handleLogout() {
    localStorage.removeItem("mihna_token");
    setToken("");
    setCurrentUser(null);
    setSavedJobs([]);
    setCompanyJobs([]);
    setPage("home");
  }

  function changePage(newPage) {
    fetchJobs({
      search: searchTerm,
      type: typeFilter,
      location: locationFilter,
      source: sourceFilter,
      page: newPage,
    });
  }

  async function fetchJobs(filters = {}) {
    try {
      setLoading(true);
      setError("");

      const data = await getJobs({
        ...filters,
        page: filters.page || currentPage,
        pageSize,
      });

      setJobs(data.items);
      setCurrentPage(data.page);
      setTotalPages(data.total_pages);
      setTotalJobs(data.total);
    } catch (error) {
      console.error("Error fetching jobs:", error);
      setError("Failed to load jobs. Make sure the backend is running.");
    } finally {
      setLoading(false);
    }
  }

  async function addJob(newJob) {
    try {
      const savedJob = await createJob(newJob, token);

      setJobs([savedJob, ...jobs]);
      setCompanyJobs([savedJob, ...companyJobs]);
      setPage("home");
    } catch (error) {
      console.error("Error adding job:", error);
      alert(error.message);
    }
  }

  async function deleteJob(jobId) {
    try {
      await deleteJobById(jobId, token);

      setJobs(jobs.filter((job) => job.id !== jobId));
      setCompanyJobs(companyJobs.filter((job) => job.id !== jobId));
      setSavedJobs(savedJobs.filter((job) => job.id !== jobId));
    } catch (error) {
      console.error("Error deleting job:", error);
      alert(error.message);
    }
  }

  function startEditJob(job) {
    setEditingJob(job);
    setPage("add-job");
  }

  async function updateJob(jobId, updatedJob) {
    try {
      const savedJob = await updateJobById(jobId, updatedJob, token);

      setJobs(jobs.map((job) => (job.id === jobId ? savedJob : job)));

      setCompanyJobs(
        companyJobs.map((job) => (job.id === jobId ? savedJob : job))
      );
      setSavedJobs(
        savedJobs.map((job) => (job.id === jobId ? savedJob : job))
      );

      setEditingJob(null);
      setPage("home");
    } catch (error) {
      console.error("Error updating job:", error);
      alert(error.message);
    }
  }

  async function toggleSaveJob(job) {
    if (!currentUser) {
      alert("Please login or create an account to save jobs.");
      setPage("login");
      return;
    }

    if (currentUser.role !== "job_seeker") {
      alert("Only job seeker accounts can save jobs.");
      return;
    }

    try {
      const alreadySaved = savedJobs.some((savedJob) => savedJob.id === job.id);

      if (alreadySaved) {
        await removeSavedJobById(job.id, token);
        setSavedJobs(savedJobs.filter((savedJob) => savedJob.id !== job.id));
      } else {
        await saveJobById(job.id, token);
        setSavedJobs([...savedJobs, job]);
      }
    } catch (error) {
      console.error("Error saving job:", error);
      alert(error.message);
    }
  }

  return (
    <div className={`app ${theme === "light" ? "light-theme" : ""}`}>
      <Sidebar page={page} setPage={setPage} currentUser={currentUser} />

      <main className="main">
        <Header
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          currentUser={currentUser}
          onLogout={handleLogout}
          setPage={setPage}
          theme={theme}
          onToggleTheme={toggleTheme}
        />

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
              locationFilter={locationFilter}
              setLocationFilter={setLocationFilter}
              sourceFilter={sourceFilter}
              setSourceFilter={setSourceFilter}
              savedJobs={savedJobs}
              onToggleSaveJob={toggleSaveJob}
              onDeleteJob={deleteJob}
              onStartEditJob={startEditJob}
              currentUser={currentUser}
              onOpenJobDetails={openJobDetails}
              currentPage={currentPage}
              totalPages={totalPages}
              totalJobs={totalJobs}
              onChangePage={changePage}
            />
          )}

          {page === "saved" && (
            <SavedJobsPage
              savedJobs={savedJobs}
              onToggleSaveJob={toggleSaveJob}
              onOpenJobDetails={openJobDetails}
            />
          )}

          {page === "dashboard" && (
            <DashboardPage jobs={currentUser?.role === "company" ? companyJobs : jobs} />
          )}

          {page === "analytics" && (
            <MarketAnalyticsPage
              jobs={currentUser?.role === "company" ? companyJobs : jobs}
            />
          )}

          {page === "add-job" &&
            (currentUser?.role === "company" ? (
              <AddJobPage
                onAddJob={addJob}
                editingJob={editingJob}
                onUpdateJob={updateJob}
                onCancelEdit={() => {
                  setEditingJob(null);
                  setPage("home");
                }}
              />
            ) : (
              <div className="error-box">
                <p>Only company accounts can add or edit jobs.</p>
                <button onClick={() => setPage("login")}>Login</button>
              </div>
            ))}
          {page === "login" && (
            <LoginPage
              onLogin={handleLogin}
              authMessage={authMessage}
              setPage={setPage}
            />
          )}

          {page === "register" && (
            <RegisterPage onRegister={handleRegister} setPage={setPage} />
          )}

          {page === "company-jobs" && (
            <CompanyJobsPage
              companyJobs={companyJobs}
              currentUser={currentUser}
              onDeleteJob={deleteJob}
              onStartEditJob={startEditJob}
              onOpenJobDetails={openJobDetails}
              onFetchRemotiveJobs={handleFetchRemotiveJobs}
            />
          )}

          {page === "account" && <AccountPage currentUser={currentUser} />}

          {page === "job-details" && (
            <JobDetailsPage
              job={selectedJob}
              currentUser={currentUser}
              savedJobs={savedJobs}
              onToggleSaveJob={toggleSaveJob}
              onDeleteJob={deleteJob}
              onStartEditJob={startEditJob}
              setPage={setPage}
            />
          )}

          {page === "ingestion-logs" && (
            <IngestionLogsPage
              logs={ingestionLogs}
              onRefreshLogs={loadIngestionLogs}
            />
          )}

        </section>
      </main>
    </div>
  );
}

export default App;