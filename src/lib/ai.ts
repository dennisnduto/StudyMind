/**
 * AI service for generating summaries, chat answers, and quizzes.
 * Integrates with Gemini API or OpenAI API via fetch, with a local heuristic fallback.
 */

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

function getLocalQuiz(documentTitle: string, content: string) {
  const clean = content.replace(/\s+/g, " ").trim();
  const sentences = clean.split(/[.!?]+/).map(s => s.trim()).filter(Boolean);

  // We want to generate 3 questions.
  const questions: any[] = [];
  const definitionSentences = sentences.filter(s => 
    s.includes(" is ") || s.includes(" are ") || s.includes(" depends ") || s.includes(" because ")
  );

  const pool = definitionSentences.length >= 3 ? definitionSentences : sentences;

  for (let i = 0; i < Math.min(3, pool.length); i++) {
    const statement = pool[i];
    questions.push({
      question: `Review this statement: "${statement}". What is the core study takeaway?`,
      options: [
        `A) This is a key foundational concept for ${documentTitle.split(".")[0]}.`,
        "B) This statement is incorrect or unrelated to the exam syllabus.",
        "C) It represents a minor historical footnote only.",
        "D) It contradicts standard textbook definitions.",
      ],
      correctAnswer: "A",
      explanation: `The notes explicitly highlight: "${statement}". This is essential information to recall for your exam.`,
    });
  }

  // Backup if document is too short or has no sentences
  if (questions.length === 0) {
    questions.push({
      question: `What is the primary topic of the document "${documentTitle}"?`,
      options: [
        `A) The core concepts discussed in ${documentTitle}.`,
        "B) Advanced mathematics theory.",
        "C) Creative writing techniques.",
        "D) Art history overview.",
      ],
      correctAnswer: "A",
      explanation: `The document uploaded is titled "${documentTitle}".`,
    });
  }

  return {
    title: `${documentTitle.split(".")[0]} Quiz`,
    questions,
  };
}

// Exported Functions
export async function generateSummary(content: string): Promise<string> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  if (geminiKey) {
    try {
      const prompt = `Provide a concise, bulleted study summary of the following document. Max 4-5 sentences:\n\n${content.slice(0, 10000)}`;
      return await callGemini(prompt, geminiKey);
    } catch (e) {
      console.warn("Gemini Summary failed, falling back to OpenAI/Local", e);
    }
  }

  if (openaiKey) {
    try {
      const prompt = `Provide a concise, bulleted study summary of the following document. Max 4-5 sentences:\n\n${content.slice(0, 10000)}`;
      return await callOpenAI(prompt, openaiKey);
    } catch (e) {
      console.warn("OpenAI Summary failed, falling back to Local", e);
    }
  }

  return getLocalSummary(content);
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
  content: string
): Promise<{ title: string; questions: { question: string; options: string[]; correctAnswer: string; explanation: string }[] }> {
  const geminiKey = process.env.GEMINI_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;

  const prompt = `
Generate a practice quiz based on this study document:
Title: ${documentTitle}
Content: ${content.slice(0, 10000)}

Generate exactly 3 multiple-choice questions in strict JSON format. Each question must contain:
1. "question": string
2. "options": string[] (exactly 4 options, prefixing them with A), B), C), D))
3. "correctAnswer": string (must be "A", "B", "C", or "D")
4. "explanation": string

Respond with ONLY valid JSON inside a code block, formatted like this:
\`\`\`json
{
  "title": "Quiz Title",
  "questions": [
    {
      "question": "Question text?",
      "options": ["A) Opt 1", "B) Opt 2", "C) Opt 3", "D) Opt 4"],
      "correctAnswer": "A",
      "explanation": "Why this is correct."
    }
  ]
}
\`\`\`
`;

  if (geminiKey) {
    try {
      const response = await callGemini(prompt, geminiKey);
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || [null, response];
      const parsed = JSON.parse(jsonMatch[1].trim());
      if (parsed && Array.isArray(parsed.questions)) return parsed;
    } catch (e) {
      console.warn("Gemini Quiz failed, falling back to OpenAI/Local", e);
    }
  }

  if (openaiKey) {
    try {
      const response = await callOpenAI(prompt, openaiKey);
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || [null, response];
      const parsed = JSON.parse(jsonMatch[1].trim());
      if (parsed && Array.isArray(parsed.questions)) return parsed;
    } catch (e) {
      console.warn("OpenAI Quiz failed, falling back to Local", e);
    }
  }

  return getLocalQuiz(documentTitle, content);
}
