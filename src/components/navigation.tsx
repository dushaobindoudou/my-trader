"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const navigation = [
  { name: "知识库", href: "/knowledge" },
  { name: "投资记录", href: "/trades" },
  { name: "资产管理", href: "/portfolio" },
  { name: "观察列表", href: "/watchlist" },
  { name: "AI分析", href: "/analysis" },
  { name: "历史", href: "/history" },
  { name: "设置", href: "/settings" },
]

export function Navigation() {
  const pathname = usePathname()

  return (
    <nav className="flex space-x-8">
      {navigation.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            pathname === item.href
              ? "text-foreground"
              : "text-muted-foreground"
          )}
        >
          {item.name}
        </Link>
      ))}
    </nav>
  )
}
