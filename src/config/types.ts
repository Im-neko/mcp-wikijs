import { z } from 'zod';

// Config validation schema
export const ConfigSchema = z.object({
  wikijs: z.object({
    url: z.string().url(),
    token: z.string().min(1),
    defaultLocale: z.string().default('en')
  }),
  mcp: z.object({
    port: z.number().int().positive().default(8080),
    host: z.string().default('0.0.0.0'),
    transport: z.enum(['http', 'stdio']).default('stdio')
  }),
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']).default('info')
  })
});

// Type definition
export type Config = z.infer<typeof ConfigSchema>;