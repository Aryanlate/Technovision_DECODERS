import { EvaluationResult, buildDeadlineIcs, icsFileName } from '@opportunity-kit/shared';

// ============================================================================
// Download helpers (all client-side, no service).
// ============================================================================

/** Triggers a browser download for a text payload. */
function downloadTextFile(fileName: string, contents: string, mime: string): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([contents], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', fileName);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export interface DeadlineIcsInput {
  title: string;
  /** ISO date (YYYY-MM-DD) or full ISO timestamp. */
  deadline: string;
  description?: string;
  url?: string;
}

/**
 * Builds an RFC 5545 .ics file for an opportunity deadline and downloads it.
 * Two reminders are included: 3 days and 1 day before the deadline.
 * Throws a friendly error when there is no usable deadline.
 */
export function downloadDeadlineIcs(input: DeadlineIcsInput): void {
  const ics = buildDeadlineIcs({
    title: input.title,
    deadline: input.deadline,
    description: input.description,
    url: input.url
  });
  // text/calendar makes Google Calendar and Apple Calendar open it directly.
  downloadTextFile(icsFileName(input.title), ics, 'text/calendar');
}

/** Downloads any plain object as a pretty-printed .json file. */
export function downloadJson(fileName: string, data: unknown): void {
  downloadTextFile(fileName, JSON.stringify(data, null, 2), 'application/json');
}

/**
 * Generates a formatted Markdown summary of the evaluation
 */
export function generateMarkdownSummary(result: EvaluationResult): string {
  const lines: string[] = [
    `# OpportunityKit Evaluation: ${result.opportunityTitle}`,
    `*Generated on: ${new Date(result.timestamp).toLocaleString()}*`,
    '',
    `## Summary`,
    `- **Overall Verdict**: ${result.summary.overallVerdict}`,
    `- **Matches**: ${result.summary.matches}`,
    `- **Mismatches**: ${result.summary.mismatches}`,
    `- **Missing Info**: ${result.summary.missingInfo}`,
    '',
    `## Checklist`,
    '| Requirement | Expected | Your Profile | Status | Reason |',
    '|---|---|---|---|---|'
  ];

  result.checklist.forEach((item) => {
    lines.push(
      `| ${item.title} | ${item.expected} | ${item.studentValue} | **${item.status.toUpperCase()}** | ${item.reason} |`
    );
  });

  if (result.summary.actionPlan.length > 0) {
    lines.push('', '## Action Plan & Next Steps');
    result.summary.actionPlan.forEach((step) => {
      lines.push(`- ${step}`);
    });
  }

  return lines.join('\n');
}

/**
 * Triggers browser print dialog for PDF export
 */
export function triggerPrintPdf(): void {
  if (typeof window !== 'undefined') {
    window.print();
  }
}
