import { AuthenticatedLayout } from "@/components/layout/authenticated-layout"
import { Main } from "@/components/layout/main"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function SettingsPage() {
  return (
    <AuthenticatedLayout>
      <Main>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">设置</h1>
          <p className="text-muted-foreground">配置LLM模型和Agent</p>
        </div>
        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <CardTitle>LLM模型配置</CardTitle>
              <CardDescription>配置AI模型API</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="openai-key">OpenAI API Key</Label>
                  <Input id="openai-key" type="password" placeholder="sk-..." />
                </div>
                <div>
                  <Label htmlFor="anthropic-key">Anthropic API Key</Label>
                  <Input id="anthropic-key" type="password" placeholder="sk-ant-..." />
                </div>
                <Button>保存配置</Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Agent配置</CardTitle>
              <CardDescription>管理分析角色</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">趋势分析师</p>
                    <p className="text-sm text-muted-foreground">专注于市场趋势分析</p>
                  </div>
                  <Button variant="outline" size="sm">编辑</Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">风险控制师</p>
                    <p className="text-sm text-muted-foreground">专注于风险评估</p>
                  </div>
                  <Button variant="outline" size="sm">编辑</Button>
                </div>
                <Button variant="outline" className="w-full">添加新Agent</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </Main>
    </AuthenticatedLayout>
  )
}
