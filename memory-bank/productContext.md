# Product Context

This file provides a high-level overview of the project and the expected product that will be created. Initially it is based upon projectBrief.md (if provided) and all other available project-related information in the working directory. This file is intended to be updated as the project evolves, and should be used to inform all other modes of the project's goals and context.
2025-06-19 14:46:42 - Log of updates made will be appended as footnotes to the end of this file.

-

## Project Goal

- To create a universal, modern, and minimal agentic framework that supports multiple AI providers with intelligent fallback logic.

## Key Features

- Smart provider fallback (OpenRouter/Google -> OpenAI)
- Easy-to-define tools with automatic execution
- Support for OpenRouter, Google AI (with custom base URL), and OpenAI
- Zero-dependency TypeScript implementation

## Overall Architecture

- A core `AgentRunner` that orchestrates the execution of tools and communication with providers.
- A system of `Provider` interfaces that allow for multiple AI model implementations.
- A `defineTool` function for creating tools that the agent can use.
