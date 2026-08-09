"use client"

import { useQuery } from "@tanstack/react-query"
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
import { erc20Abi } from "@/dex/v2/abi/erc20"
import { v2RouterAbi } from "@/dex/v2/abi/router"
import { buildCandidatePaths } from "@/dex/v2/paths"
import { applySlippage, getBestQuote, getDeadline } from "@/dex/v2/quote"
import {
  getDeadlineMinutes,
  getSlippageBps,
} from "@/features/forms/numericInput"
import { SwapCardHeader } from "@/features/forms/SwapCardHeader"
import { TokenSelect } from "@/features/tokens/TokenSelect"
import {
  formatTokenBalance,
  useTokenBalance,
} from "@/features/tokens/useTokenBalance"
import { useTokenList } from "@/features/tokens/useTokenList"
import { TransactionSettingsModal } from "@/features/forms/TransactionSettingsModal"
import {
  TransactionFlowModal,
  type TransactionFlowStep,
  updateFlowStep,
  waitForAllowance,
} from "@/features/forms/TransactionFlowModal"
import { useTradeCompliance } from "@/compliance/useTradeCompliance"
import { saveTransactionHistoryEntry } from "@/features/transactions/transactionHistory"
import { useI18n, type MessageKey } from "@/i18n"

export function SwapCard() {
  const { t } = useI18n()
  const chainId = useChainId()
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { writeContractAsync, isPending } = useWriteContract()

  const deployment = getDexDeployment(chainId)
  const tokenListQuery = useTokenList(chainId, deployment)
  const tokens = tokenListQuery.data ?? deployment?.tokenList ?? []

  const [tokenInAddress, setTokenInAddress] = useState<`0x${string}` | "">(
    tokens[0]?.address ?? "",
  )
  const [tokenOutAddress, setTokenOutAddress] = useState<`0x${string}` | "">(
    tokens[1]?.address ?? "",
  )
  const [amountIn, setAmountIn] = useState("")
  const [slippage, setSlippage] = useState("0.5")
  const [deadline, setDeadline] = useState("20")
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [error, setError] = useState("")
  const [txSuccess, setTxSuccess] = useState(false)
  const [flowOpen, setFlowOpen] = useState(false)
  const [flowRunning, setFlowRunning] = useState(false)
  const [flowError, setFlowError] = useState("")
  const [flowCanRetry, setFlowCanRetry] = useState(false)
  const [flowSteps, setFlowSteps] = useState<TransactionFlowStep[]>([])

  const tokenIn = tokens.find((token) => token.address === tokenInAddress)
  const tokenOut = tokens.find((token) => token.address === tokenOutAddress)

  useEffect(() => {
    if (!tokenInAddress && tokens[0]) {
      setTokenInAddress(tokens[0].address)
    }

    if (!tokenOutAddress && tokens[1]) {
      setTokenOutAddress(tokens[1].address)
    }
  }, [tokenInAddress, tokenOutAddress, tokens])

  const parsedAmountIn = useMemo(() => {
    if (!tokenIn || !amountIn) {
      return 0n
    }

    try {
      return parseUnits(amountIn, tokenIn.decimals)
    } catch {
      return 0n
    }
  }, [amountIn, tokenIn])

  const paths = useMemo(() => {
    if (!deployment || !tokenIn || !tokenOut) {
      return []
    }

    return buildCandidatePaths(
      tokenIn.address,
      tokenOut.address,
      deployment.baseTokens.map((token) => token.address),
    )
  }, [deployment, tokenIn, tokenOut])

  const quoteQuery = useQuery({
    queryKey: [
      "v2-quote",
      chainId,
      deployment?.router,
      tokenIn?.address,
      tokenOut?.address,
      parsedAmountIn.toString(),
      paths.map((path) => path.join("-")),
    ],
    enabled:
      Boolean(publicClient) &&
      Boolean(deployment) &&
      deployment?.router !== zeroAddress &&
      parsedAmountIn > 0n &&
      paths.length > 0,
    queryFn: async () => {
      if (!publicClient || !deployment) {
        return undefined
      }

      return getBestQuote({
        client: publicClient,
        router: deployment.router,
        amountIn: parsedAmountIn,
        paths,
      })
    },
    refetchInterval: 12_000,
  })

  const allowanceQuery = useReadContract({
    address: tokenIn?.address,
    abi: erc20Abi,
    functionName: "allowance",
    args: address && deployment ? [address, deployment.router] : undefined,
    query: {
      enabled:
        Boolean(address) &&
        Boolean(deployment) &&
        Boolean(tokenIn) &&
        deployment?.router !== zeroAddress,
    },
  })
  const balanceInQuery = useTokenBalance(tokenIn, address)

  const bestQuote = quoteQuery.data
  const amountOut = bestQuote?.amountOut ?? 0n
  const slippageBps = getSlippageBps(slippage)
  const deadlineMinutes = getDeadlineMinutes(deadline)
  const minimumReceived = applySlippage(amountOut, slippageBps)
  const allowance = allowanceQuery.data ?? 0n
  const balanceIn = balanceInQuery.data ?? 0n
  const compliancePath = useMemo(() => {
    if (bestQuote) {
      return bestQuote.path
    }

    if (tokenIn && tokenOut && !isSameAddress(tokenIn.address, tokenOut.address)) {
      return [tokenIn.address, tokenOut.address]
    }

    return []
  }, [bestQuote, tokenIn, tokenOut])
  const complianceQuery = useTradeCompliance({
    address,
    deployment,
    publicClient,
    enabled: false,
    poolPairs: getPathPairs(compliancePath),
    tokenChecks: compliancePath.map((tokenAddress, index) => ({
          token: tokenAddress,
          symbol: getTokenSymbol(tokens, tokenAddress),
      amount: bestQuote?.amounts[index] ?? 0n,
          direction: index === 0 ? "in" : "out",
    })),
  })
  const insufficientBalance =
    parsedAmountIn > 0n && Boolean(address) && parsedAmountIn > balanceIn
  const needsApproval = parsedAmountIn > 0n && allowance < parsedAmountIn
  const swapDisabled =
    !address ||
    !deployment ||
    deployment.router === zeroAddress ||
    !tokenIn ||
    !tokenOut ||
    !bestQuote ||
    parsedAmountIn <= 0n ||
    insufficientBalance ||
    isPending ||
    flowRunning

  async function executeSwapFlow() {
    setError("")
    setFlowError("")
    setFlowCanRetry(false)
    setTxSuccess(false)

    if (
      !address ||
      !deployment ||
      !publicClient ||
      !tokenIn ||
      !bestQuote ||
      parsedAmountIn <= 0n
    ) {
      return
    }

    const nextSteps = createSwapFlowSteps(needsApproval, tokenIn.symbol, t)
    let currentStepId = nextSteps[0]?.id ?? ""

    setFlowSteps(nextSteps)
    setFlowOpen(true)
    setFlowRunning(true)

    try {
      currentStepId = "check-apass"
      updateFlowStep(setFlowSteps, currentStepId, { status: "checking" })
      const complianceResult = await complianceQuery.refetch()
      if (complianceResult.error) {
        throw complianceResult.error
      }
      if (!complianceResult.data?.allowed) {
        throw new Error(
          complianceResult.data?.message || t("common.transactionFailed"),
        )
      }
      updateFlowStep(setFlowSteps, currentStepId, {
        status: "success",
        description: t("flow.apassChecked"),
      })

      if (needsApproval) {
        currentStepId = "approve"
        updateFlowStep(setFlowSteps, currentStepId, { status: "active" })
        const approveHash = await writeContractAsync({
          address: tokenIn.address,
          abi: erc20Abi,
          functionName: "approve",
          args: [deployment.router, parsedAmountIn],
        })

        updateFlowStep(setFlowSteps, currentStepId, {
          status: "confirming",
          hash: approveHash,
          description: t("swap.approveSubmitted"),
        })
        const approveReceipt = await publicClient.waitForTransactionReceipt({
          hash: approveHash,
        })
        if (approveReceipt.status !== "success") {
          throw new Error(t("common.approvalReverted"))
        }
        await waitForAllowance(() => allowanceQuery.refetch(), parsedAmountIn)
        updateFlowStep(setFlowSteps, currentStepId, { status: "success" })
      }

      currentStepId = "swap"
      updateFlowStep(setFlowSteps, currentStepId, { status: "active" })
      const swapHash = await writeContractAsync({
        address: deployment.router,
        abi: v2RouterAbi,
        functionName: "swapExactTokensForTokens",
        args: [
          parsedAmountIn,
          minimumReceived,
          bestQuote.path,
          address,
          getDeadline(deadlineMinutes),
        ],
      })

      updateFlowStep(setFlowSteps, currentStepId, {
        status: "confirming",
        hash: swapHash,
        description: t("swap.submitted"),
      })
      const swapReceipt = await publicClient.waitForTransactionReceipt({
        hash: swapHash,
      })
      if (swapReceipt.status !== "success") {
        throw new Error(t("swap.reverted"))
      }
      updateFlowStep(setFlowSteps, currentStepId, { status: "success" })
      saveTransactionHistoryEntry({
        kind: "swap",
        chainId,
        account: address,
        hash: swapHash,
        title: `${tokenIn.symbol} → ${tokenOut?.symbol ?? "Token"}`,
        summary: `${t("history.kind.swap")} ${formatUnits(parsedAmountIn, tokenIn.decimals)} ${tokenIn.symbol} -> ${formatUnits(amountOut, tokenOut?.decimals ?? 18)} ${tokenOut?.symbol ?? "Token"}.`,
        primaryAmount: `${formatUnits(parsedAmountIn, tokenIn.decimals)} ${tokenIn.symbol}`,
        secondaryAmount: `${formatUnits(amountOut, tokenOut?.decimals ?? 18)} ${tokenOut?.symbol ?? "Token"}`,
      })
      setTxSuccess(true)
      await Promise.all([allowanceQuery.refetch(), balanceInQuery.refetch()])
    } catch (err) {
      const message = getReadableError(err, t)
      setError(message)
      setFlowError(message)
      setFlowCanRetry(isUserRejectedError(err))
      updateFlowStep(setFlowSteps, currentStepId, {
        status: "error",
        description: message,
      })
    } finally {
      setFlowRunning(false)
    }
  }

  function switchTokens() {
    setTokenInAddress(tokenOutAddress)
    setTokenOutAddress(tokenInAddress)
    setAmountIn("")
  }

  function selectTokenIn(nextAddress: `0x${string}` | "") {
    const previousTokenInAddress = tokenInAddress

    setTokenInAddress(nextAddress)

    if (nextAddress && isSameAddress(nextAddress, tokenOutAddress)) {
      setTokenOutAddress(
        previousTokenInAddress || getFallbackTokenAddress(tokens, nextAddress),
      )
    }
  }

  function selectTokenOut(nextAddress: `0x${string}` | "") {
    const previousTokenOutAddress = tokenOutAddress

    setTokenOutAddress(nextAddress)

    if (nextAddress && isSameAddress(nextAddress, tokenInAddress)) {
      setTokenInAddress(
        previousTokenOutAddress || getFallbackTokenAddress(tokens, nextAddress),
      )
    }
  }

  return (
    <section className="swap-card">
      <SwapCardHeader
        kicker={t("swap.kicker")}
        title={t("swap.title")}
        settingsLabel={t("swap.settings")}
        onSettingsClick={() => setSettingsOpen(true)}
      />

      <div className="field">
        <div className="field-label">
          <span>{t("swap.from")}</span>
          <span className="field-balance">
            {t("common.balance")}{" "}
            {tokenIn
              ? formatTokenBalance(balanceIn, tokenIn.decimals, tokenIn.symbol)
              : "—"}
          </span>
        </div>
        <div className="field-row">
          <input
            className="amount-input"
            inputMode="decimal"
            placeholder="0.0"
            value={amountIn}
            onChange={(event) => setAmountIn(event.target.value)}
          />
          <TokenSelect
            tokens={tokens}
            value={tokenInAddress}
            onChange={selectTokenIn}
            owner={address}
          />
        </div>
      </div>

      <div className="switch-row">
        <button className="switch-button" type="button" onClick={switchTokens}>
          ↓
        </button>
      </div>

      <div className="field">
        <div className="field-label">
          <span>{t("swap.to")}</span>
          <span>{tokenOut ? tokenOut.name : t("common.selectToken")}</span>
        </div>
        <div className="field-row">
          <input
            className="amount-input"
            placeholder="0.0"
            readOnly
            value={
              tokenOut && amountOut > 0n
                ? formatUnits(amountOut, tokenOut.decimals)
                : ""
            }
          />
          <TokenSelect
            tokens={tokens}
            value={tokenOutAddress}
            onChange={selectTokenOut}
            owner={address}
          />
        </div>
      </div>

      <div className="quote-panel">
        <div className="quote-row">
          <span>{t("swap.bestPath")}</span>
          <strong>
            {bestQuote && tokenIn && tokenOut
              ? bestQuote.path
                  .map((addressInPath) =>
                    addressInPath === tokenIn.address
                      ? tokenIn.symbol
                      : addressInPath === tokenOut.address
                        ? tokenOut.symbol
                        : "BASE",
                  )
                  .join(" → ")
              : "-"}
          </strong>
        </div>
        <div className="quote-row">
          <span>{t("swap.minimumReceived")}</span>
          <strong>
            {tokenOut && minimumReceived > 0n
              ? `${formatUnits(minimumReceived, tokenOut.decimals)} ${tokenOut.symbol}`
              : "-"}
          </strong>
        </div>
      </div>

      <button
        className="primary-button"
        disabled={swapDisabled}
        type="button"
        onClick={executeSwapFlow}
      >
        {flowRunning || isPending
          ? t("common.processing")
          : needsApproval
            ? t("swap.approveAndSwap", { symbol: tokenIn?.symbol ?? "" })
            : t("swap.action")}
      </button>

      <Status
        deploymentReady={Boolean(deployment && deployment.router !== zeroAddress)}
        quoteLoading={quoteQuery.isFetching}
        quoteError={quoteQuery.isError}
        insufficientBalance={insufficientBalance}
        complianceLoading={false}
        complianceMessage=""
        txSuccess={txSuccess}
        error={error}
        t={t}
      />

      <TransactionSettingsModal
        open={settingsOpen}
        title={t("swap.settings")}
        description={t("common.adjustSettings")}
        slippage={slippage}
        deadline={deadline}
        onSlippageChange={setSlippage}
        onDeadlineChange={setDeadline}
        onClose={() => setSettingsOpen(false)}
      />

      <TransactionFlowModal
        open={flowOpen}
        title={t("swap.progressTitle")}
        description={t("swap.progressDescription")}
        steps={flowSteps}
        error={flowError}
        showRetry={flowCanRetry && !flowRunning}
        onRetry={executeSwapFlow}
        onClose={() => setFlowOpen(false)}
      />
    </section>
  )
}

