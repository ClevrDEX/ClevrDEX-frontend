"use client"

import { useMemo, useState } from "react"
import { createPortal } from "react-dom"
import { getAddress, isAddress } from "viem"
import type { usePublicClient } from "wagmi"

import type { TokenInfo } from "@/chains/deployments"
import { erc20Abi } from "@/dex/v2/abi/erc20"
import {
  formatTokenBalance,
  useTokenBalances,
} from "@/features/tokens/useTokenBalance"
import { TokenAvatar } from "@/features/tokens/TokenAvatar"

export function TokenSelect({
  chainId,
  publicClient,
  tokens,
  value,
  onChange,
  onImport,
  owner,
}: {
  chainId: number
  publicClient: ReturnType<typeof usePublicClient>
  tokens: TokenInfo[]
  value: `0x${string}` | ""
  onChange: (value: `0x${string}` | "") => void
  onImport: (token: TokenInfo) => void
  owner?: `0x${string}`
}) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [isImporting, setIsImporting] = useState(false)
  const [importError, setImportError] = useState("")
  const selectedToken = tokens.find((token) => token.address === value)
  const balancesQuery = useTokenBalances(tokens, owner)
  const normalizedQuery = query.trim()
  const searchAddress = isAddress(normalizedQuery)
    ? getAddress(normalizedQuery)
    : undefined
  const hasListedSearchAddress = Boolean(
    searchAddress &&
      tokens.some(
        (token) => token.address.toLowerCase() === searchAddress.toLowerCase(),
      ),
  )
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
    setImportError("")
  }

  async function importTokenByAddress() {
    setImportError("")

    if (!publicClient || !searchAddress) {
      setImportError("Enter a valid token contract address.")
      return
    }

    setIsImporting(true)

    try {
      const [name, symbol, decimals] = await Promise.all([
        publicClient.readContract({
          address: searchAddress,
          abi: erc20Abi,
          functionName: "name",
        }),
        publicClient.readContract({
          address: searchAddress,
          abi: erc20Abi,
          functionName: "symbol",
        }),
        publicClient.readContract({
          address: searchAddress,
          abi: erc20Abi,
          functionName: "decimals",
        }),
      ])
      const token = {
        chainId,
        address: searchAddress,
        name,
        symbol,
        decimals,
      } satisfies TokenInfo

      onImport(token)
      selectToken(token)
    } catch {
      setImportError("Could not read ERC20 metadata from this address.")
    } finally {
      setIsImporting(false)
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
          <span className="token-select-placeholder">Select token</span>
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
                aria-label="Select a token"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="token-menu-header">
                  <div>
                    <strong>Select a token</strong>
                    <span>Search by name, symbol or contract address</span>
                  </div>
                  <button
                    className="token-modal-close"
                    type="button"
                    aria-label="Close token selector"
                    onClick={() => setOpen(false)}
                  >
                    ×
                  </button>
                </div>
                <input
                  className="token-search-input"
                  autoFocus
                  placeholder="Search name or paste address"
                  value={query}
                  onChange={(event) => {
                    setQuery(event.target.value)
                    setImportError("")
                  }}
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

                {searchAddress && !hasListedSearchAddress ? (
                  <div className="token-import-card">
                    <div>
                      <strong>Import token</strong>
                      <span>{formatTokenAddress(searchAddress)}</span>
                    </div>
                    <button
                      type="button"
                      disabled={isImporting}
                      onClick={importTokenByAddress}
                    >
                      {isImporting ? "Importing..." : "Import"}
                    </button>
                  </div>
                ) : null}

                {filteredTokens.length === 0 && !searchAddress ? (
                  <p className="token-empty">
                    No token found. Paste a contract address to import.
                  </p>
                ) : null}

                {importError ? (
                  <p className="token-import-error">{importError}</p>
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
