import { useTranslation } from "react-i18next";
import { t } from "@/i18n";
import { Navigate, Outlet } from "react-router-dom";

export default function RouteAccess({ currentUser, authLoading, roles }) {
  useTranslation();
  if (authLoading) {
    return <p role="status" className="rounded-xl border bg-card px-4 py-3 text-sm text-muted-foreground">{t("Loading your account...")}</p>;
  }
  const role = currentUser?.role || "guest";
  return roles.includes(role) ? <Outlet /> : <Navigate to="/" replace />;
}
