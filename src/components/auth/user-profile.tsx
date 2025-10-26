'use client';

import React, { useState } from 'react';
import { useWeb3Auth } from '@/contexts/web3auth-context';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  User, 
  LogOut, 
  Settings, 
  Wallet,
  Copy,
  ExternalLink,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';

export const UserProfile: React.FC = () => {
  const { user, logout, address, getBalance } = useWeb3Auth();
  const [balance, setBalance] = useState<string>('0');

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('已成功退出登录');
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

  const getUserDisplayName = () => {
    if (!user) return '未知用户';
    return user.name || user.email || user.verifierId || 'Web3用户';
  };

  const getUserAvatar = () => {
    if (!user) return '';
    return user.picture || user.profileImage || '';
  };

  const getLoginMethod = () => {
    if (!user) return '未知';
    return user.typeOfLogin || user.verifier || 'Web3';
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10">
            <AvatarImage src={getUserAvatar()} alt={getUserDisplayName()} />
            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              {getUserDisplayName().charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80" align="end" forceMount>
        <DropdownMenuLabel className="font-normal">
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium leading-none">{getUserDisplayName()}</p>
            <p className="text-xs leading-none text-muted-foreground">
              {user?.email || 'Web3用户'}
            </p>
            <div className="flex items-center space-x-2 mt-2">
              <Badge variant="secondary" className="text-xs">
                <Shield className="w-3 h-3 mr-1" />
                {getLoginMethod()}
              </Badge>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {/* 钱包信息 */}
        {address && (
          <>
            <div className="px-2 py-1.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">钱包地址</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-xs"
                  onClick={() => copyToClipboard(address)}
                >
                  <Copy className="w-3 h-3 mr-1" />
                  {formatAddress(address)}
                </Button>
              </div>
              {balance !== '0' && (
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs text-muted-foreground">余额</span>
                  <span className="text-xs font-medium">{balance} ETH</span>
                </div>
              )}
            </div>
            <DropdownMenuSeparator />
          </>
        )}

        <DropdownMenuItem>
          <User className="mr-2 h-4 w-4" />
          <span>个人资料</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Wallet className="mr-2 h-4 w-4" />
          <span>钱包管理</span>
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Settings className="mr-2 h-4 w-4" />
          <span>设置</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleLogout} className="text-red-600">
          <LogOut className="mr-2 h-4 w-4" />
          <span>退出登录</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const UserProfileCard: React.FC = () => {
  const { user, address, getBalance } = useWeb3Auth();
  const [balance, setBalance] = useState<string>('0');

  const getUserDisplayName = () => {
    if (!user) return '未知用户';
    return user.name || user.email || user.verifierId || 'Web3用户';
  };

  const getUserAvatar = () => {
    if (!user) return '';
    return user.picture || user.profileImage || '';
  };

  const getLoginMethod = () => {
    if (!user) return '未知';
    return user.typeOfLogin || user.verifier || 'Web3';
  };

  return (
    <Card className="bg-white/5 backdrop-blur-lg border-white/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-white flex items-center">
          <User className="w-5 h-5 mr-2" />
          用户信息
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center space-x-3">
          <Avatar className="h-12 w-12">
            <AvatarImage src={getUserAvatar()} alt={getUserDisplayName()} />
            <AvatarFallback className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              {getUserDisplayName().charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {getUserDisplayName()}
            </p>
            <p className="text-xs text-slate-400 truncate">
              {user?.email || 'Web3用户'}
            </p>
            <Badge variant="secondary" className="mt-1 text-xs">
              <Shield className="w-3 h-3 mr-1" />
              {getLoginMethod()}
            </Badge>
          </div>
        </div>

        {address && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">钱包地址</span>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-xs text-slate-300 hover:text-white"
                onClick={() => {
                  navigator.clipboard.writeText(address);
                  toast.success('已复制到剪贴板');
                }}
              >
                <Copy className="w-3 h-3 mr-1" />
                {`${address?.slice(0, 6)}...${address?.slice(-4)}`}
              </Button>
            </div>
            {balance !== '0' && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">余额</span>
                <span className="text-xs font-medium text-white">{balance} ETH</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
