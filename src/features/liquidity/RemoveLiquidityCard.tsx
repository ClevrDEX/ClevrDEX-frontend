"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { formatUnits, parseUnits, zeroAddress } from "viem"
import {
  useAccount,
  useChainId,
  usePublicClient,
  useReadContract,
  useWriteContract,
} from "wagmi"

import { getDexDeployment, type TokenInfo } from "@/chains/deployments"
import { useTradeCompliance } from "@/compliance/useTradeCompliance"
import { erc20Abi } from "@/dex/v2/abi/erc20"
import { v2PairAbi } from "@/dex/v2/abi/pair"
import { v2RouterAbi } from "@/dex/v2/abi/router"
import {
  applySlippage,
  getDeadline,
  quoteLpFromTokenAmount,
  quoteLiquidity,
  quoteRemoveLiquidity,
} from "@/dex/v2/quote"
import {
  getDeadlineMinutes,
  getSlippageBps,
} from "@/features/forms/numericInput"
import { SwapCardHeader } from "@/features/forms/SwapCardHeader"
import { TransactionSettingsModal } from "@/features/forms/TransactionSettingsModal"
import {
  TransactionFlowModal,
  type TransactionFlowStep,
  updateFlowStep,
  waitForAllowance,
} from "@/features/forms/TransactionFlowModal"
import { formatTokenBalance } from "@/features/tokens/useTokenBalance"
import { TokenAvatar } from "@/features/tokens/TokenAvatar"
import { useTokenList } from "@/features/tokens/useTokenList"
import {
  useLpPositions,
  type LpPosition,
} from "@/features/liquidity/useLpPositions"
import { saveTransactionHistoryEntry } from "@/features/transactions/transactionHistory"
import { useI18n, type MessageKey } from "@/i18n"

const LP_DECIMALS = 18
const PERCENTAGE_PRESETS = [25, 50, 75, 100] as const

export function RemoveLiquidityCard() {
  const { t } = useI18n()
  const chainId = useChainId()
  const { address } = useAccount()
  const deployment = getDexDeployment(chainId)
  const tokenListQuery = useTokenList(chainId, deployment)
  const tokens = tokenListQuery.data ?? deployment?.tokenList ?? []

  const [selectedPosition, setSelectedPosition] = useState<LpPosition | null>(
    null,
  )
  const positionsQuery = useLpPositions(chainId, tokens, address)
  const [slippage, setSlippage] = useState("0.5")
  const [deadline, setDeadline] = useState("20")
  const [settingsOpen, setSettingsOpen] = useState(false)

  useEffect(() => {
    if (!selectedPosition || !positionsQuery.data) {
      return
    }

    const stillExists = positionsQuery.data.some(
      (position) =>
        position.pairAddress.toLowerCase() ===
        selectedPosition.pairAddress.toLowerCase(),
    )

    if (!stillExists) {
      setSelectedPosition(null)
    }
  }, [positionsQuery.data, selectedPosition])

  return (
    <section className="swap-card liquidity-card">
      <RemoveLiquidityHeader
        selectedPosition={selectedPosition}
        onBack={() => setSelectedPosition(null)}
        onSettingsOpen={() => setSettingsOpen(true)}
      />

      {selectedPosition ? (
        <RemovePositionForm
          position={selectedPosition}
          slippage={slippage}
          deadline={deadline}
          onComplete={() => {
            positionsQuery.refetch()
          }}
        />
      ) : (
        <PositionList
          address={address}
          deploymentReady={Boolean(
            deployment && deployment.router !== zeroAddress,
          )}
          positions={positionsQuery.data ?? []}
          isLoading={positionsQuery.isLoading}
          onSelect={setSelectedPosition}
        />
      )}

      <TransactionSettingsModal
        open={settingsOpen}
        title={t("liquidity.settings")}
        description={t("common.adjustSettings")}
        slippage={slippage}
        deadline={deadline}
        onSlippageChange={setSlippage}
        onDeadlineChange={setDeadline}
        onClose={() => setSettingsOpen(false)}
      />
    </section>
  )
}

