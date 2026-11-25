import { useEffect } from 'react';

export interface RouteBreadcrumbItem {
  name: string;
  path: string;
}

export interface RouteSeoMeta {
  title: string;
  description: string;
  canonicalPath: string;
  keywords?: string;
  image?: string;
  breadcrumbs?: RouteBreadcrumbItem[];
}

const SITE_ORIGIN = 'https://rbxc.netlify.app';
const DEFAULT_IMAGE = `${SITE_ORIGIN}/images/rbxc_banner.png`;

function upsertMeta(attrName: 'name' | 'property', attrValue: string, content: string) {
  let el = document.querySelector(`meta[${attrName}="${attrValue}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attrName, attrValue);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function upsertLink(rel: string, href: string, extra?: Record<string, string>) {
  const selector = extra?.hreflang
    ? `link[rel="${rel}"][hreflang="${extra.hreflang}"]`
    : `link[rel="${rel}"]`;
  let el = document.querySelector(selector);
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', rel);
    if (extra) {
      Object.entries(extra).forEach(([k, v]) => el!.setAttribute(k, v));
    }
    document.head.appendChild(el);
  }
  el.setAttribute('href', href);
}

export function usePageSeo(meta: RouteSeoMeta) {
  useEffect(() => {
    document.title = meta.title;

    const canonicalUrl = `${SITE_ORIGIN}${meta.canonicalPath}`;
    const resolvedImage = meta.image ?? DEFAULT_IMAGE;

    upsertMeta('name', 'description', meta.description);
    if (meta.keywords) {
      upsertMeta('name', 'keywords', meta.keywords);
    }

    upsertMeta('property', 'og:title', meta.title);
    upsertMeta('property', 'og:description', meta.description);
    upsertMeta('property', 'og:url', canonicalUrl);
    upsertMeta('property', 'og:image', resolvedImage);

    upsertMeta('name', 'twitter:title', meta.title);
    upsertMeta('name', 'twitter:description', meta.description);
    upsertMeta('name', 'twitter:image', resolvedImage);

    upsertLink('canonical', canonicalUrl);
    upsertLink('alternate', canonicalUrl, { hreflang: 'en' });
    upsertLink('alternate', canonicalUrl, { hreflang: 'ru' });
    upsertLink('alternate', canonicalUrl, { hreflang: 'x-default' });

    const crumbs: RouteBreadcrumbItem[] =
      meta.breadcrumbs ??
      (meta.canonicalPath === '/'
        ? [{ name: 'Hub', path: '/' }]
        : [
            { name: 'Hub', path: '/' },
            { name: meta.title.split('—')[0].trim(), path: meta.canonicalPath }
          ]);

    const jsonLd = {
      '@context': 'https://schema.org',
      '@graph': [
        {
          '@type': 'WebPage',
          name: meta.title,
          description: meta.description,
          url: canonicalUrl,
          isPartOf: {
            '@type': 'WebSite',
            name: 'RBX Calculators',
            url: `${SITE_ORIGIN}/`
          }
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: crumbs.map((c, idx) => ({
            '@type': 'ListItem',
            position: idx + 1,
            name: c.name,
            item: `${SITE_ORIGIN}${c.path}`
          }))
        }
      ]
    };

    let ldScript = document.getElementById('rbxc-route-jsonld') as HTMLScriptElement | null;
    if (!ldScript) {
      ldScript = document.createElement('script');
      ldScript.id = 'rbxc-route-jsonld';
      ldScript.type = 'application/ld+json';
      document.head.appendChild(ldScript);
    }
    ldScript.textContent = JSON.stringify(jsonLd);
  }, [meta.breadcrumbs, meta.canonicalPath, meta.description, meta.image, meta.keywords, meta.title]);
}
