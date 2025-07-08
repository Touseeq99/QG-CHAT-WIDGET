import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Qadri Group Chat Widget",
  description: "HR Assistant Chat Widget for Qadri Group",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="transparent-iframe">
      <body className={`${inter.className} transparent-iframe`}>{children}</body>
    </html>
  )
}
