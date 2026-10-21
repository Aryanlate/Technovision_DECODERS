'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  StudentProfile,
  Project,
  DocumentItem,
  SAMPLE_STUDENT_PROFILE
} from '@opportunity-kit/shared';
import { loadProfile, saveProfile, resetProfileToSample } from '../../lib/storage';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription
} from '../../components/Card';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Textarea } from '../../components/Textarea';
import { Badge } from '../../components/Badge';
import { Tag } from '../../components/Tag';
import { SectionTitle } from '../../components/SectionTitle';
import { analyzeLinkedInText } from '../../lib/api';
import { useTranslation } from '../../lib/i18n/LanguageProvider';

// ============================================================================
// Popular Technical Skill Suggestions
// ============================================================================
const POPULAR_SKILL_SUGGESTIONS = [
  'HTML',
  'CSS',
  'JavaScript',
  'TypeScript',
  'React',
  'Node.js',
  'Next.js',
  'Python',
  'Embedded C',
  'Arduino',
  'ESP32',
  'MQTT',
  'Sensors',
  'SQL',
  'PostgreSQL',
  'Docker',
  'Git'
];

// Document Types configuration
const DOCUMENT_OPTIONS = [
  {
    type: 'resume',
    labelKey: 'profile.docResume',
    hintKey: 'profile.docResumeHint'
  },
  {
    type: 'marksheet',
    labelKey: 'profile.docMarksheet',
    hintKey: 'profile.docMarksheetHint'
  },
  {
    type: 'incomeCertificate',
    labelKey: 'profile.docIncome',
    hintKey: 'profile.docIncomeHint'
  },
  {
    type: 'idProof',
    labelKey: 'profile.docIdProof',
    hintKey: 'profile.docIdProofHint'
  }
];

