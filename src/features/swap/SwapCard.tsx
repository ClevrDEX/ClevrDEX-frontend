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

export function SwapCard() {
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
    enabled:
      Boolean(address) &&
      Boolean(deployment) &&
      Boolean(tokenIn) &&
      Boolean(tokenOut) &&
      compliancePath.length >= 2,
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
  const complianceMessage =
    complianceQuery.data && !complianceQuery.data.allowed
      ? complianceQuery.data.message
      : ""
  const complianceAction =
    complianceQuery.data && "action" in complianceQuery.data
      ? complianceQuery.data.action
      : undefined
  const complianceInitialChecking =
    compliancePath.length >= 2 &&
    (complianceQuery.isLoading ||
      (complianceQuery.isFetching && !complianceQuery.data))
  const complianceBlocked = complianceInitialChecking || Boolean(complianceMessage)
  const swapDisabled =
    !address ||
    !deployment ||
    deployment.router === zeroAddress ||
    !tokenIn ||
    !tokenOut ||
    !bestQuote ||
    parsedAmountIn <= 0n ||
    insufficientBalance ||
    complianceBlocked ||
    isPending ||
    flowRunning

  async function executeSwapFlow() {
    setError("")
    setFlowError("")
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

    const nextSteps = createSwapFlowSteps(needsApproval, tokenIn.symbol)
    let currentStepId = nextSteps[0]?.id ?? ""

    setFlowSteps(nextSteps)
    setFlowOpen(true)
    setFlowRunning(true)

    try {
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
          description:
            "Approve submitted. Waiting for the approval to confirm on-chain.",
        })
        const approveReceipt = await publicClient.waitForTransactionReceipt({
          hash: approveHash,
        })
        if (approveReceipt.status !== "success") {
          throw new Error("Approval transaction reverted.")
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
        description:
          "Swap submitted. You can close this window while it confirms on-chain.",
      })
      const swapReceipt = await publicClient.waitForTransactionReceipt({
        hash: swapHash,
      })
      if (swapReceipt.status !== "success") {
        throw new Error("Swap transaction reverted.")
      }
      updateFlowStep(setFlowSteps, currentStepId, { status: "success" })
      saveTransactionHistoryEntry({
        kind: "swap",
        chainId,
        account: address,
        hash: swapHash,
        title: `${tokenIn.symbol} → ${tokenOut?.symbol ?? "Token"}`,
        summary: `Swapped ${formatUnits(parsedAmountIn, tokenIn.decimals)} ${tokenIn.symbol} for ${formatUnits(amountOut, tokenOut?.decimals ?? 18)} ${tokenOut?.symbol ?? "Token"}.`,
        primaryAmount: `${formatUnits(parsedAmountIn, tokenIn.decimals)} ${tokenIn.symbol}`,
        secondaryAmount: `${formatUnits(amountOut, tokenOut?.decimals ?? 18)} ${tokenOut?.symbol ?? "Token"}`,
      })
      setTxSuccess(true)
      await Promise.all([allowanceQuery.refetch(), balanceInQuery.refetch()])
    } catch (err) {
      const message = getReadableError(err)
      setError(message)
      setFlowError(message)
      updateFlowStep(setFlowSteps, currentStepId, { status: "error" })
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
        kicker="A-Pass router"
        title="Compliance Swap"
        settingsLabel="Swap settings"
        onSettingsClick={() => setSettingsOpen(true)}
      />

      <div className="field">
        <div className="field-label">
          <span>From</span>
          <span className="field-balance">
            Balance:{" "}
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
          <span>To</span>
          <span>{tokenOut ? tokenOut.name : "Select token"}</span>
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
          <span>Best path</span>
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
          <span>Minimum received</span>
          <strong>
            {tokenOut && minimumReceived > 0n
              ? `${formatUnits(minimumReceived, tokenOut.decimals)} ${tokenOut.symbol}`
              : "-"}
          </strong>
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
            {complianceMessage || "Checking A-Pass compliance..."}
          </button>
        )
      ) : (
        <button
          className="primary-button"
          disabled={swapDisabled}
          type="button"
          onClick={executeSwapFlow}
        >
          {flowRunning || isPending
            ? "Processing..."
            : needsApproval
              ? `Approve ${tokenIn?.symbol ?? ""} and Swap`
              : "Swap"}
        </button>
      )}

      <Status
        deploymentReady={Boolean(deployment && deployment.router !== zeroAddress)}
        quoteLoading={quoteQuery.isFetching}
        quoteError={quoteQuery.isError}
        insufficientBalance={insufficientBalance}
        complianceLoading={false}
        complianceMessage=""
        txSuccess={txSuccess}
        error={error}
      />

      <TransactionSettingsModal
        open={settingsOpen}
        title="Swap settings"
        description="Adjust slippage tolerance and transaction deadline."
        slippage={slippage}
        deadline={deadline}
        onSlippageChange={setSlippage}
        onDeadlineChange={setDeadline}
        onClose={() => setSettingsOpen(false)}
      />

      <TransactionFlowModal
        open={flowOpen}
        title="Swap progress"
        description="Approve first if needed, then execute the swap."
        steps={flowSteps}
        error={flowError}
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
}: {
  deploymentReady: boolean
  quoteLoading: boolean
  quoteError: boolean
  insufficientBalance: boolean
  complianceLoading: boolean
  complianceMessage: string
  txSuccess: boolean
  error: string
}) {
  if (error) {
    return <p className="status error">{error}</p>
  }

  if (!deploymentReady) {
    return (
      <p className="status">
        Configure the A-Pass router in <code>src/chains/deployments.ts</code>.
      </p>
    )
  }

  if (insufficientBalance) {
    return <p className="status error">Insufficient balance.</p>
  }

  if (complianceMessage) {
    return <p className="status error">{complianceMessage}</p>
  }

  if (complianceLoading) {
    return <p className="status">Checking A-Pass compliance...</p>
  }

  if (quoteLoading) {
    return <p className="status">Refreshing quote...</p>
  }

  if (quoteError) {
    return <p className="status error">No route found for this amount.</p>
  }

  if (txSuccess) {
    return (
      <p className="status success">
        <strong>Transaction confirmed.</strong>
        <span>Your swap was saved to local transaction history.</span>
      </p>
    )
  }

  return <p className="status">Compliance-ready ERC20 swap route is active.</p>
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

function createSwapFlowSteps(needsApproval: boolean, tokenSymbol: string) {
  const steps: TransactionFlowStep[] = []

  if (needsApproval) {
    steps.push({
      id: "approve",
      label: `Approve ${tokenSymbol}`,
      description: "Grant the router permission to spend the input token.",
      status: "pending",
    })
  }

  steps.push({
    id: "swap",
    label: "Swap",
    description: "Execute the swap after approval is ready.",
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

function getReadableError(error: unknown) {
  if (error instanceof Error) {
    const message = error.message
    const normalizedMessage = message.toLowerCase()

    if (
      normalizedMessage.includes("user rejected") ||
      normalizedMessage.includes("user denied")
    ) {
      return "Transaction rejected in wallet."
    }

    return (
      message.split(/\n| Request Arguments:| Contract Call:| Details:/)[0] ||
      "Transaction failed."
    )
  }

  return "Transaction failed."
}
