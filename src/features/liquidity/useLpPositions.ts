import { useQuery } from "@tanstack/react-query"
import { zeroAddress } from "viem"
import { usePublicClient } from "wagmi"

import { getDexDeployment, type TokenInfo } from "@/chains/deployments"
import { erc20Abi } from "@/dex/v2/abi/erc20"
import { v2FactoryAbi } from "@/dex/v2/abi/factory"
import { v2PairAbi } from "@/dex/v2/abi/pair"
import { quoteRemoveLiquidity } from "@/dex/v2/quote"

export type LpPosition = {
  tokenA: TokenInfo
  tokenB: TokenInfo
  pairAddress: `0x${string}`
  lpBalance: bigint
  totalSupply: bigint
  poolShare: number
  amountA: bigint
  amountB: bigint
}

function getTokenPairs(tokens: TokenInfo[]) {
  const pairs: [TokenInfo, TokenInfo][] = []

  for (let index = 0; index < tokens.length; index += 1) {
    for (let nextIndex = index + 1; nextIndex < tokens.length; nextIndex += 1) {
      pairs.push([tokens[index], tokens[nextIndex]])
    }
  }

  return pairs
}

export function useLpPositions(
  chainId: number,
  tokens: TokenInfo[],
  owner?: `0x${string}`,
) {
  const publicClient = usePublicClient()
  const deployment = getDexDeployment(chainId)

  return useQuery({
    queryKey: [
      "lp-positions",
      chainId,
      owner,
      tokens.map((token) => token.address),
    ],
    enabled:
      Boolean(publicClient) &&
      Boolean(deployment) &&
      Boolean(owner) &&
      tokens.length >= 2 &&
      deployment?.factory !== zeroAddress,
    queryFn: async (): Promise<LpPosition[]> => {
      if (!publicClient || !deployment || !owner) {
        return []
      }

      const positions = await Promise.all(
        getTokenPairs(tokens).map(async ([tokenA, tokenB]) => {
          const pairAddress = await publicClient.readContract({
            address: deployment.factory,
            abi: v2FactoryAbi,
            functionName: "getPair",
            args: [tokenA.address, tokenB.address],
          })

          if (!pairAddress || pairAddress === zeroAddress) {
            return undefined
          }

          const [lpBalance, totalSupply, reserves, token0] = await Promise.all([
            publicClient.readContract({
              address: pairAddress,
              abi: erc20Abi,
              functionName: "balanceOf",
              args: [owner],
            }),
            publicClient.readContract({
              address: pairAddress,
              abi: erc20Abi,
              functionName: "totalSupply",
            }),
            publicClient.readContract({
              address: pairAddress,
              abi: v2PairAbi,
              functionName: "getReserves",
            }),
            publicClient.readContract({
              address: pairAddress,
              abi: v2PairAbi,
              functionName: "token0",
            }),
          ])

          if (lpBalance <= 0n) {
            return undefined
          }

          const [reserve0, reserve1] = reserves
          const reserveA =
            token0.toLowerCase() === tokenA.address.toLowerCase()
              ? reserve0
              : reserve1
          const reserveB =
            token0.toLowerCase() === tokenA.address.toLowerCase()
              ? reserve1
              : reserve0
          const { amountA, amountB } = quoteRemoveLiquidity(
            lpBalance,
            reserveA,
            reserveB,
            totalSupply,
          )
          const poolShare =
            totalSupply > 0n
              ? Number((lpBalance * 10_000n) / totalSupply) / 100
              : 0

          return {
            tokenA,
            tokenB,
            pairAddress,
            lpBalance,
            totalSupply,
            poolShare,
            amountA,
            amountB,
          }
        }),
      )

      return positions.filter(
        (position): position is LpPosition => position !== undefined,
      )
    },
  })
}
