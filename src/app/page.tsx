"use client"

import Link from "next/link"
import { useMemo, useState } from "react"
import { useChainId } from "wagmi"

import { getDexDeployment } from "@/chains/deployments"
import { SiteHeader } from "@/components/SiteHeader"
import { SwapCard } from "@/features/swap/SwapCard"
import { useTokenList } from "@/features/tokens/useTokenList"
import { useI18n, type MessageKey } from "@/i18n"

const problems = [
  {
    icon: "routing",
    titleKey: "landing.problem.routing.title",
    descriptionKey: "landing.problem.routing.description",
  },
  {
    icon: "identity",
    titleKey: "landing.problem.identity.title",
    descriptionKey: "landing.problem.identity.description",
  },
  {
    icon: "policy",
    titleKey: "landing.problem.policy.title",
    descriptionKey: "landing.problem.policy.description",
  },
  {
    icon: "traceability",
    titleKey: "landing.problem.traceability.title",
    descriptionKey: "landing.problem.traceability.description",
  },
] satisfies {
  icon: string
  titleKey: MessageKey
  descriptionKey: MessageKey
}[]

const checklist = [
  "landing.solution.item1",
  "landing.solution.item2",
  "landing.solution.item3",
  "landing.solution.item4",
  "landing.solution.item5",
  "landing.solution.item6",
] satisfies MessageKey[]

const features = [
  {
    icon: "01",
    titleKey: "landing.feature.compliance.title",
    descriptionKey: "landing.feature.compliance.description",
  },
  {
    icon: "02",
    titleKey: "landing.feature.routing.title",
    descriptionKey: "landing.feature.routing.description",
  },
  {
    icon: "03",
    titleKey: "landing.feature.apassEligibility.title",
    descriptionKey: "landing.feature.apassEligibility.description",
  },
  {
    icon: "04",
    titleKey: "landing.feature.custody.title",
    descriptionKey: "landing.feature.custody.description",
  },
  {
    icon: "05",
    titleKey: "landing.feature.deployments.title",
    descriptionKey: "landing.feature.deployments.description",
  },
  {
    icon: "06",
    titleKey: "landing.feature.cleanverse.title",
    descriptionKey: "landing.feature.cleanverse.description",
  },
] satisfies {
  icon: string
  titleKey: MessageKey
  descriptionKey: MessageKey
}[]

const steps = [
  {
    titleKey: "landing.how.step1.title",
    descriptionKey: "landing.how.step1.description",
  },
  {
    titleKey: "landing.how.step2.title",
    descriptionKey: "landing.how.step2.description",
  },
  {
    titleKey: "landing.how.step3.title",
    descriptionKey: "landing.how.step3.description",
  },
  {
    titleKey: "landing.how.step4.title",
    descriptionKey: "landing.how.step4.description",
  },
] satisfies { titleKey: MessageKey; descriptionKey: MessageKey }[]

const useCases = [
  {
    icon: "swap",
    titleKey: "landing.useCase.swaps.title",
    descriptionKey: "landing.useCase.swaps.description",
  },
  {
    icon: "liquidity",
    titleKey: "landing.useCase.liquidity.title",
    descriptionKey: "landing.useCase.liquidity.description",
  },
  {
    icon: "desk",
    titleKey: "landing.useCase.desk.title",
    descriptionKey: "landing.useCase.desk.description",
  },
  {
    icon: "institution",
    titleKey: "landing.useCase.institution.title",
    descriptionKey: "landing.useCase.institution.description",
  },
] satisfies {
  icon: string
  titleKey: MessageKey
  descriptionKey: MessageKey
}[]

type MockupRow = {
  label?: string
  labelKey?: MessageKey
  value?: string
  valueKey?: MessageKey
}

type Mockup = {
  titleKey: MessageKey
  badgeKey: MessageKey
  rows: MockupRow[]
}

const MOCK_TX_HASH =
  "0x8f4c21a3b2d1e4f58920c3b2a1f0e9d8c7b6a59483726150493827162504837"

function truncateTxHash(hash: string) {
  return `${hash.slice(0, 14)}...${hash.slice(-8)}`
}

