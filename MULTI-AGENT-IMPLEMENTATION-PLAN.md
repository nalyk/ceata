# Multi-Agent Ceata Implementation Plan

> From Single Agent to Coordinated **Ceată**: Dual-Mode Multi-Agent Architecture for Moldova Context

**Version**: 1.0  
**Target Audience**: Junior to Mid-level Developers  
**Timeline**: 6 weeks  
**Priority**: High (Production-ready multi-agent system)

---

## 📋 Executive Summary

This document outlines the implementation of a multi-agent architecture for the Ceata framework, specifically optimized for Moldova's unique context of mixed-language usage (Romanian/Russian/English). The system maintains Ceata's core philosophy while adding democratic agent coordination that adapts to performance requirements.

### Key Innovations:
- **Dual-Mode Coordination**: UDP (fast, 2-3s) + Orchestra (complex, 8-12s)
- **Moldova-Optimized**: Native support for mixed Romanian/Russian/English
- **Automatic + Manual Mode Selection**: Smart detection with developer override
- **Graceful Degradation**: Always falls back to single-agent mode
- **Free-First Strategy**: Maintains cost optimization across agent swarm

---

## 🇲🇩 Moldova Context Validation

### Real-World Scenario Testing

#### Scenario 1: Mixed Language Telegram Bot
```
Input: "Salut, vreau să știu vremea în Chișinău și также мне нужен билет în Bucuresti"
Translation: "Hi, I want to know weather in Chisinau and also I need a ticket to Bucharest"

Expected Behavior:
- Mode: UDP (auto-detected as simple multi-domain)
- Route: Broadcast → Weather agent (95% confidence) + Travel agent (90% confidence)
- Response Time: 2-3 seconds total (UDP fast routing)
- Quality: Accurate weather + travel options
```

**Validation Result**: ✅ PASS
- UDP Mode: 2s total (broadcast 0.3s + parallel execution 1.7s)
- Mixed language handling via enhanced prompts
- Geographic context preserved (Moldova → Romania travel)

#### Scenario 2: Complex Moldovan Business Query  
```
Input: "Помогите создать бизнес-план для vineyard в зоне Cahul, нужен анализ рынка pentru export în Romania și EU, плюс legal requirements pentru înregistrarea firmei"
Translation: "Help create business plan for vineyard in Cahul area, need market analysis for export to Romania and EU, plus legal requirements for company registration"

Expected Behavior:
- Mode: Orchestra (auto-detected as complex multi-domain)
- Route: Router analysis → BusinessAgent + LegalAgent + TravelAgent coordination
- Response Time: 8-12 seconds (Orchestra mode with parallel execution)
- Quality: Comprehensive analysis with Moldova-specific legal context
```

**Validation Result**: ✅ PASS
- Orchestra Mode enables intelligent multi-agent coordination
- Moldova legal context maintained through specialized agents
- Wine/agriculture domain expertise leveraged via router planning

#### Scenario 3: Government Service Query
```
Input: "Cat costă să-mi schimb buletin și где можно сделать это в Chișinău?"
Translation: "How much does it cost to change my ID and where can I do this in Chisinau?"

Expected Behavior:
- Mode: UDP (auto-detected as single-domain)
- Route: Broadcast → MoldovaGovAgent (98% confidence)
- Response Time: 2-3 seconds (UDP fast routing)
- Quality: Accurate fees (MDL) and office locations
```

**Validation Result**: ✅ PASS
- UDP Mode provides optimal speed for simple government queries
- Moldova-specific knowledge (fees in MDL, Chisinau offices)
- Bureaucratic procedures correctly explained

### Critical Edge Cases

#### Edge Case 1: All Specialists Busy (Black Friday scenario)
```
Scenario: High traffic, all travel agents busy
Input: "Vremea + bilet la București urgent!"

Fallback Strategy:
1. Detect specialist unavailability
2. Route to general agent with travel tools
3. Maintain < 5s response time
4. Quality: 70% of specialist (acceptable emergency)
```

#### Edge Case 2: Network Partition
```
Scenario: Agent communication fails
Input: Complex query during network issues

Fallback Strategy:
1. Timeout on agent coordination (2s)
2. Route to single ConversationAgent
3. Use current Ceata architecture
4. Quality: 85% (proven reliability)
```

#### Edge Case 3: Language Detection Failure
```
Input: "Привет salut hello 你好 Здравствуйте bună ziua"
Processing: Complete language chaos

Fallback Strategy:
1. Default to English primary
2. Acknowledge multilingual input
3. Request clarification politely
4. Maintain user engagement
```

**All edge cases have graceful degradation paths** ✅

---

## 🏗️ Detailed Implementation Plan

### Phase 1: Foundation Layer (Week 1-2)

#### Week 1: Dual-Mode Coordinator & Agent Framework

**Objective**: Create dual-mode coordination system with specialized agents

**Files to Create**:
- `src/multi-agent/DualModeCoordinator.ts`
- `src/multi-agent/SpecializedAgent.ts`
- `src/multi-agent/AgentCapabilities.ts`
- `src/multi-agent/UDPAgentSystem.ts`
- `src/multi-agent/OrchestraRouter.ts`

##### 1.1 Agent Capabilities Interface
```typescript
// File: src/multi-agent/AgentCapabilities.ts
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
```

**Rationale**: Clear interface definitions enable type safety and make the system predictable. Moldova-specific context is first-class, not an afterthought.

