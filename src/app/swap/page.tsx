"use client"

import { SiteHeader } from "@/components/SiteHeader"
import { SwapCard } from "@/features/swap/SwapCard"
import { TransactionHistoryPanel } from "@/features/transactions/TransactionHistoryPanel"

export default function SwapPage() {
  return (
    <main className="page app-page">
      <SiteHeader activeNav="swap" />

      <section className="action-page">
        <SwapCard />
        <TransactionHistoryPanel />
      </section>
    </main>
  )
}
