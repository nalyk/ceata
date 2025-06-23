// Multi-Agent System Exports
// Main entry point for the multi-agent architecture

export { DualModeCoordinator } from './DualModeCoordinator.js';
export { SpecializedAgent } from './SpecializedAgent.js';
export { AgentRegistry, AgentHealth } from './AgentRegistry.js';
export { UDPAgentSystem } from './UDPAgentSystem.js';
export { OrchestraRouter } from './OrchestraRouter.js';
export { CircuitBreaker, CircuitState } from './CircuitBreaker.js';

export {
  AgentCapabilities,
  MoldovaContext,
  SpecializationLevel,
  TaskMatch,
  TaskResult,
  AgentOptions,
  ProviderStrategy,
  TaskComplexity,
  TaskClassification,
  ExecutionContext,
  CoordinationOptions
} from './AgentCapabilities.js';

// Quick start function for Moldova context
import { AgentRegistry } from './AgentRegistry.js';
import { DualModeCoordinator } from './DualModeCoordinator.js';

export function createMoldovaMultiAgentSystem() {
  const registry = new AgentRegistry();
  const agents = registry.getAllAgents();
  const coordinator = new DualModeCoordinator(agents);
  
  return {
    coordinator,
    registry,
    agents
  };
}

// Version info
export const MULTI_AGENT_VERSION = '1.0.0';
export const MOLDOVA_OPTIMIZATION = true;