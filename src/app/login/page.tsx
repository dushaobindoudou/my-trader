'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useWeb3Auth } from '@/contexts/web3auth-context';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Wallet, 
  Shield, 
  Zap, 
  TrendingUp, 
  Globe,
  Github,
  Twitter,
  Bot,
  Send
} from 'lucide-react';
import { authConfig } from '@/config/auth';
import { BackgroundPaths } from './background';

// 吸顶 Header 组件
const StickyHeader = ({ onLogin, isLoading, isLoggingIn }: { 
  onLogin: () => void; 
  isLoading: boolean; 
  isLoggingIn: boolean; 
}) => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'backdrop-blur-md bg-background/80 border-b border-border/50 shadow-sm' 
          : 'bg-transparent'
      }`}
    >
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
              <Wallet className="w-4 h-4 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{authConfig.app.name}</h1>
              <p className="text-xs text-muted-foreground">Web3辅助投资平台</p>
            </div>
          </div>

          {/* 登录按钮 */}
          <Button 
            onClick={onLogin}
            disabled={isLoading || isLoggingIn}
            className="relative overflow-hidden h-9 px-3"
          >
            {isLoading || isLoggingIn ? (
              <>
                <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                连接中...
              </>
            ) : (
              <>
                <Wallet className="w-4 h-4 mr-2" />
                连接钱包
              </>
            )}
          </Button>
        </div>
      </div>
    </header>
  );
};


// 粒子流动背景组件
const AnimatedBackground = () => {
  return <div className='absolute inset-0'>
      <BackgroundPaths />
    </div>;
};

// 主内容组件
const MainContent = ({ onLogin, isLoading, isLoggingIn }: { 
  onLogin: () => void; 
  isLoading: boolean; 
  isLoggingIn: boolean; 
}) => {

  const features = [
    {
      icon: <Shield className="w-6 h-6" />,
      title: '安全可靠',
      description: 'Web3原生安全，多重加密保护',
      color: 'text-blue-500'
    },
    {
      icon: <Zap className="w-6 h-6" />,
      title: '快速便捷',
      description: '一键登录，秒级响应',
      color: 'text-yellow-500'
    },
    {
      icon: <TrendingUp className="w-6 h-6" />,
      title: '专业交易',
      description: '专业金融工具，智能分析',
      color: 'text-green-500'
    },
    {
      icon: <Globe className="w-6 h-6" />,
      title: '全球覆盖',
      description: '支持全球主要交易所',
      color: 'text-purple-500'
    }
  ];

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-4">
        <div className="text-center max-w-4xl mx-auto">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent">
                开启您的
                <br />
                <span className="text-foreground">Web3金融</span>
                之旅
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                连接您的数字钱包，体验下一代金融交易平台。
                <br />
                安全、快速、专业的Web3交易体验。
              </p>
            </div>

            <div className="flex flex-wrap justify-center gap-4">
              <div className="inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold bg-secondary text-secondary-foreground">
                <Shield className="w-4 h-4 mr-2" />
                银行级安全
              </div>
              <div className="inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold bg-secondary text-secondary-foreground">
                <Zap className="w-4 h-4 mr-2" />
                极速交易
              </div>
              <div className="inline-flex items-center rounded-full border px-4 py-2 text-sm font-semibold bg-secondary text-secondary-foreground">
                <TrendingUp className="w-4 h-4 mr-2" />
                智能分析
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4">为什么选择我们</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              我们提供最先进的Web3金融解决方案，让您的投资更加智能和安全
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-2 border-border/50 opacity-80"
              >
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${feature.color}`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            <div className="space-y-2">
              <div className="text-4xl md:text-5xl font-bold text-primary">$2.5B+</div>
              <div className="text-muted-foreground">交易总额</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl md:text-5xl font-bold text-primary">50K+</div>
              <div className="text-muted-foreground">活跃用户</div>
            </div>
            <div className="space-y-2">
              <div className="text-4xl md:text-5xl font-bold text-primary">99.9%</div>
              <div className="text-muted-foreground">系统稳定性</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 mb-32">
        <div className="container mx-auto text-center">
          <Card className="max-w-2xl mx-auto border-primary/20 bg-background/90">
            <CardContent className="p-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">准备开始您的Web3之旅？</h2>
              <p className="text-xl text-muted-foreground mb-8">
                立即连接您的钱包，体验下一代金融交易平台
              </p>
              <Button 
                onClick={onLogin}
                disabled={isLoading || isLoggingIn}
                className="h-11 px-6"
              >
                {isLoading || isLoggingIn ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                    连接中...
                  </>
                ) : (
                  <>
                    <Wallet className="w-4 h-4 mr-2" />
                    连接钱包
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

// Footer 组件
const Footer = () => {
  const currentYear = new Date().getFullYear();
  
  const socialLinks = [
    {
      name: 'Twitter',
      icon: <Twitter className="w-5 h-5" />,
      href: 'https://twitter.com/mytrader',
      color: 'hover:text-blue-400'
    },
    {
      name: 'Discord',
      icon: <Bot className="w-5 h-5" />,
      href: 'https://discord.gg/mytrader',
      color: 'hover:text-indigo-400'
    },
    {
      name: 'Telegram',
      icon: <Send className="w-5 h-5" />,
      href: 'https://t.me/mytrader',
      color: 'hover:text-blue-500'
    },
    {
      name: 'GitHub',
      icon: <Github className="w-5 h-5" />,
      href: 'https://github.com/mytrader',
      color: 'hover:text-gray-400'
    }
  ];


  return (
    <footer className="bg-muted/30 border-t border-border/50">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
          {/* 左侧：版权信息 */}
          <div className="flex flex-col lg:flex-row items-start lg:items-center gap-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground whitespace-nowrap">
              <span>© {currentYear} {authConfig.app.name}</span>
              <span>•</span>
              <span>保留所有权利</span>
            </div>
            <div className="text-sm text-muted-foreground whitespace-nowrap">
              本平台仅供学习和研究使用，投资有风险，请谨慎决策
            </div>
          </div>

          {/* 右侧：社交媒体 */}
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground whitespace-nowrap">关注我们：</span>
            <div className="flex space-x-3">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center justify-center w-9 h-9 rounded-lg bg-muted hover:bg-muted/80 transition-all duration-200 text-muted-foreground ${social.color} group hover:scale-105`}
                  aria-label={social.name}
                  title={social.name}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

const LoginPage = () => {
  const { login, isLoading, isLoggedIn } = useWeb3Auth();
  const router = useRouter();
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      router.push('/');
    }
  }, [isLoggedIn, router]);

  const handleLogin = async () => {
    try {
      setIsLoggingIn(true);
      await login();
    } catch (error) {
      console.error('Login failed:', error);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="min-h-screen">
      <StickyHeader 
        onLogin={handleLogin}
        isLoading={isLoading}
        isLoggingIn={isLoggingIn}
      />
      <div className='fixed inset-0 z-0'>
        <AnimatedBackground />
      </div>
      <div className='backdrop-blur-sm bg-background/80 border-b border-border/50 shadow-sm'>
        <div className="relative">
          <MainContent 
            onLogin={handleLogin}
            isLoading={isLoading}
            isLoggingIn={isLoggingIn}
          />
        </div>
        <Footer />
      </div>
    </div>
  );
};

export default LoginPage;
