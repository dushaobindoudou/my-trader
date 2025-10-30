import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const alchemyUrl = process.env.ALCHEMY_HTTP_URL;

  if (!alchemyUrl) {
    return NextResponse.json(
      { error: 'Alchemy endpoint not configured' },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON body' },
      { status: 400 }
    );
  }

  try {
    const resp = await axios.post(alchemyUrl, body, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 20000,
      // Do not forward cookies or client headers to avoid leaking anything
      validateStatus: () => true,
    });

    // Pass through JSON-RPC response as-is
    return NextResponse.json(resp.data, { status: resp.status || 200 });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: 'Failed to reach Alchemy',
        detail: err?.response?.data ?? err?.message ?? 'unknown error',
      },
      { status: 502 }
    );
  }
}


