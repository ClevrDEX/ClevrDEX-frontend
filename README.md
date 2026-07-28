# Verified DEX Frontend

Verified DEX is an APass Compliance frontend for configurable V2-style contract deployments.

## Current Scope

The current implementation includes:

```text
Next.js + TypeScript
wagmi + viem
RainbowKit wallet connection
config-driven chain and router deployment
ERC20 to ERC20 V2 quote
ERC20 approve
swapExactTokensForTokens
```

## Configure Contracts

Replace the placeholder values in:

```text
src/chains/deployments.ts
```

Required values per chain:

```text
RPC URL
Factory address
Router address
Wrapped native token address
INIT_CODE_PAIR_HASH
Token list entries
Base tokens
```

The current app focuses on ERC20 to ERC20 swaps through configured deployments.

## Commands

```bash
pnpm install
pnpm dev
pnpm typecheck
pnpm build
```

## Docker Deploy

```bash
docker compose up -d --build
```

The app is exposed on `http://localhost:5003`.
