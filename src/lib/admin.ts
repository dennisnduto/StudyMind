import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isAdminUser } from "@/lib/subscription";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export async function requireAdminUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    redirect("/login");
  }

  const currentUser = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      plan: true,
    },
  });

  if (!currentUser || !isAdminUser(currentUser)) {
    redirect("/dashboard");
  }

  return currentUser;
}

export function formatAdminDate(date?: Date | null) {
  if (!date) {
    return "Not set";
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function getPlanLabel(user: { plan: string; premiumUntil?: Date | null }) {
  if (user.plan !== "PREMIUM") {
    return "Free";
  }

  if (user.premiumUntil && user.premiumUntil <= new Date()) {
    return "Expired premium";
  }

  return "Premium";
}
