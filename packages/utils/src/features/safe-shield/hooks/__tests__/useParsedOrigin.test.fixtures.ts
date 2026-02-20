/**
 * Test fixtures and utilities for useParsedOrigin tests
 */

export const testFixtures = {
  plainStrings: {
    validUrl: 'https://app.example.com',
    invalidJson: 'not-valid-json-string',
    firstUrl: 'https://first.example.com',
    secondUrl: 'https://second.example.com',
    plainUrl: 'https://plain.example.com',
    jsonUrl: 'https://json.example.com',
    sameUrl: 'https://same.example.com',
    complexUrl: 'https://example.com/path?query=value&other=test',
  },
  jsonStrings: {
    validUrl: (): string => JSON.stringify({ url: 'https://parsed.example.com' }),
    emptyUrl: (): string => JSON.stringify({ url: '' }),
    nonStringUrl: (): string => JSON.stringify({ url: 123 }),
    nullUrl: (): string => JSON.stringify({ url: null }),
    noUrlProperty: (): string => JSON.stringify({ otherProperty: 'value' }),
    emptyObject: (): string => JSON.stringify({}),
    multipleProperties: (): string =>
      JSON.stringify({
        url: 'https://complex.example.com',
        otherProperty: 'value',
        nested: { data: 'test' },
      }),
    whitespaceUrl: (): string => JSON.stringify({ url: '   ' }),
    arrayUrl: (): string => JSON.stringify({ url: ['https://array.example.com'] }),
    objectUrl: (): string => JSON.stringify({ url: { href: 'https://object.example.com' } }),
    escapedChars: (): string => JSON.stringify({ url: 'https://example.com/path?query=value&other=test' }),
  },
  malformed: {
    incompleteJson: '{"url": "https://example.com"',
  },
}

export const createJsonOrigin = (url: string): string => {
  return JSON.stringify({ url })
}

export const createComplexJsonOrigin = (url: string, additionalProps?: Record<string, unknown>): string => {
  return JSON.stringify({ url, ...additionalProps })
}
