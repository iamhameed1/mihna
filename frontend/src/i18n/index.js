import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "../locales/en/translation.json";
import ar from "../locales/ar/translation.json";

export function savedLanguage() {
  try { return localStorage.getItem("mihna_language") === "ar" ? "ar" : "en"; }
  catch { return "en"; }
}

function applyLanguage(language) {
  const selected = language === "ar" ? "ar" : "en";
  document.documentElement.lang = selected;
  document.documentElement.dir = selected === "ar" ? "rtl" : "ltr";
  try { localStorage.setItem("mihna_language", selected); } catch { /* Storage can be unavailable. */ }
}

i18n.use(initReactI18next).init({
  resources: { en: { translation: en }, ar: { translation: ar } },
  lng: savedLanguage(),
  fallbackLng: "en",
  supportedLngs: ["en", "ar"],
  keySeparator: false,
  nsSeparator: false,
  interpolation: {
    escapeValue: false,
    alwaysFormat: true,
    format: (value, _format, language) => typeof value === "number"
      ? new Intl.NumberFormat(language === "ar" ? "ar-SA" : "en-US").format(value)
      : value,
  },
});
applyLanguage(i18n.language);
i18n.on("languageChanged", applyLanguage);

// English phrases are stable UI keys; job content never passes through this function.
const originalKeys = new Map(Object.entries(ar).map(([key, value]) => [value, key]));
export const t = (key, options) => i18n.t(originalKeys.get(key) || key, options);
export function localizeMessage(message) {
  if (!message) return message;
  if (typeof message === "object" && message.key) return t(message.key, message.values);
  const key = originalKeys.get(message) || message;
  if (i18n.exists(key)) return t(key);
  return i18n.language === "ar" ? t("Something went wrong. Please try again.") : message;
}
export const locale = () => i18n.language === "ar" ? "ar-SA" : "en-US";
export const formatNumber = (value, options = {}) => new Intl.NumberFormat(locale(), options).format(value);
export default i18n;