function Status({
  deploymentReady,
  quoteLoading,
  quoteError,
  insufficientBalance,
  complianceLoading,
  complianceMessage,
  txSuccess,
  error,
  t,
}: {
  deploymentReady: boolean
  quoteLoading: boolean
  quoteError: boolean
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

  if (insufficientBalance) {
    return <p className="status error">{t("common.insufficientBalance")}</p>
  }

  if (complianceMessage) {
    return <p className="status error">{complianceMessage}</p>
  }

  if (complianceLoading) {
    return <p className="status">{t("common.checkingCompliance")}</p>
  }

  if (quoteLoading) {
    return <p className="status">{t("swap.statusRefreshing")}</p>
  }

  if (quoteError) {
    return <p className="status error">{t("swap.statusNoRoute")}</p>
  }

  if (txSuccess) {
    return (
      <p className="status success">
        <strong>{t("common.transactionConfirmed")}</strong>
        <span>{t("swap.statusSaved")}</span>
      </p>
    )
  }

  return <p className="status">{t("swap.statusActive")}</p>
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

function getPathPairs(path: `0x${string}`[]) {
  const pairs: [`0x${string}`, `0x${string}`][] = []

  for (let index = 0; index < path.length - 1; index += 1) {
    pairs.push([path[index], path[index + 1]])
  }

  return pairs
}

function createSwapFlowSteps(
  needsApproval: boolean,
  tokenSymbol: string,
  t: (key: MessageKey, params?: Record<string, string | number>) => string,
) {
  const steps: TransactionFlowStep[] = [
    {
      id: "check-apass",
      label: t("flow.checkAPass"),
      description: t("flow.checkAPassDescription"),
      status: "pending",
    },
  ]

  if (needsApproval) {
    steps.push({
      id: "approve",
      label: t("swap.approveLabel", { symbol: tokenSymbol }),
      description: t("swap.approveDescription"),
      status: "pending",
    })
  }

  steps.push({
    id: "swap",
    label: t("swap.stepLabel"),
    description: t("swap.stepDescription"),
    status: "pending",
  })

  return steps
}

function getTokenSymbol(tokens: TokenInfo[], tokenAddress: `0x${string}`) {
  return (
    tokens.find(
      (token) => token.address.toLowerCase() === tokenAddress.toLowerCase(),
    )?.symbol ?? "token"
  )
}

function getReadableError(
  error: unknown,
  t: (key: MessageKey, params?: Record<string, string | number>) => string,
) {
  if (error instanceof Error) {
    const message = error.message

    if (isUserRejectedError(error)) {
      return t("common.transactionRejected")
    }

    return (
      message.split(/\n| Request Arguments:| Contract Call:| Details:/)[0] ||
      t("common.transactionFailed")
    )
  }

  return t("common.transactionFailed")
}

function isUserRejectedError(error: unknown) {
  if (!(error instanceof Error)) {
    return false
  }

  const normalizedMessage = error.message.toLowerCase()
  return (
    normalizedMessage.includes("user rejected") ||
    normalizedMessage.includes("user denied")
  )
}
