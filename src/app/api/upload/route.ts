import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { parseFile } from "@/lib/parser";
import { generateSummary } from "@/lib/ai";
import { getUserEntitlement, premiumRequiredPayload } from "@/lib/subscription";
import { writeFile, mkdir } from "fs/promises";
import path from "path";

const allowedFileExtensions = new Set([".pdf", ".docx", ".txt"]);
const maxFileSize = 25 * 1024 * 1024;

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
    if (!allowedFileExtensions.has(fileExtension)) {
      return NextResponse.json(
        { success: false, error: "Unsupported file type. Upload a PDF, DOCX, or TXT file." },
        { status: 400 }
      );
    }

    if (file.size > maxFileSize) {
      return NextResponse.json(
        { success: false, error: "File must be smaller than 25MB." },
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