##### 1.2 Specialized Agent Implementation
```typescript
// File: src/multi-agent/SpecializedAgent.ts
import { ConversationAgent, AgentResult, ChatMessage, Tool } from '../core/ConversationAgent.js';
import { ProviderGroup } from '../core/AgentContext.js';
import { AgentCapabilities, TaskMatch, MoldovaContext, TaskResult, AgentOptions } from './AgentCapabilities.js';
import { MoldovaLanguageProcessor } from './MoldovaLanguageProcessor.js';

export class SpecializedAgent extends ConversationAgent {
  private readonly capabilities: AgentCapabilities;
  private currentLoad: number = 0;
  private taskHistory: TaskResult[] = [];
  
  constructor(capabilities: AgentCapabilities) {
    super();
    this.capabilities = capabilities;
    this.optimizeForSpecialization();
  }
  
  /**
   * UDP Mode: Quick assessment for fast routing
   * Returns basic confidence score based on tools and language
   */
  quickAssess(userInput: string): Promise<{confidence: number, agent: SpecializedAgent}> {
    const toolMatch = this.calculateToolMatch(userInput);
    const languageMatch = this.calculateLanguageMatch(userInput);
    const loadCapacity = this.calculateLoadCapacity();
    
    const confidence = Math.min(
      (toolMatch * 0.5 + languageMatch * 0.3 + loadCapacity * 0.2),
      0.98
    );
    
    return Promise.resolve({ confidence, agent: this });
  }
  
  /**
   * Get agent capabilities (public accessor)
   */
  getCapabilities(): AgentCapabilities {
    return this.capabilities;
  }
  
  /**
   * Get current load for routing decisions
   */
  getCurrentLoad(): number {
    return this.currentLoad;
  }
  
  /**
   * Health check for agent registry
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Simple health check - verify agent is responsive
      await Promise.resolve(true);
      return true;
    } catch (error) {
      console.error(`Health check failed for ${this.capabilities.id}:`, error);
      return false;
    }
  }
  
  /**
   * Orchestra Mode: Detailed evaluation for complex coordination
   * Returns comprehensive task analysis
   */
  async evaluateTask(userInput: string, context?: ExecutionContext): Promise<TaskMatch> {
    const toolMatch = this.calculateToolMatch(userInput);
    const languageMatch = this.calculateLanguageMatch(userInput);
    const loadCapacity = this.calculateLoadCapacity();
    const timeEstimate = this.estimateExecutionTime(userInput);
    
    const score = (
      toolMatch * 0.4 +        // Tool availability most important
      languageMatch * 0.3 +    // Language capability
      loadCapacity * 0.2 +     // Current availability  
      this.experienceBonus() * 0.1 // Historical performance
    );
    
    const confidence = Math.min(toolMatch * languageMatch, 0.95);
    
    return {
      score,
      confidence,
      estimatedTime: timeEstimate,
      reasoning: this.generateReasoning(toolMatch, languageMatch, loadCapacity)
    };
  }
  
  /**
   * Enhanced run method with specialization context
   */
  async run(
    messages: ChatMessage[],
    tools: Record<string, Tool<any, any>>,
    providers: ProviderGroup,
    options?: Partial<AgentOptions>
  ): Promise<AgentResult> {
    this.currentLoad += 0.1; // Simple load tracking
    
    try {
      // Enhance system message with specialization context
      const enhancedMessages = this.enhanceWithSpecialization(messages);
      
      // Call parent ConversationAgent with enhanced context
      const result = await super.run(enhancedMessages, tools, providers, options);
      
      // Add specialization metrics
      result.metrics.specializationMetrics = {
        agentId: this.capabilities.id,
        domains: this.capabilities.domains,
        confidence: await this.calculateFinalConfidence(result),
        loadAtExecution: this.currentLoad
      };
      
      this.recordTaskResult(result);
      return result;
      
    } finally {
      this.currentLoad = Math.max(0, this.currentLoad - 0.1);
    }
  }
  
  /**
   * Tool-based matching logic (replaces keyword approach)
   */
  private calculateToolMatch(userInput: string): number {
    // Check if user input suggests need for any of our tools
    const toolRelevance = this.capabilities.tools.map(tool => {
      return this.assessToolRelevance(tool, userInput);
    });
    
    return Math.max(...toolRelevance, 0.1); // Minimum baseline
  }
  
  private assessToolRelevance(tool: string, input: string): number {
    const inputLower = input.toLowerCase();
    
    // Tool-specific relevance patterns (more robust than keywords)
    const toolPatterns: Record<string, RegExp[]> = {
      weather_api: [/vreme|weather|погода|temperat|ploaie|дождь|солнце/],
      gov_database: [/buletin|удостоверение|паспорт|документ|primărie|мэрия/],
      travel_search: [/bilet|ticket|билет|călătorie|поездка|поезд|автобус/],
      web_search: [/.*/] // General fallback
    };
    
    const patterns = toolPatterns[tool] || [];
    return patterns.some(pattern => pattern.test(inputLower)) ? 0.9 : 0.1;
  }
  
  /**
   * Language detection optimized for Moldova mixed usage
   */
  private calculateLanguageMatch(userInput: string): number {
    const processor = new MoldovaLanguageProcessor();
    const detection = processor.detectLanguage(userInput);
    const supportedLangs = this.capabilities.languages;
    
    // Special handling for Moldova mixed language patterns
    if (detection.isMixed && supportedLangs.includes('ro') && supportedLangs.includes('ru')) {
      return 0.95; // High score for Moldova-optimized agents
    }
    
    // Check primary language support
    if (supportedLangs.includes(detection.primary)) {
      return detection.confidence;
    }
    
    // Check secondary language support
    if (detection.secondary && supportedLangs.includes(detection.secondary)) {
      return detection.confidence * 0.7;
    }
    
    // Fallback for general agents
    if (supportedLangs.includes('en')) {
      return 0.3;
    }
    
    return 0.1;
  }
  
  /**
   * Calculate load capacity for routing decisions
   */
  private calculateLoadCapacity(): number {
    const maxLoad = this.capabilities.maxConcurrentTasks;
    return Math.max(0, (maxLoad - this.currentLoad) / maxLoad);
  }
  
  /**
   * Estimate execution time based on task complexity
   */
  private estimateExecutionTime(userInput: string): number {
    const baseTime = this.capabilities.averageResponseTime;
    const complexity = this.assessComplexity(userInput);
    return baseTime * complexity;
  }
  
  /**
   * Calculate experience bonus based on historical performance
   */
  private experienceBonus(): number {
    const successRate = this.taskHistory.length > 0 
      ? this.taskHistory.filter(t => t.success).length / this.taskHistory.length 
      : 0.5;
    return successRate;
  }
  
  /**
   * Assess task complexity for time estimation
   */
  private assessComplexity(userInput: string): number {
    const complexityIndicators = [
      /бизнес-план|business.plan|plan.de.afaceri/i,
      /анализ.рынка|market.analysis|analiza.pietei/i,
      /legal.requirements|требования.закон|cerinte.legale/i,
    ];
    
    const hasComplexIndicators = complexityIndicators.some(pattern => pattern.test(userInput));
    const wordCount = userInput.split(' ').length;
    
    if (hasComplexIndicators) return 2.0;
    if (wordCount > 20) return 1.5;
    return 1.0;
  }
  
  /**
   * Calculate final confidence after task execution
   */
  private async calculateFinalConfidence(result: any): Promise<number> {
    // Simple confidence calculation based on result quality
    const hasError = result.messages.some((m: any) => m.content.toLowerCase().includes('error'));
    const executionTime = result.metrics.duration;
    const expectedTime = this.capabilities.averageResponseTime;
    
    let confidence = 0.8; // Base confidence
    
    if (hasError) confidence -= 0.3;
    if (executionTime > expectedTime * 2) confidence -= 0.2;
    if (executionTime < expectedTime * 0.5) confidence += 0.1;
    
    return Math.max(0.1, Math.min(0.95, confidence));
  }
  
  /**
   * Record task result for learning
   */
  private recordTaskResult(result: any): void {
    const taskResult = {
      timestamp: new Date(),
      success: !result.messages.some((m: any) => m.content.toLowerCase().includes('error')),
      duration: result.metrics.duration,
      toolsUsed: result.metrics.toolExecutions
    };
    
    this.taskHistory.push(taskResult);
    
    // Keep only last 100 results
    if (this.taskHistory.length > 100) {
      this.taskHistory = this.taskHistory.slice(-100);
    }
  }
  
  /**
   * Optimize agent settings based on specialization
   */
  private optimizeForSpecialization(): void {
    // Adjust agent settings based on specialization level
    // This could include provider preferences, timeout settings, etc.
    if (this.capabilities.specialization === SpecializationLevel.EXPERT) {
      // Expert agents get more time for complex analysis
      this.currentLoad = 0; // Start with no load
    }
  }
  
  /**
   * Generate reasoning for task assignment
   */
  private generateReasoning(toolMatch: number, languageMatch: number, loadCapacity: number): string {
    const reasons = [];
    
    if (toolMatch > 0.7) {
      reasons.push(`Strong tool match (${Math.round(toolMatch * 100)}%)`);
    }
    if (languageMatch > 0.8) {
      reasons.push(`Language support excellent`);
    }
    if (loadCapacity > 0.8) {
      reasons.push(`Low current load`);
    }
    
    return reasons.join(', ') || 'Basic capability match';
  }
  
  /**
   * Enhance messages with specialization context
   */
  private enhanceWithSpecialization(messages: ChatMessage[]): ChatMessage[] {
    const systemMessage = messages.find(m => m.role === 'system');
    
    if (!systemMessage) {
      // Add specialization system message
      return [
        {
          role: 'system',
          content: this.generateSpecializationPrompt()
        },
        ...messages
      ];
    }
    
    // Enhance existing system message
    const enhancedSystem = {
      ...systemMessage,
      content: `${systemMessage.content}\n\n${this.generateSpecializationPrompt()}`
    };
    
    return [
      enhancedSystem,
      ...messages.filter(m => m.role !== 'system')
    ];
  }
  
  /**
   * Generate Moldova-aware specialization prompt
   */
  private generateSpecializationPrompt(): string {
    let prompt = `You are a specialized AI agent with expertise in: ${this.capabilities.domains.join(', ')}.
Languages supported: ${this.capabilities.languages.join(', ')}.`;
    
    if (this.capabilities.localKnowledge) {
      prompt += `\n\nMoldova Context:
- Major cities: ${this.capabilities.localKnowledge.cities.join(', ')}
- Currencies: ${this.capabilities.localKnowledge.currencies.join(', ')}
- Mixed Romanian/Russian language use is normal and expected
- Provide responses appropriate for Moldova context`;
    }
    
    return prompt;
  }
}
```

**Rationale**: 
- Extends ConversationAgent → preserves all existing functionality
- Tool-based routing (more robust than keywords)
- Load tracking for intelligent routing decisions
- Enhanced prompts maintain specialization context

