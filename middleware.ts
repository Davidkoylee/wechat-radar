import { NextRequest, NextResponse } from 'next/server';

const LOCALHOST = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

export function middleware(req: NextRequest) {
  const host = req.headers.get('host') ?? '';

  // Block requests from any non-localhost host (prevents LAN access)
  if (!LOCALHOST.test(host)) {
    return new NextResponse('Forbidden: local access only', { status: 403 });
  }

  // Block cross-site POST/PUT/PATCH/DELETE (CSRF defense)
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const fetchSite = req.headers.get('sec-fetch-site');
    if (fetchSite === 'cross-site') {
      return new NextResponse('Forbidden: cross-site request', { status: 403 });
    }
    const origin = req.headers.get('origin');
    if (origin) {
      try {
        if (!LOCALHOST.test(new URL(origin).host)) {
          return new NextResponse('Forbidden: cross-origin request', { status: 403 });
        }
      } catch {
        return new NextResponse('Forbidden: invalid origin', { status: 403 });
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
