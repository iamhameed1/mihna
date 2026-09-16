// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import i18n, { savedLanguage, t, formatNumber, localizeMessage } from "./i18n";
import { formatSalary } from "./i18n/jobs";
import Header from "./components/Header";
import JobCard from "./components/JobCard";
import AddJobPage from "./pages/AddJobPage";
import RegisterPage from "./pages/RegisterPage";
import HomePage from "./pages/HomePage";
import SavedJobsPage from "./pages/SavedJobsPage";
import CompanyJobsPage from "./pages/CompanyJobsPage";
import JobDetailsPage from "./pages/JobDetailsPage";
import DashboardPage from "./pages/DashboardPage";
import MarketAnalyticsPage from "./pages/MarketAnalyticsPage";
import IngestionLogsPage from "./pages/IngestionLogsPage";
import en from "./locales/en/translation.json";
import ar from "./locales/ar/translation.json";

const job = { id: 1, title: "Data Engineer", description: "Build data platforms.",
  company: "Remote", city: "Riyadh", country: "Saudi Arabia", type: "Remote",
  salary: "SAR 12,000 – 16,000", link: "https://example.com/job", owner_id: 7, created_at: "2026-09-01T12:00:00Z" };

beforeEach(async () => { localStorage.clear(); await i18n.changeLanguage("en"); });
afterEach(async () => { cleanup(); await i18n.changeLanguage("en"); });
const switchTo = async (language) => act(async () => { await i18n.changeLanguage(language); });

describe("language preferences and accessible switcher", () => {
  it("defaults to English, rejects unsupported saved preferences and restores Arabic", async () => {
    localStorage.clear();
    expect(savedLanguage()).toBe("en");
    expect(document.documentElement.lang).toBe("en");
    expect(document.documentElement.dir).toBe("ltr");
    localStorage.setItem("mihna_language", "fr");
    expect(savedLanguage()).toBe("en");
    await switchTo("ar");
    expect(savedLanguage()).toBe("ar");
    // Reload the initialization module to exercise startup with a persisted preference.
    vi.resetModules();
    const restarted = await import("./i18n/index.js");
    expect(restarted.default.language).toBe("ar");
    expect(document.documentElement.dir).toBe("rtl");
  });

  it("switches both ways immediately while preserving search and theme controls", async () => {
    const toggle = vi.fn();
    render(<MemoryRouter><Header searchTerm="Python" setSearchTerm={vi.fn()} onToggleTheme={toggle} theme="dark" /></MemoryRouter>);
    await act(async () => fireEvent.change(screen.getByRole("combobox", { name: "Language" }), { target: { value: "ar" } }));
    expect(document.documentElement.lang).toBe("ar");
    expect(document.documentElement.dir).toBe("rtl");
    expect(screen.getByDisplayValue("Python")).toBeTruthy();
    expect(localStorage.getItem("mihna_language")).toBe("ar");
    fireEvent.click(screen.getByRole("button", { name: "التبديل إلى الوضع الفاتح" }));
    expect(toggle).toHaveBeenCalledOnce();
    await act(async () => fireEvent.change(screen.getByRole("combobox", { name: "اللغة" }), { target: { value: "en" } }));
    expect(document.documentElement.dir).toBe("ltr");
    expect(screen.getByRole("button", { name: "Login" })).toBeTruthy();
  });
});

