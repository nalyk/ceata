import { ConversationAgent } from '../core/ConversationAgent.js';
import { SpecializedAgent } from './SpecializedAgent.js';
import { UDPAgentSystem } from './UDPAgentSystem.js';
import { OrchestraRouter } from './OrchestraRouter.js';
import { CoordinationOptions, TaskComplexity } from './AgentCapabilities.js';

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
    const mode = await this.selectMode(userInput, options);
    
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
  private async selectMode(userInput: string, options: CoordinationOptions): Promise<'udp' | 'orchestra'> {
    // Manual override takes priority
    if (options.coordinationMode && options.coordinationMode !== 'auto') {
      return options.coordinationMode;
    }
    
    // Automatic mode selection based on complexity
    const complexity = await this.detectComplexity(userInput);
    const domainCount = await this.countDomains(userInput);
    
    // Orchestra mode for complex multi-domain tasks
    if (complexity === TaskComplexity.COMPLEX || domainCount > 2) {
      return 'orchestra';
    }
    
    // UDP mode for simple/medium single-domain tasks
    return 'udp';
  }
  
  /**
   * UNIVERSAL complexity detection using text analysis
   */
  private async detectComplexity(userInput: string): Promise<TaskComplexity> {
    // Use LLM for universal complexity assessment
    const complexityPrompt = `Rate the complexity of this request on a scale:

SIMPLE: Single straightforward task
MEDIUM: Multiple related tasks or some coordination needed
COMPLEX: Multiple complex tasks requiring extensive coordination

Request: "${userInput}"

Complexity level (SIMPLE/MEDIUM/COMPLEX):`;
    
    try {
      // Use lightweight LLM assessment
      const response = await this.assessWithLLM(complexityPrompt, { maxTokens: 10 });
      const complexity = response.trim().toUpperCase();
      
      if (complexity.includes('COMPLEX')) return TaskComplexity.COMPLEX;
      if (complexity.includes('MEDIUM')) return TaskComplexity.MEDIUM;
      return TaskComplexity.SIMPLE;
      
    } catch (error) {
      console.warn('LLM complexity assessment failed, using universal heuristics');
      return this.fallbackComplexityDetection(userInput);
    }
  }
  
  /**
   * Universal fallback complexity detection (language-agnostic)
   */
  private fallbackComplexityDetection(userInput: string): TaskComplexity {
    const words = userInput.split(/\s+/).length;
    const sentences = userInput.split(/[.!?]+/).length;
    const hasMultipleQuestions = (userInput.match(/\?/g) || []).length > 1;
    const hasConjunctions = userInput.split(/\s+/).length > 15; // Structure-based detection
    
    // Universal complexity scoring based on structure, not content
    let complexityScore = 0;
    
    if (words > 30) complexityScore += 2;
    else if (words > 15) complexityScore += 1;
    
    if (sentences > 3) complexityScore += 1;
    if (hasMultipleQuestions) complexityScore += 1;
    if (hasConjunctions) complexityScore += 1;
    
    if (complexityScore >= 3) return TaskComplexity.COMPLEX;
    if (complexityScore >= 1) return TaskComplexity.MEDIUM;
    return TaskComplexity.SIMPLE;
  }
  
  /**
   * Helper method for LLM assessment (would be implemented by agent)
   */
  private async assessWithLLM(prompt: string, options: { maxTokens: number }): Promise<string> {
    // This would use the agent's provider in real implementation
    // For now, throw to force fallback
    throw new Error('LLM assessment not available in demo');
  }
  
  /**
   * UNIVERSAL domain counting using agent capabilities analysis
   */
  private async countDomains(userInput: string): Promise<number> {
    // Get domains from actual agent capabilities (truly universal)
    const availableDomains = Array.from(new Set(
      this.agents.flatMap(agent => agent.getCapabilities().domains)
    ));
    
    if (availableDomains.length === 0) {
      return 1; // At least one domain (general)
    }
    
    // Use LLM to assess domain relevance (works for ANY domain)
    const domainRelevancePrompt = `How many of these domains are relevant for this request?

Available domains: ${availableDomains.join(', ')}
User request: "${userInput}"

Count the domains that are clearly relevant.
Response format: Just the number (e.g., 2)`;
    
    try {
      const provider = this.getFastAssessmentProvider();
      const response = await provider.chat({
        messages: [{ role: 'user', content: domainRelevancePrompt }],
        maxTokens: 5,
        temperature: 0.1
      });
      
      const count = parseInt(response.message.content.trim());
      return isNaN(count) ? 1 : Math.max(1, Math.min(availableDomains.length, count));
      
    } catch (error) {
      console.warn('LLM domain counting failed, using fallback');
      return this.fallbackDomainCount(userInput, availableDomains);
    }
  }
  
  /**
   * Fallback domain counting (when LLM fails)
   */
  private fallbackDomainCount(userInput: string, domains: string[]): number {
    // Universal approach: check word overlap with domain names
    const inputWords = userInput.toLowerCase().split(/\s+/);
    
    const relevantDomains = domains.filter(domain => 
      inputWords.some(word => 
        this.areWordsSimilar(word, domain.toLowerCase())
      )
    );
    
    return Math.max(1, relevantDomains.length);
  }
  
  /**
   * Universal word similarity (works across languages)
   */
  private areWordsSimilar(word1: string, word2: string): boolean {
    // Universal similarity checks:
    if (word1 === word2) return true; // Exact match
    if (word1.includes(word2) || word2.includes(word1)) return true; // Substring
    if (this.levenshteinDistance(word1, word2) <= 2) return true; // Close spelling
    
    return false;
  }
  
  /**
   * Levenshtein distance for fuzzy matching (universal)
   */
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = Array(str2.length + 1).fill(null).map(() => 
      Array(str1.length + 1).fill(null)
    );
    
    for (let i = 0; i <= str1.length; i++) matrix[0][i] = i;
    for (let j = 0; j <= str2.length; j++) matrix[j][0] = j;
    
    for (let j = 1; j <= str2.length; j++) {
      for (let i = 1; i <= str1.length; i++) {
        const indicator = str1[i - 1] === str2[j - 1] ? 0 : 1;
        matrix[j][i] = Math.min(
          matrix[j][i - 1] + 1,     // deletion
          matrix[j - 1][i] + 1,     // insertion
          matrix[j - 1][i - 1] + indicator // substitution
        );
      }
    }
    
    return matrix[str2.length][str1.length];
  }
  
  /**
   * Get fast assessment provider
   */
  private getFastAssessmentProvider(): any {
    // Simplified provider access - would use actual provider in implementation
    return {
      chat: async (options: any) => ({
        message: { content: '1' } // Default fallback
      })
    };
  }
}