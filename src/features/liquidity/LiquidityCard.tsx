"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import type { ReactNode } from "react"
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
import { v2FactoryAbi } from "@/dex/v2/abi/factory"
import { v2PairAbi } from "@/dex/v2/abi/pair"
import { v2RouterAbi } from "@/dex/v2/abi/router"
import { applySlippage, getDeadline, quoteLiquidity } from "@/dex/v2/quote"
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
import { TokenSelect } from "@/features/tokens/TokenSelect"
import {
  formatTokenBalance,
  useTokenBalance,
} from "@/features/tokens/useTokenBalance"
import { useTokenList } from "@/features/tokens/useTokenList"
import { saveTransactionHistoryEntry } from "@/features/transactions/transactionHistory"
import { useI18n, type MessageKey } from "@/i18n"

export function LiquidityCard() {
  const { t } = useI18n()
  const chainId = useChainId()
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { writeContractAsync, isPending } = useWriteContract()

  const deployment = getDexDeployment(chainId)
  const tokenListQuery = useTokenList(chainId, deployment)
  const tokens = tokenListQuery.data ?? deployment?.tokenList ?? []

  const [tokenAAddress, setTokenAAddress] = useState<`0x${string}` | "">(
    tokens[0]?.address ?? "",
  )
  const [tokenBAddress, setTokenBAddress] = useState<`0x${string}` | "">(
    tokens[1]?.address ?? "",
  )
  const [amountA, setAmountA] = useState("")
  const [amountB, setAmountB] = useState("")
  const [slippage, setSlippage] = useState("0.5")
  const [deadline, setDeadline] = useState("20")
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [error, setError] = useState("")
  const [txSuccess, setTxSuccess] = useState(false)
  const [flowOpen, setFlowOpen] = useState(false)
  const [flowRunning, setFlowRunning] = useState(false)
  const [flowError, setFlowError] = useState("")
  const [flowSteps, setFlowSteps] = useState<TransactionFlowStep[]>([])

  const tokenA = tokens.find((token) => token.address === tokenAAddress)
  const tokenB = tokens.find((token) => token.address === tokenBAddress)

  useEffect(() => {
    if (!tokenAAddress && tokens[0]) {
      setTokenAAddress(tokens[0].address)
    }

    if (!tokenBAddress && tokens[1]) {
      setTokenBAddress(tokens[1].address)
    }
  }, [tokenAAddress, tokenBAddress, tokens])

  const parsedAmountA = useMemo(
    () => parseTokenAmount(amountA, tokenA),
    [amountA, tokenA],
  )
  const parsedAmountB = useMemo(
    () => parseTokenAmount(amountB, tokenB),
    [amountB, tokenB],
  )
  const slippageBps = getSlippageBps(slippage)
  const deadlineMinutes = getDeadlineMinutes(deadline)
  const amountAMin = applySlippage(parsedAmountA, slippageBps)
  const amountBMin = applySlippage(parsedAmountB, slippageBps)
  const sameToken =
    Boolean(tokenAAddress) &&
    Boolean(tokenBAddress) &&
    tokenAAddress.toLowerCase() === tokenBAddress.toLowerCase()

  const allowanceAQuery = useReadContract({
    address: tokenA?.address,
    abi: erc20Abi,
    functionName: "allowance",
    args: address && deployment ? [address, deployment.router] : undefined,
    query: {
      enabled:
        Boolean(address) &&
        Boolean(deployment) &&
        Boolean(tokenA) &&
        deployment?.router !== zeroAddress,
    },
  })
  const allowanceBQuery = useReadContract({
    address: tokenB?.address,
    abi: erc20Abi,
    functionName: "allowance",
    args: address && deployment ? [address, deployment.router] : undefined,
    query: {
      enabled:
        Boolean(address) &&
        Boolean(deployment) &&
        Boolean(tokenB) &&
        deployment?.router !== zeroAddress,
    },
  })
  const balanceAQuery = useTokenBalance(tokenA, address)
  const balanceBQuery = useTokenBalance(tokenB, address)

  const pairQuery = useReadContract({
    address: deployment?.factory,
    abi: v2FactoryAbi,
    functionName: "getPair",
    args: tokenA && tokenB ? [tokenA.address, tokenB.address] : undefined,
    query: {
      enabled:
        Boolean(deployment) &&
        Boolean(tokenA) &&
        Boolean(tokenB) &&
        !sameToken &&
        deployment?.factory !== zeroAddress,
    },
  })
  const pairAddress = pairQuery.data
  const pairExists = Boolean(pairAddress) && pairAddress !== zeroAddress

  const reservesQuery = useReadContract({
    address: pairExists ? pairAddress : undefined,
    abi: v2PairAbi,
    functionName: "getReserves",
    query: { enabled: pairExists },
  })
  const token0Query = useReadContract({
    address: pairExists ? pairAddress : undefined,
    abi: v2PairAbi,
    functionName: "token0",
    query: { enabled: pairExists },
  })

  const { reserveA, reserveB } = useMemo(() => {
    const reserves = reservesQuery.data
    const token0 = token0Query.data
    if (!reserves || !token0 || !tokenA || !tokenB) {
      return { reserveA: 0n, reserveB: 0n }
    }

    const [reserve0, reserve1] = reserves
    if (token0.toLowerCase() === tokenA.address.toLowerCase()) {
      return { reserveA: reserve0, reserveB: reserve1 }
    }

    return { reserveA: reserve1, reserveB: reserve0 }
  }, [reservesQuery.data, token0Query.data, tokenA, tokenB])

  // Ratio is locked to the pool only when the pair already holds reserves.
  const ratioLocked = pairExists && reserveA > 0n && reserveB > 0n
  const isFirstProvision =
    Boolean(tokenA) &&
    Boolean(tokenB) &&
    !sameToken &&
    !pairQuery.isLoading &&
    !reservesQuery.isLoading &&
    !ratioLocked

  const allowanceA = allowanceAQuery.data ?? 0n
  const allowanceB = allowanceBQuery.data ?? 0n
  const balanceA = balanceAQuery.data ?? 0n
  const balanceB = balanceBQuery.data ?? 0n
  const complianceQuery = useTradeCompliance({
    address,
    deployment,
    publicClient,
    checkPoolCompliance: false,
    enabled:
      Boolean(address) &&
      Boolean(deployment) &&
      Boolean(tokenA) &&
      Boolean(tokenB) &&
      !sameToken,
    poolPairs: tokenA && tokenB ? [[tokenA.address, tokenB.address]] : [],
    tokenChecks:
      tokenA && tokenB
        ? [
            {
              token: tokenA.address,
              symbol: tokenA.symbol,
              amount: parsedAmountA,
              direction: "in",
            },
            {
              token: tokenB.address,
              symbol: tokenB.symbol,
              amount: parsedAmountB,
              direction: "in",
            },
          ]
        : [],
  })
  const insufficientBalanceA =
    parsedAmountA > 0n && Boolean(address) && parsedAmountA > balanceA
  const insufficientBalanceB =
    parsedAmountB > 0n && Boolean(address) && parsedAmountB > balanceB
  const insufficientBalance = insufficientBalanceA || insufficientBalanceB
  const needsApprovalA = parsedAmountA > 0n && allowanceA < parsedAmountA
  const needsApprovalB = parsedAmountB > 0n && allowanceB < parsedAmountB
  const complianceMessage =
    complianceQuery.data && !complianceQuery.data.allowed
      ? complianceQuery.data.message
      : ""
  const complianceAction =
    complianceQuery.data && "action" in complianceQuery.data
      ? complianceQuery.data.action
      : undefined
  const complianceInitialChecking =
    Boolean(tokenA) &&
    Boolean(tokenB) &&
    !sameToken &&
    (complianceQuery.isLoading ||
      (complianceQuery.isFetching && !complianceQuery.data))
  const complianceBlocked = complianceInitialChecking || Boolean(complianceMessage)
  const actionDisabled =
    !address ||
    !deployment ||
    deployment.router === zeroAddress ||
    !tokenA ||
    !tokenB ||
    sameToken ||
    parsedAmountA <= 0n ||
    parsedAmountB <= 0n ||
    insufficientBalance ||
    complianceBlocked ||
    isPending ||
    flowRunning

  async function executeAddLiquidityFlow() {
    setError("")
    setFlowError("")
    setTxSuccess(false)

    if (
      !address ||
      !deployment ||
      !publicClient ||
      !tokenA ||
      !tokenB ||
      sameToken ||
      parsedAmountA <= 0n ||
      parsedAmountB <= 0n
    ) {
      return
    }

    const nextSteps = createAddLiquidityFlowSteps(
      needsApprovalA ? tokenA.symbol : undefined,
      needsApprovalB ? tokenB.symbol : undefined,
      t,
    )
    let currentStepId = nextSteps[0]?.id ?? ""

    setFlowSteps(nextSteps)
    setFlowOpen(true)
    setFlowRunning(true)

    try {
      if (needsApprovalA) {
        currentStepId = "approve-a"
        updateFlowStep(setFlowSteps, currentStepId, { status: "active" })
        const approveHash = await writeContractAsync({
          address: tokenA.address,
          abi: erc20Abi,
          functionName: "approve",
          args: [deployment.router, parsedAmountA],
        })

        updateFlowStep(setFlowSteps, currentStepId, {
          status: "confirming",
          hash: approveHash,
          description: t("liquidity.approvalSubmitted"),
        })
        const approveReceipt = await publicClient.waitForTransactionReceipt({
          hash: approveHash,
        })
        if (approveReceipt.status !== "success") {
          throw new Error(t("common.approvalReverted"))
        }
        await waitForAllowance(() => allowanceAQuery.refetch(), parsedAmountA)
        updateFlowStep(setFlowSteps, currentStepId, { status: "success" })
      }

      if (needsApprovalB) {
        currentStepId = "approve-b"
        updateFlowStep(setFlowSteps, currentStepId, { status: "active" })
        const approveHash = await writeContractAsync({
          address: tokenB.address,
          abi: erc20Abi,
          functionName: "approve",
          args: [deployment.router, parsedAmountB],
        })

        updateFlowStep(setFlowSteps, currentStepId, {
          status: "confirming",
          hash: approveHash,
          description: t("liquidity.approvalSubmitted"),
        })
        const approveReceipt = await publicClient.waitForTransactionReceipt({
          hash: approveHash,
        })
        if (approveReceipt.status !== "success") {
          throw new Error(t("common.approvalReverted"))
        }
        await waitForAllowance(() => allowanceBQuery.refetch(), parsedAmountB)
        updateFlowStep(setFlowSteps, currentStepId, { status: "success" })
      }

      currentStepId = "add"
      updateFlowStep(setFlowSteps, currentStepId, { status: "active" })
      const addHash = await writeContractAsync({
        address: deployment.router,
        abi: v2RouterAbi,
        functionName: "addLiquidity",
        args: [
          tokenA.address,
          tokenB.address,
          parsedAmountA,
          parsedAmountB,
          amountAMin,
          amountBMin,
          address,
          getDeadline(deadlineMinutes),
        ],
      })

      updateFlowStep(setFlowSteps, currentStepId, {
        status: "confirming",
        hash: addHash,
        description: t("liquidity.addSubmitted"),
      })
      const addReceipt = await publicClient.waitForTransactionReceipt({
        hash: addHash,
      })
      if (addReceipt.status !== "success") {
        throw new Error(t("liquidity.addReverted"))
      }
      updateFlowStep(setFlowSteps, currentStepId, { status: "success" })
      saveTransactionHistoryEntry({
        kind: "add-liquidity",
        chainId,
        account: address,
        hash: addHash,
        title: `Add ${tokenA.symbol}/${tokenB.symbol}`,
        summary: `${t("history.kind.add")} ${formatUnits(parsedAmountA, tokenA.decimals)} ${tokenA.symbol} + ${formatUnits(parsedAmountB, tokenB.decimals)} ${tokenB.symbol}.`,
        primaryAmount: `${formatUnits(parsedAmountA, tokenA.decimals)} ${tokenA.symbol}`,
        secondaryAmount: `${formatUnits(parsedAmountB, tokenB.decimals)} ${tokenB.symbol}`,
      })
      setTxSuccess(true)
      await Promise.all([
        allowanceAQuery.refetch(),
        allowanceBQuery.refetch(),
        balanceAQuery.refetch(),
        balanceBQuery.refetch(),
        pairQuery.refetch(),
        reservesQuery.refetch(),
      ])
    } catch (err) {
      const message = getReadableError(err, t)
      setError(message)
      setFlowError(message)
      updateFlowStep(setFlowSteps, currentStepId, { status: "error" })
    } finally {
      setFlowRunning(false)
    }
  }

  function handleAmountAChange(value: string) {
    setAmountA(value)

    if (!ratioLocked || !tokenA || !tokenB) {
      return
    }

    const parsed = parseTokenAmount(value, tokenA)
    if (parsed <= 0n) {
      setAmountB("")
      return
    }

    setAmountB(formatUnits(quoteLiquidity(parsed, reserveA, reserveB), tokenB.decimals))
  }

  function handleAmountBChange(value: string) {
    setAmountB(value)

    if (!ratioLocked || !tokenA || !tokenB) {
      return
    }

    const parsed = parseTokenAmount(value, tokenB)
    if (parsed <= 0n) {
      setAmountA("")
      return
    }

    setAmountA(formatUnits(quoteLiquidity(parsed, reserveB, reserveA), tokenA.decimals))
  }

  function selectTokenA(nextAddress: `0x${string}` | "") {
    const previousTokenAAddress = tokenAAddress

    setTokenAAddress(nextAddress)

    if (nextAddress && isSameAddress(nextAddress, tokenBAddress)) {
      setTokenBAddress(
        previousTokenAAddress || getFallbackTokenAddress(tokens, nextAddress),
      )
    }
  }

  function selectTokenB(nextAddress: `0x${string}` | "") {
    const previousTokenBAddress = tokenBAddress

    setTokenBAddress(nextAddress)

    if (nextAddress && isSameAddress(nextAddress, tokenAAddress)) {
      setTokenAAddress(
        previousTokenBAddress || getFallbackTokenAddress(tokens, nextAddress),
      )
    }
  }

  return (
    <section className="swap-card liquidity-card">
      <SwapCardHeader
        kicker={t("liquidity.kicker")}
        title={t("liquidity.titleAdd")}
        actions={
          <nav className="liquidity-tabs" aria-label={t("liquidity.actions")}>
            <Link className="active" href="/liquidity/add">
              {t("liquidity.add")}
            </Link>
            <Link href="/liquidity/remove">{t("liquidity.remove")}</Link>
          </nav>
        }
        settingsLabel={t("liquidity.settings")}
        onSettingsClick={() => setSettingsOpen(true)}
      />

      <LiquidityField
        label={t("liquidity.tokenA")}
        token={tokenA}
        amount={amountA}
        balance={balanceA}
        onAmountChange={handleAmountAChange}
        tokenSelect={
          <TokenSelect
            tokens={tokens}
            value={tokenAAddress}
            onChange={selectTokenA}
            owner={address}
          />
        }
      />

      <div className="liquidity-pair-divider">+</div>

      <LiquidityField
        label={t("liquidity.tokenB")}
        token={tokenB}
        amount={amountB}
        balance={balanceB}
        onAmountChange={handleAmountBChange}
        tokenSelect={
          <TokenSelect
            tokens={tokens}
            value={tokenBAddress}
            onChange={selectTokenB}
            owner={address}
          />
        }
      />

      {isFirstProvision && tokenA && tokenB ? (
        <p className="status">
          {t("liquidity.firstProvision", {
            pair: `${tokenA.symbol}/${tokenB.symbol}`,
          })}
        </p>
      ) : null}

      <div className="quote-panel">
        {ratioLocked && tokenA && tokenB ? (
          <div className="quote-row">
            <span>{t("liquidity.poolRatio")}</span>
            <strong>
              1 {tokenA.symbol} ={" "}
              {formatUnits(
                quoteLiquidity(
                  parseUnits("1", tokenA.decimals),
                  reserveA,
                  reserveB,
                ),
                tokenB.decimals,
              )}{" "}
              {tokenB.symbol}
            </strong>
          </div>
        ) : null}
        <div className="quote-row">
          <span>
            {t("liquidity.minimumToken", {
              symbol: tokenA?.symbol ?? t("liquidity.tokenA"),
            })}
          </span>
          <strong>{formatMinimum(amountAMin, tokenA)}</strong>
        </div>
        <div className="quote-row">
          <span>
            {t("liquidity.minimumToken", {
              symbol: tokenB?.symbol ?? t("liquidity.tokenB"),
            })}
          </span>
          <strong>{formatMinimum(amountBMin, tokenB)}</strong>
        </div>
      </div>

      {complianceBlocked ? (
        complianceAction ? (
          <a
            className="primary-button compliance-action-button"
            href={complianceAction.href}
            rel="noreferrer"
            target="_blank"
          >
            <span>{complianceAction.label}</span>
            <small>{complianceMessage}</small>
          </a>
        ) : (
          <button className="primary-button" disabled type="button">
            {complianceMessage || t("common.checkingCompliance")}
          </button>
        )
      ) : (
        <button
          className="primary-button"
          disabled={actionDisabled}
          type="button"
          onClick={executeAddLiquidityFlow}
        >
          {flowRunning || isPending
            ? t("common.processing")
            : needsApprovalA || needsApprovalB
              ? t("liquidity.approveAndAdd")
              : t("liquidity.addAction")}
        </button>
      )}

      <LiquidityStatus
        deploymentReady={Boolean(deployment && deployment.router !== zeroAddress)}
        sameToken={sameToken}
        insufficientBalance={insufficientBalance}
        complianceLoading={false}
        complianceMessage=""
        txSuccess={txSuccess}
        error={error}
        t={t}
      />

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

      <TransactionFlowModal
        open={flowOpen}
        title={t("liquidity.addProgressTitle")}
        description={t("liquidity.addProgressDescription")}
        steps={flowSteps}
        error={flowError}
        onClose={() => setFlowOpen(false)}
      />
    </section>
  )
}

