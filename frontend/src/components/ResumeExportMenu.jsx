import React, { useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import toast from 'react-hot-toast';
import { downloadResumeJson, downloadResumePdf, normalizeResume } from '../utils/exportResume';
import LoadingSpinner from './LoadingSpinner';

const ResumeExportMenu = ({ resume, disabled }) => {
  const [open, setOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const hasResume = useMemo(() => Boolean(resume), [resume]);
  const isDisabled = disabled || !hasResume || exporting;

  useEffect(() => {
    const handleClickAway = (event) => {
      if (!open) return;
      if (!event.target.closest('[data-resume-export-menu="true"]')) {
        setOpen(false);
      }
    };

    if (open) {
      window.addEventListener('mousedown', handleClickAway);
    }
    return () => {
      window.removeEventListener('mousedown', handleClickAway);
    };
  }, [open]);

  const safeResume = useMemo(() => (resume ? normalizeResume(resume) : null), [resume]);

  const handleExport = async (type) => {
    if (!safeResume) {
      toast.error('Add some resume details before exporting.');
      return;
    }

    setExporting(true);
    try {
      if (type === 'pdf') {
        await downloadResumePdf(safeResume);
        toast.success('Resume PDF ready.');
      } else if (type === 'json') {
        downloadResumeJson(safeResume);
        toast.success('Resume JSON downloaded.');
      }
      setOpen(false);
    } catch (error) {
      toast.error(error.message || 'Export failed. Try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="relative" data-resume-export-menu="true">
      <button
        type="button"
        disabled={isDisabled}
        onClick={() => setOpen((value) => !value)}
        className="inline-flex items-center gap-2 rounded-md border border-indigo-500/40 px-3 py-2 text-sm font-medium text-indigo-200 transition hover:bg-indigo-500/10 disabled:opacity-50"
      >
        {exporting ? <LoadingSpinner /> : '⬇'}
        <span>Export</span>
      </button>

      {open ? (
        <div className="absolute right-0 mt-2 w-48 rounded-lg border border-slate-700 bg-slate-950/90 p-1 shadow-lg">
          <button
            type="button"
            onClick={() => handleExport('pdf')}
            className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-slate-100 transition hover:bg-indigo-500/10"
          >
            <span>Download PDF</span>
            <span className="text-xs text-slate-400">.pdf</span>
          </button>
          <button
            type="button"
            onClick={() => handleExport('json')}
            className="flex w-full items-center justify-between rounded-md px-3 py-2 text-sm text-slate-100 transition hover:bg-indigo-500/10"
          >
            <span>Export JSON</span>
            <span className="text-xs text-slate-400">.json</span>
          </button>
        </div>
      ) : null}
    </div>
  );
};

ResumeExportMenu.propTypes = {
  resume: PropTypes.shape({
    title: PropTypes.string,
    personalInfo: PropTypes.object,
    experiences: PropTypes.array,
    education: PropTypes.array,
    skills: PropTypes.array,
    projects: PropTypes.array,
  }),
  disabled: PropTypes.bool,
};

ResumeExportMenu.defaultProps = {
  resume: null,
  disabled: false,
};

export default ResumeExportMenu;


