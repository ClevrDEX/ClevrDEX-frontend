"use client"

import { SiteHeader } from "@/components/SiteHeader"
import { LiquidityCard } from "@/features/liquidity/LiquidityCard"
import { TransactionHistoryPanel } from "@/features/transactions/TransactionHistoryPanel"

export default function AddLiquidityPage() {
  return (
    <main className="page">
      <SiteHeader activeNav="liquidity" />

      <section className="action-page">
        <LiquidityCard />
        <TransactionHistoryPanel />
      </section>
    </main>
  )
}
