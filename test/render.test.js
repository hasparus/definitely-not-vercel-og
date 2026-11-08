import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { test } from 'node:test'
import sharp from 'sharp'

const dist = new URL('../dist/', import.meta.url).href
const element = {
  type: 'div',
  props: { tw: 'flex w-full h-full bg-[#f00] text-white text-6xl', children: 'hello' },
}

function render(entry, { withoutSharp = false } = {}) {
  const script = `
    import { registerHooks } from 'node:module'
    import { readFileSync } from 'node:fs'
    registerHooks({
      resolve(specifier, context, next) {
        if (${withoutSharp} && specifier === 'sharp') {
          throw Object.assign(new Error('no sharp'), { code: 'ERR_MODULE_NOT_FOUND' })
        }
        return next(specifier, context)
      },
      load(url, context, next) {
        if (!url.endsWith('.wasm?module')) return next(url, context)
        const file = JSON.stringify(url.replace(/\\?module$/, ''))
        return {
          format: 'module',
          shortCircuit: true,
          source: \`import { readFileSync } from 'node:fs'
            export default new WebAssembly.Module(readFileSync(new URL(\${file})))\`,
        }
      },
    })
    const fetch = globalThis.fetch
    globalThis.fetch = async (url, init) =>
      String(url).startsWith('file:') ? new Response(readFileSync(new URL(url))) : fetch(url, init)
    const { ImageResponse } = await import(${JSON.stringify(dist + entry)})
    const response = new ImageResponse(${JSON.stringify(element)}, { width: 600, height: 300 })
    process.stdout.write(response.headers.get('content-type') + '\\n')
    process.stdout.write(Buffer.from(await response.arrayBuffer()).toString('base64'))
  `
  const [contentType, png] = execFileSync(
    process.execPath,
    ['--no-warnings', '--input-type=module', '-e', script],
    { cwd: tmpdir(), encoding: 'utf8' },
  ).split('\n')
  return { contentType, png: Buffer.from(png, 'base64') }
}

async function assertRedImage({ contentType, png }) {
  assert.equal(contentType, 'image/png')
  const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true })
  assert.deepEqual([info.width, info.height], [600, 300])
  assert.deepEqual([...data.subarray(0, 3)], [255, 0, 0])
}

test('node build renders with sharp', async () => {
  await assertRedImage(render('index.node.js'))
})

test('node build falls back to resvg without sharp', async () => {
  await assertRedImage(render('index.node.js', { withoutSharp: true }))
})

test('edge build renders with bundler-provided wasm modules', async () => {
  await assertRedImage(render('index.edge.js'))
})
