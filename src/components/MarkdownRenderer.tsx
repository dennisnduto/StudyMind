"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:text-slate-100">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: ({ node, ...props }) => (
            <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline dark:text-blue-400" />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4">
              <table {...props} className="min-w-full divide-y divide-slate-200 dark:divide-slate-700" />
            </div>
          ),
          th: ({ node, ...props }) => (
            <th {...props} className="bg-slate-50 px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:bg-slate-800 dark:text-slate-400" />
          ),
          td: ({ node, ...props }) => (
            <td {...props} className="whitespace-nowrap px-3 py-2 text-sm text-slate-700 dark:text-slate-300 border-t border-slate-200 dark:border-slate-700" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
