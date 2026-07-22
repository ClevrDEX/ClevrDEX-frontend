import type { TokenInfo } from "@/chains/deployments"

export function TokenAvatar({ token }: { token: TokenInfo }) {
  return (
    <span className="token-avatar" data-token={token.symbol} aria-hidden="true">
      {token.logoURI ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={token.logoURI} alt="" />
      ) : (
        token.symbol.slice(0, 2).toUpperCase()
      )}
    </span>
  )
}