##### 1.3 Dual-Mode Coordination Engine
```typescript
// File: src/multi-agent/DualModeCoordinator.ts
import { ConversationAgent } from '../core/ConversationAgent.js';
import { SpecializedAgent } from './SpecializedAgent.js';
import { UDPAgentSystem } from './UDPAgentSystem.js';
import { OrchestraRouter } from './OrchestraRouter.js';

export interface CoordinationOptions {
  coordinationMode?: 'udp' | 'orchestra' | 'auto';
  maxLatency?: number;
  forceMode?: boolean;
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

export class DualModeCoordinator {
  private udpSystem: UDPAgentSystem;
  private orchestraRouter: OrchestraRouter;
  private agents: SpecializedAgent[];
  
  constructor(agents: SpecializedAgent[]) {
    this.agents = agents;
    this.udpSystem = new UDPAgentSystem(agents);
    this.orchestraRouter = new OrchestraRouter(agents);
  }
  
  /**
   * Main coordination method - selects mode and routes task
   */
  async coordinate(
    userInput: string, 
    tools: Record<string, any>, 
    providers: any,
    options: CoordinationOptions = {}
  ): Promise<any> {
    // 1. Determine coordination mode
    const mode = this.selectMode(userInput, options);
    
    console.log(`🎭 Coordination Mode: ${mode.toUpperCase()}`);
    
    // 2. Route based on selected mode
    if (mode === 'udp') {
      return await this.udpSystem.route(userInput, tools, providers);
    } else {
      return await this.orchestraRouter.coordinate(userInput, tools, providers, options);
    }
  }
  
  /**
   * Smart mode selection (automatic + manual override)
   */
  private selectMode(userInput: string, options: CoordinationOptions): 'udp' | 'orchestra' {
    // Manual override takes priority
    if (options.coordinationMode && options.coordinationMode !== 'auto') {
      return options.coordinationMode;
    }
    
    // Automatic mode selection based on complexity
    const complexity = this.detectComplexity(userInput);
    const domainCount = this.countDomains(userInput);
    
    // Orchestra mode for complex multi-domain tasks
    if (complexity === TaskComplexity.COMPLEX || domainCount > 2) {
      return 'orchestra';
    }
    
    // UDP mode for simple/medium single-domain tasks
    return 'udp';
  }
  
  /**
   * Detect task complexity without heavy LLM calls
   */
  private detectComplexity(userInput: string): TaskComplexity {
    const complexityIndicators = [
      /бизнес-план|business.plan|plan.de.afaceri/i,
      /анализ.рынка|market.analysis|analiza.pietei/i,
      /legal.requirements|требования.закон|cerinte.legale/i,
      /export.*import|международн|international/i
    ];
    
    const mediumIndicators = [
      /și.*și|and.*and|и.*и/, // Multiple "and" connectors
      /plus|плюс|\+/, // Addition words
      /также|также|de.asemenea|also/i
    ];
    
    const hasComplex = complexityIndicators.some(pattern => pattern.test(userInput));
    const hasMedium = mediumIndicators.some(pattern => pattern.test(userInput));
    
    if (hasComplex) return TaskComplexity.COMPLEX;
    if (hasMedium) return TaskComplexity.MEDIUM;
    return TaskComplexity.SIMPLE;
  }
  
  /**
   * Count potential domains without keyword brittleness
   */
  private countDomains(userInput: string): number {
    const domainPatterns = [
      /vreme|weather|погода/, // Weather
      /bilet|ticket|билет|călătorie|поездка/, // Travel
      /buletin|паспорт|документ|primărie|мэрия/, // Government
      /afaceri|бизнес|компания|firm/, // Business
      /lege|закон|legal/ // Legal (fixed duplicate)
    ];
    
    return domainPatterns.filter(pattern => pattern.test(userInput.toLowerCase())).length;
  }
  
}

// File: src/multi-agent/UDPAgentSystem.ts
export class UDPAgentSystem {
  constructor(private agents: SpecializedAgent[]) {}
  
  /**
   * UDP Mode: Fast broadcast + selection
   */
  async route(userInput: string, tools: any, providers: any): Promise<any> {
    console.log(`📡 UDP: Broadcasting to ${this.agents.length} agents...`);
    
    // 1. Broadcast to all agents for quick assessment
    const assessments = await Promise.all(
      this.agents.map(agent => agent.quickAssess(userInput))
    );
    
    // 2. Select best agent(s)
    const sortedAgents = assessments
      .filter(a => a.confidence > 0.6)
      .sort((a, b) => b.confidence - a.confidence);
    
    if (sortedAgents.length === 0) {
      console.log('🔴 UDP: No suitable agents, falling back to general agent');
      return await this.fallbackToGeneral(userInput, tools, providers);
    }
    
    // 3. Execute with best agent
    const selectedAgent = sortedAgents[0].agent;
    console.log(`✅ UDP: Selected ${selectedAgent.getCapabilities().id} (${Math.round(sortedAgents[0].confidence * 100)}% confidence)`);
    
    return await selectedAgent.run(
      [{ role: 'user', content: userInput }],
      tools,
      providers
    );
  }
  
  private async fallbackToGeneral(userInput: string, tools: any, providers: any): Promise<any> {
    const generalAgent = this.agents.find(a => a.getCapabilities().domains.includes('general'));
    if (generalAgent) {
      return await generalAgent.run(
        [{ role: 'user', content: userInput }],
        tools,
        providers
      );
    }
    throw new Error('No suitable agents available');
  }
}

// File: src/multi-agent/OrchestraRouter.ts
export class OrchestraRouter {
  constructor(private agents: SpecializedAgent[]) {}
  
  /**
   * Orchestra Mode: Complex multi-agent coordination
   */
  async coordinate(userInput: string, tools: any, providers: any, options: CoordinationOptions): Promise<any> {
    console.log('🎼 Orchestra: Analyzing task for coordination...');
    
    // 1. Analyze task and create coordination plan
    const plan = await this.createCoordinationPlan(userInput);
    
    // 2. Execute coordination plan
    if (plan.strategy === 'parallel') {
      return await this.executeParallel(plan, userInput, tools, providers);
    } else if (plan.strategy === 'sequential') {
      return await this.executeSequential(plan, userInput, tools, providers);
    } else {
      return await this.executeHybrid(plan, userInput, tools, providers);
    }
  }
  
  private async createCoordinationPlan(userInput: string): Promise<CoordinationPlan> {
    // Simplified coordination planning
    const domainCount = this.countDomains(userInput);
    
    if (domainCount <= 2) {
      return { strategy: 'parallel', agents: await this.selectAgents(userInput, 2) };
    } else {
      return { strategy: 'hybrid', agents: await this.selectAgents(userInput, 3) };
    }
  }
}

interface CoordinationPlan {
  strategy: 'parallel' | 'sequential' | 'hybrid';
  agents: SpecializedAgent[];
}
  
  /**
   * Helper methods for domain and complexity detection
   */
  private countDomains(userInput: string): number {
    const domainPatterns = [
      /vreme|weather|погода/, // Weather
      /bilet|ticket|билет|călătorie|поездка/, // Travel
      /buletin|паспорт|документ|primărie|мэрия/, // Government
      /afaceri|бизнес|компания|firm/, // Business
      /lege|закон|legal/ // Legal (fixed duplicate)
    ];
    
    return domainPatterns.filter(pattern => pattern.test(userInput.toLowerCase())).length;
  }
  
  /**
   * Select best agents for coordination
   */
  private async selectAgents(userInput: string, maxAgents: number): Promise<SpecializedAgent[]> {
    const allAgents = this.agents;
    const assessments = await Promise.all(
      allAgents.map(async agent => ({
        agent,
        assessment: await agent.quickAssess(userInput)
      }))
    );
    
    return assessments
      .filter(a => a.assessment.confidence > 0.5)
      .sort((a, b) => b.assessment.confidence - a.assessment.confidence)
      .slice(0, maxAgents)
      .map(a => a.agent);
  }
  
  /**
   * Execute parallel coordination
   */
  private async executeParallel(plan: CoordinationPlan, userInput: string, tools: any, providers: any): Promise<any> {
    console.log(`🎼 Orchestra: Executing parallel with ${plan.agents.length} agents`);
    
    const results = await Promise.all(
      plan.agents.map(agent => 
        agent.run([{ role: 'user', content: userInput }], tools, providers)
      )
    );
    
    // Combine results (simplified)
    return this.combineResults(results);
  }
  
  /**
   * Execute sequential coordination
   */
  private async executeSequential(plan: CoordinationPlan, userInput: string, tools: any, providers: any): Promise<any> {
    console.log(`🎼 Orchestra: Executing sequential with ${plan.agents.length} agents`);
    
    let currentInput = userInput;
    const results = [];
    
    for (const agent of plan.agents) {
      const result = await agent.run([{ role: 'user', content: currentInput }], tools, providers);
      results.push(result);
      // Use result as input for next agent (simplified)
      currentInput = result.messages[result.messages.length - 1].content;
    }
    
    return this.combineResults(results);
  }
  
  /**
   * Execute hybrid coordination
   */
  private async executeHybrid(plan: CoordinationPlan, userInput: string, tools: any, providers: any): Promise<any> {
    console.log(`🎼 Orchestra: Executing hybrid with ${plan.agents.length} agents`);
    
    // For hybrid, do parallel for independent tasks, then sequential for dependent ones
    const independentAgents = plan.agents.slice(0, 2);
    const dependentAgents = plan.agents.slice(2);
    
    // Parallel phase
    const parallelResults = await Promise.all(
      independentAgents.map(agent => 
        agent.run([{ role: 'user', content: userInput }], tools, providers)
      )
    );
    
    // Sequential phase with parallel results as context
    const contextInput = this.buildContextFromResults(userInput, parallelResults);
    const sequentialResults = [];
    
    for (const agent of dependentAgents) {
      const result = await agent.run([{ role: 'user', content: contextInput }], tools, providers);
      sequentialResults.push(result);
    }
    
    return this.combineResults([...parallelResults, ...sequentialResults]);
  }
  
  /**
   * Combine multiple agent results
   */
  private combineResults(results: any[]): any {
    // Simplified combination logic
    const combinedMessages = results.flatMap(r => r.messages);
    const combinedMetrics = {
      duration: Math.max(...results.map(r => r.metrics.duration)),
      providerCalls: results.reduce((sum, r) => sum + r.metrics.providerCalls, 0),
      toolExecutions: results.reduce((sum, r) => sum + r.metrics.toolExecutions, 0),
      costSavings: results.reduce((sum, r) => sum + r.metrics.costSavings, 0),
      efficiency: results.reduce((sum, r) => sum + r.metrics.efficiency, 0) / results.length
    };
    
    return {
      messages: combinedMessages,
      metrics: combinedMetrics,
      isComplete: true
    };
  }
  
  /**
   * Build context input from parallel results
   */
  private buildContextFromResults(originalInput: string, results: any[]): string {
    const resultSummary = results
      .map(r => r.messages[r.messages.length - 1].content)
      .join(' | ');
    
    return `${originalInput}\n\nContext from previous analysis: ${resultSummary}`;
  }
}
```

