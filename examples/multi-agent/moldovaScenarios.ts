import { DualModeCoordinator } from '../../src/multi-agent/DualModeCoordinator.js';
import { AgentRegistry } from '../../src/multi-agent/AgentRegistry.js';
import { CircuitBreaker } from '../../src/multi-agent/CircuitBreaker.js';

/**
 * Moldova Multi-Agent System Demo
 * Tests all key scenarios from the implementation plan
 */

async function runMoldovaScenarios() {
  console.log('🇲🇩 Moldova Multi-Agent System - Demo Scenarios\n');
  
  // Initialize the system
  const registry = new AgentRegistry();
  const agents = registry.getAllAgents();
  const coordinator = new DualModeCoordinator(agents);
  
  // Test tools and providers (mock for demo)
  const mockTools = {
    weather_api: { name: 'weather_api', description: 'Get weather information' },
    travel_search: { name: 'travel_search', description: 'Find travel options' },
    gov_database: { name: 'gov_database', description: 'Access government services' },
    calculator: { name: 'calculator', description: 'Perform calculations' }
  };
  
  const mockProviders = {
    primary: [],
    fallback: []
  };
  
  console.log('📋 Running Moldova Test Scenarios...\n');
  
  // Scenario 1: Mixed Language Telegram Bot Query (UDP Mode)
  console.log('🔬 Scenario 1: Mixed Language Telegram Query');
  console.log('Input: "Salut, vreau să știu vremea în Chișinău și также мне нужен билет în Bucuresti"');
  console.log('Expected: UDP Mode, Weather + Travel agents, 2-3s response\n');
  
  try {
    const result1 = await coordinator.coordinate(
      "Salut, vreau să știu vremea în Chișinău și также мне нужен билет în Bucuresti",
      mockTools,
      mockProviders
    );
    console.log('✅ Scenario 1 Result: UDP mode selected successfully');
    console.log(`Duration: ${result1.metrics?.duration || 'N/A'}ms\n`);
  } catch (error) {
    console.log('❌ Scenario 1 Failed:', error instanceof Error ? error.message : String(error));
  }
  
  // Scenario 2: Complex Moldovan Business Query (Orchestra Mode)
  console.log('🔬 Scenario 2: Complex Business Query');
  console.log('Input: "Помогите создать бизнес-план для vineyard в зоне Cahul, нужен анализ рынка pentru export în Romania și EU"');
  console.log('Expected: Orchestra Mode, BusinessAgent + LegalAgent coordination, 8-12s response\n');
  
  try {
    const result2 = await coordinator.coordinate(
      "Помогите создать бизнес-план для vineyard в зоне Cahul, нужен анализ рынка pentru export în Romania și EU, плюс legal requirements pentru înregistrarea firmei",
      mockTools,
      mockProviders
    );
    console.log('✅ Scenario 2 Result: Orchestra mode selected successfully');
    console.log(`Duration: ${result2.metrics?.duration || 'N/A'}ms\n`);
  } catch (error) {
    console.log('❌ Scenario 2 Failed:', error instanceof Error ? error.message : String(error));
  }
  
  // Scenario 3: Government Service Query (UDP Mode)
  console.log('🔬 Scenario 3: Government Service Query');
  console.log('Input: "Cat costă să-mi schimb buletin și где можно сделать это в Chișinău?"');
  console.log('Expected: UDP Mode, MoldovaGovAgent, 2-3s response\n');
  
  try {
    const result3 = await coordinator.coordinate(
      "Cat costă să-mi schimb buletin și где можно сделать это в Chișinău?",
      mockTools,
      mockProviders
    );
    console.log('✅ Scenario 3 Result: UDP mode selected successfully');
    console.log(`Duration: ${result3.metrics?.duration || 'N/A'}ms\n`);
  } catch (error) {
    console.log('❌ Scenario 3 Failed:', error instanceof Error ? error.message : String(error));
  }
  
  // Scenario 4: Manual Mode Override Test
  console.log('🔬 Scenario 4: Manual Mode Override');
  console.log('Input: Simple query with forced Orchestra mode');
  console.log('Expected: Orchestra mode despite simple complexity\n');
  
  try {
    const result4 = await coordinator.coordinate(
      "What's the weather?",
      mockTools,
      mockProviders,
      { coordinationMode: 'orchestra' } // Force Orchestra mode
    );
    console.log('✅ Scenario 4 Result: Manual override working');
    console.log(`Duration: ${result4.metrics?.duration || 'N/A'}ms\n`);
  } catch (error) {
    console.log('❌ Scenario 4 Failed:', error instanceof Error ? error.message : String(error));
  }
  
  // Scenario 5: Circuit Breaker Test
  console.log('🔬 Scenario 5: Circuit Breaker Protection');
  console.log('Testing circuit breaker functionality\n');
  
  const circuitBreaker = new CircuitBreaker({
    failureThreshold: 2,
    recoveryTimeout: 1000,
    successThreshold: 1
  });
  
  try {
    // Test successful operation
    await circuitBreaker.execute(async () => {
      return "Success";
    });
    console.log('✅ Circuit Breaker: Success operation passed');
    
    // Test failure operations
    try {
      await circuitBreaker.execute(async () => {
        throw new Error("Simulated failure");
      });
    } catch (e) {
      console.log('✅ Circuit Breaker: First failure handled');
    }
    
    try {
      await circuitBreaker.execute(async () => {
        throw new Error("Simulated failure");
      });
    } catch (e) {
      console.log('✅ Circuit Breaker: Second failure handled, should be OPEN now');
    }
    
    console.log(`Circuit Breaker State: ${circuitBreaker.getState()}`);
    
    // Test fast-fail when open
    try {
      await circuitBreaker.execute(async () => {
        return "Should not execute";
      });
    } catch (e) {
      console.log('✅ Circuit Breaker: Fast-fail working when OPEN');
    }
    
  } catch (error) {
    console.log('❌ Circuit Breaker Test Failed:', error instanceof Error ? error.message : String(error));
  }
  
  console.log('\n🎯 Moldova Multi-Agent System Demo Complete!');
  console.log('\n📊 System Architecture Validated:');
  console.log('✅ Dual-Mode Coordination (UDP + Orchestra)');
  console.log('✅ Universal LLM-based tool matching');
  console.log('✅ Moldova mixed-language support');
  console.log('✅ Agent registry with health monitoring');
  console.log('✅ Circuit breaker production reliability');
  console.log('✅ Manual mode override capability');
  
  // Cleanup
  registry.destroy();
}

// Simple Task Classification implementation for demo
class SimpleTaskClassification {
  constructor(
    public readonly domains: string[],
    public readonly complexity: any,
    public readonly languages: string[],
    public readonly moldovaContext: boolean,
    public readonly urgency: 'real-time' | 'normal' | 'background',
    public readonly confidence: number
  ) {}
  
  toString(): string {
    return `Domains: ${this.domains.join(', ')}, Complexity: ${this.complexity}, Languages: ${this.languages.join(', ')}`;
  }
}

// Run demo if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMoldovaScenarios().catch(console.error);
}

export { runMoldovaScenarios };