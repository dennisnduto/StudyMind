import { NextResponse } from "next/server";
import { demoDocuments } from "@/lib/demo-data";

export async function POST(req: Request) {
  const body = await req.json();
  const doc = demoDocuments.find((item) => item.id === body.documentId) || demoDocuments[0];

  return NextResponse.json({
    success: true,
    chatSessionId: body.chatSessionId || "demo-chat-session",
    message: {
      id: crypto.randomUUID(),
      role: "assistant",
      content: `Demo answer for "${doc.title}": ${doc.summary}`,
      createdAt: new Date().toISOString(),
    },
  });
}
