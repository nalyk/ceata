/**
 * Newsroom-Specialized Multi-Agent System
 * 
 * Creates specialized agents optimized for newsroom workflows:
 * - Research Agent: Deep research, fact-checking, source verification
 * - Writing Agent: Content creation, editing, style optimization
 * - Analysis Agent: Data analysis, sentiment analysis, trend detection
 * - Translation Agent: Multi-language content adaptation
 * - Editor Agent: Quality control, editorial review, compliance
 */

import { 
  SpecializedAgent, 
  AgentRegistry, 
  DualModeCoordinator,
  SpecializationLevel 
} from '../../dist/multi-agent/index.js';

export function createNewsroomMultiAgentSystem() {
  const registry = new AgentRegistry();

  // Research Agent - Deep investigation and fact-checking specialist
  const researchAgent = new SpecializedAgent({
    id: 'research-journalist',
    domains: ['research', 'fact-checking', 'investigation', 'sources'],
    languages: ['en', 'ro', 'ru'],
    tools: [
      'web_search', 
      'fact_check', 
      'source_verification', 
      'background_research',
      'data_lookup',
      'archive_search'
    ],
    specialization: SpecializationLevel.EXPERT,
    localKnowledge: {
      cities: ['Chișinău', 'București', 'Kiev', 'Warsaw', 'Budapest'],
      currencies: ['MDL', 'RON', 'EUR', 'USD', 'UAH'],
      legalFramework: [
        'EU Media Regulation',
        'Moldova Press Law',
        'GDPR Compliance',
        'Journalistic Ethics Code'
      ],
      culturalNotes: {
        'fact_checking_standards': 'EU_journalism_ethics',
        'source_verification': 'cross_reference_minimum_2_sources',
        'sensitive_topics': 'political_neutrality_required',
        'regional_expertise': 'Eastern_European_politics_economics'
      }
    },
    providerPreference: { type: 'free-first', fallbackEnabled: true },
    maxConcurrentTasks: 3,
    averageResponseTime: 8000 // Research takes time
  });

  // Writing Agent - Content creation and editorial specialist  
  const writingAgent = new SpecializedAgent({
    id: 'content-writer',
    domains: ['writing', 'editing', 'headlines', 'content-creation'],
    languages: ['en', 'ro', 'ru'],
    tools: [
      'generate_headline',
      'edit_content',
      'style_optimization',
      'readability_check',
      'plagiarism_check',
      'seo_optimization'
    ],
    specialization: SpecializationLevel.EXPERT,
    localKnowledge: {
      cities: ['Chișinău', 'București', 'Iași', 'Bălți'],
      currencies: ['MDL', 'RON', 'EUR'],
      legalFramework: ['Moldova Media Law', 'Copyright Regulations'],
      culturalNotes: {
        'writing_style': 'factual_objective_clear',
        'headline_preferences': 'informative_not_clickbait',
        'audience_level': 'general_public_accessible',
        'tone_guidelines': 'professional_respectful_balanced'
      }
    },
    providerPreference: { type: 'free-first', fallbackEnabled: true },
    maxConcurrentTasks: 5,
    averageResponseTime: 4000
  });

  // Analysis Agent - Data analysis and insights specialist
  const analysisAgent = new SpecializedAgent({
    id: 'data-analyst',
    domains: ['analysis', 'sentiment', 'trends', 'statistics', 'insights'],
    languages: ['en', 'ro', 'ru'],
    tools: [
      'analyze_sentiment',
      'trend_detection',
      'statistical_analysis',
      'data_visualization',
      'comparative_analysis',
      'prediction_modeling'
    ],
    specialization: SpecializationLevel.EXPERT,
    localKnowledge: {
      cities: ['Chișinău', 'București', 'Kiev', 'Warsaw'],
      currencies: ['MDL', 'RON', 'EUR', 'USD'],
      legalFramework: ['EU Data Protection', 'Statistics Regulations'],
      culturalNotes: {
        'analysis_standards': 'evidence_based_methodology',
        'data_sources': 'official_statistics_preferred',
        'visualization_style': 'clear_accessible_charts',
        'regional_context': 'Eastern_European_socioeconomic_patterns'
      }
    },
    providerPreference: { type: 'free-first', fallbackEnabled: true },
    maxConcurrentTasks: 4,
    averageResponseTime: 6000
  });

  // Translation Agent - Multi-language content specialist
  const translationAgent = new SpecializedAgent({
    id: 'translator-localizer',
    domains: ['translation', 'localization', 'language', 'cultural-adaptation'],
    languages: ['en', 'ro', 'ru', 'fr', 'de'], // Extended language support
    tools: [
      'translate_content',
      'cultural_adaptation',
      'language_detection',
      'tone_preservation',
      'terminology_check',
      'quality_assessment'
    ],
    specialization: SpecializationLevel.EXPERT,
    localKnowledge: {
      cities: ['Chișinău', 'București', 'Moscow', 'Paris', 'Berlin'],
      currencies: ['MDL', 'RON', 'EUR', 'USD', 'RUB'],
      legalFramework: ['EU Language Regulations', 'Media Translation Standards'],
      culturalNotes: {
        'translation_quality': 'professional_editorial_standards',
        'cultural_sensitivity': 'Moldova_Romania_Russia_relations_aware',
        'terminology_consistency': 'media_specific_glossaries',
        'tone_adaptation': 'preserve_journalistic_objectivity'
      }
    },
    providerPreference: { type: 'free-first', fallbackEnabled: true },
    maxConcurrentTasks: 6,
    averageResponseTime: 3000 // Translation is typically faster
  });

  // Editor Agent - Quality control and editorial oversight
  const editorAgent = new SpecializedAgent({
    id: 'senior-editor',
    domains: ['editing', 'quality-control', 'compliance', 'ethics', 'oversight'],
    languages: ['en', 'ro', 'ru'],
    tools: [
      'editorial_review',
      'compliance_check',
      'ethics_verification',
      'legal_review',
      'publication_approval',
      'quality_scoring'
    ],
    specialization: SpecializationLevel.EXPERT,
    localKnowledge: {
      cities: ['Chișinău', 'București', 'Brussels'],
      currencies: ['MDL', 'RON', 'EUR'],
      legalFramework: [
        'EU Media Directive',
        'Moldova Press Law',
        'Editorial Independence Standards',
        'Journalistic Ethics Code',
        'Defamation Laws'
      ],
      culturalNotes: {
        'editorial_standards': 'EU_journalism_best_practices',
        'ethics_framework': 'independence_accuracy_fairness',
        'legal_compliance': 'Moldova_EU_media_regulations',
        'quality_metrics': 'factual_accuracy_source_credibility'
      }
    },
    providerPreference: { type: 'performance-first', fallbackEnabled: true }, // Quality matters most
    maxConcurrentTasks: 2, // Focused review work
    averageResponseTime: 10000 // Thorough editorial review takes time
  });

  // General Newsroom Agent - Fallback for any newsroom task
  const generalNewsAgent = new SpecializedAgent({
    id: 'general-newsroom',
    domains: ['general', 'newsroom', 'journalism', 'media'],
    languages: ['en', 'ro', 'ru'],
    tools: [
      'web_search',
      'basic_analysis',
      'content_summary',
      'quick_fact_check',
      'general_writing',
      'information_lookup'
    ],
    specialization: SpecializationLevel.GENERAL,
    localKnowledge: {
      cities: ['Chișinău', 'București'],
      currencies: ['MDL', 'RON', 'EUR'],
      legalFramework: ['Basic Media Law'],
      culturalNotes: {
        'default_approach': 'comprehensive_helpful_professional',
        'fallback_capability': 'handle_any_newsroom_request',
        'coordination_role': 'route_to_specialists_when_needed'
      }
    },
    providerPreference: { type: 'free-first', fallbackEnabled: true },
    maxConcurrentTasks: 8,
    averageResponseTime: 5000
  });

  // Register all agents
  [
    researchAgent,
    writingAgent, 
    analysisAgent,
    translationAgent,
    editorAgent,
    generalNewsAgent
  ].forEach(agent => {
    registry.registerAgent(agent);
  });

  // Create coordinator with newsroom-optimized settings
  const agents = registry.getAllAgents();
  const coordinator = new DualModeCoordinator(agents);

  console.log('📰 Newsroom Multi-Agent System initialized:');
  console.log(`   🔬 Research: Deep investigation & fact-checking`);
  console.log(`   ✍️  Writing: Content creation & editorial`);
  console.log(`   📊 Analysis: Data insights & trend detection`);
  console.log(`   🌐 Translation: Multi-language adaptation`);
  console.log(`   📝 Editor: Quality control & compliance`);
  console.log(`   🔧 General: Fallback for any newsroom task`);

  return {
    coordinator,
    registry,
    agents: agents,
    
    // Specialized access methods for direct agent routing
    getResearchAgent: () => researchAgent,
    getWritingAgent: () => writingAgent,
    getAnalysisAgent: () => analysisAgent,
    getTranslationAgent: () => translationAgent,
    getEditorAgent: () => editorAgent,
    getGeneralAgent: () => generalNewsAgent,
    
    // Health monitoring
    async getSystemHealth() {
      const healthChecks = await Promise.all(
        agents.map(async agent => ({
          id: agent.getCapabilities().id,
          healthy: await agent.healthCheck(),
          load: agent.getCurrentLoad(),
          domains: agent.getCapabilities().domains
        }))
      );
      
      return {
        totalAgents: agents.length,
        healthyAgents: healthChecks.filter(h => h.healthy).length,
        agents: healthChecks,
        systemStatus: healthChecks.every(h => h.healthy) ? 'optimal' : 'degraded'
      };
    }
  };
}

// Export for external usage
export default createNewsroomMultiAgentSystem;