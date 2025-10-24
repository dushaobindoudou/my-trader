import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function KnowledgePage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">知识库</h1>
            <p className="text-muted-foreground">管理投资信息和市场数据</p>
          </div>
          <Button>新建信息</Button>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>机构成本分析</CardTitle>
              <CardDescription>2024年10月24日</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                比特币机构持仓成本分析，当前价格在机构成本区间内...
              </p>
              <div className="flex gap-2 mt-4">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">机构成本</span>
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded">BTC</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>市场新闻</CardTitle>
              <CardDescription>2024年10月23日</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                美联储政策对加密货币市场的影响分析...
              </p>
              <div className="flex gap-2 mt-4">
                <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded">市场新闻</span>
                <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">宏观</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
