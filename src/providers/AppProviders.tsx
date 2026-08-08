"use client"

import { RainbowKitProvider } from "@rainbow-me/rainbowkit"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { useState } from "react"
import { WagmiProvider } from "wagmi"

import { wagmiConfig } from "@/chains/wagmi"
import { I18nProvider } from "@/i18n"

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient())

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <RainbowKitProvider>{children}</RainbowKitProvider>
        </I18nProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}
