'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useWeb3Auth } from '@/contexts/web3auth-context';
import { authConfig } from '@/config/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, Loader2 } from 'lucide-react';

interface AuthGuardProps {
  children: React.ReactNode;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({ children }) => {
  const { isLoggedIn, isLoading, login } = useWeb3Auth();
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);
  const [countdown, setCountdown] = useState(10);
  const [isCountdownActive, setIsCountdownActive] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      // 如果是登录页面，不需要检查认证
      if (pathname === '/login') {
        setIsChecking(false);
        return;
      }

      // 检查是否为受保护的路由
      const isProtectedRoute = authConfig.routes.protected.some(route => 
        pathname.startsWith(route)
      );

      if (isProtectedRoute && !isLoggedIn && !isLoading) {
        // 重定向到登录页面
        router.push('/login');
        return;
      }

      setIsChecking(false);
    };

    checkAuth();
  }, [isLoggedIn, isLoading, pathname, router]);

  // 倒计时逻辑
  useEffect(() => {
    if (isCountdownActive && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isCountdownActive && countdown === 0) {
      // 倒计时结束，自动跳转到登录页面
      router.push('/login');
    }
  }, [isCountdownActive, countdown, router]);

  // 启动倒计时
  const startCountdown = () => {
    setCountdown(10);
    setIsCountdownActive(true);
  };


  if (pathname === '/login') {
    return <>{children}</>;
  } else {
    // 显示加载状态
    if (isLoading || isChecking) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Loader2 className="w-8 h-8 text-primary-foreground animate-spin" />
              </div>
              <h2 className="text-xl font-semibold mb-2">正在加载</h2>
              <p className="text-muted-foreground">正在初始化Web3认证...</p>
            </CardContent>
          </Card>
        </div>
      );
    }
    // 如果未登录且不是登录页面，显示登录提示
    if (!isLoggedIn && pathname !== '/login') {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardContent className="p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center mx-auto">
                <Wallet className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <h2 className="text-xl font-semibold mb-2">需要登录</h2>
                <p className="text-muted-foreground mb-4">请先连接您的钱包以访问此页面</p>
                <Button
                  onClick={() => router.push('/login')}
                  className="w-full"
                >
                  前往登录
                </Button>
                {isCountdownActive && (
                  <p className="text-sm text-muted-foreground mt-2">
                    {countdown} 秒后自动跳转到登录页面
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  return <>{children}</>;
};
