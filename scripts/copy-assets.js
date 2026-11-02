import { copyFileSync } from 'node:fs'
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)

copyFileSync('src/Geist-Regular.ttf', 'dist/Geist-Regular.ttf')
copyFileSync(require.resolve('@resvg/resvg-wasm/index_bg.wasm'), 'dist/resvg.wasm')
copyFileSync(require.resolve('satori/layout.wasm'), 'dist/layout.wasm')
