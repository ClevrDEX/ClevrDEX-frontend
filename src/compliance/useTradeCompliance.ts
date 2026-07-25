import { useQuery } from "@tanstack/react-query"
import type { PublicClient } from "viem"
import { zeroAddress } from "viem"

import type { DexDeployment } from "@/chains/deployments"
import {
  apassAbi,
  apassComplianceValidatorAbi,
  aTokenPolicyAbi,
} from "@/compliance/abi"
import { v2FactoryAbi } from "@/dex/v2/abi/factory"

type Address = `0x${string}`

type TokenCheck = {
  token: Address
  symbol: string
  amount: bigint
  direction: "in" | "out"
}

type UseTradeComplianceParams = {
  address?: Address
  deployment?: DexDeployment
  publicClient?: PublicClient
  enabled: boolean
  poolPairs: [Address, Address][]
  tokenChecks: TokenCheck[]
}

const TESTNET_APASS_URL = "https://test-magiclink.cleanverse.com/"
const MAINNET_APASS_URL = "https://magiclink.cleanverse.com/"

export function useTradeCompliance({
  address,
  deployment,
  publicClient,
  enabled,
  poolPairs,
  tokenChecks,
}: UseTradeComplianceParams) {
  return useQuery({
    queryKey: [
      "trade-compliance",
      address,
      deployment?.apass,
      deployment?.tokenPolicy,
      deployment?.complianceValidator,
      poolPairs.map(([tokenA, tokenB]) => `${tokenA}-${tokenB}`),
      tokenChecks.map(
        (check) =>
          `${check.token}-${check.symbol}-${check.amount}-${check.direction}`,
      ),
    ],
    enabled:
      enabled &&
      Boolean(address) &&
      Boolean(deployment) &&
      Boolean(publicClient) &&
      deployment?.apass !== zeroAddress &&
      deployment?.tokenPolicy !== zeroAddress &&
      deployment?.complianceValidator !== zeroAddress,
    queryFn: async () => {
      if (!address || !deployment || !publicClient) {
        return { allowed: false, message: "Connect your wallet." }
      }

      let hasAPass: boolean
      try {
        hasAPass = await publicClient.readContract({
          address: deployment.apass,
          abi: apassAbi,
          functionName: "hasAPass",
          args: [address],
        })
      } catch {
        return {
          allowed: false,
          message: "Unable to read APass contract. Check APass deployment.",
        }
      }

      if (!hasAPass) {
        return {
          allowed: false,
          message: "Trader must hold an APass.",
          action: {
            label: "Get APass",
            href: getAPassUrl(deployment),
          },
        }
      }

      let validAPass: boolean
      try {
        validAPass = await publicClient.readContract({
          address: deployment.apass,
          abi: apassAbi,
          functionName: "isValidAPass",
          args: [address],
        })
      } catch {
        return {
          allowed: false,
          message: "Unable to verify APass status. Check APass deployment.",
        }
      }

      if (!validAPass) {
        return {
          allowed: false,
          message: "Trader APass is not active or expired.",
        }
      }

      const uniqueTokenChecks = dedupeTokenChecks(tokenChecks)
      for (const check of uniqueTokenChecks) {
        let isTokenRegistered: boolean
        try {
          isTokenRegistered = await publicClient.readContract({
            address: deployment.tokenPolicy,
            abi: aTokenPolicyAbi,
            functionName: "isTokenRegistered",
            args: [check.token],
          })
        } catch {
          return {
            allowed: false,
            message: `Unable to read ${check.symbol} token policy. Check ATokenPolicy deployment.`,
          }
        }

        if (!isTokenRegistered) {
          continue
        }

        try {
          await publicClient.readContract({
            address: deployment.tokenPolicy,
            abi: aTokenPolicyAbi,
            functionName: "canTransfer",
            args:
              check.direction === "in"
                ? [check.token, address, zeroAddress, check.amount]
                : [check.token, zeroAddress, address, check.amount],
          })
        } catch (error) {
          return {
            allowed: false,
            message: getComplianceErrorMessage(
              error,
              `Trader APass does not meet ${check.symbol} policy requirements.`,
            ),
          }
        }
      }

      let pairAddresses: Address[]
      let missingPair: boolean
      try {
        ;({ pairAddresses, missingPair } = await getPairAddresses({
          client: publicClient,
          factory: deployment.factory,
          poolPairs,
        }))
      } catch {
        return {
          allowed: false,
          message: "Unable to resolve pool address. Check DEX factory deployment.",
        }
      }

      if (missingPair) {
        return {
          allowed: false,
          message: "This trading pair is not registered for compliance.",
        }
      }

      for (const pairAddress of pairAddresses) {
        let isRegistered: boolean
        try {
          isRegistered = await publicClient.readContract({
            address: deployment.complianceValidator,
            abi: apassComplianceValidatorAbi,
            functionName: "isRegistered",
            args: [pairAddress],
          })
        } catch {
          return {
            allowed: false,
            message:
              "Unable to read pair registration. Check compliance validator deployment.",
          }
        }

        if (!isRegistered) {
          return {
            allowed: false,
            message: "This trading pair is not registered for compliance.",
          }
        }

        try {
          const isCompliant = await publicClient.readContract({
            address: deployment.complianceValidator,
            abi: apassComplianceValidatorAbi,
            functionName: "complianceVerify",
            args: [pairAddress, address],
          })

          if (!isCompliant) {
            return {
              allowed: false,
              message: "Trader APass does not meet this pair's compliance rules.",
            }
          }
        } catch (error) {
          return {
            allowed: false,
            message: getComplianceErrorMessage(
              error,
              "Trader APass does not meet this pair's compliance rules.",
            ),
          }
        }
      }

      return { allowed: true, message: "" }
    },
    staleTime: 10_000,
    refetchInterval: 15_000,
  })
}