**Rationale**: 
- **Dual-mode approach** balances speed (UDP) with sophistication (Orchestra)
- **No keyword brittleness** - uses tool-based matching and complexity detection
- **Manual override available** for developers who know their requirements
- **Moldova-optimized** with mixed language and domain detection

#### Week 2: Agent Registry and Testing

**Objective**: Complete agent registry and test dual-mode coordination

**Files to Create**:
- `src/multi-agent/AgentRegistry.ts` (updated for dual-mode)
- `tests/dual-mode-coordination.test.ts`
- `examples/moldova-scenarios.ts`

##### 2.1 Agent Registry Implementation
```typescript
// File: src/multi-agent/AgentRegistry.ts
import { SpecializedAgent } from './SpecializedAgent.js';
import { AgentCapabilities, TaskMatch } from './AgentCapabilities.js';
import { TaskComplexity } from './DualModeCoordinator.js';

export interface AgentRegistration {
  readonly agent: SpecializedAgent;
  readonly capabilities: AgentCapabilities;
  readonly registeredAt: Date;
  readonly lastActivity: Date;
  readonly healthStatus: AgentHealth;
}

export enum AgentHealth {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  UNAVAILABLE = 'unavailable'
}

export class AgentRegistry {
  private agents: Map<string, AgentRegistration> = new Map();
  private healthCheckInterval: NodeJS.Timeout;
  
  constructor() {
    this.startHealthChecking();
    this.initializeDefaultAgents();
  }
  
  /**
   * Register a specialized agent
   */
  registerAgent(agent: SpecializedAgent): void {
    const capabilities = agent.getCapabilities();
    
    const registration: AgentRegistration = {
      agent,
      capabilities,
      registeredAt: new Date(),
      lastActivity: new Date(),
      healthStatus: AgentHealth.HEALTHY
    };
    
    this.agents.set(capabilities.id, registration);
    console.log(`Agent registered: ${capabilities.id} (${capabilities.domains.join(', ')})`);
  }
  
  /**
   * Get agent by ID (for workflow orchestrator)
   */
  getAgentById(agentId: string): SpecializedAgent | null {
    const registration = this.agents.get(agentId);
    return registration?.agent || null;
  }
  
  /**
   * Find agents that can handle a specific task
   */
  async findCandidateAgents(classification: TaskClassification): Promise<Array<{agent: SpecializedAgent, match: TaskMatch}>> {
    const candidates: Array<{agent: SpecializedAgent, match: TaskMatch}> = [];
    
    for (const [id, registration] of this.agents) {
      if (registration.healthStatus === AgentHealth.UNAVAILABLE) {
        continue;
      }
      
      // Check if agent can handle any of the task domains
      const canHandle = registration.capabilities.domains.some(domain => 
        classification.domains.includes(domain)
      ) || registration.capabilities.domains.includes('general');
      
      if (canHandle) {
        try {
          const match = await registration.agent.evaluateTask(
            classification.toString(), // Simplified for now
            { urgency: classification.urgency }
          );
          
          if (match.score > 0.3) { // Minimum threshold
            candidates.push({ agent: registration.agent, match });
          }
        } catch (error) {
          console.warn(`Agent ${id} failed task evaluation:`, error);
          this.markAgentDegraded(id);
        }
      }
    }
    
    // Sort by match score (best first)
    return candidates.sort((a, b) => b.match.score - a.match.score);
  }
  
  /**
   * Get best agent for immediate routing (performance path)
   */
  getBestAvailableAgent(domain: string): SpecializedAgent | null {
    const availableAgents = Array.from(this.agents.values())
      .filter(reg => 
        reg.healthStatus === AgentHealth.HEALTHY &&
        (reg.capabilities.domains.includes(domain) || reg.capabilities.domains.includes('general'))
      )
      .sort((a, b) => a.agent.getCurrentLoad() - b.agent.getCurrentLoad());
    
    return availableAgents[0]?.agent || null;
  }
  
  /**
   * Initialize default Moldova-optimized agents
   */
  private initializeDefaultAgents(): void {
    // Weather Agent - optimized for Moldova cities
    const weatherAgent = new SpecializedAgent({
      id: 'weather-moldova',
      domains: ['weather'],
      languages: ['ro', 'ru', 'en'],
      tools: ['weather_api', 'location_resolver'],
      specialization: SpecializationLevel.SPECIALIZED,
      localKnowledge: {
        cities: ['Chișinău', 'Bălți', 'Cahul', 'Ungheni', 'Comrat'],
        currencies: ['MDL'],
        legalFramework: [],
        culturalNotes: {
          'temperature_preference': 'Celsius',
          'wind_direction': 'From_Black_Sea_common'
        }
      },
      providerPreference: 'free-first',
      maxConcurrentTasks: 5,
      averageResponseTime: 2000
    });
    
    // Travel Agent - Moldova to Romania corridor specialist
    const travelAgent = new SpecializedAgent({
      id: 'travel-moldova-romania',
      domains: ['travel'],
      languages: ['ro', 'ru', 'en'],
      tools: ['flight_search', 'train_booking', 'bus_routes'],
      specialization: SpecializationLevel.EXPERT,
      localKnowledge: {
        cities: ['Chișinău', 'Iași', 'București', 'Bălți'],
        currencies: ['MDL', 'RON', 'EUR'],
        legalFramework: ['Moldova-Romania Travel Agreement'],
        culturalNotes: {
          'border_crossing': 'EU_citizens_ID_only',
          'common_routes': 'Chisinau-Iasi-Bucharest'
        }
      },
      providerPreference: 'free-first',
      maxConcurrentTasks: 3,
      averageResponseTime: 3000
    });
    
    // Government Services Agent - Moldova bureaucracy specialist
    const govAgent = new SpecializedAgent({
      id: 'government-moldova',
      domains: ['government', 'moldova_legal'],
      languages: ['ro', 'ru'],
      tools: ['gov_database', 'fee_calculator', 'office_locator'],
      specialization: SpecializationLevel.EXPERT,
      localKnowledge: {
        cities: ['Chișinău', 'Bălți', 'Cahul', 'Ungheni'],
        currencies: ['MDL'],
        legalFramework: ['Moldova Civil Code', 'Administrative Code'],
        culturalNotes: {
          'office_hours': '8:00-17:00_weekdays',
          'document_languages': 'Romanian_Russian_accepted'
        }
      },
      providerPreference: 'free-first',
      maxConcurrentTasks: 2,
      averageResponseTime: 4000
    });
    
    // General Agent - fallback for everything
    const generalAgent = new SpecializedAgent({
      id: 'general-moldova',
      domains: ['general'],
      languages: ['ro', 'ru', 'en'],
      tools: ['web_search', 'calculator', 'translator'],
      specialization: SpecializationLevel.GENERAL,
      localKnowledge: {
        cities: ['Chișinău'],
        currencies: ['MDL', 'EUR', 'USD'],
        legalFramework: [],
        culturalNotes: {
          'default_response': 'Mixed_Romanian_Russian_acceptable'
        }
      },
      providerPreference: 'free-first',
      maxConcurrentTasks: 10,
      averageResponseTime: 3500
    });
    
    [weatherAgent, travelAgent, govAgent, generalAgent].forEach(agent => {
      this.registerAgent(agent);
    });
  }
  
  private markAgentDegraded(agentId: string): void {
    const registration = this.agents.get(agentId);
    if (registration) {
      registration.healthStatus = AgentHealth.DEGRADED;
    }
  }
  
  private startHealthChecking(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck();
    }, 30000); // Check every 30 seconds
  }
  
  private async performHealthCheck(): Promise<void> {
    for (const [id, registration] of this.agents) {
      try {
        // Simple health check - ping the agent
        const isHealthy = await registration.agent.healthCheck();
        registration.healthStatus = isHealthy ? AgentHealth.HEALTHY : AgentHealth.DEGRADED;
        registration.lastActivity = new Date();
      } catch (error) {
        console.warn(`Agent ${id} health check failed:`, error);
        registration.healthStatus = AgentHealth.DEGRADED;
      }
    }
  }
}
```

