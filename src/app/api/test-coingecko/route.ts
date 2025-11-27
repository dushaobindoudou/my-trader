/**
 * CoinGecko API 测试路由（无需登录）
 * 用于调试 API 连接问题
 */

import { NextResponse } from 'next/server'
import { ProxyAgent, fetch as undiciFetch } from 'undici'

export const dynamic = 'force-dynamic'

// 获取代理配置
function getProxyUrl(): string | undefined {
  return (
    process.env.HTTPS_PROXY ||
    process.env.HTTP_PROXY ||
    process.env.https_proxy ||
    process.env.http_proxy
  )
}

export async function GET() {
  const proxyUrl = getProxyUrl()
  
  const results: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      hasProxy: !!proxyUrl,
      proxyUrl: proxyUrl || undefined,
      hasApiKey: !!(process.env.COINGECKO_API_KEY || process.env.COINGECKO_PRO_API_KEY),
      nodeVersion: process.version,
    },
    tests: {},
  }

  const headers = {
    'Accept': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  }

  // 测试 1: 使用 undici 和代理
  if (proxyUrl) {
    try {
      console.log('[Test] 测试 1: 使用 undici + 代理请求 CoinGecko API')
      const proxyAgent = new ProxyAgent(proxyUrl)
      const response = await undiciFetch('https://api.coingecko.com/api/v3/ping', {
        headers,
        dispatcher: proxyAgent,
      })
      const data = await response.json()
      results.tests = {
        ...results.tests as object,
        undiciProxyRequest: {
          success: true,
          status: response.status,
          data,
        },
      }
    } catch (error) {
      results.tests = {
        ...results.tests as object,
        undiciProxyRequest: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    }
  } else {
    results.tests = {
      ...results.tests as object,
      undiciProxyRequest: {
        skipped: true,
        reason: 'No proxy configured. Set HTTPS_PROXY environment variable.',
      },
    }
  }

  // 测试 2: 使用原生 fetch（不使用代理）
  try {
    console.log('[Test] 测试 2: 使用原生 fetch（无代理）')
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)
    
    const response = await fetch('https://api.coingecko.com/api/v3/ping', {
      headers,
      signal: controller.signal,
    })
    clearTimeout(timeoutId)
    
    const data = await response.json()
    results.tests = {
      ...results.tests as object,
      nativeFetch: {
        success: true,
        status: response.status,
        data,
      },
    }
  } catch (error) {
    results.tests = {
      ...results.tests as object,
      nativeFetch: {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        hint: 'Native fetch does not support proxy. Use undici with ProxyAgent.',
      },
    }
  }

  // 测试 3: 获取全球市场数据（使用代理）
  if (proxyUrl) {
    try {
      console.log('[Test] 测试 3: 获取全球市场数据（undici + 代理）')
      const proxyAgent = new ProxyAgent(proxyUrl)
      const response = await undiciFetch('https://api.coingecko.com/api/v3/global', {
        headers,
        dispatcher: proxyAgent,
      })
      const data = await response.json() as { data?: { active_cryptocurrencies?: number; markets?: number } }
      results.tests = {
        ...results.tests as object,
        globalData: {
          success: true,
          status: response.status,
          hasData: !!data?.data,
          activeCryptos: data?.data?.active_cryptocurrencies,
          markets: data?.data?.markets,
        },
      }
    } catch (error) {
      results.tests = {
        ...results.tests as object,
        globalData: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    }
  }

  // 测试 4: 获取 DeFi 数据
  if (proxyUrl) {
    try {
      console.log('[Test] 测试 4: 获取 DeFi 数据（undici + 代理）')
      const proxyAgent = new ProxyAgent(proxyUrl)
      const response = await undiciFetch('https://api.coingecko.com/api/v3/global/decentralized_finance_defi', {
        headers,
        dispatcher: proxyAgent,
      })
      const data = await response.json() as { data?: { defi_market_cap?: string; top_coin_name?: string } }
      results.tests = {
        ...results.tests as object,
        defiData: {
          success: true,
          status: response.status,
          hasData: !!data?.data,
          defiMarketCap: data?.data?.defi_market_cap,
          topCoin: data?.data?.top_coin_name,
        },
      }
    } catch (error) {
      results.tests = {
        ...results.tests as object,
        defiData: {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        },
      }
    }
  }

  console.log('[Test] 测试完成:', JSON.stringify(results, null, 2))
  return NextResponse.json(results, {
    headers: {
      'Content-Type': 'application/json',
    },
  })
}

