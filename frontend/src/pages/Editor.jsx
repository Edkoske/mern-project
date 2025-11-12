import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { resumeApi } from '../services/api';
import ResumeForm from '../components/ResumeForm';
import TemplatePreview from '../components/TemplatePreview';
import LoadingSpinner from '../components/LoadingSpinner';
import ResumeExportMenu from '../components/ResumeExportMenu';

const createBlankResume = () => ({
  title: 'New resume draft',
  personalInfo: {
    fullName: '',
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

const Editor = () => {
  const { resumeId } = useParams();
  const navigate = useNavigate();
  const isNew = resumeId === 'new';

  const [resume, setResume] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (isNew) {
      const blank = createBlankResume();
      setResume(blank);
      setPreview(blank);
      setLoading(false);
      return;
    }

    const fetchResume = async () => {
      setLoading(true);
      try {
        const data = await resumeApi.get(resumeId);
        setResume(data);
        setPreview(data);
      } catch (error) {
        toast.error('We could not load that resume.');
        navigate('/dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchResume();
  }, [isNew, navigate, resumeId]);

  const handleSave = async (payload) => {
    setSaving(true);
    try {
      if (isNew) {
        const created = await resumeApi.create(payload);
        toast.success('Resume saved');
        navigate(`/editor/${created._id}`, { replace: true });
      } else {
        const updated = await resumeApi.update(resumeId, payload);
        setResume(updated);
        setPreview(updated);
        toast.success('Changes saved');
      }
    } catch (error) {
      toast.error(error.message || 'Could not save this resume');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isNew) return;
    setDeleting(true);
    try {
      await resumeApi.remove(resumeId);
      toast.success('Resume deleted');
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.message || 'Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const formKey = useMemo(() => resume?._id || 'new', [resume?._id]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <LoadingSpinner label="Loading editor" />
      </div>
    );
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[3fr_2fr]">
      <ResumeForm
        key={formKey}
        initialData={resume}
        onSave={handleSave}
        onDelete={!isNew ? handleDelete : undefined}
        isSaving={saving}
        isDeleting={deleting}
        onChange={setPreview}
        extraActions={<ResumeExportMenu resume={preview} disabled={saving || deleting || loading} />}
      />
      <TemplatePreview resume={preview} />
    </div>
  );
};

export default Editor;