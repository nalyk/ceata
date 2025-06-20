# Ceata – Universal Agentic Framework

> Pronounced /ˈt͡ʃe.a.ta/ (Romanian **ceată** = a tight-knit band acting in unison)

A modern, minimal, and provider-agnostic agentic framework in TypeScript, designed for **zero-dependency** installs, smart provider fallback, and first-class tool support.

---

## ✨ Why “Ceata”?

**Ceata** is the Romanian word for a coordinated group—be it soldiers, haiduci, or carol singers.  
Your AI agents form exactly such a **ceată**: independent minds working towards a common goal.

---

For a deeper dive into the project's design philosophy and technical decisions, please see our [**Rationale Document**](./RATIONALE.md).

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
cp .env.example .env # add your API keys
npm run build     # ES Modules in dist/
npm run example   # run the sample math agent
node dist/examples/chatWithTools.js  # multi-step streaming demo
```

### Hello Ceata

```typescript
import { defineTool } from "./dist/core/Tool.js";
import { runAgent, ProviderConfig } from "./dist/core/AgentRunner.js";
import { createOpenRouterProvider } from "./dist/providers/openrouter.js";
import { google } from "./dist/providers/google.js";
import { openai } from "./dist/providers/openai.js";
import { config } from "./dist/config/index.js";

// Create an OpenRouter provider with custom headers
const openRouter = createOpenRouterProvider(undefined, undefined, {
  headers: {
    "HTTP-Referer": "https://example.com",
    "X-Title": "Ceata Example",
  },
});

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

Provider configuration is handled by the central `src/config/index.ts` file, which directly reads from environment variables. If a `.env` file is present, it is loaded automatically using built-in Node.js APIs. You can override the defaults by setting the corresponding environment variables.

Each `create*Provider` function verifies that an API key is available. If the resolved key is empty, it throws an error, so be sure to set the appropriate environment variable or pass the key explicitly.

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
  timeoutMs?: number;
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
npm install
npm test
```

`npm test` builds the TypeScript sources and then runs the unit tests using Node's test runner.

GitHub Actions CI runs lint, unit tests, and an end-to-end agent flow.

---

## 🤝 Contributing

1. Fork → feature branch → PR
2. Add/extend unit tests (`src/__tests__`)
3. Follow the conventional commits style

---

## 📜 License

This project is licensed under the [MIT License](./LICENSE).

---

Built with ❤️ by a Yoda.Digital - a _ceată_ of open-source enthusiasts.
