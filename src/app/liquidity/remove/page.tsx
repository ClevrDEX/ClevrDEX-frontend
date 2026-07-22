"use client"

import { SiteHeader } from "@/components/SiteHeader"
import { RemoveLiquidityCard } from "@/features/liquidity/RemoveLiquidityCard"

export default function RemoveLiquidityPage() {
  return (
    <main className="page">
      <SiteHeader activeNav="liquidity" />

      <section className="action-page">
        <RemoveLiquidityCard />
      </section>
    </main>
  )
}
