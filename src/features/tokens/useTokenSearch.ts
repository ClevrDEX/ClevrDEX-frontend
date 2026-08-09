"use client"

import { useMemo } from "react"
import { getAddress, isAddress, zeroAddress } from "viem"
import { useReadContracts } from "wagmi"

import type { TokenInfo } from "@/chains/deployments"
import { erc20Abi } from "@/dex/v2/abi/erc20"

export function parseTokenAddress(value: string) {
  const trimmed = value.trim()

  return isAddress(trimmed, { strict: false }) ? getAddress(trimmed) : undefined
}

/**
 * Resolves ERC-20 metadata for an address that is not part of the token list,
 * so any on-chain token can be found through the search field.
 */
export function useTokenSearch({
  chainId,
  address,
  enabled,
}: {
  chainId: number
  address?: `0x${string}`
  enabled: boolean
}) {
  const active = enabled && Boolean(address)
  const contracts = useMemo(
    () =>
      [
        { address: address ?? zeroAddress, abi: erc20Abi, functionName: "symbol" },
        { address: address ?? zeroAddress, abi: erc20Abi, functionName: "name" },
        {
          address: address ?? zeroAddress,
          abi: erc20Abi,
          functionName: "decimals",
        },
      ] as const,
    [address],
  )

  const query = useReadContracts({
    contracts,
    query: { enabled: active, retry: false },
  })

  const token = useMemo<TokenInfo | undefined>(() => {
    if (!address || !query.data) {
      return undefined
    }

    const [symbolResult, nameResult, decimalsResult] = query.data
    const symbol =
      symbolResult?.status === "success" ? String(symbolResult.result) : ""
    const decimals =
      decimalsResult?.status === "success" ? Number(decimalsResult.result) : NaN

    if (!symbol || !Number.isInteger(decimals) || decimals < 0 || decimals > 36) {
      return undefined
    }

    return {
      chainId,
      address,
      symbol,
      name: nameResult?.status === "success" ? String(nameResult.result) : symbol,
      decimals,
    }
  }, [address, chainId, query.data])

  return {
    token,
    isLoading: active && query.isPending,
    notFound: active && !query.isPending && !token,
  }
}
