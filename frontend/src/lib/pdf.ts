import { jsPDF } from 'jspdf';

// ============================================================================
// "Prepare before applying" printable checklist (jsPDF, cream + black).
//
// Pure client-side: no service, no network. Renders the opportunity, the
// status table, the score and the ordered next steps in the editorial style.
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

export interface ChecklistPdfRow {
  title: string;
  expected: string;
  studentValue: string;
  status: string;
  reason: string;
}

export interface ChecklistPdfInput {
  opportunityTitle: string;
  timestamp?: string;
  rows: ChecklistPdfRow[];
  nextSteps: string[];
  score: number;
  label: string;
  counts: { matches: number; mismatches: number; missingInfo: number };
}

function statusColor(status: string): [number, number, number] {
  if (status === 'Match') return MATCH;
  if (status === 'Mismatch') return MISMATCH;
  if (status === 'Missing info') return MISSING;
  return INK;
}

/** Safe file name for the opportunity. */
function pdfFileName(title: string): string {
  const slug = String(title || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return `prepare-before-applying-${slug || 'opportunity'}.pdf`;
}

/** Builds the document. Exported so the content can be unit-inspected. */
export function buildChecklistPdf(input: ChecklistPdfInput): jsPDF {
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
    ensureSpace(12);
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
  doc.text('PREPARE BEFORE APPLYING', MARGIN, 13);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text('OpportunityKit — rule-based eligibility checklist', MARGIN, 19.5);
  y = bannerH + 10;

  // ---- Opportunity ---------------------------------------------------------
  doc.setTextColor(...INK);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  const titleLines = doc.splitTextToSize(input.opportunityTitle || 'Untitled opportunity', CONTENT_W);
  doc.text(titleLines, MARGIN, y);
  y += titleLines.length * 6 + 2;

  if (input.timestamp) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(`Generated ${new Date(input.timestamp).toLocaleString()}`, MARGIN, y);
    y += 6;
  }

  // ---- Score box ----------------------------------------------------------
  ensureSpace(24);
  const boxH = 20;
  doc.setDrawColor(...INK);
  doc.setLineWidth(0.4);
  doc.setFillColor(255, 255, 255);
  doc.rect(MARGIN, y, CONTENT_W, boxH, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text(`${input.score}%`, MARGIN + 5, y + 13.5);

  doc.setFontSize(9);
  doc.text('READINESS SCORE', MARGIN + 42, y + 8);
  doc.setFontSize(11);
  doc.text(String(input.label || ''), MARGIN + 42, y + 14.5);

  const countsText =
    `${input.counts.matches} Match  ·  ${input.counts.mismatches} Mismatch  ·  ` +
    `${input.counts.missingInfo} Missing info`;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(countsText, PAGE_W - MARGIN - 4, y + 12, { align: 'right' });
  y += boxH + 8;

  // ---- Status table -------------------------------------------------------
  heading('Status table');

  const colW = [42, 36, 36, 24, 44]; // sums to 182 = CONTENT_W
  const colX: number[] = [];
  colW.reduce((acc, w, i) => {
    colX.push(i === 0 ? MARGIN : acc);
    return acc + w;
  }, MARGIN);

  const headers = ['Requirement', 'Expected', 'Your profile', 'Status', 'Reason'];
  const LINE = 4.0;

  const drawTableHeader = () => {
    ensureSpace(9);
    doc.setFillColor(...INK);
    doc.rect(MARGIN, y, CONTENT_W, 7, 'F');
    doc.setTextColor(...CREAM);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    headers.forEach((h, i) => doc.text(h, colX[i] + 1.5, y + 4.8));
    y += 7;
  };

  drawTableHeader();

  if (input.rows.length === 0) {
    doc.setTextColor(...INK);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text('No requirements were found in this opportunity.', MARGIN + 1.5, y + 5);
    y += 10;
  }

  const cellCell = [
    (r: ChecklistPdfRow) => r.title,
    (r: ChecklistPdfRow) => r.expected,
    (r: ChecklistPdfRow) => r.studentValue,
    (r: ChecklistPdfRow) => r.status,
    (r: ChecklistPdfRow) => r.reason
  ];

  input.rows.forEach((row, rowIndex) => {
    const wrapped = cellCell.map((get, i) =>
      doc.splitTextToSize(String(get(row) ?? '') || '—', colW[i] - 3)
    );
    const lines = Math.max(...wrapped.map((w) => w.length));
    const rowH = lines * LINE + 3;

    // A row always fits on a fresh page, so this never loops forever.
    if (y + rowH > PAGE_H - MARGIN) {
      doc.addPage();
      paintPage();
      y = MARGIN + 4;
      drawTableHeader();
    }

    if (rowIndex % 2 === 1) {
      doc.setFillColor(255, 255, 255);
      doc.rect(MARGIN, y, CONTENT_W, rowH, 'F');
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.8);
    wrapped.forEach((cellLines, i) => {
      if (i === 3) {
        doc.setTextColor(...statusColor(row.status));
        doc.setFont('helvetica', 'bold');
      } else {
        doc.setTextColor(...INK);
      }
      doc.text(cellLines, colX[i] + 1.5, y + 4);
      if (i === 3) doc.setFont('helvetica', 'normal');
    });

    // Row borders
    doc.setDrawColor(...INK);
    doc.setLineWidth(0.15);
    doc.line(MARGIN, y + rowH, MARGIN + CONTENT_W, y + rowH);
    y += rowH;
  });

  doc.setDrawColor(...INK);
  doc.setLineWidth(0.4);
  doc.rect(MARGIN, y, CONTENT_W, 0);
  y += 10;

  // ---- Next steps ---------------------------------------------------------
  heading('Next steps, quickest fix first');

  if (input.nextSteps.length === 0) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...MATCH);
    ensureSpace(8);
    doc.text('Nothing outstanding — every requirement is satisfied.', MARGIN, y);
    y += 8;
  } else {
    input.nextSteps.forEach((step, index) => {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9.5);
      const lines = doc.splitTextToSize(`${index + 1}. ${step}`, CONTENT_W - 2);
      ensureSpace(lines.length * LINE + 3);
      doc.setTextColor(...INK);
      doc.text(lines, MARGIN, y);
      y += lines.length * LINE + 3;
    });
  }

  y += 6;

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
    'Statuses come from the transparent rule engine (plain TypeScript, no AI). ' +
      '"Missing info" means the profile has no answer yet — it is never treated as a failure. ' +
      'Never pay to apply, and never share an OTP, password or bank detail.',
    CONTENT_W
  );
  doc.text(note, MARGIN, y);

  return doc;
}

/** Builds and downloads the printable checklist. */
export function downloadChecklistPdf(input: ChecklistPdfInput): void {
  const doc = buildChecklistPdf(input);
  doc.save(pdfFileName(input.opportunityTitle));
}
