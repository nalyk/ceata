import { SpecializedAgent } from './SpecializedAgent.js';

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