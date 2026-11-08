import assert from 'node:assert/strict'
import { registerHooks } from 'node:module'
import { test } from 'node:test'
import { render } from './helpers.js'

registerHooks({
  resolve(specifier, context, next) {
    if (specifier === 'sharp') {
      throw Object.assign(new Error('no sharp'), { code: 'ERR_MODULE_NOT_FOUND' })
    }
    return next(specifier, context)
  },
})

test('node build falls back to resvg without sharp', async () => {
  const { usedSharp } = await render()
  assert.equal(usedSharp, false)
})
