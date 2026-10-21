"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.additionalSamples = exports.sampleOpportunities = exports.iotInternshipOpportunity = exports.competitionOpportunity = exports.scholarshipOpportunity = exports.sampleChecklist = exports.sampleStudentProfile = exports.sampleProfile = exports.sampleOpportunityText = exports.ADDITIONAL_SAMPLES = exports.SAMPLE_OPPORTUNITIES = exports.IOT_STUDENT_PROFILE = exports.IOT_INTERNSHIP_CHECKLIST = exports.IOT_INTERNSHIP_SAMPLE_TITLE = exports.IOT_INTERNSHIP_SAMPLE_TEXT = exports.COMPETITION_STUDENT_PROFILE = exports.COMPETITION_CHECKLIST = exports.COMPETITION_SAMPLE_TITLE = exports.COMPETITION_SAMPLE_TEXT = exports.SCHOLARSHIP_STUDENT_PROFILE = exports.SCHOLARSHIP_CHECKLIST = exports.SCHOLARSHIP_SAMPLE_TITLE = exports.SCHOLARSHIP_SAMPLE_TEXT = exports.EXPECTED_SAMPLE_RESULTS = exports.SAMPLE_STUDENT_PROFILE = exports.SAMPLE_CHECKLIST = exports.SAMPLE_OPPORTUNITY_TITLE = exports.SAMPLE_OPPORTUNITY_TEXT = void 0;
// ============================================================================
// 1. Benchmark Sample Data from the SETU 2026 OpportunityKit Master Context
// ============================================================================
exports.SAMPLE_OPPORTUNITY_TEXT = '2nd or 3rd-year B.Tech/B.E. student. CGPA 7.5 or above. Skills: HTML, CSS, JavaScript. Resume required. Portfolio or GitHub link required. Available for 8 weeks.';
exports.SAMPLE_OPPORTUNITY_TITLE = 'Summer Engineering Intern (Benchmark PS-03)';
exports.SAMPLE_CHECKLIST = {
    opportunityType: 'internship',
    title: exports.SAMPLE_OPPORTUNITY_TITLE,
    requirements: [
        {
            id: 'req-year',
            kind: 'year',
            label: 'Year of Study',
            value: [2, 3],
            required: true,
            title: 'Year of Study',
            category: 'education',
            rule: '2nd or 3rd-year B.Tech/B.E. student'
        },
        {
            id: 'req-cgpa',
            kind: 'cgpa',
            label: 'CGPA Requirement',
            value: 7.5,
            required: true,
            title: 'CGPA Requirement',
            category: 'academic',
            rule: 'CGPA 7.5 or above'
        },
        {
            id: 'req-skills',
            kind: 'skills',
            label: 'Technical Skills',
            value: ['HTML', 'CSS', 'JavaScript'],
            required: true,
            title: 'Technical Skills',
            category: 'skills',
            rule: 'Skills: HTML, CSS, JavaScript'
        },
        {
            id: 'req-resume',
            kind: 'document',
            label: 'Resume Requirement',
            value: 'resume',
            required: true,
            title: 'Resume Requirement',
            category: 'documents',
            rule: 'Resume required'
        },
        {
            id: 'req-portfolio-github',
            kind: 'link',
            label: 'Portfolio / GitHub Link',
            value: 'portfolioOrGithub',
            required: true,
            title: 'Portfolio / GitHub Link',
            category: 'links',
            rule: 'Portfolio or GitHub link required'
        },
        {
            id: 'req-availability',
            kind: 'availability',
            label: 'Availability',
            value: 8,
            required: true,
            title: 'Availability',
            category: 'availability',
            rule: 'Available for 8 weeks'
        }
    ],
    sources: ['SETU 2026 Problem Statement PS-03 Specification Document']
};
exports.SAMPLE_STUDENT_PROFILE = {
    id: 'student-benchmark-01',
    name: 'Alex Sharma',
    year: 2,
    branch: 'CSE',
    cgpa: 8.2,
    skills: ['HTML', 'CSS', 'Python'],
    documents: [
        {
            id: 'doc-resume-01',
            name: 'Alex_Sharma_Resume.pdf',
            type: 'resume',
            url: 'https://storage.example.com/resumes/alex-sharma.pdf',
            verified: true
        }
    ],
    availabilityWeeks: null,
    links: {
        github: '',
        linkedin: 'https://linkedin.com/in/alexsharma',
        instagram: '',
        portfolio: ''
    },
    projects: [
        {
            id: 'proj-1',
            title: 'Personal Portfolio Site',
            domains: ['Web Development', 'Frontend'],
            tech: ['HTML', 'CSS'],
            role: 'Frontend Developer',
            status: 'completed',
            proofLink: 'https://alexsharma.example.com',
            description: 'Static website built using HTML and modern CSS styling.',
            techStack: ['HTML', 'CSS']
        },
        {
            id: 'proj-2',
            title: 'Data Analysis Scripts',
            domains: ['Data Science', 'Automation'],
            tech: ['Python'],
            role: 'Data Analyst',
            status: 'completed',
            proofLink: 'https://gitlab.com/alexsharma/data-scripts',
            description: 'Automated data scraping and analysis toolkit in Python.',
            techStack: ['Python']
        }
    ],
    // Business Model & Plan Gating
    plan: 'free',
    monthlyChecksUsed: 3,
    monthlyChecksLimit: 5,
    // Backward compatibility fields
    yearOfStudy: 2,
    degree: 'B.Tech CSE',
    hasResume: true,
    resumeUrl: 'https://storage.example.com/resumes/alex-sharma.pdf',
    githubUrl: '',
    portfolioUrl: ''
};
exports.EXPECTED_SAMPLE_RESULTS = {
    requirementsCount: 6,
    statuses: {
        year: 'Match',
        cgpa: 'Match',
        skills: 'Mismatch', // JavaScript missing
        resume: 'Match',
        portfolioOrGithub: 'Missing info',
        availability: 'Missing info'
    },
    summary: {
        matches: 3,
        mismatches: 1,
        missingInfo: 2,
        overallVerdict: 'Not ready to apply yet'
    }
};
// ============================================================================
// 2. Sample Opportunity 1: Scholarship with Marks Cut-off & Income Limit
// ============================================================================
exports.SCHOLARSHIP_SAMPLE_TEXT = 'Open to 2nd or 3rd-year B.Tech/B.E. engineering students with minimum 80% marks (or CGPA 8.0/10) in previous semesters. Family annual gross income must not exceed Rs 6,00,000 per annum. Marksheet, income certificate, and student resume required.';
exports.SCHOLARSHIP_SAMPLE_TITLE = 'National Merit-cum-Means STEM Scholarship 2026';
exports.SCHOLARSHIP_CHECKLIST = {
    opportunityType: 'scholarship',
    title: exports.SCHOLARSHIP_SAMPLE_TITLE,
    requirements: [
        {
            id: 'req-schol-year',
            kind: 'year',
            label: 'Academic Year',
            value: [2, 3],
            required: true,
            title: 'Academic Year (2nd or 3rd Year)',
            category: 'education',
            rule: '2nd or 3rd-year B.Tech/B.E. engineering students'
        },
        {
            id: 'req-schol-cgpa',
            kind: 'cgpa',
            label: 'Marks Cut-off',
            value: 8.0,
            required: true,
            title: 'Minimum CGPA 8.0 (80% Marks Cut-off)',
            category: 'academic',
            rule: 'Minimum 80% marks (or CGPA 8.0/10) in previous semesters'
        },
        {
            id: 'req-schol-income',
            kind: 'custom',
            label: 'Income Limit',
            value: 'Family annual income <= Rs 6,00,000',
            required: true,
            title: 'Annual Family Income Limit',
            category: 'general',
            rule: 'Family annual gross income must not exceed Rs 6,00,000 per annum'
        },
        {
            id: 'req-schol-marksheet',
            kind: 'document',
            label: 'Semester Marksheet',
            value: 'marksheet',
            required: true,
            title: 'Previous Semesters Marksheet',
            category: 'documents',
            rule: 'Marksheet required'
        },
        {
            id: 'req-schol-income-cert',
            kind: 'document',
            label: 'Income Certificate',
            value: 'incomeCertificate',
            required: true,
            title: 'Government Income Certificate',
            category: 'documents',
            rule: 'Income certificate required'
        },
        {
            id: 'req-schol-resume',
            kind: 'document',
            label: 'Student Resume',
            value: 'resume',
            required: true,
            title: 'Student Resume',
            category: 'documents',
            rule: 'Student resume required'
        }
    ],
    sources: ['Ministry of Higher Education National Scholarship Portal 2026']
};
exports.SCHOLARSHIP_STUDENT_PROFILE = {
    id: 'student-schol-01',
    name: 'Priya Patel',
    year: 2,
    branch: 'ECE',
    cgpa: 8.9,
    skills: ['Embedded C', 'MATLAB', 'Circuit Design'],
    documents: [
        {
            id: 'doc-resume-02',
            name: 'Priya_Patel_Resume.pdf',
            type: 'resume',
            url: 'https://storage.example.com/resumes/priya-patel.pdf',
            verified: true
        },
        {
            id: 'doc-marksheet-01',
            name: 'Sem1_Sem2_Consolidated_Marksheet.pdf',
            type: 'marksheet',
            url: 'https://storage.example.com/transcripts/priya-marksheet.pdf',
            verified: true
        },
        {
            id: 'doc-income-01',
            name: 'Tehsildar_Income_Certificate_2026.pdf',
            type: 'incomeCertificate',
            url: 'https://storage.example.com/certificates/priya-income.pdf',
            verified: true
        }
    ],
    availabilityWeeks: 10,
    links: {
        github: 'https://github.com/priyapatel',
        linkedin: 'https://linkedin.com/in/priyapatel',
        instagram: '',
        portfolio: ''
    },
    projects: [
        {
            id: 'proj-schol-1',
            title: 'Automated Solar Battery Inverter',
            domains: ['Embedded Systems', 'Clean Energy'],
            tech: ['Embedded C', 'MATLAB', 'Arduino'],
            role: 'Hardware Engineer',
            status: 'completed',
            proofLink: 'https://github.com/priyapatel/solar-inverter',
            description: 'Microcontroller based dual-inverter system.'
        }
    ],
    yearOfStudy: 2,
    degree: 'B.E. Electronics',
    hasResume: true,
    resumeUrl: 'https://storage.example.com/resumes/priya-patel.pdf',
    githubUrl: 'https://github.com/priyapatel'
};
// ============================================================================
// 3. Sample Opportunity 2: Competition with Team Size & Deadline
// ============================================================================
exports.COMPETITION_SAMPLE_TEXT = 'National competition for college students to build AI or IoT campus solutions. Team size must be between 2 to 4 members. Each team must submit a public GitHub repository link. Minimum 1 verified software or hardware project required. Final project submission deadline: November 15, 2026.';
exports.COMPETITION_SAMPLE_TITLE = 'Smart Campus National Innovation Hackathon 2026';
exports.COMPETITION_CHECKLIST = {
    opportunityType: 'competition',
    title: exports.COMPETITION_SAMPLE_TITLE,
    requirements: [
        {
            id: 'req-comp-team',
            kind: 'custom',
            label: 'Team Size',
            value: '2-4 members',
            required: true,
            title: 'Team Size Requirement (2 to 4 members)',
            category: 'general',
            rule: 'Team size must be between 2 to 4 members'
        },
        {
            id: 'req-comp-deadline',
            kind: 'deadline',
            label: 'Submission Deadline',
            value: '2026-11-15',
            required: true,
            title: 'Final Submission Deadline: November 15, 2026',
            category: 'general',
            rule: 'Final project submission deadline: November 15, 2026'
        },
        {
            id: 'req-comp-github',
            kind: 'link',
            label: 'GitHub Link',
            value: 'github',
            required: true,
            title: 'Public GitHub Repository Link',
            category: 'links',
            rule: 'Each team must submit a public GitHub repository link'
        },
        {
            id: 'req-comp-project',
            kind: 'projectCount',
            label: 'Project Count',
            value: 1,
            required: true,
            title: 'Minimum 1 Completed Project',
            category: 'experience',
            rule: 'Minimum 1 verified software or hardware project required'
        }
    ],
    sources: ['Smart India Innovation Initiative', 'National Student Competition Portal']
};
exports.COMPETITION_STUDENT_PROFILE = {
    id: 'student-comp-01',
    name: 'Rohan Verma',
    year: 3,
    branch: 'IT',
    cgpa: 8.0,
    skills: ['TypeScript', 'React', 'Node.js', 'Git', 'Docker'],
    documents: [
        {
            id: 'doc-resume-03',
            name: 'Rohan_Verma_Resume.pdf',
            type: 'resume',
            url: 'https://storage.example.com/resumes/rohan.pdf',
            verified: true
        }
    ],
    availabilityWeeks: 12,
    links: {
        github: 'https://github.com/rohanverma',
        linkedin: 'https://linkedin.com/in/rohanverma',
        instagram: '',
        portfolio: 'https://rohan.dev'
    },
    projects: [
        {
            id: 'proj-comp-1',
            title: 'Campus Food Delivery Logistics',
            domains: ['Web Application', 'Logistics'],
            tech: ['React', 'Node.js', 'PostgreSQL'],
            role: 'Team Lead',
            status: 'completed',
            proofLink: 'https://github.com/rohanverma/campus-delivery',
            description: 'Full-stack peer-to-peer campus delivery web app.'
        },
        {
            id: 'proj-comp-2',
            title: 'Hostel Room Energy Tracker',
            domains: ['IoT', 'Analytics'],
            tech: ['ESP32', 'MQTT', 'Next.js'],
            role: 'IoT Developer',
            status: 'completed',
            proofLink: 'https://github.com/rohanverma/energy-monitor',
            description: 'Smart meter pulse reader with dashboard.'
        }
    ],
    yearOfStudy: 3,
    degree: 'B.Tech IT',
    hasResume: true,
    resumeUrl: 'https://storage.example.com/resumes/rohan.pdf',
    githubUrl: 'https://github.com/rohanverma',
    portfolioUrl: 'https://rohan.dev'
};
// ============================================================================
// 4. Sample Opportunity 3: IoT Internship that needs 1 IoT Project & LinkedIn Link
// ============================================================================
exports.IOT_INTERNSHIP_SAMPLE_TEXT = '12-week summer engineering internship for electronics or computer science students. Must have completed at least 1 verified IoT or Embedded Systems project with public code or demo proof. Active LinkedIn profile link required. Technical skills: Embedded C, Arduino, ESP32, MQTT, Sensors. Available for 12 weeks.';
exports.IOT_INTERNSHIP_SAMPLE_TITLE = 'IoT & Embedded Systems Engineering Intern';
exports.IOT_INTERNSHIP_CHECKLIST = {
    opportunityType: 'internship',
    title: exports.IOT_INTERNSHIP_SAMPLE_TITLE,
    requirements: [
        {
            id: 'req-iot-year',
            kind: 'year',
            label: 'Academic Year',
            value: [2, 3],
            required: true,
            title: 'Academic Year (2nd or 3rd Year)',
            category: 'education',
            rule: 'Electronics or Computer Science student in 2nd or 3rd year'
        },
        {
            id: 'req-iot-project-tag',
            kind: 'projectTag',
            label: 'IoT Project Tag',
            value: 'IoT',
            required: true,
            title: 'Verified IoT / Embedded Systems Project',
            category: 'experience',
            rule: 'Must have completed at least 1 verified IoT or Embedded Systems project'
        },
        {
            id: 'req-iot-project-count',
            kind: 'projectCount',
            label: 'Project Count',
            value: 1,
            required: true,
            title: 'Minimum 1 Completed Project',
            category: 'experience',
            rule: 'At least 1 project required with public code or demo proof'
        },
        {
            id: 'req-iot-linkedin',
            kind: 'link',
            label: 'LinkedIn Profile',
            value: 'linkedin',
            required: true,
            title: 'Active LinkedIn Profile Link',
            category: 'links',
            rule: 'Active LinkedIn profile link required'
        },
        {
            id: 'req-iot-skills',
            kind: 'skills',
            label: 'Technical Skills',
            value: ['Embedded C', 'Arduino', 'ESP32', 'MQTT', 'Sensors'],
            required: true,
            title: 'Technical Skills (Embedded C, Arduino, ESP32, MQTT)',
            category: 'skills',
            rule: 'Skills: Embedded C, Arduino, ESP32, MQTT, Sensors'
        },
        {
            id: 'req-iot-availability',
            kind: 'availability',
            label: 'Availability',
            value: 12,
            required: true,
            title: 'Availability for 12 Weeks',
            category: 'availability',
            rule: 'Available for 12 weeks'
        }
    ],
    sources: ['Industrial Embedded Robotics Lab Internship Notice', 'Smart Hardware Division']
};
exports.IOT_STUDENT_PROFILE = {
    id: 'student-iot-01',
    name: 'Devika Nair',
    year: 3,
    branch: 'Electronics & Communication',
    cgpa: 8.4,
    skills: ['Embedded C', 'Arduino', 'ESP32', 'MQTT', 'C++', 'Sensors'],
    documents: [
        {
            id: 'doc-resume-04',
            name: 'Devika_Nair_Resume.pdf',
            type: 'resume',
            url: 'https://storage.example.com/resumes/devika.pdf',
            verified: true
        }
    ],
    availabilityWeeks: 12,
    links: {
        github: 'https://github.com/devikanair',
        linkedin: 'https://linkedin.com/in/devikanair-embedded',
        instagram: '',
        portfolio: 'https://devikanair.tech'
    },
    projects: [
        {
            id: 'proj-iot-1',
            title: 'Smart Solar-Powered Weather Station',
            domains: ['IoT', 'Embedded Systems', 'Hardware'],
            tech: ['ESP32', 'Embedded C', 'MQTT', 'BME280 Sensor', 'Solar'],
            role: 'Hardware & Firmware Engineer',
            status: 'completed',
            proofLink: 'https://github.com/devikanair/smart-weather-iot',
            description: 'Remote telemetry IoT station transmitting humidity, temperature, and solar yield data over MQTT.'
        }
    ],
    yearOfStudy: 3,
    degree: 'B.Tech ECE',
    hasResume: true,
    resumeUrl: 'https://storage.example.com/resumes/devika.pdf',
    githubUrl: 'https://github.com/devikanair',
    portfolioUrl: 'https://devikanair.tech'
};
// ============================================================================
// 5. Consolidated Sample Registry
// ============================================================================
exports.SAMPLE_OPPORTUNITIES = [
    {
        title: exports.SAMPLE_OPPORTUNITY_TITLE,
        text: exports.SAMPLE_OPPORTUNITY_TEXT,
        checklist: exports.SAMPLE_CHECKLIST,
        profile: exports.SAMPLE_STUDENT_PROFILE,
        category: 'Internship'
    },
    {
        title: exports.SCHOLARSHIP_SAMPLE_TITLE,
        text: exports.SCHOLARSHIP_SAMPLE_TEXT,
        checklist: exports.SCHOLARSHIP_CHECKLIST,
        profile: exports.SCHOLARSHIP_STUDENT_PROFILE,
        category: 'Scholarship'
    },
    {
        title: exports.COMPETITION_SAMPLE_TITLE,
        text: exports.COMPETITION_SAMPLE_TEXT,
        checklist: exports.COMPETITION_CHECKLIST,
        profile: exports.COMPETITION_STUDENT_PROFILE,
        category: 'Competition'
    },
    {
        title: exports.IOT_INTERNSHIP_SAMPLE_TITLE,
        text: exports.IOT_INTERNSHIP_SAMPLE_TEXT,
        checklist: exports.IOT_INTERNSHIP_CHECKLIST,
        profile: exports.IOT_STUDENT_PROFILE,
        category: 'IoT Internship'
    }
];
exports.ADDITIONAL_SAMPLES = exports.SAMPLE_OPPORTUNITIES.slice(1);
// Standard aliases matching common naming conventions
exports.sampleOpportunityText = exports.SAMPLE_OPPORTUNITY_TEXT;
exports.sampleProfile = exports.SAMPLE_STUDENT_PROFILE;
exports.sampleStudentProfile = exports.SAMPLE_STUDENT_PROFILE;
exports.sampleChecklist = exports.SAMPLE_CHECKLIST;
exports.scholarshipOpportunity = exports.SAMPLE_OPPORTUNITIES[1];
exports.competitionOpportunity = exports.SAMPLE_OPPORTUNITIES[2];
exports.iotInternshipOpportunity = exports.SAMPLE_OPPORTUNITIES[3];
exports.sampleOpportunities = exports.SAMPLE_OPPORTUNITIES;
exports.additionalSamples = exports.ADDITIONAL_SAMPLES;
//# sourceMappingURL=sample.js.map