export function defineTool(options) {
    return {
        schema: {
            name: options.name,
            description: options.description,
            parameters: options.parameters,
        },
        execute: async (args) => {
            return await options.execute(args);
        },
    };
}