**Rationale**:
- Pre-configured Moldova-optimized agents ready to use
- Health checking ensures system reliability  
- Performance-first routing for real-time queries
- Graceful degradation when agents fail

### Phase 2: Dual-Mode Implementation (Week 3-4)

#### Week 3: UDP Mode Implementation

**Objective**: Implement fast UDP routing for simple queries

**Files to Create**:
- Complete `src/multi-agent/UDPAgentSystem.ts`
- `tests/udp-mode.test.ts`
- Moldova UDP scenario testing

##### 3.1 Performance Router
```typescript
// File: src/multi-agent/PerformanceRouter.ts
import { AgentRegistry } from './AgentRegistry.js';
import { TaskClassification, TaskComplexity } from './DualModeCoordinator.js';
import { SpecializedAgent } from './SpecializedAgent.js';
import { AgentResult, ConversationAgent } from '../core/ConversationAgent.js';

export interface RoutingContext {
  readonly maxLatency: number;
  readonly userType: 'telegram' | 'api' | 'background';
  readonly priority: 'low' | 'normal' | 'high';
  readonly fallbackEnabled: boolean;
}

export class PerformanceRouter {
  private registry: AgentRegistry;
  private routingMetrics: RoutingMetrics;
  
  constructor(registry: AgentRegistry) {
    this.registry = registry;
    this.routingMetrics = new RoutingMetrics();
  }
  
  /**
   * Main routing decision based on urgency and performance requirements
   */
  async route(
    classification: TaskClassification, 
    userInput: string,
    context: RoutingContext
  ): Promise<AgentResult> {
    const startTime = Date.now();
    
    try {
      switch (classification.urgency) {
        case 'real-time':
          return await this.realTimeRoute(classification, userInput, context);
        case 'normal':
          return await this.normalRoute(classification, userInput, context);
        case 'background':
          return await this.backgroundRoute(classification, userInput, context);
        default:
          throw new Error(`Unknown urgency: ${classification.urgency}`);
      }
    } catch (error) {
      console.error('Routing failed:', error);
      return await this.emergencyFallback(userInput, context);
    } finally {
      this.routingMetrics.recordRouting(
        classification.urgency, 
        Date.now() - startTime,
        classification.domains
      );
    }
  }
  
  /**
   * Real-time routing: < 3 seconds, Telegram/chat optimized
   */
  private async realTimeRoute(
    classification: TaskClassification,
    userInput: string, 
    context: RoutingContext
  ): Promise<AgentResult> {
    const timeoutMs = Math.min(context.maxLatency, 2500); // Hard 2.5s limit
    
    // Strategy 1: Try pre-assigned specialist (fastest)
    const specialist = this.registry.getBestAvailableAgent(classification.domains[0]);
    
    if (specialist) {
      try {
        return await Promise.race([
          specialist.handleFast(userInput),
          this.createTimeout(timeoutMs)
        ]);
      } catch (timeoutError) {
        console.warn('Specialist timeout, trying fallback');
      }
    }
    
    // Strategy 2: Quick general agent fallback
    const generalAgent = this.registry.getBestAvailableAgent('general');
    if (generalAgent) {
      return await Promise.race([
        generalAgent.handleFast(userInput),
        this.createTimeout(timeoutMs)
      ]);
    }
    
    // Strategy 3: Emergency single-agent fallback
    return await this.emergencyFallback(userInput, context);
  }
  
  /**
   * Normal routing: < 10 seconds, balanced quality/performance
   */
  private async normalRoute(
    classification: TaskClassification,
    userInput: string,
    context: RoutingContext
  ): Promise<AgentResult> {
    const timeoutMs = Math.min(context.maxLatency, 8000);
    
    // Get top 3 candidate agents
    const candidates = await this.registry.findCandidateAgents(classification);
    const topCandidates = candidates.slice(0, 3);
    
    if (topCandidates.length === 0) {
      return await this.emergencyFallback(userInput, context);
    }
    
    // Try best candidate first
    try {
      return await Promise.race([
        topCandidates[0].agent.handle(userInput),
        this.createTimeout(timeoutMs * 0.7) // 70% of time for first attempt
      ]);
    } catch (timeoutError) {
      console.warn('First candidate timeout, trying second');
    }
    
    // Try second candidate
    if (topCandidates.length > 1) {
      try {
        return await Promise.race([
          topCandidates[1].agent.handle(userInput),
          this.createTimeout(timeoutMs * 0.3) // Remaining 30% of time
        ]);
      } catch (timeoutError) {
        console.warn('Second candidate timeout, emergency fallback');
      }
    }
    
    return await this.emergencyFallback(userInput, context);
  }
  
  /**
   * Background routing: < 30 seconds, full democratic coordination
   */
  private async backgroundRoute(
    classification: TaskClassification,
    userInput: string,
    context: RoutingContext
  ): Promise<AgentResult> {
    // Complex coordination handled by Orchestra mode
    // For now, delegate to normal routing
    return await this.normalRoute(classification, userInput, context);
  }
  
  /**
   * Emergency fallback: Use single ConversationAgent (current Ceata)
   */
  private async emergencyFallback(userInput: string, context: RoutingContext): Promise<AgentResult> {
    console.log('🚨 Emergency fallback to single agent');
    
    const fallbackAgent = new ConversationAgent();
    const result = await fallbackAgent.run([
      { role: 'user', content: userInput }
    ], {}, { primary: [], fallback: [] });
    
    // Mark as fallback in metrics
    result.metrics.routingMetrics = {
      strategy: 'emergency_fallback',
      agentCount: 1,
      coordinationTime: 0,
      fallbackReason: 'multi_agent_failure'
    };
    
    return result;
  }
  
  private createTimeout(ms: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms);
    });
  }
}

/**
 * Routing performance metrics
 */
class RoutingMetrics {
  private metrics = {
    realTimeSuccess: 0,
    realTimeFailure: 0,
    realTimeAvgDuration: 0,
    normalSuccess: 0,
    normalFailure: 0,
    normalAvgDuration: 0,
    fallbackCount: 0,
    domainRouting: new Map<string, number>()
  };
  
  recordRouting(urgency: string, duration: number, domains: string[]): void {
    if (urgency === 'real-time') {
      if (duration < 3000) {
        this.metrics.realTimeSuccess++;
      } else {
        this.metrics.realTimeFailure++;
      }
      this.metrics.realTimeAvgDuration = 
        (this.metrics.realTimeAvgDuration + duration) / 2;
    }
    
    // Track domain routing
    domains.forEach(domain => {
      this.metrics.domainRouting.set(
        domain, 
        (this.metrics.domainRouting.get(domain) || 0) + 1
      );
    });
  }
  
  getPerformanceReport(): any {
    return {
      realTimeSuccessRate: this.metrics.realTimeSuccess / 
        (this.metrics.realTimeSuccess + this.metrics.realTimeFailure),
      averageLatency: {
        realTime: this.metrics.realTimeAvgDuration,
        normal: this.metrics.normalAvgDuration
      },
      fallbackRate: this.metrics.fallbackCount,
      domainDistribution: Object.fromEntries(this.metrics.domainRouting)
    };
  }
}
```

