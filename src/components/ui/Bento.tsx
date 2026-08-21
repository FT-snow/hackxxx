import type { ReactNode } from 'react';

export function BentoGrid({
  children,
  cols = 3,
  className = '',
}: {
  children: ReactNode;
  cols?: 2 | 3 | 4;
  className?: string;
}) {
  const colClass =
    cols === 2
      ? 'md:grid-cols-2'
      : cols === 4
        ? 'md:grid-cols-2 xl:grid-cols-4'
        : 'md:grid-cols-3';
  return (
    <div
      className={`grid gap-px overflow-hidden rounded-lg border border-white/[0.08] bg-white/[0.08] ${colClass} ${className}`}
    >
      {children}
    </div>
  );
}

export function BentoCard({
  n,
  title,
  children,
  footer,
  className = '',
}: {
  n?: string;
  title: string;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`group flex min-h-[13rem] flex-col justify-between bg-black p-7 hover:bg-[#0a0f0c] ${className}`}
    >
      <div>
        {n && <span className="label-meta text-[#C8A45C]">{n}</span>}
        <h3 className="font-display mt-3 text-xl text-white">{title}</h3>
        {children && (
          <div className="mt-3 text-sm leading-relaxed text-gray-500">
            {children}
          </div>
        )}
      </div>
      {footer && <div className="mt-6">{footer}</div>}
    </div>
  );
}
