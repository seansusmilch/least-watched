import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  // input: 'https://raw.githubusercontent.com/Radarr/Radarr/develop/src/Radarr.Api.V3/openapi.json',
  input: 'openapi/radarr.openapi.json',
  output: 'src/generated/radarr',
  plugins: ['@hey-api/client-next', 'zod'],
});
