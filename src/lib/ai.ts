/**
 * AI service for generating summaries, chat answers, and quizzes.
 * Integrates with Gemini API or OpenAI API via fetch, with a local heuristic fallback.
 */

// Helper to call Gemini API
type QuizQuestion = {
  type: "mcq" | "tf" | "short";
  question: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
};

type GeneratedQuiz = {
  title: string;
  questions: QuizQuestion[];
};

function isGeneratedQuiz(value: unknown): value is GeneratedQuiz {
  if (!value || typeof value !== "object") {
    return false;
  }

  const candidate = value as { title?: unknown; questions?: unknown };
  return (
    typeof candidate.title === "string" &&
    Array.isArray(candidate.questions) &&
    candidate.questions.every((question) => {
      const item = question as Partial<QuizQuestion>;
      return (
        typeof item.type === "string" &&
        typeof item.question === "string" &&
        Array.isArray(item.options) &&
        typeof item.correctAnswer === "string" &&
        typeof item.explanation === "string"
      );
    })
  );
}

function extractJsonPayload(response: string) {
  const fencedJson = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fencedJson?.[1]) {
    return fencedJson[1].trim();
  }

  const firstBrace = response.indexOf("{");
  const lastBrace = response.lastIndexOf("}");
  if (firstBrace >= 0 && lastBrace > firstBrace) {
    return response.slice(firstBrace, lastBrace + 1);
  }

  return response.trim();
}

function parseGeneratedQuizResponse(response: string) {
  try {
    const parsed: unknown = JSON.parse(extractJsonPayload(response));
    return isGeneratedQuiz(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

// Helper to call Gemini API
async function callGemini(prompt: string, apiKey: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) throw new Error("Empty response from Gemini API");
  return content;
}

// Helper to call OpenAI API
async function callOpenAI(prompt: string, apiKey: string): Promise<string> {
  const url = "https://api.openai.com/v1/chat/completions";
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty response from OpenAI API");
  return content;
}

// Heuristic Fallback Generators (if no keys are present)
function getLocalSummary(content: string): string {
  const clean = content.replace(/\s+/g, " ").trim();
  if (clean.length < 50) return clean;

  const sentences = clean.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
  const picked = sentences.slice(0, Math.min(sentences.length, 4));
  
  return picked.join(". ") + ". This summary was generated locally based on the key opening notes of the document.";
}

function getLocalChatResponse(content: string, userMessage: string): string {
  const lowerMsg = userMessage.toLowerCase();
  const sentences = content.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);
  
  // Look for matching sentences
  const matches = sentences.filter(s => {
    const words = lowerMsg.split(/\s+/).filter(w => w.length > 3);
    return words.some(word => s.toLowerCase().includes(word));
  });

  if (matches.length > 0) {
    return `Based on your notes: "${matches.slice(0, 2).join(". ")}." (Local search response)`;
  }

  return `I found no direct references to your question in the text. Here is a summary of the document to help guide you: ${getLocalSummary(content)}`;
}

function getLocalQuiz(documentTitle: string, content: string): GeneratedQuiz {
  const clean = content.replace(/\s+/g, " ").trim();
  const sentences = clean.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);

  // We want to generate 3 questions.
  const questions: QuizQuestion[] = [];
  const definitionSentences = sentences.filter(s => 
    s.includes(" is ") || s.includes(" are ") || s.includes(" depends ") || s.includes(" because ")
  );

  const pool = definitionSentences.length >= 3 ? definitionSentences : sentences;

  for (let i = 0; i < Math.min(3, pool.length); i++) {
    const statement = pool[i];
    questions.push({
      type: "mcq",
      question: `Review this statement: "${statement}". What is the core study takeaway?`,
      options: [
        `A) This is a key foundational concept for ${documentTitle.split(".")[0]}.`,
        "B) This statement is incorrect or unrelated to the exam syllabus.",
        "C) It represents a minor historical footnote only.",
        "D) It contradicts standard textbook definitions.",
      ],
      correctAnswer: `A) This is a key foundational concept for ${documentTitle.split(".")[0]}.`,
      explanation: `The notes explicitly highlight: "${statement}". This is essential information to recall for your exam.`,
    });
  }

  // Backup if document is too short or has no sentences
  if (questions.length === 0) {
    questions.push({
      type: "mcq",
      question: `What is the primary topic of the document "${documentTitle}"?`,
      options: [
        `A) The core concepts discussed in ${documentTitle}.`,
        "B) Advanced mathematics theory.",
        "C) Creative writing techniques.",
        "D) Art history overview.",
      ],
      correctAnswer: `A) The core concepts discussed in ${documentTitle}.`,
      explanation: `The document uploaded is titled "${documentTitle}".`,
    });
  }

  return {
    title: `${documentTitle.split(".")[0]} Quiz`,
    questions,
  };
}

