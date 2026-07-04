import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { generateQuiz } from "@/lib/ai";
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

    // Check if quiz already exists for this document
    let quiz = await prisma.quiz.findFirst({
      where: {
        userId: user.id,
        documentId: documentId,
      },
    });

    if (!quiz) {
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

      // Generate quiz using AI
      const generated = await generateQuiz(document.title, document.content);

      // Save quiz to DB
      quiz = await prisma.quiz.create({
        data: {
          userId: user.id,
          documentId: documentId,
          title: generated.title || `${document.title.split(".")[0]} Quiz`,
          questions: generated.questions,
        },
      });
    }

    return NextResponse.json({
      success: true,
      quizId: quiz.id,
      title: quiz.title,
      questions: quiz.questions,
    });
  } catch (error: unknown) {
    console.error("Quiz POST API error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
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
    const { quizId, answers } = body;
    const score = Number(body.score);
    const total = Number(body.total);

    if (!quizId || !Number.isInteger(score) || !Number.isInteger(total)) {
      return NextResponse.json(
        { error: "quizId, score, and total are required" },
        { status: 400 }
      );
    }

    if (total <= 0 || score < 0 || score > total) {
      return NextResponse.json(
        { error: "score must be between 0 and total" },
        { status: 400 }
      );
    }

    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        userId: user.id,
      },
    });

    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }

    // Save quiz result
    const quizResult = await prisma.quizResult.create({
      data: {
        quizId,
        score,
        total,
        answers: answers || {},
      },
    });

    // Update study frequency/lastStudied
    await prisma.studyStats.upsert({
      where: { userId: user.id },
      update: { lastStudiedAt: new Date() },
      create: { userId: user.id, lastStudiedAt: new Date() },
    });

    // Calculate user averages
    const allQuizResults = await prisma.quizResult.findMany({
      where: {
        quiz: {
          userId: user.id,
        },
      },
    });

    const totalQuizzes = allQuizResults.length;
    const averageScore =
      allQuizResults.reduce((acc, r) => acc + (r.score / r.total) * 100, 0) / totalQuizzes;

    // Update stats
    await prisma.studyStats.update({
      where: { userId: user.id },
      data: {
        totalQuizzes,
        averageScore: Math.round(averageScore * 10) / 10,
        // Calculate unique days studied (this is just an approximation based on when quizzes/docs are modified, or we can increment)
        studyFrequency: { increment: 1 },
      },
    });

    return NextResponse.json({
      success: true,
      quizResultId: quizResult.id,
      score: quizResult.score,
      total: quizResult.total,
    });
  } catch (error: unknown) {
    console.error("Quiz PATCH API error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
