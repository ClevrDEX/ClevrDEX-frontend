"use client"

import { ConnectButton } from "@rainbow-me/rainbowkit"
import Image from "next/image"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"

type SiteHeaderProps = {
  activeNav: "home" | "swap" | "liquidity"
}

const NAV_ITEMS = [
  { id: "home" as const, href: "/", label: "Home" },
  { id: "swap" as const, href: "/swap", label: "Swap" },
  { id: "liquidity" as const, href: "/liquidity/add", label: "Liquidity" },
]

export function SiteHeader({ activeNav }: SiteHeaderProps) {
  const pathname = usePathname()
  const [menuOpen, setMenuOpen] = useState(false)

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
        <Link className="brand-logo-link" href="/" aria-label="Verified DEX home">
          <Image
            className="brand-logo"
            src="/logo.svg"
            alt="Verified DEX"
            width={48}
            height={48}
            priority
          />
        </Link>
      </div>
      <div className="header-actions">
        <nav className="app-nav" aria-label="Primary navigation">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.id}
              className={activeNav === item.id ? "active" : undefined}
              href={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <button
          type="button"
          className="mobile-nav-toggle"
          aria-expanded={menuOpen}
          aria-controls="mobile-nav-panel"
          aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
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
        aria-label="Mobile navigation"
        aria-hidden={!menuOpen}
      >
        {NAV_ITEMS.map((item) => (
          <Link
            key={item.id}
            className={activeNav === item.id ? "active" : undefined}
            href={item.href}
            onClick={() => setMenuOpen(false)}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </header>
  )
}
