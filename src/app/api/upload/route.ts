import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { promises as fs } from "fs";
import path from "path";
import pdf from "pdf-parse";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "mock-key",
});

// Configure local upload folder
const UPLOAD_DIR = path.resolve(process.cwd(), "public/uploads");

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    // Create upload directory if it doesn't exist
    await fs.mkdir(UPLOAD_DIR, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;
    const filePath = path.join(UPLOAD_DIR, fileName);
    
    // Save file locally
    await fs.writeFile(filePath, buffer);
    const fileUrl = `/uploads/${fileName}`;

    let extractedText = "";
    const fileType = file.type;

    // 1. TEXT EXTRACTION LAYER
    if (fileType.includes("pdf")) {
      try {
        const data = await pdf(buffer);
        extractedText = data.text;
      } catch (pdfErr) {
        console.error("PDF Parsing error:", pdfErr);
        return NextResponse.json({ error: "Failed to parse PDF document" }, { status: 422 });
      }
    } else if (fileType.includes("text") || fileType.includes("txt")) {
      extractedText = buffer.toString("utf-8");
    } else if (fileType.includes("image")) {
      // OCR via OpenAI Vision API (if configured)
      if (process.env.OPENAI_API_KEY) {
        try {
          const base64Image = buffer.toString("base64");
          const response = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [
              {
                role: "user",
                content: [
                  { type: "text", text: "Please extract all readable study text and details from this image exactly. Do not add conversational text, just return the raw text extracted." },
                  {
                    type: "image_url",
                    image_url: {
                      url: `data:${fileType};base64,${base64Image}`,
                    },
                  },
                ],
              },
            ],
          });
          extractedText = response.choices[0]?.message?.content || "";
        } catch (visionErr) {
          console.error("Vision parsing error:", visionErr);
          extractedText = "Image uploaded. Vision parsing failed due to api issues.";
        }
      } else {
        extractedText = "Image uploaded. Vision parsing (OCR) unavailable without OpenAI API Key.";
      }
    } else {
      extractedText = "Unsupported file format. Text could not be automatically extracted.";
    }

    if (!extractedText.trim()) {
      extractedText = "Empty document or failed to extract readable text.";
    }

    // 2. CREATE DOCUMENT RECORD
    const document = await prisma.document.create({
      data: {
        userId,
        title: file.name,
        fileUrl,
        fileType: fileType.includes("pdf") ? "pdf" : fileType.includes("image") ? "image" : "txt",
        content: extractedText,
      },
    });

    // 3. GENERATE SUMMARY ASYNCHRONOUSLY / INLINE FOR FAST FEEDBACK
    let summary = "";
    if (process.env.OPENAI_API_KEY && extractedText.length > 50) {
      try {
        const sumResponse = await openai.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content: "You are a professional academic summaries assistant. Generate a beautiful, highly structured Markdown study summary of the text. Include: - Key points - Main definitions - Important formulas/theorems - Exam hints."
            },
            {
              role: "user",
              content: `Please summarize the following material:\n\n${extractedText.slice(0, 8000)}`
            }
          ]
        });
        summary = sumResponse.choices[0]?.message?.content || "Could not generate summary.";
        
        // Update document with summary
        await prisma.document.update({
          where: { id: document.id },
          data: { summary }
        });
      } catch (sumErr) {
        console.error("Summarization error:", sumErr);
      }
    }

    // 4. UPDATE STUDY STATS
    await prisma.studyStats.upsert({
      where: { userId },
      update: {
        totalUploads: { increment: 1 },
        lastStudiedAt: new Date(),
      },
      create: {
        userId,
        totalUploads: 1,
      },
    });

    return NextResponse.json({
      success: true,
      documentId: document.id,
      title: document.title,
      summary: summary || "Summary generation in progress...",
    });
  } catch (error: any) {
    console.error("Upload handler error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
