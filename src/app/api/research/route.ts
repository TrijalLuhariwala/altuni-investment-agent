import { NextRequest } from 'next/server';
import { runResearchAgent, ResearchStep } from '@/lib/agent';

export const runtime = 'nodejs'; // Use Node.js runtime

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyName, config } = body;

    if (!companyName) {
      return new Response(JSON.stringify({ error: 'companyName is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      async start(controller) {
        const sendStep = (step: ResearchStep) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'step', data: step })}\n\n`));
        };

        try {
          // Execute agent and send live updates
          const report = await runResearchAgent(companyName, config || {}, sendStep);
          
          // Send final report
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'report', data: report })}\n\n`));
        } catch (error: any) {
          console.error("Agent execution error:", error);
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: 'error',
                data: error.message || 'An error occurred during research execution.'
              })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error("API route error:", error);
    return new Response(JSON.stringify({ error: error.message || 'Invalid request' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
