# @hasparus/definitely-not-vercel-og

`@vercel/og@1.0.3`, rebuilt from the sources in its published sourcemaps, with
the same API. Differences:

- `satori` is a regular `^0.63.2` dependency instead of a bundled 0.33.5. The
  bundled copy fails on import in Node (`Dynamic require of "fs"`, missing
  `hb.wasm`, see [vercel/satori#801](https://github.com/vercel/satori/issues/801)).
- The edge build initializes satori with `layout.wasm` instead of `yoga.wasm`.
- `@resvg/resvg-wasm` is `^2.6.2`.

The upstream README follows.

# Open Graph Image Generation

Generate Open Graph images with Vercel’s API route functions

## Quick Start

Install `@hasparus/definitely-not-vercel-og`, then use it inside an API route in your Next.js project:

```jsx
// /pages/api/og.jsx
import { ImageResponse } from '@hasparus/definitely-not-vercel-og'

export default function () {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 128,
          background: 'lavender',
        }}
      >
        Hello!
      </div>
    )
  )
}
```

Then run `next dev` and access localhost:3000/api/og, the React element will be rendered and responded as a PNG from that endpoint:

![Rendered OG image](.github/demo.png)

Read more about the API, supported features and check out the examples in the following sections.

## API Reference

`@hasparus/definitely-not-vercel-og` supports both the [Node.js runtime](https://vercel.com/docs/functions/runtimes/node-js) and the [Edge runtime](https://vercel.com/docs/functions/runtimes/edge).

The package exposes an `ImageResponse` constructor, with the following options available:

```jsx
import { ImageResponse } from '@hasparus/definitely-not-vercel-og'

// ...
new ImageResponse(
  element: ReactElement,
  options: {
    width?: number = 1200
    height?: number = 630
    emoji?: 'twemoji' | 'blobmoji' | 'noto' | 'openmoji' | 'fluent' | 'fluentFlat' = 'twemoji',
    fonts?: {
      name: string,
      data: ArrayBuffer,
      weight: number,
      style: 'normal' | 'italic'
    }[]
    debug?: boolean = false

    // Options that will be passed to the HTTP response
    status?: number = 200
    statusText?: string
    headers?: Record<string, string>
  },
)
```

When running in production, these headers will be included by `@hasparus/definitely-not-vercel-og`:

```jsx
'content-type': 'image/png',
'cache-control': 'public, immutable, no-transform, max-age=31536000',
```

During development, the `cache-control: no-cache, no-store` header is used instead.

### Supported HTML and CSS Features

Please refer to [Satori’s documentation](https://github.com/vercel/satori#documentation) for a list of supported HTML and CSS features.

By default, `@hasparus/definitely-not-vercel-og` only has the Geist font included. If you need to use other fonts, you can pass them in the `fonts` option. Check the **Custom Font** example below for more details.

## Examples

- Basic · [_demo_](https://og-examples.vercel.sh/api/vercel)
- Embed SVG Image · [_demo_](https://og-examples.vercel.sh/api/image-svg)
- Dynamic PNG Image Based on URL Queries · [_demo_](https://og-examples.vercel.sh/api/dynamic-image?username=vercel)
-   Fetch External Data · [_demo_](https://og-examples.vercel.sh/api/external-data?username=rauchg)
- Custom Font · [_demo_](https://og-examples.vercel.sh/api/custom-font)
- Emoji · [_demo_](https://og-examples.vercel.sh/api/emoji)
- Languages · [_demo_](https://og-examples.vercel.sh/api/language)
- Encrypted Token · [_demo_](https://og-examples.vercel.sh/encrypted/a)


## Development / Contributing

- `pnpm i` to install
- `pnpm build` to build the library
- `pnpm test` to build, pack, lint the tarball, and render with its Node and edge entries (Node 22.19+)

## Acknowledgements

This project will not be possible without the following projects:

- [Satori](https://github.com/vercel/satori)
- [Twemoji](https://github.com/twitter/twemoji)
- [Google Fonts](https://fonts.google.com) and [Noto Sans](https://www.google.com/get/noto/)
- [Resvg](https://github.com/RazrFalcon/resvg) and [Resvg.js](https://github.com/yisibl/resvg-js)

---

<a aria-label="Vercel logo" href="https://vercel.com">
  <img src="https://badgen.net/badge/icon/Made%20by%20Vercel?icon=zeit&label&color=black&labelColor=black">
</a>
