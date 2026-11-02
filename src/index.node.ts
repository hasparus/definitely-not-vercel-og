import type { ReactElement } from 'react'
import type { ImageResponseNodeOptions, ImageResponseOptions } from './types'

import satoriMod from 'satori'
import * as resvg from '@resvg/resvg-wasm'

import { Readable } from 'stream'
import fs from 'fs'
import { fileURLToPath } from 'url'

import render from './og'

// @ts-ignore
const satori = satoriMod.default || satoriMod

const fontData = fs.readFileSync(
  fileURLToPath(new URL('./Geist-Regular.ttf', import.meta.url)),
)
const resvg_wasm = fs.readFileSync(
  fileURLToPath(new URL('./resvg.wasm', import.meta.url)),
)

const fonts = [
  {
    name: 'geist',
    data: fontData,
    weight: 400,
    style: 'normal',
  },
]

const initializedResvg = resvg.initWasm(resvg_wasm)

let _sharp: typeof import('sharp').default | undefined
async function getSharp() {
  if (_sharp) {
    return _sharp
  }
  try {
    _sharp = (await import('sharp')).default
  } catch (e: unknown) {
    return undefined
  }
  return _sharp
}

export class ImageResponse extends Response {
  constructor(element: ReactElement, options: ImageResponseOptions = {}) {
    // This is a workaround for Next.js to detect if the API is used in
    // pages/api or app API routes. When used in pages/api, we can't return
    // a Response instance and need another interface instead.
    if (
      typeof Response === 'undefined' ||
      typeof ReadableStream === 'undefined'
    ) {
      throw new Error(
        'The `ImageResponse` API is not supported in this runtime, use the `unstable_createNodejsStream` API instead or switch to the Vercel Edge Runtime.',
      )
    }

    const result = new ReadableStream({
      async start(controller) {
        await initializedResvg

        const result = await render(
          satori,
          resvg,
          await getSharp(),
          options,
          fonts,
          element,
        )

        controller.enqueue(result)
        controller.close()
      },
    })

    super(result, {
      headers: {
        'content-type': 'image/png',
        'cache-control':
          process.env.NODE_ENV === 'development'
            ? 'no-cache, no-store'
            : 'public, immutable, no-transform, max-age=31536000',
        ...options.headers,
      },
      status: options.status,
      statusText: options.statusText,
    })
  }
}

/**
 * Creates a pipeable stream of the rendered image in a lambda function.
 * All parameters are the same as `ImageResponse`.
 * @example
 * ```js
 * import { unstable_createNodejsStream } from '@vercel/og'
 *
 * export default async (req, res) => {
 *   const stream = await unstable_createNodejsStream(<div>Hello World</div>, { ... })
 *   res.setHeader('Content-Type', 'image/png')
 *   res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
 *   res.statusCode = 200
 *   res.statusMessage = 'OK'
 *   stream.pipe(res)
 * }
 * ```
 */
export async function unstable_createNodejsStream(
  element: ReactElement,
  options: Omit<
    ImageResponseNodeOptions,
    'status' | 'statusText' | 'headers'
  > = {},
) {
  await initializedResvg
  const fonts = [
    {
      name: 'sans serif',
      data: fontData,
      weight: 700,
      style: 'normal',
    },
  ]

  const result = await render(
    satori,
    resvg,
    await getSharp(),
    options,
    fonts,
    element,
  )
  return Readable.from(Buffer.from(result))
}

export type NodeImageResponse = typeof ImageResponse
export { ImageResponseNodeOptions, ImageResponseOptions }
