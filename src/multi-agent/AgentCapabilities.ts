// Core interfaces for multi-agent capabilities and task management

export interface AgentCapabilities {
  readonly id: string;
  readonly domains: string[];           // ['weather', 'travel', 'moldova_legal']
  readonly languages: string[];         // ['ro', 'ru', 'en']
  readonly tools: string[];            // Available tool names
  readonly specialization: SpecializationLevel;
  readonly localKnowledge?: MoldovaContext;
  readonly providerPreference: ProviderStrategy;
  readonly maxConcurrentTasks: number;
  readonly averageResponseTime: number; // milliseconds
}

export interface MoldovaContext {
  readonly cities: string[];           // ['Chișinău', 'Bălți', 'Cahul']
  readonly currencies: string[];       // ['MDL', 'EUR', 'USD']
  readonly legalFramework: string[];   // ['Moldova Civil Code', 'EU Regulations']
  readonly culturalNotes: Record<string, string>;
}

export enum SpecializationLevel {
  GENERAL = 'general',        // Can handle any task, lower quality
  SPECIALIZED = 'specialized', // Expert in specific domains
  EXPERT = 'expert'           // Deep domain knowledge + local context
}

export interface TaskMatch {
  readonly score: number;      // 0-1, how well agent matches task
  readonly confidence: number; // 0-1, agent's confidence in handling
  readonly estimatedTime: number; // milliseconds
  readonly reasoning: string;  // Why this agent should handle it
}

export interface TaskResult {
  readonly timestamp: Date;
  readonly success: boolean;
  readonly duration: number;
  readonly toolsUsed: number;
}

export interface AgentOptions {
  readonly maxSteps?: number;
  readonly maxHistoryLength?: number;
  readonly enableDebug?: boolean;
  readonly providerStrategy?: 'smart' | 'racing' | 'sequential';
  readonly enableRacing?: boolean;
  readonly timeoutMs?: number;
}

export interface ProviderStrategy {
  readonly type: 'free-first' | 'performance-first' | 'cost-balanced';
  readonly fallbackEnabled: boolean;
}

export enum TaskComplexity {
  SIMPLE = 'simple',     // Single domain, fast routing
  MEDIUM = 'medium',     // 2 domains, may need coordination
  COMPLEX = 'complex'    // 3+ domains, requires orchestration
}

export interface TaskClassification {
  readonly domains: string[];
  readonly complexity: TaskComplexity;
  readonly languages: string[];
  readonly moldovaContext: boolean;
  readonly urgency: 'real-time' | 'normal' | 'background';
  readonly confidence: number;
  toString(): string;
}

export interface ExecutionContext {
  readonly urgency: 'real-time' | 'normal' | 'background';
  readonly maxLatency?: number;
  readonly userType?: 'telegram' | 'api' | 'background';
  readonly fallbackEnabled?: boolean;
  readonly priority?: 'low' | 'normal' | 'high';
}

export interface CoordinationOptions {
  coordinationMode?: 'udp' | 'orchestra' | 'auto';
  maxLatency?: number;
  forceMode?: boolean;
}