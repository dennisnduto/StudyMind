import type { ElementType } from "react";
import { Sparkles } from "lucide-react";

type InfoBannerProps = {
  title: string;
  description: string;
  icon?: ElementType;
  tone?: string;
};

export default function InfoBanner({ title, description, icon: Icon = Sparkles, tone = "bg-blue-50 text-blue-800 dark:bg-blue-500/10 dark:text-blue-200" }: InfoBannerProps) {
  return (
    <div className={`flex items-start gap-3 rounded-lg border border-slate-200 p-4 ${tone}`}>
      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/70 dark:bg-slate-900/70">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <h3 className="font-semibold">{title}</h3>
        <p className="mt-1 text-sm leading-6 opacity-90">{description}</p>
      </div>
    </div>
  );
}
