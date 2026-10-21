"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CURATED_DISCOVERY_OPPORTUNITIES = exports.DiscoveryListingsOutputSchema = exports.DiscoveryListingSchema = exports.DiscoveryResultSchema = exports.DiscoverySkillGapSchema = exports.DiscoveryListingCardSchema = void 0;
exports.trustForSourceUrl = trustForSourceUrl;
exports.rankDiscoveryCards = rankDiscoveryCards;
exports.skillGapSummary = skillGapSummary;
exports.buildLocalDiscoveryCards = buildLocalDiscoveryCards;
const zod_1 = require("zod");
const index_js_1 = require("./types/index.js");
const index_js_2 = require("./parser/index.js");
const index_js_3 = require("./engine/index.js");
// ============================================================================
// Discovery types
//
// The DiscoveryAgent produces one card per discovered opportunity. Every card
// carries the title, organisation, source URL, a one-line fit reason, a trust
// badge, a mini status count (Match / Mismatch / Missing info) and the single
// fix that unlocks it. Cards are ranked by closeness to ready.
// ============================================================================
exports.DiscoveryListingCardSchema = zod_1.z.object({
    title: zod_1.z.string(),
    organisation: zod_1.z.string(),
    sourceUrl: zod_1.z.string(),
    opportunityType: zod_1.z.string(),
    fitReason: zod_1.z.string(),
    rawText: zod_1.z.string().default(''),
    trust: zod_1.z.enum(['Verified', 'Needs review', 'Unverified']),
    trustReasons: zod_1.z.array(zod_1.z.string()).default([]),
    counts: zod_1.z.object({
        matches: zod_1.z.number(),
        mismatches: zod_1.z.number(),
        missingInfo: zod_1.z.number(),
        total: zod_1.z.number()
    }),
    readiness: zod_1.z.enum(['Ready to apply', 'Almost ready', 'Not ready yet']),
    singleFix: zod_1.z.string().default(''),
    nextSteps: zod_1.z.array(zod_1.z.string()).default([]),
    requirements: zod_1.z.array(index_js_1.RequirementSchema).default([]),
    findings: zod_1.z.array(index_js_1.FindingSchema).default([]),
    aiSuggestedCount: zod_1.z.number().default(0)
});
exports.DiscoverySkillGapSchema = zod_1.z.object({
    skill: zod_1.z.string(),
    count: zod_1.z.number()
});
exports.DiscoveryResultSchema = zod_1.z.object({
    listings: zod_1.z.array(exports.DiscoveryListingCardSchema),
    skillGaps: zod_1.z.array(exports.DiscoverySkillGapSchema),
    notes: zod_1.z.array(zod_1.z.string()),
    confidence: zod_1.z.enum(['high', 'medium', 'low'])
});
/** What a search-capable provider returns for each listing (LLM output shape). */
exports.DiscoveryListingSchema = zod_1.z.object({
    title: zod_1.z.string(),
    organisation: zod_1.z.string(),
    sourceUrl: zod_1.z.string(),
    fitReason: zod_1.z.string(),
    // Optional listing text used to run the OpportunityReader. Falls back to the
    // fit reason when the provider returns nothing richer.
    description: zod_1.z.string().optional()
});
exports.DiscoveryListingsOutputSchema = zod_1.z.object({
    listings: zod_1.z.array(exports.DiscoveryListingSchema),
    notes: zod_1.z.array(zod_1.z.string()),
    confidence: zod_1.z.enum(['high', 'medium', 'low'])
});
exports.CURATED_DISCOVERY_OPPORTUNITIES = [
    {
        title: 'Summer Software Engineering Intern',
        organisation: 'Infosys',
        sourceUrl: 'https://infosys.com/careers/internship',
        opportunityType: 'internship',
        category: 'Internship',
        fitReason: 'Open to 2nd and 3rd-year students and matches your CGPA.',
        text: 'Open to 2nd or 3rd-year B.Tech/B.E. students. Minimum CGPA 7.0. Skills: Java, Spring Boot, SQL. Resume required. Available for 8 weeks.'
    },
    {
        title: 'STEP Intern (Software Engineering)',
        organisation: 'Google',
        sourceUrl: 'https://careers.google.com/step',
        opportunityType: 'internship',
        category: 'Internship',
        fitReason: 'Aimed at 1st and 2nd-year students with your academic standing.',
        text: 'Open to 1st or 2nd-year students in Computer Science. Minimum CGPA 8.0. Skills: Data Structures, Algorithms, Python. Portfolio or GitHub link required. Available for 12 weeks.'
    },
    {
        title: 'Research Internship (Data Science)',
        organisation: 'TCS Research',
        sourceUrl: 'https://tcs.com/careers',
        opportunityType: 'internship',
        category: 'Internship',
        fitReason: 'Research-heavy role with a Python and data focus.',
        text: 'Research internship for 3rd-year B.Tech students. Minimum CGPA 8.5. Skills: Python, Machine Learning, Data Structures. Resume and portfolio or GitHub link required. Available for 10 weeks.'
    },
    {
        title: 'IoT & Embedded Systems Engineering Intern',
        organisation: 'NIT Rourkela',
        sourceUrl: 'https://nitrkl.ac.in/internships',
        opportunityType: 'internship',
        category: 'IoT Internship',
        fitReason: 'Hands-on embedded role with a published code requirement.',
        text: '12-week summer engineering internship for electronics or computer science students. Must have completed at least 1 verified IoT or Embedded Systems project with public code or demo proof. Active LinkedIn profile link required. Skills: Embedded C, Arduino, ESP32, MQTT, Sensors. Available for 12 weeks.'
    },
    {
        title: 'GRiD Engineering Campus Challenge',
        organisation: 'Flipkart',
        sourceUrl: 'https://flipkartgrid.com',
        opportunityType: 'competition',
        category: 'Competition',
        fitReason: 'Builds on your existing project portfolio and problem-solving focus.',
        text: 'Engineering campus challenge for 2nd and 3rd-year students. Team size must be between 1 and 3 members. Skills: Data Structures, Algorithms, Problem Solving. Minimum 1 verified project required. Submission deadline: December 15, 2026.'
    },
    {
        title: 'Smart India Hackathon 2026',
        organisation: 'Ministry of Education',
        sourceUrl: 'https://sih.gov.in',
        opportunityType: 'competition',
        category: 'Competition',
        fitReason: 'Open to all college students in any branch and year.',
        text: 'National innovation competition for college students. Team size must be between 2 and 6 members. Each team must submit a public GitHub repository link. Minimum 1 verified project required. Final project submission deadline: December 10, 2026.'
    },
    {
        title: 'Girl Hackathon 2026',
        organisation: 'Google',
        sourceUrl: 'https://buildyourfuture.withgoogle.com',
        opportunityType: 'competition',
        category: 'Competition',
        fitReason: 'Frontend-focused challenge using the web skills already in your profile.',
        text: 'Competition for women in engineering. Open to 2nd and 3rd-year students. Team size must be between 2 and 4 members. Skills: HTML, CSS, JavaScript. Public GitHub repository link required. Submission deadline: January 20, 2027.'
    },
    {
        title: 'National Merit-cum-Means Scholarship 2026',
        organisation: 'National Scholarship Portal',
        sourceUrl: 'https://scholarships.gov.in',
        opportunityType: 'scholarship',
        category: 'Scholarship',
        fitReason: 'Your CGPA clears the cut-off and you already have a resume on file.',
        text: 'Open to 2nd or 3rd-year B.Tech engineering students with minimum 80% marks (or CGPA 8.0/10). Family annual gross income must not exceed Rs 6,00,000 per annum. Marksheet, income certificate and student resume required.'
    },
    {
        title: 'Pragati Scholarship for Girls',
        organisation: 'AICTE',
        sourceUrl: 'https://aicte-india.org',
        opportunityType: 'scholarship',
        category: 'Scholarship',
        fitReason: 'Government scholarship for AICTE-approved programmes.',
        text: 'Open to 1st-year girl students in an AICTE-approved degree or diploma programme. Family annual gross income must not exceed Rs 8,00,000 per annum. Marksheet and income certificate required.'
    },
    {
        title: 'Reliance Foundation Undergraduate Scholarship',
        organisation: 'Reliance Foundation',
        sourceUrl: 'https://scholarships.reliancefoundation.org',
        opportunityType: 'scholarship',
        category: 'Scholarship',
        fitReason: 'Merit-based support for undergraduate students in any discipline.',
        text: 'Open to 1st-year undergraduate students in any discipline. Minimum CGPA 6.0. Family annual gross income must not exceed Rs 15,00,000 per annum. Marksheet and resume required.'
    },
    {
        title: 'INSPIRE Scholarship for Higher Education',
        organisation: 'Department of Science and Technology',
        sourceUrl: 'https://online-inspire.gov.in',
        opportunityType: 'scholarship',
        category: 'Scholarship',
        fitReason: 'Prestigious science scholarship with a straightforward CGPA bar.',
        text: 'Scholarship for students pursuing a Bachelor degree in the natural or basic sciences. Open to 1st-year students. Minimum CGPA 8.0. Marksheet required.'
    },
    {
        title: 'Learn Student Ambassador Programme',
        organisation: 'Microsoft',
        sourceUrl: 'https://mvp.microsoft.com/studentambassadors',
        opportunityType: 'internship',
        category: 'Programme',
        fitReason: 'Community and cloud programme for technology-focused undergraduates.',
        text: 'Programme for undergraduate students passionate about technology. Open to 2nd, 3rd and 4th-year students. Skills: Public Speaking, Community Building, Microsoft Azure. Portfolio or GitHub link required. Available for 8 weeks.'
    }
];
// ============================================================================
// Transparent trust label for a source URL (used by the offline browser
// fallback; the VerifierAgent applies the fuller check list on the backend).
// ============================================================================
const OFFICIAL_SUFFIXES = ['.gov.in', '.gov', '.ac.in', '.ac', '.edu', '.edu.in', '.nic.in', '.res.in'];
function trustForSourceUrl(url) {
    let parsed = null;
    try {
        parsed = new URL((url || '').trim());
    }
    catch {
        return 'Unverified';
    }
    if (parsed.protocol !== 'https:')
        return 'Unverified';
    const host = parsed.hostname.toLowerCase();
    const official = OFFICIAL_SUFFIXES.some((s) => host === s.slice(1) || host.endsWith(s));
    return official ? 'Verified' : 'Needs review';
}
// ============================================================================
// Ranking & skill-gap summary
// ============================================================================
/** Closeness to ready: fewest Mismatch, then fewest Missing info. */
function rankDiscoveryCards(cards) {
    return [...cards].sort((a, b) => a.counts.mismatches - b.counts.mismatches ||
        a.counts.missingInfo - b.counts.missingInfo);
}
/** Skills missing most often across all checked opportunities (top 6). */
function skillGapSummary(cards, profile) {
    const profileCanonical = new Set((profile.skills || []).map((s) => (0, index_js_3.canonicalizeSkill)(s)).filter(Boolean));
    const display = new Map();
    const counts = new Map();
    for (const card of cards) {
        for (const req of card.requirements) {
            if (req.kind !== 'skills' || !Array.isArray(req.value))
                continue;
            for (const raw of req.value) {
                const canonical = (0, index_js_3.canonicalizeSkill)(String(raw));
                if (!canonical || profileCanonical.has(canonical))
                    continue;
                if (!display.has(canonical))
                    display.set(canonical, String(raw).trim());
                counts.set(canonical, (counts.get(canonical) || 0) + 1);
            }
        }
    }
    return [...counts.entries()]
        .map(([canonical, count]) => ({ skill: display.get(canonical) || canonical, count }))
        .sort((a, b) => b.count - a.count || a.skill.localeCompare(b.skill))
        .slice(0, 6);
}
// ============================================================================
// Local (offline / demo) builder
//
// Runs the curated list through the deterministic rule parser and the rule
// engine — no LLM, no network — so the /discover page still works when live
// search or the backend is unavailable.
// ============================================================================
/** Builds one card from a listing's text using the parser + rule engine. */
function buildCardFromListing(listing, profile) {
    const { checklist } = (0, index_js_2.parseOpportunityToChecklist)(listing.text, listing.title);
    const requirements = checklist.requirements;
    const result = (0, index_js_3.compare)(requirements, profile);
    return {
        title: listing.title,
        organisation: listing.organisation,
        sourceUrl: listing.sourceUrl,
        opportunityType: listing.opportunityType,
        fitReason: listing.fitReason,
        rawText: listing.text,
        trust: trustForSourceUrl(listing.sourceUrl),
        trustReasons: [],
        counts: {
            matches: result.counts.matches,
            mismatches: result.counts.mismatches,
            missingInfo: result.counts.missingInfo,
            total: result.counts.total ?? requirements.length
        },
        readiness: result.readiness,
        singleFix: result.nextSteps[0] || '',
        nextSteps: result.nextSteps,
        requirements: requirements,
        findings: result.findings,
        aiSuggestedCount: 0
    };
}
function buildLocalDiscoveryCards(profile) {
    const cards = exports.CURATED_DISCOVERY_OPPORTUNITIES.map((opp) => buildCardFromListing(opp, profile));
    return {
        listings: rankDiscoveryCards(cards),
        skillGaps: skillGapSummary(cards, profile),
        notes: [
            `Checked ${cards.length} curated opportunities with the rule parser, the verifier and the rule engine.`,
            'Live search was unavailable, so a curated local list was used.'
        ],
        confidence: 'medium'
    };
}
//# sourceMappingURL=discovery.js.map