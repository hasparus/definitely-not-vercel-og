import assert from 'node:assert/strict'
import { execFileSync } from 'node:child_process'
import { tmpdir } from 'node:os'
import { test } from 'node:test'

const entry = new URL('../dist/index.node.js', import.meta.url).href
const element = {
  type: 'div',
  props: { tw: 'flex w-full h-full bg-black text-white text-6xl', children: 'hello' },
}

test('ImageResponse renders a PNG of the requested size', async () => {
  const { ImageResponse } = await import(entry)
  const response = new ImageResponse(element, { width: 600, height: 300 })
  assert.equal(response.headers.get('content-type'), 'image/png')
  const png = Buffer.from(await response.arrayBuffer())
  assert.equal(png.subarray(1, 4).toString(), 'PNG')
  assert.equal(png.readUInt32BE(16), 600)
  assert.equal(png.readUInt32BE(20), 300)
})

test('importing does not depend on the working directory', () => {
  execFileSync(process.execPath, ['--input-type=module', '-e', `await import(${JSON.stringify(entry)})`], {
    cwd: tmpdir(),
  })
})
