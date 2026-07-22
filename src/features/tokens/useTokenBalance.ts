import { useMemo } from "react"
import { formatUnits } from "viem"
import { useReadContract, useReadContracts } from "wagmi"

import type { TokenInfo } from "@/chains/deployments"
import { erc20Abi } from "@/dex/v2/abi/erc20"

export function useTokenBalance(
  token: TokenInfo | undefined,
  owner: `0x${string}` | undefined,
) {
  return useReadContract({
    address: token?.address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: owner ? [owner] : undefined,
    query: {
      enabled: Boolean(token) && Boolean(owner),
    },
  })
}

export function useTokenBalances(
  tokens: TokenInfo[],
  owner: `0x${string}` | undefined,
) {
  const contracts = useMemo(
    () =>
      tokens.map((token) => ({
        address: token.address,
        abi: erc20Abi,
        functionName: "balanceOf" as const,
        args: owner ? [owner] : undefined,
      })),
    [owner, tokens],
  )

  const query = useReadContracts({
    contracts,
    query: {
      enabled: Boolean(owner) && tokens.length > 0,
    },
  })

  const balancesByAddress = useMemo(() => {
    const map = new Map<string, bigint>()

    tokens.forEach((token, index) => {
      const result = query.data?.[index]
      if (result?.status === "success") {
        map.set(token.address.toLowerCase(), result.result)
      }
    })

    return map
  }, [query.data, tokens])

  return { ...query, balancesByAddress }
}

export function formatTokenBalance(
  balance: bigint | undefined,
  decimals: number,
  symbol?: string,
) {
  if (balance === undefined) {
    return "—"
  }

  const formatted = trimTrailingZeros(formatUnits(balance, decimals))
  return symbol ? `${formatted} ${symbol}` : formatted
}

function trimTrailingZeros(value: string) {
  if (!value.includes(".")) {
    return value
  }

  return value.replace(/\.?0+$/, "") || "0"
}
