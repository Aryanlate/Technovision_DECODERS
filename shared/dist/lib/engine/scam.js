"use strict";
/**
 * Rule-based scam and legitimacy checker for opportunity listings.
 *
 * Plain TypeScript — no AI, no network. Every point comes from a named rule
 * with a fixed weight, so the score is transparent and auditable. The checker
 * also returns the exact positions of each warning sign inside the original
 * text so the interface can highlight them.
 *
 * A normal, honest listing stays Low. High always needs a concrete reason: a
 * fee demand, a request for an OTP/password/bank detail, or several stacked
 * warning signs.
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SCAM_SAFE_NEXT_STEPS = exports.SCAM_HIGH_THRESHOLD = exports.SCAM_MEDIUM_THRESHOLD = void 0;
exports.checkScam = checkScam;
/** Points needed to reach each level (a rule is only counted once). */
exports.SCAM_MEDIUM_THRESHOLD = 20;
exports.SCAM_HIGH_THRESHOLD = 50;
/** Always shown with a check, whatever the risk level. */
exports.SCAM_SAFE_NEXT_STEPS = [
    "Verify the listing on the organisation's own official website before you apply.",
    'Never share an OTP, password, PIN or bank details with anyone.',
    'Never pay a fee to apply for an internship, scholarship or job.',
    'Reach the organisation through a contact you find yourself, not one from the message.',
    'If you are unsure, ask your college placement cell to confirm the listing.'
];
// ---------------------------------------------------------------------------
// Rule set — the visible rules and their fixed points.
// ---------------------------------------------------------------------------
const SCAM_RULES = [
    {
        id: 'fee',
        label: 'Asks for a registration or processing fee',
        points: 50,
        severity: 'danger',
        explanation: 'Genuine internships, scholarships and jobs never ask you to pay to apply, register or get your application processed.',
        patterns: [
            /(registration|application|processing|training|onboarding|joining|security|refundable)\s+(fee|fees|deposit|amount|charge|charges)/i,
            /(pay|payment|remit|transfer|send)\s+(₹|rs\.?|inr|\$)\s*\d/i,
            /(fee|deposit|charge|charges)\s+of\s+(₹|rs\.?|inr|\$)\s*\d/i,
            /(pay|send)\s+(₹|rs\.?|inr|\$)\s*\d+\s+(to|before|for)\s+(apply|registration|joining|training)/i,
            /\bregistration\s+charges?\b/i,
            /\bfee\s+to\s+apply\b/i
        ]
    },
    {
        id: 'credentials',
        label: 'Asks for an OTP, password or bank details',
        points: 50,
        severity: 'danger',
        explanation: 'No legitimate organisation asks for your OTP, password, PIN, card or bank details during hiring. This is how accounts and money are stolen.',
        patterns: [
            /\bOTP\b/i,
            /\bone[-\s]?time\s+password\b/i,
            /\bpassword\b/i,
            /\bUPI\s+(id|pin|address)\b/i,
            /\b(cvv|card\s+number|debit\s+card|credit\s+card|net\s*banking|internet\s+banking)\b/i,
            /\bbank\s+(account|details|account\s+number|ifsc)\b/i,
            /\bIFSC\s*code\b/i,
            /\bATM\s+pin\b/i
        ]
    },
    {
        id: 'link',
        label: 'Shortened or lookalike link',
        points: 25,
        severity: 'warning',
        explanation: 'Shortened links hide where they really go, and lookalike domains copy a trusted brand name to steal your details.',
        find: findSuspiciousLinks
    },
    {
        id: 'tooGood',
        label: 'Too-good-to-be-true pay or promises',
        points: 25,
        severity: 'warning',
        explanation: 'Guaranteed jobs, daily payouts and large salaries with no skills needed are classic bait used to attract victims.',
        patterns: [
            /guaranteed\s+(job|income|placement|internship|salary)/i,
            /earn\s+(₹|rs\.?|inr|\$)?\s*\d[\d,]*\s*(per\s+day|daily|every\s+day|per\s+week)/i,
            /\bno\s+(skills?|experience)\s+(needed|required)\b/i,
            /(work\s+from\s+home|part[-\s]?time).{0,25}earn/i,
            /\b100\s*%\s*(job|placement)\s+guarantee\b/i,
            /\binstant\s+(joining|money|approval|income)\b/i,
            /get\s+rich\s+quick/i,
            /\bunlimited\s+(income|earning|earnings|money)\b/i,
            /(earn|make)\s+(up\s+to\s+)?(₹|rs\.?|inr|\$)\s*\d[\d,]*\s*(lakh|lakhs|per\s+month|monthly)/i
        ]
    },
    {
        id: 'urgency',
        label: 'Urgent or threatening wording',
        points: 15,
        severity: 'warning',
        explanation: 'Pressure like "only a few seats left" or threats to block your account push you to act before you think.',
        patterns: [
            /\bact\s+now\b/i,
            /\bhurry\b/i,
            /\burgent(ly)?\b/i,
            /\blast\s+chance\b/i,
            /\b(limited|few)\s+seats?\b/i,
            /\bonly\s+\d+\s+seats?\b/i,
            /\btoday\s+only\b/i,
            /\bexpires?\s+(today|soon|in\s+\d+\s+hours?)\b/i,
            /\b(immediate|instant)\s+(joining|start)\b/i,
            /\bfinal\s+warning\b/i,
            /\blegal\s+action\b/i,
            /account\s+will\s+be\s+(blocked|suspended|closed|deactivated)/i,
            /before\s+it'?s\s+too\s+late/i
        ]
    }
];
/** The "evidence of absence" rule: no official domain and no contact details. */
const NO_OFFICIAL_RULE = {
    ruleId: 'noOfficial',
    label: 'No official domain or contact details',
    points: 10,
    severity: 'warning',
    explanation: 'The listing gives no official website or verifiable contact. Confirm it exists on the organisation\u2019s own site before you trust it.'
};
// ---------------------------------------------------------------------------
// Link helpers
// ---------------------------------------------------------------------------
const SHORTENED_HOSTS = [
    'bit.ly',
    'tinyurl.com',
    'goo.gl',
    'rb.gy',
    'cutt.ly',
    'is.gd',
    'shorturl.at',
    'ow.ly',
    'buff.ly',
    'rebrand.ly',
    'tiny.cc',
    'bit.do',
    't.ly'
];
/** Known brands and their real domains, used to spot lookalike links. */
const KNOWN_BRANDS = [
    { brand: 'google', official: ['google.com', 'google.co.in', 'google.co.uk', 'withgoogle.com'] },
    { brand: 'infosys', official: ['infosys.com'] },
    { brand: 'flipkart', official: ['flipkart.com'] },
    { brand: 'amazon', official: ['amazon.com', 'amazon.in', 'amazon.co.uk', 'amazon.jobs'] },
    { brand: 'microsoft', official: ['microsoft.com'] },
    { brand: 'paytm', official: ['paytm.com'] },
    { brand: 'hdfc', official: ['hdfcbank.com'] },
    { brand: 'sbi', official: ['sbi.co.in', 'onlinesbi.sbi', 'sbiyono.sbi'] },
    { brand: 'aicte', official: ['aicte-india.org'] },
    { brand: 'wipro', official: ['wipro.com'] }
];
const URL_CANDIDATE_RE = /(https?:\/\/[^\s)<>"']+)|((?:[a-z0-9-]+\.)+(?:com|in|net|org|co|io|xyz|top|online|info|biz|club|link|ly|gl|gd|gy)(?:\/[^\s)<>"']*)?)/gi;
/** Extracts http(s) URLs and bare domains with their host names. */
function collectUrlCandidates(text) {
    const out = [];
    const re = new RegExp(URL_CANDIDATE_RE.source, 'gi');
    let m;
    while ((m = re.exec(text)) !== null) {
        const raw = m[0];
        if (!raw || raw.length === 0) {
            re.lastIndex++;
            continue;
        }
        const host = hostOf(raw);
        if (!host)
            continue;
        out.push({ start: m.index, end: m.index + raw.length, text: raw, host });
    }
    return out;
}
function hostOf(raw) {
    let value = raw.trim().toLowerCase();
    value = value.replace(/^https?:\/\//, '');
    value = value.split('/')[0].split('?')[0];
    value = value.replace(/^www\./, '');
    return value;
}
function isShortenedHost(host) {
    return SHORTENED_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
}
function isLookalikeHost(host) {
    return KNOWN_BRANDS.some(({ brand, official }) => {
        if (!host.includes(brand))
            return false;
        return !official.some((o) => host === o || host.endsWith(`.${o}`));
    });
}
/** Matches shortened and lookalike links inside the text. */
function findSuspiciousLinks(text) {
    return collectUrlCandidates(text)
        .filter((c) => isShortenedHost(c.host) || isLookalikeHost(c.host))
        .map((c) => ({ start: c.start, end: c.end, text: c.text }));
}
// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------
const EMAIL_RE = /[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}/i;
const PHONE_RE = /(?:\+91[\s-]?)?\b[6-9]\d{9}\b|\b0\d{2,4}[\s-]?\d{6,8}\b/;
function collectMatches(text, patterns) {
    const seen = new Set();
    const out = [];
    for (const pattern of patterns) {
        const flags = pattern.flags.includes('g') ? pattern.flags : `${pattern.flags}g`;
        const re = new RegExp(pattern.source, flags);
        let m;
        while ((m = re.exec(text)) !== null) {
            if (m[0].length === 0) {
                re.lastIndex++;
                continue;
            }
            const key = `${m.index}:${m.index + m[0].length}`;
            if (!seen.has(key)) {
                seen.add(key);
                out.push({ start: m.index, end: m.index + m[0].length, text: m[0] });
            }
            if (out.length > 200)
                return out;
        }
    }
    return out;
}
/**
 * True when the listing shows a proper (non-shortened, non-lookalike) domain
 * or a real contact detail. Used by the "no official domain" rule so that a
 * clean listing with a normal link is never penalised for this.
 */
function hasOfficialDomainOrContact(text, sourceUrl) {
    const candidates = collectUrlCandidates(text);
    if (sourceUrl)
        candidates.push(...collectUrlCandidates(sourceUrl));
    const hasProperDomain = candidates.some((c) => !isShortenedHost(c.host) && !isLookalikeHost(c.host));
    const hasContact = EMAIL_RE.test(text) || PHONE_RE.test(text);
    return hasProperDomain || hasContact;
}
// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------
/** Runs every visible rule over the listing and combines the points. */
function checkScam(text, options = {}) {
    const source = typeof text === 'string' ? text : '';
    if (source.trim().length === 0) {
        return {
            level: 'Low',
            score: 0,
            findings: [],
            highlights: [],
            safeNextSteps: exports.SCAM_SAFE_NEXT_STEPS,
            isClean: true,
            summary: 'Nothing to check yet — paste a listing to run the safety check.'
        };
    }
    const findings = [];
    const highlights = [];
    for (const rule of SCAM_RULES) {
        const matches = rule.find
            ? rule.find(source)
            : collectMatches(source, rule.patterns || []);
        if (matches.length === 0)
            continue;
        // A rule counts once, however many times it appears in the text.
        findings.push({
            ruleId: rule.id,
            label: rule.label,
            points: rule.points,
            severity: rule.severity,
            explanation: rule.explanation,
            matches
        });
        for (const match of matches) {
            highlights.push({
                ...match,
                ruleId: rule.id,
                label: rule.label,
                points: rule.points,
                severity: rule.severity,
                explanation: rule.explanation
            });
        }
    }
    if (!hasOfficialDomainOrContact(source, options.sourceUrl)) {
        findings.push({ ...NO_OFFICIAL_RULE, matches: [] });
    }
    highlights.sort((a, b) => a.start - b.start || a.end - b.end);
    const score = Math.min(100, findings.reduce((total, finding) => total + finding.points, 0));
    const level = score >= exports.SCAM_HIGH_THRESHOLD ? 'High' : score >= exports.SCAM_MEDIUM_THRESHOLD ? 'Medium' : 'Low';
    return {
        level,
        score,
        findings,
        highlights,
        safeNextSteps: exports.SCAM_SAFE_NEXT_STEPS,
        isClean: findings.length === 0,
        summary: summarise(level)
    };
}
function summarise(level) {
    if (level === 'High') {
        return 'Strong scam signs found. Do not pay anyone or share personal details.';
    }
    if (level === 'Medium') {
        return 'Some warning signs found. Verify the organisation before you share anything or pay anyone.';
    }
    return "No strong scam signs found. Still verify on the organisation's official site before you apply.";
}
//# sourceMappingURL=scam.js.map