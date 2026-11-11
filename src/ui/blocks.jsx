/** Content renderers shared by the 3D ride's panels and the simple 2D version. */
import { profile, education, skills, projects, experience, contact } from '../content.js';

export function IntroBlock({ Heading = 'h2' }) {
  return (
    <>
      <Heading className="block-title">
        Hi, I&apos;m {profile.name}
      </Heading>
      <p className="lead">{profile.role} · {profile.tagline}</p>
      <p className="muted">📍 {profile.location}</p>
    </>
  );
}

export function AboutBlock({ Heading = 'h2' }) {
  return (
    <>
      <Heading className="block-title">About me</Heading>
      {profile.bio.map((b) => (
        <p key={b}>{b}</p>
      ))}
      <h3 className="block-sub">Education</h3>
      <ul className="edu">
        {education.map((e) => (
          <li key={e.school}>
            <strong>{e.school}</strong>
            <span>
              {e.degree} · {e.detail}
              {e.years && ` · ${e.years}`}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}

export function SkillsBlock({ Heading = 'h2' }) {
  return (
    <>
      <Heading className="block-title">Skills</Heading>
      <div className="skill-groups">
        {skills.map((g) => (
          <div key={g.group}>
            <h3 className="block-sub">{g.group}</h3>
            <ul className="chips">
              {g.items.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </>
  );
}

export function ProjectBlock({ project, Heading = 'h2' }) {
  return (
    <article>
      <Heading className="block-title">{project.name}</Heading>
      <p className="lead">{project.summary}</p>
      <ul className="points">
        {project.highlights.map((h) => (
          <li key={h}>{h}</li>
        ))}
      </ul>
      <ul className="chips" aria-label="Tech stack">
        {project.tech.map((t) => (
          <li key={t}>{t}</li>
        ))}
      </ul>
      {project.link && (
        <a className="btn btn--primary" href={project.link} target="_blank" rel="noopener noreferrer">
          Visit {project.link.replace(/^https?:\/\//, '')} ↗
        </a>
      )}
    </article>
  );
}

export function JobBlock({ job, Heading = 'h2' }) {
  return (
    <article>
      <Heading className="block-title">{job.role}</Heading>
      <p className="lead">
        {job.company} · {job.place}
      </p>
      <p className="muted">{job.period}</p>
      <ul className="points">
        {job.points.map((p) => (
          <li key={p}>{p}</li>
        ))}
      </ul>
    </article>
  );
}

export function ContactLinks() {
  return (
    <div className="contact-links">
      <a className="btn btn--primary" href={`mailto:${contact.email}`}>
        ✉ {contact.email}
      </a>
      <a className="btn" href={contact.github} target="_blank" rel="noopener noreferrer">
        GitHub ↗
      </a>
      <a className="btn" href={contact.linkedin} target="_blank" rel="noopener noreferrer">
        LinkedIn ↗
      </a>
      {contact.resume && (
        <a className="btn" href={contact.resume} target="_blank" rel="noopener noreferrer">
          Résumé (PDF)
        </a>
      )}
      {contact.showPhone && (
        <a className="btn" href={`tel:${contact.phone.replace(/[^+\d]/g, '')}`}>
          ☎ {contact.phone}
        </a>
      )}
    </div>
  );
}

export function ContactBlock({ Heading = 'h2' }) {
  return (
    <>
      <Heading className="block-title">Let&apos;s build something</Heading>
      <p>
        Thanks for riding along! I&apos;m open to full-stack and backend roles and interesting projects. The fastest way to
        reach me is email.
      </p>
      <ContactLinks />
    </>
  );
}

/** Block for a given ride stop (see route.js). */
export function StopBlock({ stop }) {
  switch (stop.section) {
    case 'start':
      return <IntroBlock />;
    case 'about':
      return <AboutBlock />;
    case 'skills':
      return <SkillsBlock />;
    case 'projects':
      return <ProjectBlock project={projects[stop.index]} />;
    case 'experience':
      return <JobBlock job={experience[stop.index]} />;
    case 'contact':
      return <ContactBlock />;
    default:
      return null;
  }
}
