'use client';

import { useState, useEffect } from 'react';
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout';
import { Main } from '@/components/layout/main';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ModelIcon } from '@/components/llm-model-icon';
import { DEFAULT_LLM_CONFIGS, type LlmConfig } from '@/config/llm';
import http from '@/lib/http';
import { toast } from 'sonner';
import { Plus, Edit2, Trash2, Eye, EyeOff } from 'lucide-react';

export default function SettingsPage() {
  const [configs, setConfigs] = useState<LlmConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingConfig, setEditingConfig] = useState<LlmConfig | null>(null);
  const [deleteConfig, setDeleteConfig] = useState<LlmConfig | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showApiKey, setShowApiKey] = useState<Record<string, boolean>>({});
  const [showFormApiKey, setShowFormApiKey] = useState(false);
  const [showEditFormApiKey, setShowEditFormApiKey] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string>('');

  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    apiKey: '',
    apiUrl: '',
    isActive: true,
    templateName: '',
  });

  // 加载配置列表
  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      const { data } = await http.get('/api/llm-configs');
      setConfigs(data.configs || []);
    } catch (error: any) {
      toast.error('加载配置失败: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  // 处理模型厂商选择变化
  const handleProviderChange = (provider: string) => {
    setSelectedProvider(provider);
    if (provider === 'custom') {
      // 自定义模式，清空模板相关字段
      setFormData({
        ...formData,
        name: '',
        apiUrl: '',
        templateName: '',
      });
    } else {
      // 选择预设模板
      const template = DEFAULT_LLM_CONFIGS.find((t) => t.name === provider);
      if (template) {
        setFormData({
          ...formData,
          name: template.name,
          apiUrl: template.apiUrl,
          templateName: template.name,
        });
      }
    }
  };

  // 打开添加对话框
  const handleAddClick = () => {
    setFormData({
      name: '',
      apiKey: '',
      apiUrl: '',
      isActive: true,
      templateName: '',
    });
    setSelectedProvider('');
    setShowFormApiKey(false);
    setEditingConfig(null);
    setShowAddDialog(true);
  };

  // 打开编辑对话框
  const handleEditClick = (config: LlmConfig) => {
    setFormData({
      name: config.name,
      apiKey: config.apiKey,
      apiUrl: config.apiUrl,
      isActive: config.isActive,
      templateName: '',
    });
    setShowEditFormApiKey(false);
    setEditingConfig(config);
    setShowEditDialog(true);
  };

  // 保存配置
  const handleSave = async () => {
    if (!formData.name || !formData.apiKey || !formData.apiUrl) {
      toast.error('请填写所有必填项');
      return;
    }

    try {
      if (editingConfig) {
        // 更新配置
        await http.put(`/api/llm-configs/${editingConfig.id}`, formData);
        toast.success('配置更新成功');
      } else {
        // 创建配置
        await http.post('/api/llm-configs', formData);
        toast.success('配置创建成功');
      }
      setShowAddDialog(false);
      setShowEditDialog(false);
      setSelectedProvider('');
      setShowFormApiKey(false);
      setShowEditFormApiKey(false);
      setFormData({
        name: '',
        apiKey: '',
        apiUrl: '',
        isActive: true,
        templateName: '',
      });
      loadConfigs();
    } catch (error: any) {
      toast.error('保存失败: ' + (error.response?.data?.error || error.message));
    }
  };

  // 删除配置
  const handleDelete = async () => {
    if (!deleteConfig) return;

    try {
      await http.delete(`/api/llm-configs/${deleteConfig.id}`);
      toast.success('配置删除成功');
      setShowDeleteDialog(false);
      setDeleteConfig(null);
      loadConfigs();
    } catch (error: any) {
      toast.error('删除失败: ' + (error.response?.data?.error || error.message));
    }
  };

  // 切换 API Key 显示/隐藏
  const toggleApiKeyVisibility = (id: string) => {
    if (!id) return;
    setShowApiKey((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // 切换配置启用状态
  const handleToggleActive = async (config: LlmConfig) => {
    try {
      const newIsActive = !config.isActive;
      // 只发送 isActive 字段，其他字段保持不变
      await http.put(`/api/llm-configs/${config.id}`, {
        isActive: newIsActive,
      });
      
      // 直接更新当前项的状态，避免刷新整个列表
      setConfigs((prevConfigs) =>
        prevConfigs.map((item) =>
          item.id === config.id
            ? { ...item, isActive: newIsActive }
            : item
        )
      );
      
      toast.success(newIsActive ? '配置已启用' : '配置已禁用');
    } catch (error: any) {
      toast.error('操作失败: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <AuthenticatedLayout>
      <Main>
        <div className="mb-6">
          <h1 className="text-2xl font-bold tracking-tight">设置</h1>
          <p className="text-muted-foreground">配置LLM模型和Agent</p>
        </div>
        <div className="grid gap-6">
          {/* LLM模型配置卡片 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>LLM模型配置</CardTitle>
                  <CardDescription>配置AI模型API密钥和请求地址</CardDescription>
                </div>
                <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
                  <DialogTrigger asChild>
                    <Button onClick={handleAddClick}>
                      <Plus className="mr-2 h-4 w-4" />
                      添加配置
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>添加模型配置</DialogTitle>
                      <DialogDescription>
                        填写模型名称、API密钥和请求地址
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div>
                        <Label htmlFor="provider">模型厂商</Label>
                        <Select value={selectedProvider} onValueChange={handleProviderChange}>
                          <SelectTrigger id="provider">
                            <SelectValue placeholder="选择模型厂商或自定义" />
                          </SelectTrigger>
                          <SelectContent>
                            {DEFAULT_LLM_CONFIGS.map((template) => {
                              const exists = configs.some((c) => c.name === template.name);
                              return (
                                <SelectItem
                                  key={template.name}
                                  value={template.name}
                                  disabled={exists}
                                  className={exists ? 'opacity-50' : ''}
                                >
                                  <div className="flex items-center gap-2">
                                    <ModelIcon name={template.name} size={16} />
                                    <span>{template.name}</span>
                                    {exists && <span className="text-xs text-muted-foreground ml-auto">已存在</span>}
                                  </div>
                                </SelectItem>
                              );
                            })}
                            <SelectItem value="custom">自定义</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="name">模型名称</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder={selectedProvider === 'custom' ? '例如: OpenAI GPT-4' : '将根据选择的厂商自动填充'}
                          disabled={!!selectedProvider && selectedProvider !== 'custom'}
                        />
                      </div>
                      <div>
                        <Label htmlFor="apiKey">API Key</Label>
                        <div className="relative">
                          <Input
                            id="apiKey"
                            type={showFormApiKey ? 'text' : 'password'}
                            value={formData.apiKey}
                            onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                            placeholder={
                              selectedProvider && selectedProvider !== 'custom'
                                ? DEFAULT_LLM_CONFIGS.find((t) => t.name === selectedProvider)?.placeholder.apiKey || 'sk-...'
                                : 'sk-...'
                            }
                            className="pr-10"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                            onClick={() => setShowFormApiKey(!showFormApiKey)}
                          >
                            {showFormApiKey ? (
                              <EyeOff className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            )}
                          </Button>
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="apiUrl">API Base URL</Label>
                        <Input
                          id="apiUrl"
                          value={formData.apiUrl}
                          onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
                          placeholder={
                            selectedProvider && selectedProvider !== 'custom'
                              ? DEFAULT_LLM_CONFIGS.find((t) => t.name === selectedProvider)?.placeholder.apiUrl || 'https://api.openai.com/v1'
                              : 'https://api.openai.com/v1'
                          }
                          disabled={!!selectedProvider && selectedProvider !== 'custom'}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <Label htmlFor="isActive">启用配置</Label>
                        <Switch
                          id="isActive"
                          checked={formData.isActive}
                          onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                        取消
                      </Button>
                      <Button onClick={handleSave}>保存</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {/* 配置列表 */}
              {loading ? (
                <div className="text-center py-8 text-muted-foreground">加载中...</div>
              ) : configs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  暂无配置，点击上方按钮添加配置
                </div>
              ) : (
                <div className="space-y-3">
                  {configs.map((config) => (
                    <div
                      key={config.id}
                      className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                    >
                      <ModelIcon name={config.name} size={24} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="font-medium truncate">{config.name}</p>
                          {config.isActive ? (
                            <span className="text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-0.5 rounded">
                              启用
                            </span>
                          ) : (
                            <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded">
                              禁用
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <p className="text-sm text-muted-foreground truncate">
                            API Key: {config.id && showApiKey[config.id] ? config.apiKey : '•'.repeat(20)}
                          </p>
                          {config.id && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 px-2"
                              onClick={() => toggleApiKeyVisibility(config.id)}
                            >
                              {showApiKey[config.id] ? (
                                <EyeOff className="h-3 w-3" />
                              ) : (
                                <Eye className="h-3 w-3" />
                              )}
                            </Button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {config.apiUrl}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={config.isActive}
                          onCheckedChange={() => handleToggleActive(config)}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditClick(config)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setDeleteConfig(config);
                            setShowDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Agent配置卡片 */}
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

        {/* 编辑对话框 */}
        <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>编辑模型配置</DialogTitle>
              <DialogDescription>
                修改模型配置信息
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <Label htmlFor="edit-name">模型名称</Label>
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例如: OpenAI GPT-4"
                />
              </div>
              <div>
                <Label htmlFor="edit-apiKey">API Key</Label>
                <div className="relative">
                  <Input
                    id="edit-apiKey"
                    type={showEditFormApiKey ? 'text' : 'password'}
                    value={formData.apiKey}
                    onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                    placeholder="sk-..."
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowEditFormApiKey(!showEditFormApiKey)}
                  >
                    {showEditFormApiKey ? (
                      <EyeOff className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <Eye className="h-4 w-4 text-muted-foreground" />
                    )}
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="edit-apiUrl">API Base URL</Label>
                <Input
                  id="edit-apiUrl"
                  value={formData.apiUrl}
                  onChange={(e) => setFormData({ ...formData, apiUrl: e.target.value })}
                  placeholder="https://api.openai.com/v1"
                />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="edit-isActive">启用配置</Label>
                <Switch
                  id="edit-isActive"
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowEditDialog(false)}>
                取消
              </Button>
              <Button onClick={handleSave}>保存</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* 删除确认对话框 */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认删除</AlertDialogTitle>
              <AlertDialogDescription>
                您确定要删除配置 "{deleteConfig?.name}" 吗？此操作无法撤销。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => setDeleteConfig(null)}>
                取消
              </AlertDialogCancel>
              <AlertDialogAction onClick={handleDelete}>
                删除
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Main>
    </AuthenticatedLayout>
  );
}