export default function ProfilePage() {
  const { t } = useTranslation();
  const [profile, setProfile] = useState<StudentProfile>(SAMPLE_STUDENT_PROFILE);
  const [skillInputText, setSkillInputText] = useState('');
  const [linkErrors, setLinkErrors] = useState<{ [key: string]: string }>({});
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Project Modal/Inline Editor State
  const [isEditingProject, setIsEditingProject] = useState(false);
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [projectForm, setProjectForm] = useState<Partial<Project>>({
    title: '',
    role: 'Contributor',
    status: 'completed',
    domains: [],
    tech: [],
    proofLink: ''
  });
  const [domainsInput, setDomainsInput] = useState('');
  const [techInput, setTechInput] = useState('');
  const [projectProofError, setProjectProofError] = useState('');

  // LinkedIn text area and data export state
  const [linkedInText, setLinkedInText] = useState('');
  const [isAnalyzingLinkedIn, setIsAnalyzingLinkedIn] = useState(false);
  const [linkedInSuggestions, setLinkedInSuggestions] = useState<any[]>([]);

  // Resume bullet & SOP snippet generator state
  const [resumeSnippets, setResumeSnippets] = useState<Record<string, { bullet: string; sop: string; loading?: boolean }>>({});
  const [copiedResumeId, setCopiedResumeId] = useState<string | null>(null);

  const generatePlainResumeTemplate = (project: any) => {
    const title = project.title || 'Engineering Project';
    const techStr = Array.isArray(project.tech) && project.tech.length > 0 ? project.tech.join(', ') : 'modern engineering frameworks';
    const roleStr = project.role || 'Project Contributor';
    const statusStr = project.status === 'completed' ? 'Completed' : 'Developed';

    const bullet = `${statusStr} ${title} as ${roleStr}, leveraging ${techStr} to implement core functional specifications and deliver verified software components.`;
    const sop = `As a ${roleStr} on ${title}, I utilized ${techStr} to architect practical solutions and advance key technical milestones. This hands-on project experience substantiated my engineering capabilities and prepared me to contribute effectively to demanding software initiatives.`;

    return { bullet, sop };
  };

  const handleGenerateResumeLine = async (project: any) => {
    setResumeSnippets((prev) => ({
      ...prev,
      [project.id]: { bullet: '', sop: '', loading: true }
    }));

    const fallback = generatePlainResumeTemplate(project);

    try {
      const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
      const res = await fetch(`${backendUrl}/api/generate-resume-line`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: project.title,
          tech: project.tech || [],
          role: project.role || 'Project Contributor',
          status: project.status || 'completed'
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.bullet && data.sop) {
          setResumeSnippets((prev) => ({
            ...prev,
            [project.id]: { bullet: data.bullet, sop: data.sop, loading: false }
          }));
          return;
        }
      }
    } catch {
      // Backend offline or unreachable; fall back to local template
    }

    setResumeSnippets((prev) => ({
      ...prev,
      [project.id]: { ...fallback, loading: false }
    }));
  };

  const handleCopyResumeSnippet = (projectId: string) => {
    const snippet = resumeSnippets[projectId];
    if (!snippet) return;
    const textToCopy = `Resume Bullet:\n• ${snippet.bullet}\n\nStatement of Purpose (SOP):\n${snippet.sop}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedResumeId(projectId);
    setTimeout(() => setCopiedResumeId(null), 2500);
  };

  // Initial load from Supabase or localStorage
  useEffect(() => {
    loadProfile().then((loaded) => {
      const loadedLinks = loaded?.links || {};
      const sampleLinks = SAMPLE_STUDENT_PROFILE.links || {};
      const normalized: StudentProfile = {
        ...SAMPLE_STUDENT_PROFILE,
        ...loaded,
        skills: Array.isArray(loaded?.skills) ? loaded.skills : (SAMPLE_STUDENT_PROFILE.skills || []),
        documents: Array.isArray(loaded?.documents) ? loaded.documents : (SAMPLE_STUDENT_PROFILE.documents || []),
        projects: Array.isArray(loaded?.projects) ? loaded.projects : (SAMPLE_STUDENT_PROFILE.projects || []),
        links: {
          github: loadedLinks.github ?? sampleLinks.github ?? '',
          linkedin: loadedLinks.linkedin ?? sampleLinks.linkedin ?? '',
          instagram: loadedLinks.instagram ?? sampleLinks.instagram ?? '',
          portfolio: loadedLinks.portfolio ?? sampleLinks.portfolio ?? ''
        },
        linkedInText: loaded?.linkedInText || ''
      };
      setProfile(normalized);
      if (normalized.linkedInText) {
        setLinkedInText(normalized.linkedInText);
      }
      setIsLoaded(true);
      validateAllLinks(normalized.links);
    });
  }, []);

  const handleLinkedInFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = String(event.target?.result || '');
      const cleaned = content.replace(/[^\x20-\x7E\n\r\t]/g, ' ').replace(/\s{2,}/g, ' ').trim();
      setLinkedInText(cleaned);
      setProfile((prev) => ({ ...prev, linkedInText: cleaned }));
    };
    reader.readAsText(file);
  };

  const handleAnalyzeLinkedIn = async () => {
    if (!linkedInText.trim()) return;
    setIsAnalyzingLinkedIn(true);
    try {
      const res = await analyzeLinkedInText(linkedInText, profile.links?.linkedin);
      const newSug: any[] = [];
      res.skills.forEach((s, idx) => {
        newSug.push({
          id: `li-sug-skill-${idx}-${Date.now()}`,
          type: 'skill',
          title: t('profile.suggestionSkill', { skill: s.skill }),
          description: s.sentence,
          value: s.skill,
          confidence: s.confidence
        });
      });
      res.experiences.forEach((exp, idx) => {
        newSug.push({
          id: `li-sug-exp-${idx}-${Date.now()}`,
          type: 'project',
          title: t('profile.suggestionExperience', { title: exp.title, company: exp.company }),
          description: exp.sentence,
          value: {
            title: `${exp.title} (${exp.company})`,
            domains: ['Professional Experience'],
            tech: [],
            role: exp.title,
            status: 'completed',
            proofLink: profile.links?.linkedin || 'https://linkedin.com'
          },
          confidence: exp.confidence
        });
      });
      setLinkedInSuggestions(newSug);
    } catch (err) {
      console.warn('LinkedIn extraction error:', err);
    } finally {
      setIsAnalyzingLinkedIn(false);
    }
  };

  const handleAcceptLinkedInSuggestion = (sug: any) => {
    if (sug.type === 'skill') {
      handleAddSkill(sug.value);
    } else if (sug.type === 'project') {
      const existing = profile.projects || [];
      const updatedProjects = [...existing, { ...sug.value, id: `proj-${Date.now()}` }];
      setProfile((prev) => ({ ...prev, projects: updatedProjects }));
    }
    setLinkedInSuggestions((prev) => prev.filter((item) => item.id !== sug.id));
  };

  const handleRejectLinkedInSuggestion = (sugId: string) => {
    setLinkedInSuggestions((prev) => prev.filter((item) => item.id !== sugId));
  };

  // Auto-save whenever profile changes after initial load
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    if (!isLoaded) return;

    const timer = setTimeout(() => {
      saveProfile(profile)
        .then(() => {
          const now = new Date();
          setLastSaved(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        })
        .catch((err) => {
          console.warn('[Profile] Auto-save error:', err);
        });
    }, 400);

    return () => clearTimeout(timer);
  }, [profile, isLoaded]);

  // ==========================================================================
  // Link Validation Rules
  // ==========================================================================
  const validateLink = (field: 'github' | 'linkedin' | 'instagram' | 'portfolio', value: string): string => {
    const trimmed = value.trim();
    if (!trimmed) return '';

    if (field === 'github') {
      // Must match github.com/username
      const pattern = /^(https?:\/\/)?(www\.)?github\.com\/[a-zA-Z0-9_\-\.]+\/?$/i;
      if (!pattern.test(trimmed)) {
        return t('profile.githubError');
      }
    }

    if (field === 'linkedin') {
      // Must match linkedin.com/in/username
      const pattern = /^(https?:\/\/)?(www\.)?linkedin\.com\/in\/[a-zA-Z0-9_\-\.]+\/?$/i;
      if (!pattern.test(trimmed)) {
        return t('profile.linkedinError');
      }
    }

    if (field === 'instagram') {
      // Must match instagram.com/handle
      const pattern = /^(https?:\/\/)?(www\.)?instagram\.com\/[a-zA-Z0-9_\-\.]+\/?$/i;
      if (!pattern.test(trimmed)) {
        return t('profile.instagramError');
      }
    }

    if (field === 'portfolio') {
      // Must look like a valid URL or domain
      const pattern = /^(https?:\/\/)?([a-zA-Z0-9_\-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/i;
      if (!pattern.test(trimmed)) {
        return t('profile.portfolioError');
      }
    }

    return '';
  };

  const validateAllLinks = (links: typeof profile.links) => {
    if (!links) return;
    const errors: { [key: string]: string } = {};
    const ghErr = validateLink('github', links.github || '');
    if (ghErr) errors.github = ghErr;

    const inErr = validateLink('linkedin', links.linkedin || '');
    if (inErr) errors.linkedin = inErr;

    const igErr = validateLink('instagram', links.instagram || '');
    if (igErr) errors.instagram = igErr;

    const pfErr = validateLink('portfolio', links.portfolio || '');
    if (pfErr) errors.portfolio = pfErr;

    setLinkErrors(errors);
  };

  const handleLinkChange = (field: 'github' | 'linkedin' | 'instagram' | 'portfolio', value: string) => {
    const err = validateLink(field, value);
    setLinkErrors((prev) => ({ ...prev, [field]: err }));

    const updatedLinks = {
      ...profile.links,
      [field]: value
    };

    setProfile({
      ...profile,
      links: updatedLinks,
      githubUrl: updatedLinks.github,
      portfolioUrl: updatedLinks.portfolio
    });
  };

  // ==========================================================================
  // Skills Tag Input & Suggestions
  // ==========================================================================
  const handleAddSkill = (skill: string) => {
    const trimmed = skill.trim();
    if (!trimmed) return;
    const currentSkills = profile.skills || [];
    if (currentSkills.some((s) => s.toLowerCase() === trimmed.toLowerCase())) {
      setSkillInputText('');
      return;
    }

    const updatedSkills = [...currentSkills, trimmed];
    setProfile({ ...profile, skills: updatedSkills });
    setSkillInputText('');
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    const currentSkills = profile.skills || [];
    const updatedSkills = currentSkills.filter((s) => s !== skillToRemove);
    setProfile({ ...profile, skills: updatedSkills });
  };

  const handleSkillKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      handleAddSkill(skillInputText);
    }
  };

  // ==========================================================================
  // Documents Ready Checkboxes
  // ==========================================================================
  const isDocChecked = (docType: string): boolean => {
    const docs = profile.documents || [];
    if (docType === 'resume') {
      return (
        profile.hasResume === true ||
        docs.some((d) => d?.type === 'resume') ||
        Boolean(profile.resumeUrl)
      );
    }
    return docs.some((d) => d?.type?.toLowerCase() === docType.toLowerCase());
  };

  const handleToggleDocument = (docType: string, checked: boolean) => {
    let updatedDocs = [...(profile.documents || [])];

    if (checked) {
      if (!updatedDocs.some((d) => d?.type?.toLowerCase() === docType.toLowerCase())) {
        const docName =
          docType === 'resume'
            ? 'Resume.pdf'
            : docType === 'marksheet'
            ? 'Semester_Marksheet.pdf'
            : docType === 'incomeCertificate'
            ? 'Income_Certificate.pdf'
            : 'Student_ID.pdf';

        const newDoc: DocumentItem = {
          id: `doc-${docType}-${Date.now()}`,
          name: docName,
          type: docType,
          verified: true
        };
        updatedDocs.push(newDoc);
      }
    } else {
      updatedDocs = updatedDocs.filter((d) => d?.type?.toLowerCase() !== docType.toLowerCase());
    }

    setProfile({
      ...profile,
      documents: updatedDocs,
      hasResume: docType === 'resume' ? checked : profile.hasResume
    });
  };

  // ==========================================================================
  // Projects Add / Edit / Delete
  // ==========================================================================
  const handleOpenAddProject = () => {
    setProjectForm({
      title: '',
      role: 'Contributor',
      status: 'completed',
      domains: [],
      tech: [],
      proofLink: ''
    });
    setDomainsInput('');
    setTechInput('');
    setProjectProofError('');
    setEditingProjectId(null);
    setIsEditingProject(true);
  };

  const handleOpenEditProject = (proj: Project) => {
    setProjectForm({ ...proj });
    setDomainsInput(proj.domains ? proj.domains.join(', ') : '');
    setTechInput(proj.tech ? proj.tech.join(', ') : '');
    setProjectProofError('');
    setEditingProjectId(proj.id);
    setIsEditingProject(true);
  };

  const handleDeleteProject = (projId: string) => {
    const current = profile.projects || [];
    const updated = current.filter((p) => p.id !== projId);
    setProfile({ ...profile, projects: updated });
  };

  const handleSaveProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectForm.title?.trim()) return;

    if (projectForm.proofLink?.trim()) {
      const urlPattern = /^(https?:\/\/)?([a-zA-Z0-9_\-]+\.)+[a-zA-Z]{2,}(\/[^\s]*)?$/i;
      if (!urlPattern.test(projectForm.proofLink.trim())) {
        setProjectProofError(t('profile.proofLinkError'));
        return;
      }
    }

    const domains = domainsInput
      .split(',')
      .map((d) => d.trim())
      .filter((d) => d.length > 0);

    const tech = techInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const completeProject: Project = {
      id: editingProjectId || `proj-${Date.now()}`,
      title: projectForm.title.trim(),
      role: projectForm.role || 'Contributor',
      status: projectForm.status || 'completed',
      domains,
      tech,
      proofLink: projectForm.proofLink?.trim() || ''
    };

    let updatedProjects: Project[];
    const current = profile.projects || [];
    if (editingProjectId) {
      updatedProjects = current.map((p) => (p.id === editingProjectId ? completeProject : p));
    } else {
      updatedProjects = [...current, completeProject];
    }

    setProfile({ ...profile, projects: updatedProjects });
    setIsEditingProject(false);
  };

  // ==========================================================================
  // Profile Completeness Meter
  // Calculates score and dynamically names the next field to add
  // ==========================================================================
  const calculateCompleteness = (): { percentage: number; nextFieldMsg: string } => {
    const items = [
      {
        field: 'Year of study',
        completed: profile.year !== undefined && profile.year !== null && profile.year > 0,
        tip: t('profile.tipYear')
      },
      {
        field: 'Branch / Degree',
        completed: Boolean(profile.branch && profile.branch.trim().length > 0),
        tip: t('profile.tipBranch')
      },
      {
        field: 'CGPA',
        completed: profile.cgpa !== undefined && profile.cgpa !== null && profile.cgpa > 0,
        tip: t('profile.tipCgpa')
      },
      {
        field: 'Availability',
        completed: profile.availabilityWeeks !== undefined && profile.availabilityWeeks !== null && profile.availabilityWeeks > 0,
        tip: t('profile.tipAvailability')
      },
      {
        field: 'Skills',
        completed: (profile.skills || []).length >= 3,
        tip: t('profile.tipSkills')
      },
      {
        field: 'Resume',
        completed: isDocChecked('resume'),
        tip: t('profile.tipResume')
      },
      {
        field: 'Certificates',
        completed: (profile.documents || []).some((d) => d?.type !== 'resume'),
        tip: t('profile.tipCertificates')
      },
      {
        field: 'GitHub Link',
        completed: Boolean(profile.links?.github && !linkErrors.github),
        tip: t('profile.tipGithub')
      },
      {
        field: 'LinkedIn Link',
        completed: Boolean(profile.links?.linkedin && !linkErrors.linkedin),
        tip: t('profile.tipLinkedin')
      },
      {
        field: 'Projects',
        completed: (profile.projects || []).length >= 1,
        tip: t('profile.tipProjects')
      }
    ];

    const completedCount = items.filter((i) => i.completed).length;
    const percentage = Math.round((completedCount / items.length) * 100);

    const firstMissing = items.find((i) => !i.completed);
    let nextFieldMsg = t('profile.profileComplete');

    if (firstMissing) {
      nextFieldMsg = t('profile.profilePartial', { percentage, tip: firstMissing.tip });
    }

    return { percentage, nextFieldMsg };
  };

  const { percentage: completenessPct, nextFieldMsg } = calculateCompleteness();

  // Load Benchmark Profile
  const handleLoadSample = () => {
    setProfile(SAMPLE_STUDENT_PROFILE);
    validateAllLinks(SAMPLE_STUDENT_PROFILE.links);
  };

  // Clear Profile
  const handleClearProfile = () => {
    const empty: StudentProfile = {
      name: '',
      year: undefined,
      yearOfStudy: undefined,
      branch: '',
      degree: '',
      cgpa: undefined,
      skills: [],
      documents: [],
      availabilityWeeks: undefined,
      links: {
        github: '',
        linkedin: '',
        instagram: '',
        portfolio: ''
      },
      projects: [],
      hasResume: null,
      resumeUrl: '',
      githubUrl: '',
      portfolioUrl: ''
    };
    setProfile(empty);
    setLinkErrors({});
  };

  return (
    <div className="space-y-8 pb-12">
      {/* Page Header */}
      <div className="border-b border-[#111111] pb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <SectionTitle
            tag={t('profile.headerTag')}
            title={t('profile.headerTitle')}
          />
          <p className="text-sm font-body text-[#111111]/80 mt-2 max-w-2xl">
            {t('profile.headerLede')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="solid"
            size="sm"
            onClick={handleLoadSample}
            id="load-sample-profile-btn"
          >
            {t('profile.loadSample')}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearProfile}
            id="clear-profile-btn"
          >
            {t('profile.clearProfile')}
          </Button>
        </div>
      </div>

      {/* Profile Completeness Meter */}
      <Card variant="white" className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-headline text-lg uppercase tracking-tight">
                {t('profile.completenessTitle')}
              </span>
              <span className="font-mono text-sm font-bold bg-[#111111] text-[#F1EEE6] px-2 py-0.5">
                {completenessPct}%
              </span>
            </div>
            <p className="text-sm font-mono text-[#111111]/80 mt-1">
              {nextFieldMsg}
            </p>
          </div>
          {lastSaved && (
            <div className="text-xs font-mono text-[#2F7D5B] font-bold flex items-center gap-1.5 self-start sm:self-auto bg-[#2F7D5B]/10 px-3 py-1 border border-[#2F7D5B]">
              <span className="w-2 h-2 rounded-full bg-[#2F7D5B] animate-pulse" />
              <span>{t('profile.autoSavedAt', { time: lastSaved })}</span>
            </div>
          )}
        </div>

        {/* Progress Bar with Thin Black Border */}
        <div className="w-full h-3 border border-[#111111] bg-[#F1EEE6] p-0.5">
          <div
            className="h-full bg-[#111111] transition-all duration-300"
            style={{ width: `${completenessPct}%` }}
            role="progressbar"
            aria-label={t('profile.progressLabel', { percent: completenessPct })}
            aria-valuenow={completenessPct}
            aria-valuemin={0}
            aria-valuemax={100}
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* ================================================================== */}
        {/* SECTION 1: BASICS */}
        {/* ================================================================== */}
        <Card variant="cream">
          <CardHeader>
            <CardTitle>{t('profile.basicsTitle')}</CardTitle>
            <CardDescription>
              {t('profile.basicsDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <Input
              label={t('profile.fullName')}
              id="student-name-input"
              value={profile.name || ''}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              placeholder={t('profile.fullNamePlaceholder')}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  htmlFor="year-select"
                  className="block text-xs font-mono font-bold uppercase tracking-wider text-[#111111] mb-1.5"
                >
                  {t('profile.yearOfStudy')}
                </label>
                <select
                  id="year-select"
                  value={profile.year ?? ''}
                  onChange={(e) => {
                    const val = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                    setProfile({ ...profile, year: val, yearOfStudy: val });
                  }}
                  className="w-full px-3.5 py-2.5 text-base bg-white text-[#111111] border border-[#111111] font-body focus:outline-none focus:ring-2 focus:ring-[#111111]"
                >
                  <option value="">{t('profile.selectYear')}</option>
                  <option value="1">{t('profile.year1')}</option>
                  <option value="2">{t('profile.year2')}</option>
                  <option value="3">{t('profile.year3')}</option>
                  <option value="4">{t('profile.year4')}</option>
                  <option value="5">{t('profile.year5')}</option>
                </select>
              </div>

              <Input
                label={t('profile.branchDegree')}
                id="branch-input"
                value={profile.branch || ''}
                onChange={(e) => setProfile({ ...profile, branch: e.target.value, degree: e.target.value })}
                placeholder={t('profile.branchPlaceholder')}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label={t('profile.cgpaLabel')}
                id="cgpa-input"
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={profile.cgpa ?? ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? undefined : parseFloat(e.target.value);
                  setProfile({ ...profile, cgpa: val });
                }}
                placeholder={t('profile.cgpaPlaceholder')}
                helperText={t('profile.cgpaHelper')}
              />

              <Input
                label={t('profile.availabilityLabel')}
                id="availability-input"
                type="number"
                min="1"
                max="52"
                value={profile.availabilityWeeks ?? ''}
                onChange={(e) => {
                  const val = e.target.value === '' ? undefined : parseInt(e.target.value, 10);
                  setProfile({ ...profile, availabilityWeeks: val });
                }}
                placeholder={t('profile.availabilityPlaceholder')}
                helperText={t('profile.availabilityHelper')}
              />
            </div>
          </CardContent>
        </Card>

        {/* ================================================================== */}
        {/* SECTION 2: SKILLS */}
        {/* ================================================================== */}
        <Card variant="cream">
          <CardHeader>
            <CardTitle>{t('profile.skillsTitle')}</CardTitle>
            <CardDescription>
              {t('profile.skillsDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Input
                label={t('profile.addSkillsLabel')}
                id="skills-tag-input"
                value={skillInputText}
                onChange={(e) => setSkillInputText(e.target.value)}
                onKeyDown={handleSkillKeyDown}
                placeholder={t('profile.addSkillsPlaceholder')}
              />
            </div>

            {/* Active Skills Tag Cloud */}
            <div>
              <span className="block text-xs font-mono font-bold uppercase tracking-wider text-[#111111]/70 mb-2">
                {t('profile.activeSkills', { count: (profile.skills || []).length })}
              </span>
              {(profile.skills || []).length === 0 ? (
                <p className="text-sm font-mono text-[#111111]/60 italic p-3 border border-dashed border-[#111111]/30 bg-white/40">
                  {t('profile.noSkills')}
                </p>
              ) : (
                <div className="flex flex-wrap gap-2 p-3 bg-white border border-[#111111] min-h-[56px] items-center">
                  {(profile.skills || []).map((skill) => (
                    <Tag
                      key={skill}
                      variant="solid"
                      size="md"
                      onRemove={() => handleRemoveSkill(skill)}
                      removeAriaLabel={t('profile.removeSkill', { skill })}
                    >
                      {skill}
                    </Tag>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Suggestions */}
            <div>
              <span className="block text-xs font-mono font-bold uppercase tracking-wider text-[#111111]/70 mb-2">
                {t('profile.quickAddSuggestions')}
              </span>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_SKILL_SUGGESTIONS.map((suggestion) => {
                  const isAdded = (profile.skills || []).some(
                    (s) => s.toLowerCase() === suggestion.toLowerCase()
                  );
                  return (
                    <button
                      key={suggestion}
                      type="button"
                      onClick={() => handleAddSkill(suggestion)}
                      disabled={isAdded}
                      className={`text-xs font-mono px-2.5 py-1 border transition-colors ${
                        isAdded
                          ? 'border-[#2F7D5B] bg-[#2F7D5B]/15 text-[#2F7D5B] opacity-60 cursor-default'
                          : 'border-[#111111] bg-white text-[#111111] hover:bg-[#111111] hover:text-[#F1EEE6]'
                      }`}
                    >
                      {isAdded ? `✓ ${suggestion}` : `+ ${suggestion}`}
                    </button>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ==================================================================== */}
      {/* SECTION 3: DOCUMENTS READY */}
      {/* ==================================================================== */}
      <Card variant="cream">
        <CardHeader>
          <CardTitle>{t('profile.documentsTitle')}</CardTitle>
          <CardDescription>
            {t('profile.documentsDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {DOCUMENT_OPTIONS.map((doc) => {
              const checked = isDocChecked(doc.type);
              return (
                <label
                  key={doc.type}
                  className={`p-4 border transition-colors cursor-pointer flex items-start gap-3 select-none ${
                    checked
                      ? 'border-[#111111] bg-white'
                      : 'border-[#111111]/40 bg-white/40 hover:border-[#111111]'
                  }`}
                >
                  <input
                    type="checkbox"
                    id={`doc-checkbox-${doc.type}`}
                    checked={checked}
                    onChange={(e) => handleToggleDocument(doc.type, e.target.checked)}
                    className="mt-1 w-4 h-4 text-[#111111] border-2 border-[#111111] rounded-none focus:ring-0 focus:ring-offset-0 cursor-pointer accent-[#111111]"
                  />
                  <div>
                    <span className="font-headline text-sm uppercase tracking-wider block text-[#111111]">
                      {t(doc.labelKey)}
                    </span>
                    <span className="text-xs font-body text-[#111111]/70 block mt-0.5">
                      {t(doc.hintKey)}
                    </span>
                  </div>
                </label>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* ==================================================================== */}
      {/* SECTION 4: LINKS & PRIVACY NOTE */}
      {/* ==================================================================== */}
      <Card variant="cream">
        <CardHeader>
          <CardTitle>{t('profile.linksTitle')}</CardTitle>
          <CardDescription>
            {t('profile.linksDescription')}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Exact Required Privacy Note */}
          <div className="p-3.5 border border-[#111111] bg-white flex items-center gap-3">
            <span className="w-5 h-5 flex items-center justify-center font-mono font-bold border border-[#111111] text-xs">
              i
            </span>
            <p className="text-xs sm:text-sm font-mono font-bold text-[#111111]">
              {t('profile.privacyNote')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <Input
              label={t('profile.githubLabel')}
              id="github-link-input"
              value={profile.links?.github || ''}
              onChange={(e) => handleLinkChange('github', e.target.value)}
              placeholder="https://github.com/username"
              error={linkErrors.github}
              helperText={t('profile.githubHelper')}
            />

            <Input
              label={t('profile.linkedinLabel')}
              id="linkedin-link-input"
              value={profile.links?.linkedin || ''}
              onChange={(e) => handleLinkChange('linkedin', e.target.value)}
              placeholder="https://linkedin.com/in/username"
              error={linkErrors.linkedin}
              helperText={t('profile.linkedinHelper')}
            />

            <Input
              label={t('profile.portfolioLabel')}
              id="portfolio-link-input"
              value={profile.links?.portfolio || ''}
              onChange={(e) => handleLinkChange('portfolio', e.target.value)}
              placeholder="https://myportfolio.com"
              error={linkErrors.portfolio}
              helperText={t('profile.portfolioHelper')}
            />

            <Input
              label={t('profile.instagramLabel')}
              id="instagram-link-input"
              value={profile.links?.instagram || ''}
              onChange={(e) => handleLinkChange('instagram', e.target.value)}
              placeholder="https://instagram.com/handle"
              error={linkErrors.instagram}
              helperText={t('profile.instagramHelper')}
            />
          </div>

          {/* LinkedIn Text Import (Anti-Scraping Safe & Compliant) */}
          <div className="p-5 border-2 border-[#111111] bg-white space-y-4 mt-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#111111] pb-3">
              <div>
                <h4 className="font-headline text-base uppercase tracking-wider text-[#111111]">
                  {t('profile.linkedinImportTitle')}
                </h4>
                <p className="text-xs font-sans text-[#555555]">
                  {t('profile.linkedinImportBody')}
                </p>
              </div>
              <span className="text-xs font-mono font-bold px-2 py-0.5 border border-[#111111] bg-[#F1EEE6] text-[#111111]">
                {t('profile.zeroScrapingSafe')}
              </span>
            </div>

            {/* Note required by specification */}
            <div className="p-3 border border-[#2F7D5B] bg-[#2F7D5B]/10 flex items-center gap-2 text-xs font-mono font-bold text-[#2F7D5B]">
              <span>✓</span>
              <span>{t('profile.linkedinNoAccess')}</span>
            </div>

            <Textarea
              label={t('profile.linkedinPasteLabel')}
              id="linkedin-pasted-text"
              rows={4}
              value={linkedInText}
              onChange={(e) => {
                setLinkedInText(e.target.value);
                setProfile((prev) => ({ ...prev, linkedInText: e.target.value }));
              }}
              placeholder={t('profile.linkedinPastePlaceholder')}
              className="text-xs font-mono"
            />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
              <label className="text-xs font-mono text-[#111111] cursor-pointer flex items-center gap-2">
                <span className="px-3 py-1.5 border border-[#111111] bg-[#F1EEE6] hover:bg-[#111111] hover:text-[#F1EEE6] transition-colors">
                  📄 {t('profile.uploadLinkedInExport')}
                </span>
                <input
                  type="file"
                  accept=".pdf,.txt"
                  onChange={handleLinkedInFileUpload}
                  className="hidden"
                />
              </label>

              <Button
                variant="solid"
                size="sm"
                onClick={handleAnalyzeLinkedIn}
                disabled={isAnalyzingLinkedIn || !linkedInText.trim()}
                id="extract-linkedin-btn"
              >
                {isAnalyzingLinkedIn ? t('profile.extractingCredentials') : t('profile.extractWithAgent')}
              </Button>
            </div>

            {/* In-place Discovered Credentials Review */}
            {linkedInSuggestions.length > 0 && (
              <div className="space-y-3 pt-4 border-t border-[#111111]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold uppercase tracking-wider text-[#111111]">
                    {t('profile.discoveredCredentials', { count: linkedInSuggestions.length })}
                  </span>
                  <span className="text-[11px] font-mono text-[#555555]">
                    {t('profile.discoveredHint')}
                  </span>
                </div>

                <div className="space-y-2">
                  {linkedInSuggestions.map((sug) => (
                    <div
                      key={sug.id}
                      className="p-3 bg-[#F1EEE6] border border-[#111111] flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                    >
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 bg-[#D98A1F] text-[#111111] border border-[#111111]">
                            {t('profile.suggestedConfirm')}
                          </span>
                          <span className="font-headline font-bold text-xs uppercase text-[#111111]">
                            {sug.title}
                          </span>
                        </div>
                        <p className="text-[11px] font-mono text-[#555555] italic mt-1">
                          {t('profile.evidence', { evidence: sug.description })}
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleAcceptLinkedInSuggestion(sug)}
                          className="px-3 py-1 text-xs font-mono font-bold border border-[#2F7D5B] bg-[#2F7D5B] text-white hover:bg-[#256348] transition-colors"
                        >
                          {t('profile.accept')}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectLinkedInSuggestion(sug.id)}
                          className="px-2.5 py-1 text-xs font-mono border border-[#C0453A] text-[#C0453A] hover:bg-[#C0453A] hover:text-white transition-colors"
                        >
                          {t('profile.reject')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ==================================================================== */}
      {/* SECTION 5: PROJECTS */}
      {/* ==================================================================== */}
      <Card variant="cream">
        <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>{t('profile.projectsTitle')}</CardTitle>
            <CardDescription>
              {t('profile.projectsDescription')}
            </CardDescription>
          </div>
          <Button
            variant="solid"
            size="sm"
            onClick={handleOpenAddProject}
            id="add-project-btn"
          >
            + {t('profile.addProject')}
          </Button>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Add / Edit Project Form */}
          {isEditingProject && (
            <form
              onSubmit={handleSaveProject}
              className="p-5 border-2 border-[#111111] bg-white space-y-4"
            >
              <div className="flex items-center justify-between border-b border-[#111111] pb-2">
                <h4 className="font-headline text-base uppercase tracking-wider">
                  {editingProjectId ? t('profile.editProject') : t('profile.addNewProject')}
                </h4>
                <button
                  type="button"
                  onClick={() => setIsEditingProject(false)}
                  className="text-xs font-mono font-bold uppercase underline"
                >
                  {t('common.cancel')}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={t('profile.projectTitle')}
                  required
                  value={projectForm.title || ''}
                  onChange={(e) => setProjectForm({ ...projectForm, title: e.target.value })}
                  placeholder={t('profile.projectTitlePlaceholder')}
                />

                <Input
                  label={t('profile.role')}
                  value={projectForm.role || ''}
                  onChange={(e) => setProjectForm({ ...projectForm, role: e.target.value })}
                  placeholder={t('profile.rolePlaceholder')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono font-bold uppercase tracking-wider text-[#111111] mb-1.5">
                    {t('profile.statusLabel')}
                  </label>
                  <select
                    value={projectForm.status || 'completed'}
                    onChange={(e) => setProjectForm({ ...projectForm, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-base bg-white text-[#111111] border border-[#111111] font-body focus:outline-none focus:ring-2 focus:ring-[#111111]"
                  >
                    <option value="completed">{t('profile.statusCompleted')}</option>
                    <option value="in-progress">{t('profile.statusInProgress')}</option>
                    <option value="planned">{t('profile.statusPlanned')}</option>
                  </select>
                </div>

                <Input
                  label={t('profile.proofLink')}
                  value={projectForm.proofLink || ''}
                  onChange={(e) => {
                    setProjectForm({ ...projectForm, proofLink: e.target.value });
                    setProjectProofError('');
                  }}
                  placeholder="https://github.com/username/project"
                  error={projectProofError}
                  helperText={t('profile.proofLinkHelper')}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label={t('profile.domainsLabel')}
                  value={domainsInput}
                  onChange={(e) => setDomainsInput(e.target.value)}
                  placeholder={t('profile.domainsPlaceholder')}
                />

                <Input
                  label={t('profile.techLabel')}
                  value={techInput}
                  onChange={(e) => setTechInput(e.target.value)}
                  placeholder={t('profile.techPlaceholder')}
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditingProject(false)}
                >
                  {t('common.cancel')}
                </Button>
                <Button variant="solid" size="sm" type="submit">
                  {editingProjectId ? t('profile.saveChanges') : t('profile.addProject')}
                </Button>
              </div>
            </form>
          )}

          {/* Project Cards List */}
          {(profile.projects || []).length === 0 ? (
            <div className="p-8 border border-dashed border-[#111111]/40 text-center bg-white/40">
              <p className="font-headline text-lg uppercase text-[#111111]/60">
                {t('profile.noProjectsTitle')}
              </p>
              <p className="text-sm font-body text-[#111111]/70 mt-1 max-w-md mx-auto">
                {t('profile.noProjectsBody')}
              </p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleOpenAddProject}
                className="mt-4"
              >
                + {t('profile.addFirstProject')}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(profile.projects || []).map((project) => (
                <div
                  key={project.id}
                  className="border border-[#111111] bg-white p-5 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-headline text-base uppercase tracking-tight text-[#111111]">
                        {project.title}
                      </h4>
                      <Badge
                        status={
                          project.status === 'completed'
                            ? 'Match'
                            : project.status === 'in-progress'
                            ? 'Missing info'
                            : 'Mismatch'
                        }
                        size="sm"
                      />
                    </div>

                    <p className="text-xs font-mono uppercase tracking-wider text-[#111111]/70">
                      {t('profile.rolePrefix', { role: project.role || 'Contributor' })}
                    </p>

                    {/* Domains & Tech Chips */}
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {project.domains?.map((d) => (
                        <span
                          key={d}
                          className="text-[11px] font-mono px-2 py-0.5 border border-[#111111] bg-[#F1EEE6] font-bold"
                        >
                          {d}
                        </span>
                      ))}
                      {project.tech?.map((t) => (
                        <span
                          key={t}
                          className="text-[11px] font-mono px-2 py-0.5 border border-[#111111]/40 bg-white"
                        >
                          {t}
                        </span>
                      ))}
                    </div>

                    {/* Proof Link */}
                    {project.proofLink ? (
                      <p className="text-xs font-mono pt-1 text-[#111111] truncate">
                        {t('profile.proofPrefix')}{' '}
                        <a
                          href={project.proofLink}
                          target="_blank"
                          rel="noreferrer"
                          className="underline font-bold hover:text-[#2F7D5B]"
                        >
                          {project.proofLink}
                        </a>
                      </p>
                    ) : (
                      <p className="text-xs font-mono pt-1 text-[#C0453A] italic">
                        {t('profile.noProofLink')}
                      </p>
                    )}
                    {/* Generated Resume Bullet & SOP Box */}
                    {resumeSnippets[project.id]?.bullet && (
                      <div className="p-3 border border-[#111111] bg-[#F1EEE6] space-y-2 mt-2">
                        <div className="flex items-center justify-between gap-2 border-b border-[#111111]/15 pb-1.5 flex-wrap">
                          <div className="flex items-center gap-1.5">
                            <Badge status="AI-suggested" size="sm" />
                            <span className="text-[10px] font-mono uppercase text-[#111111]/70">
                              AI-suggested, edit before using
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleCopyResumeSnippet(project.id)}
                            className="px-2 py-0.5 text-xs font-mono font-bold border border-[#111111] bg-white hover:bg-[#111111] hover:text-[#F1EEE6] transition-colors"
                          >
                            {copiedResumeId === project.id ? 'Copied!' : 'Copy'}
                          </button>
                        </div>

                        <div className="space-y-0.5">
                          <span className="text-[10px] font-mono font-bold uppercase text-[#111111]/70 block">
                            Resume Bullet:
                          </span>
                          <p className="text-xs font-mono text-[#111111] leading-relaxed select-all">
                            • {resumeSnippets[project.id].bullet}
                          </p>
                        </div>

                        <div className="space-y-0.5 pt-1 border-t border-[#111111]/10">
                          <span className="text-[10px] font-mono font-bold uppercase text-[#111111]/70 block">
                            2-Sentence SOP Paragraph:
                          </span>
                          <p className="text-xs font-body text-[#111111] leading-relaxed select-all">
                            {resumeSnippets[project.id].sop}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-3 border-t border-[#111111]/15 flex-wrap">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleGenerateResumeLine(project)}
                      disabled={resumeSnippets[project.id]?.loading}
                    >
                      {resumeSnippets[project.id]?.loading ? 'Generating...' : 'Generate resume line'}
                    </Button>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleOpenEditProject(project)}
                      >
                        {t('common.edit')}
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteProject(project.id)}
                      >
                        {t('common.delete')}
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
