import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import {
  parseOpportunity,
  evaluateProfileAgainstOpportunity,
  getFeatureFlags,
  SAMPLE_OPPORTUNITY_TEXT,
  SAMPLE_STUDENT_PROFILE,
  SAMPLE_OPPORTUNITY_TITLE,
  EXPECTED_SAMPLE_RESULTS,
  StudentProfile,
  Requirement
} from '@opportunity-kit/shared';
import { z } from 'zod';
import {
  runOpportunityEvidenceAgent,
  runProfileEvidenceAgent,
  orchestrator,
  agentRegistry
} from './lib/agents/index.js';
import { checkOpportunityScam } from './lib/agents/scamChecker.js';
import { gatewayRegistry, askAgentLLM, getAgentMetrics } from './lib/llm/index.js';
import { createServerEvidenceStore } from './store/index.js';
import { createSyncRouter } from './sync/routes.js';
import { verifySupabaseToken } from './sync/auth.js';

dotenv.config();

const app = express();
const port = Number(process.env.PORT) || 5000;
const host = '0.0.0.0';

// Configurable CORS handling with ALLOWED_ORIGINS support
const rawAllowedOrigins = process.env.ALLOWED_ORIGINS?.trim();
const allowedOriginsList = rawAllowedOrigins && rawAllowedOrigins !== '*'
  ? rawAllowedOrigins.split(',').map((o) => o.trim()).filter(Boolean)
  : ['*'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. server-to-server, curl, Render /health check)
      if (!origin) return callback(null, true);
      // Wildcard allows any origin
      if (allowedOriginsList.includes('*')) {
        return callback(null, true);
      }
      // Check if origin matches allowed origin list (supports wildcard subdomains like https://*-org.vercel.app)
      const isAllowed = allowedOriginsList.some((allowed) => {
        if (allowed === origin) return true;
        if (allowed.includes('*')) {
          const pattern = new RegExp('^' + allowed.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
          return pattern.test(origin);
        }
        return false;
      });

      if (isAllowed) {
        return callback(null, true);
      }

      console.warn(`[CORS] Blocked request from origin: ${origin}`);
      return callback(null, false);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
  })
);
app.use(express.json());

// In-memory sliding-window per-IP rate limiter
const ipRateLimits = new Map<string, { count: number; resetTime: number }>();
function checkIpRateLimit(ip: string, limit: number = 30, windowMs: number = 60000): boolean {
  const now = Date.now();
  const record = ipRateLimits.get(ip);
  if (!record || now > record.resetTime) {
    ipRateLimits.set(ip, { count: 1, resetTime: now + windowMs });
    return true;
  }
  if (record.count >= limit) {
    return false;
  }
  record.count++;
  return true;
}

const evidenceStore = createServerEvidenceStore();

app.use(
  '/api/sync',
  createSyncRouter({
    store: evidenceStore,
    verifyToken: verifySupabaseToken,
    rateLimit: (ip) => checkIpRateLimit(ip, 60)
  })
);

// 1. Health & Status endpoints (both /health and /api/health for Render and keep-alive compatibility)
const healthHandler = (_req: express.Request, res: express.Response) => {
  const flags = getFeatureFlags();
  res.json({
    status: 'ok',
    service: 'OpportunityKit Backend',
    timestamp: new Date().toISOString(),
    demoMode: process.env.DEMO_MODE === 'true',
    flags
  });
};

app.get('/health', healthHandler);
app.get('/api/health', healthHandler);

// 2. LLM Gateway Health & Provider Configuration Status Endpoint
// Returns which providers are configured, their models, capabilities, and rate limits without exposing secrets.
app.get('/api/llm/health', (_req, res) => {
  const providers = gatewayRegistry.getHealth();
  res.json({
    status: 'ok',
    service: 'OpportunityKit LLM Gateway',
    timestamp: new Date().toISOString(),
    demoMode: process.env.DEMO_MODE === 'true',
    fallbackOrder: process.env.LLM_FALLBACK_ORDER || 'gemini,groq,openrouter,openai,xai',
    providers
  });
});

