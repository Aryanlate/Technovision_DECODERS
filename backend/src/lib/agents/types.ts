import {
  AgentResult,
  AgentSource,
  SourceTrust,
  AgentStatus,
  AgentProgressEvent,
  AgentSuggestion,
  StudentProfile,
  Checklist
} from '@opportunity-kit/shared';

export * from '@opportunity-kit/shared';
export * from './specs.js';

/**
 * Universal interface for all OpportunityKit agents.
 * Defines Agent.run(input) returning AgentResult.
 */
export interface Agent<TInput = any, TOutput = any> {
  readonly name: string;
  run(input: TInput): Promise<AgentResult<TOutput>>;
}

export interface ProgressCallback {
  (event: AgentProgressEvent): void;
}
