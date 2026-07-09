import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { parseFile } from "@/lib/parser";
import { generateSummary } from "@/lib/ai";
import { getUserEntitlement, premiumRequiredPayload } from "@/lib/subscription";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const FREE_ALLOWED_EXTENSIONS = new Set([".pdf"]);
const PREMIUM_ALLOWED_EXTENSIONS = new Set([".pdf", ".docx", ".txt", ".md", ".pptx"]);
const FREE_MAX_SIZE = 10 * 1024 * 1024; // 10MB

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

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
    }

    const fileExtension = path.extname(file.name).toLowerCase();
    const allowedExtensions = entitlement?.isPremium ? PREMIUM_ALLOWED_EXTENSIONS : FREE_ALLOWED_EXTENSIONS;
    
    if (!allowedExtensions.has(fileExtension)) {
      return NextResponse.json(
        { 
          success: false, 
          code: "PREMIUM_REQUIRED",
          error: entitlement?.isPremium 
            ? "Unsupported file type. Upload PDF, DOCX, TXT, MD, or PPTX."
            : "Free accounts can only upload PDFs. Upgrade to Premium to upload DOCX, TXT, MD, and PPTX files." 
        },
        { status: 400 }
      );
    }

    if (!entitlement?.isPremium && file.size > FREE_MAX_SIZE) {
      return NextResponse.json(
        { 
          success: false, 
          code: "PREMIUM_REQUIRED",
          error: "Free accounts are limited to 10MB per file. Upgrade to Premium for unlimited file sizes." 
        },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Parse file content
    const content = await parseFile(buffer, fileExtension);
    if (!content.trim()) {
      return NextResponse.json(
        { success: false, error: "No readable text was found in this file." },
        { status: 400 }
      );
    }

    // Generate summary using AI service
    const summary = await generateSummary(content);

    // Save physical file locally after content validation succeeds.
    const uploadDir = path.join(process.cwd(), "public", "uploads");
    await mkdir(uploadDir, { recursive: true });

    const documentId = crypto.randomUUID();
    const safeFileName = `${documentId}${fileExtension}`;
    const filePath = path.join(uploadDir, safeFileName);
    await writeFile(filePath, buffer);

    const fileUrl = `/uploads/${safeFileName}`;

    // Create Document record
    const document = await prisma.document.create({
      data: {
        id: documentId,
        userId: user.id,
        title: file.name,
        fileUrl,
        fileType: fileExtension.replace(".", "") || "txt",
        content,
        summary,
      },
    });

    // Update study stats
    await prisma.studyStats.upsert({
      where: { userId: user.id },
      update: {
        totalUploads: { increment: 1 },
        lastStudiedAt: new Date(),
      },
      create: {
        userId: user.id,
        totalUploads: 1,
        lastStudiedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      documentId: document.id,
      title: document.title,
      summary: document.summary,
    });
  } catch (error: unknown) {
    console.error("Upload API error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json(
      { success: false, error: message },
      { status: 500 }
    );
  }
}
