import type { ReactElement } from 'react'
import type { ImageResponseOptions } from './types'

// @ts-ignore
import satori, { init as initSatori } from 'satori/standalone'
import * as resvg from '@resvg/resvg-wasm'
// @ts-ignore
import layout_wasm from './layout.wasm?module'
// @ts-ignore
import resvg_wasm from './resvg.wasm?module'

import render from './og'

const initializedResvg = resvg.initWasm(resvg_wasm)
const initializeSatori = initSatori(layout_wasm)
const fallbackFont = fetch(
  new URL('./Geist-Regular.ttf', import.meta.url),
).then((res) => res.arrayBuffer())

export class ImageResponse extends Response {
  constructor(element: ReactElement, options: ImageResponseOptions = {}) {
    const result = new ReadableStream({
      async start(controller) {
        const [fontData] = await Promise.all([
          fallbackFont,
          initializeSatori,
          initializedResvg,
        ])
        const fonts = [
          {
            name: 'geist',
            data: fontData,
            weight: 400,
            style: 'normal',
          },
        ]

        const result = await render(
          satori,
          resvg,
          undefined,
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

export type EdgeImageResponse = typeof ImageResponse
export { ImageResponseOptions }
