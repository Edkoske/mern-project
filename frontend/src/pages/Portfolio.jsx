import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { portfolioApi, resumeApi } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import { downloadPortfolioJson, downloadPortfolioPdf, normalizePortfolio } from '../utils/exportPortfolio';

const createId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const blankPortfolio = {
  headline: '',
  bio: '',
  skills: [],
  socialLinks: {
    github: '',
    linkedin: '',
    twitter: '',
    website: '',
  },
  projects: [],
  featuredResume: '',
  theme: {
    palette: {
      primary: '#6366f1',
      secondary: '#f59e0b',
      accent: '#38bdf8',
    },
    layout: 'classic',
  },
};

const createEmptyProject = () => ({
  clientId: createId(),
  name: '',
  description: '',
  link: '',
  imageUrl: '',
  tags: [],
});

const hydratePortfolio = (data = {}) => {
  const source = data || {};
  return {
    headline: source.headline || '',
    bio: source.bio || '',
    skills: Array.isArray(source.skills) ? [...source.skills] : [],
    socialLinks: {
      github: source.socialLinks?.github || '',
      linkedin: source.socialLinks?.linkedin || '',
      twitter: source.socialLinks?.twitter || '',
      website: source.socialLinks?.website || '',
    },
    projects: Array.isArray(source.projects)
      ? source.projects.map((project) => ({
          ...project,
          tags: Array.isArray(project.tags) ? [...project.tags] : [],
          clientId: project.clientId || createId(),
        }))
      : [],
    featuredResume:
      typeof source.featuredResume === 'object' && source.featuredResume !== null
        ? source.featuredResume
        : source.featuredResume || '',
    theme: {
      palette: {
        primary: source.theme?.palette?.primary || '#6366f1',
        secondary: source.theme?.palette?.secondary || '#f59e0b',
        accent: source.theme?.palette?.accent || '#38bdf8',
      },
      layout: source.theme?.layout || 'classic',
    },
    slug: source.slug || '',
    isPublished: Boolean(source.isPublished),
    publishedAt: source.publishedAt || null,
  };
};

const serializePortfolioForApi = (state) => ({
  headline: state.headline,
  bio: state.bio,
  socialLinks: {
    github: state.socialLinks?.github || '',
    linkedin: state.socialLinks?.linkedin || '',
    twitter: state.socialLinks?.twitter || '',
    website: state.socialLinks?.website || '',
  },
  skills: Array.isArray(state.skills) ? state.skills.filter(Boolean) : [],
  projects: Array.isArray(state.projects)
    ? state.projects.map(({ clientId: _clientId, tags, ...project }) => ({
        ...project,
        tags: Array.isArray(tags) ? tags.filter(Boolean) : [],
      }))
    : [],
  featuredResume:
    state.featuredResume && typeof state.featuredResume === 'object'
      ? state.featuredResume._id
      : state.featuredResume || undefined,
  theme: {
    palette: {
      primary: state.theme?.palette?.primary || '#6366f1',
      secondary: state.theme?.palette?.secondary || '#f59e0b',
      accent: state.theme?.palette?.accent || '#38bdf8',
    },
    layout: state.theme?.layout || 'classic',
  },
});

const formatSlugInput = (value) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');

