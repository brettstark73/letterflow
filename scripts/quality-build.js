#!/usr/bin/env node

const { existsSync, rmSync } = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const { randomBytes } = require('node:crypto')

if (process.argv.length !== 3 || process.argv[2] !== '--synthetic-env') {
  throw new Error('Quality build requires the explicit --synthetic-env flag')
}

const repoRoot = path.resolve(__dirname, '..')
const outputName = '.next-quality'
const outputDir = path.join(repoRoot, outputName)
if (existsSync(outputDir)) {
  throw new Error(`Quality build output already exists: ${outputDir}`)
}

const env = {
  PATH: process.env.PATH,
  HOME: process.env.HOME,
  TMPDIR: process.env.TMPDIR,
  CI: 'true',
  NODE_ENV: 'production',
  NEXT_TELEMETRY_DISABLED: '1',
  NEXT_DIST_DIR: outputName,
  NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  ANTHROPIC_API_KEY: 'test-api-key',
  ENCRYPTION_KEY: randomBytes(32).toString('hex'),
}

const result = spawnSync('npm', ['run', 'build'], {
  cwd: repoRoot,
  env,
  stdio: 'inherit',
})

if (path.basename(outputDir) !== '.next-quality' || path.dirname(outputDir) !== repoRoot) {
  throw new Error(`Refusing to clean unexpected build output: ${outputDir}`)
}
rmSync(outputDir, { recursive: true, force: true })

if (result.error) throw result.error
process.exit(result.status ?? 1)
