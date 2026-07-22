"use client"

import { getDefaultConfig } from "@rainbow-me/rainbowkit"

import { supportedChains } from "@/chains/deployments"

export const wagmiConfig = getDefaultConfig({
  appName: "CleanDEX",
  projectId: "clean-dex-local",
  chains: supportedChains as [typeof supportedChains[number], ...typeof supportedChains],
  ssr: true,
})
