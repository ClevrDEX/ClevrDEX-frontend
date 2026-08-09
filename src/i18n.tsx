"use client"

import { createContext, useContext, useEffect, useMemo, useState } from "react"

export type Locale = "en" | "zh-HK"

const STORAGE_KEY = "clevrswap.lang"

const messages = {
  en: {
    "language.en": "EN",
    "language.zhHK": "繁",
    "language.switch": "Language",
    "brand.subtitle": "Built on Cleanverse",
    "nav.home": "Home",
    "nav.swap": "Swap",
    "nav.liquidity": "Liquidity",
    "nav.product": "Product",
    "nav.how": "How it works",
    "nav.useCases": "Use cases",
    "nav.faq": "FAQ",
    "nav.primary": "Primary navigation",
    "nav.mobile": "Mobile navigation",
    "nav.open": "Open navigation menu",
    "nav.close": "Close navigation menu",

    "landing.hero.tag": "Built on Cleanverse",
    "landing.hero.title": "Onchain swaps, instantly trusted.",
    "landing.hero.subtitle":
      "ClevrSwap brings A-Pass compliance into a focused swap experience: policy-aware execution, transparent routing, and self-custody, across configured deployments.",
    "landing.hero.ctaSwap": "Start swapping",
    "landing.hero.ctaLiquidity": "Add liquidity",
    "landing.hero.chipBase": "Base Sepolia ready",
    "landing.hero.chipRouting": "ERC-20 routing",
    "landing.hero.chipWallet": "Wallet-controlled",
    "landing.hero.highlights": "Platform highlights",
    "landing.hero.swapAria": "ClevrSwap quick swap",
    "landing.problem.eyebrow": "The problem",
    "landing.problem.title": "Onchain trading should not feel opaque or risky.",
    "landing.problem.subtitle":
      "Permissionless swaps are fast, but they leave traders without identity context, policy assurance, or a clear audit trail.",
    "landing.problem.routing.title": "Opaque routing",
    "landing.problem.routing.description":
      "Traders rarely see how a swap is routed or what price impact they are really taking.",
    "landing.problem.identity.title": "Unknown counterparties",
    "landing.problem.identity.description":
      "Most pools offer no identity context around who is providing or taking liquidity.",
    "landing.problem.policy.title": "Policy-blind execution",
    "landing.problem.policy.description":
      "Standard DEX flows cannot apply eligibility rules before an allocation settles.",
    "landing.problem.traceability.title": "Limited traceability",
    "landing.problem.traceability.description":
      "Desks and institutions need swap flows that can be reviewed, monitored, and explained.",
    "landing.solution.eyebrow": "The ClevrSwap layer",
    "landing.solution.title": "Compliant swaps, without the complexity underneath.",
    "landing.solution.subtitle":
      "ClevrSwap brings the compliance capabilities of Cleanverse into a simple swap surface. Trade across supported networks, interact with verified participants, and review transparent execution.",
    "landing.solution.item1": "Policy-aware swaps across supported networks",
    "landing.solution.item2": "Transparent routing and clear price impact",
    "landing.solution.item3": "Verified participants through A-Pass",
    "landing.solution.item4": "Supported compliant assets such as A-Tokens",
    "landing.solution.item5": "Self-custody execution, wallet-native throughout",
    "landing.solution.item6": "Traceable onchain swap records",
    "landing.solution.cardTitle": "Eligibility gate",
    "landing.solution.cardBadge": "Pre-trade",
    "landing.solution.participant": "Participant A-Pass",
    "landing.solution.valid": "Valid",
    "landing.solution.assetSupport": "Asset support",
    "landing.solution.eligibilityRule": "Eligibility rule",
    "landing.solution.network": "Network",
    "landing.solution.settlement": "Settlement",
    "landing.solution.cleared": "Cleared to execute",
    "landing.product.eyebrow": "Product",
    "landing.product.title": "Built around compliant, transparent execution.",
    "landing.feature.compliance.title": "Compliance-first trading",
    "landing.feature.compliance.description":
      "A polished swap surface for permission-aware ERC-20 execution and audit-friendly transaction flows.",
    "landing.feature.routing.title": "Transparent routing",
    "landing.feature.routing.description":
      "See the route, price impact, and slippage before you confirm, with no hidden hops.",
    "landing.feature.apassEligibility.title": "A-Pass eligibility checks",
    "landing.feature.apassEligibility.description":
      "Before confirmation, we'll verify that your connected wallet holds a valid A-Pass and is eligible to receive the selected A-Token.",
    "landing.feature.custody.title": "Self-custody execution",
    "landing.feature.custody.description":
      "You keep wallet control while the interface keeps route, confirmation, and execution clear.",
    "landing.feature.deployments.title": "Configurable deployments",
    "landing.feature.deployments.description":
      "Chain, router, factory, wrapped native, and token metadata stay configuration-driven.",
    "landing.feature.cleanverse.title": "Built on Cleanverse",
    "landing.feature.cleanverse.description":
      "A-Pass identity and supported assets interlock to keep every swap accountable.",
    "landing.how.eyebrow": "How it works",
    "landing.how.title": "From wallet to settled swap in four steps.",
    "landing.how.step1.title": "Connect wallet",
    "landing.how.step1.description":
      "Connect your wallet to get started.",
    "landing.how.step2.title": "Choose tokens & review route",
    "landing.how.step2.description":
      "Select an A-Token pair and review the route, price impact, and estimated output.",
    "landing.how.step3.title": "Verify A-Pass eligibility",
    "landing.how.step3.description":
      "Before confirmation, we'll verify that your connected wallet holds a valid A-Pass and is eligible to receive the selected A-Token.",
    "landing.how.step4.title": "Confirm, execute & track",
    "landing.how.step4.description":
      "Confirm the swap from your wallet, then track its onchain status, route, and traceability in one place.",
    "landing.useCases.eyebrow": "Use cases",
    "landing.useCases.title": "Built for verified onchain markets.",
    "landing.useCase.swaps.title": "Compliant token swaps",
    "landing.useCase.swaps.description":
      "Swap supported assets with identity and policy context applied before settlement.",
    "landing.useCase.liquidity.title": "Liquidity provision",
    "landing.useCase.liquidity.description":
      "Provide liquidity into pools with cleaner participant and asset context.",
    "landing.useCase.desk.title": "Desk & treasury execution",
    "landing.useCase.desk.description":
      "Execute sized swaps with transparent routing and review-friendly records.",
    "landing.useCase.institution.title": "Institution-connected flows",
    "landing.useCase.institution.description":
      "Connect with Cleanverse-powered assets and compliance workflows for approved scenarios.",
    "landing.infrastructure.eyebrow": "Infrastructure relationship",
    "landing.infrastructure.title": "Built on Cleanverse",
    "landing.infrastructure.subtitle":
      "Cleanverse provides the compliance-native infrastructure behind ClevrSwap: interlocking verified identity with verified assets so every swap is transparent and traceable.",
    "landing.infrastructure.layer1.title": "Trader / LP",
    "landing.infrastructure.layer1.body": "People & desks initiating swaps",
    "landing.infrastructure.layer2.title": "ClevrSwap interface",
    "landing.infrastructure.layer2.body": "Trusted swap experience",
    "landing.infrastructure.layer3.title": "Cleanverse infrastructure",
    "landing.infrastructure.layer3.body": "Compliance-native foundation",
    "landing.infrastructure.layer3.small":
      "Verified identity + verified assets + traceable transfers",
    "landing.infrastructure.capabilities": "Cleanverse capabilities",
    "landing.infrastructure.policy": "Policy controls",
    "landing.infrastructure.traceability": "Traceability",
    "landing.infrastructure.multichain": "Multi-chain",
    "landing.mock.eyebrow": "A closer look",
    "landing.mock.title": "A cleaner, more legible way to trade onchain.",
    "landing.mock.swap": "Swap",
    "landing.mock.ready": "Ready",
    "landing.mock.pay": "You pay",
    "landing.mock.receive": "You receive",
    "landing.mock.apass": "A-Pass",
    "landing.mock.verified": "Verified",
    "landing.mock.addLiquidity": "Add liquidity",
    "landing.mock.pool": "Pool",
    "landing.mock.pair": "Pair",
    "landing.mock.poolShare": "Pool share",
    "landing.mock.swapDetail": "Swap detail",
    "landing.mock.amount": "Amount",
    "landing.mock.status": "Status",
    "landing.mock.confirmed": "Confirmed",
    "landing.mock.traceId": "Trace ID",
    "landing.trust.eyebrow": "Trust & compliance",
    "landing.trust.title": "Designed for verified markets, not anonymity.",
    "landing.trust.subtitle":
      "Instead of treating every wallet as unknown, ClevrSwap uses Cleanverse-powered identity and asset verification to create a cleaner trading environment.",
    "landing.trust.item1": "Identity-aware swap flows",
    "landing.trust.item2": "Supported asset controls",
    "landing.trust.item3": "Traceable transaction records",
    "landing.trust.item4": "Network-aware execution guidance",
    "landing.trust.item5": "Risk-reducing user experience",
    "landing.trust.item6": "Review-friendly trade history",
    "landing.band.title": "Start trading through a cleaner, compliant DEX.",
    "landing.band.subtitle":
      "Bring policy-aware swaps and verified participants to your onchain markets with ClevrSwap.",
    "landing.faq.eyebrow": "FAQ",
    "landing.faq.title": "Questions, answered.",
    "landing.faq.q1": "What is ClevrSwap?",
    "landing.faq.a1":
      "ClevrSwap is a compliance-aware DEX interface built on Cleanverse. It brings A-Pass identity and supported-asset controls into a focused swap experience with transparent routing and self-custody execution.",
    "landing.faq.q2": "What is A-Pass?",
    "landing.faq.a2":
      "A-Pass is Cleanverse's participant eligibility credential. It binds verified identity attributes to a wallet so eligibility rules can be applied before a swap settles.",
    "landing.faq.q3": "Is ClevrSwap self-custody?",
    "landing.faq.a3":
      "Yes. You keep wallet control throughout. ClevrSwap keeps route, slippage, and confirmation states clear, but never takes custody of your assets.",
    "landing.faq.q4": "Which chains and tokens are supported?",
    "landing.faq.a4":
      "Support is configuration-driven across deployments. The current testnet environment runs on Base Sepolia with ERC-20 routing and supported assets such as A-Tokens.",
    "landing.faq.q5": "Who is ClevrSwap for?",
    "landing.faq.a5":
      "Traders, liquidity providers, desks, and institutions that need verified counterparties, supported assets, and review-friendly execution.",
    "landing.faq.q6": "Is every swap traceable?",
    "landing.faq.a6":
      "Swaps produce onchain records with route, network, and status context, so flows can be reviewed, monitored, and explained.",
    "landing.footer.tag":
      "A compliance-aware DEX for verified onchain markets. Self-custody by design.",
    "landing.footer.product": "Product",
    "landing.footer.app": "App",
    "landing.footer.contact": "Contact the team",
    "landing.footer.built": "Built on Cleanverse · Testnet environment",
    "landing.footer.disclaimer":
      "ClevrSwap is a technology interface built on Cleanverse infrastructure. Availability of features, assets, and networks may vary by region, partner, and compliance requirements.",

    "common.balance": "Balance:",
    "common.selectToken": "Select token",
    "common.processing": "Processing...",
    "common.settings": "Settings",
    "common.closeSettings": "Close settings",
    "common.closeProgress": "Close transaction progress",
    "common.retry": "Retry",
    "common.min": "min",
    "common.configureRouter": "Configure the A-Pass router in",
    "common.insufficientBalance": "Insufficient balance.",
    "common.checkingCompliance": "Checking A-Pass compliance...",
    "common.transactionConfirmed": "Transaction confirmed.",
    "common.savedToHistory": "The confirmed transaction was saved to local history.",
    "common.transactionRejected": "Transaction rejected in wallet.",
    "common.transactionFailed": "Transaction failed.",
    "common.approvalReverted": "Approval transaction reverted.",
    "common.approvalAllowanceTimeout":
      "Approval confirmed, but allowance did not update in time.",
    "common.maxSlippage": "Max slippage",
    "common.transactionWindow": "Transaction window",
    "common.adjustSettings": "Adjust slippage tolerance and transaction deadline.",

    "swap.kicker": "A-Pass router",
    "swap.title": "Compliance Swap",
    "swap.settings": "Swap settings",
    "swap.from": "From",
    "swap.to": "To",
    "swap.bestPath": "Best path",
    "swap.minimumReceived": "Minimum received",
    "swap.approveAndSwap": "Approve {symbol} and Swap",
    "swap.action": "Swap",
    "swap.statusActive": "Compliance-ready ERC20 swap route is active.",
    "swap.statusRefreshing": "Refreshing quote...",
    "swap.statusNoRoute": "No route found for this amount.",
    "swap.statusSaved": "Your swap was saved to local transaction history.",
    "swap.progressTitle": "Swap progress",
    "swap.progressDescription":
      "Check A-Pass, approve if needed, then confirm the swap.",
    "swap.approveSubmitted":
      "Approve submitted. Waiting for the approval to confirm on-chain.",
    "swap.submitted":
      "Swap submitted. You can close this window while it confirms on-chain.",
    "swap.reverted": "Swap transaction reverted.",
    "swap.approveLabel": "Approve {symbol}",
    "swap.approveDescription":
      "Grant the router permission to spend the input token.",
    "swap.stepLabel": "Confirm swap",
    "swap.stepDescription": "Confirm the swap after A-Pass and approval are ready.",

    "liquidity.kicker": "Pool operations",
    "liquidity.titleAdd": "Add Liquidity",
    "liquidity.titleRemove": "Remove Liquidity",
    "liquidity.add": "Add",
    "liquidity.remove": "Remove",
    "liquidity.actions": "Liquidity actions",
    "liquidity.settings": "Liquidity settings",
    "liquidity.tokenA": "Token A",
    "liquidity.tokenB": "Token B",
    "liquidity.firstProvision":
      "This is the first liquidity for the {pair} pair. You set the initial price - enter any ratio of the two amounts.",
    "liquidity.poolRatio": "Pool ratio",
    "liquidity.minimumToken": "Minimum {symbol}",
    "liquidity.approveAndAdd": "Approve and Add Liquidity",
    "liquidity.addAction": "Add Liquidity",
    "liquidity.sameToken": "Choose two different tokens.",
    "liquidity.added": "Liquidity added.",
    "liquidity.addStatus": "Add ERC20 liquidity with slippage protection.",
    "liquidity.addProgressTitle": "Add liquidity progress",
    "liquidity.addProgressDescription":
      "Check A-Pass, approve required tokens if needed, then confirm add liquidity.",
    "liquidity.approvalSubmitted":
      "Approval submitted. Waiting for the token allowance to update.",
    "liquidity.addSubmitted":
      "Liquidity transaction submitted. You can close this window while it confirms on-chain.",
    "liquidity.addReverted": "Add liquidity transaction reverted.",
    "liquidity.approveFirst": "Grant the router permission to spend the first token.",
    "liquidity.approveSecond":
      "Grant the router permission to spend the second token.",
    "liquidity.addStepLabel": "Confirm add liquidity",
    "liquidity.addStepDescription":
      "Confirm the deposit after A-Pass and approvals are ready.",
    "liquidity.backToPositions": "Back to positions",
    "liquidity.connectPositions":
      "Connect your wallet to view liquidity positions.",
    "liquidity.loadingPositions": "Loading your positions...",
    "liquidity.noPositions": "You don't have any open liquidity positions.",
    "liquidity.yourPositions": "Your positions",
    "liquidity.poolShare": "pool share",
    "liquidity.pooled": "Pooled:",
    "liquidity.lpTokens": "LP tokens",
    "liquidity.minToken": "Min {symbol}",
    "liquidity.approveAndRemove": "Approve and Remove Liquidity",
    "liquidity.removed": "Liquidity removed.",
    "liquidity.exceedsPooled": "Exceeds pooled balance.",
    "liquidity.removeProgressTitle": "Remove liquidity progress",
    "liquidity.removeProgressDescription":
      "Check A-Pass, approve LP tokens if needed, then confirm remove liquidity.",
    "liquidity.lpApprovalSubmitted":
      "Approval submitted. Waiting for the LP allowance to update.",
    "liquidity.removeSubmitted":
      "Removal transaction submitted. You can close this window while it confirms on-chain.",
    "liquidity.removeReverted": "Remove liquidity transaction reverted.",
    "liquidity.approveLp": "Approve LP token",
    "liquidity.approveLpDescription":
      "Grant the router permission to burn your LP tokens.",
    "liquidity.removeStepLabel": "Confirm remove liquidity",
    "liquidity.removeStepDescription":
      "Confirm the withdrawal after A-Pass and approval are ready.",

    "token.selectAria": "Select a token",
    "token.searchSubtitle": "Search tokens from the configured token list",
    "token.closeSelector": "Close token selector",
    "token.searchPlaceholder": "Search name, symbol or address",
    "token.empty": "No token found in the configured token list.",

    "flow.status.pending": "Pending",
    "flow.status.checking": "Checking",
    "flow.status.active": "Waiting for wallet",
    "flow.status.confirming": "Confirming",
    "flow.status.success": "Done",
    "flow.status.skipped": "Skipped",
    "flow.status.error": "Failed",
    "flow.checkAPass": "Check A-Pass",
    "flow.checkAPassDescription":
      "Verify your A-Pass, tier, group, and token eligibility.",
    "flow.apassChecked": "A-Pass eligibility verified.",
    "flow.finalConfirming":
      "The transaction has been submitted. You can close this window and continue using the app while it confirms on-chain.",
    "flow.keepWallet":
      "Keep your wallet available for each signature. Closing this window will not cancel a submitted transaction.",

    "history.title": "Transaction History",
    "history.subtitle": "Recent confirmed actions saved on this device.",
    "history.close": "Close transaction history",
    "history.connect": "Connect your wallet to view transaction records.",
    "history.empty": "Successful swaps and liquidity actions will appear here.",
    "history.kind.add": "Add",
    "history.kind.remove": "Remove",
    "history.kind.swap": "Swap",
  },
  "zh-HK": {
    "language.en": "EN",
    "language.zhHK": "繁",
    "language.switch": "語言",
    "brand.subtitle": "建構於 Cleanverse",
    "nav.home": "首頁",
    "nav.swap": "兌換",
    "nav.liquidity": "流動性",
    "nav.product": "產品",
    "nav.how": "運作方式",
    "nav.useCases": "應用場景",
    "nav.faq": "常見問題",
    "nav.primary": "主要導覽",
    "nav.mobile": "手機導覽",
    "nav.open": "開啟導覽選單",
    "nav.close": "關閉導覽選單",

    "landing.hero.tag": "建構於 Cleanverse",
    "landing.hero.title": "鏈上兌換，即刻可信。",
    "landing.hero.subtitle":
      "ClevrSwap 將 A-Pass 合規帶入專注的兌換體驗：在各部署環境中提供合規感知的執行、透明路由與自我託管。",
    "landing.hero.ctaSwap": "開始兌換",
    "landing.hero.ctaLiquidity": "新增流動性",
    "landing.hero.chipBase": "支援 Base Sepolia",
    "landing.hero.chipRouting": "ERC-20 路由",
    "landing.hero.chipWallet": "錢包自控",
    "landing.hero.highlights": "平台重點",
    "landing.hero.swapAria": "ClevrSwap 快速兌換",
    "landing.problem.eyebrow": "問題",
    "landing.problem.title": "鏈上交易不應不透明或令人感到有風險。",
    "landing.problem.subtitle":
      "無需許可的兌換雖快，卻讓交易者缺乏身份脈絡、政策保障與清晰的稽核軌跡。",
    "landing.problem.routing.title": "路由不透明",
    "landing.problem.routing.description":
      "交易者通常看不到兌換如何路由，也不清楚實際承受的價格影響。",
    "landing.problem.identity.title": "對手方不明",
    "landing.problem.identity.description":
      "多數資金池對提供或取得流動性的對象缺乏身份脈絡。",
    "landing.problem.policy.title": "政策盲執行",
    "landing.problem.policy.description":
      "標準 DEX 流程無法在配發結算前套用資格規則。",
    "landing.problem.traceability.title": "可追溯性有限",
    "landing.problem.traceability.description":
      "交易部門與機構需要可審閱、可監控、可解釋的兌換流程。",
    "landing.solution.eyebrow": "ClevrSwap 層",
    "landing.solution.title": "合規兌換，無需面對底層的複雜性。",
    "landing.solution.subtitle":
      "ClevrSwap 將 Cleanverse 的合規能力帶入簡潔的兌換介面。在支援的網路上交易、與已驗證的參與者互動、審閱透明的執行。",
    "landing.solution.item1": "於支援網路上的政策感知兌換",
    "landing.solution.item2": "透明路由與清晰的價格影響",
    "landing.solution.item3": "透過 A-Pass 驗證的參與者",
    "landing.solution.item4": "支援如 A-Token 的合規資產",
    "landing.solution.item5": "全程錢包原生的自我託管執行",
    "landing.solution.item6": "可追溯的鏈上兌換紀錄",
    "landing.solution.cardTitle": "資格審查",
    "landing.solution.cardBadge": "交易前",
    "landing.solution.participant": "參與者 A-Pass",
    "landing.solution.valid": "有效",
    "landing.solution.assetSupport": "資產支援",
    "landing.solution.eligibilityRule": "資格規則",
    "landing.solution.network": "網路",
    "landing.solution.settlement": "結算",
    "landing.solution.cleared": "已核准執行",
    "landing.product.eyebrow": "產品",
    "landing.product.title": "環繞合規、透明的執行而打造。",
    "landing.feature.compliance.title": "合規優先的交易",
    "landing.feature.compliance.description":
      "為許可感知的 ERC-20 執行與利於稽核的交易流程打造的精緻兌換介面。",
    "landing.feature.routing.title": "透明路由",
    "landing.feature.routing.description":
      "在確認前查看路由、價格影響與滑點，沒有隱藏跳轉。",
    "landing.feature.apassEligibility.title": "A-Pass 資格驗證",
    "landing.feature.apassEligibility.description":
      "在確認前，我們會驗證你的連接錢包是否持有有效的 A-Pass，並具備領取所選 A-Token 的資格。",
    "landing.feature.custody.title": "自我託管執行",
    "landing.feature.custody.description":
      "你保有錢包控制權，介面則讓路由、確認與執行流程保持清晰。",
    "landing.feature.deployments.title": "可配置部署",
    "landing.feature.deployments.description":
      "鏈、路由器、工廠、封裝原生代幣與代幣中繼資料皆由配置驅動。",
    "landing.feature.cleanverse.title": "建構於 Cleanverse",
    "landing.feature.cleanverse.description":
      "A-Pass 身份與支援資產相互扣合，讓每筆兌換可問責。",
    "landing.how.eyebrow": "運作方式",
    "landing.how.title": "從錢包到完成兌換，四個步驟。",
    "landing.how.step1.title": "連接錢包",
    "landing.how.step1.description":
      "連接你的錢包以開始使用。",
    "landing.how.step2.title": "選擇代幣並檢視路由",
    "landing.how.step2.description":
      "選擇 A-Token 交易對，並檢視路由、價格影響與預估產出。",
    "landing.how.step3.title": "驗證 A-Pass 資格",
    "landing.how.step3.description":
      "在確認前，我們會驗證你的連接錢包是否持有有效的 A-Pass，並具備領取所選 A-Token 的資格。",
    "landing.how.step4.title": "確認、執行並追蹤",
    "landing.how.step4.description":
      "從錢包確認兌換，然後在同一處追蹤鏈上狀態、路由與可追溯資訊。",
    "landing.useCases.eyebrow": "應用場景",
    "landing.useCases.title": "為已驗證的鏈上市場而打造。",
    "landing.useCase.swaps.title": "合規代幣兌換",
    "landing.useCase.swaps.description":
      "在結算前套用身份與政策脈絡，兌換支援的資產。",
    "landing.useCase.liquidity.title": "提供流動性",
    "landing.useCase.liquidity.description":
      "以更清晰的參與者與資產脈絡向資金池提供流動性。",
    "landing.useCase.desk.title": "交易部門與資金執行",
    "landing.useCase.desk.description":
      "以透明路由與利於審閱的紀錄執行具規模的兌換。",
    "landing.useCase.institution.title": "機構連動流程",
    "landing.useCase.institution.description":
      "在核准情境下連動 Cleanverse 支援的資產與合規工作流程。",
    "landing.infrastructure.eyebrow": "基礎設施關係",
    "landing.infrastructure.title": "建構於 Cleanverse",
    "landing.infrastructure.subtitle":
      "Cleanverse 提供 ClevrSwap 背後的合規原生基礎設施：將已驗證身份與已驗證資產相互扣合，讓每筆兌換透明且可追溯。",
    "landing.infrastructure.layer1.title": "交易者 / LP",
    "landing.infrastructure.layer1.body": "發起兌換的個人與部門",
    "landing.infrastructure.layer2.title": "ClevrSwap 介面",
    "landing.infrastructure.layer2.body": "可信的兌換體驗",
    "landing.infrastructure.layer3.title": "Cleanverse 基礎設施",
    "landing.infrastructure.layer3.body": "合規原生的基礎",
    "landing.infrastructure.layer3.small":
      "已驗證身份 + 已驗證資產 + 可追溯轉移",
    "landing.infrastructure.capabilities": "Cleanverse 能力",
    "landing.infrastructure.policy": "政策控制",
    "landing.infrastructure.traceability": "可追溯性",
    "landing.infrastructure.multichain": "多鏈支援",
    "landing.mock.eyebrow": "近距離一覽",
    "landing.mock.title": "更清晰、更易讀的鏈上交易方式。",
    "landing.mock.swap": "兌換",
    "landing.mock.ready": "就緒",
    "landing.mock.pay": "支付",
    "landing.mock.receive": "取得",
    "landing.mock.apass": "A-Pass",
    "landing.mock.verified": "已驗證",
    "landing.mock.addLiquidity": "新增流動性",
    "landing.mock.pool": "資金池",
    "landing.mock.pair": "交易對",
    "landing.mock.poolShare": "資金池佔比",
    "landing.mock.swapDetail": "兌換明細",
    "landing.mock.amount": "金額",
    "landing.mock.status": "狀態",
    "landing.mock.confirmed": "已確認",
    "landing.mock.traceId": "追蹤編號",
    "landing.trust.eyebrow": "信任與合規",
    "landing.trust.title": "為已驗證的市場而設計，而非匿名。",
    "landing.trust.subtitle":
      "ClevrSwap 不把每個錢包都視為未知，而是運用 Cleanverse 的身份與資產驗證，打造更乾淨的交易環境。",
    "landing.trust.item1": "身份感知的兌換流程",
    "landing.trust.item2": "支援資產控制",
    "landing.trust.item3": "可追溯的交易紀錄",
    "landing.trust.item4": "網路感知的執行指引",
    "landing.trust.item5": "降低風險的使用體驗",
    "landing.trust.item6": "利於審閱的交易歷史",
    "landing.band.title": "透過更乾淨、合規的 DEX 開始交易。",
    "landing.band.subtitle":
      "以 ClevrSwap 為你的鏈上市場帶來政策感知的兌換與已驗證的參與者。",
    "landing.faq.eyebrow": "常見問題",
    "landing.faq.title": "問題，一一解答。",
    "landing.faq.q1": "什麼是 ClevrSwap？",
    "landing.faq.a1":
      "ClevrSwap 是建構於 Cleanverse 的合規感知 DEX 介面。它將 A-Pass 身份與支援資產控制帶入專注的兌換體驗，並提供透明路由與自我託管執行。",
    "landing.faq.q2": "什麼是 A-Pass？",
    "landing.faq.a2":
      "A-Pass 是 Cleanverse 的參與者資格憑證。它將已驗證的身份屬性綁定至錢包，使資格規則能在兌換結算前套用。",
    "landing.faq.q3": "ClevrSwap 是自我託管嗎？",
    "landing.faq.a3":
      "是。你全程保有錢包控制權。ClevrSwap 讓路由、滑點與確認狀態保持清晰，但絕不託管你的資產。",
    "landing.faq.q4": "支援哪些鏈與代幣？",
    "landing.faq.a4":
      "支援範圍依各部署的配置而定。目前的測試網環境運行於 Base Sepolia，採 ERC-20 路由並支援如 A-Token 的資產。",
    "landing.faq.q5": "ClevrSwap 適合誰？",
    "landing.faq.a5":
      "需要已驗證對手方、支援資產與利於審閱之執行的交易者、流動性提供者、交易部門與機構。",
    "landing.faq.q6": "每筆兌換都可追溯嗎？",
    "landing.faq.a6":
      "兌換會產生帶有路由、網路與狀態脈絡的鏈上紀錄，因此流程可被審閱、監控與解釋。",
    "landing.footer.tag":
      "面向已驗證鏈上市場的合規感知 DEX。設計上即為自我託管。",
    "landing.footer.product": "產品",
    "landing.footer.app": "應用",
    "landing.footer.contact": "聯絡團隊",
    "landing.footer.built": "建構於 Cleanverse · 測試網環境",
    "landing.footer.disclaimer":
      "ClevrSwap 是建構於 Cleanverse 基礎設施的技術介面。功能、資產與網路的可用性可能因地區、夥伴與合規要求而異。",

    "common.balance": "餘額：",
    "common.selectToken": "選擇代幣",
    "common.processing": "處理中...",
    "common.settings": "設定",
    "common.closeSettings": "關閉設定",
    "common.closeProgress": "關閉交易進度",
    "common.retry": "重試",
    "common.min": "分鐘",
    "common.configureRouter": "請在此配置 A-Pass 路由器：",
    "common.insufficientBalance": "餘額不足。",
    "common.checkingCompliance": "正在檢查 A-Pass 合規...",
    "common.transactionConfirmed": "交易已確認。",
    "common.savedToHistory": "已確認的交易已儲存在本機歷史紀錄。",
    "common.transactionRejected": "錢包已拒絕交易。",
    "common.transactionFailed": "交易失敗。",
    "common.approvalReverted": "授權交易已回滾。",
    "common.approvalAllowanceTimeout": "授權已確認，但額度未及時更新。",
    "common.maxSlippage": "最大滑點",
    "common.transactionWindow": "交易有效時間",
    "common.adjustSettings": "調整滑點容忍度與交易截止時間。",

    "swap.kicker": "A-Pass 路由",
    "swap.title": "合規兌換",
    "swap.settings": "兌換設定",
    "swap.from": "支付",
    "swap.to": "取得",
    "swap.bestPath": "最佳路徑",
    "swap.minimumReceived": "最少取得",
    "swap.approveAndSwap": "授權 {symbol} 並兌換",
    "swap.action": "兌換",
    "swap.statusActive": "合規就緒的 ERC20 兌換路由已啟用。",
    "swap.statusRefreshing": "正在更新報價...",
    "swap.statusNoRoute": "找不到此金額的路由。",
    "swap.statusSaved": "你的兌換已儲存到本機交易歷史。",
    "swap.progressTitle": "兌換進度",
    "swap.progressDescription": "先檢查 A-Pass，如有需要再授權，然後確認兌換。",
    "swap.approveSubmitted": "授權已送出，正在等待鏈上確認。",
    "swap.submitted": "兌換已送出。確認期間你可以關閉此視窗。",
    "swap.reverted": "兌換交易已回滾。",
    "swap.approveLabel": "授權 {symbol}",
    "swap.approveDescription": "允許路由器使用輸入代幣。",
    "swap.stepLabel": "確認兌換",
    "swap.stepDescription": "A-Pass 與授權就緒後確認兌換。",

    "liquidity.kicker": "資金池操作",
    "liquidity.titleAdd": "新增流動性",
    "liquidity.titleRemove": "移除流動性",
    "liquidity.add": "新增",
    "liquidity.remove": "移除",
    "liquidity.actions": "流動性操作",
    "liquidity.settings": "流動性設定",
    "liquidity.tokenA": "代幣 A",
    "liquidity.tokenB": "代幣 B",
    "liquidity.firstProvision":
      "這是 {pair} 交易對的首筆流動性。你將設定初始價格，請輸入任意比例的兩項金額。",
    "liquidity.poolRatio": "資金池比例",
    "liquidity.minimumToken": "最低 {symbol}",
    "liquidity.approveAndAdd": "授權並新增流動性",
    "liquidity.addAction": "新增流動性",
    "liquidity.sameToken": "請選擇兩個不同代幣。",
    "liquidity.added": "流動性已新增。",
    "liquidity.addStatus": "以滑點保護新增 ERC20 流動性。",
    "liquidity.addProgressTitle": "新增流動性進度",
    "liquidity.addProgressDescription": "先檢查 A-Pass，如有需要再授權代幣，然後確認新增流動性。",
    "liquidity.approvalSubmitted": "授權已送出，正在等待代幣額度更新。",
    "liquidity.addSubmitted": "流動性交易已送出。確認期間你可以關閉此視窗。",
    "liquidity.addReverted": "新增流動性交易已回滾。",
    "liquidity.approveFirst": "允許路由器使用第一個代幣。",
    "liquidity.approveSecond": "允許路由器使用第二個代幣。",
    "liquidity.addStepLabel": "確認新增流動性",
    "liquidity.addStepDescription": "A-Pass 與授權就緒後確認存入兩個代幣。",
    "liquidity.backToPositions": "返回持倉",
    "liquidity.connectPositions": "連接錢包以查看流動性持倉。",
    "liquidity.loadingPositions": "正在載入你的持倉...",
    "liquidity.noPositions": "你沒有任何開放中的流動性持倉。",
    "liquidity.yourPositions": "你的持倉",
    "liquidity.poolShare": "資金池佔比",
    "liquidity.pooled": "池中：",
    "liquidity.lpTokens": "LP 代幣",
    "liquidity.minToken": "最低 {symbol}",
    "liquidity.approveAndRemove": "授權並移除流動性",
    "liquidity.removed": "流動性已移除。",
    "liquidity.exceedsPooled": "超出池中餘額。",
    "liquidity.removeProgressTitle": "移除流動性進度",
    "liquidity.removeProgressDescription": "先檢查 A-Pass，如有需要再授權 LP 代幣，然後確認移除流動性。",
    "liquidity.lpApprovalSubmitted": "授權已送出，正在等待 LP 額度更新。",
    "liquidity.removeSubmitted": "移除交易已送出。確認期間你可以關閉此視窗。",
    "liquidity.removeReverted": "移除流動性交易已回滾。",
    "liquidity.approveLp": "授權 LP 代幣",
    "liquidity.approveLpDescription": "允許路由器銷毀你的 LP 代幣。",
    "liquidity.removeStepLabel": "確認移除流動性",
    "liquidity.removeStepDescription": "A-Pass 與授權就緒後確認取回底層資產。",

    "token.selectAria": "選擇代幣",
    "token.searchSubtitle": "從已配置的代幣清單搜尋",
    "token.closeSelector": "關閉代幣選擇器",
    "token.searchPlaceholder": "搜尋名稱、符號或地址",
    "token.empty": "在已配置的代幣清單中找不到代幣。",

    "flow.status.pending": "待處理",
    "flow.status.checking": "檢查中",
    "flow.status.active": "等待錢包",
    "flow.status.confirming": "確認中",
    "flow.status.success": "完成",
    "flow.status.skipped": "已略過",
    "flow.status.error": "失敗",
    "flow.checkAPass": "檢查 A-Pass",
    "flow.checkAPassDescription": "驗證你的 A-Pass、等級、群組與代幣資格。",
    "flow.apassChecked": "A-Pass 資格已通過。",
    "flow.finalConfirming": "交易已送出。鏈上確認期間，你可以關閉此視窗並繼續使用應用。",
    "flow.keepWallet": "請保持錢包可用以完成每次簽署。關閉此視窗不會取消已送出的交易。",

    "history.title": "交易歷史",
    "history.subtitle": "近期已確認操作會儲存在此裝置。",
    "history.close": "關閉交易歷史",
    "history.connect": "連接錢包以查看交易紀錄。",
    "history.empty": "成功的兌換與流動性操作會顯示在這裡。",
    "history.kind.add": "新增",
    "history.kind.remove": "移除",
    "history.kind.swap": "兌換",
  },
} as const

export type MessageKey = keyof typeof messages.en

type I18nContextValue = {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: (key: MessageKey, params?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nContextValue | null>(null)

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en")

  useEffect(() => {
    const storedLocale = window.localStorage.getItem(STORAGE_KEY)
    if (storedLocale === "en" || storedLocale === "zh-HK") {
      setLocaleState(storedLocale)
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = locale === "zh-HK" ? "zh-HK" : "en"
    window.localStorage.setItem(STORAGE_KEY, locale)
  }, [locale])

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale: setLocaleState,
      t: (key, params) => interpolate(messages[locale][key], params),
    }),
    [locale],
  )

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n() {
  const context = useContext(I18nContext)
  if (!context) {
    throw new Error("useI18n must be used within I18nProvider")
  }

  return context
}

function interpolate(
  message: string,
  params?: Record<string, string | number>,
) {
  if (!params) {
    return message
  }

  return Object.entries(params).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
    message,
  )
}
