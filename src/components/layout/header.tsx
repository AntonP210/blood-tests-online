"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { Button } from "@/components/ui/button";
import { TestTubeDiagonal, Menu, X, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { LanguageSwitcher } from "./language-switcher";
import type { User } from "@supabase/supabase-js";

export function Header() {
  const t = useTranslations("common");
  const tAuth = useTranslations("auth");
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState<User | null>(null);

  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUser(data.user));

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase.auth]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setMenuOpen(false);
    window.location.href = "/";
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:h-16 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground sm:h-8 sm:w-8">
            <TestTubeDiagonal className="h-4 w-4" />
          </div>
          <span className="text-base font-bold tracking-tight sm:text-lg">
            {t("appName")}
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-4 sm:flex">
          <LanguageSwitcher />
          <Link
            href="/pricing"
            className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
          >
            {t("pricing")}
          </Link>
          {user ? (
            <>
              <Button
                render={<Link href="/analyze" />}
                size="sm"
                className="rounded-full px-5 font-semibold"
              >
                {t("analyze")}
              </Button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <LogOut className="h-3.5 w-3.5" />
                {tAuth("logout")}
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                {tAuth("loginButton")}
              </Link>
              <Button
                render={<Link href="/register" />}
                size="sm"
                className="rounded-full px-5 font-semibold"
              >
                {tAuth("registerButton")}
              </Button>
            </>
          )}
        </nav>

        {/* Mobile hamburger */}
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          aria-expanded={menuOpen}
          className="flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground hover:text-foreground sm:hidden"
        >
          {menuOpen ? (
            <X className="h-5 w-5" />
          ) : (
            <Menu className="h-5 w-5" />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="border-t border-border/50 bg-background px-4 pb-4 pt-3 sm:hidden">
          <nav className="flex flex-col gap-3">
            <LanguageSwitcher />
            <Link
              href="/pricing"
              onClick={() => setMenuOpen(false)}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              {t("pricing")}
            </Link>
            {user ? (
              <>
                <Button
                  render={<Link href="/analyze" />}
                  onClick={() => setMenuOpen(false)}
                  size="sm"
                  className="w-full rounded-full font-semibold"
                >
                  {t("analyze")}
                </Button>
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  {tAuth("logout")}
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/login"
                  onClick={() => setMenuOpen(false)}
                  className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                >
                  {tAuth("loginButton")}
                </Link>
                <Button
                  render={<Link href="/register" />}
                  onClick={() => setMenuOpen(false)}
                  size="sm"
                  className="w-full rounded-full font-semibold"
                >
                  {tAuth("registerButton")}
                </Button>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
