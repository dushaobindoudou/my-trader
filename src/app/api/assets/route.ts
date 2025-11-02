import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { DEFAULT_ASSETS } from '@/config/assets';
import alchemy, { getEthBalance, erc20BalanceOf, erc20Decimals } from '@/services/alchemy';

type ImportAssetItem = {
  chainId: number;
  // 任选其一：symbol（默认资产）或 contractAddress（自定义 ERC20）
  symbol?: string;
  contractAddress?: string;
};

type ImportBody = {
  walletAddress: string;
  assets: ImportAssetItem[];
};

async function seedDefaults() {
  const supabase = createAdminClient();
  
  for (const a of DEFAULT_ASSETS) {
    // 检查资产是否已存在
    let query = supabase
      .from('assets')
      .select('id')
      .eq('chain_id', a.chainId);
    
    if (a.assetType === 'NATIVE') {
      query = query.is('contract_address', null);
    } else {
      query = query.eq('contract_address', a.contractAddress);
    }
    
    const { data: existing } = await query.maybeSingle();
    
    if (!existing) {
      // 创建新资产
      await supabase.from('assets').insert({
        chain_id: a.chainId,
        symbol: a.symbol,
        name: a.name,
        asset_type: a.assetType,
        contract_address: a.assetType === 'NATIVE' ? null : a.contractAddress,
        decimals: a.decimals,
        is_default: true,
      });
    }
  }
}

export async function GET() {
  const supabase = createAdminClient();
  await seedDefaults();
  
  const { data: assets, error } = await supabase
    .from('assets')
    .select('*')
    .order('symbol', { ascending: true });
  
  if (error) {
    return NextResponse.json(
      { error: '获取资产列表失败', detail: error.message },
      { status: 500 }
    );
  }
  
  return NextResponse.json({ assets });
}

function toDecimalString(raw: bigint, decimals: number): string {
  const s = raw.toString();
  if (decimals === 0) return s;
  const pad = decimals - Math.max(0, s.length - decimals);
  const head = pad > 0 ? '0'.repeat(pad) + s : s;
  const idx = head.length - decimals;
  const int = head.slice(0, idx) || '0';
  let frac = head.slice(idx);
  // 去除尾随 0
  frac = frac.replace(/0+$/g, '');
  return frac.length ? `${int}.${frac}` : int;
}

export async function POST(req: NextRequest) {
  let body: ImportBody;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const wallet = body.walletAddress?.toLowerCase();
  if (!wallet) {
    return NextResponse.json({ error: 'walletAddress required' }, { status: 400 });
  }
  if (!Array.isArray(body.assets) || body.assets.length === 0) {
    return NextResponse.json({ error: 'assets required' }, { status: 400 });
  }

  const supabase = createAdminClient();
  await seedDefaults();

  const results: any[] = [];
  for (const item of body.assets) {
    const { chainId, symbol, contractAddress } = item;
    if (!chainId) continue;

    // 1) 解析/准备 Asset 记录
    let query = supabase
      .from('assets')
      .select('*')
      .eq('chain_id', chainId);
    
    if (contractAddress) {
      query = query.eq('contract_address', contractAddress);
    } else if (symbol) {
      query = query.eq('symbol', symbol);
    }
    
    const { data: assets } = await query;
    let asset = assets?.[0];

    // 如果是自定义 ERC20，但尚未存在，查询 decimals 并创建
    if (!asset && contractAddress) {
      let decimals = 18;
      try {
        decimals = await erc20Decimals(contractAddress);
      } catch {}
      
      const { data: newAsset, error } = await supabase
        .from('assets')
        .insert({
          chain_id: chainId,
          symbol: symbol || 'TOKEN',
          name: symbol || 'Token',
          asset_type: 'ERC20',
          contract_address: contractAddress,
          decimals,
          is_default: false,
        })
        .select()
        .single();
      
      if (!error && newAsset) {
        asset = newAsset;
      }
    }

    if (!asset) continue;

    // 2) 记录 ImportedAsset（使用 upsert 或者先检查后插入）
    const { data: existingImported } = await supabase
      .from('imported_assets')
      .select('id')
      .eq('wallet_address', wallet)
      .eq('asset_id', asset.id)
      .maybeSingle();
    
    if (!existingImported) {
      await supabase.from('imported_assets').insert({
        wallet_address: wallet,
        asset_id: asset.id,
      });
    }

    // 3) 读取余额并做快照
    let raw: bigint = 0n;
    let blockNumber: bigint = 0n;
    try {
      const assetType = asset.asset_type;
      const contractAddr = asset.contract_address;
      
      if (assetType === 'NATIVE') {
        raw = await getEthBalance(wallet);
      } else if (contractAddr) {
        raw = await erc20BalanceOf(contractAddr, wallet);
      }
      const bnHex = await alchemy.rpcCall<string>('eth_blockNumber', []);
      blockNumber = BigInt(bnHex);
    } catch (e) {
      // 忽略读取失败，继续下一个
    }

    const balanceStr = toDecimalString(raw, asset.decimals);

    const { data: snapshot, error: snapshotError } = await supabase
      .from('asset_snapshots')
      .insert({
        wallet_address: wallet,
        asset_id: asset.id,
        block_number: blockNumber.toString(),
        balance: balanceStr,
        balance_raw: raw.toString(),
      })
      .select()
      .single();

    if (!snapshotError && snapshot) {
      results.push({ asset, snapshot });
    }
  }

  return NextResponse.json({ ok: true, results });
}


