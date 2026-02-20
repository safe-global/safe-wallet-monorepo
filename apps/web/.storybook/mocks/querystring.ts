// Browser-compatible polyfill for Node.js 'querystring' module
// Uses URLSearchParams API which is available in all modern browsers

export type ParsedUrlQuery = Record<string, string | string[] | undefined>

export function parse(str: string): ParsedUrlQuery {
  const params = new URLSearchParams(str)
  const result: ParsedUrlQuery = {}

  params.forEach((value, key) => {
    if (result[key] !== undefined) {
      // If key already exists, convert to array
      const existing = result[key]
      if (Array.isArray(existing)) {
        existing.push(value)
      } else {
        result[key] = [existing as string, value]
      }
    } else {
      result[key] = value
    }
  })

  return result
}

export function stringify(obj: Record<string, unknown>): string {
  const params = new URLSearchParams()

  for (const [key, value] of Object.entries(obj)) {
    if (Array.isArray(value)) {
      value.forEach((v) => params.append(key, String(v)))
    } else if (value !== undefined && value !== null) {
      params.append(key, String(value))
    }
  }

  return params.toString()
}

const querystring = { parse, stringify }
export default querystring
