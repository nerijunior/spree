import { defineConfig } from 'tsup';
import path from 'node:path';

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'types/index': 'src/types/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: { resolve: ['@spree/sdk-core'] },
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: false,
  // sdk-core is workspace-private; inline it into the published bundle.
  noExternal: ['@spree/sdk-core'],
  esbuildOptions(options) {
    options.alias = {
      '@/types': path.resolve(import.meta.dirname, 'src/types/generated/index.ts'),
    };
  },
});