function getComplianceErrorMessage(error: unknown, fallback: string) {
  const message =
    typeof error === "object" && error && "shortMessage" in error
      ? String(error.shortMessage)
      : error instanceof Error
        ? error.message
        : ""

  if (message.includes("NoAPass")) {
    return "Trader must hold an APass."
  }
  if (message.includes("APassNotActive")) {
    return "Trader APass is not active."
  }
  if (message.includes("APassExpired")) {
    return "Trader APass is expired."
  }
  if (message.includes("TierTooLow")) {
    return "Trader APass tier is too low for this compliance rule."
  }
  if (message.includes("SubTierTooLow")) {
    return "Trader APass sub-tier is too low for this compliance rule."
  }
  if (message.includes("GroupMismatch")) {
    return "Trader APass group does not match this compliance rule."
  }
  if (message.includes("SubGroupMismatch")) {
    return "Trader APass sub-group does not match this compliance rule."
  }
  if (message.includes("PoolIsPaused")) {
    return "This trading pair is paused by compliance policy."
  }
  if (message.includes("TokenIsPaused")) {
    return "This token is paused by compliance policy."
  }
  if (message.includes("AccountFrozen")) {
    return "Trader address is frozen by compliance policy."
  }
  if (message.includes("PoolNotRegistered")) {
    return "This trading pair is not registered for compliance."
  }
  if (message.includes("TokenNotRegistered")) {
    return "This token is not registered in ATokenPolicy."
  }

  return fallback
}

function getAPassUrl(deployment: DexDeployment) {
  return deployment.chain.testnet ? TESTNET_APASS_URL : MAINNET_APASS_URL
}

function dedupeTokenChecks(tokenChecks: TokenCheck[]) {
  const seen = new Set<string>()

  return tokenChecks.filter((check) => {
    const key = `${check.token.toLowerCase()}-${check.direction}-${check.amount}`
    if (seen.has(key)) {
      return false
    }

    seen.add(key)
    return true
  })
}

async function getPairAddresses({
  client,
  factory,
  poolPairs,
}: {
  client: PublicClient
  factory: Address
  poolPairs: [Address, Address][]
}) {
  const seen = new Set<string>()
  const pairAddresses: Address[] = []
  let missingPair = false

  for (const [tokenA, tokenB] of poolPairs) {
    const pairAddress = await client.readContract({
      address: factory,
      abi: v2FactoryAbi,
      functionName: "getPair",
      args: [tokenA, tokenB],
    })
    const key = pairAddress.toLowerCase()

    if (pairAddress === zeroAddress) {
      missingPair = true
      continue
    }

    if (pairAddress !== zeroAddress && !seen.has(key)) {
      seen.add(key)
      pairAddresses.push(pairAddress)
    }
  }

  return { pairAddresses, missingPair }
}
