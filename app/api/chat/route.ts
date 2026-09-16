import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { verifySession } from "@/lib/auth";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req: NextRequest) {
  const token = req.cookies.get("claude_session")?.value;
  const session = token ? await verifySession(token) : null;
  if (!session) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });

  const { messages } = await req.json();
  if (!messages || !Array.isArray(messages)) {
    return NextResponse.json({ error: "Mensagens inválidas" }, { status: 400 });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = await client.messages.stream({
          model: "claude-opus-4-5",
          max_tokens: 8096,
          messages,
        });
        for await (const chunk of anthropicStream) {
          if (chunk.type === "content_block_delta" && chunk.delta.type === "text_delta") {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ text: chunk.delta.text })}

`));
          }
        }
        controller.enqueue(encoder.encode("data: [DONE]

"));
        controller.close();
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Erro desconhecido";
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: msg })}

`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
