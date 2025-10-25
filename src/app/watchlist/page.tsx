import { AuthenticatedLayout } from "@/components/layout/authenticated-layout"
import { Main } from "@/components/layout/main"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"

export default function WatchlistPage() {
  return (
    <AuthenticatedLayout>
      <Main>
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">观察列表</h1>
            <p className="text-muted-foreground">跟踪感兴趣的标的</p>
          </div>
          <Button>添加标的</Button>
        </div>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>BTC</CardTitle>
              <CardDescription>比特币</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">当前价格</p>
                  <p className="text-2xl font-bold">$65,000</p>
                </div>
                <div>
                  <p className="text-sm font-medium">目标价格</p>
                  <p className="text-2xl font-bold">$70,000</p>
                </div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                等待突破关键阻力位
              </p>
              <div className="flex gap-2 mt-4">
                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">观察中</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </Main>
    </AuthenticatedLayout>
  )
}
