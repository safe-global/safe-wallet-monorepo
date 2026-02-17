/**
 * Build-time script to pre-fetch chain configurations from the CGW API.
 * Writes the result to src/config/__generated__/chains.json so the app can
 * use it as an instant cache seed on startup, avoiding the blocking /v1/chains
 * network request before any other API call can proceed.
 *
 * Run with: yarn fetch-chains
 */
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const IS_PRODUCTION = process.env.NEXT_PUBLIC_IS_PRODUCTION === 'true'
const GATEWAY_URL_PRODUCTION = process.env.NEXT_PUBLIC_GATEWAY_URL_PRODUCTION || 'https://safe-client.safe.global'
const GATEWAY_URL_STAGING = process.env.NEXT_PUBLIC_GATEWAY_URL_STAGING || 'https://safe-client.staging.5afe.dev'

const GATEWAY_URL = IS_PRODUCTION ? GATEWAY_URL_PRODUCTION : GATEWAY_URL_STAGING

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = path.join(__dirname, '..', 'src', 'config', '__generated__')
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'chains.json')

type ChainPage = {
  results: unknown[]
  next?: string | null
}

async function fetchAllChains(): Promise<unknown[]> {
  const allChains: unknown[] = []
  let url: string | null = `${GATEWAY_URL}/v1/chains?cursor=limit%3D50%26offset%3D0`

  while (url) {
    const response = await fetch(url)

    if (!response.ok) {
      throw new Error(`Failed to fetch chains: ${response.status} ${response.statusText}`)
    }

    const data: ChainPage = await response.json()
    allChains.push(...data.results)

    url = data.next ?? null
  }

  return allChains
}

async function main() {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true })

  try {
    console.log(`Fetching chains from ${GATEWAY_URL}...`)
    const chains = await fetchAllChains()
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(chains, null, 2))
    console.log(`Wrote ${chains.length} chains to ${path.relative(process.cwd(), OUTPUT_FILE)}`)
  } catch (error) {
    console.warn('Warning: Failed to fetch chains at build time. Using empty array as fallback.')
    console.warn(error instanceof Error ? error.message : error)
    fs.writeFileSync(OUTPUT_FILE, '[]')
  }
}

main()
