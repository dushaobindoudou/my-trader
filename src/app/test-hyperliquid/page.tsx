'use client'

import { useState } from 'react'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { Main } from '@/components/layout/main'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import axios from 'axios'
import { Loader2, CheckCircle2, XCircle } from 'lucide-react'

const HYPERLIQUID_API_BASE = process.env.NEXT_PUBLIC_HYPERLIQUID_API_BASE || 'https://api.hyperliquid.xyz'

export default function TestHyperliquidPage() {
  const [testType, setTestType] = useState<string>('metaAndAssetCtxs')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [requestBody, setRequestBody] = useState<string>('')

  const testTypes = [
    { value: 'metaAndAssetCtxs', label: '获取交易对列表 (metaAndAssetCtxs)' },
    { value: 'candleSnapshot', label: '获取K线数据 (candleSnapshot)' },
    { value: 'meta', label: '获取元数据 (meta)' },
    { value: 'clearinghouseState', label: '获取账户状态 (clearinghouseState)' },
  ]

  const handleTest = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      let body: any = {}

      // 根据不同的测试类型构建请求体
      switch (testType) {
        case 'metaAndAssetCtxs':
          body = { type: 'metaAndAssetCtxs' }
          break
        case 'candleSnapshot':
          body = {
            type: 'candleSnapshot',
            req: {
              coin: 'BTC',
              interval: '1h',
              n: 100,
            },
          }
          break
        case 'meta':
          body = { type: 'meta' }
          break
        case 'clearinghouseState':
          // 需要用户地址，这里使用示例地址
          body = {
            type: 'clearinghouseState',
            user: '0x0000000000000000000000000000000000000000',
          }
          break
        default:
          body = JSON.parse(requestBody || '{}')
      }

      setRequestBody(JSON.stringify(body, null, 2))

      const response = await axios.post(`${HYPERLIQUID_API_BASE}/info`, body, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      })

      setResult({
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
      })
    } catch (err: any) {
      if (err.response) {
        // 服务器返回了错误响应
        setError(
          `错误 ${err.response.status}: ${err.response.statusText}\n${JSON.stringify(err.response.data, null, 2)}`
        )
        setResult({
          status: err.response.status,
          statusText: err.response.statusText,
          headers: err.response.headers,
          data: err.response.data,
        })
      } else if (err.request) {
        // 请求已发送但没有收到响应
        setError(`请求失败: 没有收到响应\n${err.message}`)
      } else {
        // 其他错误
        setError(`错误: ${err.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCustomTest = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const body = JSON.parse(requestBody || '{}')

      const response = await axios.post(`${HYPERLIQUID_API_BASE}/info`, body, {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 10000,
      })

      setResult({
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data,
      })
    } catch (err: any) {
      if (err.response) {
        setError(
          `错误 ${err.response.status}: ${err.response.statusText}\n${JSON.stringify(err.response.data, null, 2)}`
        )
        setResult({
          status: err.response.status,
          statusText: err.response.statusText,
          headers: err.response.headers,
          data: err.response.data,
        })
      } else if (err.request) {
        setError(`请求失败: 没有收到响应\n${err.message}`)
      } else {
        setError(`JSON 解析错误: ${err.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthenticatedLayout>
      <Main>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">Hyperliquid API 测试</h1>
          <p className="text-muted-foreground">测试 Hyperliquid API 接口调用</p>
        </div>

        <div className="grid gap-6">
          {/* 测试配置 */}
          <Card>
            <CardHeader>
              <CardTitle>测试配置</CardTitle>
              <CardDescription>选择要测试的接口类型</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="testType">测试类型</Label>
                <Select value={testType} onValueChange={setTestType}>
                  <SelectTrigger id="testType">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {testTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">自定义请求</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {testType === 'custom' && (
                <div className="space-y-2">
                  <Label htmlFor="requestBody">请求体 (JSON)</Label>
                  <textarea
                    id="requestBody"
                    className="w-full min-h-[200px] rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
                    value={requestBody}
                    onChange={(e) => setRequestBody(e.target.value)}
                    placeholder='{"type": "metaAndAssetCtxs"}'
                  />
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleTest} disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      测试中...
                    </>
                  ) : (
                    '执行测试'
                  )}
                </Button>
                {testType === 'custom' && (
                  <Button onClick={handleCustomTest} disabled={loading} variant="outline">
                    测试自定义请求
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* 请求信息 */}
          {requestBody && (
            <Card>
              <CardHeader>
                <CardTitle>请求信息</CardTitle>
                <CardDescription>发送到 API 的请求</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm font-medium">请求 URL:</p>
                  <code className="block p-2 bg-muted rounded text-sm break-all">
                    {HYPERLIQUID_API_BASE}/info
                  </code>
                  <p className="text-sm font-medium mt-4">请求体:</p>
                  <pre className="p-4 bg-muted rounded text-xs overflow-auto max-h-[300px]">
                    {requestBody}
                  </pre>
                </div>
              </CardContent>
            </Card>
          )}

          {/* 错误信息 */}
          {error && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-red-600">
                  <XCircle className="h-5 w-5" />
                  错误信息
                </CardTitle>
              </CardHeader>
              <CardContent>
                <pre className="p-4 bg-red-50 dark:bg-red-900/20 rounded text-xs overflow-auto max-h-[300px] whitespace-pre-wrap">
                  {error}
                </pre>
              </CardContent>
            </Card>
          )}

          {/* 响应结果 */}
          {result && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {result.status === 200 ? (
                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600" />
                  )}
                  响应结果
                </CardTitle>
                <CardDescription>
                  HTTP {result.status} {result.statusText}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm font-medium mb-2">响应数据:</p>
                    <pre className="p-4 bg-muted rounded text-xs overflow-auto max-h-[600px]">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>

                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm font-medium">
                      响应头信息
                    </summary>
                    <pre className="mt-2 p-4 bg-muted rounded text-xs overflow-auto max-h-[200px]">
                      {JSON.stringify(result.headers, null, 2)}
                    </pre>
                  </details>

                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">数据结构分析:</p>
                    <div className="p-4 bg-muted rounded text-sm">
                      {Array.isArray(result.data) ? (
                        <div>
                          <p className="font-semibold">返回类型: 数组</p>
                          <p>数组长度: {result.data.length}</p>
                          {result.data.length > 0 && (
                            <div className="mt-2">
                              <p className="font-semibold">第一个元素类型:</p>
                              <p className="text-xs">
                                {typeof result.data[0]} -{' '}
                                {Array.isArray(result.data[0])
                                  ? '数组'
                                  : typeof result.data[0] === 'object'
                                  ? '对象'
                                  : '其他'}
                              </p>
                              {typeof result.data[0] === 'object' &&
                                !Array.isArray(result.data[0]) && (
                                  <p className="text-xs mt-1">
                                    键: {Object.keys(result.data[0]).join(', ')}
                                  </p>
                                )}
                            </div>
                          )}
                        </div>
                      ) : typeof result.data === 'object' ? (
                        <div>
                          <p className="font-semibold">返回类型: 对象</p>
                          <p>键: {Object.keys(result.data).join(', ')}</p>
                        </div>
                      ) : (
                        <p className="font-semibold">
                          返回类型: {typeof result.data}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </Main>
    </AuthenticatedLayout>
  )
}

