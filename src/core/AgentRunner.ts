/**
 * CEATA Unified Agent Interface
 * Single clean interface powered by pipeline architecture
 */

import { ChatMessage, Tool, Provider } from "./Provider.js";
import { ConversationAgent, ProviderGroup } from "./ConversationAgent.js";
import { AgentOptions } from "./AgentContext.js";

// Re-export for legacy compatibility
export type { AgentOptions };
import { logger } from "./logger.js";

// Legacy provider configuration interface for backwards compatibility
export interface ProviderConfig {
  p: Provider;
  model: string;
  priority: "primary" | "fallback";
  timeoutMs?: number;
  stream?: boolean;
}

// Provider health tracking for legacy compatibility
export class ProviderCache {
  private healthMap = new Map<string, any>();
  
  markSuccess(provider: any): void {
    // Legacy compatibility - no-op in pipeline architecture
  }
  
  markFailure(provider: any): void {
    // Legacy compatibility - no-op in pipeline architecture
  }
  
  getPreferredProvider(): any {
    // Legacy compatibility - returns null
    return null;
  }
  
  filterHealthyProviders(providers: any[]): any[] {
    // Legacy compatibility - returns all
    return providers;
  }
  
  getHealthReport(): Record<string, any> {
    return {};
  }
}

/**
 * UNIFIED AGENT INTERFACE - Powered by Pipeline Architecture
 * Maintains 100% backwards compatibility while delivering maximum efficiency
 */

// Legacy overload signatures for backwards compatibility
export async function runAgent(
  messages: ChatMessage[],
  tools: Record<string, Tool<any, any>>,
  providers: ProviderConfig[],
  maxSteps?: number,
  timeoutMs?: number,
  providerCache?: ProviderCache,
): Promise<ChatMessage[]>;

export async function runAgent(
  messages: ChatMessage[],
  tools: Record<string, Tool<any, any>>,
  providers: ProviderConfig[],
  options?: Partial<AgentOptions>,
): Promise<ChatMessage[]>;

export async function runAgent(
  messages: ChatMessage[],
  tools: Record<string, Tool<any, any>>,
  providers: ProviderConfig[],
  maxStepsOrOptions: number | Partial<AgentOptions> = 8,
  timeoutMs?: number,
  providerCache?: ProviderCache,
): Promise<ChatMessage[]> {
  // Convert legacy parameters to pipeline options
  let options: Partial<AgentOptions>;
  if (typeof maxStepsOrOptions === 'number') {
    options = {
      maxSteps: maxStepsOrOptions,
      timeoutMs,
      maxHistoryLength: 50,
      preserveSystemMessages: true,
      enableRacing: true, // Enable concurrent execution by default
    };
  } else {
    options = {
      maxSteps: 8,
      maxHistoryLength: 50,
      preserveSystemMessages: true,
      enableRacing: true, // Enable concurrent execution by default
      ...maxStepsOrOptions,
    };
  }

  // Convert legacy ProviderConfig[] to ProviderGroup for pipeline
  let primary = providers
    .filter(pc => pc.priority === "primary")
    .map(pc => pc.p);
  let fallback = providers
    .filter(pc => pc.priority === "fallback")
    .map(pc => pc.p);
  
  // Create provider models mapping
  const providerModels: Record<string, string> = {};
  providers.forEach(pc => {
    providerModels[pc.p.id] = pc.model;
  });

  // If no explicit primary/fallback, use smart defaults
  if (primary.length === 0 && fallback.length === 0) {
    primary = providers
      .filter(pc => pc.p.id.includes('free') || pc.p.id === 'google')
      .map(pc => pc.p);
    fallback = providers
      .filter(pc => !pc.p.id.includes('free') && pc.p.id !== 'google')
      .map(pc => pc.p);
    
    // If still empty, put all in primary
    if (primary.length === 0) {
      primary = providers.map(pc => pc.p);
    }
  }

  const providerGroup: ProviderGroup = { primary, fallback };

  // Execute with pipeline architecture
  const agent = new ConversationAgent();
  const result = await agent.run(messages, tools, providerGroup, options, providerModels);
  
  // Log performance metrics (legacy format for compatibility)
  logger.info(`🔄 Pipeline execution: ${result.metrics.duration}ms, ${result.metrics.efficiency.toFixed(2)} ops/sec, $${result.metrics.costSavings.toFixed(4)} saved`);
  
  return result.messages;
}

/**
 * Legacy utility function for parsing JSON from LLM responses
 * Kept for backwards compatibility with existing tests
 */
export function tryParseJson(text: string): any {
  try {
    // Try to parse as direct JSON first
    return JSON.parse(text);
  } catch {
    // Check for TOOL_CALL format first (for vanilla tool calling)
    const toolCallMatch = text.match(/TOOL_CALL:\s*\{/);
    if (toolCallMatch) {
      try {
        const startIndex = toolCallMatch.index! + toolCallMatch[0].length - 1; // Include the opening brace
        let braceCount = 0;
        let jsonStr = '';
        
        for (let i = startIndex; i < text.length; i++) {
          const char = text[i];
          jsonStr += char;
          
          if (char === '{') {
            braceCount++;
          } else if (char === '}') {
            braceCount--;
            if (braceCount === 0) {
              break;
            }
          }
        }
        
        return JSON.parse(jsonStr);
      } catch {
        return null;
      }
    }
    
    // Look for fenced JSON blocks
    const jsonMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch {
        // Fall back to basic extraction
        const cleanText = jsonMatch[1].trim()
          .replace(/^[^{[]*/, '') // Remove leading non-JSON
          .replace(/[^}\]]*$/, ''); // Remove trailing non-JSON
        
        try {
          return JSON.parse(cleanText);
        } catch {
          return null;
        }
      }
    }
    
    // Try to extract JSON from unfenced text
    const braceMatch = text.match(/\{[\s\S]*\}/);
    if (braceMatch) {
      try {
        return JSON.parse(braceMatch[0]);
      } catch {
        return null;
      }
    }
    
    return null;
  }
}