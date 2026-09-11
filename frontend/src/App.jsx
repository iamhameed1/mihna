import { useEffect, useState } from "react";

import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import MobileNav from "./components/MobileNav";

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
  loginWithGoogle,
  registerUser,
  getCurrentUser,
  getSavedJobs,
  saveJobById,
  removeSavedJobById,
  getCompanyJobs,
  fetchRemotiveJobs,
  getIngestionLogs,
  getAnalyticsSummary,
  exportJobsCsv,
  exportAnalyticsCsv,
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
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [ingestionLogs, setIngestionLogs] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalJobs, setTotalJobs] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [dateRangeFilter, setDateRangeFilter] = useState("All");
  const [sortOption, setSortOption] = useState("newest");
  const [analyticsSummary, setAnalyticsSummary] = useState(null);


  useEffect(() => {
    fetchJobs();
    loadAnalyticsSummary();
  }, []);

  useEffect(() => {
    const delaySearch = setTimeout(() => {
      const activeFilters = {
        search: searchTerm,
        type: typeFilter,
        location: locationFilter,
        source: sourceFilter,
        dateRange: dateRangeFilter,
        sort: sortOption,
        page: 1,
      };

      fetchJobs(activeFilters);
      loadAnalyticsSummary(activeFilters);
    }, 400);

    return () => clearTimeout(delaySearch);
  }, [
    searchTerm,
    typeFilter,
    locationFilter,
    sourceFilter,
    dateRangeFilter,
    sortOption,
    pageSize,
  ]);

  useEffect(() => {
    if (token) {
      loadCurrentUser();
    }
  }, [token]);

  useEffect(() => {
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

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

  function handleExportJobsCsv() {
    exportJobsCsv({
      search: searchTerm,
      type: typeFilter,
      location: locationFilter,
      source: sourceFilter,
      dateRange: dateRangeFilter,
    });
  }

  function handleExportAnalyticsCsv() {
    exportAnalyticsCsv({
      search: searchTerm,
      type: typeFilter,
      location: locationFilter,
      source: sourceFilter,
      dateRange: dateRangeFilter,
    });
  }
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

      loadAnalyticsSummary({
        search: searchTerm,
        type: typeFilter,
        location: locationFilter,
        source: sourceFilter,
        dateRange: dateRangeFilter,
      });

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

  async function loadAnalyticsSummary(filters = {}) {
    try {
      const summary = await getAnalyticsSummary(filters);
      setAnalyticsSummary(summary);
    } catch (error) {
      console.error("Error loading analytics summary:", error);
    }
  }

  function clearFilters() {
    setSearchTerm("");
    setTypeFilter("All");
    setLocationFilter("All");
    setSourceFilter("All");
    setDateRangeFilter("All");
    setSortOption("newest");

    fetchJobs({
      search: "",
      type: "All",
      location: "All",
      source: "All",
      dateRange: "All",
      sort: "newest",
      page: 1,
      pageSize,
    });

    loadAnalyticsSummary({
      search: "",
      type: "All",
      location: "All",
      source: "All",
      dateRange: "All",
    });
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

  function changePageSize(newSize) {
    setPageSize(newSize);

    fetchJobs({
      search: searchTerm,
      type: typeFilter,
      location: locationFilter,
      source: sourceFilter,
      dateRange: dateRangeFilter,
      sort: sortOption,
      page: 1,
      pageSize: newSize,
    });
  }

  async function handleLogin(loginData) {
    const data = await loginUser(loginData);
    await completeLogin(data);
  }

  async function handleGoogleLogin(googleData) {
    const data = await loginWithGoogle(googleData);
    await completeLogin(data);
  }

  async function completeLogin(data) {
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
    const user = await registerUser(userData);
    setAuthMessage("Account created successfully. Please sign in.");
    return user;
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
      dateRange: dateRangeFilter,
      sort: sortOption,
      page: newPage,
      pageSize,
    });
  }

  async function fetchJobs(filters = {}) {
    try {
      setLoading(true);
      setError("");

      const data = await getJobs({
        ...filters,
        page: filters.page || currentPage,
        pageSize: filters.pageSize || pageSize,
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
      loadAnalyticsSummary({
        search: searchTerm,
        type: typeFilter,
        location: locationFilter,
        source: sourceFilter,
        dateRange: dateRangeFilter,
      });
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
      loadAnalyticsSummary({
        search: searchTerm,
        type: typeFilter,
        location: locationFilter,
        source: sourceFilter,
        dateRange: dateRangeFilter,
      });
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
      loadAnalyticsSummary({
        search: searchTerm,
        type: typeFilter,
        location: locationFilter,
        source: sourceFilter,
        dateRange: dateRangeFilter,
      });
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
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex min-h-screen">
        <Sidebar
          page={page}
          setPage={setPage}
          currentUser={currentUser}
        />

        <MobileNav
          open={mobileNavOpen}
          onOpenChange={setMobileNavOpen}
          page={page}
          setPage={setPage}
          currentUser={currentUser}
        />

        <main className="min-w-0 flex-1">
          <Header
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            currentUser={currentUser}
            onLogout={handleLogout}
            setPage={setPage}
            theme={theme}
            onToggleTheme={toggleTheme}
            onOpenMobileMenu={() => setMobileNavOpen(true)}
          />

          <section className="mx-auto w-full max-w-[1600px] p-4 md:p-6 lg:p-8">
            {loading && (
              <div className="mb-6 rounded-xl border bg-card px-4 py-3 text-sm text-muted-foreground">
                Loading jobs...
              </div>
            )}

            {error && (
              <div className="mb-6 flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between">
                <p>{error}</p>

                <button
                  type="button"
                  onClick={fetchJobs}
                  className="w-fit rounded-lg bg-destructive px-3 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90"
                >
                  Retry
                </button>
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
                dateRangeFilter={dateRangeFilter}
                setDateRangeFilter={setDateRangeFilter}
                sortOption={sortOption}
                setSortOption={setSortOption}
                savedJobs={savedJobs}
                onToggleSaveJob={toggleSaveJob}
                onDeleteJob={deleteJob}
                onStartEditJob={startEditJob}
                currentUser={currentUser}
                onOpenJobDetails={openJobDetails}
                currentPage={currentPage}
                totalPages={totalPages}
                totalJobs={totalJobs}
                pageSize={pageSize}
                onChangePage={changePage}
                onChangePageSize={changePageSize}
                onClearFilters={clearFilters}
                onExportJobsCsv={handleExportJobsCsv}
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
              <DashboardPage
                jobs={currentUser?.role === "company" ? companyJobs : jobs}
                analyticsSummary={analyticsSummary}
                onExportAnalyticsCsv={handleExportAnalyticsCsv}
              />
            )}

            {page === "analytics" && (
              <MarketAnalyticsPage
                jobs={currentUser?.role === "company" ? companyJobs : jobs}
                analyticsSummary={analyticsSummary}
                onExportAnalyticsCsv={handleExportAnalyticsCsv}
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
                <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-5">
                  <p className="text-sm text-destructive">
                    Only company accounts can add or edit jobs.
                  </p>

                  <button
                    type="button"
                    onClick={() => setPage("login")}
                    className="mt-4 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                  >
                    Login
                  </button>
                </div>
              ))}

            {page === "login" && (
              <LoginPage
                onLogin={handleLogin}
                onGoogleLogin={handleGoogleLogin}
                theme={theme}
                authMessage={authMessage}
                setPage={setPage}
              />
            )}

            {page === "register" && (
              <RegisterPage
                onRegister={handleRegister}
                setPage={setPage}
              />
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

            {page === "account" && (
              <AccountPage currentUser={currentUser} token={token} onUserUpdated={setCurrentUser} />
            )}

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
    </div>
  );
}

export default App;
