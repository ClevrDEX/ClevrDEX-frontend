import "@rainbow-me/rainbowkit/styles.css"
import "./globals.css"

import type { Metadata } from "next"

import { AppProviders } from "@/providers/AppProviders"

export const metadata: Metadata = {
  title: "ClevrSwap",
  description:
    "ClevrSwap is a compliance-aware DEX built on Cleanverse for policy-aware swaps.",
  icons: {
    icon: "/cleanverse-logo-black.png",
    shortcut: "/cleanverse-logo-black.png",
    apple: "/cleanverse-logo-black.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
