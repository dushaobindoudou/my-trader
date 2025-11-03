/**
 * 主题图标显示组件
 * 支持显示 @web3icons/react Mono 模式中的图标或 @ledgerhq/crypto-icons 回退，以及 emoji
 */

'use client'

import { Suspense } from 'react'
import { CryptoIconFallback } from './crypto-icon-fallback'

interface TopicIconProps {
  icon?: string | null // 图标值，格式：'crypto:btc' 或 emoji
  size?: number // 图标大小（仅用于 crypto-icon）
  className?: string
}

export function TopicIcon({ icon, size = 16, className = '' }: TopicIconProps) {
  if (!icon) return null

  // 如果是加密货币图标
  if (icon.startsWith('crypto:')) {
    const code = icon.replace('crypto:', '')
    return (
      <Suspense fallback={<span style={{ width: size, height: size }} className={className} />}>
        <CryptoIconFallback
          symbol={code}
          size={size}
          variant="mono"
          className={className}
        />
      </Suspense>
    )
  }

  // 否则作为 emoji 显示
  return <span className={className}>{icon}</span>
}

