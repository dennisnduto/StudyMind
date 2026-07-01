import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateChatResponse } from "@/lib/ai";

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

    // Find the latest chat session for this user and document
    const chatSession = await prisma.chatSession.findFirst({
      where: {
        userId: user.id,
        documentId: docId,
      },
      include: {
        messages: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    if (!chatSession) {
      return NextResponse.json({
        success: true,
        chatSessionId: null,
        messages: [],
      });
    }

    return NextResponse.json({
      success: true,
      chatSessionId: chatSession.id,
      messages: chatSession.messages,
    });
  } catch (error: any) {
    console.error("Chat GET API error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
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

    const body = await req.json();
    const { documentId, content } = body;

    if (!documentId || !content) {
      return NextResponse.json(
        { error: "documentId and content are required" },
        { status: 400 }
      );
    }

    // Get the document
    const document = await prisma.document.findUnique({
      where: { id: documentId },
    });
    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    // Find or create chat session
    let chatSession = await prisma.chatSession.findFirst({
      where: {
        userId: user.id,
        documentId: documentId,
      },
    });

    if (!chatSession) {
      chatSession = await prisma.chatSession.create({
        data: {
          userId: user.id,
          documentId: documentId,
          title: `Chat on ${document.title}`,
        },
      });
    } else {
      // Update session timestamp
      await prisma.chatSession.update({
        where: { id: chatSession.id },
        data: { updatedAt: new Date() },
      });
    }

    // Save user's message
    const userMessage = await prisma.message.create({
      data: {
        chatSessionId: chatSession.id,
        role: "user",
        content,
      },
    });

    // Fetch message history for AI context
    const previousMessages = await prisma.message.findMany({
      where: { chatSessionId: chatSession.id },
      orderBy: { createdAt: "asc" },
      take: 20, // Limit context
    });

    // Format chat history for AI utility
    const chatHistory = previousMessages.map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    // Generate grounded assistant response
    const assistantContent = await generateChatResponse(
      document.content,
      chatHistory,
      content
    );

    // Save assistant's message
    const assistantMessage = await prisma.message.create({
      data: {
        chatSessionId: chatSession.id,
        role: "assistant",
        content: assistantContent,
      },
    });

    // Update study frequency/lastStudied
    await prisma.studyStats.upsert({
      where: { userId: user.id },
      update: { lastStudiedAt: new Date() },
      create: { userId: user.id, lastStudiedAt: new Date() },
    });

    return NextResponse.json({
      success: true,
      chatSessionId: chatSession.id,
      message: assistantMessage,
    });
  } catch (error: any) {
    console.error("Chat POST API error:", error);
    return NextResponse.json(
      { error: error?.message || "Internal Server Error" },
      { status: 500 }
    );
  }
}
