'use client';

import { cn } from '@/lib/utils';
import {
  OpenAI,
  Claude,
  Anthropic,
  DeepSeek,
  Qwen,
  Doubao,
} from '@lobehub/icons';

type ModelIconProps = {
  name: string;
  className?: string;
  size?: number;
};

// 根据模型名称返回对应的图标
export function ModelIcon({ name, className, size = 20 }: ModelIconProps) {
  const normalizedName = name.toLowerCase();
  // @lobehub/icons 的 size 可以是数字或字符串，我们传入数字即可
  const iconSize = size;

  // OpenAI 图标
  if (normalizedName.includes('openai') || normalizedName.includes('gpt')) {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <OpenAI size={iconSize} />
      </div>
    );
  }

  // Claude (Anthropic) 图标 - 优先使用 Claude，如果没有匹配则使用 Anthropic
  if (normalizedName.includes('claude')) {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <Claude size={iconSize} />
      </div>
    );
  }

  if (normalizedName.includes('anthropic')) {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <Anthropic size={iconSize} />
      </div>
    );
  }

  // DeepSeek 图标
  if (normalizedName.includes('deepseek')) {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <DeepSeek size={iconSize} />
      </div>
    );
  }

  // Qwen 图标
  if (normalizedName.includes('qwen') || normalizedName.includes('通义')) {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <Qwen size={iconSize} />
      </div>
    );
  }

  // Doubao 图标
  if (normalizedName.includes('doubao') || normalizedName.includes('豆包')) {
    return (
      <div className={cn('flex items-center justify-center', className)}>
        <Doubao size={iconSize} />
      </div>
    );
  }

  // 默认图标 - 使用灰色齿轮图标
  return (
    <div className={cn('flex items-center justify-center', className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        className="text-gray-600"
      >
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
        <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}

