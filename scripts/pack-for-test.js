import { execFileSync } from 'node:child_process'
import { mkdirSync, rmSync } from 'node:fs'

// Tests import the packed tarball, so whatever `files` or `exports` leave out
// fails them. test/package.json puts the tests outside this package's scope;
// otherwise Node would self-resolve the name to the working tree.
const dir = 'test/node_modules/@hasparus/definitely-not-vercel-og'
const tarball = 'test/node_modules/package.tgz'

rmSync('test/node_modules', { recursive: true, force: true })
mkdirSync(dir, { recursive: true })
execFileSync('pnpm', ['pack', '--silent', '--out', tarball], { stdio: 'inherit' })
execFileSync('tar', ['-xzf', tarball, '--strip-components=1', '-C', dir])
