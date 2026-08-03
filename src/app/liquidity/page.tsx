"use client"

import Link from "next/link"

import { SiteHeader } from "@/components/SiteHeader"

const features = [
  {
    title: "Paired ERC20 deposits",
    description:
      "Supply both sides of a pool with clear token selection and live balance visibility.",
  },
  {
    title: "Slippage protected",
    description:
      "Minimum received amounts guard against unfavorable pool ratio shifts during execution.",
  },
  {
    title: "Dual approval flow",
    description:
      "Sequential token approvals keep wallet actions transparent before liquidity is added.",
  },
]

export default function LiquidityIntroPage() {
  return (
    <main className="page app-page">
      <SiteHeader activeNav="liquidity" />

      <section className="intro">
        <div className="intro-copy">
          <span className="eyebrow">Liquidity management</span>
          <h1>Manage liquidity with compliance-aware controls.</h1>
          <p>
            Supply or withdraw paired ERC20 assets from configured pools with
            clear approvals, slippage protection and wallet-native execution.
          </p>

          <div className="trust-strip" aria-label="Liquidity highlights">
            <span>ERC20 pairs</span>
            <span>Dual approvals</span>
            <span>Slippage protected</span>
          </div>

          <div className="intro-actions">
            <Link className="primary-button" href="/liquidity/add">
              Add liquidity
            </Link>
            <Link className="secondary-button" href="/liquidity/remove">
              Remove liquidity
            </Link>
            <Link className="secondary-button" href="/swap">
              Start swapping
            </Link>
          </div>
        </div>

        <div className="feature-list">
          {features.map((feature) => (
            <article className="feature-card" key={feature.title}>
              <span className="feature-icon" aria-hidden="true" />
              <strong>{feature.title}</strong>
              <span>{feature.description}</span>
            </article>
          ))}
        </div>
      </section>
    </main>
  )
}