function LiquidityField({
  label,
  token,
  amount,
  balance,
  onAmountChange,
  tokenSelect,
}: {
  label: string
  token?: TokenInfo
  amount: string
  balance: bigint
  onAmountChange: (amount: string) => void
  tokenSelect: ReactNode
}) {
  const { t } = useI18n()

  return (
    <div className="field">
      <div className="field-label">
        <span>{label}</span>
        <span className="field-balance">
          {t("common.balance")}{" "}
          {token
            ? formatTokenBalance(balance, token.decimals, token.symbol)
            : "—"}
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
        {tokenSelect}
      </div>
    </div>
  )
}

function LiquidityStatus({
  deploymentReady,
  sameToken,
  insufficientBalance,
  complianceLoading,
  complianceMessage,
  txSuccess,
  error,
  t,
}: {
  deploymentReady: boolean
  sameToken: boolean
  insufficientBalance: boolean
  complianceLoading: boolean
  complianceMessage: string
  txSuccess: boolean
  error: string
  t: (key: MessageKey, params?: Record<string, string | number>) => string
}) {
  if (error) {
    return <p className="status error">{error}</p>
  }

  if (!deploymentReady) {
    return (
      <p className="status">
        {t("common.configureRouter")} <code>src/chains/deployments.ts</code>.
      </p>
    )
  }

  if (sameToken) {
    return <p className="status error">{t("liquidity.sameToken")}</p>
  }

  if (insufficientBalance) {
    return <p className="status error">{t("common.insufficientBalance")}</p>
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
        <strong>{t("liquidity.added")}</strong>
        <span>{t("common.savedToHistory")}</span>
      </p>
    )
  }

  return <p className="status">{t("liquidity.addStatus")}</p>
}

