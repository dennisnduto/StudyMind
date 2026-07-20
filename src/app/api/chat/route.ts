import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateChatResponse } from "@/lib/ai";
import { getUserEntitlement, premiumRequiredPayload } from "@/lib/subscription";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { streamText } from "ai";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const docId = searchParams.get("docId");

    if (!docId) {
      return NextResponse.json({ error: "docId is required" }, { status: 400 });
    }

    const document = await prisma.document.findFirst({
      where: { id: docId, userId: user.id },
      select: { id: true },
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const chatSession = await prisma.chatSession.findFirst({
      where: { userId: user.id, documentId: docId },
      include: {
        messages: { orderBy: { createdAt: "asc" } },
      },
      orderBy: { updatedAt: "desc" },
    });

    if (!chatSession) {
      return NextResponse.json({ success: true, chatSessionId: null, messages: [] });
    }

    return NextResponse.json({
      success: true,
      chatSessionId: chatSession.id,
      messages: chatSession.messages,
    });
  } catch (error: unknown) {
    console.error("Chat GET API error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return new Response("Unauthorized", { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return new Response("User not found", { status: 404 });
    }

    const entitlement = await getUserEntitlement(user.id);
    if (!entitlement?.canUseAi) {
      return NextResponse.json(premiumRequiredPayload(entitlement!), { status: 402 });
    }

    const body = await req.json();
    const { documentId, userMessage } = body;

    if (!documentId || !userMessage) {
      return new Response("Invalid request", { status: 400 });
    }

    const document = await prisma.document.findFirst({
      where: { id: documentId, userId: user.id },
    });
    if (!document) {
      return new Response("Document not found", { status: 404 });
    }

    // Find or create chat session
    let chatSession = await prisma.chatSession.findFirst({
      where: { userId: user.id, documentId },
    });

    if (!chatSession) {
      chatSession = await prisma.chatSession.create({
        data: {
          userId: user.id,
          documentId,
          title: `Chat on ${document.title}`,
        },
      });
    } else {
      await prisma.chatSession.update({
        where: { id: chatSession.id },
        data: { updatedAt: new Date() },
      });
    }

    // Save user's message
    await prisma.message.create({
      data: {
        chatSessionId: chatSession.id,
        role: "user",
        content: userMessage,
      },
    });

    // Update study stats
    await prisma.studyStats.upsert({
      where: { userId: user.id },
      update: { lastStudiedAt: new Date() },
      create: { userId: user.id, lastStudiedAt: new Date() },
    });

    const systemPrompt = `You are StudyMind AI, a clear and patient study tutor. Answer the user's questions grounded ONLY in the document context.
If the answer is unavailable inside the document, say so clearly and offer the closest relevant context from the document.

Formatting rules:
- Write like ChatGPT: readable paragraphs with breathing room, not one dense block.
- Use 2-4 short paragraphs when explaining an idea.
- Use bullet points when listing facts, steps, causes, effects, advantages, disadvantages, examples, or revision points.
- Use numbered steps for processes, sequences, methods, or instructions.
- Use a markdown table only when comparing two or more items.
- Use **bold** for key terms, but do not overdo it.
- Add a short "Quick revision" section when the answer is study-focused or exam-focused.
- Keep the answer concise unless the user asks for detail.
- Do not force every answer into the same template; choose the structure that best fits the question.

--- DOCUMENT START ---
Title: ${document.title}
Content: ${document.content.substring(0, 15000)}
--- DOCUMENT END ---
`;

    const geminiKey = process.env.GEMINI_API_KEY;
    const openaiKey = process.env.OPENAI_API_KEY;

    // Build previous message history for context
    const previousMessages = await prisma.message.findMany({
      where: { chatSessionId: chatSession.id },
      orderBy: { createdAt: "asc" },
      take: 20,
    });

    const aiMessages = previousMessages.map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    const savedChatSession = chatSession;

    if (geminiKey) {
      const google = createGoogleGenerativeAI({ apiKey: geminiKey });
      const model = google("gemini-2.5-flash");
      const result = streamText({
        model,
        system: systemPrompt,
        messages: aiMessages,
        async onFinish({ text }) {
          await prisma.message.create({
            data: {
              chatSessionId: savedChatSession.id,
              role: "assistant",
              content: text,
            },
          });
        },
      });
      return result.toTextStreamResponse();
    }

    if (openaiKey) {
      const openai = createOpenAI({ apiKey: openaiKey });
      const model = openai("gpt-4o-mini");
      const result = streamText({
        model,
        system: systemPrompt,
        messages: aiMessages,
        async onFinish({ text }) {
          await prisma.message.create({
            data: {
              chatSessionId: savedChatSession.id,
              role: "assistant",
              content: text,
            },
          });
        },
      });
      return result.toTextStreamResponse();
    }

    const fallbackMessage = await generateChatResponse(document.content, previousMessages, userMessage);
    await prisma.message.create({
      data: {
        chatSessionId: chatSession.id,
        role: "assistant",
        content: fallbackMessage,
      },
    });

    return NextResponse.json({ text: fallbackMessage });

  } catch (error: unknown) {
    console.error("Chat POST API error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const { searchParams } = new URL(req.url);
    const docId = searchParams.get("docId");

    if (!docId) {
      return NextResponse.json({ error: "docId is required" }, { status: 400 });
    }

    const chatSession = await prisma.chatSession.findFirst({
      where: { userId: user.id, documentId: docId },
      select: { id: true },
    });

    if (!chatSession) {
      return NextResponse.json({ success: true });
    }

    await prisma.message.deleteMany({
      where: { chatSessionId: chatSession.id },
    });

    await prisma.chatSession.update({
      where: { id: chatSession.id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error("Chat DELETE API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
