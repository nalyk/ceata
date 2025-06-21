/**
 * CEATA QUANTUM PLANNER - Revolutionary AI Planning System
 * 
 * The breakthrough planner that combines classical planning excellence 
 * with modern LLM capabilities for universal compatibility and self-healing.
 */

import { AgentContext, StepResult } from "./AgentContext.js";
import { ChatMessage, Provider } from "./Provider.js";
import { logger } from "./logger.js";

// ============================================================================
// QUANTUM PLANNER INTERFACES
// ============================================================================

export interface QuantumPlan {
  readonly intent: UserIntent;
  readonly strategy: ExecutionStrategy;
  readonly steps: QuantumStep[];
  readonly alternatives: AlternativePath[];
  readonly estimatedCost: number;
  readonly confidence: number;
}

export interface UserIntent {
  readonly primary: string;           // Main goal
  readonly secondary: string[];       // Sub-goals
  readonly context: string;           // Situational context
  readonly complexity: IntentComplexity;
  readonly taskType: TaskType;
  readonly constraints: string[];     // Limitations or requirements
}

export interface ExecutionStrategy {
  readonly type: StrategyType;
  readonly reasoning: string;
  readonly expectedTools: string[];
  readonly dependencies: TaskDependency[];
  readonly fallbackStrategy?: ExecutionStrategy;
}

export interface QuantumStep {
  readonly id: string;
  readonly type: StepType;
  readonly intent: string;            // What this step achieves
  readonly expectedTools?: string[];
  readonly priority: StepPriority;
  readonly dependencies: string[];    // IDs of prerequisite steps
  readonly alternatives: string[];    // Alternative approaches
}

export interface AlternativePath {
  readonly strategy: ExecutionStrategy;
  readonly steps: QuantumStep[];
  readonly cost: number;
  readonly reliability: number;
}

export interface TaskDependency {
  readonly stepId: string;
  readonly requirement: string;
  readonly type: 'sequential' | 'parallel' | 'conditional';
}

export interface ExecutionMemory {
  readonly pattern: string;
  readonly success_rate: number;
  readonly avg_cost: number;
  readonly last_used: Date;
  readonly improvements: string[];
}

export interface ExecutionHypothesis {
  readonly id: string;
  readonly description: string;
  readonly approach: StrategyType;
  readonly reasoning: string;
  readonly confidence: number;
  readonly expectedOutcome: string;
  readonly riskFactors: string[];
  readonly verificationCriteria: string[];
}

export interface ThoughtNode {
  readonly id: string;
  readonly content: string;
  readonly type: 'reasoning' | 'hypothesis' | 'verification' | 'revision';
  readonly parent?: string;
  readonly children: string[];
  readonly confidence: number;
  readonly alternatives: string[];
}

// ============================================================================
// ENUMS AND TYPES  
// ============================================================================

export type IntentComplexity = 'simple' | 'moderate' | 'complex' | 'expert';
export type TaskType = 
  | 'calculation' 
  | 'search' 
  | 'creation' 
  | 'analysis' 
  | 'planning' 
  | 'communication'
  | 'multi_step'
  | 'unknown';

export type StrategyType = 
  | 'direct'           // Single step execution
  | 'sequential'       // Step-by-step execution
  | 'hierarchical'     // Break down into sub-tasks
  | 'parallel'         // Multiple tools simultaneously
  | 'adaptive'         // Real-time strategy adjustment
  | 'fallback';        // Recovery strategy

export type StepType = 'chat' | 'tool_execution' | 'reflection' | 'completion' | 'planning';
export type StepPriority = 'critical' | 'normal' | 'optional';

// ============================================================================
// QUANTUM PLANNER IMPLEMENTATION
// ============================================================================

export class QuantumPlanner {
  private executionMemory: Map<string, ExecutionMemory> = new Map();
  private failurePatterns: Map<string, number> = new Map();

  /**
   * 🧠 PHASE 1: INTENT RECOGNITION ENGINE
   * Uses LLM-powered analysis to understand true user intent
   */
  async analyzeIntent(message: string, context: AgentContext): Promise<UserIntent> {
    logger.debug("🧠 [QuantumPlanner] Analyzing user intent...");

    // Use the most capable provider for intent analysis
    const provider = this.selectBestProvider(context);
    const model = this.getBestModel(provider, context);

    const intentPrompt = this.buildIntentAnalysisPrompt(message, context);
    
    try {
      const response = await provider.chat({
        model,
        messages: [{ role: "user", content: intentPrompt }],
        timeoutMs: context.options.timeoutMs
      });

      // Handle both ChatResult and AsyncIterable<ChatResult>
      if (Symbol.asyncIterator in response) {
        // For streaming responses, we need to collect all chunks
        const chunks: string[] = [];
        for await (const chunk of response) {
          if (chunk.messages && chunk.messages.length > 0) {
            const lastMessage = chunk.messages[chunk.messages.length - 1];
            if (lastMessage.content) {
              chunks.push(lastMessage.content);
            }
          }
        }
        const analysis = this.parseIntentResponse(chunks.join(''));
        logger.debug(`🎯 [QuantumPlanner] Intent: ${analysis.primary} (${analysis.complexity})`);
        return analysis;
      } else {
        // For non-streaming responses
        const analysis = this.parseIntentResponse(response.messages[response.messages.length - 1].content);
        logger.debug(`🎯 [QuantumPlanner] Intent: ${analysis.primary} (${analysis.complexity})`);
        return analysis;
      }
    } catch (error) {
      logger.warn(`⚠️ [QuantumPlanner] Intent analysis failed, using fallback: ${error}`);
      return this.fallbackIntentAnalysis(message, context);
    }
  }