// System Status endpoint: returns AI providers configured & recently working, average response time per agent, and demo mode
app.get('/api/status', (_req, res) => {
  const providers = gatewayRegistry.getHealth().map((p) => ({
    name: p.name,
    configured: p.configured,
    recentlyWorking: p.recentlyWorking,
    model: p.model,
    capabilities: p.capabilities,
    rateLimits: p.rateLimits,
    stats: p.stats
  }));

  const agentMetrics = getAgentMetrics();

  res.json({
    status: 'ok',
    service: 'OpportunityKit System Status',
    timestamp: new Date().toISOString(),
    demoMode: process.env.DEMO_MODE === 'true',
    providers,
    agentMetrics
  });
});

// 3. Flags endpoint
app.get('/api/flags', (req, res) => {
  res.json(getFeatureFlags());
});

// 4. Demo Benchmark Data endpoint
app.get('/api/demo/sample', (req, res) => {
  res.json({
    opportunityTitle: SAMPLE_OPPORTUNITY_TITLE,
    opportunityText: SAMPLE_OPPORTUNITY_TEXT,
    profile: SAMPLE_STUDENT_PROFILE,
    expectedResults: EXPECTED_SAMPLE_RESULTS
  });
});

// 5. Parse Opportunity Endpoint
app.post('/api/parse-opportunity', async (req, res) => {
  try {
    const { opportunityText, opportunityTitle } = req.body;
    if (!opportunityText || typeof opportunityText !== 'string') {
      return res.status(400).json({ error: 'Opportunity text is required.' });
    }

    const title = opportunityTitle || 'Opportunity Listing';
    // Deterministic Rule Parser (plain TypeScript, no AI)
    const baselineRequirements = parseOpportunity(opportunityText);

    // Multi-Agent Evidence Gathering (suggests citations, student confirms)
    const flags = getFeatureFlags();
    let evidence: any[] = [];

    if (flags.ENABLE_AGENT_EVIDENCE) {
      const agentResult = await runOpportunityEvidenceAgent(opportunityText, baselineRequirements);
      evidence = agentResult.evidence;
    }

    res.json({
      title,
      rawText: opportunityText,
      requirements: baselineRequirements,
      evidence
    });
  } catch (error: any) {
    console.error('[API /api/parse-opportunity] Error:', error);
    res.status(500).json({ error: 'Failed to parse opportunity', details: error?.message });
  }
});

// 6. Evaluate Endpoint (Rule Engine Core Flow)
app.post('/api/evaluate', async (req, res) => {
  try {
    const {
      opportunityText,
      opportunityTitle,
      requirements: inputReqs,
      profile,
      agentEvidence = []
    } = req.body;

    if (!profile) {
      return res.status(400).json({ error: 'Student profile is required.' });
    }

    let requirements: Requirement[] = inputReqs;
    const title = opportunityTitle || 'Opportunity Evaluation';

    // If requirements not provided, parse from opportunity text
    if (!requirements || requirements.length === 0) {
      if (!opportunityText) {
        return res.status(400).json({ error: 'Either requirements array or opportunityText must be provided.' });
      }
      requirements = parseOpportunity(opportunityText);
    }

    // Execute Transparent Rule-based Engine (plain TypeScript, NO AI)
    const evaluationResult = evaluateProfileAgainstOpportunity(
      requirements,
      profile,
      title,
      opportunityText || '',
      agentEvidence
    );

    res.json(evaluationResult);
  } catch (error: any) {
    console.error('[API /api/evaluate] Error:', error);
    res.status(500).json({ error: 'Evaluation failed', details: error?.message });
  }
});

// 7. Scam and Legitimacy Checker Endpoint
app.post('/api/check-scam', (req, res) => {
  try {
    const { opportunityText } = req.body;
    if (!opportunityText || typeof opportunityText !== 'string') {
      return res.status(400).json({ error: 'Opportunity text is required.' });
    }

    const scamReport = checkOpportunityScam(opportunityText);
    res.json(scamReport);
  } catch (error: any) {
    console.error('[API /api/check-scam] Error:', error);
    res.status(500).json({ error: 'Scam check failed', details: error?.message });
  }
});

// 8. Registered Agents List Endpoint
app.get('/api/agents', (_req, res) => {
  res.json({
    status: 'ok',
    agents: agentRegistry.listNames(),
    count: agentRegistry.listNames().length
  });
});

