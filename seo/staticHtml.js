/**
 * Build-time SEO: generates <head> tags and a static, crawlable copy of the
 * portfolio from src/content.js. Used by the Vite plugin in vite.config.js.
 * Visitors with JavaScript never see the static copy — React replaces it.
 */
import { site, profile, education, skills, projects, experience, contact } from '../src/content.js';

const esc = (s = '') =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

export function headTags() {
  const url = site.url.replace(/\/$/, '');
  const image = site.ogImage.startsWith('http') ? site.ogImage : `${url}${site.ogImage}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    jobTitle: profile.role,
    url,
    email: `mailto:${contact.email}`,
    address: { '@type': 'PostalAddress', addressLocality: 'Dhaka', addressCountry: 'BD' },
    alumniOf: education.map((e) => ({ '@type': 'CollegeOrUniversity', name: e.school })),
    knowsAbout: [...new Set(skills.flatMap((g) => g.items))],
    sameAs: [contact.github, contact.linkedin].filter(Boolean),
  };
  return `
    <title>${esc(site.title)}</title>
    <meta name="description" content="${esc(site.description)}" />
    <meta name="author" content="${esc(profile.name)}" />
    <meta name="theme-color" content="${esc(site.themeColor)}" />
    <link rel="canonical" href="${esc(url)}/" />
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="${esc(profile.name)}" />
    <meta property="og:title" content="${esc(site.title)}" />
    <meta property="og:description" content="${esc(site.description)}" />
    <meta property="og:url" content="${esc(url)}/" />
    <meta property="og:image" content="${esc(image)}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(site.title)}" />
    <meta name="twitter:description" content="${esc(site.description)}" />
    <meta name="twitter:image" content="${esc(image)}" />
    <script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, '\\u003c')}</script>`;
}

export function staticBody() {
  const li = (items) => items.map((i) => `<li>${esc(i)}</li>`).join('');
  const link = (href, text) => `<a href="${esc(href)}" rel="noopener noreferrer">${esc(text)}</a>`;
  return `
    <div class="static-seo">
      <header><h1>${esc(profile.name)} — ${esc(profile.role)}</h1><p>${esc(profile.tagline)} · ${esc(profile.location)}</p></header>
      <main>
        <section id="about"><h2>About</h2>${profile.bio.map((b) => `<p>${esc(b)}</p>`).join('')}
          <h3>Education</h3><ul>${education.map((e) => `<li>${esc(e.school)} — ${esc(e.degree)}, ${esc(e.detail)}${e.years ? ` (${esc(e.years)})` : ''}</li>`).join('')}</ul>
        </section>
        <section id="skills"><h2>Skills</h2>${skills.map((g) => `<h3>${esc(g.group)}</h3><ul>${li(g.items)}</ul>`).join('')}</section>
        <section id="projects"><h2>Projects</h2>${projects
          .map(
            (p) => `<article><h3>${esc(p.name)}</h3><p>${esc(p.summary)}</p><ul>${li(p.highlights)}</ul><p>Tech: ${esc(p.tech.join(', '))}</p>${
              p.link ? `<p>${link(p.link, p.link)}</p>` : ''
            }</article>`
          )
          .join('')}</section>
        <section id="experience"><h2>Experience</h2>${[...experience]
          .reverse()
          .map((j) => `<article><h3>${esc(j.role)} — ${esc(j.company)}</h3><p>${esc(j.period)} · ${esc(j.place)}</p><ul>${li(j.points)}</ul></article>`)
          .join('')}</section>
        <section id="contact"><h2>Contact</h2><ul>
          <li><a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a></li>
          <li>${link(contact.github, 'GitHub')}</li>
          <li>${link(contact.linkedin, 'LinkedIn')}</li>
        </ul></section>
      </main>
    </div>`;
}
