import { AdSlot } from '../components/AdSlot';
import { useT } from '../i18n';
import { usePageSeo } from '../lib/seo';

export function ArturwolPage() {
  usePageSeo({
    title: 'About arturwol — RBX Calculators',
    description:
      'About arturwol — creator and maintainer of RBX Calculators (RBXC), SPTS Classic, SPTL, and Roblox progression tools.',
    canonicalPath: '/arturwol/'
  });

  const t = useT();

  return (
    <div className="space-y-6">
      <article className="space-y-4 rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-[var(--density-pad)] text-sm leading-relaxed text-[var(--text-secondary)]">
        <header className="border-b border-[var(--border-subtle)] pb-4">
          <h1 className="text-2xl font-extrabold text-[var(--text-primary)]">{t.legal.authorTitle}</h1>
          <p className="mt-1 text-xs">{t.legal.authorSubtitle}</p>
        </header>

        <p>
          {t.legal.authorBio}{' '}
          <a
            href="https://www.roblox.com/games/10661400863"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--accent)] hover:underline"
          >
            {t.legal.authorGameLink}
          </a>
          .
        </p>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">{t.legal.authorProjectsTitle}</h2>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>
              <a
                href="https://github.com/arturwo1/RBXC"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent)] hover:underline"
              >
                github.com/arturwo1/RBXC
              </a>
            </li>
            <li>
              <a
                href="https://github.com/arturwo1"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent)] hover:underline"
              >
                github.com/arturwo1
              </a>
            </li>
            <li>
              <a
                href="https://discord.gg/MXupeAApza"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent)] hover:underline"
              >
                Discord
              </a>
            </li>
            <li>
              <a
                href="https://twitter.com/artnrwol"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[var(--accent)] hover:underline"
              >
                @artnrwol
              </a>
            </li>
          </ul>
        </section>

        <section className="space-y-1">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">{t.legal.authorDisclaimerTitle}</h2>
          <p>{t.legal.authorDisclaimerBody}</p>
        </section>
      </article>

      <AdSlot variant="leaderboard" />
    </div>
  );
}
