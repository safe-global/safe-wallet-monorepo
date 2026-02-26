import { renderHook } from '@testing-library/react'
import { Interface } from 'ethers'
import useCustomAbiDecoding from '../useCustomAbiDecoding'

const ERC20_ABI = [
  'function transfer(address to, uint256 amount) returns (bool)',
  'function approve(address spender, uint256 amount) returns (bool)',
]

const MULTI_ARRAY_ABI = ['function batchTransfer(address[] recipients, uint256[] amounts)']

const toAddress = '0x1234567890123456789012345678901234567890'

const mockCustomAbis: Record<string, { address: string; name: string; abi: string }> = {}

jest.mock('@/hooks/useChainId', () => ({
  __esModule: true,
  default: jest.fn(() => '1'),
}))

jest.mock('@/store', () => ({
  useAppSelector: () => mockCustomAbis,
  useAppDispatch: () => jest.fn(),
}))

describe('useCustomAbiDecoding', () => {
  beforeEach(() => {
    Object.keys(mockCustomAbis).forEach((key) => delete mockCustomAbis[key])
  })

  it('should return null when hexData is null', () => {
    const { result } = renderHook(() => useCustomAbiDecoding(null, toAddress))
    expect(result.current).toBeNull()
  })

  it('should return null when toAddress is undefined', () => {
    const { result } = renderHook(() => useCustomAbiDecoding('0x1234', undefined))
    expect(result.current).toBeNull()
  })

  it('should return null when no matching custom ABI exists', () => {
    const { result } = renderHook(() => useCustomAbiDecoding('0x1234', toAddress))
    expect(result.current).toBeNull()
  })

  it('should decode ERC20 transfer calldata', () => {
    const iface = new Interface(ERC20_ABI)
    const recipient = '0x0000000000000000000000000000000000000001'
    const hexData = iface.encodeFunctionData('transfer', [recipient, '1000'])

    mockCustomAbis[toAddress] = {
      address: toAddress,
      name: 'Test Token',
      abi: JSON.stringify(ERC20_ABI),
    }

    const { result } = renderHook(() => useCustomAbiDecoding(hexData, toAddress))

    expect(result.current).not.toBeNull()
    expect(result.current?.method).toBe('transfer')
    expect(result.current?.parameters).toHaveLength(2)
    expect(result.current?.parameters?.[0].name).toBe('to')
    expect(result.current?.parameters?.[0].type).toBe('address')
    expect(result.current?.parameters?.[1].name).toBe('amount')
    expect(result.current?.parameters?.[1].type).toBe('uint256')
    expect(result.current?.parameters?.[1].value).toBe('1000')
  })

  it('should handle array parameter types', () => {
    const iface = new Interface(MULTI_ARRAY_ABI)
    const recipients = ['0x0000000000000000000000000000000000000001', '0x0000000000000000000000000000000000000002']
    const amounts = ['100', '200']
    const hexData = iface.encodeFunctionData('batchTransfer', [recipients, amounts])

    mockCustomAbis[toAddress] = {
      address: toAddress,
      name: 'Batch Contract',
      abi: JSON.stringify(MULTI_ARRAY_ABI),
    }

    const { result } = renderHook(() => useCustomAbiDecoding(hexData, toAddress))

    expect(result.current).not.toBeNull()
    expect(result.current?.method).toBe('batchTransfer')
    expect(result.current?.parameters).toHaveLength(2)
    expect(Array.isArray(result.current?.parameters?.[0].value)).toBe(true)
    expect(Array.isArray(result.current?.parameters?.[1].value)).toBe(true)
  })

  it('should return null for invalid ABI', () => {
    mockCustomAbis[toAddress] = {
      address: toAddress,
      name: 'Bad',
      abi: 'not valid json',
    }

    const { result } = renderHook(() => useCustomAbiDecoding('0x1234', toAddress))
    expect(result.current).toBeNull()
  })

  it('should return null when calldata does not match ABI', () => {
    mockCustomAbis[toAddress] = {
      address: toAddress,
      name: 'Test Token',
      abi: JSON.stringify(ERC20_ABI),
    }

    const { result } = renderHook(() => useCustomAbiDecoding('0xdeadbeef', toAddress))
    expect(result.current).toBeNull()
  })
})
