import { z } from 'zod';

// 設定のバリデーションスキーマ
export const ConfigSchema = z.object({
  wikijs: z.object({
    url: z.string().url(),
    token: z.string().min(1)
  }),
  mcp: z.object({
    port: z.number().int().positive().default(8080),
    host: z.string().default('0.0.0.0')
  }),
  logging: z.object({
    level: z.enum(['debug', 'info', 'warn', 'error']).default('info')
  })
});

// 型定義
export type Config = z.infer<typeof ConfigSchema>;