const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const demoUser = {
  email: "student@studymind.ai",
  name: "StudyMind Student",
  password: "studymind-demo",
};

const documents = [
  {
    id: "bio-cell-signaling",
    title: "Biology - Cell Signaling Notes.pdf",
    fileType: "pdf",
    fileUrl: "/demo/bio-cell-signaling.pdf",
    content:
      "Cell signaling depends on receptors, signal transduction pathways, and cellular responses.",
    summary:
      "Cell signaling depends on receptors, signal transduction pathways, and cellular responses. Key exam areas include ligand specificity, second messengers, phosphorylation cascades, and feedback loops.",
  },
  {
    id: "econ-market-structures",
    title: "Economics - Market Structures.docx",
    fileType: "docx",
    fileUrl: "/demo/econ-market-structures.docx",
    content:
      "Market structures are compared by barriers to entry, pricing power, product differentiation, and long-run profit.",
    summary:
      "Perfect competition and monopoly sit at opposite ends, while monopolistic competition and oligopoly require attention to strategic behavior.",
  },
  {
    id: "calc-integrals",
    title: "Calculus - Integration Review.txt",
    fileType: "txt",
    fileUrl: "/demo/calc-integrals.txt",
    content:
      "Integration review covers substitution, integration by parts, partial fractions, and definite integrals as accumulated change.",
    summary:
      "Common mistakes include missing constant factors and choosing an inefficient method.",
  },
];

async function main() {
  const hashedPassword = await bcrypt.hash(demoUser.password, 10);

  const user = await prisma.user.upsert({
    where: { email: demoUser.email },
    update: {
      name: demoUser.name,
      password: hashedPassword,
    },
    create: {
      email: demoUser.email,
      name: demoUser.name,
      password: hashedPassword,
    },
  });

  for (const document of documents) {
    await prisma.document.upsert({
      where: { id: document.id },
      update: {
        ...document,
        userId: user.id,
      },
      create: {
        ...document,
        userId: user.id,
      },
    });
  }

  await prisma.studyStats.upsert({
    where: { userId: user.id },
    update: {
      totalUploads: 12,
      totalQuizzes: 18,
      averageScore: 84,
      studyFrequency: 9,
    },
    create: {
      userId: user.id,
      totalUploads: 12,
      totalQuizzes: 18,
      averageScore: 84,
      studyFrequency: 9,
    },
  });

  await prisma.quiz.upsert({
    where: { id: "demo-quiz-integration-methods" },
    update: {
      userId: user.id,
      documentId: "calc-integrals",
      title: "Integration Methods",
      questions: [
        {
          question: "Which method helps when part of the integrand is an inner derivative?",
          answer: "Substitution",
        },
      ],
    },
    create: {
      id: "demo-quiz-integration-methods",
      userId: user.id,
      documentId: "calc-integrals",
      title: "Integration Methods",
      questions: [
        {
          question: "Which method helps when part of the integrand is an inner derivative?",
          answer: "Substitution",
        },
      ],
      quizResults: {
        create: {
          score: 3,
          total: 5,
          answers: {
            selected: ["C", "A", "B"],
          },
        },
      },
    },
  });

  console.log(`Seeded StudyMind demo data for ${demoUser.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
