import { faker } from '@faker-js/faker'
import { buildHypernativeBatchRequestData } from '../buildHypernativeBatchRequestData'

describe('buildHypernativeBatchRequestData', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should build request with valid hashes', () => {
    const hashes = [
      faker.string.hexadecimal({ length: 64 }) as `0x${string}`,
      faker.string.hexadecimal({ length: 64 }) as `0x${string}`,
      faker.string.hexadecimal({ length: 64 }) as `0x${string}`,
    ]

    const result = buildHypernativeBatchRequestData(hashes)

    expect(result).toEqual({
      safeTxHashes: hashes,
    })
  })

  it('should filter out invalid hashes', () => {
    const validHash1 = faker.string.hexadecimal({ length: 64 }) as `0x${string}`
    const validHash2 = faker.string.hexadecimal({ length: 64 }) as `0x${string}`
    const invalidHashes = [
      '0x123', // too short
      'not-a-hash', // invalid format
      '', // empty
      '0x' + 'a'.repeat(63), // wrong length
    ] as `0x${string}`[]

    const result = buildHypernativeBatchRequestData([validHash1, ...invalidHashes, validHash2])

    expect(result).toEqual({
      safeTxHashes: [validHash1, validHash2],
    })
  })

  it('should return undefined for empty array', () => {
    const result = buildHypernativeBatchRequestData([])

    expect(result).toBeUndefined()
  })

  it('should return undefined when all hashes are invalid', () => {
    const invalidHashes = ['0x123', 'not-a-hash', ''] as `0x${string}`[]

    const result = buildHypernativeBatchRequestData(invalidHashes)

    expect(result).toBeUndefined()
  })
})
