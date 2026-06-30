import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;

    // Retrieve study stats
    const stats = await prisma.studyStats.findUnique({
      where: { userId }
    });

    // Retrieve all documents
    const documents = await prisma.document.findMany({
      where: { userId },
      select: {
        id: true,
        title: true,
        fileType: true,
        createdAt: true
      },
      orderBy: { createdAt: "desc" }
    });

    // Retrieve recent quiz results
    const quizResults = await prisma.quizResult.findMany({
      where: {
        quiz: { userId }
      },
      include: {
        quiz: {
          select: {
            title: true
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 10
    });

    return NextResponse.json({
      success: true,
      stats: stats || {
        totalUploads: 0,
        totalQuizzes: 0,
        averageScore: 0,
        studyFrequency: 0,
      },
      documents,
      quizResults: quizResults.map(res => ({
        id: res.id,
        quizTitle: res.quiz.title,
        score: res.score,
        total: res.total,
        percentage: parseFloat((res.score / res.total * 100).toFixed(1)),
        createdAt: res.createdAt
      }))
    });
  } catch (error: any) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