  /**
   * 🏗️ PHASE 2: HIERARCHICAL TASK DECOMPOSITION  
   * HTN-inspired breakdown of complex tasks
   */
  async createQuantumPlan(ctx: AgentContext): Promise<QuantumPlan> {
    const lastMessage = ctx.messages[ctx.messages.length - 1];
    
    if (!lastMessage || lastMessage.role !== 'user') {
      return this.createCompletionPlan();
    }

    // Step 1: Analyze user intent
    const intent = await this.analyzeIntent(lastMessage.content || '', ctx);
    
    // Step 2: Check memory for similar patterns
    const memorizedPattern = this.recallSimilarPattern(intent);
    
    // Step 3: Generate execution strategy
    const strategy = await this.generateExecutionStrategy(intent, ctx, memorizedPattern);
    
    // Step 4: Create step hierarchy
    const steps = await this.decomposeIntoSteps(intent, strategy, ctx);
    
    // Step 5: Generate alternative paths
    const alternatives = await this.generateAlternatives(intent, strategy, ctx);
    
    // Step 6: Calculate confidence and cost
    const confidence = this.calculateConfidence(intent, strategy, memorizedPattern);
    const cost = this.estimateCost(steps, alternatives);

    const plan: QuantumPlan = {
      intent,
      strategy,
      steps,
      alternatives,
      estimatedCost: cost,
      confidence
    };

    logger.debug(`📋 [QuantumPlanner] Created plan: ${steps.length} steps, confidence: ${confidence}%`);
    return plan;
  }

  /**
   * 🔮 REAL-TIME ADAPTATION
   * Adapts plan based on execution results using Tree-of-Thoughts approach
   */
  async adaptQuantumPlan(
    originalPlan: QuantumPlan, 
    stepResult: StepResult, 
    ctx: AgentContext
  ): Promise<QuantumPlan> {
    logger.debug("🔮 [QuantumPlanner] Adapting plan based on execution result...");

    // Check if we're done
    if (stepResult.isComplete) {
      // Learn from successful execution
      this.learnFromSuccess(originalPlan, ctx);
      return this.createCompletionPlan();
    }

    // Check for failures and attempt healing
    if (stepResult.error) {
      return await this.healFromFailure(originalPlan, stepResult, ctx);
    }

    // Normal adaptation - continue with next steps
    return await this.continueExecution(originalPlan, stepResult, ctx);
  }

  // ============================================================================
  // INTENT ANALYSIS IMPLEMENTATION
  // ============================================================================

  private buildIntentAnalysisPrompt(message: string, context: AgentContext): string {
    const availableTools = Object.keys(context.tools).join(', ');
    
    return `Analyze this user request and extract the intent:

USER REQUEST: "${message}"

AVAILABLE TOOLS: ${availableTools}

Please analyze and respond in this EXACT format:
PRIMARY_INTENT: [Main goal in one sentence]
SECONDARY_INTENTS: [Sub-goals, comma separated]
CONTEXT: [Situational context and background]
COMPLEXITY: [simple/moderate/complex/expert]
TASK_TYPE: [calculation/search/creation/analysis/planning/communication/multi_step/unknown]
CONSTRAINTS: [Any limitations or requirements, comma separated]

Focus on understanding what the user REALLY wants to achieve, not just the literal words.`;
  }

