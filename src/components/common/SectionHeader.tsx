interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: 'left' | 'center';
  compact?: boolean;
}

export function SectionHeader({ eyebrow, title, description, align = 'left', compact = false }: SectionHeaderProps) {
  return (
    <div className={align === 'center' ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'}>
      {eyebrow ? <p className="text-sm font-semibold uppercase tracking-[0.28em] text-gold-600">{eyebrow}</p> : null}
      <h2 className={compact ? 'font-display text-2xl font-semibold text-[#1f1f1f]' : 'mt-3 font-display text-4xl font-semibold leading-tight text-ink sm:text-5xl'}>
        {title}
      </h2>
      {description ? <p className={compact ? 'mt-3 text-sm leading-7 text-slate-600' : 'mt-4 text-base leading-7 text-slate-600'}>{description}</p> : null}
    </div>
  );
}