function RemoveLiquidityHeader({
  selectedPosition,
  onBack,
  onSettingsOpen,
}: {
  selectedPosition: LpPosition | null
  onBack: () => void
  onSettingsOpen: () => void
}) {
  const { t } = useI18n()

  return (
    <SwapCardHeader
      kicker={t("liquidity.kicker")}
      title={t("liquidity.titleRemove")}
      leading={
        selectedPosition ? (
          <button
            className="back-button"
            type="button"
            aria-label={t("liquidity.backToPositions")}
            onClick={onBack}
          >
            ←
          </button>
        ) : null
      }
      actions={
        <nav className="liquidity-tabs" aria-label={t("liquidity.actions")}>
          <Link href="/liquidity/add">{t("liquidity.add")}</Link>
          <Link className="active" href="/liquidity/remove">
            {t("liquidity.remove")}
          </Link>
        </nav>
      }
      settingsLabel={t("liquidity.settings")}
      onSettingsClick={onSettingsOpen}
    />
  )
}

function PositionList({
  address,
  deploymentReady,
  positions,
  isLoading,
  onSelect,
}: {
  address?: `0x${string}`
  deploymentReady: boolean
  positions: LpPosition[]
  isLoading: boolean
  onSelect: (position: LpPosition) => void
}) {
  const { t } = useI18n()

  if (!deploymentReady) {
    return (
      <p className="status">
        {t("common.configureRouter")} <code>src/chains/deployments.ts</code>.
      </p>
    )
  }

  if (!address) {
    return <p className="status">{t("liquidity.connectPositions")}</p>
  }

  if (isLoading) {
    return <p className="status">{t("liquidity.loadingPositions")}</p>
  }

  if (positions.length === 0) {
    return (
      <div className="lp-empty-state">
        <p className="status">{t("liquidity.noPositions")}</p>
        <Link className="primary-button" href="/liquidity/add">
          {t("liquidity.addAction")}
        </Link>
      </div>
    )
  }

  return (
    <div className="lp-positions lp-positions-main">
      <span className="lp-positions-label">{t("liquidity.yourPositions")}</span>
      {positions.map((position) => (
        <button
          key={position.pairAddress}
          className="lp-position-item"
          type="button"
          onClick={() => onSelect(position)}
        >
          <div className="lp-position-main">
            <strong>
              {position.tokenA.symbol}/{position.tokenB.symbol}
            </strong>
            <span className="lp-position-share">
              {position.poolShare.toFixed(4)}% {t("liquidity.poolShare")}
            </span>
          </div>
          <div className="lp-position-details">
            <span>
              {formatOutput(position.amountA, position.tokenA)} +{" "}
              {formatOutput(position.amountB, position.tokenB)}
            </span>
            <span className="lp-position-chevron" aria-hidden="true">
              ›
            </span>
          </div>
        </button>
      ))}
    </div>
  )
}

