import { useTranslation } from "react-i18next";
import i18n, { t } from "@/i18n";
import { useLocation, useNavigate } from "react-router-dom";
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

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

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

function MobileNavItem({ item, onNavigate }) {
  useTranslation();
  const { pathname } = useLocation();
  const Icon = item.icon;
  const path = item.id === "home" ? "/" : `/${item.id}`;
  const active = pathname === path;

  return (
    <button
      type="button"
      onClick={() => onNavigate(path)}
      aria-current={active ? "page" : undefined}
      className={[
        "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors",
        active
          ? "bg-primary text-primary-foreground"
          : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
      ].join(" ")}
    >
      <Icon className="size-5 shrink-0" />
      <span>{t(item.label)}</span>
    </button>
  );
}

function MobileNav({
  open,
  onOpenChange,
  currentUser,
}) {
  useTranslation();
  const navigate = useNavigate();
  const role = currentUser?.role || "guest";
  const isCompany = role === "company";

  const visibleMainItems = mainItems.filter((item) =>
    item.roles.includes(role)
  );

  function handleNavigate(path) {
    navigate(path);
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side={i18n.dir() === "rtl" ? "right" : "left"} className="w-[86vw] max-w-80 p-0">
        <SheetHeader className="border-b p-5">
          <SheetTitle className="sr-only">{t("Mihna navigation")}</SheetTitle>

          <button
            type="button"
            onClick={() => handleNavigate("/")}
            className="flex items-center gap-3 text-start"
          >
            <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Building2 className="size-5" />
            </div>

            <div>
              <div className="font-semibold tracking-tight">{t("Mihna")}</div>
              <div className="text-xs text-muted-foreground">{t("Job Intelligence")}</div>
            </div>
          </button>
        </SheetHeader>

        <div className="flex h-full flex-col overflow-y-auto p-3">
          <nav className="space-y-1">
            {visibleMainItems.map((item) => (
              <MobileNavItem
                key={item.id}
                item={item}
                onNavigate={handleNavigate}
              />
            ))}
          </nav>

          {isCompany && (
            <div className="mt-6">
              <div className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{t("Company Workspace")}</div>

              <nav className="space-y-1">
                {companyItems.map((item) => (
                  <MobileNavItem
                    key={item.id}
                    item={item}
                    onNavigate={handleNavigate}
                  />
                ))}
              </nav>
            </div>
          )}

          {currentUser && (
            <div className="mt-auto border-t pt-3">
              <MobileNavItem
                item={{
                  id: "account",
                  label: t("Account"),
                  icon: CircleUserRound,
                }}
                onNavigate={handleNavigate}
              />
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default MobileNav;