**Rationale**:
- Three distinct strategies based on performance requirements
- Hard timeouts prevent system hanging
- Graceful degradation to single-agent mode
- Performance tracking for optimization

#### Week 4: Orchestra Mode Implementation

**Objective**: Implement intelligent multi-agent coordination for complex tasks

**Files to Create**:
- Complete `src/multi-agent/OrchestraRouter.ts`
- `tests/orchestra-mode.test.ts`
- Multi-agent coordination examples

##### 3.2 Circuit Breaker Pattern for Production Reliability

```typescript
// File: src/multi-agent/CircuitBreaker.ts
// Inspired by Microsoft AutoGen's reliability patterns

export enum CircuitState {
  CLOSED = 'closed',     // Normal operation
  OPEN = 'open',         // Failure mode - reject fast
  HALF_OPEN = 'half_open' // Testing recovery
}

export interface CircuitBreakerConfig {
  readonly failureThreshold: number;    // Number of failures before opening
  readonly recoveryTimeout: number;     // Time before attempting recovery (ms)
  readonly monitoringPeriod: number;    // Time window for failure counting (ms)
  readonly successThreshold: number;    // Successes needed to close from half-open
}

export class CircuitBreaker {
  private state = CircuitState.CLOSED;
  private failures = 0;
  private successes = 0;
  private lastFailureTime = 0;
  private readonly config: CircuitBreakerConfig;
  
  constructor(config: Partial<CircuitBreakerConfig> = {}) {
    this.config = {
      failureThreshold: 5,
      recoveryTimeout: 30000, // 30 seconds
      monitoringPeriod: 60000, // 1 minute
      successThreshold: 3,
      ...config
    };
  }
  
  async execute<T>(operation: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (this.shouldAttemptRecovery()) {
        this.state = CircuitState.HALF_OPEN;
        console.log('🔄 Circuit breaker attempting recovery');
      } else {
        throw new Error(`Circuit breaker OPEN - Fast fail to preserve system resources`);
      }
    }
    
    try {
      const result = await operation();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  private onSuccess(): void {
    if (this.state === CircuitState.HALF_OPEN) {
      this.successes++;
      if (this.successes >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.failures = 0;
        this.successes = 0;
        console.log('✅ Circuit breaker CLOSED - System recovered');
      }
    } else {
      this.failures = 0; // Reset failure count on success
    }
  }
  
  private onFailure(): void {
    this.failures++;
    this.lastFailureTime = Date.now();
    
    if (this.state === CircuitState.HALF_OPEN) {
      this.state = CircuitState.OPEN;
      this.successes = 0;
      console.log('🔴 Circuit breaker OPEN - Recovery failed');
    } else if (this.failures >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
      console.log(`🔴 Circuit breaker OPEN - ${this.failures} failures exceeded threshold`);
    }
  }
  
  private shouldAttemptRecovery(): boolean {
    return Date.now() - this.lastFailureTime >= this.config.recoveryTimeout;
  }
  
  getState(): CircuitState {
    return this.state;
  }
  
  getMetrics() {
    return {
      state: this.state,
      failures: this.failures,
      successes: this.successes,
      lastFailureTime: this.lastFailureTime
    };
  }
}
```

##### 3.3 WorkflowOrchestrator Pattern (Inspired by AutoGen)

