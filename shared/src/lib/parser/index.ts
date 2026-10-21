import { Checklist, Requirement } from '../types/index.js';

export interface ParseResult {
  checklist: Checklist;
  warnings: string[];
}

/**
 * Normalizes opportunity text into individual sentences for rule parsing
 * and traceability.
 */
export function splitIntoSentences(text: string): string[] {
  return text
    .replace(/\r\n/g, '\n')
    .split(/(?<=[.?!;])\s+|\n+/)
    .map((s) => s.trim().replace(/^[-•*]\s*/, ''))
    .filter((s) => s.length > 0);
}

/**
 * Detects opportunity type from text keywords:
 * internship | scholarship | competition | custom
 */
export function detectOpportunityType(
  text: string,
  title?: string
): 'internship' | 'scholarship' | 'competition' | 'custom' {
  const combined = `${title || ''} ${text}`.toLowerCase();
  if (
    combined.includes('scholarship') ||
    combined.includes('merit-cum-means') ||
    combined.includes('fellowship') ||
    combined.includes('grant') ||
    combined.includes('stipend award') ||
    combined.includes('income certificate') ||
    combined.includes('gross income') ||
    combined.includes('annual income')
  ) {
    return 'scholarship';
  }

  if (
    combined.includes('competition') ||
    combined.includes('hackathon') ||
    combined.includes('contest') ||
    combined.includes('challenge') ||
    combined.includes('ideathon')
  ) {
    return 'competition';
  }

  if (
    combined.includes('internship') ||
    combined.includes('intern') ||
    combined.includes('trainee') ||
    combined.includes('apprentice')
  ) {
    return 'internship';
  }

  return 'internship';
}

/**
 * Normalizes written and numeric ordinals into digits:
 * "second" -> 2, "2nd" -> 2, "third" -> 3, "final" -> 4
 */
function wordToYearNumber(word: string): number | null {
  const clean = word.toLowerCase().trim();
  if (/^1st$|^first$/i.test(clean)) return 1;
  if (/^2nd$|^second$/i.test(clean)) return 2;
  if (/^3rd$|^third$|^pre-?final$/i.test(clean)) return 3;
  if (/^4th$|^fourth$|^final$/i.test(clean)) return 4;
  if (/^5th$|^fifth$/i.test(clean)) return 5;
  const num = parseInt(clean, 10);
  if (!Number.isNaN(num) && num >= 1 && num <= 5) return num;
  return null;
}

/**
 * Normalizes date strings (e.g. "November 15, 2026", "30 Nov", "30/11/2026")
 * into YYYY-MM-DD format.
 */
export function normalizeDate(dateStr: string): string | null {
  const cleaned = dateStr.trim();

  // Format: DD/MM/YYYY or DD-MM-YYYY
  const slashMatch = cleaned.match(/\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})\b/);
  if (slashMatch) {
    const day = slashMatch[1].padStart(2, '0');
    const month = slashMatch[2].padStart(2, '0');
    const year = slashMatch[3];
    return `${year}-${month}-${day}`;
  }

  // Format: YYYY-MM-DD
  const isoMatch = cleaned.match(/\b(\d{4})-(\d{2})-(\d{2})\b/);
  if (isoMatch) {
    return isoMatch[0];
  }

  const MONTH_MAP: Record<string, string> = {
    jan: '01',
    january: '01',
    feb: '02',
    february: '02',
    mar: '03',
    march: '03',
    apr: '04',
    april: '04',
    may: '05',
    jun: '06',
    june: '06',
    jul: '07',
    july: '07',
    aug: '08',
    august: '08',
    sep: '09',
    september: '09',
    oct: '10',
    october: '10',
    nov: '11',
    november: '11',
    dec: '12',
    december: '12'
  };

  // Format: Month DD, YYYY or Month DD (e.g. "November 15, 2026", "Nov 30")
  const monthFirstMatch = cleaned.match(
    /\b(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?\s+(\d{1,2})(?:st|nd|rd|th)?(?:,?\s*(\d{4}))?\b/i
  );
  if (monthFirstMatch) {
    const month = MONTH_MAP[monthFirstMatch[1].toLowerCase()];
    const day = monthFirstMatch[2].padStart(2, '0');
    const year = monthFirstMatch[3] || '2026';
    return `${year}-${month}-${day}`;
  }

  // Format: DD Month YYYY or DD Month (e.g. "30 Nov", "15 November 2026")
  const dayFirstMatch = cleaned.match(
    /\b(\d{1,2})(?:st|nd|rd|th)?\s+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.?(?:,?\s*(\d{4}))?\b/i
  );
  if (dayFirstMatch) {
    const day = dayFirstMatch[1].padStart(2, '0');
    const month = MONTH_MAP[dayFirstMatch[2].toLowerCase()];
    const year = dayFirstMatch[3] || '2026';
    return `${year}-${month}-${day}`;
  }

  return null;
}

