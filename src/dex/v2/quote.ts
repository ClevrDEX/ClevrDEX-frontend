import type { PublicClient } from "viem"

import { v2RouterAbi } from "@/dex/v2/abi/router"

export type BestQuote = {
  path: `0x${string}`[]
  amounts: bigint[]
  amountOut: bigint
}

type QuoteParams = {
  client: PublicClient
  router: `0x${string}`
  amountIn: bigint
  paths: `0x${string}`[][]
}

export async function getBestQuote({
  client,
  router,
  amountIn,
  paths,
}: QuoteParams): Promise<BestQuote | undefined> {
  const quotes = await Promise.allSettled(
    paths.map(async (path) => {
      const amounts = await client.readContract({
        address: router,
        abi: v2RouterAbi,
        functionName: "getAmountsOut",
        args: [amountIn, path],
      })

      return {
        path,
        amounts: [...amounts],
        amountOut: amounts[amounts.length - 1] ?? 0n,
      }
    }),
  )

  return quotes
    .filter((quote): quote is PromiseFulfilledResult<BestQuote> => {
      return quote.status === "fulfilled" && quote.value.amountOut > 0n
    })
    .map((quote) => quote.value)
    .sort((a, b) => (a.amountOut > b.amountOut ? -1 : 1))[0]
}

export function applySlippage(amount: bigint, slippageBps: number) {
  return (amount * BigInt(10_000 - slippageBps)) / 10_000n
}

// Uniswap V2 quote: given an amount of tokenA and the pool reserves,
// return the matching amount of tokenB that preserves the pool ratio.
export function quoteLiquidity(
  amountA: bigint,
  reserveA: bigint,
  reserveB: bigint,
) {
  if (amountA <= 0n || reserveA <= 0n || reserveB <= 0n) {
    return 0n
  }

  return (amountA * reserveB) / reserveA
}

export function getDeadline(minutes: number) {
  return BigInt(Math.floor(Date.now() / 1000) + minutes * 60)
}

// Uniswap V2: given LP tokens to burn, return the underlying token amounts.
export function quoteRemoveLiquidity(
  liquidity: bigint,
  reserveA: bigint,
  reserveB: bigint,
  totalSupply: bigint,
) {
  if (liquidity <= 0n || totalSupply <= 0n) {
    return { amountA: 0n, amountB: 0n }
  }

  const amountA = (liquidity * reserveA) / totalSupply
  const amountB = (liquidity * reserveB) / totalSupply
  return { amountA, amountB }
}

// Uniswap V2: given a desired underlying token amount, return LP to burn.
export function quoteLpFromTokenAmount(
  tokenAmount: bigint,
  reserve: bigint,
  totalSupply: bigint,
) {
  if (tokenAmount <= 0n || reserve <= 0n || totalSupply <= 0n) {
    return 0n
  }

  return (tokenAmount * totalSupply) / reserve
}
