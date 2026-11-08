import assert from 'node:assert/strict'
import { test } from 'node:test'
import { render } from './helpers.js'

test('node build renders with sharp', async () => {
  const { usedSharp } = await render()
  assert.ok(usedSharp)
})
