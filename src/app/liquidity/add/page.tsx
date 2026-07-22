"use client"

import { SiteHeader } from "@/components/SiteHeader"
import { LiquidityCard } from "@/features/liquidity/LiquidityCard"

export default function AddLiquidityPage() {
  return (
    <main className="page">
      <SiteHeader activeNav="liquidity" />

      <section className="action-page">
        <LiquidityCard />
      </section>
    </main>
  )
}
