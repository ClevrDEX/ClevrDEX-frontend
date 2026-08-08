"use client"

import { ConnectButton } from "@rainbow-me/rainbowkit"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

import { useI18n, type Locale, type MessageKey } from "@/i18n"

type SiteHeaderProps = {
  activeNav: "home" | "swap" | "liquidity"
}

const NAV_ITEMS = [
  { id: "home" as const, href: "/", labelKey: "nav.home" },
  { id: "swap" as const, href: "/swap", labelKey: "nav.swap" },
  { id: "liquidity" as const, href: "/liquidity/add", labelKey: "nav.liquidity" },
] satisfies {
  id: string
  href: string
  labelKey: MessageKey
}[]

const LANDING_NAV_ITEMS = [
  { id: "product", href: "#product", labelKey: "nav.product" },
  { id: "how", href: "#how", labelKey: "nav.how" },
  { id: "usecases", href: "#usecases", labelKey: "nav.useCases" },
  { id: "faq", href: "#faq", labelKey: "nav.faq" },
] satisfies {
  id: string
  href: string
  labelKey: MessageKey
}[]

const LOCALES: { locale: Locale; labelKey: MessageKey }[] = [
  { locale: "en", labelKey: "language.en" },
  { locale: "zh-HK", labelKey: "language.zhHK" },
]

export function SiteHeader({ activeNav }: SiteHeaderProps) {
  const pathname = usePathname()
  const { locale, setLocale, t } = useI18n()
  const [menuOpen, setMenuOpen] = useState(false)
  const navItems = activeNav === "home" ? LANDING_NAV_ITEMS : NAV_ITEMS
  const isActiveNavItem = (itemId: string) =>
    activeNav !== "home" && activeNav === itemId

  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!menuOpen) {
      return
    }

    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target
      if (!(target instanceof Element)) {
        return
      }

      if (!target.closest(".header")) {
        setMenuOpen(false)
      }
    }

    document.addEventListener("pointerdown", handlePointerDown)
    return () => document.removeEventListener("pointerdown", handlePointerDown)
  }, [menuOpen])

  return (
    <header className={`header${menuOpen ? " header-menu-open" : ""}`}>
      <div className="brand">
        <Link className="brand-logo-link" href="/" aria-label="ClevrSwap home">
          <Image
            className="brand-logo"
            src="/cleanverse-logo-black.png"
            alt=""
            width={48}
            height={48}
            priority
            aria-hidden
          />
          <span className="brand-copy">
            <span className="brand-title">ClevrSwap</span>
            <span className="brand-subtitle">{t("brand.subtitle")}</span>
          </span>
        </Link>
      </div>
      <div className="header-actions">
        <nav className="app-nav" aria-label={t("nav.primary")}>
          {navItems.map((item) => (
            <Link
              key={item.id}
              className={isActiveNavItem(item.id) ? "active" : undefined}
              href={item.href}
            >
              {t(item.labelKey)}
            </Link>
          ))}
        </nav>
        <div className="lang-switch" aria-label={t("language.switch")}>
          {LOCALES.map((item) => (
            <button
              key={item.locale}
              type="button"
              className={locale === item.locale ? "active" : undefined}
              onClick={() => setLocale(item.locale)}
            >
              {t(item.labelKey)}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="mobile-nav-toggle"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav-panel"
          aria-label={menuOpen ? t("nav.close") : t("nav.open")}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <svg
            aria-hidden="true"
            fill="none"
            height="18"
            viewBox="0 0 24 24"
            width="18"
          >
            {menuOpen ? (
              <path
                d="M6 6l12 12M18 6 6 18"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2"
              />
            ) : (
              <>
                <path
                  d="M4 7h16M4 12h16M4 17h16"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="2"
                />
              </>
            )}
          </svg>
        </button>
        <div className="header-wallet">
          <ConnectButton />
        </div>
      </div>
      <nav
        id="mobile-nav-panel"
        className="mobile-nav-panel"
        aria-label={t("nav.mobile")}
        aria-hidden={!menuOpen}
      >
        {navItems.map((item) => (
          <Link
            key={item.id}
            className={isActiveNavItem(item.id) ? "active" : undefined}
            href={item.href}
            onClick={() => setMenuOpen(false)}
          >
            {t(item.labelKey)}
          </Link>
        ))}
      </nav>
    </header>
  )
}
