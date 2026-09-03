/**
 * Basic verification script for dsh-security-guard.
 * Checks that the plugin source files are valid TypeScript and
 * the patch file integrity.
 *
 * Usage: node verify.mjs
 */
import { readFileSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const errors = []

function check(desc, ok) {
  const icon = ok ? 'PASS' : 'FAIL'
  console.log(`  [${icon}] ${desc}`)
  if (!ok) errors.push(desc)
}

// 1. Patch file integrity
const patchPath = join(__dirname, 'patches', 'dsh-security-0.1.1-rc.2.patch')
const patchStat = statSync(patchPath)
check('patch file exists', patchStat.size > 16000)
check('patch file is reasonable size', patchStat.size === 16861)

const patchContent = readFileSync(patchPath, 'utf-8')
check('patch starts with diff header', patchContent.startsWith('diff --git'))
check('patch contains QVD-2026-57410 fix', patchContent.includes('isLoopbackPeerAddress'))
check('patch contains QVD-2026-52631 fix', patchContent.includes('refusing to import'))
check('patch contains QVD-2026-52644 fix', patchContent.includes('execView'))
check('patch contains QVD-2026-52646 fix', patchContent.includes('DENIED_SANDBOX_SERVICES'))

// 2. Plugin source files
const corePath = join(__dirname, 'src', 'core.ts')
const webPath = join(__dirname, 'src', 'web.ts')
const coreContent = readFileSync(corePath, 'utf-8')
const webContent = readFileSync(webPath, 'utf-8')

check('core.ts exists', statSync(corePath).size > 500)
check('web.ts exists', statSync(webPath).size > 500)
check('core.ts exports apply function', coreContent.includes('export function apply'))
check('web.ts exports apply function', webContent.includes('export function apply'))
check('core.ts shadows loader.import', coreContent.includes('ctx.loader.import'))
check('web.ts uses prependListener', webContent.includes('prependListener'))

// 3. Bundle manifest
const pkg = JSON.parse(readFileSync(join(__dirname, 'package.json'), 'utf-8'))
check('package.json has dsh.bundle.patch', pkg.dsh?.bundle?.patch === './cordis.patch.yml')
check('package.json has peerDependencies', pkg.peerDependencies?.['@deepseek-ai/cordis'])

// 4. cordis.patch.yml
const patchYml = readFileSync(join(__dirname, 'cordis.patch.yml'), 'utf-8')
check('cordis.patch.yml has insert directive', patchYml.includes('- insert:'))
check('cordis.patch.yml references core guard', patchYml.includes('dsh-security-core'))
check('cordis.patch.yml references web guard', patchYml.includes('dsh-security-web'))

console.log()
if (errors.length === 0) {
  console.log('All checks passed.')
} else {
  console.log(`${errors.length} check(s) FAILED:`)
  for (const e of errors) console.log(`  - ${e}`)
  process.exit(1)
}