"use client"

import { useEffect, useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { useAccount, useChainId } from "wagmi"

import { CloseIcon } from "@/components/CloseIcon"
import { getTransactionExplorerUrl } from "@/chains/explorer"
import {
  getTransactionHistory,
  subscribeTransactionHistory,
  type TransactionHistoryEntry,
} from "@/features/transactions/transactionHistory"
import { useI18n } from "@/i18n"

export function TransactionHistoryPanel() {
  const { t } = useI18n()
  const chainId = useChainId()
  const { address } = useAccount()
  const [history, setHistory] = useState<TransactionHistoryEntry[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    setHistory(getTransactionHistory())
    return subscribeTransactionHistory(() => setHistory(getTransactionHistory()))
  }, [])

  useEffect(() => {
    if (!open) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [open])

  const visibleHistory = useMemo(() => {
    if (!address) {
      return []
    }

    return history.filter(
      (entry) =>
        entry.chainId === chainId &&
        entry.account.toLowerCase() === address.toLowerCase(),
    )
  }, [address, chainId, history])

  return (
    <>
      <button
        className="transaction-history-trigger"
        type="button"
        onClick={() => setOpen(true)}
      >
        <span>{t("history.title")}</span>
        <strong>{visibleHistory.length}</strong>
      </button>

      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              className="token-modal-backdrop"
              role="presentation"
              onClick={() => setOpen(false)}
            >
              <div
                className="token-modal transaction-history-modal"
                role="dialog"
                aria-labelledby="transaction-history-title"
                aria-modal="true"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="token-menu-header">
                  <div>
                    <strong id="transaction-history-title">
                      {t("history.title")}
                    </strong>
                    <span>{t("history.subtitle")}</span>
                  </div>
                  <button
                    className="token-modal-close"
                    type="button"
                    aria-label={t("history.close")}
                    onClick={() => setOpen(false)}
                  >
                    <CloseIcon />
                  </button>
                </div>

                {!address ? (
                  <p className="transaction-history-empty">
                    {t("history.connect")}
                  </p>
                ) : visibleHistory.length === 0 ? (
                  <p className="transaction-history-empty">{t("history.empty")}</p>
                ) : (
                  <ol className="transaction-history-list">
                    {visibleHistory.map((entry) => (
                      <li className="transaction-history-item" key={entry.id}>
                        <div className="transaction-history-item-main">
                          <span className={`transaction-kind ${entry.kind}`}>
                            {getKindLabel(entry.kind, t)}
                          </span>
                          <time
                            dateTime={new Date(entry.timestamp).toISOString()}
                          >
                            {formatTimestamp(entry.timestamp)}
                          </time>
                        </div>
                        <strong>{entry.title}</strong>
                        <span>{entry.summary}</span>
                        <div className="transaction-history-meta">
                          <TransactionHashLink
                            chainId={entry.chainId}
                            hash={entry.hash}
                          />
                          <span>{entry.primaryAmount}</span>
                        </div>
                        {entry.secondaryAmount ? (
                          <span className="transaction-history-secondary">
                            {entry.secondaryAmount}
                          </span>
                        ) : null}
                      </li>
                    ))}
                  </ol>
                )}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  )
}

function TransactionHashLink({
  chainId,
  hash,
}: {
  chainId: number
  hash: `0x${string}`
}) {
  const href = getTransactionExplorerUrl(chainId, hash)

  if (!href) {
    return <code>{shortHash(hash)}</code>
  }

  return (
    <a
      className="transaction-hash-link"
      href={href}
      rel="noreferrer"
      target="_blank"
    >
      {shortHash(hash)}
    </a>
  )
}

function getKindLabel(
  kind: TransactionHistoryEntry["kind"],
  t: ReturnType<typeof useI18n>["t"],
) {
  if (kind === "add-liquidity") {
    return t("history.kind.add")
  }

  if (kind === "remove-liquidity") {
    return t("history.kind.remove")
  }

  return t("history.kind.swap")
}

function formatTimestamp(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(timestamp)
}

function shortHash(hash: `0x${string}`) {
  return `${hash.slice(0, 10)}...${hash.slice(-6)}`
}
