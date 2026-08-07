#!/usr/bin/env node
import { writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const webRoot = resolve(here, '..')

// Default-deny: only production allows crawlers; staging/previews/misconfig disallow.
const isProduction = process.env.NEXT_PUBLIC_IS_PRODUCTION === 'true'

const robots = isProduction ? 'User-agent: *\nAllow: /\n' : 'User-agent: *\nDisallow: /\n'

const outPath = resolve(webRoot, 'public', 'robots.txt')
writeFileSync(outPath, robots)
console.log(`Wrote ${outPath} (${isProduction ? 'production: allow' : 'non-production: disallow'})`)
