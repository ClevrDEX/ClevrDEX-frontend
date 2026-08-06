import type { Chain } from "viem"
import { baseSepolia } from "viem/chains"

export type TokenInfo = {
  chainId: number
  address: `0x${string}`
  name: string
  symbol: string
  decimals: number
  logoURI?: string
}

export type DexDeployment = {
  chain: Chain
  factory: `0x${string}`
  router: `0x${string}`
  wrappedNative: TokenInfo
  initCodePairHash: `0x${string}`
  apass: `0x${string}`
  tokenPolicy: `0x${string}`
  complianceValidator: `0x${string}`
  tokenListUrl: string
  baseTokens: TokenInfo[]
  tokenList: TokenInfo[]
}

const baseSepoliaWrappedNative = {
  chainId: baseSepolia.id,
  address: "0x4200000000000000000000000000000000000006",
  name: "Wrapped Ether",
  symbol: "WETH",
  decimals: 18,
} as const satisfies TokenInfo

const baseSepoliaUsdc = {
  chainId: baseSepolia.id,
  address: "0x543b96420d072BF587B63C41C0B0922762E986Ce",
  name: "USD Coin",
  symbol: "USDC",
  decimals: 6,
  logoURI: "/tokens/usdc.svg",
} as const satisfies TokenInfo

const baseSepoliaAUsdc = {
  chainId: baseSepolia.id,
  address: "0xaC0893567D43C3E7e6e35a72803df05416C1f20D",
  name: "Access USDC",
  symbol: "aUSDC",
  decimals: 6,
  logoURI: "/tokens/ausdc.svg",
} as const satisfies TokenInfo

export const DEX_DEPLOYMENTS: Record<number, DexDeployment> = {
  [baseSepolia.id]: {
    chain: baseSepolia,
    factory: "0x25BbF775E3e090102F71417e3d15DDB8a0C3819a",
    router: "0x3EA0541aB5cE4c6831CC496931D21F9F471f433b",
    wrappedNative: baseSepoliaWrappedNative,
    initCodePairHash:
      "0x899bfae07aebcbd41dd8c0277217ba2321dba16b706d48202bd5fe6c8fe27285",
    apass: "0xbA82D189540CaC9DC6FF46B6837CaC1BFdEC58B9",
    tokenPolicy: "0x36489bE45fa84f70a0c2BDB11D824Be608CB12Dd",
    complianceValidator: "0xaC7e5179C2C7f03f209136886c172eb34F161792",
    tokenListUrl: process.env.NEXT_PUBLIC_TOKEN_LIST_URL ?? "",
    baseTokens: [baseSepoliaUsdc],
    tokenList: [baseSepoliaUsdc, baseSepoliaAUsdc],
  },
}

export function getDexDeployment(chainId?: number) {
  if (!chainId) {
    return undefined
  }

  return DEX_DEPLOYMENTS[chainId]
}

export const supportedChains = Object.values(DEX_DEPLOYMENTS).map(
  (deployment) => deployment.chain,
)
