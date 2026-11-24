import { Link } from 'react-router-dom';
import { useT } from '../i18n';
import { usePageSeo } from '../lib/seo';

export function NotFoundPage() {
  usePageSeo({
    title: '404 — Page Not Found | RBX Calculators',
    description: 'The requested page could not be found on RBX Calculators.',
    canonicalPath: '/404'
  });

  const t = useT();

  return (
    <div className="mx-auto max-w-lg rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-8 text-center">
      <div className="font-mono text-4xl font-extrabold text-[var(--accent)]">404</div>
      <h1 className="mt-2 text-xl font-bold">{t.legal.notFoundTitle}</h1>
      <p className="mt-2 text-sm text-[var(--text-secondary)]">{t.legal.notFoundDesc}</p>
      <Link
        to="/"
        className="mt-5 inline-flex min-h-[44px] items-center justify-center rounded-[var(--radius-control)] bg-[var(--accent)] px-5 text-sm font-semibold text-[var(--accent-fg)]"
      >
        {t.legal.returnHub}
      </Link>
    </div>
  );
}
