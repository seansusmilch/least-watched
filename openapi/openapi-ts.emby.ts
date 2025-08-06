import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: 'openapi/emby.openapi.json',
  output: 'src/generated/emby',
  plugins: ['@hey-api/client-next', 'zod'],
});
