"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-sm max-w-none dark:prose-invert prose-headings:mb-2 prose-headings:mt-4 prose-headings:font-bold prose-p:my-3 prose-p:leading-7 prose-ul:my-3 prose-ol:my-3 prose-li:my-1.5 prose-li:leading-7 prose-strong:font-bold prose-pre:bg-slate-900 prose-pre:text-slate-100">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          a: (props) => (
            <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline dark:text-blue-400" />
          ),
          h1: (props) => (
            <h1 {...props} className="text-xl font-bold leading-tight text-slate-950 dark:text-white" />
          ),
          h2: (props) => (
            <h2 {...props} className="text-base font-bold leading-snug text-slate-950 dark:text-white" />
          ),
          h3: (props) => (
            <h3 {...props} className="text-sm font-bold leading-snug text-slate-950 dark:text-white" />
          ),
          p: (props) => (
            <p {...props} className="my-3 leading-7 text-slate-700 dark:text-slate-200" />
          ),
          ul: (props) => (
            <ul {...props} className="my-3 list-disc space-y-1.5 pl-5 text-slate-700 dark:text-slate-200" />
          ),
          ol: (props) => (
            <ol {...props} className="my-3 list-decimal space-y-1.5 pl-5 text-slate-700 dark:text-slate-200" />
          ),
          li: (props) => (
            <li {...props} className="leading-7" />
          ),
          table: (props) => (
            <div className="overflow-x-auto my-4">
              <table {...props} className="min-w-full divide-y divide-slate-200 rounded-lg border border-slate-200 text-sm dark:divide-slate-700 dark:border-slate-700" />
            </div>
          ),
          th: (props) => (
            <th {...props} className="bg-slate-50 px-3 py-2 text-left text-xs font-medium uppercase tracking-wider text-slate-500 dark:bg-slate-800 dark:text-slate-400" />
          ),
          td: (props) => (
            <td {...props} className="whitespace-nowrap px-3 py-2 text-sm text-slate-700 dark:text-slate-300 border-t border-slate-200 dark:border-slate-700" />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
