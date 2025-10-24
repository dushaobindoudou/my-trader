import { Header } from "@/components/header"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"

export default function AnalysisPage() {
  return (
    <div className="min-h-screen">
      <Header />
      <main className="container mx-auto py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">AI分析</h1>
          <p className="text-muted-foreground">基于AI的投资决策辅助</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 左侧：信息筛选 */}
          <Card>
            <CardHeader>
              <CardTitle>选择上下文</CardTitle>
              <CardDescription>选择要分析的信息条目</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <label className="flex items-center space-x-2">
                  <input type="checkbox" />
                  <span className="text-sm">机构成本分析 - BTC</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" />
                  <span className="text-sm">市场新闻 - 美联储政策</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input type="checkbox" />
                  <span className="text-sm">研报观点 - 技术分析</span>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* 中间：Agent选择 */}
          <Card>
            <CardHeader>
              <CardTitle>选择分析师</CardTitle>
              <CardDescription>选择分析角色</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  趋势分析师
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  风险控制师
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  数据研究员
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  宏观分析师
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 右侧：分析界面 */}
          <Card>
            <CardHeader>
              <CardTitle>分析结果</CardTitle>
              <CardDescription>输入问题并获取分析</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Textarea 
                  placeholder="请输入您的问题..."
                  className="min-h-[100px]"
                />
                <Button className="w-full">开始分析</Button>
                
                <div className="mt-6">
                  <h4 className="font-medium mb-2">分析结果</h4>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="text-sm text-muted-foreground">
                      请选择上下文和分析师后开始分析...
                    </p>
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
