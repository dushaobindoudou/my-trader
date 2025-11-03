/**
 * 加密货币图标回退组件
 * 优先使用 @web3icons/react，如果失败则回退到 @ledgerhq/crypto-icons
 */

'use client'

import { useState, useEffect } from 'react'
import { TokenIcon } from '@web3icons/react'
import { CryptoIcon } from '@ledgerhq/crypto-icons'

interface CryptoIconFallbackProps {
  symbol: string // 代币符号，如 'btc', 'eth'
  size?: number // 图标大小（像素）
  variant?: 'mono' | 'branded' | 'background' // web3icons 的变体
  className?: string
  fallback?: boolean // 强制使用回退图标
}

// 将代币符号转换为 ledgerId（常见映射）
function getLedgerId(symbol: string): string {
  const symbolLower = symbol.toLowerCase()
  
  // 常见代币的 ledgerId 映射
  const mapping: Record<string, string> = {
    'btc': 'bitcoin',
    'eth': 'ethereum',
    'usdt': 'tether',
    'usdc': 'usd__coin',
    'bnb': 'binancecoin',
    'sol': 'solana',
    'xrp': 'ripple',
    'ada': 'cardano',
    'avax': 'avalanche',
    'doge': 'dogecoin',
    'dot': 'polkadot',
    'link': 'chainlink',
    'matic': 'polygon',
    'shib': 'shiba_inu',
    'trx': 'tron',
    'ltc': 'litecoin',
    'atom': 'cosmos',
    'etc': 'ethereum_classic',
    'xlm': 'stellar',
    'bch': 'bitcoin_cash',
    'algo': 'algorand',
    'vet': 'vechain',
    'fil': 'filecoin',
    'icp': 'internet_computer',
    'apt': 'aptos',
    'near': 'near',
    'arb': 'arbitrum',
    'op': 'optimism',
    'inj': 'injective',
    'imx': 'immutable_x',
  }
  
  return mapping[symbolLower] || symbolLower
}

// 将数字大小转换为 @ledgerhq/crypto-icons 支持的格式
function convertSize(size: number): '16px' | '20px' | '24px' | '32px' | '40px' | '48px' | '56px' {
  if (size <= 16) return '16px'
  if (size <= 20) return '20px'
  if (size <= 24) return '24px'
  if (size <= 32) return '32px'
  if (size <= 40) return '40px'
  if (size <= 48) return '48px'
  return '56px'
}

// 创建一个错误边界组件来捕获 TokenIcon 的错误
function IconErrorBoundary({
  children,
  fallback,
}: {
  children: React.ReactNode
  fallback: React.ReactNode
}) {
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setHasError(false)
  }, [children])

  if (hasError) {
    return <>{fallback}</>
  }

  try {
    return <>{children}</>
  } catch {
    return <>{fallback}</>
  }
}

export function CryptoIconFallback({
  symbol,
  size = 24,
  variant = 'mono',
  className = '',
  fallback = false,
}: CryptoIconFallbackProps) {
  const [useFallback, setUseFallback] = useState(fallback)

  useEffect(() => {
    setUseFallback(fallback)
  }, [fallback, symbol])

  const ledgerId = getLedgerId(symbol)
  const ledgerIcon = (
    <div className={className} style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
      <CryptoIcon
        ledgerId={ledgerId}
        ticker={symbol.toUpperCase()}
        size={convertSize(size)}
      />
    </div>
  )

  // 如果强制使用回退，直接使用 Ledger 图标
  if (useFallback) {
    return ledgerIcon
  }

  // 优先尝试使用 web3icons，如果失败则回退到 Ledger
  return (
    <IconErrorBoundary fallback={ledgerIcon}>
      <TokenIcon
        symbol={symbol}
        size={size}
        variant={variant}
        className={className}
        fallback={ledgerIcon}
      />
    </IconErrorBoundary>
  )
}

