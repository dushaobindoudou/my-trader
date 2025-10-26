'use client';

import React from 'react';
import { useWeb3Auth } from '@/contexts/web3auth-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Wallet, 
  Shield, 
  User, 
  LogOut, 
  Copy,
  ExternalLink 
} from 'lucide-react';
import { toast } from 'sonner';

export default function TestAuthPage() {
  const { 
    user, 
    isLoggedIn, 
    isLoading, 
    login, 
    logout, 
    getUserInfo, 
    getAccounts, 
    getBalance,
    address,
    connectorName,
    connectError,
    disconnectError
  } = useWeb3Auth();

  const handleLogin = async () => {
    try {
      await login();
      toast.success('登录成功！');
    } catch (error) {
      console.error('Login error:', error);
      toast.error('登录失败');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('已退出登录');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('退出登录失败');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('已复制到剪贴板');
  };

  const formatAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="min-h-screen bg-slate-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-4">Web3认证测试页面</h1>
          <p className="text-slate-400">测试Web3Auth集成和用户认证功能</p>
        </div>

        {/* 认证状态 */}
        <Card className="bg-white/5 backdrop-blur-lg border-white/20">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-white">
              <Shield className="w-5 h-5" />
              <span>认证状态</span>
              <Badge className={isLoggedIn ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}>
                {isLoggedIn ? '已登录' : '未登录'}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading && (
              <div className="flex items-center space-x-2 text-slate-400">
                <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                <span>正在加载...</span>
              </div>
            )}

            {!isLoggedIn && !isLoading && (
              <div className="text-center space-y-4">
                <p className="text-slate-400">请先连接您的钱包</p>
                {connectError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <p className="text-red-400 text-sm">连接错误: {connectError.message}</p>
                  </div>
                )}
                <Button
                  onClick={handleLogin}
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white"
                >
                  <Wallet className="w-4 h-4 mr-2" />
                  连接钱包
                </Button>
              </div>
            )}

            {isLoggedIn && user && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-white">用户信息</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">姓名:</span>
                        <span className="text-white">{user.name || '未设置'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">邮箱:</span>
                        <span className="text-white">{user.email || '未设置'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">登录方式:</span>
                        <span className="text-white">{user.typeOfLogin || user.verifier || 'Web3'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">用户ID:</span>
                        <span className="text-white font-mono text-xs">
                          {user.verifierId || user.sub || '未知'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h3 className="text-lg font-semibold text-white">钱包信息</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-slate-400">连接状态:</span>
                        <Badge className="bg-green-500/20 text-green-400">已连接</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">网络:</span>
                        <span className="text-white">Ethereum Mainnet</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">连接器:</span>
                        <span className="text-white">{connectorName || 'Web3Auth'}</span>
                      </div>
                      {address && (
                        <div className="flex justify-between">
                          <span className="text-slate-400">钱包地址:</span>
                          <div className="flex items-center space-x-2">
                            <span className="text-white font-mono text-xs">
                              {formatAddress(address)}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2 text-xs"
                              onClick={() => copyToClipboard(address)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {disconnectError && (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                    <p className="text-red-400 text-sm">断开连接错误: {disconnectError.message}</p>
                  </div>
                )}

                <div className="flex space-x-2">
                  <Button
                    onClick={handleLogout}
                    variant="outline"
                    className="border-red-500/20 text-red-400 hover:bg-red-500/10"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    退出登录
                  </Button>
                  <Button
                    onClick={() => getUserInfo()}
                    variant="outline"
                    className="border-blue-500/20 text-blue-400 hover:bg-blue-500/10"
                  >
                    <User className="w-4 h-4 mr-2" />
                    刷新用户信息
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* 原始数据 */}
        {isLoggedIn && user && (
          <Card className="bg-white/5 backdrop-blur-lg border-white/20">
            <CardHeader>
              <CardTitle className="text-white">原始用户数据</CardTitle>
            </CardHeader>
            <CardContent>
              <pre className="bg-slate-800/50 p-4 rounded-lg text-sm text-slate-300 overflow-auto">
                {JSON.stringify(user, null, 2)}
              </pre>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
