import React, { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import toast from 'react-hot-toast';
import { aiApi } from '../services/api';
import LoadingSpinner from './LoadingSpinner';

const createId = () =>
  typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2);

const createEmptyExperience = () => ({
  clientId: createId(),
  role: '',
  company: '',
  startDate: '',
  endDate: '',
  description: '',
  achievements: [],
});

const createEmptyEducation = () => ({
  clientId: createId(),
  institution: '',
  degree: '',
  startDate: '',
  endDate: '',
  description: '',
});

const createEmptyProject = () => ({
  clientId: createId(),
  name: '',
  description: '',
  link: '',
  techStack: [],
});

const baseResume = {
  title: 'Untitled Resume',
  personalInfo: {
    fullName: '',
    email: '',
    phone: '',
    location: '',
    website: '',
    summary: '',
    photo: '',
  },
  experiences: [createEmptyExperience()],
  education: [],
  skills: [],
  projects: [],
};

const buildInitialState = (initialData) => {
  if (!initialData) {
    return baseResume;
  }

  const withClientIds = (items, builder) =>
    (items?.length ? items : []).map((item) => ({
      ...builder(),
      ...item,
      clientId: item.clientId || createId(),
    }));

  return {
    ...baseResume,
    ...initialData,
    personalInfo: { ...baseResume.personalInfo, ...initialData.personalInfo },
    experiences: withClientIds(initialData.experiences, createEmptyExperience),
    education: withClientIds(initialData.education, createEmptyEducation),
    projects: withClientIds(initialData.projects, createEmptyProject),
    skills: initialData.skills || [],
  };
};

