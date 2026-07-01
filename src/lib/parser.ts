import mammoth from "mammoth";

/**
 * Extracts plain text from a document buffer based on its file extension or type.
 * Supports .txt, .pdf, and .docx files.
 */
export async function parseFile(buffer: Buffer, fileType: string): Promise<string> {
  const normalizedType = fileType.toLowerCase().replace(/^\./, "");

  try {
    if (normalizedType === "txt") {
      return buffer.toString("utf-8");
    }

    if (normalizedType === "pdf") {
      // Dynamic import to avoid build-time ESM/CJS issues
      // pdf-parse v1 uses CommonJS with a default export
      const pdfParse = (await import("pdf-parse")).default;
      const data = await pdfParse(buffer);
      return data.text || "";
    }

    if (normalizedType === "docx" || normalizedType === "doc") {
      const data = await mammoth.extractRawText({ buffer });
      return data.value || "";
    }

    throw new Error(`Unsupported file type: ${fileType}`);
  } catch (error: any) {
    console.error(`Error parsing ${fileType} file:`, error);
    throw new Error(`Failed to parse ${fileType} file: ${error?.message || error}`);
  }
}
