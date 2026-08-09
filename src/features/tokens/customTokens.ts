"use client"

import { useCallback, useSyncExternalStore } from "react"
import { getAddress, isAddress } from "viem"

import type { TokenInfo } from "@/chains/deployments"

const STORAGE_KEY = "clevrswap.customTokens"
const EMPTY_TOKENS: TokenInfo[] = []

type CustomTokenStore = Record<string, TokenInfo[]>

let cachedStore: CustomTokenStore | undefined
const listeners = new Set<() => void>()

export function useCustomTokens(chainId: number) {
  const getSnapshot = useCallback(
    () => readStore()[String(chainId)] ?? EMPTY_TOKENS,
    [chainId],
  )

  return useSyncExternalStore(subscribe, getSnapshot, () => EMPTY_TOKENS)
}

export function addCustomToken(token: TokenInfo) {
  const key = String(token.chainId)
  const store = readStore()
  const existing = store[key] ?? EMPTY_TOKENS

  if (findToken(existing, token.address)) {
    return
  }

  writeStore({ ...store, [key]: [...existing, token] })
}

export function removeCustomToken(chainId: number, address: `0x${string}`) {
  const key = String(chainId)
  const store = readStore()
  const existing = store[key]

  if (!existing) {
    return
  }

  writeStore({
    ...store,
    [key]: existing.filter(
      (token) => token.address.toLowerCase() !== address.toLowerCase(),
    ),
  })
}

function findToken(tokens: TokenInfo[], address: `0x${string}`) {
  return tokens.find(
    (token) => token.address.toLowerCase() === address.toLowerCase(),
  )
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange)
  window.addEventListener("storage", handleStorageEvent)

  return () => {
    listeners.delete(onStoreChange)

    if (listeners.size === 0) {
      window.removeEventListener("storage", handleStorageEvent)
    }
  }
}

function handleStorageEvent(event: StorageEvent) {
  if (event.key !== null && event.key !== STORAGE_KEY) {
    return
  }

  cachedStore = undefined
  listeners.forEach((listener) => listener())
}

function readStore(): CustomTokenStore {
  if (cachedStore) {
    return cachedStore
  }

  if (typeof window === "undefined") {
    return {}
  }

  cachedStore = parseStore(window.localStorage.getItem(STORAGE_KEY))
  return cachedStore
}

function writeStore(store: CustomTokenStore) {
  cachedStore = store
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  listeners.forEach((listener) => listener())
}

function parseStore(raw: string | null): CustomTokenStore {
  if (!raw) {
    return {}
  }

  let parsed: unknown
  try {
    parsed = JSON.parse(raw)
  } catch {
    return {}
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return {}
  }

  const store: CustomTokenStore = {}

  for (const [chainKey, value] of Object.entries(
    parsed as Record<string, unknown>,
  )) {
    const chainId = Number(chainKey)

    if (!Array.isArray(value) || !Number.isFinite(chainId)) {
      continue
    }

    const tokens = value.flatMap((token) => normalizeToken(token, chainId))

    if (tokens.length > 0) {
      store[chainKey] = tokens
    }
  }

  return store
}

function normalizeToken(token: unknown, chainId: number): TokenInfo[] {
  if (!token || typeof token !== "object") {
    return []
  }

  const candidate = token as Partial<TokenInfo>

  if (
    typeof candidate.address !== "string" ||
    !isAddress(candidate.address, { strict: false }) ||
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
    },
  ]
}
