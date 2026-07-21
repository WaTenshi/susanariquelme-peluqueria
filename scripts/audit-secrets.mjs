import { execFileSync } from 'node:child_process'
import { readFileSync } from 'node:fs'
import { extname } from 'node:path'

const binaryExtensions = new Set([
  '.gif',
  '.ico',
  '.jpeg',
  '.jpg',
  '.pdf',
  '.png',
  '.webp',
  '.woff',
  '.woff2',
  '.xlsx',
])

const credentialPatterns = [
  ['Google API key', /AIza[0-9A-Za-z_-]{30,}/g],
  ['GitHub token', /(?:gh[pousr]_[0-9A-Za-z]{20,}|github_pat_[0-9A-Za-z_]{20,})/g],
  ['OpenAI API key', /sk-[0-9A-Za-z_-]{20,}/g],
  ['AWS access key', /AKIA[0-9A-Z]{16}/g],
  ['Slack token', /xox[baprs]-[0-9A-Za-z-]{10,}/g],
  ['Private key', /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/g],
  [
    'Literal credential assignment',
    /(?:api[_-]?key|client[_-]?secret|private[_-]?key|password|passwd|access[_-]?token|auth[_-]?token)\s*[:=]\s*["'][^"'\r\n]{8,}["']/gi,
  ],
]

const trackedFiles = execFileSync('git', ['ls-files', '-z'], {
  encoding: 'utf8',
})
  .split('\0')
  .filter(Boolean)

const findings = []

for (const file of trackedFiles) {
  if (binaryExtensions.has(extname(file).toLowerCase())) continue

  let content
  try {
    content = readFileSync(file, 'utf8')
  } catch {
    continue
  }

  for (const [label, pattern] of credentialPatterns) {
    pattern.lastIndex = 0
    for (const match of content.matchAll(pattern)) {
      const line = content.slice(0, match.index).split('\n').length
      findings.push({ file, line, label })
    }
  }
}

if (findings.length) {
  console.error('Se detectaron posibles credenciales literales:')
  for (const finding of findings) {
    console.error(`- ${finding.file}:${finding.line} (${finding.label}) [REDACTED]`)
  }
  process.exit(1)
}

console.log(`Security scan passed: ${trackedFiles.length} tracked files checked.`)
