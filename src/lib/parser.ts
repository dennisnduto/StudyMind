import mammoth from "mammoth";
import { parseOffice } from "officeparser";
import fs from "fs/promises";
import path from "path";
import os from "os";

/**
 * Extracts plain text from a document buffer based on its file extension or type.
 * Supports .txt, .pdf, .docx, .md, and .pptx files.
 */
export async function parseFile(buffer: Buffer, fileType: string): Promise<string> {
  const normalizedType = fileType.toLowerCase().replace(/^\./, "");

  try {
    if (normalizedType === "txt" || normalizedType === "md") {
      return buffer.toString("utf-8");
    }

    if (normalizedType === "pdf") {
      // Import from internal path to bypass pdf-parse's test runner,
      // which tries to open a non-existent file on module load.
      const pdfParse = (await import("pdf-parse/lib/pdf-parse.js")).default;
      const data = await pdfParse(buffer);
      return data.text || "";
    }

    if (normalizedType === "docx" || normalizedType === "doc") {
      const data = await mammoth.extractRawText({ buffer });
      return data.value || "";
    }

    if (normalizedType === "pptx") {
      const tempPath = path.join(os.tmpdir(), `temp-${Date.now()}.pptx`);
      await fs.writeFile(tempPath, buffer);
      try {
        const ast = await parseOffice(tempPath);
        const text = ast.toText();
        await fs.unlink(tempPath).catch(() => {}); // cleanup
        return text || "";
      } catch (e) {
        await fs.unlink(tempPath).catch(() => {});
        throw e;
      }
    }

    throw new Error(`Unsupported file type: ${fileType}`);
  } catch (error: unknown) {
    console.error(`Error parsing ${fileType} file:`, error);
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to parse ${fileType} file: ${message}`);
  }
}
