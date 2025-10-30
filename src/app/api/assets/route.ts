import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
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
  for (const a of DEFAULT_ASSETS) {
    await prisma.asset.upsert({
      where: {
        // 唯一键由 [chainId, contractAddress] 组成；原生币使用 null
        // Prisma 不支持复合 where 用 null，使用自定义查询实现
        id: (
          await prisma.asset.findFirst({
            where: {
              chainId: a.chainId,
              contractAddress: a.assetType === 'NATIVE' ? null : a.contractAddress,
            },
            select: { id: true },
          })
        )?.id || '___temp___',
      },
      update: {},
      create: {
        chainId: a.chainId,
        symbol: a.symbol,
        name: a.name,
        assetType: a.assetType,
        contractAddress: a.assetType === 'NATIVE' ? null : a.contractAddress,
        decimals: a.decimals,
        isDefault: true,
      },
    }).catch(async () => {
      // 如果 upsert 因 where 不命中而失败，执行 create-if-not-exists 流程
      const exist = await prisma.asset.findFirst({
        where: {
          chainId: a.chainId,
          contractAddress: a.assetType === 'NATIVE' ? null : a.contractAddress,
        },
      });
      if (!exist) {
        await prisma.asset.create({
          data: {
            chainId: a.chainId,
            symbol: a.symbol,
            name: a.name,
            assetType: a.assetType,
            contractAddress: a.assetType === 'NATIVE' ? null : a.contractAddress,
            decimals: a.decimals,
            isDefault: true,
          },
        });
      }
    });
  }
}

export async function GET() {
  await seedDefaults();
  const assets = await prisma.asset.findMany({ orderBy: { symbol: 'asc' } });
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

  await seedDefaults();

  const results: any[] = [];
  for (const item of body.assets) {
    const { chainId, symbol, contractAddress } = item;
    if (!chainId) continue;

    // 1) 解析/准备 Asset 记录
    let asset = await prisma.asset.findFirst({
      where: {
        chainId,
        ...(contractAddress
          ? { contractAddress: contractAddress }
          : symbol
          ? { symbol }
          : {}),
      },
    });

    // 如果是自定义 ERC20，但尚未存在，查询 decimals 并创建
    if (!asset && contractAddress) {
      let decimals = 18;
      try {
        decimals = await erc20Decimals(contractAddress);
      } catch {}
      asset = await prisma.asset.create({
        data: {
          chainId,
          symbol: symbol || 'TOKEN',
          name: symbol || 'Token',
          assetType: 'ERC20',
          contractAddress,
          decimals,
          isDefault: false,
        },
      });
    }

    if (!asset) continue;

    // 2) 记录 ImportedAsset（忽略唯一冲突）
    await prisma.importedAsset.upsert({
      where: {
        walletAddress_assetId: {
          walletAddress: wallet,
          assetId: asset.id,
        },
      },
      update: {},
      create: { walletAddress: wallet, assetId: asset.id },
    }).catch(async () => {
      const existed = await prisma.importedAsset.findFirst({
        where: { walletAddress: wallet, assetId: asset!.id },
      });
      if (!existed) await prisma.importedAsset.create({ data: { walletAddress: wallet, assetId: asset!.id } });
    });

    // 3) 读取余额并做快照
    let raw: bigint = 0n;
    let blockNumber: bigint = 0n;
    try {
      if (asset.assetType === 'NATIVE') {
        raw = await getEthBalance(wallet);
      } else if (asset.contractAddress) {
        raw = await erc20BalanceOf(asset.contractAddress, wallet);
      }
      const bnHex = await alchemy.rpcCall<string>('eth_blockNumber', []);
      blockNumber = BigInt(bnHex);
    } catch (e) {
      // 忽略读取失败，继续下一个
    }

    const balanceStr = toDecimalString(raw, asset.decimals);

    const snapshot = await prisma.assetSnapshot.create({
      data: {
        walletAddress: wallet,
        assetId: asset.id,
        blockNumber,
        balance: balanceStr,
        balanceRaw: raw.toString(),
      },
    });

    results.push({ asset, snapshot });
  }

  return NextResponse.json({ ok: true, results });
}