function RemovePositionForm({
  position,
  slippage,
  deadline,
  onComplete,
}: {
  position: LpPosition
  slippage: string
  deadline: string
  onComplete: () => void
}) {
  const { t } = useI18n()
  const { address } = useAccount()
  const chainId = useChainId()
  const deployment = getDexDeployment(chainId)
  const publicClient = usePublicClient()
  const { writeContractAsync, isPending } = useWriteContract()

  const [amount0, setAmount0] = useState("")
  const [amount1, setAmount1] = useState("")
  const [error, setError] = useState("")
  const [txSuccess, setTxSuccess] = useState(false)
  const [flowOpen, setFlowOpen] = useState(false)
  const [flowRunning, setFlowRunning] = useState(false)
  const [flowError, setFlowError] = useState("")
  const [flowSteps, setFlowSteps] = useState<TransactionFlowStep[]>([])

  const { tokenA, tokenB, pairAddress } = position
  const slippageBps = getSlippageBps(slippage)
  const deadlineMinutes = getDeadlineMinutes(deadline)

  const lpBalanceQuery = useReadContract({
    address: pairAddress,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: address ? [address] : undefined,
    query: { enabled: Boolean(address) },
  })
  const totalSupplyQuery = useReadContract({
    address: pairAddress,
    abi: erc20Abi,
    functionName: "totalSupply",
  })
  const lpAllowanceQuery = useReadContract({
    address: pairAddress,
    abi: erc20Abi,
    functionName: "allowance",
    args: address && deployment ? [address, deployment.router] : undefined,
    query: {
      enabled:
        Boolean(address) &&
        Boolean(deployment) &&
        deployment?.router !== zeroAddress,
    },
  })
  const reservesQuery = useReadContract({
    address: pairAddress,
    abi: v2PairAbi,
    functionName: "getReserves",
  })
  const token0Query = useReadContract({
    address: pairAddress,
    abi: v2PairAbi,
    functionName: "token0",
  })

  const lpBalance = lpBalanceQuery.data ?? position.lpBalance
  const totalSupply = totalSupplyQuery.data ?? position.totalSupply
  const lpAllowance = lpAllowanceQuery.data ?? 0n

  const { token0, token1, reserve0, reserve1, maxAmount0, maxAmount1 } =
    useMemo(() => {
      const reserves = reservesQuery.data
      const token0Address = token0Query.data
      if (!reserves || !token0Address) {
        return {
          token0: tokenA,
          token1: tokenB,
          reserve0: 0n,
          reserve1: 0n,
          maxAmount0: 0n,
          maxAmount1: 0n,
        }
      }

      const [poolReserve0, poolReserve1] = reserves
      const isToken0A =
        token0Address.toLowerCase() === tokenA.address.toLowerCase()
      const nextToken0 = isToken0A ? tokenA : tokenB
      const nextToken1 = isToken0A ? tokenB : tokenA
      const nextMaxAmount0 =
        totalSupply > 0n ? (lpBalance * poolReserve0) / totalSupply : 0n
      const nextMaxAmount1 =
        totalSupply > 0n ? (lpBalance * poolReserve1) / totalSupply : 0n

      return {
        token0: nextToken0,
        token1: nextToken1,
        reserve0: poolReserve0,
        reserve1: poolReserve1,
        maxAmount0: nextMaxAmount0,
        maxAmount1: nextMaxAmount1,
      }
    }, [
      lpBalance,
      reservesQuery.data,
      token0Query.data,
      tokenA,
      tokenB,
      totalSupply,
    ])

  const parsedAmount0 = useMemo(
    () => parseTokenAmount(amount0, token0),
    [amount0, token0],
  )
  const parsedAmount1 = useMemo(
    () => parseTokenAmount(amount1, token1),
    [amount1, token1],
  )
  const parsedLpAmount = useMemo(() => {
    if (parsedAmount0 > 0n) {
      return quoteLpFromTokenAmount(parsedAmount0, reserve0, totalSupply)
    }

    if (parsedAmount1 > 0n) {
      return quoteLpFromTokenAmount(parsedAmount1, reserve1, totalSupply)
    }

    return 0n
  }, [parsedAmount0, parsedAmount1, reserve0, reserve1, totalSupply])

  const amount0Min = applySlippage(parsedAmount0, slippageBps)
  const amount1Min = applySlippage(parsedAmount1, slippageBps)
  const tokenAIsToken0 =
    tokenA.address.toLowerCase() === token0.address.toLowerCase()
  const amountAMin = tokenAIsToken0 ? amount0Min : amount1Min
  const amountBMin = tokenAIsToken0 ? amount1Min : amount0Min

  const poolShare =
    totalSupply > 0n && lpBalance > 0n
      ? Number((lpBalance * 10_000n) / totalSupply) / 100
      : 0

  const insufficientBalance =
    (parsedAmount0 > 0n && parsedAmount0 > maxAmount0) ||
    (parsedAmount1 > 0n && parsedAmount1 > maxAmount1) ||
    (parsedLpAmount > 0n && parsedLpAmount > lpBalance)
  const needsApproval = parsedLpAmount > 0n && lpAllowance < parsedLpAmount
  const complianceQuery = useTradeCompliance({
    address,
    deployment,
    publicClient,
    enabled:
      Boolean(address) &&
      Boolean(deployment),
    poolPairs: [[tokenA.address, tokenB.address]],
    tokenChecks: [
      {
        token: token0.address,
        symbol: token0.symbol,
        amount: parsedAmount0,
        direction: "out",
      },
      {
        token: token1.address,
        symbol: token1.symbol,
        amount: parsedAmount1,
        direction: "out",
      },
    ],
  })
  const complianceMessage =
    complianceQuery.data && !complianceQuery.data.allowed
      ? complianceQuery.data.message
      : ""
  const complianceAction =
    complianceQuery.data && "action" in complianceQuery.data
      ? complianceQuery.data.action
      : undefined
  const complianceInitialChecking =
    complianceQuery.isLoading ||
    (complianceQuery.isFetching && !complianceQuery.data)
  const complianceBlocked = complianceInitialChecking || Boolean(complianceMessage)
  const actionDisabled =
    !address ||
    !deployment ||
    deployment.router === zeroAddress ||
    parsedLpAmount <= 0n ||
    insufficientBalance ||
    complianceBlocked ||
    isPending ||
    flowRunning

  async function executeRemoveLiquidityFlow() {
    setError("")
    setFlowError("")
    setTxSuccess(false)

    if (!address || !deployment || !publicClient || parsedLpAmount <= 0n) {
      return
    }

    const nextSteps = createRemoveLiquidityFlowSteps(needsApproval, t)
    let currentStepId = nextSteps[0]?.id ?? ""

    setFlowSteps(nextSteps)
    setFlowOpen(true)
    setFlowRunning(true)

    try {
      if (needsApproval) {
        currentStepId = "approve-lp"
        updateFlowStep(setFlowSteps, currentStepId, { status: "active" })
        const approveHash = await writeContractAsync({
          address: pairAddress,
          abi: erc20Abi,
          functionName: "approve",
          args: [deployment.router, parsedLpAmount],
        })

        updateFlowStep(setFlowSteps, currentStepId, {
          status: "confirming",
          hash: approveHash,
          description: t("liquidity.lpApprovalSubmitted"),
        })
        const approveReceipt = await publicClient.waitForTransactionReceipt({
          hash: approveHash,
        })
        if (approveReceipt.status !== "success") {
          throw new Error(t("common.approvalReverted"))
        }
        await waitForAllowance(() => lpAllowanceQuery.refetch(), parsedLpAmount)
        updateFlowStep(setFlowSteps, currentStepId, { status: "success" })
      }

      currentStepId = "remove"
      updateFlowStep(setFlowSteps, currentStepId, { status: "active" })
      const removeHash = await writeContractAsync({
        address: deployment.router,
        abi: v2RouterAbi,
        functionName: "removeLiquidity",
        args: [
          tokenA.address,
          tokenB.address,
          parsedLpAmount,
          amountAMin,
          amountBMin,
          address,
          getDeadline(deadlineMinutes),
        ],
      })

      updateFlowStep(setFlowSteps, currentStepId, {
        status: "confirming",
        hash: removeHash,
        description: t("liquidity.removeSubmitted"),
      })
      const removeReceipt = await publicClient.waitForTransactionReceipt({
        hash: removeHash,
      })
      if (removeReceipt.status !== "success") {
        throw new Error(t("liquidity.removeReverted"))
      }
      updateFlowStep(setFlowSteps, currentStepId, { status: "success" })
      saveTransactionHistoryEntry({
        kind: "remove-liquidity",
        chainId,
        account: address,
        hash: removeHash,
        title: `Remove ${tokenA.symbol}/${tokenB.symbol}`,
        summary: `${t("history.kind.remove")} ${formatOutput(parsedAmount0, token0)} + ${formatOutput(parsedAmount1, token1)}.`,
        primaryAmount: formatOutput(parsedAmount0, token0),
        secondaryAmount: formatOutput(parsedAmount1, token1),
      })
      setTxSuccess(true)
      await Promise.all([
        lpBalanceQuery.refetch(),
        lpAllowanceQuery.refetch(),
        reservesQuery.refetch(),
      ])
      onComplete()
    } catch (err) {
      const message = getReadableError(err, t)
      setError(message)
      setFlowError(message)
      updateFlowStep(setFlowSteps, currentStepId, { status: "error" })
    } finally {
      setFlowRunning(false)
    }
  }

  function handleAmount0Change(value: string) {
    setAmount0(value)

    if (parseTokenAmount(value, token0) <= 0n) {
      setAmount1("")
      return
    }

    const parsed = parseTokenAmount(value, token0)
    setAmount1(
      formatUnits(
        quoteLiquidity(parsed, maxAmount0 || reserve0, maxAmount1 || reserve1),
        token1.decimals,
      ),
    )
  }

  function handleAmount1Change(value: string) {
    setAmount1(value)

    if (parseTokenAmount(value, token1) <= 0n) {
      setAmount0("")
      return
    }

    const parsed = parseTokenAmount(value, token1)
    setAmount0(
      formatUnits(
        quoteLiquidity(parsed, maxAmount1 || reserve1, maxAmount0 || reserve0),
        token0.decimals,
      ),
    )
  }

  function setPercentage(percentage: number) {
    if (lpBalance <= 0n || totalSupply <= 0n) {
      return
    }

    const liquidity = (lpBalance * BigInt(percentage)) / 100n
    const { amountA, amountB } = quoteRemoveLiquidity(
      liquidity,
      reserve0,
      reserve1,
      totalSupply,
    )

    setAmount0(formatUnits(amountA, token0.decimals))
    setAmount1(formatUnits(amountB, token1.decimals))
  }

  return (
    <>
      <div className="remove-position-summary">
        <div className="remove-pool-pair">
          <div className="remove-pool-pair-main">
            <span className="remove-pool-token">
              <TokenAvatar token={token0} />
              <strong>{token0.symbol}</strong>
            </span>
            <span className="remove-pool-divider">/</span>
            <span className="remove-pool-token">
              <TokenAvatar token={token1} />
              <strong>{token1.symbol}</strong>
            </span>
          </div>
          <span className="remove-pool-share">{poolShare.toFixed(2)}%</span>
        </div>
      </div>

      <div className="remove-amount-section">
        <RemoveTokenField
          label={token0.symbol}
          token={token0}
          amount={amount0}
          maxAmount={maxAmount0}
          onAmountChange={handleAmount0Change}
        />

        <div className="liquidity-pair-divider">+</div>

        <RemoveTokenField
          label={token1.symbol}
          token={token1}
          amount={amount1}
          maxAmount={maxAmount1}
          onAmountChange={handleAmount1Change}
        />

        <div className="percentage-presets">
          {PERCENTAGE_PRESETS.map((percentage) => (
            <button
              key={percentage}
              className="percentage-preset"
              type="button"
              disabled={lpBalance <= 0n}
              onClick={() => setPercentage(percentage)}
            >
              {percentage}%
            </button>
          ))}
        </div>

        <div className="remove-lp-meta">
          <div className="remove-lp-meta-row">
            <span>{t("liquidity.lpTokens")}</span>
            <strong>
              {parsedLpAmount > 0n
                ? formatTokenBalance(parsedLpAmount, LP_DECIMALS, "LP")
                : formatTokenBalance(0n, LP_DECIMALS, "LP")}
            </strong>
          </div>
          {parsedLpAmount > 0n ? (
            <div className="remove-lp-meta-minimums">
              <span>
                {t("liquidity.minToken", { symbol: token0.symbol })}:{" "}
                {formatOutput(amount0Min, token0)}
              </span>
              <span>
                {t("liquidity.minToken", { symbol: token1.symbol })}:{" "}
                {formatOutput(amount1Min, token1)}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="remove-form-actions">
        {complianceBlocked ? (
          complianceAction ? (
            <a
              className="primary-button remove-action-button compliance-action-button"
              href={complianceAction.href}
              rel="noreferrer"
              target="_blank"
            >
              <span>{complianceAction.label}</span>
              <small>{complianceMessage}</small>
            </a>
          ) : (
            <button
              className="primary-button remove-action-button"
              disabled
              type="button"
            >
              {complianceMessage || t("common.checkingCompliance")}
            </button>
          )
        ) : (
          <button
            className="primary-button remove-action-button"
            disabled={actionDisabled}
            type="button"
            onClick={executeRemoveLiquidityFlow}
          >
            {flowRunning || isPending
              ? t("common.processing")
              : needsApproval
                ? t("liquidity.approveAndRemove")
                : t("liquidity.titleRemove")}
          </button>
        )}
      </div>

      <RemoveFormStatus
        error={error}
        insufficientBalance={insufficientBalance}
        complianceLoading={false}
        complianceMessage=""
        txSuccess={txSuccess}
        t={t}
      />

      <TransactionFlowModal
        open={flowOpen}
        title={t("liquidity.removeProgressTitle")}
        description={t("liquidity.removeProgressDescription")}
        steps={flowSteps}
        error={flowError}
        onClose={() => setFlowOpen(false)}
      />
    </>
  )
}

function RemoveTokenField({
  label,
  token,
  amount,
  maxAmount,
  onAmountChange,
}: {
  label: string
  token: TokenInfo
  amount: string
  maxAmount: bigint
  onAmountChange: (amount: string) => void
}) {
  const { t } = useI18n()

  return (
    <div className="field">
      <div className="field-label">
        <span>{label}</span>
        <span className="field-balance">
          {t("liquidity.pooled")}{" "}
          {formatTokenBalance(maxAmount, token.decimals, token.symbol)}
        </span>
      </div>
      <div className="field-row">
        <input
          className="amount-input"
          inputMode="decimal"
          placeholder="0.0"
          value={amount}
          onChange={(event) => onAmountChange(event.target.value)}
        />
        <div className="token-chip">
          <TokenAvatar token={token} />
          <span>{token.symbol}</span>
        </div>
      </div>
    </div>
  )
}

function RemoveFormStatus({
  error,
  insufficientBalance,
  complianceLoading,
  complianceMessage,
  txSuccess,
  t,
}: {
  error: string
  insufficientBalance: boolean
  complianceLoading: boolean
  complianceMessage: string
  txSuccess: boolean
  t: (key: MessageKey, params?: Record<string, string | number>) => string
}) {
  if (error) {
    return <p className="status error">{error}</p>
  }

  if (insufficientBalance) {
    return <p className="status error">{t("liquidity.exceedsPooled")}</p>
  }

  if (complianceMessage) {
    return <p className="status error">{complianceMessage}</p>
  }

  if (complianceLoading) {
    return <p className="status">{t("common.checkingCompliance")}</p>
  }

  if (txSuccess) {
    return (
      <p className="status success">
        <strong>{t("liquidity.removed")}</strong>
        <span>{t("common.savedToHistory")}</span>
      </p>
    )
  }

  return null
}

function parseTokenAmount(amount: string, token: TokenInfo) {
  if (!amount) {
    return 0n
  }

  try {
    return parseUnits(amount, token.decimals)
  } catch {
    return 0n
  }
}

function formatOutput(amount: bigint, token: TokenInfo) {
  if (amount <= 0n) {
    return "0"
  }

  return `${formatUnits(amount, token.decimals)} ${token.symbol}`
}

function createRemoveLiquidityFlowSteps(
  needsApproval: boolean,
  t: (key: MessageKey, params?: Record<string, string | number>) => string,
) {
  const steps: TransactionFlowStep[] = []

  if (needsApproval) {
    steps.push({
      id: "approve-lp",
      label: t("liquidity.approveLp"),
      description: t("liquidity.approveLpDescription"),
      status: "pending",
    })
  }

  steps.push({
    id: "remove",
    label: t("liquidity.removeStepLabel"),
    description: t("liquidity.removeStepDescription"),
    status: "pending",
  })

  return steps
}

function getReadableError(
  error: unknown,
  t: (key: MessageKey, params?: Record<string, string | number>) => string,
) {
  if (error instanceof Error) {
    const message = error.message
    const normalizedMessage = message.toLowerCase()

    if (
      normalizedMessage.includes("user rejected") ||
      normalizedMessage.includes("user denied")
    ) {
      return t("common.transactionRejected")
    }

    return (
      message.split(/\n| Request Arguments:| Contract Call:| Details:/)[0] ||
      t("common.transactionFailed")
    )
  }

  return t("common.transactionFailed")
}
