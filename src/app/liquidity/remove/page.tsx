"use client"

import { SiteHeader } from "@/components/SiteHeader"
import { RemoveLiquidityCard } from "@/features/liquidity/RemoveLiquidityCard"
import { TransactionHistoryPanel } from "@/features/transactions/TransactionHistoryPanel"

export default function RemoveLiquidityPage() {
  return (
    <main className="page app-page">
      <SiteHeader activeNav="liquidity" />

      <section className="action-page">
        <RemoveLiquidityCard />
        <TransactionHistoryPanel />
      </section>
    </main>
  )
}
