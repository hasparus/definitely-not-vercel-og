import { execFileSync, spawnSync } from 'node:child_process'
import { cpSync, mkdirSync, mkdtempSync, readFileSync, realpathSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

// Runs test/ the way a consumer gets the package: the packed tarball, outside
// this repo, next to only its declared dependencies.
const pkg = JSON.parse(readFileSync('package.json', 'utf8'))
const root = mkdtempSync(join(tmpdir(), 'og-test-'))
try {
  const tarball = join(root, 'package.tgz')
  const dir = join(root, 'node_modules', pkg.name)
  mkdirSync(dir, { recursive: true })
  execFileSync('pnpm', ['pack', '--silent', '--out', tarball], { stdio: 'inherit' })
  execFileSync('tar', ['-xzf', tarball, '--strip-components=1', '-C', dir])
  for (const dep of Object.keys({ ...pkg.dependencies, ...pkg.optionalDependencies })) {
    mkdirSync(dirname(join(root, 'node_modules', dep)), { recursive: true })
    symlinkSync(realpathSync(join('node_modules', dep)), join(root, 'node_modules', dep))
  }
  writeFileSync(join(root, 'package.json'), '{ "type": "module" }\n')
  cpSync('test', join(root, 'test'), { recursive: true, filter: (path) => !path.endsWith('node_modules') })
  process.exitCode = spawnSync(process.execPath, ['--test', 'test/*.test.js'], { cwd: root, stdio: 'inherit' }).status
} finally {
  rmSync(root, { recursive: true, force: true })
}
