import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';

const ensureArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

const sanitizeString = (value) => (typeof value === 'string' ? value.trim() : '');

const sanitizeExperience = (item = {}) => {
  const { clientId: _clientId, achievements, ...rest } = item;
  return {
    role: sanitizeString(rest.role),
    company: sanitizeString(rest.company),
    startDate: sanitizeString(rest.startDate),
    endDate: sanitizeString(rest.endDate),
    description: sanitizeString(rest.description),
    achievements: ensureArray(achievements).map(sanitizeString).filter(Boolean),
  };
};

const sanitizeEducation = (item = {}) => {
  const { clientId: _clientId, ...rest } = item;
  return {
    institution: sanitizeString(rest.institution),
    degree: sanitizeString(rest.degree),
    startDate: sanitizeString(rest.startDate),
    endDate: sanitizeString(rest.endDate),
    description: sanitizeString(rest.description),
  };
};

const sanitizeProject = (item = {}) => {
  const { clientId: _clientId, techStack, tags, ...rest } = item;
  return {
    name: sanitizeString(rest.name),
    description: sanitizeString(rest.description),
    link: sanitizeString(rest.link),
    imageUrl: sanitizeString(rest.imageUrl),
    techStack: ensureArray(techStack).map(sanitizeString).filter(Boolean),
    tags: ensureArray(tags).map(sanitizeString).filter(Boolean),
  };
};

