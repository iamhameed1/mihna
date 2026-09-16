import { afterEach, expect, it, vi } from "vitest";
import { exportAnalyticsCsv, exportJobsCsv, getAnalyticsSummary, getJobs } from "./api";

afterEach(() => vi.restoreAllMocks());

it("shares filters across listing, analytics and exports while limiting pagination to listing", async () => {
  const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: true, json: async () => ({}) });
  const open = vi.spyOn(window, "open").mockImplementation(() => {});
  const filters = { search: "data & AI", type: "Remote", location: "Riyadh", source: "manual", dateRange: "7d", sort: "oldest", page: 2, pageSize: 5 };
  await getJobs(filters);
  await getAnalyticsSummary(filters);
  exportJobsCsv(filters);
  exportAnalyticsCsv(filters);
  const urls = [...fetch.mock.calls, ...open.mock.calls].map(([url]) => new URL(url, "http://localhost"));
  expect(urls.map(url => url.pathname)).toEqual(["/api/jobs", "/api/analytics/summary", "/api/jobs/export/csv", "/api/analytics/export/csv"]);
  for (const [index, url] of urls.entries()) {
    expect(Object.fromEntries(url.searchParams)).toEqual({ search: "data & AI", type: "Remote", location: "Riyadh", source: "manual", date_range: "7d", ...(index === 0 ? { sort: "oldest", page: "2", page_size: "5" } : {}) });
  }
});

it("omits default filter values and the empty query delimiter", async () => {
  const fetch = vi.spyOn(globalThis, "fetch").mockResolvedValue({ ok: true, json: async () => ({}) });
  await getJobs({ search: "", type: "All", location: "All", source: "All", dateRange: "All", sort: "newest" });
  expect(fetch).toHaveBeenCalledWith("/api/jobs");
});
