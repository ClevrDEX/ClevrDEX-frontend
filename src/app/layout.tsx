import "@rainbow-me/rainbowkit/styles.css"
import "./globals.css"

import type { Metadata } from "next"
import { Poppins } from "next/font/google"

import { AppProviders } from "@/providers/AppProviders"

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
})

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
      <body className={poppins.variable}>
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  )
}
