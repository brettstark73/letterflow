#!/usr/bin/env node

const { mkdtempSync, rmSync, writeFileSync } = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const { randomBytes } = require('node:crypto')

if (process.argv.length !== 3 || process.argv[2] !== '--synthetic-env') {
  throw new Error('Quality build requires the explicit --synthetic-env flag')
}

const repoRoot = path.resolve(__dirname, '..')
const qualityDir = mkdtempSync(path.join(repoRoot, `.quality-build-${process.pid}-`))
const qualityName = path.basename(qualityDir)
const outputName = `${qualityName}/.next`
const tsconfigName = `${qualityName}/tsconfig.json`
const outputDir = path.join(repoRoot, outputName)
const tsconfigPath = path.join(repoRoot, tsconfigName)

const env = {
  PATH: process.env.PATH,
  HOME: process.env.HOME,
  TMPDIR: process.env.TMPDIR,
  CI: 'true',
  NODE_ENV: 'production',
  NEXT_TELEMETRY_DISABLED: '1',
  NEXT_DIST_DIR: outputName,
  NEXT_TSCONFIG_PATH: tsconfigName,
  NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  ANTHROPIC_API_KEY: 'test-api-key',
  ENCRYPTION_KEY: randomBytes(32).toString('hex'),
}

let result
try {
  writeFileSync(tsconfigPath, '{"extends":"../tsconfig.json"}\n', 'utf8')
  result = spawnSync('npm', ['run', 'build'], {
    cwd: repoRoot,
    env,
    stdio: 'inherit',
  })
} finally {
  if (
    path.basename(qualityDir) !== qualityName ||
    !qualityName.startsWith(`.quality-build-${process.pid}-`) ||
    path.dirname(qualityDir) !== repoRoot ||
    path.dirname(outputDir) !== qualityDir ||
    path.dirname(tsconfigPath) !== qualityDir
  ) {
    throw new Error('Refusing to clean unexpected quality build paths')
  }
  rmSync(qualityDir, { recursive: true, force: true })
}

if (result.error) throw result.error
process.exit(result.status ?? 1)