  private parseIntentResponse(response: string | null): UserIntent {
    if (!response) {
      return this.createDefaultIntent();
    }

    const lines = response.split('\n');
    let primary = "Unknown request";
    let secondary: string[] = [];
    let context = "No specific context";
    let complexity: IntentComplexity = 'moderate';
    let taskType: TaskType = 'unknown';
    let constraints: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('PRIMARY_INTENT:')) {
        primary = trimmed.replace('PRIMARY_INTENT:', '').trim();
      } else if (trimmed.startsWith('SECONDARY_INTENTS:')) {
        secondary = trimmed.replace('SECONDARY_INTENTS:', '').split(',').map(s => s.trim()).filter(s => s);
      } else if (trimmed.startsWith('CONTEXT:')) {
        context = trimmed.replace('CONTEXT:', '').trim();
      } else if (trimmed.startsWith('COMPLEXITY:')) {
        const complexityStr = trimmed.replace('COMPLEXITY:', '').trim() as IntentComplexity;
        complexity = ['simple', 'moderate', 'complex', 'expert'].includes(complexityStr) ? complexityStr : 'moderate';
      } else if (trimmed.startsWith('TASK_TYPE:')) {
        const taskTypeStr = trimmed.replace('TASK_TYPE:', '').trim() as TaskType;
        taskType = ['calculation', 'search', 'creation', 'analysis', 'planning', 'communication', 'multi_step', 'unknown'].includes(taskTypeStr) ? taskTypeStr : 'unknown';
      } else if (trimmed.startsWith('CONSTRAINTS:')) {
        constraints = trimmed.replace('CONSTRAINTS:', '').split(',').map(s => s.trim()).filter(s => s);
      }
    }

    return {
      primary,
      secondary,
      context,
      complexity,
      taskType,
      constraints
    };
  }

  private fallbackIntentAnalysis(message: string, context: AgentContext): UserIntent {
    // Simple keyword-based fallback
    const lowerMessage = message.toLowerCase();
    
    let taskType: TaskType = 'unknown';
    let complexity: IntentComplexity = 'simple';

    if (/calculate|compute|math|multiply|divide|add|subtract/.test(lowerMessage)) {
      taskType = 'calculation';
    } else if (/search|find|look|get/.test(lowerMessage)) {
      taskType = 'search';
    } else if (/create|make|build|generate/.test(lowerMessage)) {
      taskType = 'creation';
    } else if (/analyze|examine|review|check/.test(lowerMessage)) {
      taskType = 'analysis';
    }

    if (/then|after|next|and then|first.*then/.test(lowerMessage)) {
      taskType = 'multi_step';
      complexity = 'moderate';
    }

    return {
      primary: message.length > 100 ? message.substring(0, 100) + "..." : message,
      secondary: [],
      context: "Fallback analysis - LLM intent analysis failed",
      complexity,
      taskType,
      constraints: []
    };
  }

  private createDefaultIntent(): UserIntent {
    return {
      primary: "Unknown request",
      secondary: [],
      context: "No context available",
      complexity: 'simple',
      taskType: 'unknown',
      constraints: []
    };
  }

  // ============================================================================
  // PROVIDER SELECTION & OPTIMIZATION
  // ============================================================================

  private selectBestProvider(context: AgentContext): Provider {
    // Prefer primary providers, prioritize those with better tool support
    const primaryProviders = context.providers.primary;
    
    if (primaryProviders.length > 0) {
      // Select provider based on capability (prefer those that support tools)
      const toolCapableProvider = primaryProviders.find(p => p.supportsTools);
      return toolCapableProvider || primaryProviders[0];
    }

    // Fallback to secondary providers
    if (context.providers.fallback.length > 0) {
      return context.providers.fallback[0];
    }

    throw new Error("No providers available for intent analysis");
  }

  private getBestModel(provider: Provider, context: AgentContext): string {
    // Get the configured model for this provider
    const model = context.providerModels?.[provider.id];
    
    if (model) {
      return model;
    }

    // Fallback to a reasonable default
    if (provider.id.includes('openai')) {
      return 'gpt-4o-mini';
    } else if (provider.id.includes('google')) {
      return 'models/gemini-2.0-flash-thinking-exp';
    } else if (provider.id.includes('openrouter')) {
      return 'mistralai/mistral-small-3.2-24b-instruct:free';
    }

    return 'auto';
  }

  // ============================================================================
  // PHASE 2: HTN-INSPIRED STRATEGY SELECTION & DECOMPOSITION
  // ============================================================================

  private selectOptimalStrategy(intent: UserIntent, ctx: AgentContext): StrategyType {
    // HTN-inspired strategy selection based on task characteristics
    const toolCount = Object.keys(ctx.tools).length;
    const hasMultipleSteps = intent.secondary.length > 1 || intent.taskType === 'multi_step';
    const primaryIntent = intent.primary.toLowerCase();
    
    // Adaptive for uncertain or dynamic tasks (check first)
    if (intent.taskType === 'unknown' || 
        intent.constraints.some(c => c.includes('uncertain')) ||
        /not sure|uncertain|don't know|help me with.*complex|unsure.*approach/.test(primaryIntent)) {
      return 'adaptive';
    }
    
    // Parallel for independent tasks that can run simultaneously  
    if (intent.secondary.length > 0 &&
        /search.*and.*analyz|find.*and.*examin|research.*and.*analyz/.test(primaryIntent.replace(/\s+/g, ' ')) &&
        toolCount > 2) {
      return 'parallel';
    }
    
    // Direct for simple, single-step tasks
    if (intent.complexity === 'simple' && 
        intent.secondary.length === 0 && 
        intent.taskType !== 'multi_step' &&
        !/then|after|next/.test(primaryIntent)) {
      return 'direct';
    }
    
    // Sequential for clear multi-step operations with dependencies (prioritize over hierarchical)
    if (/\bthen\b|\bafter\b|\bnext\b|first.*then/.test(primaryIntent) && 
        intent.complexity !== 'complex' &&
        intent.secondary.length <= 2) {
      return 'sequential';
    }
    
    // Hierarchical for complex tasks or tasks with many secondary goals
    if (intent.complexity === 'expert' || 
        intent.complexity === 'complex' || 
        (hasMultipleSteps && !/\bthen\b|\bafter\b|\bnext\b/.test(primaryIntent)) ||
        intent.secondary.length > 2) {
      return 'hierarchical';
    }
    
    // Default fallback based on complexity
    if (intent.complexity === 'moderate') {
      return intent.secondary.length > 0 ? 'sequential' : 'direct';
    }
    
    return 'direct';
  }

  private predictRequiredTools(intent: UserIntent, ctx: AgentContext): string[] {
    const availableTools = Object.keys(ctx.tools);
    const predictedTools: string[] = [];
    
    // Analyze intent and secondary goals to predict tool usage
    const allIntents = [intent.primary, ...intent.secondary].join(' ').toLowerCase();
    
    // Task-type specific predictions
    switch (intent.taskType) {
      case 'calculation':
        predictedTools.push(...availableTools.filter(t => 
          /^(add|subtract|multiply|divide|calculate|math)/i.test(t)
        ));
        break;
        
      case 'search':
        predictedTools.push(...availableTools.filter(t => 
          /^(search|find|get|fetch|query)/i.test(t)
        ));
        break;
        
      case 'analysis':
        predictedTools.push(...availableTools.filter(t => 
          /^(analyze|examine|review|process)/i.test(t)
        ));
        break;
        
      case 'creation':
        predictedTools.push(...availableTools.filter(t => 
          /^(create|generate|make|build)/i.test(t)
        ));
        break;
    }
    
    // Content-based keyword matching for broader coverage
    for (const toolName of availableTools) {
      if (allIntents.includes(toolName.toLowerCase()) && !predictedTools.includes(toolName)) {
        predictedTools.push(toolName);
      }
    }
    
    return [...new Set(predictedTools)];
  }

  private async analyzeDependencies(
    intent: UserIntent, 
    expectedTools: string[], 
    ctx: AgentContext
  ): Promise<TaskDependency[]> {
    const dependencies: TaskDependency[] = [];
    
    // Analyze intent for sequential indicators
    const content = [intent.primary, ...intent.secondary].join(' ').toLowerCase();
    
    // Mathematical sequences (calculate X, then divide by Y)
    if (/calculate.*?then.*?(divide|multiply)/.test(content) || 
        /area.*?then.*?(divide|multiply)/.test(content)) {
      dependencies.push({
        stepId: 'calculation_step',
        requirement: 'Mathematical result from previous step',
        type: 'sequential'
      });
    }
    
    // Search then analyze patterns
    if (/search.*?then.*?(analyze|review)/.test(content) ||
        /find.*?then.*?(analyze|examine)/.test(content)) {
      dependencies.push({
        stepId: 'search_step',
        requirement: 'Search results from previous step',
        type: 'sequential'
      });
    }
    
    // Parallel tasks that can run simultaneously
    if (expectedTools.length > 1 && !dependencies.some(d => d.type === 'sequential')) {
      dependencies.push({
        stepId: 'parallel_execution',
        requirement: 'Independent tool executions',
        type: 'parallel'
      });
    }
    
    return dependencies;
  }

  private generateFallbackStrategy(intent: UserIntent, primaryStrategy: ExecutionStrategy): ExecutionStrategy {
    // Always have a simpler fallback strategy
    let fallbackType: StrategyType = 'direct';
    
    if (primaryStrategy.type === 'hierarchical') {
      fallbackType = 'sequential';
    } else if (primaryStrategy.type === 'sequential' || primaryStrategy.type === 'parallel') {
      fallbackType = 'direct';
    } else if (primaryStrategy.type === 'adaptive') {
      fallbackType = 'sequential';
    }
    
    return {
      type: fallbackType,
      reasoning: `Fallback strategy for ${primaryStrategy.type} approach`,
      expectedTools: primaryStrategy.expectedTools.slice(0, 1), // Use fewer tools
      dependencies: [] // Simpler dependencies
    };
  }

  // ============================================================================
  // HTN STEP CREATION METHODS
  // ============================================================================

  private createDirectSteps(intent: UserIntent, strategy: ExecutionStrategy): QuantumStep[] {
    return [{
      id: 'direct_execution',
      type: strategy.expectedTools.length > 0 ? 'tool_execution' : 'chat',
      intent: intent.primary,
      expectedTools: strategy.expectedTools,
      priority: 'critical',
      dependencies: [],
      alternatives: ['fallback_to_chat']
    }];
  }

  private async createSequentialSteps(
    intent: UserIntent, 
    strategy: ExecutionStrategy, 
    ctx: AgentContext
  ): Promise<QuantumStep[]> {
    const steps: QuantumStep[] = [];
    
    // Step 1: Initial analysis/planning
    steps.push({
      id: 'seq_analysis',
      type: 'chat',
      intent: 'Analyze task and create execution plan',
      priority: 'normal',
      dependencies: [],
      alternatives: ['direct_execution']
    });
    
    // Step 2: Primary tool execution
    if (strategy.expectedTools.length > 0) {
      steps.push({
        id: 'seq_tool_execution',
        type: 'tool_execution',
        intent: 'Execute primary tools in sequence',
        expectedTools: strategy.expectedTools,
        priority: 'critical',
        dependencies: ['seq_analysis'],
        alternatives: ['manual_calculation']
      });
    }
    
    // Step 3: Result processing and continuation
    if (intent.secondary.length > 0) {
      steps.push({
        id: 'seq_continuation',
        type: 'chat',
        intent: 'Process results and continue with secondary goals',
        priority: 'normal',
        dependencies: ['seq_tool_execution'],
        alternatives: ['completion']
      });
    }
    
    return steps;
  }

  private async createHierarchicalSteps(
    intent: UserIntent, 
    strategy: ExecutionStrategy, 
    ctx: AgentContext
  ): Promise<QuantumStep[]> {
    const steps: QuantumStep[] = [];
    
    // Top-level planning step
    steps.push({
      id: 'hierarchy_planning',
      type: 'planning',
      intent: 'Break down complex task into manageable subtasks',
      priority: 'critical',
      dependencies: [],
      alternatives: ['sequential_fallback']
    });
    
    // Primary task execution
    steps.push({
      id: 'hierarchy_primary',
      type: strategy.expectedTools.length > 0 ? 'tool_execution' : 'chat',
      intent: intent.primary,
      expectedTools: strategy.expectedTools.slice(0, Math.ceil(strategy.expectedTools.length / 2)),
      priority: 'critical',
      dependencies: ['hierarchy_planning'],
      alternatives: ['direct_execution']
    });
    
    // Secondary task execution (if any)
    intent.secondary.forEach((secondaryIntent, index) => {
      steps.push({
        id: `hierarchy_secondary_${index + 1}`,
        type: 'tool_execution',
        intent: secondaryIntent,
        expectedTools: strategy.expectedTools.slice(Math.ceil(strategy.expectedTools.length / 2)),
        priority: 'normal',
        dependencies: ['hierarchy_primary'],
        alternatives: ['skip_secondary']
      });
    });
    
    // Integration and completion
    steps.push({
      id: 'hierarchy_integration',
      type: 'chat',
      intent: 'Integrate results from all subtasks and provide final response',
      priority: 'normal',
      dependencies: steps.filter(s => s.id.startsWith('hierarchy_')).map(s => s.id),
      alternatives: ['simple_completion']
    });
    
    return steps;
  }

  private createParallelSteps(intent: UserIntent, strategy: ExecutionStrategy): QuantumStep[] {
    const steps: QuantumStep[] = [];
    
    // Create parallel execution steps for each tool
    strategy.expectedTools.forEach((tool, index) => {
      steps.push({
        id: `parallel_${tool}_${index + 1}`,
        type: 'tool_execution',
        intent: `Execute ${tool} for ${intent.primary}`,
        expectedTools: [tool],
        priority: 'normal',
        dependencies: [], // Parallel execution, no dependencies
        alternatives: ['sequential_fallback']
      });
    });
    
    // Aggregation step
    steps.push({
      id: 'parallel_aggregation',
      type: 'chat',
      intent: 'Combine results from parallel executions',
      priority: 'critical',
      dependencies: steps.map(s => s.id),
      alternatives: ['direct_response']
    });
    
    return steps;
  }

  private async createAdaptiveSteps(
    intent: UserIntent, 
    strategy: ExecutionStrategy, 
    ctx: AgentContext
  ): Promise<QuantumStep[]> {
    // Start with exploration step
    const steps: QuantumStep[] = [{
      id: 'adaptive_exploration',
      type: 'chat',
      intent: 'Explore task requirements and adapt strategy dynamically',
      priority: 'critical',
      dependencies: [],
      alternatives: ['direct_execution', 'sequential_fallback']
    }];
    
    // Add conditional execution step
    steps.push({
      id: 'adaptive_execution',
      type: 'tool_execution',
      intent: 'Execute based on discovered requirements',
      expectedTools: strategy.expectedTools,
      priority: 'normal',
      dependencies: ['adaptive_exploration'],
      alternatives: ['manual_processing']
    });
    
    return steps;
  }

  // ============================================================================
  // PHASE 3: TREE-OF-THOUGHTS PLANNING & HYPOTHESIS GENERATION
  // ============================================================================

  private async generateExecutionHypotheses(
    intent: UserIntent, 
    strategy: ExecutionStrategy, 
    ctx: AgentContext
  ): Promise<ExecutionHypothesis[]> {
    const hypotheses: ExecutionHypothesis[] = [];

    // Hypothesis 1: Tool-focused approach
    if (strategy.expectedTools.length > 0) {
      hypotheses.push({
        id: 'tool_focused',
        description: 'Execute using predicted tools with minimal chat intervention',
        approach: 'direct',
        reasoning: 'Tools are available and match the task requirements',
        confidence: 0.85,
        expectedOutcome: 'Fast, reliable execution with tool results',
        riskFactors: ['Tool might fail', 'Insufficient context for tools'],
        verificationCriteria: ['Tool execution success', 'Result quality']
      });
    }

    // Hypothesis 2: Chat-guided approach
    hypotheses.push({
      id: 'chat_guided',
      description: 'Use conversational guidance to understand and execute step by step',
      approach: 'sequential',
      reasoning: 'LLM reasoning can handle complex logic and edge cases',
      confidence: 0.75,
      expectedOutcome: 'Flexible execution with good error handling',
      riskFactors: ['Higher token cost', 'Slower execution'],
      verificationCriteria: ['Response quality', 'User satisfaction']
    });

    // Hypothesis 3: Hybrid approach (for complex tasks)
    if (intent.complexity === 'complex' || intent.complexity === 'expert') {
      hypotheses.push({
        id: 'hybrid',
        description: 'Combine reasoning, tool execution, and verification',
        approach: 'hierarchical',
        reasoning: 'Complex tasks benefit from multiple approaches',
        confidence: 0.80,
        expectedOutcome: 'Comprehensive solution with high accuracy',
        riskFactors: ['Higher complexity', 'More points of failure'],
        verificationCriteria: ['Task completion', 'Result accuracy', 'Process efficiency']
      });
    }

    // Hypothesis 4: Adaptive exploration (for uncertain tasks)
    if (intent.taskType === 'unknown' || intent.constraints.some(c => c.includes('uncertain'))) {
      hypotheses.push({
        id: 'adaptive_exploration',
        description: 'Explore task requirements dynamically and adapt approach',
        approach: 'adaptive',
        reasoning: 'Uncertain tasks require flexible strategy adjustment',
        confidence: 0.70,
        expectedOutcome: 'Discovery of optimal approach through exploration',
        riskFactors: ['Unpredictable execution time', 'Possible dead ends'],
        verificationCriteria: ['Strategy convergence', 'Problem understanding']
      });
    }

    return hypotheses;
  }

  private async createHypothesisStrategy(
    hypothesis: ExecutionHypothesis, 
    intent: UserIntent, 
    ctx: AgentContext
  ): Promise<ExecutionStrategy> {
    const tools = hypothesis.id === 'tool_focused' 
      ? this.predictRequiredTools(intent, ctx)
      : hypothesis.id === 'chat_guided'
      ? []
      : this.predictRequiredTools(intent, ctx).slice(0, 1); // Limited tools for hybrid

    return {
      type: hypothesis.approach,
      reasoning: `Tree-of-Thoughts hypothesis: ${hypothesis.reasoning}`,
      expectedTools: tools,
      dependencies: await this.analyzeDependencies(intent, tools, ctx)
    };
  }

  private async decomposeHypothesis(
    hypothesis: ExecutionHypothesis, 
    strategy: ExecutionStrategy, 
    ctx: AgentContext
  ): Promise<QuantumStep[]> {
    const steps: QuantumStep[] = [];

    switch (hypothesis.id) {
      case 'tool_focused':
        steps.push({
          id: 'tool_execution',
          type: 'tool_execution',
          intent: hypothesis.expectedOutcome,
          expectedTools: strategy.expectedTools,
          priority: 'critical',
          dependencies: [],
          alternatives: ['chat_fallback']
        });
        break;

      case 'chat_guided':
        steps.push({
          id: 'reasoning_step',
          type: 'chat',
          intent: 'Analyze and reason through the problem step by step',
          priority: 'critical',
          dependencies: [],
          alternatives: ['direct_execution']
        });
        break;

      case 'hybrid':
        steps.push(
          {
            id: 'analysis_phase',
            type: 'chat',
            intent: 'Analyze problem and create execution plan',
            priority: 'critical',
            dependencies: [],
            alternatives: ['direct_start']
          },
          {
            id: 'execution_phase',
            type: 'tool_execution',
            intent: 'Execute planned approach with tools',
            expectedTools: strategy.expectedTools,
            priority: 'critical',
            dependencies: ['analysis_phase'],
            alternatives: ['manual_execution']
          },
          {
            id: 'verification_phase',
            type: 'reflection',
            intent: 'Verify results and ensure quality',
            priority: 'normal',
            dependencies: ['execution_phase'],
            alternatives: ['skip_verification']
          }
        );
        break;

      case 'adaptive_exploration':
        steps.push(
          {
            id: 'exploration',
            type: 'chat',
            intent: 'Explore and understand the problem space',
            priority: 'critical',
            dependencies: [],
            alternatives: ['direct_execution']
          },
          {
            id: 'adaptation',
            type: 'planning',
            intent: 'Adapt strategy based on discoveries',
            priority: 'critical',
            dependencies: ['exploration'],
            alternatives: ['fixed_strategy']
          }
        );
        break;
    }

    return steps;
  }

  private async createFallbackSteps(intent: UserIntent, strategy: ExecutionStrategy): Promise<QuantumStep[]> {
    return [{
      id: 'fallback_execution',
      type: strategy.type === 'direct' ? 'chat' : 'tool_execution',
      intent: `Fallback execution for: ${intent.primary}`,
      expectedTools: strategy.expectedTools.slice(0, 1), // Use fewer tools
      priority: 'critical',
      dependencies: [],
      alternatives: []
    }];
  }

  // ============================================================================
  // REAL-TIME ADAPTATION WITH TREE-OF-THOUGHTS
  // ============================================================================

  private async reviseStrategyWithToT(
    originalPlan: QuantumPlan,
    stepResult: StepResult,
    ctx: AgentContext
  ): Promise<QuantumPlan> {
    logger.debug("🌳 [QuantumPlanner] Revising strategy using Tree-of-Thoughts...");

    // Analyze what went wrong/right
    const thoughtNodes = await this.analyzeExecutionThoughts(originalPlan, stepResult);
    
    // Generate new hypotheses based on observations
    const revisedHypotheses = await this.generateRevisedHypotheses(originalPlan, stepResult, thoughtNodes);
    
    // Select best revised hypothesis
    const bestHypothesis = this.selectBestHypothesis(revisedHypotheses);
    
    // Create new plan based on revised hypothesis
    const revisedStrategy = await this.createHypothesisStrategy(bestHypothesis, originalPlan.intent, ctx);
    const revisedSteps = await this.decomposeHypothesis(bestHypothesis, revisedStrategy, ctx);
    
    return {
      intent: originalPlan.intent,
      strategy: revisedStrategy,
      steps: revisedSteps,
      alternatives: originalPlan.alternatives, // Keep original alternatives as backup
      estimatedCost: this.estimateCost(revisedSteps, []),
      confidence: Math.min(originalPlan.confidence * 0.9, bestHypothesis.confidence * 100) // Slightly lower confidence for revision
    };
  }

  private async analyzeExecutionThoughts(plan: QuantumPlan, result: StepResult): Promise<ThoughtNode[]> {
    const thoughts: ThoughtNode[] = [];
    
    if (result.error) {
      thoughts.push({
        id: 'error_analysis',
        content: `Execution failed: ${result.error}. Need to revise approach.`,
        type: 'reasoning',
        children: [],
        confidence: 0.9,
        alternatives: ['retry_same', 'different_approach', 'fallback']
      });
    }
    
    if (result.isComplete) {
      thoughts.push({
        id: 'success_analysis',
        content: 'Execution completed successfully. Strategy was effective.',
        type: 'verification',
        children: [],
        confidence: 0.95,
        alternatives: []
      });
    }
    
    return thoughts;
  }

  private async generateRevisedHypotheses(
    plan: QuantumPlan, 
    result: StepResult, 
    thoughts: ThoughtNode[]
  ): Promise<ExecutionHypothesis[]> {
    const hypotheses: ExecutionHypothesis[] = [];
    
    if (result.error) {
      // Error recovery hypotheses
      hypotheses.push({
        id: 'error_recovery',
        description: 'Simplify approach to avoid complexity that caused failure',
        approach: 'direct',
        reasoning: 'Previous approach failed, try simpler method',
        confidence: 0.7,
        expectedOutcome: 'More reliable execution with simpler approach',
        riskFactors: ['Might not handle all requirements'],
        verificationCriteria: ['No errors', 'Basic functionality']
      });
    }
    
    return hypotheses;
  }

  private selectBestHypothesis(hypotheses: ExecutionHypothesis[]): ExecutionHypothesis {
    return hypotheses.reduce((best, current) => 
      current.confidence > best.confidence ? current : best
    );
  }

  // ============================================================================
  // PLACEHOLDER METHODS (TO BE IMPLEMENTED IN NEXT PHASES)
  // ============================================================================

  private recallSimilarPattern(intent: UserIntent): ExecutionMemory | null {
    // TODO: Phase 5 - Memory & Learning
    return null;
  }

  private async generateExecutionStrategy(
    intent: UserIntent, 
    ctx: AgentContext, 
    memorizedPattern: ExecutionMemory | null
  ): Promise<ExecutionStrategy> {
    logger.debug(`🏗️ [QuantumPlanner] Generating execution strategy for: ${intent.taskType} (${intent.complexity})`);

    // Strategy selection based on HTN principles
    const strategyType = this.selectOptimalStrategy(intent, ctx);
    const expectedTools = this.predictRequiredTools(intent, ctx);
    const dependencies = await this.analyzeDependencies(intent, expectedTools, ctx);

    // Use memory if available for strategy optimization
    const reasoning = memorizedPattern 
      ? `HTN strategy optimized from similar pattern (${memorizedPattern.success_rate * 100}% success rate)`
      : `HTN strategy selected based on task complexity and available tools`;

    // Generate fallback strategy for robustness
    const fallbackStrategy = this.generateFallbackStrategy(intent, {
      type: strategyType,
      reasoning,
      expectedTools,
      dependencies
    });

    const strategy: ExecutionStrategy = {
      type: strategyType,
      reasoning,
      expectedTools,
      dependencies,
      fallbackStrategy
    };

    logger.debug(`📋 [QuantumPlanner] Strategy: ${strategyType}, Tools: ${expectedTools.join(', ')}`);
    return strategy;
  }

  private async decomposeIntoSteps(
    intent: UserIntent, 
    strategy: ExecutionStrategy, 
    ctx: AgentContext
  ): Promise<QuantumStep[]> {
    logger.debug(`🧩 [QuantumPlanner] Decomposing task using HTN principles...`);

    // HTN-inspired decomposition based on strategy type
    switch (strategy.type) {
      case 'direct':
        return this.createDirectSteps(intent, strategy);
        
      case 'sequential':
        return await this.createSequentialSteps(intent, strategy, ctx);
        
      case 'hierarchical':
        return await this.createHierarchicalSteps(intent, strategy, ctx);
        
      case 'parallel':
        return this.createParallelSteps(intent, strategy);
        
      case 'adaptive':
        return await this.createAdaptiveSteps(intent, strategy, ctx);
        
      default:
        return this.createDirectSteps(intent, strategy);
    }
  }

  private async generateAlternatives(
    intent: UserIntent, 
    strategy: ExecutionStrategy, 
    ctx: AgentContext
  ): Promise<AlternativePath[]> {
    logger.debug(`🌳 [QuantumPlanner] Generating Tree-of-Thoughts alternative paths...`);

    const alternatives: AlternativePath[] = [];

    // Generate hypothesis-based alternatives
    const hypotheses = await this.generateExecutionHypotheses(intent, strategy, ctx);
    
    for (const hypothesis of hypotheses) {
      const alternativeStrategy = await this.createHypothesisStrategy(hypothesis, intent, ctx);
      const alternativeSteps = await this.decomposeHypothesis(hypothesis, alternativeStrategy, ctx);
      
      alternatives.push({
        strategy: alternativeStrategy,
        steps: alternativeSteps,
        cost: this.estimateCost(alternativeSteps, []),
        reliability: hypothesis.confidence
      });
    }

    // Add fallback path
    if (strategy.fallbackStrategy) {
      const fallbackSteps = await this.createFallbackSteps(intent, strategy.fallbackStrategy);
      alternatives.push({
        strategy: strategy.fallbackStrategy,
        steps: fallbackSteps,
        cost: this.estimateCost(fallbackSteps, []),
        reliability: 0.9 // High reliability for simple fallback
      });
    }

    logger.debug(`🌳 [QuantumPlanner] Generated ${alternatives.length} alternative paths`);
    return alternatives;
  }

  private calculateConfidence(
    intent: UserIntent, 
    strategy: ExecutionStrategy, 
    memorizedPattern: ExecutionMemory | null
  ): number {
    // TODO: Implement confidence calculation
    return 85; // Placeholder
  }

  private estimateCost(steps: QuantumStep[], alternatives: AlternativePath[]): number {
    // TODO: Implement cost estimation
    return steps.length;
  }

  private learnFromSuccess(plan: QuantumPlan, ctx: AgentContext): void {
    // TODO: Phase 5 - Learning
    logger.debug("📚 [QuantumPlanner] Learning from successful execution");
  }

  private async healFromFailure(
    plan: QuantumPlan, 
    stepResult: StepResult, 
    ctx: AgentContext
  ): Promise<QuantumPlan> {
    logger.warn("🛡️ [QuantumPlanner] Attempting to heal from failure using Tree-of-Thoughts");
    
    // Use Tree-of-Thoughts to revise strategy based on failure
    try {
      const revisedPlan = await this.reviseStrategyWithToT(plan, stepResult, ctx);
      logger.info("🌳 [QuantumPlanner] Successfully revised plan using Tree-of-Thoughts");
      return revisedPlan;
    } catch (error) {
      logger.error(`❌ [QuantumPlanner] Tree-of-Thoughts revision failed: ${error}`);
      
      // Fallback to simple recovery
      return this.createSimpleRecoveryPlan(plan, ctx);
    }
  }

  private createSimpleRecoveryPlan(plan: QuantumPlan, ctx: AgentContext): QuantumPlan {
    // Simple fallback: try with just chat, no tools
    return {
      intent: plan.intent,
      strategy: {
        type: 'direct',
        reasoning: 'Simple recovery after failure - use chat only',
        expectedTools: [],
        dependencies: []
      },
      steps: [{
        id: 'recovery_chat',
        type: 'chat',
        intent: `Recovery attempt for: ${plan.intent.primary}`,
        priority: 'critical',
        dependencies: [],
        alternatives: []
      }],
      alternatives: [],
      estimatedCost: 1,
      confidence: 60 // Lower confidence for recovery
    };
  }

  private async continueExecution(
    plan: QuantumPlan, 
    stepResult: StepResult, 
    ctx: AgentContext
  ): Promise<QuantumPlan> {
    // TODO: Implement execution continuation
    return plan;
  }

  private createCompletionPlan(): QuantumPlan {
    return {
      intent: this.createDefaultIntent(),
      strategy: {
        type: 'direct',
        reasoning: "Task completed",
        expectedTools: [],
        dependencies: []
      },
      steps: [{
        id: 'completion',
        type: 'completion',
        intent: "Task completed successfully",
        priority: 'normal',
        dependencies: [],
        alternatives: []
      }],
      alternatives: [],
      estimatedCost: 0,
      confidence: 100
    };
  }
}