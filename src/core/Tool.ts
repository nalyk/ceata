import { Tool } from "./Provider.js";

export function defineTool<TInput, TOutput>(options: {
  name: string;
  description: string;
  parameters: unknown;
  execute: (args: TInput) => Promise<TOutput>;
}): Tool {
  return {
    schema: {
      name: options.name,
      description: options.description,
      parameters: options.parameters,
    },
    execute: async (args: unknown): Promise<unknown> => {
      return await options.execute(args as TInput);
    },
  };
}
