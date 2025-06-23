import { SpecializedAgent } from './SpecializedAgent.js';
import { SpecializationLevel } from './AgentCapabilities.js';
export var AgentHealth;
(function (AgentHealth) {
    AgentHealth["HEALTHY"] = "healthy";
    AgentHealth["DEGRADED"] = "degraded";
    AgentHealth["UNAVAILABLE"] = "unavailable";
})(AgentHealth || (AgentHealth = {}));
export class AgentRegistry {
    constructor() {
        this.agents = new Map();
        this.healthCheckInterval = null;
        this.startHealthChecking();
        this.initializeDefaultAgents();
    }
    /**
     * Register a specialized agent
     */
    registerAgent(agent) {
        const capabilities = agent.getCapabilities();
        const registration = {
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
    getAgentById(agentId) {
        const registration = this.agents.get(agentId);
        return registration?.agent || null;
    }
    /**
     * Find agents that can handle a specific task
     */
    async findCandidateAgents(classification) {
        const candidates = [];
        for (const [id, registration] of this.agents) {
            if (registration.healthStatus === AgentHealth.UNAVAILABLE) {
                continue;
            }
            // Check if agent can handle any of the task domains
            const canHandle = registration.capabilities.domains.some(domain => classification.domains.includes(domain)) || registration.capabilities.domains.includes('general');
            if (canHandle) {
                try {
                    const match = await registration.agent.evaluateTask(classification.toString(), // Simplified for now
                    { urgency: classification.urgency });
                    if (match.score > 0.3) { // Minimum threshold
                        candidates.push({ agent: registration.agent, match });
                    }
                }
                catch (error) {
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
    getBestAvailableAgent(domain) {
        const availableAgents = Array.from(this.agents.values())
            .filter(reg => reg.healthStatus === AgentHealth.HEALTHY &&
            (reg.capabilities.domains.includes(domain) || reg.capabilities.domains.includes('general')))
            .sort((a, b) => a.agent.getCurrentLoad() - b.agent.getCurrentLoad());
        return availableAgents[0]?.agent || null;
    }
    /**
     * Get all registered agents
     */
    getAllAgents() {
        return Array.from(this.agents.values()).map(reg => reg.agent);
    }
    /**
     * Initialize default Moldova-optimized agents
     */
    initializeDefaultAgents() {
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
            providerPreference: { type: 'free-first', fallbackEnabled: true },
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
            providerPreference: { type: 'free-first', fallbackEnabled: true },
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
            providerPreference: { type: 'free-first', fallbackEnabled: true },
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
            providerPreference: { type: 'free-first', fallbackEnabled: true },
            maxConcurrentTasks: 10,
            averageResponseTime: 3500
        });
        [weatherAgent, travelAgent, govAgent, generalAgent].forEach(agent => {
            this.registerAgent(agent);
        });
    }
    markAgentDegraded(agentId) {
        const registration = this.agents.get(agentId);
        if (registration) {
            registration.healthStatus = AgentHealth.DEGRADED;
        }
    }
    startHealthChecking() {
        this.healthCheckInterval = setInterval(() => {
            this.performHealthCheck();
        }, 30000); // Check every 30 seconds
    }
    async performHealthCheck() {
        for (const [id, registration] of this.agents) {
            try {
                // Simple health check - ping the agent
                const isHealthy = await registration.agent.healthCheck();
                registration.healthStatus = isHealthy ? AgentHealth.HEALTHY : AgentHealth.DEGRADED;
                registration.lastActivity = new Date();
            }
            catch (error) {
                console.warn(`Agent ${id} health check failed:`, error);
                registration.healthStatus = AgentHealth.DEGRADED;
            }
        }
    }
    /**
     * Cleanup method
     */
    destroy() {
        if (this.healthCheckInterval) {
            clearInterval(this.healthCheckInterval);
            this.healthCheckInterval = null;
        }
    }
}
