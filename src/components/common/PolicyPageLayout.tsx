import type { ReactNode } from 'react';
import { PublicBannerImage } from '@/components/common/PublicBannerImage';

interface PolicyPageLayoutProps {
  image: string;
  alt: string;
  title: string;
  description?: string;
  lastUpdated?: string;
  children: ReactNode;
}

export function PolicyPageLayout({
  image,
  alt,
  title,
  description,
  lastUpdated,
  children,
}: PolicyPageLayoutProps) {
  return (
    <div className="bg-white font-body">
      <PublicBannerImage image={image} alt={alt} />

      <section className="py-7 sm:py-8">
        <div className="mx-auto max-w-6xl px-6">
          <div className="max-w-4xl">
            <h1 className="font-display text-2xl font-semibold text-[#1f1f1f]">{title}</h1>
            {lastUpdated ? <p className="mt-2 text-sm text-gray-500">Last updated: {lastUpdated}</p> : null}
            {description ? <p className="mt-3 text-gray-600">{description}</p> : null}
          </div>

          <article className="mt-6 rounded-2xl border bg-white p-5 shadow-card sm:p-6">{children}</article>
        </div>
      </section>
    </div>
  );
}
