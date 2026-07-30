"use client"

export type TransactionHistoryKind =
  | "swap"
  | "add-liquidity"
  | "remove-liquidity"

export type TransactionHistoryEntry = {
  id: string
  source: "local"
  kind: TransactionHistoryKind
  status: "success"
  chainId: number
  account: `0x${string}`
  hash: `0x${string}`
  title: string
  summary: string
  primaryAmount: string
  secondaryAmount?: string
  timestamp: number
}

const STORAGE_KEY = "clean-dex:transaction-history:v1"
const HISTORY_EVENT = "clean-dex:transaction-history-updated"
const MAX_HISTORY_ITEMS = 30

export function getTransactionHistory() {
  if (typeof window === "undefined") {
    return []
  }

  try {
    const rawHistory = window.localStorage.getItem(STORAGE_KEY)
    if (!rawHistory) {
      return []
    }

    const parsedHistory = JSON.parse(rawHistory)
    if (!Array.isArray(parsedHistory)) {
      return []
    }

    return parsedHistory.filter(isTransactionHistoryEntry)
  } catch {
    return []
  }
}

export function saveTransactionHistoryEntry(
  entry: Omit<TransactionHistoryEntry, "id" | "source" | "status" | "timestamp">,
) {
  if (typeof window === "undefined") {
    return
  }

  const nextEntry: TransactionHistoryEntry = {
    ...entry,
    id: `${entry.chainId}:${entry.hash.toLowerCase()}`,
    source: "local",
    status: "success",
    timestamp: Date.now(),
  }
  const nextHistory = [
    nextEntry,
    ...getTransactionHistory().filter((item) => item.id !== nextEntry.id),
  ].slice(0, MAX_HISTORY_ITEMS)

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextHistory))
  window.dispatchEvent(new CustomEvent(HISTORY_EVENT))
}

export function subscribeTransactionHistory(listener: () => void) {
  if (typeof window === "undefined") {
    return () => undefined
  }

  window.addEventListener(HISTORY_EVENT, listener)
  window.addEventListener("storage", listener)

  return () => {
    window.removeEventListener(HISTORY_EVENT, listener)
    window.removeEventListener("storage", listener)
  }
}

function isTransactionHistoryEntry(value: unknown): value is TransactionHistoryEntry {
  if (!value || typeof value !== "object") {
    return false
  }

  const entry = value as TransactionHistoryEntry
  return (
    typeof entry.id === "string" &&
    entry.source === "local" &&
    typeof entry.kind === "string" &&
    entry.status === "success" &&
    typeof entry.chainId === "number" &&
    typeof entry.account === "string" &&
    entry.account.startsWith("0x") &&
    typeof entry.hash === "string" &&
    entry.hash.startsWith("0x") &&
    typeof entry.title === "string" &&
    typeof entry.summary === "string" &&
    typeof entry.primaryAmount === "string" &&
    typeof entry.timestamp === "number"
  )
}
