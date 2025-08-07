import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  // input: 'https://raw.githubusercontent.com/Sonarr/Sonarr/develop/src/Sonarr.Api.V3/openapi.json',
  input: 'openapi/sonarr.openapi.json',
  output: 'src/generated/sonarr',
  plugins: ['@hey-api/client-next'],
});
