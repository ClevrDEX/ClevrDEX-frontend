"use client"

import Link from "next/link"
import { useEffect, useMemo, useState } from "react"
import { formatUnits, parseUnits, zeroAddress } from "viem"
import {
  useAccount,
  useChainId,
  useReadContract,
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi"

import { getDexDeployment, type TokenInfo } from "@/chains/deployments"
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
import { TransactionSettingsModal } from "@/features/forms/TransactionSettingsModal"
import { formatTokenBalance } from "@/features/tokens/useTokenBalance"
import { TokenAvatar } from "@/features/tokens/TokenAvatar"
import {
  useLpPositions,
  type LpPosition,
} from "@/features/liquidity/useLpPositions"

const LP_DECIMALS = 18
const PERCENTAGE_PRESETS = [25, 50, 75, 100] as const

export function RemoveLiquidityCard() {
  const chainId = useChainId()
  const { address } = useAccount()
  const deployment = getDexDeployment(chainId)
  const listedTokens = deployment?.tokenList ?? []
  const tokens = listedTokens

  const [selectedPosition, setSelectedPosition] = useState<LpPosition | null>(
    null,
  )
  const positionsQuery = useLpPositions(chainId, tokens, address)

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
      />

      {selectedPosition ? (
        <RemovePositionForm
          position={selectedPosition}
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
    </section>
  )
}

function RemoveLiquidityHeader({
  selectedPosition,
  onBack,
}: {
  selectedPosition: LpPosition | null
  onBack: () => void
}) {
  return (
    <div className="remove-card-header">
      <div className="remove-card-header-top">
        {selectedPosition ? (
          <button
            className="back-button"
            type="button"
            aria-label="Back to positions"
            onClick={onBack}
          >
            ←
          </button>
        ) : (
          <span aria-hidden="true" className="back-button-spacer" />
        )}
        <div className="swap-card-header-actions">
          <nav className="liquidity-tabs" aria-label="Liquidity actions">
            <Link href="/liquidity/add">Add</Link>
            <Link className="active" href="/liquidity/remove">
              Remove
            </Link>
          </nav>
          <span className="live-badge">ERC20</span>
        </div>
      </div>
      <h3 className="remove-card-title">Remove Liquidity</h3>
    </div>
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
  if (!deploymentReady) {
    return (
      <p className="status">
        Configure the APass router in <code>src/chains/deployments.ts</code>.
      </p>
    )
  }

  if (!address) {
    return (
      <p className="status">Connect your wallet to view liquidity positions.</p>
    )
  }

  if (isLoading) {
    return <p className="status">Loading your positions...</p>
  }

  if (positions.length === 0) {
    return (
      <div className="lp-empty-state">
        <p className="status">You don&apos;t have any open liquidity positions.</p>
        <Link className="primary-button" href="/liquidity/add">
          Add liquidity
        </Link>
      </div>
    )
  }

  return (
    <div className="lp-positions lp-positions-main">
      <span className="lp-positions-label">Your positions</span>
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
              {position.poolShare.toFixed(4)}% pool share
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
  onComplete,
}: {
  position: LpPosition
  onComplete: () => void
}) {
  const { address } = useAccount()
  const deployment = getDexDeployment(useChainId())
  const { writeContractAsync, data: hash, isPending } = useWriteContract()
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({
    hash,
  })

  const [amount0, setAmount0] = useState("")
  const [amount1, setAmount1] = useState("")
  const [slippage, setSlippage] = useState("0.5")
  const [deadline, setDeadline] = useState("20")
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [error, setError] = useState("")

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
  const actionDisabled =
    !address ||
    !deployment ||
    deployment.router === zeroAddress ||
    parsedLpAmount <= 0n ||
    insufficientBalance ||
    isPending ||
    isConfirming

  useEffect(() => {
    if (isSuccess) {
      onComplete()
    }
  }, [isSuccess, onComplete])

  async function approveLpToken() {
    setError("")

    if (!deployment || parsedLpAmount <= 0n) {
      return
    }

    try {
      await writeContractAsync({
        address: pairAddress,
        abi: erc20Abi,
        functionName: "approve",
        args: [deployment.router, parsedLpAmount],
      })

      await lpAllowanceQuery.refetch()
    } catch (err) {
      setError(getReadableError(err))
    }
  }

  async function removeLiquidity() {
    setError("")

    if (!address || !deployment || parsedLpAmount <= 0n) {
      return
    }

    try {
      await writeContractAsync({
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
    } catch (err) {
      setError(getReadableError(err))
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
            <span>LP tokens</span>
            <strong>
              {parsedLpAmount > 0n
                ? formatTokenBalance(parsedLpAmount, LP_DECIMALS, "LP")
                : formatTokenBalance(0n, LP_DECIMALS, "LP")}
            </strong>
          </div>
          {parsedLpAmount > 0n ? (
            <div className="remove-lp-meta-minimums">
              <span>Min {token0.symbol}: {formatOutput(amount0Min, token0)}</span>
              <span>Min {token1.symbol}: {formatOutput(amount1Min, token1)}</span>
            </div>
          ) : null}
        </div>
      </div>

      <div className="remove-form-actions">
        <button
          className="settings-button"
          type="button"
          aria-label="Liquidity settings"
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

        {needsApproval ? (
          <button
            className="primary-button remove-action-button"
            disabled={actionDisabled}
            type="button"
            onClick={approveLpToken}
          >
            {isPending ? "Approving..." : "Approve LP token"}
          </button>
        ) : (
          <button
            className="primary-button remove-action-button"
            disabled={actionDisabled}
            type="button"
            onClick={removeLiquidity}
          >
            {isPending || isConfirming ? "Removing..." : "Remove Liquidity"}
          </button>
        )}
      </div>

      <RemoveFormStatus
        error={error}
        insufficientBalance={insufficientBalance}
        txSuccess={isSuccess}
      />

      <TransactionSettingsModal
        open={settingsOpen}
        title="Liquidity settings"
        description="Adjust slippage tolerance and transaction deadline."
        slippage={slippage}
        deadline={deadline}
        onSlippageChange={setSlippage}
        onDeadlineChange={setDeadline}
        onClose={() => setSettingsOpen(false)}
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
  return (
    <div className="field">
      <div className="field-label">
        <span>{label}</span>
        <span className="field-balance">
          Pooled:{" "}
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
  txSuccess,
}: {
  error: string
  insufficientBalance: boolean
  txSuccess: boolean
}) {
  if (error) {
    return <p className="status error">{error}</p>
  }

  if (insufficientBalance) {
    return <p className="status error">Exceeds pooled balance.</p>
  }

  if (txSuccess) {
    return <p className="status">Liquidity removal confirmed.</p>
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

function getReadableError(error: unknown) {
  if (error instanceof Error) {
    return error.message
  }

  return "Transaction failed."
}
