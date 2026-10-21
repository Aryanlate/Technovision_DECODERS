import { StudentProfile, Requirement, evaluateProfileAgainstOpportunity } from '@opportunity-kit/shared';

export interface BatchStudent extends StudentProfile {
  rollNo: string;
  collegeName: string;
  section: string;
  isProfileComplete: boolean;
  hasVerifiedLinks: boolean;
  readinessCategory: 'Ready' | 'Almost ready' | 'Not ready';
  missingSkillsList: string[];
}

const COMMON_SKILLS_POOL = [
  'Python',
  'HTML',
  'CSS',
  'JavaScript',
  'TypeScript',
  'React',
  'Node.js',
  'SQL',
  'Docker',
  'Kubernetes',
  'AWS',
  'Git',
  'C++',
  'Java',
  'GraphQL',
  'MongoDB',
  'System Design'
];

const FIRST_NAMES = [
  'Aarav', 'Ananya', 'Rohan', 'Priya', 'Aditya', 'Neha', 'Vikram', 'Tanvi', 'Kabir', 'Isha',
  'Siddharth', 'Pooja', 'Rahul', 'Sneha', 'Arjun', 'Meera', 'Varun', 'Rhea', 'Karan', 'Diya',
  'Ayush', 'Shreya', 'Dev', 'Kavya', 'Manish', 'Simran', 'Nikhil', 'Ritu', 'Pranav', 'Kritika'
];

const LAST_NAMES = [
  'Sharma', 'Verma', 'Nair', 'Patel', 'Mehta', 'Gupta', 'Iyer', 'Reddy', 'Singh', 'Deshmukh',
  'Banerjee', 'Chopra', 'Malhotra', 'Joshi', 'Bhat', 'Rao', 'Kulkarni', 'Kapoor', 'Das', 'Sen'
];

/**
 * Generates deterministic 120 student profiles for the placement cell dashboard.
 */
function generate120Students(): BatchStudent[] {
  const students: BatchStudent[] = [];

  for (let i = 1; i <= 120; i++) {
    const fn = FIRST_NAMES[(i * 7) % FIRST_NAMES.length];
    const ln = LAST_NAMES[(i * 11) % LAST_NAMES.length];
    const rollNo = `2022-CSE-${String(i).padStart(3, '0')}`;
    const branch = i % 5 === 0 ? 'IT' : i % 7 === 0 ? 'ECE' : i % 11 === 0 ? 'AI&DS' : 'CSE';
    const year = i % 15 === 0 ? 4 : 3;

    // Pseudo-random CGPA between 6.5 and 9.6
    const cgpaBase = 7.0 + (((i * 17) % 27) / 10);
    const cgpa = Math.min(9.8, Math.max(6.5, parseFloat(cgpaBase.toFixed(2))));

    // Skills distribution
    const numSkills = 3 + ((i * 3) % 6);
    const skills: string[] = [];
    for (let s = 0; s < numSkills; s++) {
      const sk = COMMON_SKILLS_POOL[(i * 5 + s * 3) % COMMON_SKILLS_POOL.length];
      if (!skills.includes(sk)) skills.push(sk);
    }

    // Always ensure basic web/languages for some
    if (i % 2 === 0 && !skills.includes('HTML')) skills.push('HTML');
    if (i % 2 === 0 && !skills.includes('CSS')) skills.push('CSS');
    if (i % 3 === 0 && !skills.includes('JavaScript')) skills.push('JavaScript');
    if (i % 4 === 0 && !skills.includes('Python')) skills.push('Python');

    const hasResume = i % 8 !== 0; // ~88% have resume
    const hasGithub = i % 6 !== 0; // ~83% have github
    const hasLinkedin = i % 5 !== 0; // ~80% have linkedin
    const hasPortfolio = i % 7 === 0;

    const ghUrl = hasGithub ? `https://github.com/${fn.toLowerCase()}${ln.toLowerCase()}` : '';
    const liUrl = hasLinkedin ? `https://linkedin.com/in/${fn.toLowerCase()}${ln.toLowerCase()}` : '';
    const pfUrl = hasPortfolio ? `https://${fn.toLowerCase()}.dev` : '';

    const hasLinks = Boolean(ghUrl || liUrl || pfUrl);
    const isComplete = hasResume && hasLinks && skills.length >= 4 && cgpa >= 7.0;

    // Initial readiness estimation
    let readiness: 'Ready' | 'Almost ready' | 'Not ready';
    if (cgpa >= 7.8 && hasResume && hasLinks && skills.length >= 4) {
      readiness = 'Ready';
    } else if (cgpa >= 6.8 && (hasResume || hasLinks)) {
      readiness = 'Almost ready';
    } else {
      readiness = 'Not ready';
    }

    students.push({
      id: `student-batch-${i}`,
      name: `${fn} ${ln}`,
      rollNo,
      collegeName: 'National Institute of Engineering & Technology',
      section: i <= 60 ? 'Section A' : 'Section B',
      year,
      branch,
      cgpa,
      skills,
      availabilityWeeks: i % 4 === 0 ? 12 : 8,
      documents: hasResume
        ? [
            {
              id: `doc-${i}-resume`,
              name: `${fn}_${ln}_Resume.pdf`,
              type: 'resume',
              verified: true
            }
          ]
        : [],
      links: {
        github: ghUrl,
        linkedin: liUrl,
        instagram: '',
        portfolio: pfUrl
      },
      projects: [
        {
          id: `proj-${i}-1`,
          title: `${skills[0] || 'Software'} Project`,
          domains: ['Software Engineering', branch],
          tech: skills.slice(0, 2),
          role: 'Lead Developer',
          status: 'completed',
          proofLink: ghUrl || 'https://github.com/project'
        }
      ],
      isProfileComplete: isComplete,
      hasVerifiedLinks: hasLinks,
      readinessCategory: readiness,
      missingSkillsList: []
    });
  }

  return students;
}

