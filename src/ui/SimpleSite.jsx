import { useEffect } from 'react';
import { profile, projects, experience } from '../content.js';
import { sections } from '../route.js';
import { store } from '../store.js';
import { IntroBlock, AboutBlock, SkillsBlock, ProjectBlock, JobBlock, ContactBlock } from './blocks.jsx';

/** Plain, accessible, fast version of the whole portfolio. */
export function SimpleSite({ canRide }) {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);
  return (
    <div className="simple">
      <header className="simple__header">
        <a className="brand" href="#start">
          <span className="brand__mark">JR</span>
          <span className="brand__text">
            <strong>{profile.name}</strong>
            <small>{profile.role}</small>
          </span>
        </a>
        <nav aria-label="Sections">
          <ul>
            {sections.slice(1).map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`}>{s.label}</a>
              </li>
            ))}
          </ul>
        </nav>
        {canRide && (
          <button className="btn btn--primary" onClick={() => store.set({ simple: false })}>
            🏍 Take the 3D ride
          </button>
        )}
      </header>

      <main>
        <section id="start" className="simple__hero">
          <IntroBlock Heading="h1" />
        </section>
        <section id="about">
          <AboutBlock />
        </section>
        <section id="skills">
          <SkillsBlock />
        </section>
        <section id="projects">
          <h2 className="block-title">Projects</h2>
          <div className="simple__grid">
            {projects.map((p) => (
              <div className="card" key={p.name}>
                <ProjectBlock project={p} Heading="h3" />
              </div>
            ))}
          </div>
        </section>
        <section id="experience">
          <h2 className="block-title">Experience</h2>
          <ol className="timeline">
            {[...experience].reverse().map((j) => (
              <li key={j.role + j.period}>
                <JobBlock job={j} Heading="h3" />
              </li>
            ))}
          </ol>
        </section>
        <section id="contact">
          <ContactBlock />
        </section>
      </main>
      <footer className="simple__footer">
        © {new Date().getFullYear()} {profile.name} · {profile.location}
      </footer>
    </div>
  );
}
