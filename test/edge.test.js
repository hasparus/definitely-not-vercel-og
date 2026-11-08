import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { isBuiltin, registerHooks } from 'node:module'
import { test } from 'node:test'
import { render } from './helpers.js'

const name = '@hasparus/definitely-not-vercel-og'
const dist = new URL('.', import.meta.resolve(name)).href

// Stands in for an edge bundler: `edge-light` exports, no Node-only imports,
// compiled `*.wasm?module` imports, and `fetch` serving bundled assets.
const wasmModules = []
registerHooks({
  resolve(specifier, context, next) {
    const fromDist = context.parentURL?.startsWith(dist) && context.parentURL.endsWith('.js')
    if (fromDist && (isBuiltin(specifier) || specifier === 'sharp')) {
      throw new Error(`edge build imports ${specifier}`)
    }
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

test('edge runtime conditions resolve to the edge build', () => {
  for (const condition of ['edge', 'edge-light', 'browser', 'worker', 'workerd']) {
    const url = execFileSync(
      process.execPath,
      ['-C', condition, '--input-type=module', '-e', `console.log(import.meta.resolve('${name}'))`],
      { encoding: 'utf8' },
    )
    assert.match(url, /\/dist\/index\.edge\.js\n$/, condition)
  }
})
