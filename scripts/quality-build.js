#!/usr/bin/env node

const { rmSync } = require('node:fs')
const path = require('node:path')
const { spawnSync } = require('node:child_process')
const { randomBytes } = require('node:crypto')

if (process.argv.length !== 3 || process.argv[2] !== '--synthetic-env') {
  throw new Error('Quality build requires the explicit --synthetic-env flag')
}

const repoRoot = path.resolve(__dirname, '..')
const outputDir = path.join(repoRoot, '.next')
const testDefaults = {
  NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon-key',
  ANTHROPIC_API_KEY: 'test-api-key',
  ENCRYPTION_KEY: randomBytes(32).toString('hex'),
}

const env = { ...process.env }
for (const [name, value] of Object.entries(testDefaults)) {
  if (!env[name]) env[name] = value
}

const result = spawnSync('npm', ['run', 'build'], {
  cwd: repoRoot,
  env,
  stdio: 'inherit',
})

if (result.error) throw result.error

if (path.basename(outputDir) !== '.next' || path.dirname(outputDir) !== repoRoot) {
  throw new Error(`Refusing to clean unexpected build output: ${outputDir}`)
}
rmSync(outputDir, { recursive: true, force: true })

process.exit(result.status ?? 1)
