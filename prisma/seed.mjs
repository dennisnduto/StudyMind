import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const adminEmail = (process.env.SEED_ADMIN_EMAIL || process.env.ADMIN_EMAILS?.split(",")[0] || "admin@studymind.ai").trim();
const adminPassword = process.env.SEED_ADMIN_PASSWORD || "change-this-password";

async function main() {
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  await prisma.user.upsert({
    where: { email: adminEmail },
    update: {
      role: "ADMIN",
      plan: "PREMIUM",
      password: hashedPassword,
    },
    create: {
      email: adminEmail,
      name: "StudyMind Admin",
      role: "ADMIN",
      plan: "PREMIUM",
      password: hashedPassword,
    },
  });

  console.log(`Seeded StudyMind admin account for ${adminEmail}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
