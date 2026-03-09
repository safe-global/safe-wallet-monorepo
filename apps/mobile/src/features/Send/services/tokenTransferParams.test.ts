import { createTokenTransferParams, createErc20TransferParams, isNativeToken } from './tokenTransferParams'
import { Interface } from 'ethers'
import { generateChecksummedAddress } from '@safe-global/test'

const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000'

describe('tokenTransferParams', () => {
  describe('createTokenTransferParams', () => {
    it('encodes a native token transfer', () => {
      const recipient = generateChecksummedAddress()
      const result = createTokenTransferParams(recipient, '1.5', 18, ZERO_ADDRESS)

      expect(result.to).toBe(recipient)
      expect(result.value).toBe('1500000000000000000')
      expect(result.data).toBe('0x')
    })

    it('encodes an ERC-20 token transfer with 18 decimals', () => {
      const recipient = generateChecksummedAddress()
      const tokenAddress = generateChecksummedAddress()
      const result = createTokenTransferParams(recipient, '100', 18, tokenAddress)

      expect(result.to).toBe(tokenAddress)
      expect(result.value).toBe('0')
      expect(result.data).not.toBe('0x')

      const iface = new Interface(['function transfer(address to, uint256 value)'])
      const decoded = iface.decodeFunctionData('transfer', result.data)
      expect(decoded[0]).toBe(recipient)
      expect(decoded[1].toString()).toBe('100000000000000000000')
    })

    it('encodes an ERC-20 token transfer with 6 decimals (USDC)', () => {
      const recipient = generateChecksummedAddress()
      const tokenAddress = generateChecksummedAddress()
      const result = createTokenTransferParams(recipient, '50', 6, tokenAddress)

      const iface = new Interface(['function transfer(address to, uint256 value)'])
      const decoded = iface.decodeFunctionData('transfer', result.data)
      expect(decoded[1].toString()).toBe('50000000')
    })

    it('encodes an ERC-20 token transfer with 8 decimals (WBTC)', () => {
      const recipient = generateChecksummedAddress()
      const tokenAddress = generateChecksummedAddress()
      const result = createTokenTransferParams(recipient, '0.5', 8, tokenAddress)

      const iface = new Interface(['function transfer(address to, uint256 value)'])
      const decoded = iface.decodeFunctionData('transfer', result.data)
      expect(decoded[1].toString()).toBe('50000000')
    })

    it('throws when safeParseUnits returns undefined', () => {
      const recipient = generateChecksummedAddress()
      expect(() => createTokenTransferParams(recipient, 'invalid', 18, ZERO_ADDRESS)).toThrow('Failed to parse amount')
    })

    it('handles zero amount for native token', () => {
      const recipient = generateChecksummedAddress()
      const result = createTokenTransferParams(recipient, '0', 18, ZERO_ADDRESS)

      expect(result.value).toBe('0')
      expect(result.data).toBe('0x')
    })

    it('handles decimal amounts for native token', () => {
      const recipient = generateChecksummedAddress()
      const result = createTokenTransferParams(recipient, '0.001', 18, ZERO_ADDRESS)

      expect(result.value).toBe('1000000000000000')
    })
  })

  describe('createErc20TransferParams', () => {
    it('creates proper MetaTransactionData for ERC-20', () => {
      const recipient = generateChecksummedAddress()
      const tokenAddress = generateChecksummedAddress()
      const result = createErc20TransferParams(recipient, tokenAddress, '1000000')

      expect(result.to).toBe(tokenAddress)
      expect(result.value).toBe('0')
      expect(result.data).toBeDefined()
      expect(result.data.startsWith('0xa9059cbb')).toBe(true) // transfer selector
    })
  })

  describe('isNativeToken', () => {
    it('returns true for zero address', () => {
      expect(isNativeToken(ZERO_ADDRESS)).toBe(true)
    })

    it('returns true for zero address with different casing', () => {
      expect(isNativeToken('0x0000000000000000000000000000000000000000')).toBe(true)
    })

    it('returns false for non-zero address', () => {
      expect(isNativeToken(generateChecksummedAddress())).toBe(false)
    })
  })
})