function buildMockups(mockTokenSymbol: string): Mockup[] {
  return [
    {
      titleKey: "landing.mock.swap",
      badgeKey: "landing.mock.ready",
      rows: [
        { labelKey: "landing.mock.pay", value: "2,500.00 aUSDC" },
        { labelKey: "landing.mock.receive", value: `2,498.10 ${mockTokenSymbol}` },
        { labelKey: "landing.solution.network", value: "Base Sepolia" },
        { labelKey: "landing.mock.apass", valueKey: "landing.mock.verified" },
      ],
    },
    {
      titleKey: "landing.mock.addLiquidity",
      badgeKey: "landing.mock.pool",
      rows: [
        { labelKey: "landing.mock.pair", value: `aUSDC / ${mockTokenSymbol}` },
        { label: "aUSDC", value: "10,000.00" },
        { label: mockTokenSymbol, value: "9,992.40" },
        { labelKey: "landing.mock.poolShare", value: "1.84%" },
      ],
    },
    {
      titleKey: "landing.mock.swapDetail",
      badgeKey: "landing.mock.verified",
      rows: [
        { labelKey: "landing.mock.amount", value: "2,500.00 aUSDC" },
        { labelKey: "landing.solution.network", value: "Base Sepolia" },
        { labelKey: "landing.mock.status", valueKey: "landing.mock.confirmed" },
        {
          labelKey: "landing.mock.traceId",
          value: truncateTxHash(MOCK_TX_HASH),
        },
      ],
    },
  ]
}

const trustItems = [
  "landing.trust.item1",
  "landing.trust.item2",
  "landing.trust.item3",
  "landing.trust.item4",
  "landing.trust.item5",
  "landing.trust.item6",
] satisfies MessageKey[]

const faqs = [
  {
    questionKey: "landing.faq.q1",
    answerKey: "landing.faq.a1",
  },
  {
    questionKey: "landing.faq.q2",
    answerKey: "landing.faq.a2",
  },
  {
    questionKey: "landing.faq.q3",
    answerKey: "landing.faq.a3",
  },
  {
    questionKey: "landing.faq.q4",
    answerKey: "landing.faq.a4",
  },
  {
    questionKey: "landing.faq.q5",
    answerKey: "landing.faq.a5",
  },
  {
    questionKey: "landing.faq.q6",
    answerKey: "landing.faq.a6",
  },
] satisfies { questionKey: MessageKey; answerKey: MessageKey }[]

