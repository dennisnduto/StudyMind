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
    const { documentId } = await req.json();

    if (!documentId) {
      return NextResponse.json({ error: "Document ID is required" }, { status: 400 });
    }

    const document = await prisma.document.findUnique({
      where: { id: documentId, userId }
    });

    if (!document) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    let quizQuestions = [];

    // Call OpenAI to generate quiz
    if (process.env.OPENAI_API_KEY) {
      try {
        const prompt = `You are a professional examiner. Generate a 5-question multiple choice quiz strictly based on the following study materials:
---
${document.content.slice(0, 10000)}
---
Format the response ONLY as a JSON array of objects. Do not wrap it in markdown markers or add text besides the JSON.
Each object in the array must look exactly like this:
{
  "question": "What is ...?",
  "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
  "correctAnswer": "A",
  "explanation": "Explanation why Option 1 is correct..."
}`;

        const response = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }]
        });

        const rawContent = response.choices[0]?.message?.content?.trim() || "[]";
        
        // Strip markdown backticks if OpenAI added them
        const cleanedJSON = rawContent.replace(/^```json/, "").replace(/```$/, "").trim();
        
        quizQuestions = JSON.parse(cleanedJSON);
      } catch (err: any) {
        console.error("OpenAI Quiz generation failed:", err);
        return NextResponse.json({ error: "Failed to generate AI quiz questions" }, { status: 502 });
      }
    } else {
      // Mock / fallback questions if no API key
      quizQuestions = [
        {
          question: `Sample question for your document: "${document.title}"`,
          options: ["A) Option A", "B) Option B", "C) Option C", "D) Option D"],
          correctAnswer: "A",
          explanation: "This is a placeholder explanation since the OpenAI API key is missing."
        }
      ];
    }

    const quiz = await prisma.quiz.create({
      data: {
        userId,
        documentId,
        title: `Quiz: ${document.title.slice(0, 30)}`,
        questions: quizQuestions,
      }
    });

    return NextResponse.json({
      success: true,
      quizId: quiz.id,
      title: quiz.title,
      questions: quizQuestions
    });
  } catch (error: any) {
    console.error("Quiz API error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// Submits a completed quiz score
export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const { quizId, score, total, answers } = await req.json();

    if (!quizId || score === undefined || !total) {
      return NextResponse.json({ error: "Missing required submission fields" }, { status: 400 });
    }

    const quizResult = await prisma.quizResult.create({
      data: {
        quizId,
        score,
        total,
        answers,
      }
    });

    // Recalculate average score and update user stats
    const allStats = await prisma.studyStats.findUnique({
      where: { userId }
    });

    const currentTotalQuizzes = (allStats?.totalQuizzes || 0) + 1;
    const currentAverage = allStats?.averageScore || 0;
    const nextAverage = ((currentAverage * (allStats?.totalQuizzes || 0)) + (score / total * 100)) / currentTotalQuizzes;

    await prisma.studyStats.upsert({
      where: { userId },
      update: {
        totalQuizzes: currentTotalQuizzes,
        averageScore: parseFloat(nextAverage.toFixed(1)),
        lastStudiedAt: new Date(),
      },
      create: {
        userId,
        totalQuizzes: 1,
        averageScore: parseFloat((score / total * 100).toFixed(1)),
      }
    });

    return NextResponse.json({
      success: true,
      quizResultId: quizResult.id,
      score,
      total
    });
  } catch (error: any) {
    console.error("Quiz submission error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
