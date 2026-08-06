import { DEX_DEPLOYMENTS, type TokenInfo } from "@/chains/deployments"

export function GET() {
  return Response.json({
    name: "ClevrSwap Token List",
    timestamp: new Date().toISOString(),
    tokens: getConfiguredTokens(),
  })
}

function getConfiguredTokens() {
  const tokensByAddress = new Map<string, TokenInfo>()

  for (const deployment of Object.values(DEX_DEPLOYMENTS)) {
    for (const token of deployment.tokenList) {
      tokensByAddress.set(`${token.chainId}:${token.address.toLowerCase()}`, token)
    }
  }

  return Array.from(tokensByAddress.values())
}
