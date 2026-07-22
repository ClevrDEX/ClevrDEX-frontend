"use client"

import { SiteHeader } from "@/components/SiteHeader"
import { SwapCard } from "@/features/swap/SwapCard"

export default function SwapPage() {
  return (
    <main className="page">
      <SiteHeader activeNav="swap" />

      <section className="action-page">
        <SwapCard />
      </section>
    </main>
  )
}
