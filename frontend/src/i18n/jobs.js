import { locale, t } from "./index";

const locations = new Set(["Saudi Arabia", "Riyadh", "Jeddah", "Madinah", "Medina", "Makkah", "Mecca", "Dammam",
  "USA", "United States", "United Kingdom", "United Arab Emirates", "Dubai", "Abu Dhabi", "Egypt", "Cairo",
  "Jordan", "Kuwait", "Qatar", "Bahrain", "Oman", "Worldwide", "Remote"]);
export function localizeLocation(value) {
  if (!value) return value;
  const normalized = [...locations].find(name => name.toLowerCase() === value.trim().toLowerCase());
  return normalized ? t(normalized) : value;
}
export function localizeWorkType(value) {
  return ["Remote", "Hybrid", "Onsite"].includes(value) ? t(value) : value;
}
export function formatSalary(value, currency) {
  if (value == null || value === "") return t("Salary not specified");
  if (currency && typeof value === "number") {
    return new Intl.NumberFormat(locale(), { style: "currency", currency }).format(value);
  }
  // Salary is currently free text. Never guess currency, parse ranges, or change its value.
  return ["Not specified", "Negotiable"].includes(value) ? t(value) : value;
}
