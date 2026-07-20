import prisma from "@/lib/prisma";

export const FREE_TRIAL_DAYS = 7;
export const FREE_AI_ACTION_LIMIT = 8;

type EntitlementUser = {
  id: string;
  email: string | null;
  role: string;
  plan: string;
  premiumUntil: Date | null;
  createdAt: Date;
};

export function isAdminEmail(email?: string | null) {
  if (!email) {
    return false;
  }

  const adminEmails = (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);

  return adminEmails.includes(email.toLowerCase());
}

export function isAdminUser(user: { email?: string | null; role?: string | null }) {
  return user.role === "ADMIN" || isAdminEmail(user.email);
}

export function getTrialEndsAt(createdAt: Date) {
  const trialEndsAt = new Date(createdAt);
  trialEndsAt.setDate(trialEndsAt.getDate() + FREE_TRIAL_DAYS);
  return trialEndsAt;
}

export function hasPremiumAccess(user: Pick<EntitlementUser, "email" | "role" | "plan" | "premiumUntil">) {
  if (isAdminUser(user)) {
    return true;
  }

  if (user.plan !== "PREMIUM") {
    return false;
  }

  return !user.premiumUntil || user.premiumUntil > new Date();
}

export async function getUserEntitlement(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      plan: true,
      premiumUntil: true,
      createdAt: true,
    },
  });

  if (!user) {
    return null;
  }

  const [uploadCount, quizCount, messageCount] = await Promise.all([
    prisma.document.count({
      where: {
        userId,
      },
    }),
    prisma.quiz.count({
      where: {
        userId,
      },
    }),
    prisma.message.count({
      where: {
        chatSession: {
          userId,
        },
        role: "user",
      },
    }),
  ]);

  const evaluatedAt = new Date();
  const trialEndsAt = getTrialEndsAt(user.createdAt);
  const usedActions = uploadCount + quizCount + messageCount;
  const premium = hasPremiumAccess(user);
  const trialActive = trialEndsAt > evaluatedAt;
  const withinUsageLimit = usedActions < FREE_AI_ACTION_LIMIT;
  const canUseAi = premium || trialActive || withinUsageLimit;

  return {
    user,
    plan: premium ? "PREMIUM" : "FREE",
    canUseAi,
    isPremium: premium,
    evaluatedAt,
    trialEndsAt,
    trialActive,
    usedActions,
    remainingActions: premium || trialActive ? null : Math.max(FREE_AI_ACTION_LIMIT - usedActions, 0),
    freeActionLimit: FREE_AI_ACTION_LIMIT,
    freeTrialDays: FREE_TRIAL_DAYS,
  };
}

export function premiumRequiredPayload(entitlement: NonNullable<Awaited<ReturnType<typeof getUserEntitlement>>>) {
  return {
    success: false,
    code: "PREMIUM_REQUIRED",
    error: "Your free trial and starter AI actions have ended. Upgrade to Premium to keep using AI study tools.",
    entitlement: {
      trialEndsAt: entitlement.trialEndsAt.toISOString(),
      usedActions: entitlement.usedActions,
      freeActionLimit: entitlement.freeActionLimit,
      remainingActions: entitlement.remainingActions,
    },
  };
}
