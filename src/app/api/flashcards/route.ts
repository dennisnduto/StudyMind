import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateFlashcards } from "@/lib/ai";
import { getUserEntitlement, premiumRequiredPayload } from "@/lib/subscription";

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

    const entitlement = await getUserEntitlement(user.id);
    if (!entitlement?.canUseAi) {
      return NextResponse.json(premiumRequiredPayload(entitlement!), { status: 402 });
    }

    const body = await req.json();
    const { documentId } = body;

    if (!documentId) {
      return NextResponse.json({ error: "documentId is required" }, { status: 400 });
    }

    // Check if flashcard deck already exists for this document
    let deck = await prisma.flashcardDeck.findFirst({
      where: {
        userId: user.id,
        documentId: documentId,
      },
      include: { flashcards: true }
    });

    if (!deck) {
      // Find document
      const document = await prisma.document.findFirst({
        where: {
          id: documentId,
          userId: user.id,
        },
      });
      if (!document) {
        return NextResponse.json({ error: "Document not found" }, { status: 404 });
      }

      // Generate flashcards using AI
      const generated = await generateFlashcards(document.title, document.content);

      // Save deck to DB
      deck = await prisma.flashcardDeck.create({
        data: {
          userId: user.id,
          documentId: documentId,
          title: generated.title || `${document.title.split(".")[0]} Flashcards`,
          flashcards: {
            create: generated.flashcards.map((flashcard) => ({
              question: flashcard.question,
              answer: flashcard.answer
            }))
          }
        },
        include: { flashcards: true }
      });
    }

    return NextResponse.json({
      success: true,
      deckId: deck.id,
      title: deck.title,
      flashcards: deck.flashcards,
    });
  } catch (error: unknown) {
    console.error("Flashcards POST API error:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
