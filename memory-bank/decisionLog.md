# Decision Log

This file records architectural and implementation decisions using a list format.
2025-06-19 14:47:09 - Log of updates made.

-

## Decision

- The agentic framework will use a primary/fallback provider model.

## Rationale

- This allows for the use of free, less-capable models for most tasks, while still having the option to fall back to a more powerful, paid model if necessary.

## Implementation Details

- The `AgentRunner` will be responsible for managing the fallback logic.
- The `ProviderConfig` interface will include a `priority` field to distinguish between primary and fallback providers.
