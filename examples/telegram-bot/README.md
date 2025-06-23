# Newsroom AI Helper Bot

A production-ready Telegram bot for newsrooms powered by Ceata's multi-agent system. Features specialized AI agents for research, writing, analysis, translation, and editorial oversight.

## 🎯 Features

### **Specialized Agents**
- **🔬 Research Agent**: Deep investigation, fact-checking, source verification
- **✍️ Writing Agent**: Content creation, editing, headline generation
- **📊 Analysis Agent**: Data analysis, sentiment analysis, trend detection
- **🌐 Translation Agent**: Multi-language content adaptation
- **📝 Editor Agent**: Quality control, compliance, editorial oversight
- **🔧 General Agent**: Fallback for any newsroom task

### **Smart Coordination**
- **UDP Mode**: Fast routing for simple queries (2-3 seconds)
- **Orchestra Mode**: Complex multi-agent coordination (8-12 seconds)
- **Automatic Mode Selection**: Based on query complexity and content

### **Moldova Context Support**
- **Mixed Languages**: Romanian, Russian, English in the same query
- **Regional Expertise**: Eastern European politics, economics, culture
- **Local Knowledge**: Moldova cities, currencies, legal framework

## 🚀 Quick Start

### Prerequisites
```bash
# Install dependencies
npm install telegraf

# Required environment variables
export BOT_TOKEN="your-telegram-bot-token"
export OPENROUTER_API_KEY="sk-or-v1-your-key"

# Optional fallbacks
export GOOGLE_API_KEY="your-google-key"
export OPENAI_API_KEY="sk-your-openai-key"
```

### Installation
```bash
# In the telegram-bot directory
npm install
npm run build
npm start
```

### Bot Setup
1. Create a new bot with [@BotFather](https://t.me/botfather)
2. Get your bot token
3. Set environment variables
4. Run the bot

## 💬 Usage Examples

### Basic Commands
```
/start - Welcome and overview
/help - Detailed usage guide
/agents - Show active specialized agents
/research [query] - Research a topic
/fact [claim] - Fact-check a statement
/headline [summary] - Generate headlines
/translate [text] - Translate content
```

### Natural Language Queries

**Research & Investigation:**
```
Research the latest Moldova-EU trade agreements
What are the recent developments in Chisinau politics?
Fact-check: "Moldova's GDP grew by 5% this year"
```

**Content Creation:**
```
Write a brief about the energy crisis in Eastern Europe
Generate headlines for Moldova's new education reform
Edit this paragraph for clarity: [your text]
```

**Analysis & Insights:**
```
Analyze sentiment around recent Moldova elections
What are the trending topics in Balkan news?
Compare coverage of this story across different outlets
```

**Translation & Localization:**
```
Translate: "Știrile de astăzi din Moldova"
Convert this article to Russian for our audience
Adapt this content for Romanian readers
```

**Mixed Language Support:**
```
Salut, vreau să știu what happened azi în parliament și также нужна информация about new законы
```

## 🔧 Configuration

### Agent Specializations

Each agent is optimized for specific newsroom tasks:

```typescript
// Research Agent - Deep investigation
domains: ['research', 'fact-checking', 'investigation', 'sources']
tools: ['web_search', 'fact_check', 'source_verification', 'background_research']

// Writing Agent - Content creation  
domains: ['writing', 'editing', 'headlines', 'content-creation']
tools: ['generate_headline', 'edit_content', 'style_optimization', 'readability_check']

// Analysis Agent - Data insights
domains: ['analysis', 'sentiment', 'trends', 'statistics', 'insights']  
tools: ['analyze_sentiment', 'trend_detection', 'statistical_analysis']

// Translation Agent - Multi-language
domains: ['translation', 'localization', 'language', 'cultural-adaptation']
tools: ['translate_content', 'cultural_adaptation', 'language_detection']

// Editor Agent - Quality control
domains: ['editing', 'quality-control', 'compliance', 'ethics', 'oversight']
tools: ['editorial_review', 'compliance_check', 'ethics_verification']
```

### Provider Strategy

Optimized for newsroom cost-effectiveness:

```typescript
// Free models first (cost optimization)
primary: [
  'mistralai/mistral-small-3.2-24b-instruct:free',
  'deepseek/deepseek-r1-0528-qwen3-8b:free'
]

// Reliable paid fallbacks (quality assurance)
fallback: [
  'gemini-1.5-flash',     // Fast and reliable
  'gpt-4o-mini'          // Ultimate fallback
]
```

## 📊 Performance

### Response Times
- **Simple queries**: 2-3 seconds (UDP mode)
- **Complex analysis**: 8-12 seconds (Orchestra mode) 
- **Fact-checking**: 3-5 seconds (Research agent)
- **Translation**: 2-4 seconds (Translation agent)

### Cost Optimization
- **90%+ cost savings** through free model usage
- **Smart fallback** to paid models only when needed
- **Sequential execution** for free APIs (preserve quotas)
- **Racing strategy** for paid APIs (optimize speed)

## 🛡️ Production Features

### Error Handling
- Graceful degradation when agents fail
- Automatic provider fallback
- Circuit breaker protection
- User-friendly error messages

### Monitoring & Health
- Real-time agent health monitoring
- Performance metrics tracking
- Load balancing across agents
- System status reporting

### Security & Compliance
- Editorial compliance checking
- Ethics verification
- Legal review integration
- Source credibility validation

## 🔧 Development

### Building & Testing
```bash
npm run build      # Compile TypeScript
npm run dev        # Development with watch mode
npm run test       # Run test scenarios
```

### Adding Custom Tools
```typescript
const customTool = defineTool({
  name: 'your_tool',
  description: 'Tool description',
  parameters: { /* schema */ }
}, async (args) => {
  // Your implementation
});
```

### Custom Agent Creation
```typescript
const customAgent = new SpecializedAgent({
  id: 'your-agent',
  domains: ['your', 'domains'],
  languages: ['en', 'ro'],
  tools: ['your_tools'],
  specialization: SpecializationLevel.EXPERT,
  // ... other configuration
});
```

## 📈 Scaling

### High-Load Considerations
- Implement rate limiting for heavy usage
- Consider Redis for session management
- Monitor agent load distribution
- Scale provider quotas as needed

### Multi-Instance Deployment
- Each bot instance operates independently
- Shared agent registry for health monitoring
- Load balancer for webhook distribution
- Centralized logging and metrics

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Ensure compliance with newsroom standards
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details.

---

**Built with Ceata Universal AI Agent Framework**
*Democratizing agentic AI through free model compatibility*