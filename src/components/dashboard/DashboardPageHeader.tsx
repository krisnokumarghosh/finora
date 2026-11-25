import type { ReactNode } from "react";

interface DashboardPageHeaderProps {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  actions?: ReactNode;
}

export default function DashboardPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: DashboardPageHeaderProps) {
  return (
    <div className="flex flex-col gap-3 sm:gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow && (
          <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-black/45 sm:text-xs">
            {eyebrow}
          </p>
        )}
        <h1 className="text-2xl font-extrabold tracking-tight text-black sm:text-3xl lg:text-4xl">
          {title}
        </h1>
        {description && (
          <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-black/60 sm:text-sm">
            {description}
          </p>
        )}
      </div>

      {actions && (
        <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:gap-2.5">
          {actions}
        </div>
      )}
    </div>
  );
}
