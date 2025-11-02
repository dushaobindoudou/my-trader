// 默认 LLM 配置模板
export const DEFAULT_LLM_CONFIGS = [
  {
    name: 'OpenAI',
    apiUrl: 'https://api.openai.com/v1',
    icon: 'openai',
    placeholder: {
      apiKey: 'sk-...',
      apiUrl: 'https://api.openai.com/v1',
    },
  },
  {
    name: 'Claude (Anthropic)',
    apiUrl: 'https://api.anthropic.com/v1',
    icon: 'claude',
    placeholder: {
      apiKey: 'sk-ant-...',
      apiUrl: 'https://api.anthropic.com/v1',
    },
  },
  {
    name: 'DeepSeek',
    apiUrl: 'https://api.deepseek.com/v1',
    icon: 'deepseek',
    placeholder: {
      apiKey: 'sk-...',
      apiUrl: 'https://api.deepseek.com/v1',
    },
  },
  {
    name: 'Qwen (通义千问)',
    apiUrl: 'https://dashscope.aliyuncs.com/api/v1',
    icon: 'qwen',
    placeholder: {
      apiKey: 'sk-...',
      apiUrl: 'https://dashscope.aliyuncs.com/api/v1',
    },
  },
  {
    name: 'Doubao (豆包)',
    apiUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    icon: 'doubao',
    placeholder: {
      apiKey: 'your-api-key',
      apiUrl: 'https://ark.cn-beijing.volces.com/api/v3',
    },
  },
] as const;

export type LlmConfigTemplate = typeof DEFAULT_LLM_CONFIGS[number];

export type LlmConfig = {
  id: string;
  name: string;
  apiKey: string;
  apiUrl: string;
  isActive: boolean;
  createdAt: string;
};

