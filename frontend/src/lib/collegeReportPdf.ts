import { jsPDF } from 'jspdf';

// ============================================================================
// College placement report (jsPDF, cream + black).
//
// One printable page set for a placement cell: the readiness distribution, the
// most common missing skills, and the list of students who are ready for a
// chosen drive. Pure client-side — no service, no network.
//
// The batch is demonstration sample data, so the report says so on every copy.
// ============================================================================

const CREAM: [number, number, number] = [241, 238, 230];
const INK: [number, number, number] = [17, 17, 17];
const MATCH: [number, number, number] = [47, 125, 91];
const MISMATCH: [number, number, number] = [192, 69, 58];
const MISSING: [number, number, number] = [217, 138, 31];

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 14;
const CONTENT_W = PAGE_W - MARGIN * 2;

export interface CollegeReportStudentRow {
  name: string;
  rollNo: string;
  year: number;
  branch: string;
  cgpa: number | null;
  score: number;
}

export interface CollegeReportReadinessBucket {
  count: number;
  percentage: number;
}

export interface CollegeReportPdfInput {
  driveTitle: string;
  generatedAt?: string;
  /** e.g. "National Institute of Engineering & Technology — 120 batch students" */
  cohortLabel: string;
  /** Always true for the hackathon build; printed so no one mistakes it for real data. */
  isSampleData: boolean;
  readiness: {
    ready: CollegeReportReadinessBucket;
    almostReady: CollegeReportReadinessBucket;
    notReady: CollegeReportReadinessBucket;
  };
  missingSkills: { skill: string; count: number; percentage: number }[];
  readyStudents: CollegeReportStudentRow[];
}

