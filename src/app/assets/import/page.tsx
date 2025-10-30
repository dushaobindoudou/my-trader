"use client";

import { useEffect, useMemo, useState } from 'react';
import { useAccount } from 'wagmi';
import http from '@/lib/http';
import { DEFAULT_ASSETS } from '@/config/assets';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

type ApiAsset = {
  id: string;
  chainId: number;
  symbol: string;
  name: string;
  assetType: string;
  contractAddress: string | null;
  decimals: number;
};

export default function AssetImportPage() {
  const { address } = useAccount();
  const [wallet, setWallet] = useState<string>('');
  const [assets, setAssets] = useState<ApiAsset[]>([]);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [customContracts, setCustomContracts] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setWallet(address || '');
  }, [address]);

  useEffect(() => {
    // 拉取后端资产（会自动种子默认资产）
    http.get('/api/assets').then((res) => {
      const list = (res.data?.assets || []) as ApiAsset[];
      setAssets(list);
      // 仅默认的三种预选中（ETH/USDT/USDC on chainId 1）
      const preset: Record<string, boolean> = {};
      const defaults = new Set(
        DEFAULT_ASSETS.filter((a) => a.chainId === 1).map((a) => a.symbol)
      );
      for (const a of list) {
        if (a.chainId === 1 && defaults.has(a.symbol)) {
          preset[a.id] = true;
        }
      }
      setSelected(preset);
    });
  }, []);

  const selectedCount = useMemo(
    () => Object.values(selected).filter(Boolean).length,
    [selected]
  );

  const onToggle = (id: string, value: boolean | string) => {
    setSelected((s) => ({ ...s, [id]: !!value }));
  };

  const handleSubmit = async () => {
    if (!wallet) {
      toast.error('请先连接钱包或填写钱包地址');
      return;
    }
    const chosen = assets.filter((a) => selected[a.id]);
    const customList = customContracts
      .split(',')
      .map((s) => s.trim())
      .filter((s) => s);

    if (chosen.length === 0 && customList.length === 0) {
      toast.error('请选择至少一个资产或填写自定义合约地址');
      return;
    }

    const payload = {
      walletAddress: wallet,
      assets: [
        ...chosen.map((a) => ({
          chainId: a.chainId,
          symbol: a.symbol,
          contractAddress: a.contractAddress || undefined,
        })),
        ...customList.map((addr) => ({
          chainId: 1,
          contractAddress: addr,
        })),
      ],
    };

    setSubmitting(true);
    try {
      const { data } = await http.post('/api/assets', payload);
      toast.success(`导入并快照成功，共 ${data?.results?.length ?? 0} 条`);
    } catch (e: any) {
      toast.error(e?.message || '导入失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>导入资产并快照</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <div className="text-sm mb-2">钱包地址</div>
            <Input
              placeholder="0x..."
              value={wallet}
              onChange={(e) => setWallet(e.target.value)}
            />
          </div>

          <div>
            <div className="text-sm mb-2">选择默认资产（ETH/USDT/USDC）</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {assets
                .filter((a) => a.chainId === 1)
                .map((a) => (
                  <label
                    key={a.id}
                    className="flex items-center gap-2 border rounded p-3"
                  >
                    <Checkbox
                      checked={!!selected[a.id]}
                      onCheckedChange={(v) => onToggle(a.id, v)}
                    />
                    <div className="text-sm">
                      <div className="font-medium">{a.symbol}</div>
                      <div className="text-muted-foreground">
                        {a.assetType}
                        {a.contractAddress ? ` · ${a.contractAddress}` : ''}
                      </div>
                    </div>
                  </label>
                ))}
            </div>
            <div className="text-xs text-muted-foreground mt-2">
              已选择：{selectedCount}
            </div>
          </div>

          <div>
            <div className="text-sm mb-2">自定义 ERC20 合约地址（逗号分隔，可选）</div>
            <Input
              placeholder="0x..., 0x..."
              value={customContracts}
              onChange={(e) => setCustomContracts(e.target.value)}
            />
          </div>

          <div className="pt-2">
            <Button onClick={handleSubmit} disabled={submitting}>
              {submitting ? '提交中...' : '提交并创建快照'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


