import { faker } from '@faker-js/faker'
import { buildHypernativeMessageRequestData } from '../buildHypernativeMessageRequestData'
import type { TypedData } from '@safe-global/store/gateway/AUTO_GENERATED/messages'

describe('buildHypernativeMessageRequestData', () => {
  const mockSafeAddress = faker.finance.ethereumAddress() as `0x${string}`
  const mockChainId = '137'
  const mockMessageHash = faker.string.hexadecimal({ length: 64 }) as `0x${string}`

  const createTypedData = (overrides: Partial<TypedData> = {}): TypedData => ({
    domain: {
      chainId: 1,
      verifyingContract: mockSafeAddress,
    },
    primaryType: 'Permit',
    types: {
      EIP712Domain: [
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    },
    message: {
      owner: faker.finance.ethereumAddress(),
      spender: faker.finance.ethereumAddress(),
      value: '1000000',
      nonce: 0,
      deadline: 9999999999,
    },
    ...overrides,
  })

  it('should build a valid request payload', () => {
    const typedData = createTypedData()

    const result = buildHypernativeMessageRequestData({
      safeAddress: mockSafeAddress,
      chainId: mockChainId,
      messageHash: mockMessageHash,
      typedData,
    })

    expect(result).toEqual(
      expect.objectContaining({
        safeAddress: mockSafeAddress,
        messageHash: mockMessageHash,
        message: expect.objectContaining({
          primaryType: 'Permit',
          domain: typedData.domain,
          message: typedData.message,
          types: typedData.types,
        }),
      }),
    )
  })

  it('should use domain.chainId when present', () => {
    const typedData = createTypedData({ domain: { chainId: 1 } })

    const result = buildHypernativeMessageRequestData({
      safeAddress: mockSafeAddress,
      chainId: mockChainId, // '137' — different from domain
      messageHash: mockMessageHash,
      typedData,
    })

    expect(result.chain).toBe('1')
  })

  it('should fall back to chainId prop when domain has no chainId', () => {
    const typedData = createTypedData({ domain: { verifyingContract: mockSafeAddress } })

    const result = buildHypernativeMessageRequestData({
      safeAddress: mockSafeAddress,
      chainId: mockChainId,
      messageHash: mockMessageHash,
      typedData,
    })

    expect(result.chain).toBe(mockChainId)
  })

  it('should add empty EIP712Domain when missing from types', () => {
    const typedData = createTypedData({
      types: {
        Permit: [{ name: 'owner', type: 'address' }],
      },
    })

    const result = buildHypernativeMessageRequestData({
      safeAddress: mockSafeAddress,
      chainId: mockChainId,
      messageHash: mockMessageHash,
      typedData,
    })

    expect(result.message.types.EIP712Domain).toEqual([])
    expect(result.message.types.Permit).toBeDefined()
  })

  it('should preserve existing EIP712Domain when present', () => {
    const typedData = createTypedData()

    const result = buildHypernativeMessageRequestData({
      safeAddress: mockSafeAddress,
      chainId: mockChainId,
      messageHash: mockMessageHash,
      typedData,
    })

    expect(result.message.types.EIP712Domain).toEqual(typedData.types.EIP712Domain)
  })

  it('should include proposer when provided', () => {
    const typedData = createTypedData()
    const proposer = faker.finance.ethereumAddress() as `0x${string}`

    const result = buildHypernativeMessageRequestData({
      safeAddress: mockSafeAddress,
      chainId: mockChainId,
      messageHash: mockMessageHash,
      typedData,
      proposer,
    })

    expect(result.proposer).toBe(proposer)
  })

  it('should not include proposer when not provided', () => {
    const typedData = createTypedData()

    const result = buildHypernativeMessageRequestData({
      safeAddress: mockSafeAddress,
      chainId: mockChainId,
      messageHash: mockMessageHash,
      typedData,
    })

    expect(result).not.toHaveProperty('proposer')
  })

  it('should include url when origin provided', () => {
    const typedData = createTypedData()
    const origin = 'https://app.example.com'

    const result = buildHypernativeMessageRequestData({
      safeAddress: mockSafeAddress,
      chainId: mockChainId,
      messageHash: mockMessageHash,
      typedData,
      origin,
    })

    expect(result.url).toBe(origin)
  })

  it('should not include url when origin not provided', () => {
    const typedData = createTypedData()

    const result = buildHypernativeMessageRequestData({
      safeAddress: mockSafeAddress,
      chainId: mockChainId,
      messageHash: mockMessageHash,
      typedData,
    })

    expect(result).not.toHaveProperty('url')
  })
})
