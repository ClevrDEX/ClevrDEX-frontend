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
  useWaitForTransactionReceipt,
  useWriteContract,
} from "wagmi"

import { getDexDeployment, type TokenInfo } from "@/chains/deployments"
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
import { TokenSelect } from "@/features/tokens/TokenSelect"
import {
  formatTokenBalance,
  useTokenBalance,
} from "@/features/tokens/useTokenBalance"

export function LiquidityCard() {
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
  const insufficientBalanceA =
    parsedAmountA > 0n && Boolean(address) && parsedAmountA > balanceA
  const insufficientBalanceB =
    parsedAmountB > 0n && Boolean(address) && parsedAmountB > balanceB
  const insufficientBalance = insufficientBalanceA || insufficientBalanceB
  const needsApprovalA = parsedAmountA > 0n && allowanceA < parsedAmountA
  const needsApprovalB = parsedAmountB > 0n && allowanceB < parsedAmountB
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
    isPending ||
    isConfirming

  async function approveToken(token: TokenInfo, amount: bigint) {
    setError("")

    if (!deployment || amount <= 0n) {
      return
    }

    try {
      await writeContractAsync({
        address: token.address,
        abi: erc20Abi,
        functionName: "approve",
        args: [deployment.router, amount],
      })

      await Promise.all([allowanceAQuery.refetch(), allowanceBQuery.refetch()])
    } catch (err) {
      setError(getReadableError(err))
    }
  }

  async function addLiquidity() {
    setError("")

    if (
      !address ||
      !deployment ||
      !tokenA ||
      !tokenB ||
      sameToken ||
      parsedAmountA <= 0n ||
      parsedAmountB <= 0n
    ) {
      return
    }

    try {
      await writeContractAsync({
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
    } catch (err) {
      setError(getReadableError(err))
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
        kicker="Pool operations"
        title="Add Liquidity"
        actions={
          <nav className="liquidity-tabs" aria-label="Liquidity actions">
            <Link className="active" href="/liquidity/add">
              Add
            </Link>
            <Link href="/liquidity/remove">Remove</Link>
          </nav>
        }
        settingsLabel="Liquidity settings"
        onSettingsClick={() => setSettingsOpen(true)}
      />

      <LiquidityField
        label="Token A"
        token={tokenA}
        amount={amountA}
        balance={balanceA}
        onAmountChange={handleAmountAChange}
        tokenSelect={
          <TokenSelect
            chainId={chainId}
            publicClient={publicClient}
            tokens={tokens}
            value={tokenAAddress}
            onChange={selectTokenA}
            onImport={importToken}
            owner={address}
          />
        }
      />

      <div className="liquidity-pair-divider">+</div>

      <LiquidityField
        label="Token B"
        token={tokenB}
        amount={amountB}
        balance={balanceB}
        onAmountChange={handleAmountBChange}
        tokenSelect={
          <TokenSelect
            chainId={chainId}
            publicClient={publicClient}
            tokens={tokens}
            value={tokenBAddress}
            onChange={selectTokenB}
            onImport={importToken}
            owner={address}
          />
        }
      />

      {isFirstProvision && tokenA && tokenB ? (
        <p className="status">
          This is the first liquidity for the {tokenA.symbol}/{tokenB.symbol}{" "}
          pair. You set the initial price — enter any ratio of the two amounts.
        </p>
      ) : null}

      <div className="quote-panel">
        {ratioLocked && tokenA && tokenB ? (
          <div className="quote-row">
            <span>Pool ratio</span>
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
          <span>Minimum {tokenA?.symbol ?? "Token A"}</span>
          <strong>{formatMinimum(amountAMin, tokenA)}</strong>
        </div>
        <div className="quote-row">
          <span>Minimum {tokenB?.symbol ?? "Token B"}</span>
          <strong>{formatMinimum(amountBMin, tokenB)}</strong>
        </div>
      </div>

      {needsApprovalA && tokenA ? (
        <button
          className="primary-button"
          disabled={actionDisabled}
          type="button"
          onClick={() => approveToken(tokenA, parsedAmountA)}
        >
          {isPending ? "Approving..." : `Approve ${tokenA.symbol}`}
        </button>
      ) : needsApprovalB && tokenB ? (
        <button
          className="primary-button"
          disabled={actionDisabled}
          type="button"
          onClick={() => approveToken(tokenB, parsedAmountB)}
        >
          {isPending ? "Approving..." : `Approve ${tokenB.symbol}`}
        </button>
      ) : (
        <button
          className="primary-button"
          disabled={actionDisabled}
          type="button"
          onClick={addLiquidity}
        >
          {isPending || isConfirming ? "Adding..." : "Add Liquidity"}
        </button>
      )}

      <LiquidityStatus
        deploymentReady={Boolean(deployment && deployment.router !== zeroAddress)}
        sameToken={sameToken}
        insufficientBalance={insufficientBalance}
        txSuccess={isSuccess}
        error={error}
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
  return (
    <div className="field">
      <div className="field-label">
        <span>{label}</span>
        <span className="field-balance">
          Balance:{" "}
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
  txSuccess,
  error,
}: {
  deploymentReady: boolean
  sameToken: boolean
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

  if (sameToken) {
    return <p className="status error">Choose two different tokens.</p>
  }

  if (insufficientBalance) {
    return <p className="status error">Insufficient balance.</p>
  }

  if (txSuccess) {
    return <p className="status">Liquidity transaction confirmed.</p>
  }

  return <p className="status">Add ERC20 liquidity with slippage protection.</p>
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