function parseTokenAmount(amount: string, token?: TokenInfo) {
  if (!token || !amount) {
    return 0n
  }

  try {
    return parseUnits(amount, token.decimals)
  } catch {
    return 0n
  }
}

function formatMinimum(amount: bigint, token?: TokenInfo) {
  if (!token || amount <= 0n) {
    return "-"
  }

  return `${formatUnits(amount, token.decimals)} ${token.symbol}`
}

function createAddLiquidityFlowSteps(
  tokenASymbol: string | undefined,
  tokenBSymbol: string | undefined,
  t: (key: MessageKey, params?: Record<string, string | number>) => string,
) {
  const steps: TransactionFlowStep[] = []

  if (tokenASymbol) {
    steps.push({
      id: "approve-a",
      label: t("swap.approveLabel", { symbol: tokenASymbol }),
      description: t("liquidity.approveFirst"),
      status: "pending",
    })
  }

  if (tokenBSymbol) {
    steps.push({
      id: "approve-b",
      label: t("swap.approveLabel", { symbol: tokenBSymbol }),
      description: t("liquidity.approveSecond"),
      status: "pending",
    })
  }

  steps.push({
    id: "add",
    label: t("liquidity.addStepLabel"),
    description: t("liquidity.addStepDescription"),
    status: "pending",
  })

  return steps
}

function isSameAddress(
  firstAddress: `0x${string}` | "",
  secondAddress: `0x${string}` | "",
) {
  return (
    Boolean(firstAddress) &&
    Boolean(secondAddress) &&
    firstAddress.toLowerCase() === secondAddress.toLowerCase()
  )
}

function getFallbackTokenAddress(
  tokens: TokenInfo[],
  excludedAddress: `0x${string}`,
) {
  return (
    tokens.find(
      (token) => token.address.toLowerCase() !== excludedAddress.toLowerCase(),
    )?.address ?? ""
  )
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
