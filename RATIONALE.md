# Rationale & Technical Decisions

This document explains the core philosophy and key technical decisions behind the Ceata framework. It is intended to provide context for contributors and users who want to understand _why_ the framework is designed the way it is.

---

## 1. The Core Problem: Building Cost-Effective, Reliable AI Agents

The world of Large Language Models (LLMs) is fragmented and expensive. While powerful models like OpenAI's GPT-4 series are highly capable, they come at a significant cost. For many applications, especially experimental ones or those with high volume, this cost is prohibitive.

On the other hand, there is a growing ecosystem of powerful, free, or nearly-free models available through platforms like OpenRouter. The challenge is that these models vary in quality, reliability, and their ability to use tools—a critical feature for building useful AI agents.

**Ceata was born from this struggle:** How can we build agents that are smart, reliable, and cost-effective?

## 2. The Solution: A Provider-Agnostic, Fallback-Driven Architecture

Our solution is a framework that embraces heterogeneity. Instead of locking into a single provider, Ceata treats them as interchangeable components.

### Key Technical Choices:

#### a. The `Provider` Interface

The biggest technical hurdle is that every AI provider (OpenAI, Google, OpenRouter) has a different API schema.

- **Request formats** are different.
- **Tool-call formats** are wildly different (e.g., Google's `functionCall` vs. OpenAI's `tool_calls`).
- **Response structures** are inconsistent.

The `Provider` interface is our abstraction layer. It defines a single, consistent contract that every provider implementation must adhere to. This allows the `AgentRunner` to be completely unaware of which specific provider it's talking to. It simply calls `provider.execute()` and gets back a standardized response. This makes the system clean, predictable, and easy to extend with new providers.

#### b. Smart Fallback Logic (`primary` vs. `fallback`)

This is the economic heart of the framework. We don't want to pay for a premium model unless we absolutely have to.

- **Primary Providers**: These are configured to use high-quality **free models** (e.g., via OpenRouter). The agent will _always_ try these first, in sequence.
- **Fallback Providers**: These are the paid, highly reliable models (e.g., `gpt-4o-mini`). They are only used if _all_ primary providers fail (due to API errors, model downtime, or an inability to generate a valid tool call).

This ensures we get the best of both worlds: the cost-effectiveness of free models and the reliability of paid ones.

#### c. First-Class, JSON-Schema-Defined Tools

For an agent to be more than a chatbot, it needs to act. Tools are how it acts.

- **`defineTool`**: This function uses JSON Schema to define a tool's parameters. This is not just for validation; it's the exact format that modern, tool-capable LLMs expect.
- **Automatic Execution**: The `AgentRunner` automatically parses the model's response. If it sees a tool call that matches a defined tool, it executes the tool's `execute` function with the correct arguments and sends the result back to the model. This closes the loop and makes the agent truly autonomous.

#### d. Zero Dependencies & Pure TypeScript

In a world of bloated `node_modules` directories, we made a conscious choice to have **zero external dependencies**.

- **Simplicity & Security**: It uses only the built-in `https` module from Node.js. This makes the framework incredibly lightweight, auditable, and reduces the attack surface that comes with third-party packages.
- **Modern JS Features**: It leverages modern features like `async/await` and ES Modules to keep the code clean and maintainable.

By documenting these decisions, we hope to make the vision for Ceata clear. It's not just another LLM wrapper; it's a thoughtful, strategic framework for building practical and sustainable AI agents.
