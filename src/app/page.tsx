import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Main } from '@/components/layout/main'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'
import { ArrowUpIcon, ArrowDownIcon, TrendingUp, DollarSign, Target, Activity } from "lucide-react"

export default function Home() {
  return (
    <AuthenticatedLayout>
      <Main>
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总资产</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥125,000</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowUpIcon className="h-3 w-3 text-green-600" />
              <span className="text-green-600">+20.1%</span>
              <span>较上月</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总收益</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">+¥25,000</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowUpIcon className="h-3 w-3 text-green-600" />
              <span className="text-green-600">+25%</span>
              <span>收益率</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">持仓数量</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">
              3个标的在观察列表
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">今日变化</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">-¥1,200</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowDownIcon className="h-3 w-3 text-red-600" />
              <span className="text-red-600">-0.96%</span>
              <span>今日涨跌</span>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts and Recent Activity */}
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4">
          <CardHeader>
            <CardTitle>资产趋势</CardTitle>
            <CardDescription>最近30天的资产变化情况</CardDescription>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[300px] flex items-center justify-center text-muted-foreground">
              图表区域（可接入 recharts 或其他图表库）
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3">
          <CardHeader>
            <CardTitle>最近交易</CardTitle>
            <CardDescription>最新的投资记录</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">买入 BTC</p>
                  <p className="text-xs text-muted-foreground">2小时前</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">¥10,000</p>
                  <p className="text-xs text-green-600">+5.2%</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">卖出 ETH</p>
                  <p className="text-xs text-muted-foreground">昨天</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">¥5,000</p>
                  <p className="text-xs text-green-600">+12.5%</p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">买入 SOL</p>
                  <p className="text-xs text-muted-foreground">3天前</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium">¥3,000</p>
                  <p className="text-xs text-red-600">-2.1%</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Holdings */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>持仓概览</CardTitle>
          <CardDescription>当前主要持仓资产</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <span className="font-bold text-orange-600">₿</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Bitcoin (BTC)</p>
                  <p className="text-xs text-muted-foreground">0.5 BTC</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">¥75,000</p>
                <p className="text-xs text-green-600">+15.2%</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <span className="font-bold text-blue-600">Ξ</span>
                </div>
                <div>
                  <p className="text-sm font-medium">Ethereum (ETH)</p>
                  <p className="text-xs text-muted-foreground">2.0 ETH</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">¥50,000</p>
                <p className="text-xs text-green-600">+8.5%</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      </Main>
    </AuthenticatedLayout>
  )
}
