"use client"

import Link from "next/link"
import { useState } from "react"

import { SiteHeader } from "@/components/SiteHeader"
import { SwapCard } from "@/features/swap/SwapCard"

const problems = [
  {
    icon: "routing",
    title: "Opaque routing",
    description:
      "Traders rarely see how a swap is routed or what price impact they are really taking.",
  },
  {
    icon: "identity",
    title: "Unknown counterparties",
    description:
      "Most pools offer no identity context around who is providing or taking liquidity.",
  },
  {
    icon: "policy",
    title: "Policy-blind execution",
    description:
      "Standard DEX flows cannot apply eligibility rules before an allocation settles.",
  },
  {
    icon: "traceability",
    title: "Limited traceability",
    description:
      "Desks and institutions need swap flows that can be reviewed, monitored, and explained.",
  },
]

const checklist = [
  "Policy-aware swaps across supported networks",
  "Transparent routing and clear price impact",
  "Verified participants through A-Pass",
  "Supported compliant assets such as A-Tokens",
  "Self-custody execution, wallet-native throughout",
  "Traceable onchain swap records",
]

const features = [
  {
    icon: "01",
    title: "Compliance-first trading",
    description:
      "A polished swap surface for permission-aware ERC-20 execution and audit-friendly transaction flows.",
  },
  {
    icon: "02",
    title: "Transparent routing",
    description:
      "See the route, price impact, and slippage before you confirm, with no hidden hops.",
  },
  {
    icon: "03",
    title: "Slippage controls",
    description:
      "Set tolerances and confirmation states so every swap executes on your terms.",
  },
  {
    icon: "04",
    title: "Self-custody execution",
    description:
      "You keep wallet control while the interface keeps route, slippage, and confirmation clear.",
  },
  {
    icon: "05",
    title: "Configurable deployments",
    description:
      "Chain, router, factory, wrapped native, and token metadata stay configuration-driven.",
  },
  {
    icon: "06",
    title: "Built on Cleanverse",
    description:
      "A-Pass identity and supported assets interlock to keep every swap accountable.",
  },
]

const steps = [
  {
    title: "Connect wallet & A-Pass",
    description:
      "Connect your wallet and A-Pass to establish a verified trading profile.",
  },
  {
    title: "Choose tokens & review route",
    description:
      "Pick the pair and review the route, price impact, and estimated output.",
  },
  {
    title: "Set slippage & confirm",
    description:
      "Set your slippage tolerance and confirm the swap from your wallet.",
  },
  {
    title: "Execute & track onchain",
    description:
      "Execute, then review status, route, and traceability in one place.",
  },
]

const useCases = [
  {
    icon: "swap",
    title: "Compliant token swaps",
    description:
      "Swap supported assets with identity and policy context applied before settlement.",
  },
  {
    icon: "liquidity",
    title: "Liquidity provision",
    description:
      "Provide liquidity into pools with cleaner participant and asset context.",
  },
  {
    icon: "desk",
    title: "Desk & treasury execution",
    description:
      "Execute sized swaps with transparent routing and review-friendly records.",
  },
  {
    icon: "institution",
    title: "Institution-connected flows",
    description:
      "Connect with Cleanverse-powered assets and compliance workflows for approved scenarios.",
  },
]

const mockups = [
  {
    title: "Swap",
    badge: "Ready",
    rows: [
      ["You pay", "2,500.00 aUSDC"],
      ["You receive", "2,498.10 aTSY"],
      ["Network", "Base Sepolia"],
      ["A-Pass", "Verified"],
    ],
  },
  {
    title: "Add liquidity",
    badge: "Pool",
    rows: [
      ["Pair", "aUSDC / aTSY"],
      ["aUSDC", "10,000.00"],
      ["aTSY", "9,992.40"],
      ["Pool share", "1.84%"],
    ],
  },
  {
    title: "Swap detail",
    badge: "Verified",
    rows: [
      ["Amount", "2,500.00 aUSDC"],
      ["Network", "Base Sepolia"],
      ["Status", "Confirmed"],
      ["Trace ID", "TRC-8F4C-21"],
    ],
  },
]

