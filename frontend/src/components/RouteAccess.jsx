import { Navigate, Outlet } from "react-router-dom";

export default function RouteAccess({ currentUser, authLoading, roles }) {
  if (authLoading) {
    return <p role="status" className="rounded-xl border bg-card px-4 py-3 text-sm text-muted-foreground">Loading your account...</p>;
  }
  const role = currentUser?.role || "guest";
  return roles.includes(role) ? <Outlet /> : <Navigate to="/" replace />;
}
