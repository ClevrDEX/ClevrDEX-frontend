"use client"

import { useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { useChainId } from "wagmi"

import { getDexDeployment, type TokenInfo } from "@/chains/deployments"
import { useTokenRegistry } from "@/compliance/useTokenRegistry"
import { CloseIcon } from "@/components/CloseIcon"
import {
  addCustomToken,
  removeCustomToken,
  useCustomTokens,
} from "@/features/tokens/customTokens"
import {
  formatTokenBalance,
  useTokenBalance,
  useTokenBalances,
} from "@/features/tokens/useTokenBalance"
import { parseTokenAddress, useTokenSearch } from "@/features/tokens/useTokenSearch"
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
  const chainId = useChainId()
  const deployment = getDexDeployment(chainId)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const selectedToken = tokens.find((token) => token.address === value)
  const balancesQuery = useTokenBalances(tokens, owner)
  const customTokens = useCustomTokens(chainId)
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

  const searchAddress = parseTokenAddress(normalizedQuery)
  const searchIsListed = tokens.some(
    (token) => token.address.toLowerCase() === searchAddress?.toLowerCase(),
  )
  const search = useTokenSearch({
    chainId,
    address: searchAddress,
    enabled: open && Boolean(searchAddress) && !searchIsListed,
  })
  const discoveredToken = search.token
  const discoveredBalanceQuery = useTokenBalance(discoveredToken, owner)

  const registry = useTokenRegistry(
    open ? deployment : undefined,
    useMemo(
      () => [...tokens.map((token) => token.address), discoveredToken?.address],
      [discoveredToken, tokens],
    ),
  )

  function closeModal() {
    setOpen(false)
    setQuery("")
  }

  function selectToken(token: TokenInfo) {
    onChange(token.address)
    closeModal()
  }

  function importToken(token: TokenInfo) {
    addCustomToken(token)
    selectToken(token)
  }

  function forgetToken(token: TokenInfo) {
    removeCustomToken(chainId, token.address)

    if (token.address === value) {
      onChange("")
    }
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
            <div className="token-modal-backdrop" onClick={closeModal}>
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
                    onClick={closeModal}
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

                {discoveredToken ? (
                  <div className="token-import-card">
                    <div>
                      <strong>
                        {discoveredToken.symbol}
                        {" · "}
                        {discoveredToken.name}
                      </strong>
                      <span>
                        {formatTokenAddress(discoveredToken.address)}
                        {owner
                          ? ` · ${formatTokenBalance(
                              discoveredBalanceQuery.data,
                              discoveredToken.decimals,
                              discoveredToken.symbol,
                            )}`
                          : ""}
                      </span>
                      <small
                        className={
                          registry.isRegistered(discoveredToken.address)
                            ? "token-import-note"
                            : "token-import-note warning"
                        }
                      >
                        {registry.isRegistered(discoveredToken.address)
                          ? t("token.cvaRegistered")
                          : t("token.cvaMissing")}
                      </small>
                    </div>
                    <button
                      type="button"
                      onClick={() => importToken(discoveredToken)}
                    >
                      {t("token.importAction")}
                    </button>
                  </div>
                ) : null}

                {search.isLoading ? (
                  <p className="token-empty">{t("token.importLoading")}</p>
                ) : null}

                {search.notFound ? (
                  <p className="token-import-error">{t("token.importInvalid")}</p>
                ) : null}

                <div className="token-list" role="listbox">
                  {filteredTokens.map((token) => {
                    const selected = token.address === value
                    const imported = customTokens.some(
                      (customToken) => customToken.address === token.address,
                    )
                    const balance = balancesQuery.balancesByAddress.get(
                      token.address.toLowerCase(),
                    )

                    return (
                      <div
                        className={
                          imported ? "token-option-row imported" : "token-option-row"
                        }
                        key={token.address}
                        role="presentation"
                      >
                        <button
                          className="token-option"
                          type="button"
                          role="option"
                          aria-selected={selected}
                          onClick={() => selectToken(token)}
                        >
                          <TokenAvatar token={token} />
                          <span className="token-option-copy">
                            <strong>
                              {token.symbol}
                              {registry.isRegistered(token.address) ? (
                                <em className="token-badge" title={t("token.cvaBadgeTitle")}>
                                  CVA
                                </em>
                              ) : null}
                            </strong>
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
                        {imported ? (
                          <button
                            className="token-option-remove"
                            type="button"
                            aria-label={t("token.removeImported", {
                              symbol: token.symbol,
                            })}
                            title={t("token.removeImported", {
                              symbol: token.symbol,
                            })}
                            onClick={() => forgetToken(token)}
                          >
                            <CloseIcon />
                          </button>
                        ) : null}
                      </div>
                    )
                  })}
                </div>

                {filteredTokens.length === 0 &&
                !discoveredToken &&
                !search.isLoading &&
                !search.notFound ? (
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
