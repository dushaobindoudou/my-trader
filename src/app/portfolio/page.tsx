import { Header } from "@/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function PortfolioPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">资产管理</h1>
          <p className="text-muted-foreground">跟踪资产组合和盈亏情况</p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>资产总览</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm font-medium">总价值</p>
                  <p className="text-2xl font-bold">¥125,000</p>
                </div>
                <div>
                  <p className="text-sm font-medium">总投入</p>
                  <p className="text-2xl font-bold">¥100,000</p>
                </div>
                <div>
                  <p className="text-sm font-medium">总盈亏</p>
                  <p className="text-2xl font-bold text-green-600">+¥25,000</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>持仓详情</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">BTC</p>
                    <p className="text-sm text-muted-foreground">0.5 BTC</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">¥75,000</p>
                    <p className="text-sm text-green-600">+¥15,000</p>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-medium">ETH</p>
                    <p className="text-sm text-muted-foreground">2.0 ETH</p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">¥50,000</p>
                    <p className="text-sm text-green-600">+¥10,000</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
