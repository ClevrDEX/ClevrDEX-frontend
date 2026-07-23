import "@rainbow-me/rainbowkit/styles.css"
import "./globals.css"

import type { Metadata } from "next"

import { AppProviders } from "@/providers/AppProviders"

export const metadata: Metadata = {
  title: "Verified DEX",
  description: "APass Compliance decentralized exchange frontend",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
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
