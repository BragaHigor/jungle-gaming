"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog } from "radix-ui";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

import { LanguageSwitcher } from "@/components/language-switcher";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import { profile } from "@/content/profile";
import type { Theme } from "@/lib/theme";

const navigation = [
  { href: "/", label: "navigation.about" },
  { href: "/play", label: "navigation.play" },
  { href: "/project", label: "navigation.project" },
] as const;

export function SiteHeader({ theme }: { theme: Theme }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const desktop = window.matchMedia("(min-width: 48rem)");
    function closeOnDesktop(event: MediaQueryListEvent) {
      if (event.matches) setOpen(false);
    }
    desktop.addEventListener("change", closeOnDesktop);
    return () => desktop.removeEventListener("change", closeOnDesktop);
  }, []);

  function navigationLinks(mobile = false) {
    return navigation.map(({ href, label }) => (
      <Link
        key={href}
        href={href}
        className={mobile ? "mobile-nav-link" : "nav-link"}
        aria-current={pathname === href ? "page" : undefined}
        onClick={() => setOpen(false)}
      >
        {t(label)}
        {mobile && <Icon name="arrow" />}
      </Link>
    ));
  }

  return (
    <header className="site-header">
      <div className="site-container header-inner">
        <Link
          href="/"
          className="brand"
          aria-label={t("navigation.home", { name: profile.name })}
        >
          <span className="brand-mark" aria-hidden="true">
            {profile.initials}
          </span>
          <span>{profile.name}</span>
        </Link>
        <nav className="desktop-navigation" aria-label={t("navigation.label")}>
          {navigationLinks()}
        </nav>
        <div className="header-controls">
          <ThemeToggle initialTheme={theme} />
          <div className="desktop-language">
            <LanguageSwitcher compact />
          </div>
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="desktop-github"
          >
            <a
              href={profile.github}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={t("navigation.github")}
            >
              <Icon name="github" />
            </a>
          </Button>
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="mobile-menu-trigger"
                aria-label={t("navigation.openMenu")}
              >
                <Icon name="menu" />
              </Button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="menu-overlay" />
              <Dialog.Content
                className="mobile-menu"
                aria-describedby={undefined}
              >
                <div className="flex items-center justify-between gap-4">
                  <Dialog.Title className="text-2xl font-semibold">
                    {t("navigation.label")}
                  </Dialog.Title>
                  <Dialog.Close asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t("navigation.closeMenu")}
                    >
                      <Icon name="close" />
                    </Button>
                  </Dialog.Close>
                </div>
                <nav
                  aria-label={t("navigation.label")}
                  className="mt-6 flex flex-col"
                >
                  {navigationLinks(true)}
                </nav>
                <div className="mobile-menu-actions mt-8">
                  <LanguageSwitcher />
                  <Button asChild variant="outline">
                    <a
                      href={profile.github}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Icon name="github" />
                      {t("social.github")}
                    </a>
                  </Button>
                </div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
    </header>
  );
}
