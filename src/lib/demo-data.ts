export const demoDocuments = [
  {
    id: "bio-cell-signaling",
    title: "Biology - Cell Signaling Notes.pdf",
    fileType: "pdf",
    createdAt: "2026-06-22T09:30:00.000Z",
    summary:
      "Cell signaling depends on receptors, signal transduction pathways, and cellular responses. Key exam areas include ligand specificity, second messengers such as cAMP, phosphorylation cascades, and how feedback loops regulate pathway intensity.",
  },
  {
    id: "econ-market-structures",
    title: "Economics - Market Structures.docx",
    fileType: "docx",
    createdAt: "2026-06-25T14:10:00.000Z",
    summary:
      "Market structures are compared by barriers to entry, pricing power, product differentiation, and long-run profit. Perfect competition and monopoly sit at opposite ends, while monopolistic competition and oligopoly require attention to strategic behavior.",
  },
  {
    id: "calc-integrals",
    title: "Calculus - Integration Review.txt",
    fileType: "txt",
    createdAt: "2026-06-28T18:45:00.000Z",
    summary:
      "Integration review covers substitution, integration by parts, partial fractions, and interpreting definite integrals as accumulated change. Common mistakes include missing constant factors and choosing an inefficient method.",
  },
];

export const demoStats = {
  totalUploads: 12,
  totalQuizzes: 18,
  averageScore: 84,
  studyFrequency: 9,
};

export const demoQuizResults = [
  { id: "q1", quizTitle: "Cell Signaling Review", score: 4, total: 5, percentage: 80, createdAt: "2026-06-21T10:00:00.000Z" },
  { id: "q2", quizTitle: "Market Structures Drill", score: 5, total: 5, percentage: 100, createdAt: "2026-06-23T10:00:00.000Z" },
  { id: "q3", quizTitle: "Integration Methods", score: 3, total: 5, percentage: 60, createdAt: "2026-06-24T10:00:00.000Z" },
  { id: "q4", quizTitle: "Receptor Pathways", score: 4, total: 5, percentage: 80, createdAt: "2026-06-26T10:00:00.000Z" },
  { id: "q5", quizTitle: "Oligopoly Concepts", score: 5, total: 5, percentage: 100, createdAt: "2026-06-29T10:00:00.000Z" },
];

export const demoQuestions = [
  {
    question: "Which step best describes signal transduction in a cell signaling pathway?",
    options: [
      "A) The ligand is released from the target cell",
      "B) The receptor converts an external signal into intracellular activity",
      "C) The nucleus blocks all protein synthesis",
      "D) The membrane removes second messengers",
    ],
    correctAnswer: "B",
    explanation:
      "Signal transduction is the conversion of an outside signal into a chain of intracellular events, often through phosphorylation or second messengers.",
  },
  {
    question: "In a perfectly competitive market, what happens to economic profit in the long run?",
    options: [
      "A) It tends toward zero as firms enter the market",
      "B) It rises permanently because firms control price",
      "C) It becomes negative for every firm",
      "D) It depends only on advertising spend",
    ],
    correctAnswer: "A",
    explanation:
      "Entry and exit push price toward average total cost, so long-run economic profit tends toward zero.",
  },
  {
    question: "Which integration method is usually most useful for expressions containing a function and its derivative?",
    options: [
      "A) Partial fractions",
      "B) Trigonometric identities",
      "C) Substitution",
      "D) Long division",
    ],
    correctAnswer: "C",
    explanation:
      "Substitution works well when part of the integrand can be treated as the derivative of an inner function.",
  },
];
