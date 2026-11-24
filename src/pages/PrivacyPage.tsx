import { AdSlot } from '../components/AdSlot';
import { useT } from '../i18n';
import { usePageSeo } from '../lib/seo';

export function PrivacyPage() {
  usePageSeo({
    title: 'Privacy Policy — RBX Calculators',
    description:
      'RBX Calculators Privacy Policy — how we handle user data, cookies, localStorage, analytics, GDPR, US state privacy laws, and proprietary license terms.',
    canonicalPath: '/privacy/'
  });

  const t = useT();

  return (
    <div className="space-y-6">
      <article className="space-y-4 rounded-[var(--radius-card)] border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-[var(--density-pad)] text-sm leading-relaxed text-[var(--text-secondary)]">
        <header className="border-b border-[var(--border-subtle)] pb-4">
          <h1 className="text-2xl font-extrabold text-[var(--text-primary)]">{t.legal.privacyTitle}</h1>
          <p className="mt-1 text-xs">{t.legal.effectiveDate}</p>
        </header>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">{t.legal.summaryTitle}</h2>
          <p>{t.legal.summaryBody}</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">{t.legal.dataTitle}</h2>
          <ul className="list-disc space-y-1 pl-5">
            <li>{t.legal.dataHosting}</li>
            <li>{t.legal.dataStorage}</li>
            <li>{t.legal.dataUser}</li>
          </ul>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">{t.legal.cookiesTitle}</h2>
          <p>{t.legal.cookiesBody}</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">{t.legal.rightsTitle}</h2>
          <p>{t.legal.rightsBody}</p>
        </section>

        <section className="space-y-2">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">{t.legal.licenseTitle}</h2>
          <pre className="overflow-x-auto rounded-[var(--radius-control)] border border-[var(--border-subtle)] bg-[var(--bg-canvas)] p-4 font-mono text-xs leading-relaxed text-[var(--text-primary)]">
{`PROPRIETARY LICENSE — RBXC

Copyright (c) 2025 arturwol (GitHub: arturwo1)
All rights reserved.

1. Grant of rights
   You are granted permission to view the RBXC website at https://rbxc.netlify.app and review the public repository code for personal, non-commercial purposes only.

2. Restrictions
   Without prior written permission from the author, you may not:
     • copy, fork, or redistribute the repository or its contents;
     • modify, adapt, or create derivative works from the code;
     • deploy or host the site (or any substantial portion of it) on any other domain, server, or platform;
     • use the code to build competing or derivative projects;
     • remove or alter any copyright, trademark, or proprietary notices contained in the files.

3. Enforcement
   The author reserves the right to issue takedown notices (including DMCA), request removal of infringing content, and pursue other legal remedies.

4. Warranty & liability
   The code and site are provided "AS IS", without warranty of any kind.

5. Governing law
   These terms are governed by the laws of European Union.`}
          </pre>
        </section>

        <section className="space-y-1">
          <h2 className="text-lg font-bold text-[var(--text-primary)]">{t.legal.contactTitle}</h2>
          <p>
            <a
              href="https://github.com/arturwo1/RBXC"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent)] hover:underline"
            >
              github.com/arturwo1/RBXC
            </a>{' '}
            ·{' '}
            <a
              href="https://discord.gg/MXupeAApza"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[var(--accent)] hover:underline"
            >
              Discord
            </a>
          </p>
        </section>
      </article>

      <AdSlot variant="leaderboard" />
    </div>
  );
}
