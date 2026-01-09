import { useMemo } from 'react'

/**
 * Hook to parse origin string that may contain a JSON object with a url property
 * If the origin is a JSON string with a non-empty url property, returns the url
 * Otherwise, returns the original string or undefined
 *
 * @param originProp - The origin string to parse (may be JSON or plain string)
 * @returns The parsed URL string, original string, or undefined
 */
export function useParsedOrigin(originProp?: string): string | undefined {
  return useMemo<string | undefined>(() => {
    if (originProp) {
      try {
        const parsed = JSON.parse(originProp)
        // Only use parsed.url if it's a non-empty string
        if (typeof parsed.url === 'string' && parsed.url.length > 0) {
          return parsed.url
        }
        // Otherwise leave origin undefined to make CGW fall back to non_dapp
      } catch {
        // Not JSON - use the original string as-is
        return originProp
      }
    }
  }, [originProp])
}
