# Ceata – Universal Agentic Framework

> Pronounced /ˈt͡ʃe.a.ta/ (Romanian **ceată** = a tight-knit band acting in unison)

A modern, minimal, and provider-agnostic agentic framework in TypeScript, designed for **zero-dependency** installs, smart provider fallback, and first-class tool support.

---

## ✨ Why “Ceata”?

**Ceata** is the Romanian word for a coordinated group—be it soldiers, haiduci, or carol singers.  
Your AI agents form exactly such a **ceată**: independent minds working towards a common goal.

---

## 🚀 Features

- 🔄 **Smart Provider Fallback** – free models first, paid models only when critical
- 🧰 **First-Class Tools** – JSON-Schema-typed, automatically executable
- 🌐 **Pluggable Providers** – OpenRouter, Google Gemini, OpenAI (drop-in new ones)
- 🛡️ **Pure TypeScript, Zero Deps** – uses only built-in Node 18 APIs
- 🎯 **Type-Safe End-to-End** – strict generics for messages, providers, and tools
- ⚡ **Ultra-Minimal API** – two core functions: `defineTool` and `runAgent`

---

## 📦 Quick Start

```bash
git clone https://github.com/nalyk/ceata.git
cd ceata
npm install
npm run build     # ES Modules in dist/
```

### Hello Ceata

```typescript
import { defineTool } from "./dist/core/Tool.js";
import { runAgent, ProviderConfig } from "./dist/core/AgentRunner.js";
import { openRouter } from "./dist/providers/openrouter.js";
import { google } from "./dist/providers/google.js";
import { openai } from "./dist/providers/openai.js";
import { config } from "./dist/config/index.js";

// 1️⃣  Define a calculator tool
const add = defineTool({
  name: "add",
  description: "Add two numbers",
  parameters: {
    type: "object",
    properties: {
      a: { type: "number" },
      b: { type: "number" },
    },
    required: ["a", "b"],
  },
  execute: async ({ a, b }) => a + b,
});

// 2️⃣  Configure providers (free → paid fallback)
const providers: ProviderConfig[] = [
  // Primary providers (free models)
  {
    p: openRouter,
    model: "mistralai/mistral-small-3.1-24b-instruct:free",
    priority: "primary",
  },
  {
    p: google,
    model: config.providers.google.defaultModel,
    priority: "primary",
  },

  // Fallback provider (paid model)
  {
    p: openai,
    model: config.providers.openai.defaultModel,
    priority: "fallback",
  },
];

// 3️⃣  Run!
const response = await runAgent(
  [{ role: "user", content: "What is 15 + 27?" }],
  { add },
  providers
);
console.log(response);
```

---

## 🔧 Provider Setup

Provider configuration is handled by the central `src/config/index.ts` file, which reads from environment variables (`.env` file). You can override the defaults by setting the corresponding environment variables.

### `.env.example`

```
# OPENAI
OPENAI_API_KEY=
OPENAI_BASE_URL=https://api.openai.com
OPENAI_DEFAULT_MODEL=gpt-4o-mini

# OPENROUTER
OPENROUTER_API_KEY=
OPENROUTER_BASE_URL=https://openrouter.ai
OPENROUTER_DEFAULT_MODEL=mistralai/devstral-small:free

# GOOGLE
GOOGLE_API_KEY=
GOOGLE_BASE_URL=https://generativelanguage.googleapis.com
GOOGLE_DEFAULT_MODEL=models/gemini-2.0-flash-thinking-exp
```

---

## 🛠️ Defining Tools

```typescript
const getWeather = defineTool({
  name: "get_weather",
  description: "Return current weather for a city",
  parameters: {
    type: "object",
    properties: {
      location: { type: "string" },
      units: { type: "string", enum: ["celsius", "fahrenheit"] },
    },
    required: ["location"],
  },
  execute: async ({ location, units = "celsius" }) => {
    // call your weather API here
    return { location, temperature: 22, units, condition: "sunny" };
  },
});
```

---

## 📚 API Reference

### `runAgent(messages, tools, providers, maxSteps = 8)`

Executes the agent loop with automatic tool invocation and provider fallback.

### `defineTool(options)`

Creates a type-safe tool: JSON-Schema parameters + async executor.

### Types

```typescript
interface ProviderConfig {
  p: Provider;
  model: string;
  priority: "primary" | "fallback";
}

interface ChatMessage {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
}
```

---

## 🗺️ Project Layout

```
src/
├── core/            # Provider + Tool interfaces, AgentRunner
├── providers/       # openrouter.ts | google.ts | openai.ts
├── examples/        # mathAgent.ts etc.
├── config/          # Centralized configuration
└── index.ts         # Public barrel
```

---

## 🛡️ Security & Cost

- **No Persistent Storage** – chats stay in memory only
- **Rate-Limiting Ready** – plug your favourite limiter in `AgentRunner`
- **Cost Guardrails** – free models attempted first; paid only on failure

---

## 🧪 Testing

```bash
npm run build
node dist/examples/mathAgent.js
```

GitHub Actions CI runs lint, unit tests, and an end-to-end agent flow.

---

## 🤝 Contributing

1. Fork → feature branch → PR
2. Add/extend unit tests (`src/__tests__`)
3. Follow the conventional commits style

---

## 📜 License

MIT

---

Built with ❤️ by a Yoda.Digital - a _ceată_ of open-source enthusiasts.