export default function Home() {
  const { t } = useI18n()
  const chainId = useChainId()
  const deployment = getDexDeployment(chainId)
  const tokenListQuery = useTokenList(chainId, deployment)
  const tokens = tokenListQuery.data ?? deployment?.tokenList ?? []
  const mockTokenSymbol = useMemo(() => {
    const aUsdc = tokens.find(
      (token) => token.symbol.toLowerCase() === "ausdc",
    )
    const pairedToken = tokens.find(
      (token) => token.address !== aUsdc?.address,
    )

    return pairedToken?.symbol ?? "Token"
  }, [tokens])
  const mockups = useMemo(
    () => buildMockups(mockTokenSymbol),
    [mockTokenSymbol],
  )
  const assetSupportValue = useMemo(() => {
    const aUsdc = tokens.find(
      (token) => token.symbol.toLowerCase() === "ausdc",
    )
    const pairedToken = tokens.find(
      (token) => token.address !== aUsdc?.address,
    )

    if (!aUsdc || !pairedToken) {
      return undefined
    }

    return `${aUsdc.symbol} - ${pairedToken.symbol}`
  }, [tokens])

  return (
    <main className="page landing-page">
      <SiteHeader activeNav="home" />

      <section className="landing-hero">
        <div className="landing-wrap landing-hero-grid">
          <div>
            <span className="landing-tag">
              <span aria-hidden="true" />
              {t("landing.hero.tag")}
            </span>
            <h1>{t("landing.hero.title")}</h1>
            <p className="landing-sub">
              {t("landing.hero.subtitle")}
            </p>

            <div className="landing-actions">
              <Link className="landing-button landing-button-primary" href="/swap">
                {t("landing.hero.ctaSwap")} <span aria-hidden="true">-&gt;</span>
              </Link>
              <Link className="landing-button landing-button-ghost" href="/liquidity/add">
                {t("landing.hero.ctaLiquidity")}
              </Link>
            </div>

            <div className="landing-chips" aria-label={t("landing.hero.highlights")}>
              <span>
                <i aria-hidden="true" />
                {t("landing.hero.chipBase")}
              </span>
              <span>
                <i aria-hidden="true" />
                {t("landing.hero.chipRouting")}
              </span>
              <span>
                <i aria-hidden="true" />
                {t("landing.hero.chipWallet")}
              </span>
            </div>
          </div>

          <div className="home-swap-panel" aria-label={t("landing.hero.swapAria")}>
            <SwapCard />
          </div>
        </div>
      </section>

      <section className="landing-section" id="product">
        <div className="landing-wrap">
          <div className="landing-section-head">
            <span className="landing-eyebrow">{t("landing.problem.eyebrow")}</span>
            <h2>{t("landing.problem.title")}</h2>
            <p>{t("landing.problem.subtitle")}</p>
          </div>
          <div className="landing-grid landing-grid-4">
            {problems.map((problem) => (
              <article className="landing-info-card" key={problem.titleKey}>
                <span className="landing-icon" aria-hidden="true">
                  <ProblemIcon type={problem.icon} />
                </span>
                <h3>{t(problem.titleKey)}</h3>
                <p>{t(problem.descriptionKey)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section landing-section-alt">
        <div className="landing-wrap landing-split">
          <div>
            <span className="landing-eyebrow">{t("landing.solution.eyebrow")}</span>
            <h2>{t("landing.solution.title")}</h2>
            <p>{t("landing.solution.subtitle")}</p>
            <ul className="landing-checklist">
              {checklist.map((item) => (
                <li key={item}>
                  {t(item)}
                </li>
              ))}
            </ul>
          </div>

          <div className="landing-mini-card">
            <div className="landing-mock-head">
              <span>{t("landing.solution.cardTitle")}</span>
              <strong>{t("landing.solution.cardBadge")}</strong>
            </div>
            <div className="landing-mock-body">
              <MockRow
                label={t("landing.solution.participant")}
                value={t("landing.solution.valid")}
                positive
              />
              {assetSupportValue ? (
                <MockRow
                  label={t("landing.solution.assetSupport")}
                  value={assetSupportValue}
                  positive
                />
              ) : null}
              <MockRow label={t("landing.solution.eligibilityRule")} value="Tier II" />
              <MockRow label={t("landing.solution.network")} value="Base Sepolia" />
              <MockRow
                label={t("landing.solution.settlement")}
                value={t("landing.solution.cleared")}
                positive
              />
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-wrap">
          <div className="landing-section-head center">
            <span className="landing-eyebrow">{t("landing.product.eyebrow")}</span>
            <h2>{t("landing.product.title")}</h2>
          </div>
          <div className="landing-grid landing-grid-3">
            {features.map((feature) => (
              <article className="landing-feature-card" key={feature.titleKey}>
                <span className="landing-icon">{feature.icon}</span>
                <h3>{t(feature.titleKey)}</h3>
                <p>{t(feature.descriptionKey)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section landing-section-alt" id="how">
        <div className="landing-wrap">
          <div className="landing-section-head center">
            <span className="landing-eyebrow">{t("landing.how.eyebrow")}</span>
            <h2>{t("landing.how.title")}</h2>
          </div>
          <div className="landing-steps">
            {steps.map((step, index) => (
              <article key={step.titleKey}>
                <span>{index + 1}</span>
                <h3>{t(step.titleKey)}</h3>
                <p>{t(step.descriptionKey)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section" id="usecases">
        <div className="landing-wrap">
          <div className="landing-section-head">
            <span className="landing-eyebrow">{t("landing.useCases.eyebrow")}</span>
            <h2>{t("landing.useCases.title")}</h2>
          </div>
          <div className="landing-grid landing-grid-4">
            {useCases.map((useCase) => (
              <article className="landing-use-card" key={useCase.titleKey}>
                <span className="landing-icon" aria-hidden="true">
                  <UseCaseIcon type={useCase.icon} />
                </span>
                <h3>{t(useCase.titleKey)}</h3>
                <p>{t(useCase.descriptionKey)}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="landing-section landing-section-alt">
        <div className="landing-wrap">
          <div className="landing-section-head center">
            <span className="landing-eyebrow">
              {t("landing.infrastructure.eyebrow")}
            </span>
            <h2>{t("landing.infrastructure.title")}</h2>
            <p>{t("landing.infrastructure.subtitle")}</p>
          </div>
          <div className="landing-infra">
            <div className="landing-layer">
              <span>{t("landing.infrastructure.layer1.title")}</span>
              <strong>{t("landing.infrastructure.layer1.body")}</strong>
            </div>
            <i />
            <div className="landing-layer">
              <span>{t("landing.infrastructure.layer2.title")}</span>
              <strong>{t("landing.infrastructure.layer2.body")}</strong>
            </div>
            <i />
            <div className="landing-layer core">
              <span>{t("landing.infrastructure.layer3.title")}</span>
              <strong>{t("landing.infrastructure.layer3.body")}</strong>
              <small>{t("landing.infrastructure.layer3.small")}</small>
            </div>
            <div
              className="landing-infra-chips"
              aria-label={t("landing.infrastructure.capabilities")}
            >
              <span>A-Pass</span>
              <span>A-Tokens</span>
              <span>{t("landing.infrastructure.policy")}</span>
              <span>{t("landing.infrastructure.traceability")}</span>
              <span>{t("landing.infrastructure.multichain")}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-wrap">
          <div className="landing-section-head">
            <span className="landing-eyebrow">{t("landing.mock.eyebrow")}</span>
            <h2>{t("landing.mock.title")}</h2>
          </div>
          <div className="landing-grid landing-grid-3">
            {mockups.map((mockup) => (
              <article className="landing-mini-card" key={mockup.titleKey}>
                <div className="landing-mock-head">
                  <span>{t(mockup.titleKey)}</span>
                  <strong
                    className={
                      mockup.badgeKey === "landing.mock.verified" ? "ok" : undefined
                    }
                  >
                    {t(mockup.badgeKey)}
                  </strong>
                </div>
                <div className="landing-mock-body">
                  {mockup.rows.map((row) => (
                    <MockRow
                      key={`${mockup.titleKey}-${row.labelKey ?? row.label}`}
                      label={row.labelKey ? t(row.labelKey) : (row.label ?? "")}
                      value={row.valueKey ? t(row.valueKey) : (row.value ?? "")}
                      positive={
                        row.valueKey === "landing.mock.verified" ||
                        row.valueKey === "landing.mock.confirmed"
                      }
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
            <span className="landing-eyebrow">{t("landing.trust.eyebrow")}</span>
            <h2>{t("landing.trust.title")}</h2>
            <p>{t("landing.trust.subtitle")}</p>
          </div>
          <ul className="landing-trust-grid">
            {trustItems.map((item) => (
              <li key={item}>
                {t(item)}
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="landing-section">
        <div className="landing-wrap">
          <div className="landing-band">
            <h2>{t("landing.band.title")}</h2>
            <p>{t("landing.band.subtitle")}</p>
            <div className="landing-band-actions">
              <Link className="landing-button landing-button-accent" href="/swap">
                {t("landing.hero.ctaSwap")} <span aria-hidden="true">-&gt;</span>
              </Link>
              <Link className="landing-button landing-button-dark-ghost" href="/liquidity/add">
                {t("landing.hero.ctaLiquidity")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-section" id="faq">
        <div className="landing-wrap">
          <div className="landing-section-head center">
            <span className="landing-eyebrow">{t("landing.faq.eyebrow")}</span>
            <h2>{t("landing.faq.title")}</h2>
          </div>
          <div className="landing-faq">
            {faqs.map((faq, index) => (
              <FaqItem
                key={faq.questionKey}
                answer={t(faq.answerKey)}
                defaultOpen={index === 0}
                question={t(faq.questionKey)}
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
                  <small>{t("brand.subtitle")}</small>
                </span>
              </div>
              <p>{t("landing.footer.tag")}</p>
            </div>
            <div className="landing-footer-links">
              <nav aria-label={t("nav.primary")}>
                <h4>{t("landing.footer.product")}</h4>
                <Link href="#product">{t("nav.product")}</Link>
                <Link href="#how">{t("nav.how")}</Link>
                <Link href="#usecases">{t("nav.useCases")}</Link>
                <Link href="#faq">{t("nav.faq")}</Link>
              </nav>
              <nav aria-label={t("landing.footer.app")}>
                <h4>{t("landing.footer.app")}</h4>
                <Link href="/swap">{t("nav.swap")}</Link>
                <Link href="/liquidity/add">{t("nav.liquidity")}</Link>
                <Link href="#">{t("landing.footer.contact")}</Link>
              </nav>
            </div>
          </div>
          <div className="landing-footer-base">
            <div>
              <span>© 2026 ClevrDEX</span>
              <span>{t("landing.footer.built")}</span>
            </div>
            <span>{t("landing.footer.disclaimer")}</span>
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