const Portfolio = () => {
  const [portfolio, setPortfolio] = useState(null);
  const [resumes, setResumes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [exporting, setExporting] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [slugDraft, setSlugDraft] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [portfolioResponse, resumesResponse] = await Promise.all([
          portfolioApi.get().catch(() => null),
          resumeApi.list(),
        ]);
        const initial = portfolioResponse ? hydratePortfolio(portfolioResponse) : hydratePortfolio(blankPortfolio);
        setPortfolio(initial);
        setResumes(resumesResponse);
      } catch (error) {
        toast.error('Unable to load your portfolio.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  useEffect(() => {
    if (portfolio?.slug) {
      setSlugDraft(portfolio.slug);
    } else {
      setSlugDraft('');
    }
  }, [portfolio?.slug]);

  const updatePortfolio = useCallback((updater) => {
    setPortfolio((prev) => {
      const base = prev || hydratePortfolio(blankPortfolio);
      const updates = updater(base);
      return { ...base, ...updates };
    });
  }, []);

  const projects = useMemo(() => portfolio?.projects ?? [], [portfolio?.projects]);
  const skills = useMemo(() => portfolio?.skills ?? [], [portfolio?.skills]);
  const normalizedPortfolio = useMemo(
    () => (portfolio ? normalizePortfolio(portfolio) : null),
    [portfolio],
  );
  const isPublished = Boolean(portfolio?.isPublished);
  const origin = typeof window !== 'undefined' ? window.location.origin : '';
  const shareUrl = portfolio?.slug ? `${origin}/p/${portfolio.slug}` : '';

  const handleSkillAdd = () => {
    if (!newSkill.trim()) return;
    const values = newSkill
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    if (!values.length) return;
    updatePortfolio((prev) => ({
      skills: Array.from(new Set([...(prev.skills || []), ...values])),
    }));
    setNewSkill('');
  };

  const handleSkillRemove = (skill) => {
    updatePortfolio((prev) => ({
      skills: prev.skills.filter((item) => item !== skill),
    }));
  };

  const handleProjectChange = (clientId, field, value) => {
    updatePortfolio((prev) => ({
      projects: prev.projects.map((project) =>
        project.clientId === clientId ? { ...project, [field]: value } : project,
      ),
    }));
  };

  const handleProjectTags = (clientId, value) => {
    handleProjectChange(
      clientId,
      'tags',
      value
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
    );
  };

  const handleProjectRemove = (clientId) => {
    updatePortfolio((prev) => ({
      projects: prev.projects.filter((project) => project.clientId !== clientId),
    }));
  };

  const handleProjectAdd = () => {
    updatePortfolio((prev) => ({
      projects: [...prev.projects, createEmptyProject()],
    }));
  };

  const handleFeaturedResumeSelect = useCallback(
    (resumeId) => {
      if (!resumeId) {
        updatePortfolio(() => ({ featuredResume: '' }));
        return;
      }
      const selected = resumes.find((resume) => resume._id === resumeId);
      updatePortfolio(() => ({ featuredResume: selected || resumeId }));
    },
    [resumes, updatePortfolio],
  );

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!portfolio) return;
    setSaving(true);
    try {
      const payload = serializePortfolioForApi(portfolio);
      const response = await portfolioApi.upsert(payload);
      setPortfolio(hydratePortfolio(response));
      toast.success('Portfolio saved');
    } catch (error) {
      toast.error(error.message || 'Could not save portfolio');
    } finally {
      setSaving(false);
    }
  };

  const handlePublish = async () => {
    if (!portfolio) return;
    setPublishing(true);
    try {
      const payload = {
        slug: slugDraft || undefined,
        portfolio: serializePortfolioForApi(portfolio),
      };
      const response = await portfolioApi.publish(payload);
      setPortfolio(hydratePortfolio(response));
      toast.success('Portfolio is live!');
    } catch (error) {
      toast.error(error.message || 'Could not publish portfolio');
    } finally {
      setPublishing(false);
    }
  };

  const handleUnpublish = async () => {
    if (!portfolio) return;
    setPublishing(true);
    try {
      const response = await portfolioApi.unpublish();
      setPortfolio(hydratePortfolio(response));
      toast.success('Portfolio is now offline.');
    } catch (error) {
      toast.error(error.message || 'Could not unpublish portfolio');
    } finally {
      setPublishing(false);
    }
  };

  const handleExport = async (type) => {
    if (!normalizedPortfolio) {
      toast.error('Add some portfolio content before exporting.');
      return;
    }
    setExporting(true);
    try {
      if (type === 'pdf') {
        await downloadPortfolioPdf(normalizedPortfolio);
        toast.success('Portfolio PDF ready.');
      } else if (type === 'json') {
        downloadPortfolioJson(normalizedPortfolio);
        toast.success('Portfolio JSON downloaded.');
      }
    } catch (error) {
      toast.error(error.message || 'Could not export your portfolio.');
    } finally {
      setExporting(false);
    }
  };

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Share link copied');
    } catch (error) {
      toast.error('Could not copy link. Copy it manually instead.');
    }
  };

  const handleSlugInputChange = (value) => {
    setSlugDraft(formatSlugInput(value));
  };

  if (loading || !portfolio) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner label="Loading portfolio builder" />
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold text-white">Portfolio settings</h1>
            <p className="mt-2 text-sm text-slate-300">
              Keep your resume and live portfolio in sync. Publish your skills, projects, and featured resume in one
              place.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleExport('pdf')}
              disabled={exporting}
              className="inline-flex items-center gap-2 rounded-md border border-indigo-500/40 px-3 py-2 text-sm font-medium text-indigo-200 transition hover:bg-indigo-500/10 disabled:opacity-50"
            >
              {exporting ? <LoadingSpinner /> : '⬇'}
              <span>Download PDF</span>
            </button>
            <button
              type="button"
              onClick={() => handleExport('json')}
              disabled={exporting}
              className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-sm font-medium text-slate-100 transition hover:bg-slate-800 disabled:opacity-50"
            >
              Export JSON
            </button>
          </div>
        </div>
        <div className="mt-6 space-y-3">
          {isPublished ? (
            <div className="rounded-2xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-emerald-100">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold">Your portfolio is live</p>
                  {shareUrl ? (
                    <a
                      href={shareUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-2 text-xs text-emerald-200 underline underline-offset-4"
                    >
                      {shareUrl}
                    </a>
                  ) : null}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="rounded-md border border-emerald-500/60 px-3 py-1.5 text-xs font-medium text-emerald-100 transition hover:bg-emerald-500/20"
                  >
                    Copy link
                  </button>
                  <button
                    type="button"
                    onClick={handleUnpublish}
                    disabled={publishing}
                    className="rounded-md border border-red-500/40 px-3 py-1.5 text-xs font-medium text-red-200 transition hover:bg-red-500/10 disabled:opacity-50"
                  >
                    {publishing ? 'Unpublishing…' : 'Unpublish'}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-sm text-slate-200">
              <p className="text-sm text-slate-200">
                Publish your portfolio to generate a shareable public page. You can unpublish anytime.
              </p>
              <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end">
                <label className="flex-1 text-xs text-slate-300">
                  <span className="block text-xs font-medium uppercase tracking-wide text-indigo-200">
                    Custom URL slug
                  </span>
                  <div className="mt-2 flex items-center overflow-hidden rounded-md border border-slate-700 bg-slate-950">
                    <span className="hidden px-3 py-2 text-xs text-slate-500 sm:inline-flex">
                      {origin ? `${origin}/p/` : '/p/'}
                    </span>
                    <input
                      value={slugDraft}
                      onChange={(event) => handleSlugInputChange(event.target.value)}
                      placeholder="your-name"
                      className="w-full bg-transparent px-3 py-2 text-sm text-slate-100 outline-none placeholder:text-slate-600"
                    />
                  </div>
                  <span className="mt-2 block text-[11px] text-slate-500">
                    Leave blank to auto-generate from your profile.
                  </span>
                </label>
                <button
                  type="button"
                  onClick={handlePublish}
                  disabled={publishing}
                  className="inline-flex items-center justify-center rounded-md bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-60"
                >
                  {publishing ? 'Publishing…' : 'Publish'}
                </button>
              </div>
            </div>
          )}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-white">Hero</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-slate-300">
            <span className="block text-xs font-medium uppercase tracking-wide text-indigo-200">
              Headline
            </span>
            <input
              value={portfolio.headline}
              onChange={(event) => updatePortfolio(() => ({ headline: event.target.value }))}
              className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none"
              placeholder="Product Designer crafting inclusive experiences"
            />
          </label>
          <label className="text-sm text-slate-300">
            <span className="block text-xs font-medium uppercase tracking-wide text-indigo-200">
              Featured resume
            </span>
            <select
              value={
                typeof portfolio.featuredResume === 'object' && portfolio.featuredResume !== null
                  ? portfolio.featuredResume._id || ''
                  : portfolio.featuredResume || ''
              }
              onChange={(event) => handleFeaturedResumeSelect(event.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none"
            >
              <option value="">— Select resume —</option>
              {resumes.map((resume) => (
                <option value={resume._id} key={resume._id}>
                  {resume.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label className="mt-4 block text-sm text-slate-300">
          <span className="block text-xs font-medium uppercase tracking-wide text-indigo-200">
            Bio
          </span>
          <textarea
            value={portfolio.bio}
            onChange={(event) => updatePortfolio(() => ({ bio: event.target.value }))}
            rows={5}
            className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none"
            placeholder="Write a short introduction that highlights your unique strengths."
          />
        </label>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-white">Social links</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {Object.entries(portfolio.socialLinks || blankPortfolio.socialLinks).map(([key, value]) => (
            <label key={key} className="text-sm text-slate-300">
              <span className="block text-xs font-medium uppercase tracking-wide text-indigo-200">
                {key}
              </span>
              <input
                value={value}
                onChange={(event) =>
                  updatePortfolio((prev) => ({
                    socialLinks: { ...prev.socialLinks, [key]: event.target.value },
                  }))
                }
                placeholder={`https://${key}.com/username`}
                className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none"
              />
            </label>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Skills</h2>
          <span className="text-xs text-slate-400">{skills.length} added</span>
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          {skills.map((skill) => (
            <span
              key={skill}
              className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-sm text-indigo-100"
            >
              {skill}
              <button
                type="button"
                onClick={() => handleSkillRemove(skill)}
                className="text-xs text-indigo-200 transition hover:text-white"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          <input
            value={newSkill}
            onChange={(event) => setNewSkill(event.target.value)}
            placeholder="Add a skill or comma separated list"
            className="w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none sm:flex-1"
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleSkillAdd();
              }
            }}
          />
          <button
            type="button"
            onClick={handleSkillAdd}
            className="rounded-lg border border-indigo-500/40 px-4 py-2 text-sm font-medium text-indigo-200 transition hover:bg-indigo-500/10"
          >
            + Add skill
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Projects</h2>
          <button
            type="button"
            onClick={handleProjectAdd}
            className="rounded-lg border border-indigo-500/40 px-4 py-2 text-sm font-medium text-indigo-200 transition hover:bg-indigo-500/10"
          >
            + Add project
          </button>
        </div>
        {projects.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-slate-700 p-6 text-sm text-slate-400">
            Showcase your best work. Include a short summary, tech stack, and results achieved.
          </div>
        ) : (
          <div className="mt-6 space-y-6">
            {projects.map((project) => (
              <div key={project.clientId} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-indigo-200">Project</h3>
                  <button
                    type="button"
                    onClick={() => handleProjectRemove(project.clientId)}
                    className="rounded-md border border-red-500/30 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500/10"
                  >
                    Remove
                  </button>
                </div>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="text-sm text-slate-300">
                    <span className="block text-xs font-medium uppercase tracking-wide text-indigo-200">
                      Name
                    </span>
                    <input
                      value={project.name}
                      onChange={(event) => handleProjectChange(project.clientId, 'name', event.target.value)}
                      className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none"
                      placeholder="Realtime collaboration dashboard"
                    />
                  </label>
                  <label className="text-sm text-slate-300">
                    <span className="block text-xs font-medium uppercase tracking-wide text-indigo-200">
                      Live link or repo
                    </span>
                    <input
                      value={project.link}
                      onChange={(event) => handleProjectChange(project.clientId, 'link', event.target.value)}
                      className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none"
                      placeholder="https://github.com/username/project"
                    />
                  </label>
                </div>
                <label className="mt-4 block text-sm text-slate-300">
                  <span className="block text-xs font-medium uppercase tracking-wide text-indigo-200">
                    Cover image URL
                  </span>
                  <input
                    value={project.imageUrl}
                    onChange={(event) => handleProjectChange(project.clientId, 'imageUrl', event.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none"
                    placeholder="https://images.site/project-cover.jpg"
                  />
                </label>
                <label className="mt-4 block text-sm text-slate-300">
                  <span className="block text-xs font-medium uppercase tracking-wide text-indigo-200">
                    Description
                  </span>
                  <textarea
                    value={project.description}
                    onChange={(event) => handleProjectChange(project.clientId, 'description', event.target.value)}
                    rows={3}
                    className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none"
                    placeholder="Summarize the project goals, scope, and measurable impact."
                  />
                </label>
                <label className="mt-4 block text-sm text-slate-300">
                  <span className="block text-xs font-medium uppercase tracking-wide text-indigo-200">
                    Tags (comma separated)
                  </span>
                  <input
                    value={project.tags?.join(', ') ?? ''}
                    onChange={(event) => handleProjectTags(project.clientId, event.target.value)}
                    className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none"
                    placeholder="React, Node.js, GraphQL"
                  />
                </label>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-white">Theme</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {['primary', 'secondary', 'accent'].map((key) => (
            <label key={key} className="text-sm text-slate-300">
              <span className="block text-xs font-medium uppercase tracking-wide text-indigo-200">
                {key} color
              </span>
              <input
                type="color"
                value={portfolio.theme?.palette?.[key] ?? blankPortfolio.theme.palette[key]}
                onChange={(event) =>
                  updatePortfolio((prev) => ({
                    theme: {
                      ...prev.theme,
                      palette: { ...prev.theme.palette, [key]: event.target.value },
                    },
                  }))
                }
                className="mt-2 h-12 w-full rounded-lg border border-slate-800 bg-slate-950"
              />
            </label>
          ))}
        </div>
        <label className="mt-4 block text-sm text-slate-300">
          <span className="block text-xs font-medium uppercase tracking-wide text-indigo-200">
            Layout
          </span>
          <select
            value={portfolio.theme?.layout ?? 'classic'}
            onChange={(event) =>
              updatePortfolio((prev) => ({
                theme: { ...prev.theme, layout: event.target.value },
              }))
            }
            className="mt-2 w-full rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none"
          >
            <option value="classic">Classic</option>
            <option value="split">Split</option>
            <option value="minimal">Minimal</option>
          </select>
        </label>
      </section>

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-5 py-2 font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-60"
        >
          {saving ? <LoadingSpinner /> : 'Save portfolio'}
        </button>
      </div>
    </form>
  );
};

export default Portfolio;


