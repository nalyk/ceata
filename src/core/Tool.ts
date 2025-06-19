import { Tool } from "./Provider.js";

export function defineTool<TInput, TOutput>(options: {
  name: string;
  description: string;
  parameters: unknown;
  execute: (args: TInput) => Promise<TOutput>;
}): Tool<TInput, TOutput> {
  return {
    schema: {
      name: options.name,
      description: options.description,
      parameters: options.parameters,
    },
    execute: async (args: TInput): Promise<TOutput> => {
      return await options.execute(args);
    },
  };
}
