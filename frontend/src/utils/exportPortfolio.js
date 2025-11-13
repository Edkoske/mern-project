import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';
import { normalizeResume } from './exportResume';

const ensureArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

const sanitizeString = (value) => (typeof value === 'string' ? value.trim() : '');

const slugify = (value) =>
  sanitizeString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'portfolio';

const sanitizeProject = (project = {}) => {
  const { clientId: _clientId, tags, ...rest } = project;
  return {
    name: sanitizeString(rest.name),
    description: sanitizeString(rest.description),
    link: sanitizeString(rest.link),
    imageUrl: sanitizeString(rest.imageUrl),
    tags: ensureArray(tags).map(sanitizeString),
  };
};

export const normalizePortfolio = (portfolio = {}) => {
  const socialLinks = portfolio.socialLinks || {};
  const theme = portfolio.theme || {};
  const ownerName =
    typeof portfolio.user === 'object' && portfolio.user !== null
      ? sanitizeString(portfolio.user.name)
      : sanitizeString(portfolio.ownerName);
  return {
    headline: sanitizeString(portfolio.headline) || 'Portfolio',
    bio: sanitizeString(portfolio.bio),
    skills: ensureArray(portfolio.skills).map(sanitizeString),
    projects: ensureArray(portfolio.projects).map(sanitizeProject),
    socialLinks: {
      github: sanitizeString(socialLinks.github),
      linkedin: sanitizeString(socialLinks.linkedin),
      twitter: sanitizeString(socialLinks.twitter),
      website: sanitizeString(socialLinks.website),
    },
    featuredResume: portfolio.featuredResume ? normalizeResume(portfolio.featuredResume) : null,
    theme: {
      palette: {
        primary: sanitizeString(theme?.palette?.primary) || '#6366f1',
        secondary: sanitizeString(theme?.palette?.secondary) || '#f59e0b',
        accent: sanitizeString(theme?.palette?.accent) || '#38bdf8',
      },
      layout: sanitizeString(theme.layout) || 'classic',
    },
    slug: sanitizeString(portfolio.slug),
    isPublished: Boolean(portfolio.isPublished),
    publishedAt: portfolio.publishedAt ? new Date(portfolio.publishedAt).toISOString() : null,
    ownerName,
  };
};

const createPdfHelpers = (doc, options) => {
  const { margin, lineHeight } = options;
  const pageHeight = doc.internal.pageSize.getHeight();
  const usableWidth = doc.internal.pageSize.getWidth() - margin * 2;
  let cursorY = margin;

  const ensureSpace = (expected = lineHeight * 2) => {
    if (cursorY + expected > pageHeight - margin) {
      doc.addPage();
      cursorY = margin;
    }
  };

  const addGap = (size = lineHeight) => {
    cursorY += size;
  };

  const addHeading = (text, size = 16) => {
    if (!text) return;
    ensureSpace(lineHeight * 2);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(size);
    doc.text(text, margin, cursorY);
    cursorY += lineHeight + 4;
  };

  const addParagraph = (text, optionsOverride = {}) => {
    if (!text) return;
    const width = optionsOverride.width || usableWidth;
    const lines = doc.splitTextToSize(text, width);
    ensureSpace(lines.length * lineHeight);
    doc.setFont('helvetica', optionsOverride.fontStyle || 'normal');
    doc.setFontSize(optionsOverride.fontSize || 11);
    doc.text(lines, margin + (optionsOverride.offsetX || 0), cursorY);
    cursorY += lines.length * lineHeight;
  };

  const addList = (items) => {
    const safeItems = ensureArray(items);
    if (!safeItems.length) return;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    safeItems.forEach((item) => {
      const lines = doc.splitTextToSize(item, usableWidth - 16);
      ensureSpace(lines.length * lineHeight);
      lines.forEach((line, index) => {
        const prefix = index === 0 ? '• ' : '  ';
        doc.text(prefix + line, margin, cursorY);
        cursorY += lineHeight;
      });
    });
    cursorY += 4;
  };

  return {
    ensureSpace,
    addGap,
    addHeading,
    addParagraph,
    addList,
    getCursor: () => cursorY,
    setCursor: (value) => {
      cursorY = value;
    },
    usableWidth,
  };
};

export const downloadPortfolioPdf = (portfolio) =>
  new Promise((resolve, reject) => {
    try {
      const data = normalizePortfolio(portfolio);
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const margin = 48;
      const lineHeight = 16;
      const helpers = createPdfHelpers(doc, { margin, lineHeight });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.text(data.headline, margin, helpers.getCursor());
      helpers.addGap(20);

      if (data.ownerName) {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(11);
        doc.text(`By ${data.ownerName}`, margin, helpers.getCursor());
        helpers.addGap(lineHeight);
      }

      if (data.bio) {
        helpers.addParagraph(data.bio);
        helpers.addGap(10);
      }

      const linkEntries = Object.entries(data.socialLinks).filter(([, value]) => value);
      if (linkEntries.length) {
        helpers.addHeading('Connect', 14);
        linkEntries.forEach(([label, link]) => {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(11);
          helpers.ensureSpace(lineHeight * 1.5);
          doc.text(`${label}: ${link}`, margin, helpers.getCursor());
          helpers.addGap(lineHeight);
        });
        helpers.addGap(8);
      }

      if (data.skills.length) {
        helpers.addHeading('Skills', 14);
        helpers.addParagraph(data.skills.join(' • '));
        helpers.addGap(8);
      }

      if (data.projects.length) {
        helpers.addHeading('Projects', 14);
        data.projects.forEach((project) => {
          helpers.addHeading(project.name, 12);
          if (project.link) {
            helpers.addParagraph(project.link, { fontStyle: 'italic' });
          }
          helpers.addParagraph(project.description);
          if (project.tags.length) {
            helpers.addParagraph(`Tags: ${project.tags.join(', ')}`);
          }
          helpers.addGap(6);
        });
        helpers.addGap(8);
      }

      if (data.featuredResume) {
        helpers.addHeading('Featured Resume', 14);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        helpers.ensureSpace(lineHeight * 2);
        doc.text(data.featuredResume.title, margin, helpers.getCursor());
        helpers.addGap(lineHeight);
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(11);
        if (data.featuredResume.personalInfo?.summary) {
          helpers.addParagraph(data.featuredResume.personalInfo.summary);
        }
        helpers.addGap(6);
      }

      doc.save(`${slugify(data.headline)}.pdf`);
      resolve();
    } catch (error) {
      reject(error);
    }
  });

export const downloadPortfolioJson = (portfolio) => {
  const data = normalizePortfolio(portfolio);
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  saveAs(blob, `${slugify(data.headline)}.json`);
};


