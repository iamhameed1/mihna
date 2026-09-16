import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { BrowserRouter, createMemoryRouter, RouterProvider } from "react-router-dom";
import App from "./App";
import i18n from "./i18n";
import * as api from "./services/api";

afterEach(async () => { await i18n.changeLanguage("en"); });

describe("Arabic navigation and authorization", () => {
  it.each([
    ["company", "/dashboard", "Dashboard page"],
    ["company", "/company-jobs", "Company jobs page"],
    ["company", "/analytics", "Analytics page"],
    ["company", "/add-job", "Add job page"],
    ["job_seeker", "/saved", "Saved jobs page"],
    ["company", "/account", "حسابي"],
  ])("preserves %s access to %s in Arabic", async (role, path, heading) => {
    await i18n.changeLanguage("ar");
    mount(path, role);
    await screen.findByRole("heading", { name: heading });
    expect(router.state.location.pathname).toBe(path);
    expect(document.documentElement.dir).toBe("rtl");
  });

  it("keeps Arabic after logout and still denies protected history entries", async () => {
    await i18n.changeLanguage("ar");
    mount("/saved", "job_seeker");
    await screen.findByRole("heading", { name: "Saved jobs page" });
    fireEvent.click(within(screen.getByRole("banner")).getByRole("button", { name: "Test User باحث عن عمل" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "تسجيل الخروج" }));
    await screen.findByRole("heading", { name: "Discover Jobs" });
    expect(localStorage.getItem("mihna_language")).toBe("ar");
    expect(localStorage.getItem("mihna_token")).toBeNull();
    await navigate("/dashboard");
    await waitFor(() => expect(router.state.location.pathname).toBe("/"));
  });

  it("switching language keeps the current route and search/filter state", async () => {
    mount();
    await screen.findByRole("heading", { name: "Discover Jobs" });
    fireEvent.change(screen.getByPlaceholderText("Search jobs, companies, skills..."), { target: { value: "Python" } });
    fireEvent.click(screen.getByRole("button", { name: "Filter remote" }));
    await navigate("/job/42");
    await screen.findByRole("heading", { name: job.title });
    await act(async () => { await i18n.changeLanguage("ar"); });
    expect(router.state.location.pathname).toBe("/job/42");
    await navigate(-1);
    await waitFor(() => expect(screen.getByTestId("listing-state").textContent).toContain("Python:Remote:"));
    expect(localStorage.getItem("mihna_language")).toBe("ar");
  });
});

vi.mock("./services/api", () => ({
  getJobs: vi.fn(), getJobById: vi.fn(), createJob: vi.fn(), deleteJobById: vi.fn(),
  updateJobById: vi.fn(), loginUser: vi.fn(), loginWithGoogle: vi.fn(), registerUser: vi.fn(),
  getCurrentUser: vi.fn(), getSavedJobs: vi.fn(), saveJobById: vi.fn(), removeSavedJobById: vi.fn(),
  getCompanyJobs: vi.fn(), fetchRemotiveJobs: vi.fn(), getIngestionLogs: vi.fn(),
  getAnalyticsSummary: vi.fn(), exportJobsCsv: vi.fn(), exportAnalyticsCsv: vi.fn(),
  sendVerificationCode: vi.fn(), resendVerificationCode: vi.fn(), verifyEmail: vi.fn(),
  updateProfile: vi.fn(), updatePassword: vi.fn(), requestEmailChange: vi.fn(), verifyNewEmail: vi.fn(),
  forgotPassword: vi.fn(), resetPassword: vi.fn(), verifyResetCode: vi.fn(),
}));