/** Safe file name for the report. */
function pdfFileName(driveTitle: string): string {
  const slug = String(driveTitle || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `college-placement-report-${slug || 'drive'}.pdf`;
}

/** Builds the document. Exported so the content can be unit-inspected. */
export function buildCollegeReportPdf(input: CollegeReportPdfInput): jsPDF {
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  let y = 0;

  const paintPage = () => {
    doc.setFillColor(...CREAM);
    doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
  };

  const ensureSpace = (needed: number) => {
    if (y + needed > PAGE_H - MARGIN) {
      doc.addPage();
      paintPage();
      y = MARGIN + 4;
    }
  };

  const heading = (text: string, size = 11) => {
    ensureSpace(14);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(size);
    doc.setTextColor(...INK);
    doc.text(text.toUpperCase(), MARGIN, y);
    y += 6;
  };

  paintPage();

  // ---- Black banner header -------------------------------------------------
  const bannerH = 26;
  doc.setFillColor(...INK);
  doc.rect(0, 0, PAGE_W, bannerH, 'F');
  doc.setTextColor(...CREAM);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('COLLEGE PLACEMENT REPORT', MARGIN, 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('OpportunityKit — batch readiness, skill gaps and drive shortlist', MARGIN, 19.5);
  y = bannerH + 9;

  // ---- Drive title ---------------------------------------------------------
  doc.setTextColor(...INK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  const titleLines = doc.splitTextToSize(input.driveTitle || 'Untitled drive', CONTENT_W);
  doc.text(titleLines, MARGIN, y);
  y += titleLines.length * 6 + 1;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...INK);
  doc.text(input.cohortLabel, MARGIN, y);
  y += 5;

  if (input.generatedAt) {
    doc.setFontSize(8.5);
    doc.text(`Generated ${new Date(input.generatedAt).toLocaleString()}`, MARGIN, y);
    y += 5;
  }

  // ---- Mandatory sample-data label ----------------------------------------
  if (input.isSampleData) {
    ensureSpace(9);
    doc.setFillColor(...MISSING);
    doc.rect(MARGIN, y, CONTENT_W, 6.5, 'F');
    doc.setTextColor(...CREAM);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('DEMONSTRATION SAMPLE DATA — NOT REAL STUDENT RECORDS', MARGIN + 2, y + 4.4);
    y += 11;
  }

  // ---- Readiness distribution ---------------------------------------------
  heading('Readiness distribution');

  const buckets: { label: string; bucket: CollegeReportReadinessBucket; color: [number, number, number] }[] = [
    { label: 'Ready to apply', bucket: input.readiness.ready, color: MATCH },
    { label: 'Almost ready', bucket: input.readiness.almostReady, color: MISSING },
    { label: 'Not ready yet', bucket: input.readiness.notReady, color: MISMATCH }
  ];

  const barH = 5;
  const barW = CONTENT_W;
  let barX = MARGIN;

  ensureSpace(14);
  buckets.forEach(({ bucket, color }) => {
    const width = Math.max(0, Math.min(100, bucket.percentage)) / 100 * barW;
    doc.setFillColor(...color);
    doc.rect(barX, y, width, barH, 'F');
    barX += width;
  });
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.3);
  doc.rect(MARGIN, y, barW, barH);
  y += barH + 6;

  buckets.forEach(({ label, bucket, color }) => {
    ensureSpace(7);
    doc.setFillColor(...color);
    doc.rect(MARGIN, y - 2.6, 3, 3, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...INK);
    doc.text(`${label}: ${bucket.count} students (${bucket.percentage}%)`, MARGIN + 5, y);
    y += 5.5;
  });
  y += 5;

  // ---- Common missing skills ----------------------------------------------
  heading('Most common missing skills');

  if (input.missingSkills.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('No skill-gap data was available for this cohort.', MARGIN, y);
    y += 8;
  } else {
    input.missingSkills.forEach((item) => {
      ensureSpace(8);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(...INK);
      doc.text(item.skill, MARGIN, y);

      const trackW = 70;
      const trackX = MARGIN + 60;
      doc.setDrawColor(...INK);
      doc.setLineWidth(0.2);
      doc.rect(trackX, y - 3, trackW, 4);
      doc.setFillColor(...MISMATCH);
      doc.rect(trackX, y - 3, (Math.min(100, item.percentage) / 100) * trackW, 4, 'F');

      doc.text(`${item.count} students (${item.percentage}%)`, trackX + trackW + 4, y);
      y += 6.5;
    });
    y += 3;
  }

  // ---- Ready students for the chosen drive --------------------------------
  heading(`Students ready for this drive (${input.readyStudents.length})`);

  const colW = [56, 34, 26, 26, 40]; // sums to 182 = CONTENT_W
  const colX: number[] = [];
  colW.reduce((acc, w, i) => {
    colX.push(i === 0 ? MARGIN : acc);
    return acc + w;
  }, MARGIN);

  const headers = ['Student', 'Roll no', 'Year / Branch', 'CGPA', 'Drive match'];
  const LINE = 4.0;

  const drawHeader = () => {
    ensureSpace(9);
    doc.setFillColor(...INK);
    doc.rect(MARGIN, y, CONTENT_W, 7, 'F');
    doc.setTextColor(...CREAM);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    headers.forEach((h, i) => doc.text(h, colX[i] + 1.5, y + 4.8));
    y += 7;
  };

  drawHeader();

  if (input.readyStudents.length === 0) {
    doc.setTextColor(...INK);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('No student in this batch is fully ready for this drive yet.', MARGIN + 1.5, y + 5);
    y += 10;
  }

  input.readyStudents.forEach((s, index) => {
    const cells = [
      s.name,
      s.rollNo,
      `Yr ${s.year} · ${s.branch}`,
      s.cgpa === null ? '—' : s.cgpa.toFixed(2),
      `${s.score}%`
    ];
    const wrapped = cells.map((c, i) => doc.splitTextToSize(c, colW[i] - 3));
    const lines = Math.max(...wrapped.map((w) => w.length));
    const rowH = lines * LINE + 3;

    if (y + rowH > PAGE_H - MARGIN) {
      doc.addPage();
      paintPage();
      y = MARGIN + 4;
      drawHeader();
    }

    if (index % 2 === 1) {
      doc.setFillColor(255, 255, 255);
      doc.rect(MARGIN, y, CONTENT_W, rowH, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    doc.setTextColor(...INK);
    wrapped.forEach((cellLines, i) => doc.text(cellLines, colX[i] + 1.5, y + 4));

    doc.setDrawColor(...INK);
    doc.setLineWidth(0.15);
    doc.line(MARGIN, y + rowH, MARGIN + CONTENT_W, y + rowH);
    y += rowH;
  });

  y += 10;

  // ---- Footer note --------------------------------------------------------
  ensureSpace(16);
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.4);
  doc.line(MARGIN, y, MARGIN + CONTENT_W, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(...INK);
  const note = doc.splitTextToSize(
    'Every status comes from the transparent rule engine (plain TypeScript, no AI). ' +
      '"Missing info" means the profile has no answer yet and is never treated as a failure. ' +
      'This report was generated from demonstration sample data for a hackathon prototype.',
    CONTENT_W
  );
  doc.text(note, MARGIN, y);

  return doc;
}

/** Builds and downloads the college placement report. */
export function downloadCollegeReportPdf(input: CollegeReportPdfInput): void {
  const doc = buildCollegeReportPdf(input);
  doc.save(pdfFileName(input.driveTitle));
}
