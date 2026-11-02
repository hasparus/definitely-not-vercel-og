import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.node.ts', 'src/index.edge.ts'],
  format: 'esm',
  target: 'es2022',
  dts: true,
  sourcemap: true,
  clean: true,
  external: [/\.wasm\?module$/],
})
