import { useQuery } from "@tanstack/react-query"
import { getAddress, isAddress } from "viem"

import type { DexDeployment, TokenInfo } from "@/chains/deployments"

type TokenListResponse =
  | TokenInfo[]
  | {
      tokens?: unknown
    }

export function useTokenList(
  chainId: number,
  deployment?: DexDeployment,
) {
  const configuredTokens = deployment?.tokenList ?? []
  const tokenListUrl = deployment?.tokenListUrl.trim() ?? ""

  return useQuery({
    queryKey: ["token-list", chainId, tokenListUrl, configuredTokens],
    enabled: Boolean(deployment),
    initialData: configuredTokens,
    queryFn: async () => {
      if (!deployment || !tokenListUrl) {
        return configuredTokens
      }

      const remoteTokens = await fetchTokenList(
        tokenListUrl,
        chainId,
      ).catch(() => [])

      return mergeTokenLists(configuredTokens, remoteTokens)
    },
  })
}

async function fetchTokenList(url: string, chainId: number) {
  const response = await fetch(url)

  if (!response.ok) {
    return []
  }

  const data = (await response.json()) as TokenListResponse
  const rawTokens = Array.isArray(data)
    ? data
    : Array.isArray(data.tokens)
      ? data.tokens
      : []

  return rawTokens.flatMap((token) => normalizeToken(token, chainId))
}

function normalizeToken(token: unknown, chainId: number): TokenInfo[] {
  if (!token || typeof token !== "object") {
    return []
  }

  const candidate = token as Partial<TokenInfo>

  if (
    candidate.chainId !== chainId ||
    typeof candidate.address !== "string" ||
    !isAddress(candidate.address) ||
    typeof candidate.name !== "string" ||
    typeof candidate.symbol !== "string" ||
    typeof candidate.decimals !== "number"
  ) {
    return []
  }

  return [
    {
      chainId,
      address: getAddress(candidate.address),
      name: candidate.name,
      symbol: candidate.symbol,
      decimals: candidate.decimals,
      logoURI:
        typeof candidate.logoURI === "string" ? candidate.logoURI : undefined,
    },
  ]
}

function mergeTokenLists(
  configuredTokens: TokenInfo[],
  remoteTokens: TokenInfo[],
) {
  const mergedTokens = new Map<string, TokenInfo>()

  for (const token of [...configuredTokens, ...remoteTokens]) {
    const key = `${token.chainId}:${token.address.toLowerCase()}`

    if (!mergedTokens.has(key)) {
      mergedTokens.set(key, token)
    }
  }

  return Array.from(mergedTokens.values())
}
