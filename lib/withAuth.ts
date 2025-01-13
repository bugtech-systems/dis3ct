// lib/withAuth.ts
import { NextRequest, NextResponse } from 'next/server';
import { authMiddleware } from '@/middleware/authMiddleware';

export function withAuth(handler: (req: NextRequest, res: NextResponse) => Promise<NextResponse>) {
  return async (req: NextRequest, res: NextResponse) => {
    const authResult = await authMiddleware(req);
    if (authResult.status !== 200) {
      return authResult;
    }
    return handler(req, res);
  };
}
