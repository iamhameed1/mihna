import {
  BriefcaseBusiness,
  Building2,
  ChartNoAxesCombined,
  CircleUserRound,
  Database,
  Heart,
  Home,
  LayoutDashboard,
  Plus,
} from "lucide-react";

const mainItems = [
  {
    id: "home",
    label: "Discover Jobs",
    icon: Home,
    roles: ["guest", "job_seeker", "company"],
  },
  {
    id: "saved",
    label: "Saved Jobs",
    icon: Heart,
    roles: ["job_seeker"],
  },
];

const companyItems = [
  {
    id: "company-jobs",
    label: "My Jobs",
    icon: BriefcaseBusiness,
  },
  {
    id: "add-job",
    label: "Post a Job",
    icon: Plus,
  },
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
  },
  {
    id: "analytics",
    label: "Market Analytics",
    icon: ChartNoAxesCombined,
  },
  {
    id: "ingestion-logs",
    label: "Data Ingestion",
    icon: Database,
  },
];

function NavButton({ item, page, setPage }) {
  const Icon = item.icon;
  const active = page === item.id;

  return (
    <button
      type="button"
      onClick={() => setPage(item.id)}
      className={[
        "group flex w-full items-center gap-3 rounded-lg px-3 py-2.5",
        "text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground shadow-sm"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      ].join(" ")}
    >
      <Icon
        className="size-[18px] shrink-0"
        strokeWidth={active ? 2.25 : 1.9}
      />

      <span className="truncate">{item.label}</span>
    </button>
  );
}

function Sidebar({ page, setPage, currentUser }) {
  const role = currentUser?.role || "guest";
  const isCompany = role === "company";

  const visibleMainItems = mainItems.filter((item) =>
    item.roles.includes(role)
  );

  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 border-r bg-sidebar md:flex md:flex-col">
      {/* Brand */}
      <div className="flex h-16 shrink-0 items-center border-b px-5">
        <button
          type="button"
          onClick={() => setPage("home")}
          className="flex items-center gap-3"
          aria-label="Go to Mihna home"
        >
          <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <Building2 className="size-5" />
          </div>

          <div className="text-left">
            <div className="text-base font-semibold tracking-tight text-foreground">
              Mihna
            </div>

            <div className="text-[11px] font-medium text-muted-foreground">
              Job Intelligence
            </div>
          </div>
        </button>
      </div>

      {/* Navigation */}
      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-5">
        <div className="space-y-1">
          {visibleMainItems.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              page={page}
              setPage={setPage}
            />
          ))}
        </div>

        {isCompany && (
          <div className="mt-7">
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">
              Company Workspace
            </p>

            <div className="space-y-1">
              {companyItems.map((item) => (
                <NavButton
                  key={item.id}
                  item={item}
                  page={page}
                  setPage={setPage}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Account */}
      {currentUser && (
        <div className="shrink-0 border-t p-3">
          <button
            type="button"
            onClick={() => setPage("account")}
            className={[
              "flex w-full items-center gap-3 rounded-lg px-3 py-2.5",
              "text-sm font-medium transition-colors",
              page === "account"
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
            ].join(" ")}
          >
            <CircleUserRound className="size-[18px] shrink-0" />

            <div className="min-w-0 text-left">
              <div className="truncate text-sm text-foreground">
                {currentUser.name}
              </div>

              <div className="truncate text-xs font-normal capitalize text-muted-foreground">
                {currentUser.role?.replace("_", " ")}
              </div>
            </div>
          </button>
        </div>
      )}
    </aside>
  );
}

export default Sidebar;