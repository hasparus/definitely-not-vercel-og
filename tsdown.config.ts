import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/index.node.ts', 'src/index.edge.ts'],
  target: 'es2022',
  dts: true,
  sourcemap: true,
  fixedExtension: false,
  deps: { neverBundle: ['react', /\.wasm\?module$/], onlyBundle: [] },
})