describe("dynamic job content", () => {
  it.each(["en", "ar"])("preserves Arabic originals in the %s interface", async (language) => {
    await switchTo(language);
    const original = { ...job, title: "مهندس برمجيات", description: "نبحث عن مطور للعمل معنا" };
    render(<JobDetailsPage job={original} />);
    expect(screen.getByRole("heading", { name: original.title }).getAttribute("dir")).toBe("auto");
    expect(screen.getByText(original.description)).toBeTruthy();
  });
  it("keeps original card content while localizing controls and preserving action payloads", async () => {
    const save = vi.fn();
    render(<JobCard job={job} onToggleSaveJob={save} />);
    expect(screen.getByRole("heading", { name: job.title })).toBeTruthy();
    expect(screen.getByText(job.description)).toBeTruthy();
    await switchTo("ar");
    expect(screen.getByRole("heading", { name: job.title })).toBeTruthy();
    expect(screen.getByText(job.description)).toBeTruthy();
    expect(screen.getByRole("heading", { name: job.title }).getAttribute("dir")).toBe("auto");
    expect(screen.getByText("Remote")).toBeTruthy(); // Company is a brand, not a work-type label.
    fireEvent.click(screen.getByRole("button", { name: "حفظ" }));
    expect(save).toHaveBeenCalledWith(job);
  });

  it("keeps original editing fields and unsaved changes across language switches", async () => {
    render(<AddJobPage editingJob={job} onUpdateJob={vi.fn()} />);
    const input = screen.getByDisplayValue(job.title);
    fireEvent.change(input, { target: { value: "Updated original" } });
    await switchTo("ar");
    expect(screen.getByDisplayValue("Updated original")).toBeTruthy();
    expect(screen.getByDisplayValue(job.description)).toBeTruthy();
  });

  it("submits canonical work type when creating a job in Arabic", async () => {
    await switchTo("ar");
    const create = vi.fn();
    const { container } = render(<AddJobPage onAddJob={create} />);
    for (const [name, value] of Object.entries({ title: "Data Engineer", company: "Example", country: "Saudi Arabia", city: "Riyadh", salary: "10000", link: "https://example.com", description: "Build data platforms." })) {
      fireEvent.change(container.querySelector(`[name="${name}"]`), { target: { value } });
    }
    fireEvent.submit(container.querySelector("form"));
    expect(create).toHaveBeenCalledWith(expect.objectContaining({ type: "Onsite", title: "Data Engineer" }));
  });

  it("submits the canonical company role from Arabic registration", async () => {
    await switchTo("ar");
    const register = vi.fn().mockRejectedValue(new Error("Email already registered"));
    const { container } = render(<MemoryRouter><RegisterPage onRegister={register} /></MemoryRouter>);
    fireEvent.click(screen.getByRole("button", { name: /الشركة/ }));
    for (const [name, value] of Object.entries({ name: "Example", email: "test@example.com", password: "password123" })) {
      fireEvent.change(container.querySelector(`[name="${name}"]`), { target: { value } });
    }
    await act(async () => { fireEvent.submit(container.querySelector("form")); });
    expect(register).toHaveBeenCalledWith(expect.objectContaining({ role: "company" }));
    expect(screen.getByText("البريد الإلكتروني مسجل بالفعل")).toBeTruthy();
  });
});

describe("localized page rendering", () => {
  const pages = [
    ["saved", <SavedJobsPage savedJobs={[job]} />],
    ["company", <CompanyJobsPage companyJobs={[job]} currentUser={{ id: 7, role: "company" }} />],
    ["details", <JobDetailsPage job={job} />],
    ["dashboard", <DashboardPage jobs={[job]} />],
    ["analytics", <MarketAnalyticsPage jobs={[job]} />],
    ["ingestion", <IngestionLogsPage logs={[]} />],
  ];
  it.each(pages)("renders %s in both languages", async (_name, page) => {
    const result = render(<MemoryRouter>{page}</MemoryRouter>);
    expect(result.container.textContent).not.toBe("");
    await switchTo("ar");
    expect(result.container.textContent).toMatch(/[\u0600-\u06ff]/);
    expect(result.container.textContent).not.toContain("undefined");
    if (["saved", "company", "details"].includes(_name)) {
      expect(result.container.textContent).toContain(job.title);
      expect(result.container.textContent).toContain(job.description);
    }
  });

  it("keeps canonical filter values in Arabic", async () => {
    await switchTo("ar");
    render(<HomePage jobs={[job]} savedJobs={[]} typeFilter="Remote" locationFilter="All" sourceFilter="All"
      dateRangeFilter="All" sortOption="newest" currentPage={2} totalPages={3} totalJobs={21} pageSize={10} />);
    expect(screen.getAllByText("عن بُعد").length).toBeGreaterThan(0);
    expect(screen.getByRole("heading", { name: job.title })).toBeTruthy();
    expect(screen.queryByText("Remote", { selector: '[role="option"]' })).toBeNull();
  });
});

it("has Arabic for every English key, including plural variants", () => {
  for (const key of Object.keys(en)) expect(ar[key], key).toBeTruthy();
  for (const key of Object.keys(ar)) expect(ar[key], key).toMatch(/[\u0600-\u06ff]/);
});

it("includes every static UI translation key in both catalogs", () => {
  const sources = import.meta.glob(["./pages/*.jsx", "./components/*.jsx", "./App.jsx"], { eager: true, query: "?raw", import: "default" });
  for (const [file, source] of Object.entries(sources)) {
    for (const match of source.matchAll(/\bt\(("(?:[^"\\]|\\.)*")/g)) {
      const key = JSON.parse(match[1]);
      expect(en[key] || en[key + "_other"], `${file}: ${key}`).toBeTruthy();
      expect(ar[key] || ar[key + "_other"], `${file}: ${key}`).toBeTruthy();
    }
  }
});

it("formats numbers and known currency without changing free-text salary", async () => {
  await switchTo("ar");
  expect(formatNumber(1234)).toBe(new Intl.NumberFormat("ar-SA").format(1234));
  expect(formatSalary(12000, "SAR")).toBe(new Intl.NumberFormat("ar-SA", { style: "currency", currency: "SAR" }).format(12000));
  expect(formatSalary(job.salary)).toBe(job.salary);
  expect(localizeMessage("Invalid email or password")).toBe(t("Invalid email or password"));
});