// Keep the actual App, navigation, login, registration, account, and job detail routes.
// Only replace the large job-list/chart/form views with small interactive fixtures.
vi.mock("./pages/HomePage", () => ({ default: (props) => <div>
  <h1>Discover Jobs</h1>
  <p data-testid="listing-state">{props.searchTerm}:{props.typeFilter}:{props.currentPage}</p>
  <button onClick={() => props.setTypeFilter("Remote")}>Filter remote</button>
  <button onClick={() => props.onChangePage(2)}>Next results</button>
  {props.jobs.map((job) => <button key={job.id} onClick={() => props.onOpenJobDetails(job)}>Open {job.title}</button>)}
</div> }));
vi.mock("./pages/SavedJobsPage", () => ({ default: ({ savedJobs, onOpenJobDetails }) => <div>
  <h1>Saved jobs page</h1>
  {savedJobs.map((job) => <button key={job.id} onClick={() => onOpenJobDetails(job)}>Open saved {job.title}</button>)}
</div> }));
vi.mock("./pages/DashboardPage", () => ({ default: () => <h1>Dashboard page</h1> }));
vi.mock("./pages/MarketAnalyticsPage", () => ({ default: () => <h1>Analytics page</h1> }));
vi.mock("./pages/IngestionLogsPage", () => ({ default: () => <h1>Ingestion page</h1> }));
vi.mock("./pages/CompanyJobsPage", () => ({ default: ({ companyJobs, onStartEditJob, onFetchRemotiveJobs }) => <div>
  <h1>Company jobs page</h1>
  {companyJobs.map((job) => <button key={job.id} onClick={() => onStartEditJob(job)}>Edit {job.title}</button>)}
  <button onClick={onFetchRemotiveJobs}>Import jobs</button>
</div> }));
vi.mock("./pages/AddJobPage", () => ({ default: ({ editingJob, onAddJob, onUpdateJob }) => <div>
  <h1>{editingJob ? `Edit ${editingJob.title}` : "Add job page"}</h1>
  <button onClick={() => editingJob ? onUpdateJob(editingJob.id, editingJob) : onAddJob({ title: "Created" })}>Save job fixture</button>
</div> }));
vi.mock("./components/GoogleSignInButton", () => ({ default: ({ onCode }) =>
  <button onClick={() => onCode("test-google-code")}>Continue with Google</button> }));

const job = { id: 42, title: "Frontend Developer", company: "Example", country: "SA", city: "Riyadh",
  type: "Remote", salary: "Negotiable", link: "https://example.com/job", description: "Build interfaces.", owner_id: 1 };
const user = (role) => ({ id: 1, name: "Test User", email: "test@example.com", role, email_verified: true, has_password: true });
let router;

function mount(path = "/", role = null) {
  if (role) {
    localStorage.setItem("mihna_token", "test-token");
    api.getCurrentUser.mockResolvedValue(user(role));
  }
  router = createMemoryRouter([{ path: "*", element: <App /> }], { initialEntries: [path] });
  render(<RouterProvider router={router} />);
  return router;
}

async function navigate(to) {
  await act(async () => { await router.navigate(to); });
}

beforeEach(() => {
  vi.resetAllMocks();
  localStorage.clear();
  vi.spyOn(window, "alert").mockImplementation(() => {});
  api.getJobs.mockImplementation(async (filters = {}) => ({ items: [job], page: filters.page || 1,
    total: 20, total_pages: 2, page_size: 10 }));
  api.getJobById.mockResolvedValue(job);
  api.getSavedJobs.mockResolvedValue([job]);
  api.getCompanyJobs.mockResolvedValue([job]);
  api.getIngestionLogs.mockResolvedValue([]);
  api.getAnalyticsSummary.mockResolvedValue({});
});

afterEach(() => {
  cleanup();
  router?.dispose();
});

describe("URL navigation", () => {
  it("renders Discover Jobs at / and replaces unknown routes", async () => {
    mount("/not-a-page");
    await screen.findByRole("heading", { name: "Discover Jobs" });
    expect(router.state.location.pathname).toBe("/");
    expect(router.state.historyAction).toBe("REPLACE");
  });

  it("pushes sidebar navigation and follows Back and Forward", async () => {
    mount("/", "job_seeker");
    await screen.findByRole("button", { name: "Saved Jobs" });
    fireEvent.click(screen.getByRole("button", { name: "Saved Jobs" }));
    await screen.findByRole("heading", { name: "Saved jobs page" });
    expect(router.state.location.pathname).toBe("/saved");
    expect(router.state.historyAction).toBe("PUSH");
    await navigate(-1);
    await screen.findByRole("heading", { name: "Discover Jobs" });
    await navigate(1);
    await screen.findByRole("heading", { name: "Saved jobs page" });
    expect(screen.getByRole("button", { name: "Saved Jobs" }).getAttribute("aria-current")).toBe("page");
  });

  it("navigates the header and keeps theme switching available", async () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: "Login" }));
    await screen.findByRole("heading", { name: "Welcome back" });
    expect(router.state.location.pathname).toBe("/login");
    fireEvent.click(screen.getByRole("button", { name: "Switch to light mode" }));
    expect(localStorage.getItem("mihna_theme")).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: "Create an account" }));
    await screen.findByRole("heading", { name: "Create your account" });
    expect(router.state.location.pathname).toBe("/register");
    await navigate(-1);
    await screen.findByRole("heading", { name: "Welcome back" });
  });

  it("preserves search, filters, and result page while navigating away and back", async () => {
    mount();
    await screen.findByRole("button", { name: `Open ${job.title}` });
    fireEvent.change(screen.getByPlaceholderText("Search jobs, companies, skills..."), { target: { value: "React" } });
    fireEvent.click(screen.getByRole("button", { name: "Filter remote" }));
    await waitFor(() => expect(api.getJobs).toHaveBeenCalledWith(expect.objectContaining({ search: "React", type: "Remote" })), { timeout: 2000 });
    fireEvent.click(screen.getByRole("button", { name: "Next results" }));
    await waitFor(() => expect(screen.getByTestId("listing-state").textContent).toBe("React:Remote:2"));
    fireEvent.click(screen.getByRole("button", { name: `Open ${job.title}` }));
    await screen.findByRole("heading", { name: job.title });
    await navigate(-1);
    expect(screen.getByTestId("listing-state").textContent).toBe("React:Remote:2");
  });
});

