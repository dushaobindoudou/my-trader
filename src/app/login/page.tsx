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
  Send,
  FileText,
  Activity,
  Target,
  Telescope,
  Plus,
  ChevronRight,
} from 'lucide-react';
import { authConfig } from '@/config/auth';
import { BackgroundPaths } from './background';
import Image from 'next/image';
import logo from '@/assets/icon.svg';
import logoDark from '@/assets/icon-dark.svg';
import { useTheme } from '@/contexts/theme-provider';

// 吸顶 Header 组件
const StickyHeader = ({ onLogin, isLoading, isLoggingIn }: { 
  onLogin: () => void; 
  isLoading: boolean; 
  isLoggingIn: boolean; 
}) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const { resolvedTheme } = useTheme();

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
              <Image 
                src={resolvedTheme !== 'dark' ? logoDark : logo} 
                alt="AIphaTrader" 
                width={32} 
                height={32} 
              />
            </div>
            <div>
              <h1 className="text-xl font-bold">{authConfig.app.name}</h1>
              <p className="text-xs text-muted-foreground">AI × Web3 投资平台</p>
            </div>
          </div>

          {/* 登录按钮 */}
          <Button 
            onClick={onLogin}
            disabled={isLoading || isLoggingIn}
            size="sm"
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
  return (
    <div className='absolute inset-0'>
      <BackgroundPaths />
    </div>
  );
};

