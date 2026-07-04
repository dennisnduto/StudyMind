import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: {
      documents: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          fileType: true,
          summary: true,
          createdAt: true,
        },
      },
      studyStats: true,
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const quizResults = await prisma.quizResult.findMany({
    where: {
      quiz: {
        userId: user.id,
      },
    },
    orderBy: { createdAt: "asc" },
    include: {
      quiz: {
        select: {
          title: true,
        },
      },
    },
    take: 25,
  });

  const stats = user.studyStats || {
    totalUploads: user.documents.length,
    totalQuizzes: quizResults.length,
    averageScore: 0,
    studyFrequency: 0,
  };

  return NextResponse.json({
    success: true,
    stats,
    documents: user.documents,
    quizResults: quizResults.map((result) => ({
      id: result.id,
      quizTitle: result.quiz.title,
      score: result.score,
      total: result.total,
      percentage: result.total > 0 ? Math.round((result.score / result.total) * 100) : 0,
      createdAt: result.createdAt,
    })),
  });
}
