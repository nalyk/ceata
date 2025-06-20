/**
 * CEATA MONSTER EFFICIENCY - Planner
 * Ultra-fast planning engine for agentic workflows
 */

import { AgentContext, StepResult } from "./AgentContext.js";
import { ChatMessage } from "./Provider.js";

export interface Plan {
  readonly steps: PlanStep[];
  readonly estimatedCost: number;
  readonly strategy: PlanStrategy;
}

export interface PlanStep {
  readonly type: StepType;
  readonly message?: ChatMessage;
  readonly expectedToolCalls?: string[];
  readonly priority: StepPriority;
}

export type StepType = 'chat' | 'tool_execution' | 'reflection' | 'completion';
export type StepPriority = 'critical' | 'normal' | 'optional';
export type PlanStrategy = 'direct' | 'iterative' | 'parallel_tools' | 'reflection_enhanced' | 'tool_then_chat';

export class Planner {
  /**
   * Creates an optimized execution plan based on context
   */
  plan(ctx: AgentContext): Plan {
    const lastMessage = ctx.messages[ctx.messages.length - 1];
    
    if (!lastMessage || lastMessage.role !== 'user') {
      return this.createCompletionPlan();
    }

    // Analyze if we need tools
    const potentialTools = this.analyzeToolNeed(lastMessage.content || '', ctx.tools);
    
    if (potentialTools.length > 0) {
      return this.createToolPlan(potentialTools);
    }
    
    // Simple chat response
    return this.createChatPlan();
  }

  /**
   * Analyzes message content to predict tool usage
   * This is a lightweight heuristic - no LLM calls needed
   */
  private analyzeToolNeed(content: string, tools: Record<string, any>): string[] {
    const toolNames = Object.keys(tools);
    const potentialTools: string[] = [];
    
    // Simple keyword matching for common patterns
    const lowerContent = content.toLowerCase();
    
    for (const toolName of toolNames) {
      const tool = tools[toolName];
      const description = tool.schema?.description?.toLowerCase() || '';
      
      // Check if tool name or description keywords appear in message
      if (lowerContent.includes(toolName.toLowerCase()) ||
          this.hasDescriptionKeywords(lowerContent, description)) {
        potentialTools.push(toolName);
      }
    }
    
    // Mathematical operation detection
    if (/\b(add|sum|plus|calculate|compute|multiply|divide|subtract)\b/.test(lowerContent) ||
        /[\d\s+\-*/()=]+/.test(content)) {
      const mathTools = toolNames.filter(name => 
        /^(add|subtract|multiply|divide|calculate|math)/.test(name.toLowerCase())
      );
      potentialTools.push(...mathTools);
    }
    
    return [...new Set(potentialTools)]; // Deduplicate
  }

  private hasDescriptionKeywords(content: string, description: string): boolean {
    if (!description) return false;
    
    // Extract key action words from description
    const actionWords = description.match(/\b(calculate|compute|add|get|fetch|find|search|convert|format)\b/g);
    if (!actionWords) return false;
    
    return actionWords.some(word => content.includes(word));
  }

  private createChatPlan(): Plan {
    return {
      steps: [{
        type: 'chat',
        priority: 'normal'
      }],
      estimatedCost: 1, // 1 API call
      strategy: 'direct'
    };
  }

  private createToolPlan(expectedTools: string[]): Plan {
    const steps: PlanStep[] = [
      {
        type: 'chat',
        expectedToolCalls: expectedTools,
        priority: 'critical'
      }
    ];

    // Add tool execution steps
    for (const tool of expectedTools) {
      steps.push({
        type: 'tool_execution',
        priority: 'critical'
      });
    }

    // Add final response step
    steps.push({
      type: 'chat',
      priority: 'normal'
    });

    return {
      steps,
      estimatedCost: steps.length,
      strategy: expectedTools.length > 1 ? 'parallel_tools' : 'iterative'
    };
  }

  private createCompletionPlan(): Plan {
    return {
      steps: [{
        type: 'completion',
        priority: 'normal'
      }],
      estimatedCost: 0,
      strategy: 'direct'
    };
  }

  /**
   * Updates plan based on execution results
   */
  adaptPlan(originalPlan: Plan, stepResult: StepResult, ctx: AgentContext): Plan {
    if (stepResult.isComplete) {
      return {
        steps: [{ type: 'completion', priority: 'normal' }],
        estimatedCost: 0,
        strategy: 'direct'
      };
    }

    // If we have an error, try a simpler approach
    if (stepResult.error) {
      return {
        steps: [{ type: 'chat', priority: 'critical' }],
        estimatedCost: 1,
        strategy: 'direct'
      };
    }

    // Check if the last message has tool calls that need execution
    const lastMessage = ctx.messages[ctx.messages.length - 1];
    if (lastMessage?.tool_calls?.length && !stepResult.isComplete) {
      // Add tool execution step followed by chat to process results
      return {
        steps: [
          { type: 'tool_execution', priority: 'critical' },
          { type: 'chat', priority: 'normal' }
        ],
        estimatedCost: 2,
        strategy: 'tool_then_chat'
      };
    }

    // Continue with remaining steps
    return {
      ...originalPlan,
      steps: originalPlan.steps.slice(1) // Remove completed step
    };
  }
}