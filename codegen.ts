import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: './src/wikijs/sdl/schema.graphql',
  documents: './src/wikijs/operations.ts',
  generates: {
    './src/wikijs/generated/operations.ts': {
      plugins: ['typescript', 'typescript-operations', 'typescript-graphql-request'],
      config: {
        rawRequest: true,
        skipTypename: true
      }
    }
  }
};

export default config;