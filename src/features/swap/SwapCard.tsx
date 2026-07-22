"use client"

import { useQuery } from "@tanstack/react-query"
import { useEffect, useMemo, useState } from "react"
import { formatUnits, parseUnits, zeroAddress } from "viem"
import {
  useAccount,
  useChainId,
  usePublicClient,
  useReadContract,
  useWaitForTransactionReceipt,
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
import { TokenSelect } from "@/features/tokens/TokenSelect"
import {
  formatTokenBalance,
  useTokenBalance,
} from "@/features/tokens/useTokenBalance"
import { TransactionSettingsModal } from "@/features/forms/TransactionSettingsModal"

export function SwapCard() {
  const chainId = useChainId()
  const { address } = useAccount()
  const publicClient = usePublicClient()
  const { writeContractAsync, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const deployment = getDexDeployment(chainId)
  const listedTokens = deployment?.tokenList ?? []
  const [importedTokens, setImportedTokens] = useState<TokenInfo[]>([])
  const tokens = useMemo(() => {
    const importedForChain = importedTokens.filter(
      (token) =>
        token.chainId === chainId &&
        !listedTokens.some(
          (listedToken) =>
            listedToken.address.toLowerCase() === token.address.toLowerCase(),
        ),
    )

    return [...listedTokens, ...importedForChain]
  }, [chainId, importedTokens, listedTokens])

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
    isConfirming
  const approveDisabled =
    !address ||
    !deployment ||
    deployment.router === zeroAddress ||
    !tokenIn ||
    parsedAmountIn <= 0n ||
    insufficientBalance ||
    isPending ||
    isConfirming

  async function approve() {
    setError("")

    if (!deployment || !tokenIn || parsedAmountIn <= 0n) {
      return
    }

    try {
      await writeContractAsync({
        address: tokenIn.address,
        abi: erc20Abi,
        functionName: "approve",
        args: [deployment.router, parsedAmountIn],
      })

      await allowanceQuery.refetch()
    } catch (err) {
      setError(getReadableError(err))
    }
  }

  async function swap() {
    setError("")

    if (!address || !deployment || !bestQuote || parsedAmountIn <= 0n) {
      return
    }

    try {
      await writeContractAsync({
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
    } catch (err) {
      setError(getReadableError(err))
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

  function importToken(token: TokenInfo) {
    setImportedTokens((currentTokens) => {
      if (
        currentTokens.some(
          (currentToken) =>
            currentToken.chainId === token.chainId &&
            currentToken.address.toLowerCase() === token.address.toLowerCase(),
        )
      ) {
        return currentTokens
      }

      return [...currentTokens, token]
    })
  }

  return (
    <section className="swap-card">
      <div className="swap-card-header">
        <div>
          <span className="card-kicker">APass router</span>
          <h3>Compliance Swap</h3>
        </div>
        <div className="swap-card-header-actions">
          <button
            className="settings-button"
            type="button"
            aria-label="Swap settings"
            onClick={() => setSettingsOpen(true)}
          >
            <svg
              aria-hidden="true"
              fill="none"
              height="18"
              viewBox="0 0 24 24"
              width="18"
            >
              <path
                d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
                stroke="currentColor"
                strokeWidth="1.8"
              />
              <path
                d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9c.26.604.852.997 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"
                stroke="currentColor"
                strokeWidth="1.8"
              />
            </svg>
          </button>
          <span className="live-badge">Live</span>
        </div>
      </div>

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
            chainId={chainId}
            publicClient={publicClient}
            tokens={tokens}
            value={tokenInAddress}
            onChange={selectTokenIn}
            onImport={importToken}
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
            chainId={chainId}
            publicClient={publicClient}
            tokens={tokens}
            value={tokenOutAddress}
            onChange={selectTokenOut}
            onImport={importToken}
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

      {needsApproval ? (
        <button
          className="primary-button"
          disabled={approveDisabled}
          type="button"
          onClick={approve}
        >
          {isPending ? "Approving..." : `Approve ${tokenIn?.symbol ?? ""}`}
        </button>
      ) : (
        <button
          className="primary-button"
          disabled={swapDisabled}
          type="button"
          onClick={swap}
        >
          {isPending || isConfirming ? "Swapping..." : "Swap"}
        </button>
      )}

      <Status
        deploymentReady={Boolean(deployment && deployment.router !== zeroAddress)}
        quoteLoading={quoteQuery.isFetching}
        quoteError={quoteQuery.isError}
        insufficientBalance={insufficientBalance}
        txSuccess={isSuccess}
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
    </section>
  )
}

function Status({
  deploymentReady,
  quoteLoading,
  quoteError,
  insufficientBalance,
  txSuccess,
  error,
}: {
  deploymentReady: boolean
  quoteLoading: boolean
  quoteError: boolean
  insufficientBalance: boolean
  txSuccess: boolean
  error: string
}) {
  if (error) {
    return <p className="status error">{error}</p>
  }

  if (!deploymentReady) {
    return (
      <p className="status">
        Configure the APass router in <code>src/chains/deployments.ts</code>.
      </p>
    )
  }

  if (insufficientBalance) {
    return <p className="status error">Insufficient balance.</p>
  }

  if (quoteLoading) {
    return <p className="status">Refreshing quote...</p>
  }

  if (quoteError) {
    return <p className="status error">No route found for this amount.</p>
  }

  if (txSuccess) {
    return <p className="status">Transaction confirmed.</p>
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

function getReadableError(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return "Transaction failed."
}