/**
 * Transparent, deterministic Rule Parser (plain TypeScript, no AI).
 * Turns pasted opportunity text into a Checklist using regex and keyword rules.
 *
 * Each detected requirement retains its exact source sentence.
 * Returns parse warnings for non-trivial sentences that could not be understood.
 */
export function parseOpportunityToChecklist(
  rawText: string,
  opportunityTitle?: string
): ParseResult {
  const sentences = splitIntoSentences(rawText);
  const requirements: Requirement[] = [];
  const understoodSentences = new Set<string>();

  const opportunityType = detectOpportunityType(rawText, opportunityTitle);
  let idCounter = 1;

  for (const sentence of sentences) {
    let matchedInSentence = false;

    // ------------------------------------------------------------------------
    // 1. Year of study ("2nd or 3rd year", "second year", "2nd-year")
    // ------------------------------------------------------------------------
    const yearPattern =
      /(?:(\b(?:1st|2nd|3rd|4th|5th|first|second|third|fourth|final|pre-final|\d+)\b)[\s-]*(?:or|,|-|to)?\s*)+(\b(?:1st|2nd|3rd|4th|5th|first|second|third|fourth|final|\d+)\b)?[\s-]*year/i;

    if (yearPattern.test(sentence) && !requirements.some((r) => r.kind === 'year')) {
      const allowedYears: number[] = [];
      const tokens = sentence.match(
        /\b(?:1st|2nd|3rd|4th|5th|first|second|third|fourth|final|pre-final|\d+)\b/gi
      );
      if (tokens) {
        tokens.forEach((tok) => {
          const yr = wordToYearNumber(tok);
          if (yr && !allowedYears.includes(yr)) {
            allowedYears.push(yr);
          }
        });
      }

      if (allowedYears.length > 0) {
        allowedYears.sort((a, b) => a - b);
        requirements.push({
          id: 'req-year',
          kind: 'year',
          label: 'Year of Study',
          value: allowedYears,
          required: true,
          sourceSentence: sentence,
          title: 'Year of Study',
          category: 'education',
          rule: sentence,
          parsedRule: { allowedYears }
        });
        matchedInSentence = true;
      }
    }

    // ------------------------------------------------------------------------
    // 2. CGPA or percentage cut-off ("7.5 or above", "60%", "minimum 80% marks")
    // ------------------------------------------------------------------------
    const cgpaPattern =
      /(?:cgpa|gpa)[\s:]*([><=]*)\s*(\d+(?:\.\d+)?)\s*(?:or above|\+|minimum|min)?/i;
    const cgpaAltPattern = /minimum\s+(\d+(?:\.\d+)?)\s*(?:cgpa|gpa)/i;
    const marksPattern = /(\d{2})%\s*(?:marks)?|minimum\s+(\d{2})%\s*marks?/i;

    const cgpaMatch = sentence.match(cgpaPattern) || sentence.match(cgpaAltPattern);
    const marksMatch = sentence.match(marksPattern);

    if (
      (cgpaMatch || marksMatch) &&
      !requirements.some((r) => r.kind === 'cgpa')
    ) {
      let cutOffValue = 7.5;
      let label = 'CGPA Requirement';

      if (cgpaMatch) {
        cutOffValue = parseFloat(cgpaMatch[2] || cgpaMatch[1]);
        label = 'CGPA Requirement';
      } else if (marksMatch) {
        cutOffValue = parseFloat(marksMatch[1] || marksMatch[2]);
        label = 'Marks Cut-off';
      }

      requirements.push({
        id: 'req-cgpa',
        kind: 'cgpa',
        label,
        value: cutOffValue,
        required: true,
        sourceSentence: sentence,
        title: label,
        category: 'academic',
        rule: sentence,
        parsedRule: { minCgpa: cutOffValue }
      });
      matchedInSentence = true;
    }

    // ------------------------------------------------------------------------
    // 3. Technical Skills ("Skills: HTML, CSS, JavaScript", "knowledge of X")
    // ------------------------------------------------------------------------
    const skillsHeaderPattern =
      /(?:skills?|technologies|tech stack|proficient in|experience with|knowledge of)[\s:]+([^.;\n]+)/i;
    const skillsMatch = sentence.match(skillsHeaderPattern);

    if (skillsMatch && !requirements.some((r) => r.kind === 'skills')) {
      const rawSkills = skillsMatch[1];
      const skillsList = rawSkills
        .split(/[,/&]|\band\b/i)
        .map((s) => s.trim())
        .filter(
          (s) =>
            s.length > 1 &&
            !/^(required|preferred|etc|such as|like|or|all|in|with)$/i.test(s)
        );

      if (skillsList.length > 0) {
        requirements.push({
          id: 'req-skills',
          kind: 'skills',
          label: 'Technical Skills',
          value: skillsList,
          required: true,
          sourceSentence: sentence,
          title: 'Technical Skills',
          category: 'skills',
          rule: sentence,
          parsedRule: { requiredSkills: skillsList }
        });
        matchedInSentence = true;
      }
    }

    // ------------------------------------------------------------------------
    // 4. Documents (resume, marksheet, income certificate, ID)
    // ------------------------------------------------------------------------
    const docTypesDetected: Array<{ type: string; label: string }> = [];

    if (/\b(resume|cv)\b/i.test(sentence)) {
      docTypesDetected.push({ type: 'resume', label: 'Resume Requirement' });
    }
    if (/\b(marksheet|marksheets|transcript|transcripts)\b/i.test(sentence)) {
      docTypesDetected.push({ type: 'marksheet', label: 'Semester Marksheet' });
    }
    if (/income\s+certificate/i.test(sentence)) {
      docTypesDetected.push({
        type: 'incomeCertificate',
        label: 'Income Certificate'
      });
    }
    if (/\b(student\s+id|id\s+card|identity\s+proof|college\s+id)\b/i.test(sentence)) {
      docTypesDetected.push({ type: 'idProof', label: 'Student ID Proof' });
    }

    for (const doc of docTypesDetected) {
      if (!requirements.some((r) => r.kind === 'document' && r.value === doc.type)) {
        requirements.push({
          id: doc.type === 'resume' ? 'req-resume' : `req-doc-${doc.type}`,
          kind: 'document',
          label: doc.label,
          value: doc.type,
          required: true,
          sourceSentence: sentence,
          title: doc.label,
          category: 'documents',
          rule: sentence,
          parsedRule: doc.type === 'resume' ? { resumeRequired: true } : {}
        });
        matchedInSentence = true;
      }
    }

    // ------------------------------------------------------------------------
    // 5. Links (GitHub, portfolio, LinkedIn)
    // ------------------------------------------------------------------------
    const isBothOrEither =
      /(?:portfolio\s+or\s+github|github\s+or\s+portfolio|portfolio\s*\/\s*github|github\s*\/\s*portfolio)[\s\w]*link/i.test(
        sentence
      );

    if (isBothOrEither && !requirements.some((r) => r.kind === 'link')) {
      requirements.push({
        id: 'req-portfolio-github',
        kind: 'link',
        label: 'Portfolio / GitHub Link',
        value: 'portfolioOrGithub',
        required: true,
        sourceSentence: sentence,
        title: 'Portfolio / GitHub Link',
        category: 'links',
        rule: sentence,
        parsedRule: { githubOrPortfolioRequired: true }
      });
      matchedInSentence = true;
    } else {
      if (/\bgithub\b/i.test(sentence) && !requirements.some((r) => r.value === 'github')) {
        requirements.push({
          id: 'req-link-github',
          kind: 'link',
          label: 'GitHub Link',
          value: 'github',
          required: true,
          sourceSentence: sentence,
          title: 'GitHub Repository / Profile Link',
          category: 'links',
          rule: sentence,
          parsedRule: { githubRequired: true }
        });
        matchedInSentence = true;
      }

      if (/\blinkedin\b/i.test(sentence) && !requirements.some((r) => r.value === 'linkedin')) {
        requirements.push({
          id: 'req-link-linkedin',
          kind: 'link',
          label: 'LinkedIn Profile',
          value: 'linkedin',
          required: true,
          sourceSentence: sentence,
          title: 'LinkedIn Profile Link',
          category: 'links',
          rule: sentence
        });
        matchedInSentence = true;
      }

      if (/\bportfolio\b/i.test(sentence) && !requirements.some((r) => r.value === 'portfolio')) {
        requirements.push({
          id: 'req-link-portfolio',
          kind: 'link',
          label: 'Portfolio Website',
          value: 'portfolio',
          required: true,
          sourceSentence: sentence,
          title: 'Portfolio Website Link',
          category: 'links',
          rule: sentence,
          parsedRule: { portfolioRequired: true }
        });
        matchedInSentence = true;
      }
    }

    // ------------------------------------------------------------------------
    // 6. Availability and duration ("8 weeks", "2 months", "12-week")
    // ------------------------------------------------------------------------
    const weeksMatch = sentence.match(/(\d+)\s*[\s-]weeks?(?:\s+availability)?/i);
    const monthsMatch = sentence.match(/(\d+)\s*[\s-]months?(?:\s+availability)?/i);

    if (
      (weeksMatch || monthsMatch) &&
      !requirements.some((r) => r.kind === 'availability')
    ) {
      let weeks = 8;
      if (weeksMatch) {
        weeks = parseInt(weeksMatch[1], 10);
      } else if (monthsMatch) {
        weeks = parseInt(monthsMatch[1], 10) * 4;
      }

      requirements.push({
        id: 'req-availability',
        kind: 'availability',
        label: 'Availability',
        value: weeks,
        required: true,
        sourceSentence: sentence,
        title: 'Availability',
        category: 'availability',
        rule: sentence,
        parsedRule: { minAvailabilityWeeks: weeks }
      });
      matchedInSentence = true;
    }

    // ------------------------------------------------------------------------
    // 7. Income Limit ("gross income must not exceed Rs 6,00,000", "income limit")
    // ------------------------------------------------------------------------
    if (
      /income/i.test(sentence) &&
      !requirements.some((r) => r.id === 'req-income-limit')
    ) {
      const numMatch = sentence.match(/(?:rs\.?|inr|₹)?\s*([\d,]+(?:\.\d+)?)/i);
      const incomeStr = numMatch ? numMatch[1].replace(/,/g, '') : '600000';
      const incomeVal = parseFloat(incomeStr) || 600000;

      requirements.push({
        id: 'req-income-limit',
        kind: 'custom',
        label: 'Income Limit',
        value: incomeVal,
        required: true,
        sourceSentence: sentence,
        title: 'Family Annual Income Limit',
        category: 'general',
        rule: sentence
      });
      matchedInSentence = true;
    }

    // ------------------------------------------------------------------------
    // 8. Team Size ("Team size must be between 2 to 4 members")
    // ------------------------------------------------------------------------
    if (
      /team\s+size|team\s+of|between\s+\d+\s+to\s+\d+\s+members/i.test(sentence) &&
      !requirements.some((r) => r.id === 'req-team-size')
    ) {
      const sizeMatch = sentence.match(/between\s+(\d+)\s+to\s+(\d+)\s+members/i);
      const teamValue = sizeMatch ? `${sizeMatch[1]}-${sizeMatch[2]} members` : '2-4 members';

      requirements.push({
        id: 'req-team-size',
        kind: 'custom',
        label: 'Team Size',
        value: teamValue,
        required: true,
        sourceSentence: sentence,
        title: 'Team Size Requirement',
        category: 'general',
        rule: sentence
      });
      matchedInSentence = true;
    }

    // ------------------------------------------------------------------------
    // 9. Project Requirements ("at least 1 IoT project", "2 projects")
    // ------------------------------------------------------------------------
    if (
      /project/i.test(sentence) &&
      !/submission\s+deadline/i.test(sentence)
    ) {
      // Check for domain/technology tag in project (e.g. IoT, Embedded Systems, AI)
      if (
        /\b(iot|embedded\s+systems?|hardware|ai|ml|web)\b/i.test(sentence) &&
        !requirements.some((r) => r.kind === 'projectTag')
      ) {
        const tagMatch = sentence.match(/\b(iot|embedded\s+systems?|hardware|ai|ml|web)\b/i);
        const tag = tagMatch ? tagMatch[1].toUpperCase() : 'IoT';

        requirements.push({
          id: 'req-project-tag',
          kind: 'projectTag',
          label: 'Project Domain/Tag',
          value: tag === 'IOT' ? 'IoT' : tag,
          required: true,
          sourceSentence: sentence,
          title: `Verified ${tag} Project`,
          category: 'experience',
          rule: sentence
        });
        matchedInSentence = true;
      }

      // Check for required project count
      const countMatch = sentence.match(/(?:minimum|at\s+least)?\s*(\d+)\s*(?:verified)?\s*(?:[\w\s]+)?projects?/i);
      if (countMatch && !requirements.some((r) => r.kind === 'projectCount')) {
        const count = parseInt(countMatch[1], 10);
        if (!Number.isNaN(count) && count >= 1 && count <= 20) {
          requirements.push({
            id: 'req-project-count',
            kind: 'projectCount',
            label: 'Project Count',
            value: count,
            required: true,
            sourceSentence: sentence,
            title: `Minimum ${count} Completed Project${count > 1 ? 's' : ''}`,
            category: 'experience',
            rule: sentence
          });
          matchedInSentence = true;
        }
      }
    }

    // ------------------------------------------------------------------------
    // 10. Deadlines ("November 15, 2026", "30 Nov", "30/11/2026")
    // ------------------------------------------------------------------------
    if (
      /deadline|due\s+date|last\s+date|submission\s+date/i.test(sentence) &&
      !requirements.some((r) => r.kind === 'deadline')
    ) {
      const parsedDate = normalizeDate(sentence);
      if (parsedDate) {
        requirements.push({
          id: 'req-deadline',
          kind: 'deadline',
          label: 'Submission Deadline',
          value: parsedDate,
          required: true,
          sourceSentence: sentence,
          title: `Application Deadline: ${parsedDate}`,
          category: 'general',
          rule: sentence
        });
        matchedInSentence = true;
      }
    }

    if (matchedInSentence) {
      understoodSentences.add(sentence);
    }
  }

  // --------------------------------------------------------------------------
  // Parse Warnings: Sentences that were not understood as structured criteria
  // --------------------------------------------------------------------------
  const warnings: string[] = [];
  for (const sentence of sentences) {
    if (!understoodSentences.has(sentence)) {
      // Ignore trivial introductory fragments or pure titles
      const isPureIntro =
        /^(internship|scholarship|competition|hackathon|call for applications|open to all|about the role)\b/i.test(
          sentence
        );
      if (sentence.length > 15 && !isPureIntro) {
        warnings.push(`Could not extract structured requirement from: "${sentence}"`);
      }
    }
  }

  const checklist: Checklist = {
    opportunityType,
    title: opportunityTitle || `${opportunityType.toUpperCase()} Opportunity`,
    requirements,
    sources: ['Pasted Opportunity Text'],
    warnings
  };

  return { checklist, warnings };
}

/**
 * Standard parseOpportunity function returning Requirement[]
 * Preserves 100% backward compatibility with all test suites and UI callers.
 */
export function parseOpportunity(rawText: string): Requirement[] {
  const { checklist } = parseOpportunityToChecklist(rawText);
  return checklist.requirements;
}

/**
 * Parse alias returning Checklist
 */
export function parseChecklist(
  rawText: string,
  opportunityTitle?: string
): Checklist & { warnings: string[] } {
  const { checklist, warnings } = parseOpportunityToChecklist(rawText, opportunityTitle);
  return {
    ...checklist,
    warnings
  };
}
