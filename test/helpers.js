import assert from 'node:assert/strict'
import sharp from 'sharp'

const element = {
  type: 'div',
  props: { tw: 'flex w-full h-full bg-[#f00] text-white text-6xl', children: 'hello' },
}

export async function render() {
  const { ImageResponse } = await import('@hasparus/definitely-not-vercel-og')
  const response = new ImageResponse(element, { width: 600, height: 300 })
  assert.equal(response.headers.get('content-type'), 'image/png')
  const png = Buffer.from(await response.arrayBuffer())
  // sharp's cache stays empty until it processes an image, so check it before
  // decoding the result with sharp below.
  const usedSharp = sharp.cache().items.current > 0

  const { data, info } = await sharp(png).raw().toBuffer({ resolveWithObject: true })
  assert.deepEqual([info.width, info.height], [600, 300])
  assert.deepEqual([...data.subarray(-info.channels, -info.channels + 3)], [255, 0, 0])
  assert.ok(data.some((value, i) => i % info.channels === 1 && value > 0), 'text is drawn')
  return { usedSharp }
}