const slugify = (value) =>
  sanitizeString(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'resume';

export const normalizeResume = (resume = {}) => {
  const personalInfo = resume.personalInfo || {};
  return {
    title: sanitizeString(resume.title) || 'Resume',
    personalInfo: {
      fullName: sanitizeString(personalInfo.fullName),
      email: sanitizeString(personalInfo.email),
      phone: sanitizeString(personalInfo.phone),
      location: sanitizeString(personalInfo.location),
      website: sanitizeString(personalInfo.website),
      summary: sanitizeString(personalInfo.summary),
      photo: sanitizeString(personalInfo.photo),
    },
    experiences: ensureArray(resume.experiences).map(sanitizeExperience),
    education: ensureArray(resume.education).map(sanitizeEducation),
    skills: ensureArray(resume.skills).map(sanitizeString).filter(Boolean),
    projects: ensureArray(resume.projects).map(sanitizeProject),
  };
};

const createPdfSectionHelpers = (doc, options) => {
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

  const addHeading = (text, size = 13) => {
    if (!text) return;
    ensureSpace(lineHeight * 2);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(size);
    doc.text(text, margin, cursorY);
    cursorY += lineHeight + 2;
  };

  const addSubHeading = (text) => {
    if (!text) return;
    ensureSpace(lineHeight * 1.5);
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(11);
    doc.text(text, margin, cursorY);
    cursorY += lineHeight;
  };

  const addParagraph = (text) => {
    if (!text) return;
    const lines = doc.splitTextToSize(text, usableWidth);
    ensureSpace(lines.length * lineHeight);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(lines, margin, cursorY);
    cursorY += lines.length * lineHeight;
  };

  const addBulletList = (items) => {
    if (!items || !items.length) return;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    items.forEach((item) => {
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
    addSubHeading,
    addParagraph,
    addBulletList,
    getCursor: () => cursorY,
    setCursor: (value) => {
      cursorY = value;
    },
    usableWidth,
  };
};

export const downloadResumePdf = (resume) =>
  new Promise((resolve, reject) => {
    try {
      const data = normalizeResume(resume);
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const margin = 48;
      const lineHeight = 16;
      const helpers = createPdfSectionHelpers(doc, { margin, lineHeight });

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);

      const headerText = data.personalInfo.fullName || data.title;
      const headerTop = helpers.getCursor();
      let textStartX = margin;
      let nextCursor = headerTop;

      if (data.personalInfo.photo) {
        try {
          const imageProps = doc.getImageProperties(data.personalInfo.photo);
          const imageWidth = 90;
          const aspectRatio =
            imageProps?.width && imageProps?.height ? imageProps.height / imageProps.width : 1;
          const imageHeight = imageWidth * (Number.isFinite(aspectRatio) ? aspectRatio : 1);
          const fileType = imageProps?.fileType || 'JPEG';
          doc.addImage(
            data.personalInfo.photo,
            fileType,
            margin,
            headerTop,
            imageWidth,
            imageHeight,
            undefined,
            'FAST',
          );
          textStartX = margin + imageWidth + 18;
          nextCursor = Math.max(nextCursor, headerTop + imageHeight);
        } catch (error) {
          // eslint-disable-next-line no-console
          console.warn('Failed to embed resume photo in PDF', error);
        }
      }

      let textBaseline = headerTop + 20;
      doc.text(headerText, textStartX, textBaseline);

      const contactLine = [
        data.personalInfo.email,
        data.personalInfo.phone,
        data.personalInfo.location,
        data.personalInfo.website,
      ]
        .filter(Boolean)
        .join(' • ');

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);

      if (contactLine) {
        textBaseline += lineHeight;
        doc.text(contactLine, textStartX, textBaseline);
      }

      if (data.personalInfo.summary) {
        const summaryLines = doc.splitTextToSize(
          data.personalInfo.summary,
          helpers.usableWidth - (textStartX - margin),
        );
        summaryLines.forEach((line) => {
          textBaseline += lineHeight;
          doc.text(line, textStartX, textBaseline);
        });
      }

      nextCursor = Math.max(nextCursor, textBaseline + 8);
      helpers.setCursor(nextCursor);
      helpers.addGap(14);

      if (data.experiences.length) {
        doc.setDrawColor(180, 190, 255);
        doc.setLineWidth(1);
        doc.line(margin, helpers.getCursor(), margin + helpers.usableWidth, helpers.getCursor());
        helpers.addGap(10);

        helpers.addHeading('Professional Experience', 14);
        data.experiences.forEach((experience) => {
          helpers.addHeading(
            [experience.role, experience.company].filter(Boolean).join(' • '),
            12,
          );
          helpers.addSubHeading(
            [experience.startDate, experience.endDate].filter(Boolean).join(' – '),
          );
          helpers.addParagraph(experience.description);
          helpers.addBulletList(experience.achievements);
          helpers.addGap(6);
        });
        helpers.addGap(4);
      }

      if (data.projects.length) {
        doc.setDrawColor(180, 190, 255);
        doc.setLineWidth(1);
        doc.line(margin, helpers.getCursor(), margin + helpers.usableWidth, helpers.getCursor());
        helpers.addGap(10);

        helpers.addHeading('Projects', 14);
        data.projects.forEach((project) => {
          helpers.addHeading(project.name, 12);
          helpers.addSubHeading(project.link);
          helpers.addParagraph(project.description);
          if (project.techStack.length) {
            helpers.addParagraph(`Stack: ${project.techStack.join(', ')}`);
          }
          helpers.addGap(6);
        });
        helpers.addGap(4);
      }

      if (data.education.length) {
        doc.setDrawColor(180, 190, 255);
        doc.setLineWidth(1);
        doc.line(margin, helpers.getCursor(), margin + helpers.usableWidth, helpers.getCursor());
        helpers.addGap(10);

        helpers.addHeading('Education', 14);
        data.education.forEach((education) => {
          helpers.addHeading(
            [education.degree, education.institution].filter(Boolean).join(' • '),
            12,
          );
          helpers.addSubHeading(
            [education.startDate, education.endDate].filter(Boolean).join(' – '),
          );
          helpers.addParagraph(education.description);
          helpers.addGap(6);
        });
        helpers.addGap(4);
      }

      if (data.skills.length) {
        doc.setDrawColor(180, 190, 255);
        doc.setLineWidth(1);
        doc.line(margin, helpers.getCursor(), margin + helpers.usableWidth, helpers.getCursor());
        helpers.addGap(10);

        helpers.addHeading('Skills', 14);
        helpers.addParagraph(data.skills.join(' • '));
      }

      doc.save(`${slugify(data.title)}.pdf`);
      resolve();
    } catch (error) {
      reject(error);
    }
  });

export const downloadResumeJson = (resume) => {
  const data = normalizeResume(resume);
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json;charset=utf-8',
  });
  saveAs(blob, `${slugify(data.title)}.json`);
};