// 9. Agent Framework Multi-Agent Execution Endpoint
const RunAgentsRequestSchema = z.object({
  opportunityText: z.string().optional().default('General opportunity criteria check'),
  profile: z.any().optional(),
  linkedInText: z.string().optional(),
  agentFilter: z.array(z.string()).optional(),
  stream: z.boolean().optional(),
  /** Interface language for AI-written prose ('en' | 'hi' | 'mr'). */
  language: z.string().optional(),
  existingEvidence: z.array(z.any()).optional()
});

app.post('/api/agents/run', async (req, res) => {
  // A. Per-IP Rate Limiting
  const clientIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
  const rpmLimit = parseInt(process.env.AGENT_RUN_RPM_LIMIT || '30', 10);
  if (!checkIpRateLimit(clientIp, rpmLimit)) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: `Rate limit exceeded (${rpmLimit} requests/min). Please try again shortly.`
    });
  }

  // B. CORS Verification against configured origins
  const origin = req.headers.origin;
  if (origin && !allowedOriginsList.includes('*')) {
    const isAllowed = allowedOriginsList.some((allowed) => {
      if (allowed === origin) return true;
      if (allowed.includes('*')) {
        const pattern = new RegExp('^' + allowed.replace(/\./g, '\\.').replace(/\*/g, '.*') + '$');
        return pattern.test(origin);
      }
      return false;
    });
    if (!isAllowed) {
      return res.status(403).json({ error: 'Forbidden', message: `Origin ${origin} is not allowed.` });
    }
  }

  // C. Supabase login-token verification when user is logged in
  let authUser: { id: string; email?: string } | null = null;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    if (token) {
      authUser = await verifySupabaseToken(token);
      if (!authUser) {
        return res.status(401).json({ error: 'Unauthorized', message: 'Invalid or expired Supabase authentication token.' });
      }
    }
  }

  // D. Request Validation with Zod
  const validation = RunAgentsRequestSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      error: 'Invalid request body',
      details: validation.error.flatten()
    });
  }

  const { opportunityText, profile, linkedInText, agentFilter, stream, language, existingEvidence } = validation.data;
  const effectiveProfile = {
    ...profile,
    linkedInText: linkedInText || profile?.linkedInText
  };
  const isSseRequested = stream || req.headers.accept?.includes('text/event-stream');

  // Server-Sent Events (SSE) live progress streaming mode
  if (isSseRequested) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const result = await orchestrator.run({ opportunityText, profile: effectiveProfile, agentFilter, language, existingEvidence }, (event) => {
      res.write(`data: ${JSON.stringify({ type: 'progress', event })}\n\n`);
    });

    res.write(`data: ${JSON.stringify({ type: 'complete', result })}\n\n`);
    res.end();
    return;
  }

  // Standard JSON response mode
  try {
    const result = await orchestrator.run({ opportunityText, profile: effectiveProfile, agentFilter, language, existingEvidence });
    res.json({
      success: true,
      user: authUser ? { id: authUser.id, email: authUser.email } : null,
      ...result
    });
  } catch (err: any) {
    console.error('[API /api/agents/run] Execution error:', err);
    res.status(500).json({ error: 'Orchestrator execution error', details: err?.message });
  }
});

// Dedicated GitHub Analyzer Endpoint
app.post('/api/agents/github', async (req, res) => {
  try {
    const { githubUrl, profileSkills, projects } = req.body;
    const agent = agentRegistry.get('github_analyzer') as any;
    if (!agent) return res.status(404).json({ error: 'GitHubAnalyzer not found' });
    const result = await agent.run({ githubUrl, profileSkills, projects });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'GitHub analysis error', details: err?.message });
  }
});

// Dedicated LinkedIn Analyzer Endpoint
app.post('/api/agents/linkedin', async (req, res) => {
  try {
    const { linkedinUrl, pastedText, profile } = req.body;
    const agent = agentRegistry.get('linkedin_analyzer') as any;
    if (!agent) return res.status(404).json({ error: 'LinkedInAnalyzer not found' });
    const result = await agent.run({ linkedinUrl, pastedText, profile });
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ error: 'LinkedIn analysis error', details: err?.message });
  }
});

// Dedicated Discovery Agent Endpoint (search-capable; curated fallback)
app.post('/api/agents/discover', async (req, res) => {
  try {
    const agent = agentRegistry.get('DiscoveryAgent') as any;
    if (!agent) return res.status(404).json({ error: 'DiscoveryAgent not found' });
    const profile = req.body?.profile || SAMPLE_STUDENT_PROFILE;
    const result = await agent.run({
      profile,
      opportunityTitle: req.body?.opportunityTitle,
      language: req.body?.language
    });
    res.json(result);
  } catch (err: any) {
    console.error('[API /api/agents/discover] Error:', err);
    res.status(500).json({ error: 'Discovery error', details: err?.message });
  }
});

