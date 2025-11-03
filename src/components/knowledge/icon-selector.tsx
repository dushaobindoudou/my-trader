/**
 * 图标选择器组件
 * 支持搜索或输入加密货币代码，使用 @web3icons/react Mono 模式或 @ledgerhq/crypto-icons 回退
 */

'use client'

import { useState, useEffect } from 'react'
import { CryptoIconFallback } from './crypto-icon-fallback'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Search } from 'lucide-react'

interface IconSelectorProps {
  value?: string // 当前选中的图标值，格式：'crypto:btc'
  onChange: (value: string) => void
}

export function IconSelector({ value = '', onChange }: IconSelectorProps) {
  const [cryptoSearch, setCryptoSearch] = useState('')

  // 解析当前值
  useEffect(() => {
    if (value && value.startsWith('crypto:')) {
      const cryptoCode = value.replace('crypto:', '')
      setCryptoSearch(cryptoCode)
    } else {
      setCryptoSearch('')
    }
  }, [value])

  // 处理加密货币代码输入
  const handleCryptoInput = (input: string) => {
    const code = input.trim().toLowerCase()
    setCryptoSearch(input)
    if (code) {
      onChange(`crypto:${code}`)
    } else {
      onChange('')
    }
  }

  // 获取当前显示的图标
  const getCurrentIcon = () => {
    if (!value || !value.startsWith('crypto:')) return null
    const code = value.replace('crypto:', '')
    return (
      <CryptoIconFallback
        symbol={code}
        size={24}
        variant="mono"
      />
    )
  }

  return (
    <div className="space-y-3">
      {/* 加密货币图标搜索 */}
      <div className="space-y-2">
        <Label>搜索或输入加密货币代码</Label>
        <div className="relative">
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={cryptoSearch}
            onChange={(e) => handleCryptoInput(e.target.value)}
            placeholder="例如：btc, eth, sol..."
            className="pl-8"
          />
        </div>
      </div>

      {/* 当前选中的图标预览 */}
      {value && value.startsWith('crypto:') && (
        <div className="flex items-center gap-2 p-2 border rounded-md bg-muted/30">
          <span className="text-sm text-muted-foreground">当前选择：</span>
          {getCurrentIcon()}
          <span className="text-sm font-medium">
            {value.replace('crypto:', '').toUpperCase()}
          </span>
        </div>
      )}
    </div>
  )
}

