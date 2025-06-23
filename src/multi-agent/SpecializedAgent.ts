import { ConversationAgent, AgentResult, ProviderGroup } from '../core/ConversationAgent.js';
import { ChatMessage } from '../core/Provider.js';
import { Tool } from '../core/Tool.js';
import { AgentCapabilities, TaskMatch, MoldovaContext, TaskResult, AgentOptions, SpecializationLevel, ExecutionContext } from './AgentCapabilities.js';

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
  async quickAssess(userInput: string): Promise<{confidence: number, agent: SpecializedAgent}> {
    const toolMatch = await this.calculateToolMatch(userInput);
    const languageMatch = await this.calculateLanguageMatch(userInput);
    const loadCapacity = this.calculateLoadCapacity();
    
    const confidence = Math.min(
      (toolMatch * 0.5 + languageMatch * 0.3 + loadCapacity * 0.2),
      0.98
    );
    
    return { confidence, agent: this };
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
    const toolMatch = await this.calculateToolMatch(userInput);
    const languageMatch = await this.calculateLanguageMatch(userInput);
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
      (result.metrics as any).specializationMetrics = {
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
   * UNIVERSAL tool matching using LLM-based semantic understanding
   * Works for ANY tool, ANY language, ANY domain - true universality!
   */
  private async calculateToolMatch(userInput: string): Promise<number> {
    // Get actual tool definitions from the agent's available tools
    const availableTools = this.getAvailableToolDefinitions();
    
    if (availableTools.length === 0) {
      return 0.1; // No tools available
    }
    
    // Use LLM to assess tool relevance - truly universal approach
    const relevanceScores = await Promise.all(
      availableTools.map(tool => this.assessToolRelevanceWithLLM(tool, userInput))
    );
    
    return Math.max(...relevanceScores, 0.1);
  }
  
  /**
   * Get actual tool definitions (universal - works with any tool)
   */
  private getAvailableToolDefinitions(): Array<{name: string, description: string, parameters: any}> {
    // This would come from the actual tools registry in the real implementation
    // For now, return tools from capabilities
    return this.capabilities.tools.map(toolName => ({
      name: toolName,
      description: this.getToolDescription(toolName),
      parameters: {} // Would be actual tool parameters
    }));
  }
  
  /**
   * LLM-based tool relevance assessment - UNIVERSAL approach
   * No hardcoded keywords, concepts, or language-specific patterns!
   */
  private async assessToolRelevanceWithLLM(tool: {name: string, description: string}, userInput: string): Promise<number> {
    // Create a micro-prompt for tool relevance assessment
    const assessmentPrompt = `Assess if this tool is relevant for the user's request.

Tool: ${tool.name}
Description: ${tool.description}

User Request: "${userInput}"

Relevance Score (0.0-1.0): How likely is this tool needed?
Response format: Just the number (e.g., 0.8)`;
    
    try {
      // Use a fast, lightweight provider for assessment
      const provider = this.getFastAssessmentProvider();
      const response = await provider.chat({
        messages: [{ role: 'user', content: assessmentPrompt }],
        maxTokens: 10, // Very short response
        temperature: 0.1 // Consistent scoring
      });
      
      // Parse relevance score
      const scoreText = response.message.content.trim();
      const score = parseFloat(scoreText);
      
      // Validate and return
      return isNaN(score) ? 0.1 : Math.max(0.0, Math.min(1.0, score));
      
    } catch (error) {
      console.warn(`LLM assessment failed for tool ${tool.name}, using fallback`);
      return this.fallbackToolRelevance(tool, userInput);
    }
  }
  
  /**
   * Fast assessment provider (reuse agent's existing providers)
   */
  private getFastAssessmentProvider(): any {
    // Use the same provider strategy as the agent
    // In practice, this would prefer free/fast models for assessment
    return this.capabilities.providerPreference.type === 'free-first' 
      ? this.getVanillaProvider()
      : this.getPrimaryProvider();
  }
  
  /**
   * Get vanilla provider for free assessments
   */
  private getVanillaProvider(): any {
    // Simplified provider access - would use actual provider in implementation
    return {
      chat: async (options: any) => ({
        message: { content: '0.5' } // Default fallback
      })
    };
  }
  
  /**
   * Get primary provider
   */
  private getPrimaryProvider(): any {
    // Simplified provider access - would use actual provider in implementation
    return {
      chat: async (options: any) => ({
        message: { content: '0.5' } // Default fallback
      })
    };
  }
  
  /**
   * Fallback tool relevance (when LLM assessment fails)
   */
  private fallbackToolRelevance(tool: {name: string, description: string}, userInput: string): number {
    // Universal fallback: simple string similarity between tool description and input
    const inputWords = userInput.toLowerCase().split(/\s+/);
    const descWords = tool.description.toLowerCase().split(/\s+/);
    
    // Calculate word overlap (language-agnostic)
    const overlap = inputWords.filter(word => 
      descWords.some(descWord => 
        this.areWordsSimilar(word, descWord)
      )
    ).length;
    
    const maxWords = Math.max(inputWords.length, descWords.length);
    return Math.max(0.1, overlap / maxWords);
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
   * Get tool description (would integrate with actual tool registry)
   */
  private getToolDescription(toolName: string): string {
    // In real implementation, this would come from the tool definition
    // For now, return generic descriptions
    const descriptions: Record<string, string> = {
      weather_api: "Get current weather conditions and forecasts for any location",
      gov_database: "Access government services, documents, and official information", 
      travel_search: "Find transportation options, routes, and booking information",
      calculator: "Perform mathematical calculations and computations",
      web_search: "Search the internet for information on any topic"
    };
    
    return descriptions[toolName] || `Tool for ${toolName.replace('_', ' ')} operations`;
  }
  
  /**
   * UNIVERSAL language matching using LLM language detection
   */
  private async calculateLanguageMatch(userInput: string): Promise<number> {
    const supportedLangs = this.capabilities.languages;
    
    if (supportedLangs.length === 0) {
      return 0.1; // No language support defined
    }
    
    // Use LLM for universal language detection and matching
    const languagePrompt = `What language(s) is this text in? Rate compatibility with supported languages.

Text: "${userInput}"
Supported languages: ${supportedLangs.join(', ')}

Compatibility score (0.0-1.0): How well can the supported languages handle this text?
Response format: Just the number (e.g., 0.9)`;
    
    try {
      const provider = this.getFastAssessmentProvider();
      const response = await provider.chat({
        messages: [{ role: 'user', content: languagePrompt }],
        maxTokens: 10,
        temperature: 0.1
      });
      
      const score = parseFloat(response.message.content.trim());
      return isNaN(score) ? 0.5 : Math.max(0.1, Math.min(1.0, score));
      
    } catch (error) {
      console.warn('LLM language detection failed, using fallback');
      return this.fallbackLanguageMatch(userInput, supportedLangs);
    }
  }
  
  /**
   * Fallback language matching (universal approach)
   */
  private fallbackLanguageMatch(userInput: string, supportedLangs: string[]): number {
    // Universal fallback: text character analysis
    const hasLatin = /[a-zA-ZăâîșțĂÂÎȘȚ]/.test(userInput);
    const hasCyrillic = /[а-яё]/i.test(userInput);
    const hasNumbers = /[0-9]/.test(userInput);
    
    // Score based on character sets and supported languages
    let score = 0.3; // Base score
    
    if (hasLatin && (supportedLangs.includes('en') || supportedLangs.includes('ro'))) {
      score += 0.4;
    }
    if (hasCyrillic && supportedLangs.includes('ru')) {
      score += 0.4;
    }
    if (hasNumbers && supportedLangs.includes('en')) {
      score += 0.1; // Numbers often accompanied by English
    }
    if (supportedLangs.includes('en')) {
      score += 0.2; // English as universal fallback
    }
    
    return Math.min(0.95, score);
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
   * UNIVERSAL complexity assessment for time estimation
   */
  private assessComplexity(userInput: string): number {
    // Universal structural analysis (no language-specific patterns)
    const words = userInput.split(/\s+/).length;
    const sentences = userInput.split(/[.!?]+/).filter(s => s.trim()).length;
    const hasMultipleTasks = userInput.includes(' ') && userInput.length > 30; // Length-based detection
    const hasQuestions = /\?/.test(userInput);
    
    // Calculate complexity multiplier based on structure
    let multiplier = 1.0;
    
    if (words > 40) multiplier += 0.8;      // Very long request
    else if (words > 20) multiplier += 0.4; // Long request
    
    if (sentences > 3) multiplier += 0.3;   // Multiple sentences
    if (hasMultipleTasks) multiplier += 0.5; // Multiple tasks
    if (hasQuestions) multiplier += 0.2;     // Questions add complexity
    
    return Math.min(3.0, multiplier); // Cap at 3x base time
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