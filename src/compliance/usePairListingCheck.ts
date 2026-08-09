"use client"

import { useMemo } from "react"
import { zeroAddress } from "viem"
import { useReadContract } from "wagmi"

import type { DexDeployment, TokenInfo } from "@/chains/deployments"
import { useTokenRegistry } from "@/compliance/useTokenRegistry"
import { v2FactoryAbi } from "@/dex/v2/abi/factory"
import { listingPolicyAbi } from "@/dex/v2/abi/listingPolicy"

export type PairListingCheck = {
  status: "idle" | "checking" | "allowed" | "blocked"
  /** True when the deployment requires both pair tokens to be CVAs. */
  requireBothCva: boolean
  /** True when the factory has no listing policy, which reverts createPair. */
  policyMissing: boolean
  /** Selected tokens that are not registered in the CVA token policy. */
  missingCva: TokenInfo[]
}

/**
 * Mirrors the on-chain listing gate that runs while a pair is created:
 * `UniswapV2Factory.createPair` asks the configured `IListingPolicy` whether
 * the token registrations are sufficient, so a pair without any CVA reverts.
 */
export function usePairListingCheck({
  deployment,
  tokenA,
  tokenB,
  enabled,
}: {
  deployment?: DexDeployment
  tokenA?: TokenInfo
  tokenB?: TokenInfo
  enabled: boolean
}): PairListingCheck {
  const active = enabled && Boolean(deployment) && Boolean(tokenA) && Boolean(tokenB)

  const listingPolicyQuery = useReadContract({
    address: deployment?.factory,
    abi: v2FactoryAbi,
    functionName: "listingPolicy",
    query: {
      enabled: active && deployment?.factory !== zeroAddress,
    },
  })
  const listingPolicy = listingPolicyQuery.data

  const requireBothQuery = useReadContract({
    address: listingPolicy,
    abi: listingPolicyAbi,
    functionName: "requireBothATokens",
    query: {
      enabled:
        active && Boolean(listingPolicy) && listingPolicy !== zeroAddress,
      retry: false,
    },
  })

  const registry = useTokenRegistry(
    active ? deployment : undefined,
    useMemo(() => [tokenA?.address, tokenB?.address], [tokenA, tokenB]),
  )
  const registryLoading = registry.isLoading
  const registeredA = registry.isRegistered(tokenA?.address)
  const registeredB = registry.isRegistered(tokenB?.address)

  return useMemo(() => {
    const idle: PairListingCheck = {
      status: "idle",
      requireBothCva: false,
      policyMissing: false,
      missingCva: [],
    }

    if (!active || !tokenA || !tokenB) {
      return idle
    }

    if (listingPolicyQuery.isLoading || registryLoading) {
      return { ...idle, status: "checking" }
    }

    if (listingPolicy === zeroAddress) {
      return { ...idle, status: "blocked", policyMissing: true }
    }

    if (registeredA === undefined || registeredB === undefined) {
      return idle
    }

    // A policy without `requireBothATokens` keeps the permissive default of
    // the reference implementation: at least one token must be registered.
    const requireBothCva = requireBothQuery.data === true
    const missingCva = [
      ...(registeredA ? [] : [tokenA]),
      ...(registeredB ? [] : [tokenB]),
    ]
    const blocked = requireBothCva
      ? missingCva.length > 0
      : missingCva.length === 2

    return {
      status: blocked ? "blocked" : "allowed",
      requireBothCva,
      policyMissing: false,
      missingCva,
    }
  }, [
    active,
    listingPolicy,
    listingPolicyQuery.isLoading,
    registeredA,
    registeredB,
    registryLoading,
    requireBothQuery.data,
    tokenA,
    tokenB,
  ])
}
