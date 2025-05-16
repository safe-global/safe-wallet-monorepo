import { useTransferTokenInfo } from './useTransferTokenInfo'
import { useNativeTokenInfo } from '@/hooks/useNativeTokenInfo'
import { renderHook } from '@/tests/test-utils'
import { faker } from '@faker-js/faker'
import { ERC20__factory } from '@safe-global/utils/types/contracts'
import { checksumAddress } from '@safe-global/utils/utils/addresses'

jest.mock('@/hooks/useNativeTokenInfo', () => ({
  useNativeTokenInfo: jest.fn(),
}))

const ERC20_INTERFACE = ERC20__factory.createInterface()

describe('useTransferTokenInfo', () => {
  const mockNativeTokenInfo = {
    type: 'NATIVE_TOKEN',
    address: '0x0000000000000000000000000000000000000000',
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
    logoUri: 'https://example.com/eth.png',
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(useNativeTokenInfo as jest.Mock).mockReturnValue(mockNativeTokenInfo)
  })

  it('should return undefined for non-transfer transactions', () => {
    const { result } = renderHook(() => useTransferTokenInfo('0x1234', '0', faker.finance.ethereumAddress(), {}))
    expect(result.current).toBeUndefined()
  })

  it('should handle ERC20 token transfers', () => {
    const tokenAddress = faker.finance.ethereumAddress()
    const recipient = faker.finance.ethereumAddress()
    const mockTokenInfo = {
      type: 'ERC20',
      address: tokenAddress,
      name: 'Test Token',
      symbol: 'TEST',
      decimals: 18,
      logoUri: 'https://example.com/token.png',
    } as const

    const { result } = renderHook(() =>
      useTransferTokenInfo(
        ERC20_INTERFACE.encodeFunctionData('transfer', [recipient, '1000000000000000000']),
        '0',
        tokenAddress,
        { [tokenAddress]: mockTokenInfo },
      ),
    )

    expect(result.current).toEqual({
      recipient: checksumAddress(recipient),
      transferValue: 1000000000000000000n,
      tokenInfo: mockTokenInfo,
    })
  })

  it('should handle native token transfers', () => {
    const recipient = faker.finance.ethereumAddress()
    const { result } = renderHook(() => useTransferTokenInfo('0x', '1000000000000000000', recipient, {}))

    expect(result.current).toEqual({
      recipient,
      transferValue: '1000000000000000000',
      tokenInfo: mockNativeTokenInfo,
    })
  })

  it('should return undefined for invalid ERC20 transfers', () => {
    const tokenAddress = faker.finance.ethereumAddress()
    const { result } = renderHook(() => useTransferTokenInfo('0xa9059cbb', '0', tokenAddress, {}))

    expect(result.current).toBeUndefined()
  })

  it('should return undefined for zero value native transfers', () => {
    const recipient = faker.finance.ethereumAddress()
    const { result } = renderHook(() => useTransferTokenInfo('0x', '0', recipient, {}))

    expect(result.current).toBeUndefined()
  })
})