describe("role protection and session restoration", () => {
  it.each([
    [null, "/saved"], [null, "/account"], [null, "/dashboard"],
    ["job_seeker", "/dashboard"], ["job_seeker", "/analytics"], ["job_seeker", "/add-job"],
    ["job_seeker", "/company-jobs"], ["job_seeker", "/ingestion-logs"],
    ["company", "/saved"], ["company", "/login"], ["job_seeker", "/register"],
  ])("redirects %s away from %s", async (role, path) => {
    mount(path, role);
    await screen.findByRole("heading", { name: "Discover Jobs" });
    expect(router.state.location.pathname).toBe("/");
    expect(router.state.historyAction).toBe("REPLACE");
  });

  it.each([
    ["job_seeker", "/account", "My Account"], ["company", "/account", "My Account"],
    ["job_seeker", "/saved", "Saved jobs page"], ["company", "/dashboard", "Dashboard page"],
    ["company", "/analytics", "Analytics page"], ["company", "/add-job", "Add job page"],
    ["company", "/company-jobs", "Company jobs page"], ["company", "/ingestion-logs", "Ingestion page"],
  ])("restores %s directly at %s", async (role, path, heading) => {
    mount(path, role);
    await screen.findByRole("heading", { name: heading });
    expect(router.state.location.pathname).toBe(path);
  });

  it("does not redirect a protected deep link before the saved session resolves", async () => {
    let resolve;
    localStorage.setItem("mihna_token", "test-token");
    api.getCurrentUser.mockReturnValue(new Promise((done) => { resolve = done; }));
    mount("/account");
    expect(screen.getByText("Loading your account...")).toBeTruthy();
    expect(router.state.location.pathname).toBe("/account");
    await act(async () => { resolve(user("job_seeker")); });
    await screen.findByRole("heading", { name: "My Account" });
    expect(router.state.location.pathname).toBe("/account");
  });

  it("redirects an expired saved session to Discover Jobs", async () => {
    localStorage.setItem("mihna_token", "expired");
    api.getCurrentUser.mockRejectedValue(new Error("Expired session"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    mount("/account");
    await screen.findByRole("heading", { name: "Discover Jobs" });
    expect(localStorage.getItem("mihna_token")).toBeNull();
  });
});

describe("job details and mutation navigation", () => {
  it("loads a direct /job/:id link without selected-job state", async () => {
    mount("/job/42");
    await screen.findByRole("heading", { name: job.title });
    expect(api.getJobById).toHaveBeenCalledWith("42", expect.any(AbortSignal));
    fireEvent.click(screen.getByRole("button", { name: "Back to jobs" }));
    await screen.findByRole("heading", { name: "Discover Jobs" });
    expect(router.state.location.pathname).toBe("/");
  });

  it("returns from a saved job to Saved Jobs and supports Forward", async () => {
    mount("/saved", "job_seeker");
    fireEvent.click(await screen.findByRole("button", { name: `Open saved ${job.title}` }));
    await screen.findByRole("heading", { name: job.title });
    expect(router.state.location.pathname).toBe("/job/42");
    fireEvent.click(screen.getByRole("button", { name: "Back to jobs" }));
    await screen.findByRole("heading", { name: "Saved jobs page" });
    await navigate(1);
    await screen.findByRole("heading", { name: job.title });
  });

  it("handles missing and malformed job links", async () => {
    api.getJobById.mockResolvedValue(null);
    mount("/job/999");
    await screen.findByRole("heading", { name: "Job not found" });
    await navigate("/job/not-an-id");
    await screen.findByRole("heading", { name: "Discover Jobs" });
  });

  it("retries failed job loads", async () => {
    api.getJobById.mockRejectedValueOnce(new Error("Temporary failure"));
    mount("/job/42");
    await screen.findByText("Temporary failure");
    fireEvent.click(screen.getByRole("button", { name: "Retry" }));
    await screen.findByRole("heading", { name: job.title });
  });

  it("keeps editing in its history entry and opens a fresh Add Job from navigation", async () => {
    mount("/company-jobs", "company");
    fireEvent.click(await screen.findByRole("button", { name: `Edit ${job.title}` }));
    await screen.findByRole("heading", { name: `Edit ${job.title}` });
    expect(router.state.location.pathname).toBe("/add-job");
    await navigate(-1);
    await screen.findByRole("heading", { name: "Company jobs page" });
    await navigate(1);
    await screen.findByRole("heading", { name: `Edit ${job.title}` });
    fireEvent.click(screen.getByRole("button", { name: "Post a Job" }));
    await screen.findByRole("heading", { name: "Add job page" });
  });

  it("ignores stale job responses after moving to another job URL", async () => {
    let finishFirst;
    api.getJobById.mockImplementation((id) => id === "42"
      ? new Promise((resolve) => { finishFirst = resolve; })
      : Promise.resolve({ ...job, id: 43, title: "Second job" }));
    mount("/job/42");
    await navigate("/job/43");
    await screen.findByRole("heading", { name: "Second job" });
    await act(async () => { finishFirst(job); });
    expect(screen.queryByRole("heading", { name: job.title })).toBeNull();
    expect(router.state.location.pathname).toBe("/job/43");
  });

  it("handles jobs with no description", async () => {
    api.getJobById.mockResolvedValue({ ...job, description: "" });
    mount("/job/42");
    await screen.findByText("No description was provided for this opportunity.");
  });

  it.each([false, true])("only leaves job details after successful deletion: %s", async (succeeds) => {
    if (succeeds) api.deleteJobById.mockResolvedValue({});
    else api.deleteJobById.mockRejectedValue(new Error("Deletion failed"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    mount("/job/42", "company");
    fireEvent.click(await screen.findByRole("button", { name: /Delete/i }));
    await waitFor(() => expect(api.deleteJobById).toHaveBeenCalledWith(42, "test-token"));
    if (succeeds) {
      await screen.findByRole("heading", { name: "Discover Jobs" });
      expect(router.state.location.pathname).toBe("/");
    } else {
      await waitFor(() => expect(window.alert).toHaveBeenCalledWith("Deletion failed"));
      expect(router.state.location.pathname).toBe("/job/42");
    }
  });

  it("returns a saved edit to Discover Jobs and keeps the updated list", async () => {
    api.updateJobById.mockResolvedValue({ ...job, title: "Updated job" });
    mount("/company-jobs", "company");
    fireEvent.click(await screen.findByRole("button", { name: `Edit ${job.title}` }));
    fireEvent.click(await screen.findByRole("button", { name: "Save job fixture" }));
    await screen.findByRole("heading", { name: "Discover Jobs" });
    await screen.findByRole("button", { name: "Open Updated job" });
    expect(router.state.location.pathname).toBe("/");
  });

  it("keeps Discover Jobs usable after an import", async () => {
    api.fetchRemotiveJobs.mockResolvedValue({ added: 1, skipped_duplicates: 0 });
    mount("/company-jobs", "company");
    fireEvent.click(await screen.findByRole("button", { name: "Import jobs" }));
    await waitFor(() => expect(api.fetchRemotiveJobs).toHaveBeenCalledWith("test-token"));
    await waitFor(() => expect(api.getCompanyJobs).toHaveBeenCalledTimes(2));
    fireEvent.click(screen.getByRole("button", { name: "Discover Jobs" }));
    await screen.findByRole("heading", { name: "Discover Jobs" });
    await screen.findByRole("button", { name: `Open ${job.title}` });
  });
});

describe("authentication navigation", () => {
  it.each(["email", "google"])("returns %s login to Discover Jobs", async (method) => {
    const result = { access_token: "new-token", user: user("job_seeker") };
    api.loginUser.mockResolvedValue(result);
    api.loginWithGoogle.mockResolvedValue(result);
    api.getCurrentUser.mockResolvedValue(result.user);
    mount("/login");
    if (method === "google") {
      fireEvent.click(screen.getByRole("button", { name: "Continue with Google" }));
    } else {
      fireEvent.change(screen.getByLabelText("Email"), { target: { value: "test@example.com" } });
      fireEvent.change(screen.getByLabelText("Password"), { target: { value: "test-password" } });
      fireEvent.click(screen.getByRole("button", { name: "Sign in", exact: true }));
    }
    await screen.findByRole("heading", { name: "Discover Jobs" });
    expect(router.state.location.pathname).toBe("/");
    expect(localStorage.getItem("mihna_token")).toBe("new-token");
  });

  it("logs out to / and denies protected history entries afterward", async () => {
    mount("/saved", "job_seeker");
    await screen.findByRole("heading", { name: "Saved jobs page" });
    await navigate("/account");
    await screen.findByRole("heading", { name: "My Account" });
    fireEvent.click(within(screen.getByRole("banner")).getByRole("button", { name: "Test User job seeker" }));
    fireEvent.click(screen.getByRole("menuitem", { name: "Log out" }));
    await screen.findByRole("heading", { name: "Discover Jobs" });
    expect(localStorage.getItem("mihna_token")).toBeNull();
    await navigate(-1);
    await waitFor(() => expect(router.state.location.pathname).toBe("/"));
    expect(screen.queryByRole("heading", { name: "Saved jobs page" })).toBeNull();
  });

  it("keeps password recovery accessible within Login", async () => {
    mount("/login");
    fireEvent.click(screen.getByRole("button", { name: "Forgot password?" }));
    expect(screen.getByText("Reset your password")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "Back to sign in" }));
    await screen.findByRole("heading", { name: "Welcome back" });
    expect(router.state.location.pathname).toBe("/login");
  });
});

describe("BrowserRouter history and mobile navigation", () => {
  it("responds to native history.back() and history.forward()", async () => {
    window.history.replaceState(null, "", "/");
    render(<BrowserRouter><App /></BrowserRouter>);
    await screen.findByRole("heading", { name: "Discover Jobs" });
    fireEvent.click(screen.getByRole("button", { name: "Login" }));
    await screen.findByRole("heading", { name: "Welcome back" });
    expect(window.location.pathname).toBe("/login");
    fireEvent.click(screen.getByRole("button", { name: "Create an account" }));
    await screen.findByRole("heading", { name: "Create your account" });
    expect(window.location.pathname).toBe("/register");
    await act(async () => { window.history.back(); });
    await screen.findByRole("heading", { name: "Welcome back" });
    expect(window.location.pathname).toBe("/login");
    await act(async () => { window.history.forward(); });
    await screen.findByRole("heading", { name: "Create your account" });
    expect(window.location.pathname).toBe("/register");
  });

  it("restores the current job URL when the application remounts", async () => {
    window.history.replaceState(null, "", "/job/42");
    const first = render(<BrowserRouter><App /></BrowserRouter>);
    await screen.findByRole("heading", { name: job.title });
    first.unmount();
    render(<BrowserRouter><App /></BrowserRouter>);
    await screen.findByRole("heading", { name: job.title });
    expect(window.location.pathname).toBe("/job/42");
    expect(api.getJobById).toHaveBeenCalledTimes(2);
  });

  it("pushes a mobile menu destination and closes the menu", async () => {
    mount("/", "job_seeker");
    await screen.findByRole("button", { name: "Saved Jobs" });
    fireEvent.click(screen.getByRole("button", { name: "Open navigation" }));
    const menu = await screen.findByRole("dialog", { name: "Mihna navigation" });
    fireEvent.click(within(menu).getByRole("button", { name: "Saved Jobs" }));
    await screen.findByRole("heading", { name: "Saved jobs page" });
    expect(router.state.location.pathname).toBe("/saved");
    expect(router.state.historyAction).toBe("PUSH");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    await navigate(-1);
    await screen.findByRole("heading", { name: "Discover Jobs" });
  });
});