const ResumeForm = ({
  initialData,
  onSave,
  onDelete,
  onChange,
  isSaving,
  isDeleting,
  extraActions,
}) => {
  const [form, setForm] = useState(() => buildInitialState(initialData));
  const [aiBusy, setAiBusy] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  const [photoError, setPhotoError] = useState('');

  useEffect(() => {
    setForm(buildInitialState(initialData));
  }, [initialData]);

  useEffect(() => {
    onChange?.({
      ...form,
      experiences: (form.experiences ?? []).map(({ clientId, ...rest }) => rest),
      education: (form.education ?? []).map(({ clientId, ...rest }) => rest),
      projects: (form.projects ?? []).map(({ clientId, ...rest }) => rest),
    });
  }, [form, onChange]);

  const experiences = useMemo(() => form.experiences ?? [], [form.experiences]);
  const education = useMemo(() => form.education ?? [], [form.education]);
  const projects = useMemo(() => form.projects ?? [], [form.projects]);
  const skills = useMemo(() => form.skills ?? [], [form.skills]);

  const updatePersonalInfo = useCallback((event) => {
    const { name, value } = event.target;
    if (name === 'photo') {
      setPhotoError('');
    }
    setForm((prev) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, [name]: value },
    }));
  }, []);

  const handlePhotoUpload = useCallback((event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const MAX_SIZE = 512 * 1024; // 512 KB to stay under Express JSON limit once base64 encoded

    if (!file.type.startsWith('image/')) {
      setPhotoError('Please choose a valid image file.');
      toast.error('Only image uploads are supported.');
      event.target.value = '';
      return;
    }

    if (file.size > MAX_SIZE) {
      setPhotoError('Choose an image smaller than 512 KB.');
      toast.error('Profile photo must be under 512 KB.');
      event.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;

      if (typeof result === 'string') {
        setForm((prev) => ({
          ...prev,
          personalInfo: { ...prev.personalInfo, photo: result },
        }));
        setPhotoError('');
      } else {
        toast.error('Could not read the selected image.');
      }
    };
    reader.onerror = () => {
      toast.error('Could not read the selected image.');
    };

    reader.readAsDataURL(file);
    event.target.value = '';
  }, []);

  const handlePhotoRemove = useCallback(() => {
    setForm((prev) => ({
      ...prev,
      personalInfo: { ...prev.personalInfo, photo: '' },
    }));
    setPhotoError('');
  }, []);

  const updateField = useCallback((key, clientId, event) => {
    const { name, value } = event.target;
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].map((item) =>
        item.clientId === clientId ? { ...item, [name]: value } : item,
      ),
    }));
  }, []);

  const updateArrayField = useCallback((key, clientId, updater) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].map((item) =>
        item.clientId === clientId ? { ...item, ...updater(item) } : item,
      ),
    }));
  }, []);

  const addItem = useCallback((key, builder) => {
    setForm((prev) => ({
      ...prev,
      [key]: [...prev[key], builder()],
    }));
  }, []);

  const removeItem = useCallback((key, clientId) => {
    setForm((prev) => ({
      ...prev,
      [key]: prev[key].filter((item) => item.clientId !== clientId),
    }));
  }, []);

  const handleSkillAppend = useCallback(() => {
    if (!newSkill.trim()) return;
    const values = newSkill
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
    if (!values.length) return;
    setForm((prev) => ({
      ...prev,
      skills: Array.from(new Set([...prev.skills, ...values])),
    }));
    setNewSkill('');
  }, [newSkill]);

  const handleSkillRemove = useCallback((skill) => {
    setForm((prev) => ({
      ...prev,
      skills: prev.skills.filter((item) => item !== skill),
    }));
  }, []);

  const handleAiImprove = useCallback(
    async ({ prompt, context }) => {
      if (!prompt?.trim()) {
        toast.error('Provide some text before asking the AI.');
        return null;
      }
      setAiBusy(true);
      try {
        const { content, isFallback } = await aiApi.improveContent({ prompt, context });
        if (isFallback) {
          toast.success('Gemini key not configured. Showing fallback template.');
        } else {
          toast.success('AI suggestion ready');
        }
        return content;
      } catch (error) {
        toast.error(error.message || 'Failed to get AI suggestion');
        return null;
      } finally {
        setAiBusy(false);
      }
    },
    [],
  );

  const handleSummaryImprove = useCallback(async () => {
    const suggestion = await handleAiImprove({
      prompt: form.personalInfo.summary,
      context:
        'Rewrite this resume professional summary to highlight impact, include specific metrics, and keep it under 80 words.',
    });
    if (suggestion) {
      setForm((prev) => ({
        ...prev,
        personalInfo: { ...prev.personalInfo, summary: suggestion },
      }));
    }
  }, [form.personalInfo.summary, handleAiImprove]);

  const handleExperienceImprove = useCallback(
    async (experience) => {
      const suggestion = await handleAiImprove({
        prompt: experience.description,
        context:
          'Rewrite these work experience bullet points to be quantified, concise, and action-oriented. Provide bullet points separated by new lines.',
      });
      if (suggestion) {
        updateArrayField('experiences', experience.clientId, () => ({
          description: suggestion,
        }));
      }
    },
    [handleAiImprove, updateArrayField],
  );

  const handleSubmit = useCallback(
    (event) => {
      event.preventDefault();
      onSave?.({
        ...form,
        experiences: experiences.map(({ clientId, ...rest }) => rest),
        education: education.map(({ clientId, ...rest }) => rest),
        projects: projects.map(({ clientId, ...rest }) => ({
          ...rest,
          techStack: rest.techStack?.filter(Boolean) ?? [],
        })),
      });
    },
    [education, experiences, form, onSave, projects],
  );

  return (
    <form onSubmit={handleSubmit} className="grid gap-6">
      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-indigo-300">
              Resume Title
            </label>
            <input
              name="title"
              value={form.title}
              onChange={(event) => setForm((prev) => ({ ...prev, title: event.target.value }))}
              className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none"
              placeholder="Product Designer – 2025"
            />
          </div>
          <div className="flex flex-wrap items-center justify-end gap-3">
            {extraActions ? <div className="flex items-center">{extraActions}</div> : null}
            {onDelete ? (
              <button
                type="button"
                onClick={onDelete}
                disabled={isDeleting}
                className="rounded-md border border-red-500/40 px-4 py-2 text-sm font-medium text-red-300 transition hover:bg-red-500/10 disabled:opacity-60"
              >
                {isDeleting ? 'Deleting…' : 'Delete'}
              </button>
            ) : null}
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 rounded-md bg-indigo-500 px-4 py-2 text-sm font-semibold text-white transition hover:bg-indigo-400 disabled:opacity-60"
            >
              {isSaving ? <LoadingSpinner /> : null}
              <span>{isSaving ? 'Saving…' : 'Save Resume'}</span>
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-white">Personal Information</h2>
        <div className="mt-6 flex flex-col gap-6 lg:flex-row">
          <div className="flex flex-col items-center gap-3">
            <div className="relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border border-slate-700 bg-slate-800">
              {form.personalInfo.photo ? (
                <img
                  src={form.personalInfo.photo}
                  alt={`${form.personalInfo.fullName || 'Resume'} portrait`}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-sm text-slate-400">Add photo</span>
              )}
            </div>
            <div className="flex flex-col items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-md border border-indigo-500/40 px-3 py-1.5 text-xs font-medium text-indigo-200 transition hover:bg-indigo-500/10">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
                Upload
              </label>
              {form.personalInfo.photo ? (
                <button
                  type="button"
                  onClick={handlePhotoRemove}
                  className="text-xs text-red-300 underline underline-offset-2 hover:text-red-200"
                >
                  Remove photo
                </button>
              ) : null}
              {photoError ? <p className="text-xs text-red-300">{photoError}</p> : null}
            </div>
          </div>
          <div className="grid flex-1 gap-4 sm:grid-cols-2">
            {[
              { label: 'Full name', name: 'fullName', placeholder: 'Jordan Blake' },
              { label: 'Email', name: 'email', placeholder: 'jordan@email.com' },
              { label: 'Phone', name: 'phone', placeholder: '+1 555 010 2030' },
              { label: 'Location', name: 'location', placeholder: 'Remote — Canada' },
              { label: 'Website / Portfolio', name: 'website', placeholder: 'https://portfolio.site' },
            ].map((field) => (
              <label key={field.name} className="text-sm text-slate-300">
                <span className="block text-xs font-medium uppercase tracking-wide text-indigo-200">
                  {field.label}
                </span>
                <input
                  name={field.name}
                  value={form.personalInfo[field.name]}
                  onChange={updatePersonalInfo}
                  placeholder={field.placeholder}
                  className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </label>
            ))}
          </div>
        </div>
        <div className="mt-4">
          <label className="text-sm text-slate-300">
            <span className="block text-xs font-medium uppercase tracking-wide text-indigo-200">
              Professional summary
            </span>
            <textarea
              name="summary"
              value={form.personalInfo.summary}
              onChange={updatePersonalInfo}
              rows={4}
              placeholder="Experienced..."
              className="mt-2 w-full rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none"
            />
          </label>
          <button
            type="button"
            onClick={handleSummaryImprove}
            disabled={aiBusy || !form.personalInfo.summary}
            className="mt-3 inline-flex items-center gap-2 rounded-md border border-indigo-500/40 px-3 py-2 text-sm font-medium text-indigo-200 transition hover:bg-indigo-500/10 disabled:opacity-50"
          >
            {aiBusy ? <LoadingSpinner /> : '✨'}
            Improve with AI
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Experience</h2>
          <button
            type="button"
            onClick={() => addItem('experiences', createEmptyExperience)}
            className="rounded-md border border-indigo-500/40 px-3 py-2 text-sm font-medium text-indigo-200 transition hover:bg-indigo-500/10"
          >
            + Add role
          </button>
        </div>
        <div className="mt-6 space-y-6">
          {experiences.map((experience) => (
            <div key={experience.clientId} className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-indigo-200">
                  Experience entry
                </h3>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => handleExperienceImprove(experience)}
                    disabled={aiBusy || !experience.description}
                    className="rounded-md border border-indigo-500/40 px-3 py-1.5 text-xs font-medium text-indigo-200 transition hover:bg-indigo-500/10 disabled:opacity-50"
                  >
                    {aiBusy ? 'Improving…' : '✨ Enhance'}
                  </button>
                  <button
                    type="button"
                    onClick={() => removeItem('experiences', experience.clientId)}
                    className="rounded-md border border-red-500/40 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500/10"
                  >
                    Remove
                  </button>
                </div>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {[
                  { label: 'Role', name: 'role', placeholder: 'Senior Frontend Engineer' },
                  { label: 'Company', name: 'company', placeholder: 'Acme Corp' },
                  { label: 'Start date', name: 'startDate', placeholder: 'May 2021' },
                  { label: 'End date', name: 'endDate', placeholder: 'Present' },
                ].map((field) => (
                  <label key={field.name} className="text-sm text-slate-300">
                    <span className="block text-xs font-medium uppercase tracking-wide text-indigo-200">
                      {field.label}
                    </span>
                    <input
                      name={field.name}
                      value={experience[field.name]}
                      onChange={(event) => updateField('experiences', experience.clientId, event)}
                      placeholder={field.placeholder}
                      className="mt-2 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none"
                    />
                  </label>
                ))}
              </div>
              <label className="mt-4 block text-sm text-slate-300">
                <span className="block text-xs font-medium uppercase tracking-wide text-indigo-200">
                  Key accomplishments
                </span>
                <textarea
                  name="description"
                  value={experience.description}
                  onChange={(event) => updateField('experiences', experience.clientId, event)}
                  rows={4}
                  placeholder="- Launched..."
                  className="mt-2 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </label>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Projects</h2>
          <button
            type="button"
            onClick={() => addItem('projects', createEmptyProject)}
            className="rounded-md border border-indigo-500/40 px-3 py-2 text-sm font-medium text-indigo-200 transition hover:bg-indigo-500/10"
          >
            + Add project
          </button>
        </div>
        <div className="mt-6 space-y-6">
          {projects.map((project) => (
            <div key={project.clientId} className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-indigo-200">
                  Project
                </h3>
                <button
                  type="button"
                  onClick={() => removeItem('projects', project.clientId)}
                  className="rounded-md border border-red-500/40 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500/10"
                >
                  Remove
                </button>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {[
                  { label: 'Project name', name: 'name', placeholder: 'Realtime Collaboration Suite' },
                  { label: 'Live link', name: 'link', placeholder: 'https://github.com/...' },
                ].map((field) => (
                  <label key={field.name} className="text-sm text-slate-300">
                    <span className="block text-xs font-medium uppercase tracking-wide text-indigo-200">
                      {field.label}
                    </span>
                    <input
                      name={field.name}
                      value={project[field.name]}
                      onChange={(event) => updateField('projects', project.clientId, event)}
                      placeholder={field.placeholder}
                      className="mt-2 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none"
                    />
                  </label>
                ))}
              </div>
              <label className="mt-4 block text-sm text-slate-300">
                <span className="block text-xs font-medium uppercase tracking-wide text-indigo-200">
                  Description
                </span>
                <textarea
                  name="description"
                  value={project.description}
                  onChange={(event) => updateField('projects', project.clientId, event)}
                  rows={3}
                  className="mt-2 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </label>
              <label className="mt-4 block text-sm text-slate-300">
                <span className="block text-xs font-medium uppercase tracking-wide text-indigo-200">
                  Tech stack (comma separated)
                </span>
                <input
                  name="techStack"
                  value={project.techStack?.join(', ') ?? ''}
                  onChange={(event) =>
                    updateArrayField('projects', project.clientId, () => ({
                      techStack: event.target.value
                        .split(',')
                        .map((item) => item.trim())
                        .filter(Boolean),
                    }))
                  }
                  placeholder="React, Node.js, AWS"
                  className="mt-2 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </label>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-white">Education</h2>
          <button
            type="button"
            onClick={() => addItem('education', createEmptyEducation)}
            className="rounded-md border border-indigo-500/40 px-3 py-2 text-sm font-medium text-indigo-200 transition hover:bg-indigo-500/10"
          >
            + Add entry
          </button>
        </div>
        <div className="mt-6 space-y-6">
          {education.map((entry) => (
            <div key={entry.clientId} className="rounded-xl border border-slate-800 bg-slate-950/60 p-5">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-indigo-200">
                  Education entry
                </h3>
                <button
                  type="button"
                  onClick={() => removeItem('education', entry.clientId)}
                  className="rounded-md border border-red-500/40 px-3 py-1.5 text-xs font-medium text-red-300 transition hover:bg-red-500/10"
                >
                  Remove
                </button>
              </div>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                {[
                  { label: 'Institution', name: 'institution', placeholder: 'University of Toronto' },
                  { label: 'Degree', name: 'degree', placeholder: 'B.Sc. Computer Science' },
                  { label: 'Start date', name: 'startDate', placeholder: '2018' },
                  { label: 'End date', name: 'endDate', placeholder: '2022' },
                ].map((field) => (
                  <label key={field.name} className="text-sm text-slate-300">
                    <span className="block text-xs font-medium uppercase tracking-wide text-indigo-200">
                      {field.label}
                    </span>
                    <input
                      name={field.name}
                      value={entry[field.name]}
                      onChange={(event) => updateField('education', entry.clientId, event)}
                      placeholder={field.placeholder}
                      className="mt-2 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none"
                    />
                  </label>
                ))}
              </div>
              <label className="mt-4 block text-sm text-slate-300">
                <span className="block text-xs font-medium uppercase tracking-wide text-indigo-200">
                  Highlights
                </span>
                <textarea
                  name="description"
                  value={entry.description}
                  onChange={(event) => updateField('education', entry.clientId, event)}
                  rows={3}
                  className="mt-2 w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none"
                />
              </label>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
        <h2 className="text-lg font-semibold text-white">Skills</h2>
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
            placeholder="Type a skill or comma separated list"
            className="w-full rounded-md border border-slate-800 bg-slate-950 px-3 py-2 text-slate-100 focus:border-indigo-500 focus:outline-none sm:flex-1"
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                handleSkillAppend();
              }
            }}
          />
          <button
            type="button"
            onClick={handleSkillAppend}
            className="rounded-md border border-indigo-500/40 px-4 py-2 text-sm font-medium text-indigo-200 transition hover:bg-indigo-500/10"
          >
            + Add skill
          </button>
        </div>
      </section>
    </form>
  );
};

ResumeForm.propTypes = {
  initialData: PropTypes.shape({
    _id: PropTypes.string,
    title: PropTypes.string,
    personalInfo: PropTypes.object,
    experiences: PropTypes.array,
    education: PropTypes.array,
    skills: PropTypes.array,
    projects: PropTypes.array,
  }),
  onSave: PropTypes.func,
  onDelete: PropTypes.func,
  onChange: PropTypes.func,
  isSaving: PropTypes.bool,
  isDeleting: PropTypes.bool,
  extraActions: PropTypes.node,
};

ResumeForm.defaultProps = {
  initialData: null,
  onSave: undefined,
  onDelete: undefined,
  onChange: undefined,
  isSaving: false,
  isDeleting: false,
  extraActions: null,
};

export default ResumeForm;
