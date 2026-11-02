import { loadEmoji, getIconCode, EmojiType } from './emoji'
import { FontDetector, languageFontMap } from './language'

async function loadGoogleFont(font: string, text: string) {
  if (!font || !text) return

  const API = `https://fonts.googleapis.com/css2?family=${font}&text=${encodeURIComponent(
    text,
  )}`

  const css = await (
    await fetch(API, {
      headers: {
        // Make sure it returns TTF.
        'User-Agent':
          'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1',
      },
    })
  ).text()

  const resource = css.match(/src: url\((.+)\) format\('(opentype|truetype)'\)/)
  if (!resource) throw new Error('Failed to download dynamic font')

  const res = await fetch(resource[1])
  if (!res.ok) {
    throw new Error('Failed to download dynamic font. Status: ' + res.status)
  }

  return res.arrayBuffer()
}

const detector = new FontDetector()

const assetCache = new Map<string, any>()
const loadDynamicAsset = ({ emoji }: { emoji?: EmojiType }) => {
  const fn = async (code, text) => {
    if (code === 'emoji') {
      // It's an emoji, load the image.
      return (
        `data:image/svg+xml;base64,` +
        btoa(await (await loadEmoji(getIconCode(text), emoji)).text())
      )
    }

    const codes = code.split('|')

    // Try to load from Google Fonts.
    const names = codes
      .map((code) => languageFontMap[code as keyof typeof languageFontMap])
      .filter(Boolean)
      .flat()

    if (names.length === 0) return []

    try {
      const textByFont = await detector.detect(text, names)
      const fonts = Object.keys(textByFont)

      const fontData = await Promise.all(
        fonts.map((font) => loadGoogleFont(font, textByFont[font])),
      )
      return fontData.map((data, index) => ({
        name: `satori_${codes[index]}_fallback_${text}`,
        data,
        weight: 400,
        style: 'normal',
        lang: codes[index] === 'unknown' ? undefined : codes[index],
      }))
    } catch (e) {
      console.error('Failed to load dynamic font for', text, '. Error:', e)
    }
  }

  return async (...args: Parameters<typeof fn>) => {
    const key = JSON.stringify(args)
    const cache = assetCache.get(key)
    if (cache) return cache

    const asset = await fn(...args)
    assetCache.set(key, asset)
    return asset
  }
}

export default async function render(
  satori: (typeof import('satori'))['default'],
  resvg: typeof import('@resvg/resvg-wasm'),
  sharp: typeof import('sharp').default | undefined,
  opts,
  defaultFonts,
  element,
) {
  const options = Object.assign(
    {
      width: 1200,
      height: 630,
      debug: false,
    },
    opts,
  )

  const svg = await satori(element, {
    width: options.width,
    height: options.height,
    debug: options.debug,
    fonts: options.fonts || defaultFonts,
    loadAdditionalAsset: loadDynamicAsset({
      emoji: options.emoji,
    }),
  })

  let pngBuffer: Uint8Array | Buffer
  if (sharp) {
    pngBuffer = await sharp(new TextEncoder().encode(svg))
      .resize(options.width)
      .png()
      .toBuffer()
  } else {
    const resvgJS = new resvg.Resvg(svg, {
      fitTo: {
        mode: 'width',
        value: options.width,
      },
    })

    const pngData = resvgJS.render()
    pngBuffer = pngData.asPng()
    pngData.free()
    resvgJS.free()
  }

  return pngBuffer
}