export const SAMPLE_BATCH_STUDENTS = generate120Students();

/**
 * Computes cohort analytics across the 120 batch students.
 */
export function getBatchAnalytics(students: BatchStudent[] = SAMPLE_BATCH_STUDENTS) {
  const total = students.length;
  const completeCount = students.filter((s) => s.isProfileComplete).length;
  const withLinksCount = students.filter((s) => s.hasVerifiedLinks).length;

  const readyCount = students.filter((s) => s.readinessCategory === 'Ready').length;
  const almostReadyCount = students.filter((s) => s.readinessCategory === 'Almost ready').length;
  const notReadyCount = students.filter((s) => s.readinessCategory === 'Not ready').length;

  // Compute most common missing in-demand industry skills
  const targetIndustrySkills = ['Docker', 'TypeScript', 'Kubernetes', 'AWS', 'GraphQL', 'System Design'];
  const missingSkillCounts: { skill: string; count: number; percentage: number }[] = targetIndustrySkills.map((sk) => {
    const missingStudents = students.filter((st) => !st.skills.map((s) => s.toLowerCase()).includes(sk.toLowerCase())).length;
    return {
      skill: sk,
      count: missingStudents,
      percentage: Math.round((missingStudents / total) * 100)
    };
  }).sort((a, b) => b.count - a.count);

  return {
    totalStudents: total,
    completeProfilesCount: completeCount,
    completeProfilesPercentage: Math.round((completeCount / total) * 100),
    withLinksCount,
    withLinksPercentage: Math.round((withLinksCount / total) * 100),
    readinessDistribution: {
      ready: { count: readyCount, percentage: Math.round((readyCount / total) * 100) },
      almostReady: { count: almostReadyCount, percentage: Math.round((almostReadyCount / total) * 100) },
      notReady: { count: notReadyCount, percentage: Math.round((notReadyCount / total) * 100) }
    },
    missingSkills: missingSkillCounts
  };
}

/**
 * Evaluates all 120 students against a custom company drive checklist.
 */
export function auditBatchAgainstChecklist(
  companyTitle: string,
  requirements: Requirement[],
  students: BatchStudent[] = SAMPLE_BATCH_STUDENTS
) {
  return students.map((student) => {
    const evalResult = evaluateProfileAgainstOpportunity(
      requirements,
      student,
      companyTitle,
      `Company Campus Drive for ${companyTitle}`
    );

    const matches = evalResult.counts.matches;
    const mismatches = evalResult.counts.mismatches;
    const missingInfo = evalResult.counts.missingInfo;
    const total = requirements.length || 1;

    let verdict: 'Ready' | 'Almost ready' | 'Not ready';
    if (mismatches === 0 && missingInfo === 0) {
      verdict = 'Ready';
    } else if (mismatches === 0 && missingInfo <= 2) {
      verdict = 'Almost ready';
    } else {
      verdict = 'Not ready';
    }

    return {
      student,
      evalResult,
      matches,
      mismatches,
      missingInfo,
      score: Math.round((matches / total) * 100),
      verdict
    };
  });
}
