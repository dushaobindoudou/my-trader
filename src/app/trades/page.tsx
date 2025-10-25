import { AuthenticatedLayout } from "@/components/layout/authenticated-layout"
import { Main } from "@/components/layout/main"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function TradesPage() {
  return (
    <AuthenticatedLayout>
      <Main>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">投资记录</h1>
            <p className="text-muted-foreground">记录交易决策和投资历史</p>
          </div>
          <Button>新建交易</Button>
        </div>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>买入 BTC</CardTitle>
              <CardDescription>2024年10月24日</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">金额</p>
                  <p className="text-2xl font-bold">¥10,000</p>
                </div>
                <div>
                  <p className="text-sm font-medium">价格</p>
                  <p className="text-2xl font-bold">$65,000</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                基于机构成本分析，当前价格处于合理区间
              </p>
            </CardContent>
          </Card>
        </div>
      </Main>
    </AuthenticatedLayout>
  )
}
