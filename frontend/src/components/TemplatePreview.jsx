import React from 'react';
import PropTypes from 'prop-types';

const TemplatePreview = ({ resume }) => {
  if (!resume) {
    return (
      <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900/60 p-6 text-center text-sm text-slate-400">
        Select or start editing a resume to preview it in real time.
      </div>
    );
  }

  const { personalInfo = {}, experiences = [], education = [], skills = [], projects = [] } = resume;
  const hasPhoto = Boolean(personalInfo.photo);

  return (
    <article className="grid gap-6 rounded-xl border border-slate-800 bg-slate-950/60 p-6 text-left text-slate-100 shadow-lg">
      <header className="flex flex-col items-center gap-4 border-b border-slate-800 pb-6 text-center sm:flex-row sm:items-start sm:text-left">
        {hasPhoto ? (
          <div className="flex-shrink-0">
            <img
              src={personalInfo.photo}
              alt={`${personalInfo.fullName || 'Resume'} portrait`}
              className="h-24 w-24 rounded-full border border-indigo-400/40 object-cover shadow-md"
            />
          </div>
        ) : null}
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight text-white">{personalInfo.fullName}</h1>
          <p className="mt-1 text-sm text-slate-300">
            {[personalInfo.email, personalInfo.phone, personalInfo.location, personalInfo.website]
              .filter(Boolean)
              .join(' • ')}
          </p>
          {personalInfo.summary ? (
            <p className="mt-3 text-sm leading-relaxed text-slate-200">{personalInfo.summary}</p>
          ) : null}
        </div>
      </header>

      {experiences.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-indigo-300">Experience</h2>
          <ul className="mt-3 space-y-4 text-sm leading-relaxed">
            {experiences.map((exp) => (
              <li key={`${exp.company}-${exp.role}-${exp.startDate}`} className="rounded-lg bg-slate-900/80 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium text-white">{exp.role}</p>
                    <p className="text-xs uppercase tracking-wide text-indigo-200">{exp.company}</p>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">
                    {[exp.startDate, exp.endDate].filter(Boolean).join(' – ')}
                  </span>
                </div>
                {exp.description ? (
                  <p className="mt-3 whitespace-pre-line text-slate-200">{exp.description}</p>
                ) : null}
                {Array.isArray(exp.achievements) && exp.achievements.length > 0 ? (
                  <ul className="mt-3 list-disc space-y-1 pl-4 text-slate-200">
                    {exp.achievements.map((point, index) => (
                      <li key={index}>{point}</li>
                    ))}
                  </ul>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      )}

      {projects.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-indigo-300">Projects</h2>
          <ul className="mt-3 space-y-3 text-sm leading-relaxed">
            {projects.map((project) => (
              <li key={project.name} className="rounded-lg bg-slate-900/80 p-4">
                <div className="flex flex-col gap-1">
                  <span className="font-medium text-white">
                    {project.link ? (
                      <a href={project.link} target="_blank" rel="noreferrer" className="hover:text-indigo-300">
                        {project.name}
                      </a>
                    ) : (
                      project.name
                    )}
                  </span>
                  <span className="text-xs uppercase tracking-wide text-indigo-200">
                    {project.techStack?.join(' • ')}
                  </span>
                </div>
                {project.description ? (
                  <p className="mt-2 text-slate-200">{project.description}</p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      )}

      {education.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-indigo-300">Education</h2>
          <ul className="mt-3 space-y-3 text-sm leading-relaxed">
            {education.map((edu) => (
              <li key={`${edu.institution}-${edu.degree}`} className="rounded-lg bg-slate-900/80 p-4">
                <p className="font-medium text-white">{edu.degree}</p>
                <p className="text-xs uppercase tracking-wide text-indigo-200">{edu.institution}</p>
                <p className="text-xs text-slate-400">
                  {[edu.startDate, edu.endDate].filter(Boolean).join(' – ')}
                </p>
                {edu.description ? <p className="mt-2 text-slate-200">{edu.description}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      )}

      {skills.length > 0 && (
        <section>
          <h2 className="text-lg font-semibold text-indigo-300">Skills</h2>
          <div className="mt-3 flex flex-wrap gap-2 text-sm">
            {skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-indigo-200"
              >
                {skill}
              </span>
            ))}
          </div>
        </section>
      )}
    </article>
  );
};

TemplatePreview.propTypes = {
  resume: PropTypes.shape({
    personalInfo: PropTypes.shape({
      fullName: PropTypes.string,
      email: PropTypes.string,
      phone: PropTypes.string,
      location: PropTypes.string,
      website: PropTypes.string,
      summary: PropTypes.string,
      photo: PropTypes.string,
    }),
    experiences: PropTypes.arrayOf(
      PropTypes.shape({
        role: PropTypes.string,
        company: PropTypes.string,
        startDate: PropTypes.string,
        endDate: PropTypes.string,
        description: PropTypes.string,
        achievements: PropTypes.arrayOf(PropTypes.string),
      }),
    ),
    education: PropTypes.arrayOf(
      PropTypes.shape({
        institution: PropTypes.string,
        degree: PropTypes.string,
        startDate: PropTypes.string,
        endDate: PropTypes.string,
        description: PropTypes.string,
      }),
    ),
    skills: PropTypes.arrayOf(PropTypes.string),
    projects: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string,
        description: PropTypes.string,
        link: PropTypes.string,
        techStack: PropTypes.arrayOf(PropTypes.string),
      }),
    ),
  }),
};

TemplatePreview.defaultProps = {
  resume: null,
};

export default TemplatePreview;
