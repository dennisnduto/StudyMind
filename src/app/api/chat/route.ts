import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "mock-key",
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { documentId, chatSessionId, message } = await req.json();

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 });
    }

    // 1. RETRIEVE DOCUMENT CONTEXT
    let docContext = "";
    let documentTitle = "Study Materials";
    if (documentId) {
      const doc = await prisma.document.findUnique({
        where: { id: documentId, userId }
      });
      if (doc) {
        docContext = doc.content;
        documentTitle = doc.title;
      }
    }

    // 2. GET OR CREATE CHAT SESSION
    let activeSession;
    if (chatSessionId) {
      activeSession = await prisma.chatSession.findUnique({
        where: { id: chatSessionId, userId }
      });
    }

    if (!activeSession) {
      activeSession = await prisma.chatSession.create({
        data: {
          userId,
          documentId: documentId || null,
          title: `Chat about ${documentTitle.slice(0, 30)}`,
        }
      });
    }

    // 3. PERSIST USER MESSAGE
    await prisma.message.create({
      data: {
        chatSessionId: activeSession.id,
        role: "user",
        content: message,
      }
    });

    // Get previous chat history to maintain continuity
    const history = await prisma.message.findMany({
      where: { chatSessionId: activeSession.id },
      orderBy: { createdAt: "asc" },
      take: 10,
    });

    const formattedHistory = history.map(msg => ({
      role: msg.role as "user" | "assistant",
      content: msg.content
    }));

    // 4. CALL OPENAI CONTEXT-AWARE CHAT
    let aiResponseText = "RAG chat is unavailable without an active OpenAI API Key.";
    if (process.env.OPENAI_API_KEY) {
      try {
        const systemPrompt = `You are StudyMind AI, a helpful study assistant. 
You are answering questions about a student's uploaded notes.
Here is the raw content of the notes:
---
${docContext.slice(0, 15000)}
---
CRITICAL RULES:
- Constrain your answers ONLY to the information provided in the raw notes.
- If the answer is not mentioned in the notes, say: "I'm sorry, but that topic isn't mentioned in your uploaded notes. Let me know if you want me to explain other concepts found in the notes!"
- Provide clear, structured, and friendly explanations. Use bold text, lists, and markdown spacing to keep it highly readable.`;

        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            { role: "system", content: systemPrompt },
            ...formattedHistory
          ]
        });

        aiResponseText = response.choices[0]?.message?.content || "Could not retrieve response.";
      } catch (aiErr: any) {
        console.error("OpenAI Chat Error:", aiErr);
        aiResponseText = `Error calling AI engine: ${aiErr.message}`;
      }
    }

    // 5. PERSIST AI MESSAGE
    const aiMessage = await prisma.message.create({
      data: {
        chatSessionId: activeSession.id,
        role: "assistant",
        content: aiResponseText,
      }
    });

    return NextResponse.json({
      success: true,
      chatSessionId: activeSession.id,
      message: aiMessage
    });
  } catch (error: any) {
    console.error("Chat API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
