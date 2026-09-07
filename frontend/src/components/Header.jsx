import { useEffect, useRef, useState } from "react";

import {
  Bell,
  LogIn,
  LogOut,
  Menu,
  Moon,
  Search,
  Sun,
  UserRound,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function Header({
  searchTerm,
  setSearchTerm,
  currentUser,
  onLogout,
  setPage,
  theme,
  onToggleTheme,
  onOpenMobileMenu,
}) {
  const [profileOpen, setProfileOpen] = useState(false);
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
    setPage("account");
  }

  function handleLogoutClick() {
    setProfileOpen(false);
    onLogout();
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 md:px-6">
      {/* Mobile menu */}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={onOpenMobileMenu}
        aria-label="Open navigation"
      >
        <Menu className="size-5" />
      </Button>

      {/* Mobile brand */}
      <button
        type="button"
        onClick={() => setPage("home")}
        className="mr-1 text-base font-semibold tracking-tight md:hidden"
      >
        Mihna
      </button>

      {/* Global search */}
      <div className="relative hidden w-full max-w-xl sm:block">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />

        <Input
          type="search"
          placeholder="Search jobs, companies, skills..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          className="h-9 bg-muted/40 pl-9"
        />
      </div>

      {/* Header actions */}
      <div className="ml-auto flex items-center gap-1.5">
        {/* Mobile search */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="sm:hidden"
          onClick={() => setPage("home")}
          aria-label="Search jobs"
        >
          <Search className="size-5" />
        </Button>

        {/* Theme toggle */}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={onToggleTheme}
          aria-label={
            theme === "dark"
              ? "Switch to light mode"
              : "Switch to dark mode"
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
              aria-label="Notifications"
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

                <div className="hidden min-w-0 text-left lg:block">
                  <div className="max-w-32 truncate text-sm font-medium">
                    {currentUser.name}
                  </div>

                  <div className="text-xs capitalize text-muted-foreground">
                    {currentUser.role?.replace("_", " ")}
                  </div>
                </div>
              </button>

              {/* Dropdown */}
              {profileOpen && (
                <div
                  role="menu"
                  className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border bg-popover p-1 text-popover-foreground shadow-lg"
                >
                  {/* User information */}
                  <div className="px-3 py-2">
                    <div className="truncate text-sm font-medium">
                      {currentUser.name}
                    </div>

                    <div className="mt-0.5 text-xs capitalize text-muted-foreground">
                      {currentUser.role?.replace("_", " ")}
                    </div>
                  </div>

                  <div className="my-1 h-px bg-border" />

                  {/* Account */}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleAccountClick}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground"
                  >
                    <UserRound className="size-4" />
                    Account
                  </button>

                  <div className="my-1 h-px bg-border" />

                  {/* Logout */}
                  <button
                    type="button"
                    role="menuitem"
                    onClick={handleLogoutClick}
                    className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-destructive transition-colors hover:bg-destructive/10"
                  >
                    <LogOut className="size-4" />
                    Log out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          /* Guest actions */
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setPage("login")}
              className="hidden sm:inline-flex"
            >
              <LogIn className="size-4" />
              Login
            </Button>

            <Button
              type="button"
              size="sm"
              onClick={() => setPage("register")}
            >
              Register
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}

export default Header;