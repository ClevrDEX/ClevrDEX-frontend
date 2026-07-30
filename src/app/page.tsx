"use client"

import Link from "next/link"

import { SiteHeader } from "@/components/SiteHeader"

const features = [
  {
    title: "Compliance-first trading",
    description:
      "A polished swap surface for permission-aware ERC20 execution and audit-friendly transaction flows.",
  },
  {
    title: "Configurable routing",
    description:
      "Chain, router, factory, wrapped native and token metadata stay configuration-driven.",
  },
  {
    title: "Self-custody execution",
    description:
      "Users keep wallet control while the interface keeps route, slippage and confirmation states clear.",
  },
]

export default function Home() {
  return (
    <main className="page">
      <SiteHeader activeNav="home" />

      <section className="intro">
        <div className="intro-copy">
          <span className="eyebrow">Compliance rails for onchain markets</span>
          <h1>Trade through a cleaner, policy-aware DEX interface.</h1>
          <p>
            Verified DEX brings A-Pass Compliance into a focused swap experience
            with transparent routing, slippage controls and wallet-native
            execution across configured deployments.
          </p>

          <div className="trust-strip" aria-label="Platform highlights">
            <span>Base Sepolia ready</span>
            <span>ERC20 routing</span>
            <span>Wallet controlled</span>
          </div>

          <div className="intro-actions">
            <Link className="primary-button" href="/swap">
              Start swapping
            </Link>
            <Link className="secondary-button" href="/liquidity/add">
              Add liquidity
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