export async function generateSummary(content: string): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const prompt = `
Analyze the following document and generate highly structured study notes in strict JSON format. 
The JSON must have the following structure:
{
  "overview": "A concise explanation of the main topic.",
  "keyConcepts": ["Concept 1", "Concept 2"],
  "definitions": [{"term": "Word", "definition": "Meaning"}],
  "facts": ["Important fact to remember"],
  "formulas": ["Any math/science formulas found, or empty array"],
  "examTips": ["Likely exam questions or hints"],
  "commonMistakes": ["Misconceptions students often make"],
  "quickRevision": "A one-minute summary for last-minute review.",
  "difficultyLevel": "Easy", // or "Intermediate", "Advanced"
}

Document Content:
${content.slice(0, 15000)}

Output ONLY valid JSON wrapped in \`\`\`json block.
`;

  if (geminiKey) {
    try {
      const response = await callGemini(prompt, geminiKey);
      const json = extractJsonPayload(response);
      JSON.parse(json); // Validate
      return json;
    } catch (e) {
      console.warn("Gemini Summary failed, falling back to OpenAI/Local", e);
    }
  }

  if (openaiKey) {
    try {
      const response = await callOpenAI(prompt, openaiKey);
      const json = extractJsonPayload(response);
      JSON.parse(json); // Validate
      return json;
    } catch (e) {
      console.warn("OpenAI Summary failed, falling back to Local", e);
    }
  }

  return JSON.stringify({
    overview: getLocalSummary(content),
    keyConcepts: ["Basic concept extraction not available locally"],
    definitions: [],
    facts: ["Local fallback used"],
    formulas: [],
    examTips: [],
    commonMistakes: [],
    quickRevision: "Upgrade or add API key for advanced notes.",
    difficultyLevel: "Intermediate",
  });
}

export async function generateChatResponse(
  content: string,
  chatHistory: { role: string; content: string }[],
  userMessage: string
): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const contextPrompt = `
You are a study assistant. Answer the user's question grounded ONLY in the following document context:
---
${content.slice(0, 12000)}
---

History:
${chatHistory.map(h => `${h.role === "user" ? "Student" : "Assistant"}: ${h.content}`).join("\n")}

Student: ${userMessage}
Assistant:`;

  if (geminiKey) {
    try {
      return await callGemini(contextPrompt, geminiKey);
    } catch (e) {
      console.warn("Gemini Chat failed, falling back to OpenAI/Local", e);
    }
  }

  if (openaiKey) {
    try {
      return await callOpenAI(contextPrompt, openaiKey);
    } catch (e) {
      console.warn("OpenAI Chat failed, falling back to Local", e);
    }
  }

  return getLocalChatResponse(content, userMessage);
}

export async function generateQuiz(
  documentTitle: string,
  content: string,
  options?: { difficulty?: string; count?: number }
): Promise<GeneratedQuiz> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  
  const difficulty = options?.difficulty || "Medium";
  const count = options?.count || 5;

  const prompt = `
Generate a practice quiz based on this study document:
Title: ${documentTitle}
Content: ${content.slice(0, 15000)}

Generate exactly ${count} questions of difficulty "${difficulty}" in strict JSON format. 
Mix question types: Multiple Choice (4 options), True/False (2 options), and Short Answer (no options, open-ended).

Each question must contain:
1. "type": "mcq" | "tf" | "short"
2. "question": string
3. "options": string[] (provide options for mcq and tf, empty array for short)
4. "correctAnswer": string (exact text of correct option or ideal short answer)
5. "explanation": string (why this is correct)

Respond with ONLY valid JSON inside a code block, formatted like this:
\`\`\`json
{
  "title": "Quiz Title",
  "questions": [
    {
      "type": "mcq",
      "question": "Question text?",
      "options": ["Opt 1", "Opt 2", "Opt 3", "Opt 4"],
      "correctAnswer": "Opt 1",
      "explanation": "Why this is correct."
    }
  ]
}
\`\`\`
`;

  if (geminiKey) {
    try {
      const response = await callGemini(prompt, geminiKey);
      const parsed = parseGeneratedQuizResponse(response);
      if (parsed) return parsed;
    } catch (e) {
      console.warn("Gemini Quiz failed, falling back to OpenAI/Local", e);
    }
  }

  if (openaiKey) {
    try {
      const response = await callOpenAI(prompt, openaiKey);
      const parsed = parseGeneratedQuizResponse(response);
      if (parsed) return parsed;
    } catch (e) {
      console.warn("OpenAI Quiz failed, falling back to Local", e);
    }
  }

  return getLocalQuiz(documentTitle, content);
}

export type GeneratedFlashcardDeck = {
  title: string;
  flashcards: Array<{
    question: string;
    answer: string;
  }>;
};

export async function generateFlashcards(
  documentTitle: string,
  content: string
): Promise<GeneratedFlashcardDeck> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const prompt = `
Generate flashcards based on this study document:
Title: ${documentTitle}
Content: ${content.slice(0, 15000)}

Generate exactly 10 flashcards in strict JSON format. Extract the most important atomic concepts, definitions, and facts.

Each flashcard must contain:
1. "question": string (concise prompt or term)
2. "answer": string (clear, accurate definition or explanation)

Respond with ONLY valid JSON inside a code block, formatted like this:
\`\`\`json
{
  "title": "Quiz Title",
  "flashcards": [
    {
      "question": "What is Mitochondria?",
      "answer": "The powerhouse of the cell."
    }
  ]
}
\`\`\`
`;

  if (geminiKey) {
    try {
      const response = await callGemini(prompt, geminiKey);
      const json = JSON.parse(extractJsonPayload(response)) as GeneratedFlashcardDeck;
      return json;
    } catch (e) {
      console.warn("Gemini Flashcards failed, falling back to OpenAI/Local", e);
    }
  }

  if (openaiKey) {
    try {
      const response = await callOpenAI(prompt, openaiKey);
      const json = JSON.parse(extractJsonPayload(response)) as GeneratedFlashcardDeck;
      return json;
    } catch (e) {
      console.warn("OpenAI Flashcards failed, falling back to Local", e);
    }
  }

  return {
    title: documentTitle,
    flashcards: [
      {
        question: "Local Mode Warning",
        answer: "Please add an API key to automatically generate high-quality flashcards."
      }
    ]
  };
}
