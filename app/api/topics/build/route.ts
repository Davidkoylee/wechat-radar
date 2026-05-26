import { NextRequest } from 'next/server';
import { buildTopicsForDate } from '@/lib/topics';

export const dynamic = 'force-dynamic';
export const maxDuration = 600;

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { date?: string };
  const date = body.date ?? new Date().toISOString().slice(0, 10);

  if (!DATE_RE.test(date)) {
    return new Response(JSON.stringify({ error: 'invalid date, expected YYYY-MM-DD' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const stream = new ReadableStream({
    async start(controller) {
      const enc = new TextEncoder();
      const send = (obj: unknown) =>
        controller.enqueue(enc.encode(`data: ${JSON.stringify(obj)}\n\n`));

      send({ type: 'start', date });
      try {
        await buildTopicsForDate(date, (p) => send(p));
      } catch (e) {
        send({ type: 'error', error: e instanceof Error ? e.message : 'unknown' });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
