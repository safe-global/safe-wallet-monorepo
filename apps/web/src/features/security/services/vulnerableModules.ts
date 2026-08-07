import { Errors, logError } from '@/services/exceptions'

// Safe-hosted proxy to the Zodiac security-check API (CORS-enabled for app.safe.global only).
// Override with NEXT_PUBLIC_ZODIAC_SECURITY_CHECK_URL for local dev.
const SECURITY_CHECK_URL =
  process.env.NEXT_PUBLIC_ZODIAC_SECURITY_CHECK_URL || 'https://zodiac-check.safe.global/public/api/security-check'

type SecurityCheckResponse = { status: 'affected' | 'safe' }

// Fails closed: a failed check is logged and treated as not affected.
export const isSafeAffectedByZodiacVulnerability = async (chainId: string, safeAddress: string): Promise<boolean> => {
  try {
    const url = `${SECURITY_CHECK_URL}?safes=${encodeURIComponent(`${chainId}:${safeAddress}`)}`
    const response = await fetch(url)
    if (!response.ok) throw new Error(`Zodiac security-check responded with ${response.status}`)

    const { status } = (await response.json()) as SecurityCheckResponse
    return status === 'affected'
  } catch (error) {
    logError(Errors._621, error)
    return false
  }
}
