import { AuthenticatedLayout } from "@/components/layout/authenticated-layout"
import { Main } from "@/components/layout/main"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function HistoryPage() {
  return (
    <AuthenticatedLayout>
      <Main>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">历史记录</h1>
          <p className="text-muted-foreground">查看分析历史</p>
        </div>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>BTC投资分析</CardTitle>
              <CardDescription>2024年10月24日 - 趋势分析师</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                问题：基于当前市场情况，BTC的投资价值如何？
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm">
                  基于提供的机构成本分析，当前BTC价格处于合理区间...
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>风险评估</CardTitle>
              <CardDescription>2024年10月23日 - 风险控制师</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                问题：当前投资组合的风险如何？
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm">
                  建议控制仓位，设置止损点...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </Main>
    </AuthenticatedLayout>
  )
}
