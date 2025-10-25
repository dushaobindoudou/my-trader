import type { Metadata } from "next"
import { Inter, Manrope } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/contexts/theme-provider"
import { FontProvider } from "@/contexts/font-provider"

const inter = Inter({ 
  subsets: ["latin"],
  variable: '--font-inter',
  display: 'swap',
})

const manrope = Manrope({ 
  subsets: ["latin"],
  variable: '--font-manrope',
  display: 'swap',
})

export const metadata: Metadata = {
  title: "AI交易员",
  description: "基于AI的投资决策辅助系统",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${inter.variable} ${manrope.variable} font-inter antialiased`}>
        <ThemeProvider>
          <FontProvider>
            {children}
          </FontProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
