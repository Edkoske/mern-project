import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuth from '../hooks/useAuth';

const featureList = [
  {
    title: 'AI-powered bullet points',
    description: 'Transform your experience into quantified achievements tailored for every role.',
  },
  {
    title: 'Personalized portfolio',
    description: 'Turn your resume into a live portfolio with projects, social links, and case studies.',
  },
  {
    title: 'Export ready',
    description: 'Download polished PDFs in seconds and sync updates instantly across formats.',
  },
];

const Home = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="space-y-16">
      <section className="grid gap-10 rounded-3xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 p-10 shadow-2xl md:grid-cols-2">
        <div className="space-y-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-300">
            AI Resume & Portfolio Studio
          </p>
          <h1 className="text-4xl font-bold tracking-tight text-white sm:text-5xl">
            Ship a hiring-ready resume and portfolio in minutes—not weeks.
          </h1>
          <p className="text-lg leading-relaxed text-slate-300">
            airesume.studio blends ATS-friendly resume templates with an interactive portfolio builder.
            Use Gemini-powered suggestions to elevate every bullet, highlight outcomes, and publish a beautiful personal site.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              to={isAuthenticated ? '/dashboard' : '/register'}
              className="inline-flex items-center rounded-lg bg-indigo-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400"
            >
              {isAuthenticated ? 'Open dashboard' : 'Start for free'}
            </Link>
            {!isAuthenticated && (
              <Link
                to="/login"
                className="inline-flex items-center rounded-lg border border-indigo-400/40 px-5 py-3 text-sm font-semibold text-indigo-200 transition hover:bg-indigo-500/10"
              >
                I already have an account
              </Link>
            )}
          </div>
        </div>
        <motion.div
          className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-slate-950/70 p-6"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
        >
          <p className="text-sm font-semibold uppercase tracking-widest text-indigo-300">Preview</p>
          <p className="mt-4 text-lg font-medium text-white">
            “Scaled conversion by 38% after relaunching onboarding flows and building realtime analytics with a team of 4.”
          </p>
          <div className="mt-6 space-y-2 text-sm text-slate-300">
            <p>• Summarize your impact & quantify outcomes instantly.</p>
            <p>• Tailor portfolio bios for different audiences in one click.</p>
            <p>• Sync updates across resume, PDF, and live site automatically.</p>
          </div>
          <div className="mt-8 grid grid-cols-3 gap-3 text-center text-xs text-indigo-200/80">
            <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-3">
              <p className="text-2xl font-semibold text-white">12+</p>
              <p>ATS templates</p>
            </div>
            <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-3">
              <p className="text-2xl font-semibold text-white">45s</p>
              <p>Average draft</p>
            </div>
            <div className="rounded-lg border border-indigo-500/30 bg-indigo-500/10 p-3">
              <p className="text-2xl font-semibold text-white">100%</p>
              <p>Customizable</p>
            </div>
          </div>
        </motion.div>
      </section>

      <section className="space-y-8">
        <h2 className="text-2xl font-semibold text-white">What you can build</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {featureList.map((feature) => (
            <div
              key={feature.title}
              className="rounded-2xl border border-slate-800 bg-slate-900/50 p-6 shadow-lg transition hover:-translate-y-1 hover:border-indigo-400/50 hover:shadow-indigo-500/20"
            >
              <h3 className="text-lg font-semibold text-white">{feature.title}</h3>
              <p className="mt-3 text-sm leading-relaxed text-slate-300">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Home;