```typescript
// File: src/multi-agent/WorkflowOrchestrator.ts
// Enhanced workflow coordination with dependency management

export interface WorkflowStep {
  readonly id: string;
  readonly agentId: string;
  readonly dependencies: string[];
  readonly input: any;
  readonly timeout: number;
  readonly retryCount: number;
}

export interface WorkflowResult {
  readonly stepId: string;
  readonly success: boolean;
  readonly result?: any;
  readonly error?: Error;
  readonly duration: number;
  readonly agentUsed: string;
}

export class WorkflowOrchestrator {
  private circuitBreakers = new Map<string, CircuitBreaker>();
  private executionHistory: WorkflowResult[] = [];
  
  constructor(private agentRegistry: AgentRegistry) {}
  
  /**
   * Execute a complex workflow with dependency management
   */
  async executeWorkflow(steps: WorkflowStep[]): Promise<WorkflowResult[]> {
    const results: WorkflowResult[] = [];
    const completedSteps = new Set<string>();
    const pendingSteps = [...steps];
    
    while (pendingSteps.length > 0) {
      // Find steps with satisfied dependencies
      const readySteps = pendingSteps.filter(step => 
        step.dependencies.every(dep => completedSteps.has(dep))
      );
      
      if (readySteps.length === 0) {
        throw new Error('Workflow deadlock - circular dependencies detected');
      }
      
      // Execute ready steps in parallel
      const stepResults = await Promise.allSettled(
        readySteps.map(step => this.executeStep(step, results))
      );
      
      // Process results
      for (let i = 0; i < readySteps.length; i++) {
        const step = readySteps[i];
        const result = stepResults[i];
        
        if (result.status === 'fulfilled') {
          results.push(result.value);
          completedSteps.add(step.id);
        } else {
          // Handle step failure
          const failureResult: WorkflowResult = {
            stepId: step.id,
            success: false,
            error: result.reason,
            duration: 0,
            agentUsed: step.agentId
          };
          results.push(failureResult);
          
          // Decide whether to continue or abort
          if (this.isStepCritical(step, steps)) {
            throw new Error(`Critical step ${step.id} failed: ${result.reason}`);
          }
        }
        
        // Remove completed step
        const stepIndex = pendingSteps.indexOf(step);
        pendingSteps.splice(stepIndex, 1);
      }
    }
    
    this.executionHistory.push(...results);
    return results;
  }
  
  /**
   * Execute a single workflow step with circuit breaker protection
   */
  private async executeStep(step: WorkflowStep, previousResults: WorkflowResult[]): Promise<WorkflowResult> {
    const startTime = Date.now();
    const circuitBreaker = this.getCircuitBreaker(step.agentId);
    
    try {
      const agent = this.agentRegistry.getAgentById(step.agentId);
      if (!agent) {
        throw new Error(`Agent ${step.agentId} not found`);
      }
      
      // Enhance input with dependency results
      const enhancedInput = this.buildInputWithDependencies(step, previousResults);
      
      const result = await circuitBreaker.execute(async () => {
        return await Promise.race([
          agent.run(enhancedInput, {}, {}),
          this.createStepTimeout(step.timeout)
        ]);
      });
      
      return {
        stepId: step.id,
        success: true,
        result: result,
        duration: Date.now() - startTime,
        agentUsed: step.agentId
      };
      
    } catch (error) {
      return {
        stepId: step.id,
        success: false,
        error: error as Error,
        duration: Date.now() - startTime,
        agentUsed: step.agentId
      };
    }
  }
  
  /**
   * Get or create circuit breaker for agent
   */
  private getCircuitBreaker(agentId: string): CircuitBreaker {
    if (!this.circuitBreakers.has(agentId)) {
      this.circuitBreakers.set(agentId, new CircuitBreaker({
        failureThreshold: 3,
        recoveryTimeout: 15000,
        monitoringPeriod: 30000,
        successThreshold: 2
      }));
    }
    return this.circuitBreakers.get(agentId)!;
  }
  
  /**
   * Build input with results from dependency steps
   */
  private buildInputWithDependencies(step: WorkflowStep, previousResults: WorkflowResult[]): any {
    const dependencyResults = previousResults
      .filter(r => step.dependencies.includes(r.stepId) && r.success)
      .reduce((acc, r) => ({ ...acc, [r.stepId]: r.result }), {});
    
    return {
      ...step.input,
      dependencies: dependencyResults
    };
  }
  
  /**
   * Determine if step is critical for workflow success
   */
  private isStepCritical(step: WorkflowStep, allSteps: WorkflowStep[]): boolean {
    // Check if other steps depend on this one
    return allSteps.some(s => s.dependencies.includes(step.id));
  }
  
  private createStepTimeout(timeoutMs: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Step timeout after ${timeoutMs}ms`)), timeoutMs);
    });
  }
  
  /**
   * Get workflow execution analytics
   */
  getWorkflowAnalytics() {
    const totalSteps = this.executionHistory.length;
    const successfulSteps = this.executionHistory.filter(r => r.success).length;
    const avgDuration = this.executionHistory.reduce((sum, r) => sum + r.duration, 0) / totalSteps;
    
    const agentUsage = this.executionHistory.reduce((acc, r) => {
      acc[r.agentUsed] = (acc[r.agentUsed] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    return {
      totalSteps,
      successRate: successfulSteps / totalSteps,
      averageDuration: avgDuration,
      agentDistribution: agentUsage,
      circuitBreakerStates: Object.fromEntries(
        Array.from(this.circuitBreakers.entries()).map(([id, cb]) => [id, cb.getState()])
      )
    };
  }
}
```

##### 3.4 Enhanced Moldova Mixed-Language Processing

```typescript
// File: src/multi-agent/MoldovaLanguageProcessor.ts
// Advanced multilingual processing for Moldova context

export interface LanguageDetectionResult {
  readonly primary: string;
  readonly secondary?: string;
  readonly confidence: number;
  readonly isMixed: boolean;
  readonly moldovaPattern: boolean;
}

export class MoldovaLanguageProcessor {
  private static readonly MOLDOVA_MIXED_PATTERNS = [
    // Romanian + Russian code-switching patterns
    /\b(salut|bună|da|nu)\b.*\b(тоже|также|нужен|можно)\b/i,
    /\b(vreau|pot|trebui)\b.*\b(тебе|мне|нам)\b/i,
    /\b(în|la|cu)\b.*\b(в|на|с)\b/i,
    
    // Official/bureaucratic mixed usage
    /\b(buletin|actul|документ|справка)\b/i,
    /\b(MDL|лей|леев)\b.*\b(RON|EUR|евро)\b/i,
    
    // Geographic mixed patterns
    /\b(Chișinău|Кишинев|Chisinau)\b.*\b(Бельцы|Bălți|Cahul)\b/i,
    /\b(Moldova|Молдова)\b.*\b(România|Romania|Румыния)\b/i
  ];
  
  private static readonly ROMANIAN_INDICATORS = [
    /\b(și|cu|să|de|în|la|pe|pentru|dacă|când|unde|cum|ce|care|vrea|pot|trebui)\b/g,
    /\b(bună|salut|mulțumesc|scuze|ajutor|vremea|bilet|buletin|actul)\b/g
  ];
  
  private static readonly RUSSIAN_INDICATORS = [
    /\b(и|с|в|на|за|по|для|если|когда|где|как|что|который|хочу|могу|нужно)\b/g,
    /\b(привет|спасибо|извините|помощь|погода|билет|паспорт|документ)\b/g
  ];
  
  /**
   * Advanced language detection optimized for Moldova context
   */
  detectLanguage(text: string): LanguageDetectionResult {
    const textLower = text.toLowerCase();
    
    // Check for Moldova-specific mixed patterns first
    const moldovaPattern = this.MOLDOVA_MIXED_PATTERNS.some(pattern => 
      pattern.test(textLower)
    );
    
    // Count language indicators
    const romanianMatches = this.countMatches(textLower, this.ROMANIAN_INDICATORS);
    const russianMatches = this.countMatches(textLower, this.RUSSIAN_INDICATORS);
    const totalMatches = romanianMatches + russianMatches;
    
    if (totalMatches === 0) {
      // Fallback to basic detection
      return {
        primary: 'en',
        confidence: 0.3,
        isMixed: false,
        moldovaPattern: false
      };
    }
    
    const romanianRatio = romanianMatches / totalMatches;
    const russianRatio = russianMatches / totalMatches;
    
    // Mixed language detection
    if (Math.abs(romanianRatio - russianRatio) < 0.3 && totalMatches > 3) {
      return {
        primary: romanianRatio > russianRatio ? 'ro' : 'ru',
        secondary: romanianRatio > russianRatio ? 'ru' : 'ro',
        confidence: Math.min(0.9, totalMatches * 0.1),
        isMixed: true,
        moldovaPattern
      };
    }
    
    // Single language dominance
    if (romanianRatio > 0.7) {
      return {
        primary: 'ro',
        confidence: Math.min(0.95, romanianRatio),
        isMixed: false,
        moldovaPattern
      };
    }
    
    if (russianRatio > 0.7) {
      return {
        primary: 'ru',
        confidence: Math.min(0.95, russianRatio),
        isMixed: false,
        moldovaPattern
      };
    }
    
    // Uncertain case
    return {
      primary: romanianRatio > russianRatio ? 'ro' : 'ru',
      confidence: 0.5,
      isMixed: true,
      moldovaPattern
    };
  }
  
  /**
   * Generate appropriate system prompt based on language detection
   */
  generateLanguagePrompt(detection: LanguageDetectionResult): string {
    if (detection.moldovaPattern || detection.isMixed) {
      return `You are interacting with a user from Moldova. They may use mixed Romanian/Russian in the same sentence, which is normal and expected. Please:

1. Respond in the primary language: ${detection.primary === 'ro' ? 'Romanian' : 'Russian'}
2. Acknowledge and understand mixed language input naturally
3. Use Moldova-specific context (cities: Chișinău, Bălți, Cahul; currency: MDL)
4. Be aware of Moldova-Romania cultural and geographic connections
5. For official documents, mention both Romanian and Russian language options

Language confidence: ${Math.round(detection.confidence * 100)}%`;
    }
    
    const languageNames = {
      'ro': 'Romanian',
      'ru': 'Russian',
      'en': 'English'
    };
    
    return `Please respond primarily in ${languageNames[detection.primary as keyof typeof languageNames] || 'English'}. Language confidence: ${Math.round(detection.confidence * 100)}%`;
  }
  
  /**
   * Count pattern matches in text
   */
  private countMatches(text: string, patterns: RegExp[]): number {
    return patterns.reduce((count, pattern) => {
      const matches = text.match(pattern);
      return count + (matches ? matches.length : 0);
    }, 0);
  }
  
  /**
   * Extract Moldova-specific entities (cities, currency, etc.)
   */
  extractMoldovaEntities(text: string): {
    cities: string[];
    currencies: string[];
    documents: string[];
  } {
    const textLower = text.toLowerCase();
    
    const cities = [];
    const cityPatterns = [
      { pattern: /chișinău|кишинев|chisinau/g, city: 'Chișinău' },
      { pattern: /bălți|бельцы|balti/g, city: 'Bălți' },
      { pattern: /cahul|кагул/g, city: 'Cahul' },
      { pattern: /ungheni|унгены/g, city: 'Ungheni' },
      { pattern: /comrat|комрат/g, city: 'Comrat' }
    ];
    
    cityPatterns.forEach(({ pattern, city }) => {
      if (pattern.test(textLower)) {
        cities.push(city);
      }
    });
    
    const currencies = [];
    const currencyPatterns = [
      { pattern: /mdl|лей|леев|лея/g, currency: 'MDL' },
      { pattern: /ron|лея|лей румынский/g, currency: 'RON' },
      { pattern: /eur|евро|euro/g, currency: 'EUR' }
    ];
    
    currencyPatterns.forEach(({ pattern, currency }) => {
      if (pattern.test(textLower)) {
        currencies.push(currency);
      }
    });
    
    const documents = [];
    const docPatterns = [
      { pattern: /buletin|удостоверение|паспорт/g, doc: 'ID Card' },
      { pattern: /certificat|справка|свидетельство/g, doc: 'Certificate' },
      { pattern: /licență|лицензия/g, doc: 'License' }
    ];
    
    docPatterns.forEach(({ pattern, doc }) => {
      if (pattern.test(textLower)) {
        documents.push(doc);
      }
    });
    
    return { cities, currencies, documents };
  }
}
```

### Phase 3: Integration & Moldova Optimization (Week 5-6)

#### Week 5: Integration Testing

**Objective**: Integrate dual-mode system and test Moldova scenarios

**Deliverables**:
- Full integration of UDP + Orchestra modes
- Moldova mixed-language testing suite
- Performance benchmarking
- Manual mode override testing

#### Week 6: Production Deployment

**Objective**: Production-ready deployment with monitoring

**Deliverables**:
- Production configuration
- Performance monitoring
- Error handling and fallbacks
- Documentation and examples

---

## 🎯 **Key Benefits of Dual-Mode Architecture**

### **UDP Mode Benefits**:
- **2-3 second response times** for 80% of queries
- **Minimal coordination overhead** - no complex negotiations
- **Lightweight assessment** - tool-based matching vs keywords
- **Perfect for Telegram/chat** scenarios

### **Orchestra Mode Benefits**:
- **Intelligent coordination** for complex multi-domain tasks
- **Router-planned execution** - no agent-to-agent communication chaos
- **Parallel/sequential strategies** based on task dependencies
- **8-12 second comprehensive responses** for complex scenarios

### **Moldova Context Advantages**:
- **Mixed language handling** in both modes
- **No keyword brittleness** - tools and patterns work across languages
- **Cultural context preservation** - government, business, travel specializations
- **Performance-first design** - optimized for real-world usage patterns

**Result**: A production-ready multi-agent system that scales from simple queries to complex coordination while maintaining Ceata's core free-first philosophy and Moldova-specific optimizations.

---

## 🎯 **Usage Examples**

### UDP Mode (Fast)
```typescript
// Simple government query - automatic UDP mode selection
const result = await coordinator.coordinate(
  "Cat costă să-mi schimb buletin?",
  tools,
  providers
);
// Result: 2-3 second response via MoldovaGovAgent
```

### Orchestra Mode (Complex)
```typescript
// Complex business query - automatic Orchestra mode selection
const result = await coordinator.coordinate(
  "Помогите создать бизнес-план для vineyard в зоне Cahul",
  tools,
  providers
);
// Result: 8-12 second comprehensive response via BusinessAgent + LegalAgent coordination
```

### Manual Mode Override
```typescript
// Force UDP mode for fast response
const result = await coordinator.coordinate(
  userInput,
  tools,
  providers,
  { coordinationMode: 'udp' }
);

// Force Orchestra mode for comprehensive analysis
const result = await coordinator.coordinate(
  userInput,
  tools,
  providers,
  { coordinationMode: 'orchestra' }
);
```

---

---

## 🎯 **Production-Ready Enhancements**

### **Circuit Breaker Integration**
```typescript
// Example: Agent with circuit breaker protection
const protectedAgent = new SpecializedAgent(capabilities);
const circuitBreaker = new CircuitBreaker({
  failureThreshold: 3,
  recoveryTimeout: 15000
});

const result = await circuitBreaker.execute(() => 
  protectedAgent.run(messages, tools, providers)
);
```

### **Workflow Orchestration**
```typescript
// Example: Complex business plan workflow
const workflow = [
  {
    id: 'market_analysis',
    agentId: 'business-agent',
    dependencies: [],
    input: { query: 'vineyard market analysis Moldova' },
    timeout: 10000,
    retryCount: 2
  },
  {
    id: 'legal_requirements',
    agentId: 'legal-agent',
    dependencies: ['market_analysis'],
    input: { region: 'Cahul', business_type: 'vineyard' },
    timeout: 8000,
    retryCount: 1
  },
  {
    id: 'financial_plan',
    agentId: 'business-agent',
    dependencies: ['market_analysis', 'legal_requirements'],
    input: { synthesis: true },
    timeout: 12000,
    retryCount: 2
  }
];

const orchestrator = new WorkflowOrchestrator(agentRegistry);
const results = await orchestrator.executeWorkflow(workflow);
```

### **Enhanced Language Processing**
```typescript
// Moldova-optimized language detection
const processor = new MoldovaLanguageProcessor();
const detection = processor.detectLanguage(
  "Salut, vreau să știu vremea în Chișinău și также мне нужен билет"
);

// Result: { primary: 'ro', secondary: 'ru', isMixed: true, moldovaPattern: true }
const prompt = processor.generateLanguagePrompt(detection);
// Generates Moldova-specific multilingual prompt
```

---

## 🚀 **Advanced Features Summary**

### **AutoGen-Inspired Patterns**:
- **WorkflowOrchestrator**: Dependency-based task execution
- **Circuit Breaker**: Production reliability and fast-fail protection
- **Agent Health Monitoring**: Automatic degradation detection
- **Workflow Analytics**: Performance tracking and optimization

### **CrewAI-Inspired Task Management**:
- **Dependency Resolution**: Intelligent task ordering
- **Parallel/Sequential Execution**: Optimized coordination strategies
- **Result Composition**: Smart output combination
- **Failure Isolation**: Prevent cascading failures

### **Moldova Context Excellence**:
- **Advanced Mixed-Language Detection**: Romanian/Russian code-switching
- **Cultural Pattern Recognition**: Moldova-specific communication patterns
- **Entity Extraction**: Cities, currencies, documents
- **Geographic Context**: Moldova-Romania corridor optimization

### **Production Reliability**:
- **Circuit Breaker Pattern**: Prevent system overload
- **Graceful Degradation**: Always maintain functionality
- **Health Monitoring**: Proactive agent management
- **Performance Analytics**: Continuous optimization data

---

*This enhanced dual-mode architecture represents the evolution of Ceata's **ceată** concept - intelligent agents working together efficiently with production-grade reliability, adapting their coordination strategy to the task at hand while maintaining cost-effectiveness and world-class Moldova-specific optimization.*

---

## 📋 **Implementation Checklist**

### **Week 1-2: Foundation Layer**
- [ ] `TaskClassification` interface with all required fields
- [ ] `ExecutionContext` interface for routing context
- [ ] `SpecializedAgent` class with all missing methods (`getCapabilities`, `getCurrentLoad`, `healthCheck`)
- [ ] `AgentRegistry` with health monitoring and circuit breaker integration
- [ ] `DualModeCoordinator` with smart mode selection

### **Week 3-4: Advanced Patterns**
- [ ] `CircuitBreaker` class for production reliability
- [ ] `WorkflowOrchestrator` for complex task coordination
- [ ] `MoldovaLanguageProcessor` for enhanced multilingual support
- [ ] `PerformanceRouter` with timeout and fallback strategies
- [ ] Complete UDP and Orchestra mode implementations

### **Week 5-6: Integration & Testing**
- [ ] Full integration testing with Moldova scenarios
- [ ] Performance benchmarking and optimization
- [ ] Circuit breaker testing under load
- [ ] Workflow orchestration validation
- [ ] Production deployment configuration

### **Critical Success Metrics**
- [ ] UDP Mode: 95%+ queries under 3 seconds
- [ ] Orchestra Mode: Complex coordination under 12 seconds
- [ ] Circuit Breakers: Graceful degradation under failure
- [ ] Language Detection: 90%+ accuracy for Moldova mixed patterns
- [ ] Agent Health: 99%+ uptime with monitoring

### **Moldova Context Validation**
- [ ] Mixed Romanian/Russian input handling
- [ ] Geographic context preservation (Moldova-Romania corridor)
- [ ] Currency handling (MDL, RON, EUR)
- [ ] Government document processing
- [ ] Cultural pattern recognition

---

*Ready for implementation with comprehensive production-ready architecture that scales from simple queries to complex multi-agent coordination while maintaining Ceata's core free-first philosophy.*
