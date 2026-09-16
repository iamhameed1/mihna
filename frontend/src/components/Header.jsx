import { useTranslation } from "react-i18next";
import i18n, { t } from "@/i18n";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Bell,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Search,
  Sun,
  UserRound,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function Header({
  searchTerm,
  setSearchTerm,
  currentUser,
  onLogout,
  theme,
  onToggleTheme,
  onOpenMobileMenu,
}) {
  useTranslation();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const profileRef = useRef(null);

  useEffect(() => {
    function handleOutsideClick(event) {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handleOutsideClick);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, []);

  function handleAccountClick() {
    setProfileOpen(false);
    navigate("/account");
  }

  function handleLogoutClick() {
    setProfileOpen(false);
    onLogout();
  }

  function handleOpenMobileSearch() {
    navigate("/");
    setMobileSearchOpen(true);
  }

  function handleCloseMobileSearch() {
    setMobileSearchOpen(false);
  }

  return (
    <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="flex h-16 items-center gap-3 px-4 md:px-6">
        {/* Mobile search mode */}
        {mobileSearchOpen ? (
          <div className="flex w-full items-center gap-2 sm:hidden">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                type="search"
                placeholder={t("Search jobs...")}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="h-10 w-full bg-muted/40 ps-9 pe-3"
                autoFocus
              />
            </div>

            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleCloseMobileSearch}
              aria-label={t("Close search")}
            >
              <X className="size-5" />
            </Button>
          </div>
        ) : (
          <>
            {/* Mobile menu */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={onOpenMobileMenu}
              aria-label={t("Open navigation")}
            >
              <Menu className="size-5" />
            </Button>

            {/* Mobile brand */}
            <button
              type="button"
              onClick={() => navigate("/")}
              className="me-1 text-base font-semibold tracking-tight md:hidden"
            >{t("Mihna")}</button>

            {/* Desktop / tablet search */}
            <div className="relative hidden w-full max-w-xl sm:block">
              <Search className="pointer-events-none absolute start-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

              <Input
                type="search"
                placeholder={t("Search jobs, companies, skills...")}
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                className="h-9 bg-muted/40 ps-9"
              />
            </div>

            {/* Header actions */}
            <div className="ms-auto flex items-center gap-1.5">
              {/* Mobile search */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="sm:hidden"
                onClick={handleOpenMobileSearch}
                aria-label={t("Search jobs")}
              >
                <Search className="size-5" />
              </Button>

              <select
                aria-label={t("Language")}
                value={i18n.language}
                onChange={(event) => i18n.changeLanguage(event.target.value)}
                className="h-9 max-w-24 rounded-md border bg-background px-1 text-xs"
              >
                <option value="en" lang="en">English</option>
                <option value="ar" lang="ar">العربية</option>
              </select>
              {/* Theme toggle */}
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onToggleTheme}
                aria-label={
                  theme === "dark"
                    ? t("Switch to light mode")
                    : t("Switch to dark mode")
                }
              >
                {theme === "dark" ? (
                  <Sun className="size-5" />
                ) : (
                  <Moon className="size-5" />
                )}
              </Button>

              {currentUser ? (
                <>
                  {/* Notifications */}
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="hidden sm:inline-flex"
                    aria-label={t("Notifications")}
                  >
                    <Bell className="size-5" />
                  </Button>

                  {/* Profile menu */}
                  <div
                    ref={profileRef}
                    className="relative"
                  >
                    <button
                      type="button"
                      onClick={() =>
                        setProfileOpen((open) => !open)
                      }
                      className="flex h-10 cursor-pointer items-center gap-2 rounded-md px-2 text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                      aria-expanded={profileOpen}
                      aria-haspopup="menu"
                    >
                      <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                        <UserRound className="size-4" />
                      </div>

                      <div className="hidden min-w-0 text-start lg:block">
                        <div className="max-w-32 truncate text-sm font-medium">
                          {currentUser.name}
                        </div>

                        <div className="text-xs capitalize text-muted-foreground">
                          {t(currentUser.role?.replace("_", " "))}
                        </div>
                      </div>
                    </button>

                    {profileOpen && (
                      <div
                        role="menu"
                        className="absolute end-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border bg-popover p-1 text-popover-foreground shadow-lg"
                      >
                        <div className="px-3 py-2">
                          <div className="truncate text-sm font-medium">
                            {currentUser.name}
                          </div>

                          <div className="mt-0.5 text-xs capitalize text-muted-foreground">
                            {t(currentUser.role?.replace("_", " "))}
                          </div>
                        </div>

                        <div className="my-1 h-px bg-border" />

                        <button
                          type="button"
                          role="menuitem"
                          onClick={handleAccountClick}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                        >
                          <UserRound className="size-4" />{t("Account")}</button>

                        <div className="my-1 h-px bg-border" />

                        <button
                          type="button"
                          role="menuitem"
                          onClick={handleLogoutClick}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-start text-sm text-destructive transition-colors hover:bg-destructive/10"
                        >
                          <LogOut className="size-4" />{t("Log out")}</button>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <Button
                  type="button"
                  size="sm"
                  onClick={() => navigate("/login")}
                >
                  <LogIn className="size-4" />{t("Login")}</Button>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}

export default Header;
