"use client"

import { useMemo } from "react"
import { zeroAddress } from "viem"
import { useReadContracts } from "wagmi"

import type { DexDeployment } from "@/chains/deployments"
import { aTokenPolicyAbi } from "@/compliance/abi"

type Address = `0x${string}`

/**
 * Reads `ATokenPolicy.isTokenRegistered` for a set of tokens. A registered
 * token is what the product calls a CVA, and the factory listing gate only
 * lets a new pair through when enough of its tokens are registered.
 */
export function useTokenRegistry(
  deployment: DexDeployment | undefined,
  addresses: (Address | undefined)[],
) {
  const targetKey = addresses
    .filter((address): address is Address => Boolean(address))
    .map((address) => address.toLowerCase())
    .sort()
    .join(",")

  const targets = useMemo(
    () => (targetKey ? (targetKey.split(",") as Address[]) : []),
    [targetKey],
  )

  const enabled =
    Boolean(deployment) &&
    deployment?.tokenPolicy !== zeroAddress &&
    targets.length > 0

  const query = useReadContracts({
    contracts: targets.map((address) => ({
      address: deployment?.tokenPolicy,
      abi: aTokenPolicyAbi,
      functionName: "isTokenRegistered" as const,
      args: [address] as const,
    })),
    query: { enabled },
  })

  const registrationByAddress = useMemo(() => {
    const map = new Map<string, boolean>()

    targets.forEach((address, index) => {
      const result = query.data?.[index]

      if (result?.status === "success") {
        map.set(address, Boolean(result.result))
      }
    })

    return map
  }, [query.data, targets])

  return {
    isLoading: enabled && query.isLoading,
    isRegistered(address: Address | undefined) {
      return address
        ? registrationByAddress.get(address.toLowerCase())
        : undefined
    },
  }
}