// 主内容组件
const MainContent = ({ onLogin, isLoading, isLoggingIn }: { 
  onLogin: () => void; 
  isLoading: boolean; 
  isLoggingIn: boolean; 
}) => {
  // 工作机制三步流程
  const workflowSteps = [
    {
      step: '1',
      icon: <FileText className="w-6 h-6" />,
      title: '输入你的兴趣和洞察',
      description: '上传、描述或连接你的研究、策略或偏好。AI 将基于你的输入生成投资假设与执行框架。',
      color: 'text-blue-500'
    },
    {
      step: '2',
      icon: <Activity className="w-6 h-6" />,
      title: 'AI 自动建模与执行',
      description: 'AI 在链上生成、回测并执行策略。所有过程公开可审计，数据与逻辑透明可追溯。',
      color: 'text-purple-500'
    },
    {
      step: '3',
      icon: <Target className="w-6 h-6" />,
      title: '获得你的 Alpha 回报',
      description: '你可以实时追踪结果、分享策略、获得收益。每一次洞察，都是价值的创造。',
      color: 'text-green-500'
    }
  ];

  // 平台亮点
  const features = [
    {
      icon: <Telescope className="w-5 h-5" />,
      title: '兴趣驱动的 AI 策略生成',
      description: '用你的领域知识，引导 AI 找到新的市场机会。',
      color: 'text-blue-500'
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: '链上验证与可追溯回报',
      description: '所有策略的执行、收益与风险数据链上可查。',
      color: 'text-green-500'
    },
    {
      icon: <Globe className="w-5 h-5" />,
      title: '开放的 Alpha 生态',
      description: '共享策略、收益与模型，让更多人参与智能协作。',
      color: 'text-purple-500'
    },
    {
      icon: <Plus className="w-5 h-5" />,
      title: '去中心化的风控系统',
      description: '风险建模与仓位管理由 AI 自动执行，确保安全性。',
      color: 'text-orange-500'
    }
  ];

  return (
    <div className="relative">
      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-4 pt-20">
        <div className="text-center max-w-4xl mx-auto">
          <div className="space-y-6">
            <div className="space-y-4">
              {/* 主标题 */}
              <h1 className="text-4xl md:text-5xl font-bold leading-tight">
                <span className="bg-gradient-to-r from-primary via-primary/90 to-primary/70 bg-clip-text text-transparent">
                  用你的兴趣，
                </span>
                <br />
                <span className="text-foreground">与 AI 一起创造 Alpha</span>
              </h1>
              
              {/* 副标题 */}
              <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                AI × Web3 平台，让个人知识转化为可验证的超额收益。
              </p>

              {/* 短句标语 */}
              <div className="inline-flex items-center justify-center px-5 py-2 rounded-full bg-primary/10 border border-primary/20">
                <span className="text-sm font-semibold text-foreground">
                  兴趣 × AI × Web3 = Alpha
                </span>
              </div>
            </div>

            {/* CTA 按钮组 */}
            <div className="flex flex-wrap justify-center gap-3 pt-4">
              <Button 
                onClick={onLogin}
                disabled={isLoading || isLoggingIn}
                size="lg"
                className="h-10 px-6"
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
              <Button 
                variant="outline"
                size="lg"
                className="h-10 px-6"
              >
                了解更多
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* 核心理念 Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="text-center space-y-4">
            <h2 className="text-2xl md:text-3xl font-bold">核心理念</h2>
            <div className="space-y-3 text-sm md:text-base text-muted-foreground leading-relaxed">
              <p>我们相信，<strong className="text-foreground">Alpha 不应只属于少数人</strong>。</p>
              <p>每个人都拥有独特的洞察力。</p>
              <p>当这些洞察与 AI 的智能算力结合，价值就能被放大、量化，并在链上被验证。</p>
            </div>
            <div className="pt-4 border-t border-border/50">
              <p className="text-base md:text-lg font-semibold text-primary italic">
                让智能与兴趣，共同驱动新的财富分配方式。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 工作机制 Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">工作机制</h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
              简单三步，让你的洞察力转化为可验证的 Alpha 回报
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {workflowSteps.map((step, index) => (
              <Card 
                key={index}
                className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50 relative"
              >
                <CardContent className="p-6 relative">
                  {/* 步骤编号 */}
                  <div className="absolute top-3 right-3 text-5xl font-bold text-muted-foreground/30">
                    {step.step}
                  </div>
                  
                  {/* 图标 */}
                  <div className={`w-12 h-12 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${step.color}`}>
                    {step.icon}
                  </div>
                  
                  {/* 标题和描述 */}
                  <h3 className="text-base font-semibold mb-2 text-center">{step.title}</h3>
                  <p className="text-xs text-muted-foreground text-center leading-relaxed">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 平台亮点 Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">平台亮点</h2>
            <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
              我们提供最先进的 AI × Web3 解决方案，让您的知识产生真实回报
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card 
                key={index} 
                className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50"
              >
                <CardContent className="p-5 text-center">
                  <div className={`w-12 h-12 mx-auto mb-3 rounded-full bg-muted/50 flex items-center justify-center group-hover:scale-110 transition-transform duration-300 ${feature.color}`}>
                    {feature.icon}
                  </div>
                  <h3 className="text-sm font-semibold mb-2">{feature.title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 mb-20">
        <div className="container mx-auto text-center max-w-2xl">
          <Card className="border-primary/20">
            <CardContent className="p-8">
              <h2 className="text-xl md:text-2xl font-bold mb-3">准备开始你的 Web3 之旅？</h2>
              <p className="text-sm md:text-base text-muted-foreground mb-6">
                立即连接你的钱包，体验下一代金融交易平台
              </p>
              <Button 
                onClick={onLogin}
                disabled={isLoading || isLoggingIn}
                size="lg"
                className="h-10 px-6"
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
    <div className="min-h-screen relative">
      {/* 背景层 */}
      <div className='fixed inset-0 z-0'>
        <AnimatedBackground />
      </div>
      
      {/* 毛玻璃遮罩层 - 遮住背景动画 */}
      <div className='fixed inset-0 z-[5] backdrop-blur-sm bg-background/40 pointer-events-none'></div>
      
      {/* 内容层 */}
      <div className='relative z-10'>
        <StickyHeader 
          onLogin={handleLogin}
          isLoading={isLoading}
          isLoggingIn={isLoggingIn}
        />
        <MainContent 
          onLogin={handleLogin}
          isLoading={isLoading}
          isLoggingIn={isLoggingIn}
        />
        <Footer />
      </div>
    </div>
  );
};

export default LoginPage;
