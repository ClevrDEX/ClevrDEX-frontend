import "@rainbow-me/rainbowkit/styles.css"
import "./globals.css"

import type { Metadata } from "next"

import { AppProviders } from "@/providers/AppProviders"

export const metadata: Metadata = {
  title: "CleanDEX",
  description: "APass Compliance decentralized exchange frontend",
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
