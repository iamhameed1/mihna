import { localizeMessage } from "@/i18n";
import { useTranslation } from "react-i18next";
import { DirectionProvider } from "@base-ui/react/direction-provider";
import { localizeInvalidField, clearFieldValidity } from "./i18n/validation";
import { t } from "@/i18n";
import { useEffect, useState } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";

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
import JobDetailsRoute from "./pages/JobDetailsRoute";
import RouteAccess from "./components/RouteAccess";
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
  const { i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const [jobs, setJobs] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("All");
  const [locationFilter, setLocationFilter] = useState("All");
  const [sourceFilter, setSourceFilter] = useState("All");
  const [savedJobs, setSavedJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem("mihna_token") || "");
  const [restoredToken, setRestoredToken] = useState(null);
  const authLoading = Boolean(token) && restoredToken !== token;
  const [companyJobs, setCompanyJobs] = useState([]);
  const [authMessage, setAuthMessage] = useState("");
  const [theme, setTheme] = useState(localStorage.getItem("mihna_theme") || "dark");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
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
    if (!token) return;
    let active = true;
    async function restoreSession() {
      try {
        const user = await getCurrentUser(token);
        if (!active) return;
        setCurrentUser(user);
        const [saved, companyData, logs] = await Promise.all([
          user.role === "job_seeker" ? getSavedJobs(token) : [],
          user.role === "company" ? getCompanyJobs(token) : [],
          user.role === "company" ? getIngestionLogs(token) : [],
        ]);
        if (!active) return;
        setSavedJobs(saved);
        setCompanyJobs(companyData);
        setIngestionLogs(logs);
      } catch (error) {
        if (!active) return;
        console.error("Error loading current user:", error);
        localStorage.removeItem("mihna_token");
        setToken("");
        setCurrentUser(null);
        setSavedJobs([]);
        setCompanyJobs([]);
        setIngestionLogs([]);
      } finally {
        if (active) setRestoredToken(token);
      }
    }
    restoreSession();
    return () => { active = false; };
  }, [token]);

  useEffect(() => {
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [theme]);

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
        t("Remotive import finished.\nAdded: {{added}}\nSkipped duplicates: {{skipped}}", { added: result.added, skipped: result.skipped_duplicates })
      );

      await fetchJobs({
        search: searchTerm,
        type: typeFilter,
        location: locationFilter,
        source: sourceFilter,
        dateRange: dateRangeFilter,
        sort: sortOption,
        page: currentPage,
        pageSize,
      });

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

      navigate("/company-jobs");
    } catch (error) {
      console.error("Error fetching Remotive jobs:", error);
      alert(localizeMessage(error.message));
    }
  }

  async function loadIngestionLogs() {
    try {
      const logs = await getIngestionLogs(token);
      setIngestionLogs(logs);
    } catch (error) {
      console.error("Error loading ingestion logs:", error);
      alert(localizeMessage(error.message));
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
    navigate(`/job/${job.id}`, { state: { from: location.pathname + location.search } });
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

    setRestoredToken(data.access_token);
    navigate("/", { replace: true });
  }

  async function handleRegister(userData) {
    const user = await registerUser(userData);
    setAuthMessage(t("Account created successfully. Please sign in."));
    return user;
  }

  function handleLogout() {
    localStorage.removeItem("mihna_token");
    setToken("");
    setCurrentUser(null);
    setSavedJobs([]);
    setCompanyJobs([]);
    setIngestionLogs([]);
    navigate("/", { replace: true });
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
      setError(t("Failed to load jobs. Make sure the backend is running."));
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
      navigate("/");
    } catch (error) {
      console.error("Error adding job:", error);
      alert(localizeMessage(error.message));
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
      return true;
    } catch (error) {
      console.error("Error deleting job:", error);
      alert(localizeMessage(error.message));
      return false;
    }
  }

  function startEditJob(job) {
    navigate("/add-job", { state: { editingJob: job } });
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

      navigate("/");
    } catch (error) {
      console.error("Error updating job:", error);
      alert(localizeMessage(error.message));
    }
  }

  async function toggleSaveJob(job) {
    if (!currentUser) {
      alert(t("Please login or create an account to save jobs."));
      navigate("/login");
      return;
    }

    if (currentUser.role !== "job_seeker") {
      alert(t("Only job seeker accounts can save jobs."));
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
      alert(localizeMessage(error.message));
    }
  }

  return (
    <DirectionProvider direction={i18n.dir()}>
    <div className="min-h-screen bg-background text-foreground" onInvalidCapture={localizeInvalidField} onInputCapture={clearFieldValidity}>
      <div className="flex min-h-screen">
        <Sidebar currentUser={currentUser} />

        <MobileNav
          open={mobileNavOpen}
          onOpenChange={setMobileNavOpen}
          currentUser={currentUser}
        />

        <main className="min-w-0 flex-1">
          <Header
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            currentUser={currentUser}
            onLogout={handleLogout}
            theme={theme}
            onToggleTheme={toggleTheme}
            onOpenMobileMenu={() => setMobileNavOpen(true)}
          />

          <section className="mx-auto w-full max-w-[1600px] p-4 md:p-6 lg:p-8">
            {loading && (
              <div className="mb-6 rounded-xl border bg-card px-4 py-3 text-sm text-muted-foreground">{t("Loading jobs...")}</div>
            )}

            {error && (
              <div className="mb-6 flex flex-col gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive sm:flex-row sm:items-center sm:justify-between">
                <p>{localizeMessage(error)}</p>

                <button
                  type="button"
                  onClick={fetchJobs}
                  className="w-fit rounded-lg bg-destructive px-3 py-2 text-xs font-medium text-white transition-opacity hover:opacity-90"
                >{t("Retry")}</button>
              </div>
            )}

            <Routes>
            <Route path="/" element={
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
            } />

            <Route element={<RouteAccess currentUser={currentUser} authLoading={authLoading} roles={["job_seeker"]} />}>
            <Route path="/saved" element={
              <SavedJobsPage
                savedJobs={savedJobs}
                onToggleSaveJob={toggleSaveJob}
                onOpenJobDetails={openJobDetails}
              />
            } />
            </Route>

            <Route element={<RouteAccess currentUser={currentUser} authLoading={authLoading} roles={["company"]} />}>
            <Route path="/dashboard" element={
              <DashboardPage
                jobs={currentUser?.role === "company" ? companyJobs : jobs}
                analyticsSummary={analyticsSummary}
                onExportAnalyticsCsv={handleExportAnalyticsCsv}
              />
            } />

            <Route path="/analytics" element={
              <MarketAnalyticsPage
                jobs={currentUser?.role === "company" ? companyJobs : jobs}
                analyticsSummary={analyticsSummary}
                onExportAnalyticsCsv={handleExportAnalyticsCsv}
              />
            } />

            <Route path="/add-job" element={
                <AddJobPage
                  key={location.state?.editingJob?.id || "new"}
                  onAddJob={addJob}
                  editingJob={location.state?.editingJob || null}
                  onUpdateJob={updateJob}
                  onCancelEdit={() => navigate("/")}
                />
            } />
            <Route path="/company-jobs" element={
              <CompanyJobsPage
                companyJobs={companyJobs}
                currentUser={currentUser}
                onDeleteJob={deleteJob}
                onStartEditJob={startEditJob}
                onOpenJobDetails={openJobDetails}
                onFetchRemotiveJobs={handleFetchRemotiveJobs}
              />
            } />
            <Route path="/ingestion-logs" element={
              <IngestionLogsPage
                logs={ingestionLogs}
                onRefreshLogs={loadIngestionLogs}
              />
            } />
            </Route>

            <Route element={<RouteAccess currentUser={currentUser} authLoading={authLoading} roles={["guest"]} />}>
            <Route path="/login" element={
              <LoginPage
                onLogin={handleLogin}
                onGoogleLogin={handleGoogleLogin}
                theme={theme}
                authMessage={localizeMessage(authMessage)}
              />
            } />

            <Route path="/register" element={
              <RegisterPage
                onRegister={handleRegister}
              />
            } />
            </Route>

            <Route element={<RouteAccess currentUser={currentUser} authLoading={authLoading} roles={["job_seeker", "company"]} />}>
            <Route path="/account" element={
              <AccountPage currentUser={currentUser} token={token} onUserUpdated={setCurrentUser} />
            } />
            </Route>

            <Route path="/job/:id" element={
              <JobDetailsRoute
                currentUser={currentUser}
                savedJobs={savedJobs}
                onToggleSaveJob={toggleSaveJob}
                onDeleteJob={deleteJob}
                onStartEditJob={startEditJob}
              />
            } />
            <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </section>
        </main>
      </div>
    </div>
    </DirectionProvider>
  );
}

export default App;
