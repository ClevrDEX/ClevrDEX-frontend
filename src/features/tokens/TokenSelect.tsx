"use client"

import { useMemo, useState } from "react"
import { createPortal } from "react-dom"

import type { TokenInfo } from "@/chains/deployments"
import { CloseIcon } from "@/components/CloseIcon"
import {
  formatTokenBalance,
  useTokenBalances,
} from "@/features/tokens/useTokenBalance"
import { TokenAvatar } from "@/features/tokens/TokenAvatar"
import { useI18n } from "@/i18n"

export function TokenSelect({
  tokens,
  value,
  onChange,
  owner,
}: {
  tokens: TokenInfo[]
  value: `0x${string}` | ""
  onChange: (value: `0x${string}` | "") => void
  owner?: `0x${string}`
}) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const selectedToken = tokens.find((token) => token.address === value)
  const balancesQuery = useTokenBalances(tokens, owner)
  const normalizedQuery = query.trim()
  const filteredTokens = useMemo(() => {
    const normalized = normalizedQuery.toLowerCase()

    if (!normalized) {
      return tokens
    }

    return tokens.filter(
      (token) =>
        token.symbol.toLowerCase().includes(normalized) ||
        token.name.toLowerCase().includes(normalized) ||
        token.address.toLowerCase().includes(normalized),
    )
  }, [normalizedQuery, tokens])

  function selectToken(token: TokenInfo) {
    onChange(token.address)
    setOpen(false)
    setQuery("")
  }

  return (
    <div className="token-select-wrap">
      <button
        className="token-select-trigger"
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
      >
        {selectedToken ? (
          <>
            <TokenAvatar token={selectedToken} />
            <span className="token-select-copy">
              <strong>{selectedToken.symbol}</strong>
            </span>
          </>
        ) : (
          <span className="token-select-placeholder">{t("common.selectToken")}</span>
        )}
        <span className="token-select-chevron" aria-hidden="true">
          ▾
        </span>
      </button>

      {open
        ? createPortal(
            <div className="token-modal-backdrop" onClick={() => setOpen(false)}>
              <div
                className="token-modal"
                role="dialog"
                aria-modal="true"
                aria-label={t("token.selectAria")}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="token-menu-header">
                  <div>
                    <strong>{t("common.selectToken")}</strong>
                    <span>{t("token.searchSubtitle")}</span>
                  </div>
                  <button
                    className="token-modal-close"
                    type="button"
                    aria-label={t("token.closeSelector")}
                    onClick={() => setOpen(false)}
                  >
                    <CloseIcon />
                  </button>
                </div>
                <input
                  className="token-search-input"
                  autoFocus
                  placeholder={t("token.searchPlaceholder")}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />

                <div className="token-list" role="listbox">
                  {filteredTokens.map((token) => {
                    const selected = token.address === value
                    const balance = balancesQuery.balancesByAddress.get(
                      token.address.toLowerCase(),
                    )

                    return (
                      <button
                        className="token-option"
                        type="button"
                        key={token.address}
                        role="option"
                        aria-selected={selected}
                        onClick={() => selectToken(token)}
                      >
                        <TokenAvatar token={token} />
                        <span className="token-option-copy">
                          <strong>{token.symbol}</strong>
                          <span>{token.name}</span>
                        </span>
                        <span className="token-option-meta">
                          {owner ? (
                            <span className="token-option-balance">
                              {formatTokenBalance(balance, token.decimals)}
                            </span>
                          ) : null}
                          <span className="token-option-address">
                            {formatTokenAddress(token.address)}
                          </span>
                        </span>
                      </button>
                    )
                  })}
                </div>

                {filteredTokens.length === 0 ? (
                  <p className="token-empty">{t("token.empty")}</p>
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </div>
  )
}

function formatTokenAddress(address: `0x${string}`) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`
}
