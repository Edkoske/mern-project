import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { resumeApi, portfolioApi, aiApi } from '../services/api';
import useAuth from '../hooks/useAuth';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [resumes, setResumes] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [bioGenerating, setBioGenerating] = useState(false);

  const hasPortfolio = useMemo(() => Boolean(portfolio?._id), [portfolio]);

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [resumeResponse, portfolioResponse] = await Promise.allSettled([
          resumeApi.list(),
          portfolioApi.get(),
        ]);

        if (resumeResponse.status === 'fulfilled') {
          setResumes(resumeResponse.value);
        }
        if (portfolioResponse.status === 'fulfilled') {
          setPortfolio(portfolioResponse.value);
        }
      } catch (error) {
        toast.error('Unable to load your workspace');
      } finally {
        setLoading(false);
      }
    };

    bootstrap();
  }, []);

  const handleCreateResume = async () => {
    setCreating(true);
    try {
      const response = await resumeApi.create({
        title: `Resume - ${new Date().toLocaleDateString()}`,
        personalInfo: {
          fullName: user?.name ?? '',
          email: '',
          phone: '',
          location: '',
          website: '',
          summary: '',
        },
        experiences: [],
        education: [],
        skills: [],
        projects: [],
      });
      setResumes((prev) => [response, ...prev]);
      toast.success('New resume draft ready');
      navigate(`/editor/${response._id}`);
    } catch (error) {
      toast.error(error.message || 'Could not create a resume');
    } finally {
      setCreating(false);
    }
  };

  const handleGenerateBio = async () => {
    if (!portfolio || !portfolio.skills?.length) {
      toast.error('Add skills to your portfolio before generating a bio.');
      return;
    }
    setBioGenerating(true);
    try {
      const { content } = await aiApi.generatePortfolioIntro({
        profession: portfolio.headline || 'Product Designer',
        skills: portfolio.skills,
        tone: 'friendly',
      });
      const updated = await portfolioApi.upsert({ ...portfolio, bio: content });
      setPortfolio(updated);
      toast.success('Fresh bio crafted with Gemini');
    } catch (error) {
      toast.error(error.message || 'Could not generate a bio right now');
    } finally {
      setBioGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner label="Loading your workspace" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-slate-800 bg-slate-900/70 p-6 shadow-xl sm:p-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-indigo-300">Dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">Welcome back, {user?.name?.split(' ')[0]}</h1>
            <p className="mt-2 text-sm text-slate-300">
              Manage your resumes, generate polished bullet points, and publish a portfolio in minutes.
            </p>
          </div>
          <button
            type="button"
            onClick={handleCreateResume}
            disabled={creating}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2 font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-60"
          >
            {creating ? <LoadingSpinner /> : '＋'}
            New resume
          </button>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Resumes</h2>
              <p className="text-sm text-slate-400">Keep everything organized and versioned.</p>
            </div>
            <span className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold text-indigo-200">
              {resumes.length} drafts
            </span>
          </div>

          {resumes.length === 0 ? (
            <div className="mt-6 rounded-xl border border-dashed border-slate-700 p-6 text-sm text-slate-400">
              You don’t have any resumes yet. Click “New resume” to generate a tailored template with your details.
            </div>
          ) : (
            <ul className="mt-6 space-y-3">
              {resumes.map((resume) => (
                <li
                  key={resume._id}
                  className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/60 p-4 transition hover:border-indigo-400/40"
                >
                  <div>
                    <p className="text-sm font-semibold text-white">{resume.title}</p>
                    <p className="text-xs text-slate-400">
                      Updated {new Date(resume.updatedAt).toLocaleString()}
                    </p>
                  </div>
                  <Link
                    to={`/editor/${resume._id}`}
                    className="rounded-lg border border-indigo-500/40 px-3 py-1.5 text-xs font-semibold text-indigo-200 transition hover:bg-indigo-500/10"
                  >
                    Edit
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-white">Portfolio</h2>
              <p className="text-sm text-slate-400">
                {hasPortfolio ? 'Preview and tweak your live portfolio.' : 'Launch a polished portfolio site in minutes.'}
              </p>
            </div>
            <Link
              to="/portfolio"
              className="rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-indigo-400"
            >
              {hasPortfolio ? 'Edit' : 'Create'}
            </Link>
          </div>

          {hasPortfolio ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4">
                <p className="text-sm font-semibold text-white">{portfolio.headline || 'Untitled headline'}</p>
                <p className="mt-2 text-sm text-slate-300">
                  {portfolio.bio ? portfolio.bio : 'Add a bio to introduce yourself with confidence.'}
                </p>
              </div>
              <div className="flex flex-wrap gap-2 text-xs">
                {portfolio.skills?.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-indigo-200"
                  >
                    {skill}
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={handleGenerateBio}
                disabled={bioGenerating}
                className="inline-flex items-center gap-2 rounded-lg border border-indigo-500/40 px-3 py-2 text-xs font-semibold text-indigo-200 transition hover:bg-indigo-500/10 disabled:opacity-60"
              >
                {bioGenerating ? <LoadingSpinner /> : '✨'}
                Generate portfolio bio
              </button>
            </div>
          ) : (
            <div className="mt-6 rounded-xl border border-dashed border-slate-700 p-6 text-sm text-slate-400">
              Add your skills and featured projects to publish a live portfolio alongside your resume.
            </div>
          )}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;