// 10. Profile Evidence Gathering Endpoint (Backward-compatible adapter)
app.post('/api/agents/profile-evidence', async (req, res) => {
  try {
    const { profile } = req.body;
    if (!profile) {
      return res.status(400).json({ error: 'Profile is required.' });
    }

    const evidence = await runProfileEvidenceAgent(profile);
    res.json({ evidence });
  } catch (error: any) {
    console.error('[API /api/agents/profile-evidence] Error:', error);
    res.status(500).json({ error: 'Failed to extract profile evidence', details: error?.message });
  }
});

// 11. Resume Bullet & SOP Generator Endpoint
app.post('/api/generate-resume-line', async (req, res) => {
  try {
    const { title, tech, role, status } = req.body || {};
    if (!title || typeof title !== 'string') {
      return res.status(400).json({ error: 'Project title is required.' });
    }

    const techList = Array.isArray(tech) ? tech : [];
    const techStr = techList.length > 0 ? techList.join(', ') : 'modern engineering frameworks';
    const roleStr = typeof role === 'string' && role.trim() ? role.trim() : 'Project Contributor';
    const statusStr = status === 'completed' ? 'Completed' : 'Developed';

    const plainTemplateFallback = {
      bullet: `${statusStr} ${title} as ${roleStr}, leveraging ${techStr} to implement core functional specifications and deliver verified software components.`,
      sop: `As a ${roleStr} on ${title}, I utilized ${techStr} to architect practical solutions and advance key technical milestones. This hands-on project experience substantiated my engineering capabilities and prepared me to contribute effectively to demanding software initiatives.`,
      source: 'template'
    };

    // Check if any provider is configured
    const hasConfiguredProvider = Array.from(gatewayRegistry.getAll().values()).some((p) => p.isConfigured());

    if (!hasConfiguredProvider || process.env.DEMO_MODE === 'true') {
      return res.json(plainTemplateFallback);
    }

    const prompt = `Project Title: ${title}
Role: ${roleStr}
Technologies: ${techStr}
Status: ${status || 'completed'}

Task:
Write:
1. Exactly ONE concise, professional resume bullet point based ONLY on the facts above.
2. Exactly TWO sentences for a Statement of Purpose (SOP) paragraph explaining how this project demonstrates candidate abilities, based ONLY on the facts above.

Do NOT fabricate any metrics, dates, companies, or other skills not listed.
Output valid JSON strictly matching: { "bullet": string, "sop": string }`;

    const llmResult = await askAgentLLM('ResumeLineGenerator', {
      system: 'You write truthful, concise resume bullets and SOP paragraphs using only provided project facts. Output JSON.',
      prompt,
      schema: z.object({
        bullet: z.string(),
        sop: z.string()
      }),
      temperature: 0.2
    });

    if (llmResult?.data?.bullet && llmResult?.data?.sop) {
      return res.json({
        bullet: llmResult.data.bullet,
        sop: llmResult.data.sop,
        source: 'llm',
        provider: llmResult.provider
      });
    }

    return res.json(plainTemplateFallback);
  } catch (error: any) {
    console.warn('[API /api/generate-resume-line] Error, returning template fallback:', error?.message);
    const { title, tech, role, status } = req.body || {};
    const techStr = Array.isArray(tech) && tech.length > 0 ? tech.join(', ') : 'modern engineering frameworks';
    const roleStr = role || 'Project Contributor';
    const statusStr = status === 'completed' ? 'Completed' : 'Developed';

    return res.json({
      bullet: `${statusStr} ${title || 'Project'} as ${roleStr}, leveraging ${techStr} to implement core functional specifications.`,
      sop: `As a ${roleStr} on ${title || 'Project'}, I utilized ${techStr} to architect practical solutions and advance technical milestones. This experience reinforced my problem-solving ability and prepared me for advanced development work.`,
      source: 'template'
    });
  }
});

app.listen(port, host, () => {
  console.log(`[OpportunityKit Backend] Listening on http://${host}:${port}`);
});

