import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { registerHooks } from 'node:module'
import { test } from 'node:test'
import { render } from './helpers.js'

// Stands in for an edge bundler: `edge-light` exports, compiled `*.wasm?module`
// imports, and `fetch` serving bundled assets.
const wasmModules = []
registerHooks({
  resolve(specifier, context, next) {
    return next(specifier, { ...context, conditions: ['edge-light', ...context.conditions] })
  },
  load(url, context, next) {
    if (!url.endsWith('.wasm?module')) return next(url, context)
    wasmModules.push(url.split('/').pop())
    return {
      format: 'module',
      shortCircuit: true,
      source: `import { readFileSync } from 'node:fs'
        export default new WebAssembly.Module(readFileSync(new URL(${JSON.stringify(url)})))`,
    }
  },
})
const fetch = globalThis.fetch
globalThis.fetch = async (url, init) =>
  String(url).startsWith('file:') ? new Response(readFileSync(new URL(url))) : fetch(url, init)

test('edge build renders with bundler-provided wasm modules', async () => {
  await render()
  assert.deepEqual(wasmModules.sort(), ['layout.wasm?module', 'resvg.wasm?module'])
})
