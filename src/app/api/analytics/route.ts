import { NextResponse } from "next/server";
import { demoDocuments, demoQuizResults, demoStats } from "@/lib/demo-data";

export async function GET() {
  return NextResponse.json({
    success: true,
    stats: demoStats,
    documents: demoDocuments,
    quizResults: demoQuizResults,
  });
}
