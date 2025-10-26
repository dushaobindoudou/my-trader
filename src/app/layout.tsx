import type { Metadata } from "next"
import { Inter, Manrope } from "next/font/google"
import "./globals.css"
import { ThemeProvider } from "@/contexts/theme-provider"
import { FontProvider } from "@/contexts/font-provider"
import { Providers } from "@/contexts/providers"
import { AuthGuard } from "@/components/auth/auth-guard"
import { Toaster } from "sonner"

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
  title: "AIpha Trader - web3辅助投资系统",
  description: "web3辅助投资系统，安全、快速、专业的交易体验",
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
            <Providers>
              <AuthGuard>
                {children}
              </AuthGuard>
              <Toaster position="top-right" richColors />
            </Providers>
          </FontProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}