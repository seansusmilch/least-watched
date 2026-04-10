import { createEnv } from '@t3-oss/env-nextjs';
import { z } from 'zod';

export const env = createEnv({
  server: {
    DATABASE_URL: z.string().min(1).default('file:/data/least-watched.db'),
    MEDIA_PROCESSOR_ITEM_LIMIT: z.coerce.number().int().positive().optional(),
  },
  runtimeEnv: {
    DATABASE_URL: process.env.DATABASE_URL,
    MEDIA_PROCESSOR_ITEM_LIMIT: process.env.MEDIA_PROCESSOR_ITEM_LIMIT,
  },
});