const trustItems = [
  "Identity-aware swap flows",
  "Supported asset controls",
  "Traceable transaction records",
  "Network-aware execution guidance",
  "Risk-reducing user experience",
  "Review-friendly trade history",
]

const faqs = [
  {
    question: "What is ClevrSwap?",
    answer:
      "ClevrSwap is a compliance-aware DEX interface built on Cleanverse. It brings A-Pass identity and supported-asset controls into a focused swap experience with transparent routing and self-custody execution.",
  },
  {
    question: "What is A-Pass?",
    answer:
      "A-Pass is Cleanverse's participant eligibility credential. It binds verified identity attributes to a wallet so eligibility rules can be applied before a swap settles.",
  },
  {
    question: "Is ClevrSwap self-custody?",
    answer:
      "Yes. You keep wallet control throughout. ClevrSwap keeps route, slippage, and confirmation states clear, but never takes custody of your assets.",
  },
  {
    question: "Which chains and tokens are supported?",
    answer:
      "Support is configuration-driven across deployments. The current testnet environment runs on Base Sepolia with ERC-20 routing and supported assets such as A-Tokens.",
  },
]

export default function Home() {
  return (
    <main className="page landing-page">
      <SiteHeader activeNav="home" />

      <section className="landing-hero">
        <div className="landing-wrap landing-hero-grid">
          <div>
            <span className="landing-tag">
              <span aria-hidden="true" />
              Built on Cleanverse
            </span>
            <h1>Onchain swaps, instantly trusted.</h1>
            <p className="landing-sub">
              ClevrSwap brings A-Pass compliance into a focused swap experience:
              policy-aware execution, transparent routing, and self-custody,
              across configured deployments.
            </p>

            <div className="landing-actions">
              <Link className="landing-button landing-button-primary" href="/swap">
                Start swapping <span aria-hidden="true">-&gt;</span>
              </Link>
              <Link className="landing-button landing-button-ghost" href="/liquidity/add">
                Add liquidity
              </Link>
            </div>

            <div className="landing-chips" aria-label="Platform highlights">
              <span>
                <i aria-hidden="true" />
                Base Sepolia ready
              </span>
              <span>
                <i aria-hidden="true" />
                ERC-20 routing
              </span>
              <span>
                <i aria-hidden="true" />
                Wallet-controlled
              </span>
            </div>
          </div>

          <div className="home-swap-panel" aria-label="ClevrSwap quick swap">
            <SwapCard />
          </div>
        </div>
      </section>

      <section className="landing-section" id="product">
        <div className="landing-wrap">
          <div className="landing-section-head">
            <span className="landing-eyebrow">The problem</span>
            <h2>Onchain trading should not feel opaque or risky.</h2>
            <p>
              Permissionless swaps are fast, but they leave traders without
              identity context, policy assurance, or a clear audit trail.
            </p>
          </div>
          <div className="landing-grid landing-grid-4">
            {problems.map((problem) => (
              <article className="landing-info-card" key={problem.title}>
                <span className="landing-icon" aria-hidden="true">
                  <ProblemIcon type={problem.icon} />
                </span>
                <h3>{problem.title}</h3>
                <p>{problem.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section landing-section-alt">
        <div className="landing-wrap landing-split">
          <div>
            <span className="landing-eyebrow">The ClevrSwap layer</span>
            <h2>Compliant swaps, without the complexity underneath.</h2>
            <p>
              ClevrSwap brings the compliance capabilities of Cleanverse into a
              simple swap surface. Trade across supported networks, interact with
              verified participants, and review transparent execution.
            </p>
            <div className="landing-checklist">
              {checklist.map((item) => (
                <span key={item}>
                  <i aria-hidden="true" />
                  {item}
                </span>
              ))}
            </div>
          </div>

          <div className="landing-mini-card">
            <div className="landing-mock-head">
              <span>Eligibility gate</span>
              <strong>Pre-trade</strong>
            </div>
            <div className="landing-mock-body">
              <MockRow label="Participant A-Pass" value="Valid" positive />
              <MockRow label="Asset support" value="aUSDC - aTSY" positive />
              <MockRow label="Eligibility rule" value="Tier II" />
              <MockRow label="Network" value="Base Sepolia" />
              <MockRow label="Settlement" value="Cleared to execute" positive />
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-wrap">
          <div className="landing-section-head center">
            <span className="landing-eyebrow">Product</span>
            <h2>Built around compliant, transparent execution.</h2>
          </div>
          <div className="landing-grid landing-grid-3">
            {features.map((feature) => (
              <article className="landing-feature-card" key={feature.title}>
                <span className="landing-icon">{feature.icon}</span>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section landing-section-alt" id="how">
        <div className="landing-wrap">
          <div className="landing-section-head center">
            <span className="landing-eyebrow">How it works</span>
            <h2>From wallet to settled swap in four steps.</h2>
          </div>
          <div className="landing-steps">
            {steps.map((step, index) => (
              <article key={step.title}>
                <span>{index + 1}</span>
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section" id="usecases">
        <div className="landing-wrap">
          <div className="landing-section-head">
            <span className="landing-eyebrow">Use cases</span>
            <h2>Built for verified onchain markets.</h2>
          </div>
          <div className="landing-grid landing-grid-4">
            {useCases.map((useCase) => (
              <article className="landing-use-card" key={useCase.title}>
                <span className="landing-icon" aria-hidden="true">
                  <UseCaseIcon type={useCase.icon} />
                </span>
                <h3>{useCase.title}</h3>
                <p>{useCase.description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section landing-section-alt">
        <div className="landing-wrap">
          <div className="landing-section-head center">
            <span className="landing-eyebrow">Infrastructure relationship</span>
            <h2>Built on Cleanverse</h2>
            <p>
              Cleanverse provides the compliance-native infrastructure behind
              ClevrSwap: interlocking verified identity with verified assets so
              every swap is transparent and traceable.
            </p>
          </div>
          <div className="landing-infra">
            <div className="landing-layer">
              <span>Trader / LP</span>
              <strong>People & desks initiating swaps</strong>
            </div>
            <i />
            <div className="landing-layer">
              <span>ClevrSwap interface</span>
              <strong>Trusted swap experience</strong>
            </div>
            <i />
            <div className="landing-layer core">
              <span>Cleanverse infrastructure</span>
              <strong>Compliance-native foundation</strong>
              <small>Verified identity + verified assets + traceable transfers</small>
            </div>
            <div className="landing-infra-chips" aria-label="Cleanverse capabilities">
              <span>A-Pass</span>
              <span>A-Tokens</span>
              <span>Policy controls</span>
              <span>Traceability</span>
              <span>Multi-chain</span>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-wrap">
          <div className="landing-section-head">
            <span className="landing-eyebrow">A closer look</span>
            <h2>A cleaner, more legible way to trade onchain.</h2>
          </div>
          <div className="landing-grid landing-grid-3">
            {mockups.map((mockup) => (
              <article className="landing-mini-card" key={mockup.title}>
                <div className="landing-mock-head">
                  <span>{mockup.title}</span>
                  <strong className={mockup.badge === "Verified" ? "ok" : undefined}>
                    {mockup.badge}
                  </strong>
                </div>
                <div className="landing-mock-body">
                  {mockup.rows.map(([label, value]) => (
                    <MockRow
                      key={`${mockup.title}-${label}`}
                      label={label}
                      value={value}
                      positive={value === "Verified" || value === "Confirmed"}
                    />
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section landing-section-alt">
        <div className="landing-wrap landing-split">
          <div>
            <span className="landing-eyebrow">Trust & compliance</span>
            <h2>Designed for verified markets, not anonymity.</h2>
            <p>
              Instead of treating every wallet as unknown, ClevrSwap uses
              Cleanverse-powered identity and asset verification to create a
              cleaner trading environment.
            </p>
          </div>
          <div className="landing-trust-grid">
            {trustItems.map((item) => (
              <span key={item}>
                <i aria-hidden="true" />
                {item}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-wrap">
          <div className="landing-band">
            <h2>Start trading through a cleaner, compliant DEX.</h2>
            <p>
              Bring policy-aware swaps and verified participants to your onchain
              markets with ClevrSwap.
            </p>
            <div className="landing-band-actions">
              <Link className="landing-button landing-button-accent" href="/swap">
                Start swapping <span aria-hidden="true">-&gt;</span>
              </Link>
              <Link className="landing-button landing-button-dark-ghost" href="/liquidity/add">
                Add liquidity
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section" id="faq">
        <div className="landing-wrap">
          <div className="landing-section-head center">
            <span className="landing-eyebrow">FAQ</span>
            <h2>Questions, answered.</h2>
          </div>
          <div className="landing-faq">
            {faqs.map((faq, index) => (
              <FaqItem
                key={faq.question}
                answer={faq.answer}
                defaultOpen={index === 0}
                question={faq.question}
              />
            ))}
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="landing-wrap">
          <div className="landing-footer-grid">
            <div>
              <div className="landing-footer-brand">
                <img
                  alt=""
                  aria-hidden="true"
                  src="/cleanverse-logo-black.png"
                />
                <span>
                  <strong>ClevrSwap</strong>
                  <small>Built on Cleanverse</small>
                </span>
              </div>
              <p>
                A compliance-aware DEX for verified onchain markets. Self-custody
                by design.
              </p>
            </div>
            <div className="landing-footer-links">
              <nav aria-label="Landing footer navigation">
                <h4>Product</h4>
                <Link href="#product">Product</Link>
                <Link href="#how">How it works</Link>
                <Link href="#usecases">Use cases</Link>
                <Link href="#faq">FAQ</Link>
              </nav>
              <nav aria-label="App footer navigation">
                <h4>App</h4>
                <Link href="/swap">Swap</Link>
                <Link href="/liquidity/add">Liquidity</Link>
                <Link href="#">Contact the team</Link>
              </nav>
            </div>
          </div>
          <div className="landing-footer-base">
            <div>
              <span>© 2026 ClevrDEX</span>
              <span>Built on Cleanverse · Testnet environment</span>
            </div>
            <span>
              ClevrSwap is a technology interface built on Cleanverse
              infrastructure. Availability of features, assets, and networks may
              vary by region, partner, and compliance requirements.
            </span>
          </div>
        </div>
      </footer>
    </main>
  )
}

function FaqItem({
  question,
  answer,
  defaultOpen,
}: {
  question: string
  answer: string
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(Boolean(defaultOpen))

  return (
    <article className={`landing-faq-item${open ? " open" : ""}`}>
      <button
        type="button"
        className="landing-faq-question"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        <span>{question}</span>
        <i className="landing-faq-toggle" aria-hidden="true" />
      </button>
      <div className="landing-faq-answer" aria-hidden={!open}>
        <div>
          <p>{answer}</p>
        </div>
      </div>
    </article>
  )
}

function ProblemIcon({ type }: { type: string }) {
  if (type === "routing") {
    return (
      <svg viewBox="0 0 24 24">
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4-4" />
      </svg>
    )
  }

  if (type === "identity") {
    return (
      <svg viewBox="0 0 24 24">
        <circle cx="12" cy="8" r="4" />
        <path d="M5 20a7 7 0 0 1 14 0" />
      </svg>
    )
  }

  if (type === "policy") {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M12 3l8 4v5c0 5-3.5 8-8 9-4.5-1-8-4-8-9V7z" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24">
      <path d="M4 5h16M4 12h16M4 19h10" />
    </svg>
  )
}

function UseCaseIcon({ type }: { type: string }) {
  if (type === "swap") {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M4 8h12l-3-3M20 16H8l3 3" />
      </svg>
    )
  }

  if (type === "liquidity") {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M12 3v18M5 8l7-5 7 5M5 16l7 5 7-5" />
      </svg>
    )
  }

  if (type === "desk") {
    return (
      <svg viewBox="0 0 24 24">
        <path d="M3 3v18h18M7 14l3-3 3 3 5-6" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24">
      <path d="M4 21V8l8-5 8 5v13M9 21v-6h6v6" />
    </svg>
  )
}

function MockRow({
  label,
  value,
  positive,
  accent,
}: {
  label: string
  value: string
  positive?: boolean
  accent?: boolean
}) {
  return (
    <div className="landing-mock-row">
      <span>{label}</span>
      <strong className={`${positive ? "positive" : ""}${accent ? " accent" : ""}`}>
        {value}
      </strong>
    </div>
  )
}
