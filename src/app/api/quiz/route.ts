import { NextResponse } from "next/server";
import { demoQuestions } from "@/lib/demo-data";

export async function POST() {
  return NextResponse.json({
    success: true,
    quizId: "demo-quiz",
    title: "Demo StudyMind Quiz",
    questions: demoQuestions,
  });
}

export async function PATCH(req: Request) {
  const body = await req.json();

  return NextResponse.json({
    success: true,
    quizResultId: "demo-quiz-result",
    score: body.score,
    total: body.total,
  });
}
