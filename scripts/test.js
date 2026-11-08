import { execFileSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

// Lints the packed tarball, then runs test/ the way a consumer gets the package:
// unpacked outside this repo, next to only its declared dependencies.
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const root = mkdtempSync(join(tmpdir(), 'og-test-'))
try {
  const tarball = join(root, 'package.tgz')
  const dir = join(root, 'node_modules', pkg.name)
  mkdirSync(dir, { recursive: true })
  const run = (command, args, options) => execFileSync(command, args, { stdio: 'inherit', ...options })
  run('pnpm', ['pack', '--silent', '--ignore-scripts', '--out', tarball])
  run('pnpm', ['exec', 'publint', 'run', tarball, '--strict'])
  run('pnpm', ['exec', 'attw', tarball, '--profile', 'esm-only', '--quiet'])
  run('tar', ['-xzf', tarball, '--strip-components=1', '-C', dir])
  for (const dep of Object.keys({ ...pkg.dependencies, ...pkg.optionalDependencies })) {
    mkdirSync(dirname(join(root, 'node_modules', dep)), { recursive: true })
    symlinkSync(realpathSync(join('node_modules', dep)), join(root, 'node_modules', dep))
  }
  writeFileSync(join(root, 'package.json'), '{ "type": "module" }\n')
  cpSync('test', join(root, 'test'), { recursive: true, filter: (path) => !path.endsWith('node_modules') })
  run(process.execPath, ['--test', 'test/*.test.js'], { cwd: root })
} finally {
  rmSync(root, { recursive: true, force: true })
}
