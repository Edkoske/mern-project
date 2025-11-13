import React, { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import LoadingSpinner from '../components/LoadingSpinner';
import { portfolioApi } from '../services/api';
import { normalizePortfolio } from '../utils/exportPortfolio';

const PublicPortfolio = () => {
  const { slug } = useParams();
  const [portfolio, setPortfolio] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const response = await portfolioApi.getPublic(slug);
        if (!isMounted) return;
        setPortfolio(normalizePortfolio(response));
      } catch (err) {
        if (!isMounted) return;
        setError(err.message || 'Unable to load portfolio');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [slug]);

  const palette = useMemo(() => {
    const theme = portfolio?.theme?.palette ?? {};
    return {
      primary: theme.primary || '#6366f1',
      secondary: theme.secondary || '#f59e0b',
      accent: theme.accent || '#38bdf8',
    };
  }, [portfolio?.theme?.palette]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner label="Loading portfolio" />
      </div>
    );
  }

  if (error || !portfolio) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-red-500/30 bg-red-500/5 p-6 text-center text-red-200">
        <h1 className="text-xl font-semibold">Portfolio not available</h1>
        <p className="mt-2 text-sm text-red-100/80">{error || 'The requested portfolio could not be found.'}</p>
      </div>
    );
  }

  const { headline, bio, socialLinks, skills, projects, featuredResume, ownerName } = portfolio;

  return (
    <div className="space-y-10">
      <section
        className="rounded-3xl border border-slate-800 bg-slate-900/70 p-8 text-center shadow-xl"
        style={{ borderColor: palette.primary }}
      >
        <h1 className="text-3xl font-semibold text-white">{headline}</h1>
        {ownerName ? <p className="mt-2 text-sm uppercase tracking-wide text-slate-300">By {ownerName}</p> : null}
        {bio ? <p className="mt-4 text-base leading-relaxed text-slate-200">{bio}</p> : null}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {Object.entries(socialLinks)
            .filter(([, value]) => value)
            .map(([label, value]) => (
              <a
                key={label}
                href={value}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 rounded-full border border-slate-700 px-4 py-2 text-sm text-indigo-100 transition hover:border-indigo-400 hover:text-white"
                style={{ borderColor: palette.accent }}
              >
                <span className="capitalize">{label}</span>
              </a>
            ))}
        </div>
      </section>

      {skills.length ? (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-white" style={{ color: palette.primary }}>
            Skills
          </h2>
          <div className="mt-4 flex flex-wrap gap-2">
            {skills.map((skill) => (
              <span
                key={skill}
                className="rounded-full border border-indigo-500/30 px-3 py-1 text-sm text-indigo-100"
                style={{
                  borderColor: palette.accent,
                  color: palette.accent,
                  backgroundColor: `${palette.accent}1a`,
                }}
              >
                {skill}
              </span>
            ))}
          </div>
        </section>
      ) : null}

      {projects.length ? (
        <section className="space-y-4">
          <h2 className="text-lg font-semibold text-white" style={{ color: palette.primary }}>
            Projects
          </h2>
          <div className="grid gap-5 md:grid-cols-2">
            {projects.map((project) => (
              <article
                key={`${project.name}-${project.link}`}
                className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-lg transition hover:border-indigo-500/40"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">{project.name}</h3>
                    {project.link ? (
                      <a
                        href={project.link}
                        target="_blank"
                        rel="noreferrer"
                        className="text-sm text-indigo-300 underline underline-offset-4 hover:text-indigo-200"
                      >
                        Visit project
                      </a>
                    ) : null}
                  </div>
                </div>
                {project.imageUrl ? (
                  <div className="mt-4 overflow-hidden rounded-xl border border-slate-800">
                    <img
                      src={project.imageUrl}
                      alt={`${project.name} cover`}
                      className="h-40 w-full object-cover"
                    />
                  </div>
                ) : null}
                {project.description ? (
                  <p className="mt-4 text-sm leading-relaxed text-slate-200">{project.description}</p>
                ) : null}
                {project.tags?.length ? (
                  <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-300">
                    {project.tags.map((tag) => (
                      <span key={tag} className="rounded-full border border-slate-700 px-2 py-1">
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {featuredResume ? (
        <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
          <h2 className="text-lg font-semibold text-white" style={{ color: palette.primary }}>
            Featured Resume
          </h2>
          <div className="mt-3">
            <p className="text-sm font-semibold text-slate-200">{featuredResume.title}</p>
            {featuredResume.personalInfo?.fullName ? (
              <p className="text-sm text-slate-400">{featuredResume.personalInfo.fullName}</p>
            ) : null}
            {featuredResume.personalInfo?.summary ? (
              <p className="mt-3 text-sm leading-relaxed text-slate-200">
                {featuredResume.personalInfo.summary}
              </p>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
};

export default PublicPortfolio;


