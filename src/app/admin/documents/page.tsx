import AdminNav, { AdminSectionHeader, EmptyAdminState } from "@/components/AdminNav";
import AppShell from "@/components/AppShell";
import StatCard from "@/components/StatCard";
import { formatAdminDate, requireAdminUser } from "@/lib/admin";
import prisma from "@/lib/prisma";
import { FileArchive, FileText, Layers, MessageSquareText } from "lucide-react";

function formatCharacters(value: number) {
  if (value >= 1000) {
    return `${Math.round(value / 1000)}k`;
  }

  return value.toString();
}

export default async function AdminDocumentsPage() {
  await requireAdminUser();

  const [documentCount, chatSessionCount, deckCount, documents, typeGroups] = await Promise.all([
    prisma.document.count(),
    prisma.chatSession.count({ where: { documentId: { not: null } } }),
    prisma.flashcardDeck.count(),
    prisma.document.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        title: true,
        fileType: true,
        content: true,
        summary: true,
        createdAt: true,
        updatedAt: true,
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        _count: {
          select: {
            chatSessions: true,
            quizzes: true,
            flashcardDecks: true,
          },
        },
      },
    }),
    prisma.document.groupBy({
      by: ["fileType"],
      _count: {
        fileType: true,
      },
      orderBy: {
        _count: {
          fileType: "desc",
        },
      },
    }),
  ]);

  const summarizedCount = documents.filter((document) => Boolean(document.summary)).length;

  return (
    <AppShell>
      <div className="space-y-6">
        <AdminSectionHeader
          eyebrow="Admin / Documents"
          title="Document operations"
          description="Track uploaded materials, owners, extracted text volume, and which study tools have been generated from each document."
        />

        <AdminNav active="/admin/documents" />

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard label="Documents" value={documentCount} icon={FileText} />
          <StatCard label="With summaries" value={summarizedCount} icon={FileArchive} />
          <StatCard label="Chat sessions" value={chatSessionCount} icon={MessageSquareText} />
          <StatCard label="Flashcard decks" value={deckCount} icon={Layers} />
        </section>

        <section className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
          <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#15171b]">
            <div className="border-b border-slate-200 p-5 dark:border-slate-800">
              <h2 className="font-bold">File types</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Current upload mix by extension.</p>
            </div>
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {typeGroups.map((group) => (
                <div key={group.fileType} className="flex items-center justify-between p-5">
                  <span className="font-bold uppercase">{group.fileType}</span>
                  <span className="rounded-md bg-slate-100 px-2 py-1 text-xs font-bold dark:bg-slate-800">
                    {group._count.fileType}
                  </span>
                </div>
              ))}
              {typeGroups.length === 0 && <EmptyAdminState message="No file types yet." />}
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-white dark:border-slate-800 dark:bg-[#15171b]">
            <div className="border-b border-slate-200 p-5 dark:border-slate-800">
              <h2 className="font-bold">Recent documents</h2>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Showing latest 50 uploads.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[960px] text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                  <tr>
                    <th className="px-5 py-3">Document</th>
                    <th className="px-5 py-3">Owner</th>
                    <th className="px-5 py-3">Type</th>
                    <th className="px-5 py-3">Extracted text</th>
                    <th className="px-5 py-3">Generated assets</th>
                    <th className="px-5 py-3">Uploaded</th>
                    <th className="px-5 py-3">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {documents.map((document) => (
                    <tr key={document.id}>
                      <td className="px-5 py-4">
                        <p className="line-clamp-1 font-bold">{document.title}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {document.summary ? "Summary ready" : "No summary"}
                        </p>
                      </td>
                      <td className="px-5 py-4">
                        <p>{document.user.name || "Unnamed user"}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{document.user.email || "No email"}</p>
                      </td>
                      <td className="px-5 py-4 uppercase">{document.fileType}</td>
                      <td className="px-5 py-4">{formatCharacters(document.content.length)} chars</td>
                      <td className="px-5 py-4">
                        {document._count.chatSessions} chats, {document._count.quizzes} quizzes, {document._count.flashcardDecks} decks
                      </td>
                      <td className="px-5 py-4">{formatAdminDate(document.createdAt)}</td>
                      <td className="px-5 py-4">{formatAdminDate(document.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {documents.length === 0 && <EmptyAdminState message="No documents found." />}
          </div>
        </section>
      </div>
    </AppShell>
  );
}
