import { readdirSync } from 'node:fs';
import { defineConfig } from 'tsup';

export default defineConfig({
  entry: ['src/index.ts', ...readdirSync('src', { withFileTypes: true })
    .filter((entry) => entry.isDirectory() && entry.name !== 'internal')
    .map((entry) => `src/${entry.name}/index.ts`)],
  format: ['esm', 'cjs'], target: 'node22', platform: 'node',
  sourcemap: true, clean: true, splitting: true,
});
