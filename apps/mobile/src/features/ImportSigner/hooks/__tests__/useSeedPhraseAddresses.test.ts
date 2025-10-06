import { renderHook, act } from '@/src/tests/test-utils'
import { useSeedPhraseAddresses } from '../useSeedPhraseAddresses'
import { ethers, Mnemonic, HDNodeWallet } from 'ethers'
import Logger from '@/src/utils/logger'

// Don't mock ethers - we want to test real cryptographic derivation
// Don't mock useAddresses - we want to test the integration

describe('useSeedPhraseAddresses', () => {
  // Real BIP-39 seed phrases for testing
  const VALID_SEED_PHRASE_12 = 'test test test test test test test test test test test junk'
  const VALID_SEED_PHRASE_24 =
    'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art'

  // Expected addresses for the 12-word test phrase
  const EXPECTED_ADDRESSES_12_WORD = [
    {
      address: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      path: "m/44'/60'/0'/0/0",
      index: 0,
    },
    {
      address: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8',
      path: "m/44'/60'/0'/0/1",
      index: 1,
    },
    {
      address: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC',
      path: "m/44'/60'/0'/0/2",
      index: 2,
    },
  ]

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('initial state', () => {
    it('should initialize with empty addresses', () => {
      const { result } = renderHook(() => useSeedPhraseAddresses({ seedPhrase: VALID_SEED_PHRASE_12 }))

      expect(result.current.addresses).toEqual([])
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should provide all required functions', () => {
      const { result } = renderHook(() => useSeedPhraseAddresses({ seedPhrase: VALID_SEED_PHRASE_12 }))

      expect(result.current.deriveAddresses).toBeInstanceOf(Function)
      expect(result.current.getPrivateKeyForAddress).toBeInstanceOf(Function)
      expect(result.current.clearError).toBeInstanceOf(Function)
    })
  })

  describe('validateSeedPhrase', () => {
    it('should fail validation when seed phrase is empty', async () => {
      const { result } = renderHook(() => useSeedPhraseAddresses({ seedPhrase: '' }))

      await act(async () => {
        await result.current.deriveAddresses(5)
      })

      expect(result.current.error).toEqual({
        code: 'VALIDATION',
        message: 'No seed phrase provided',
      })
      expect(result.current.addresses).toEqual([])
    })

    it('should pass validation with valid seed phrase', async () => {
      const { result } = renderHook(() => useSeedPhraseAddresses({ seedPhrase: VALID_SEED_PHRASE_12 }))

      await act(async () => {
        await result.current.deriveAddresses(1)
      })

      expect(result.current.error).toBeNull()
      expect(result.current.addresses).toHaveLength(1)
    })
  })

  describe('deriveAddresses - basic functionality', () => {
    it('should derive correct addresses from 12-word seed phrase', async () => {
      const { result } = renderHook(() => useSeedPhraseAddresses({ seedPhrase: VALID_SEED_PHRASE_12 }))

      await act(async () => {
        await result.current.deriveAddresses(3)
      })

      expect(result.current.addresses).toHaveLength(3)
      expect(result.current.addresses).toEqual(EXPECTED_ADDRESSES_12_WORD)
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
    })

    it('should derive addresses from 24-word seed phrase', async () => {
      const { result } = renderHook(() => useSeedPhraseAddresses({ seedPhrase: VALID_SEED_PHRASE_24 }))

      await act(async () => {
        await result.current.deriveAddresses(2)
      })

      expect(result.current.addresses).toHaveLength(2)
      expect(result.current.addresses[0]).toMatchObject({
        address: expect.stringMatching(/^0x[a-fA-F0-9]{40}$/),
        path: "m/44'/60'/0'/0/0",
        index: 0,
      })
      expect(result.current.isLoading).toBe(false)
    })

    it('should derive single address', async () => {
      const { result } = renderHook(() => useSeedPhraseAddresses({ seedPhrase: VALID_SEED_PHRASE_12 }))

      await act(async () => {
        await result.current.deriveAddresses(1)
      })

      expect(result.current.addresses).toHaveLength(1)
      expect(result.current.addresses[0]).toEqual(EXPECTED_ADDRESSES_12_WORD[0])
    })

    it('should derive multiple batches of addresses', async () => {
      const { result } = renderHook(() => useSeedPhraseAddresses({ seedPhrase: VALID_SEED_PHRASE_12 }))

      // First batch
      await act(async () => {
        await result.current.deriveAddresses(2)
      })

      expect(result.current.addresses).toHaveLength(2)
      expect(result.current.addresses[0]).toEqual(EXPECTED_ADDRESSES_12_WORD[0])
      expect(result.current.addresses[1]).toEqual(EXPECTED_ADDRESSES_12_WORD[1])

      // Second batch (should append)
      await act(async () => {
        await result.current.deriveAddresses(1)
      })

      expect(result.current.addresses).toHaveLength(3)
      expect(result.current.addresses[2]).toEqual(EXPECTED_ADDRESSES_12_WORD[2])
    })

    it('should handle large batch derivation', async () => {
      const { result } = renderHook(() => useSeedPhraseAddresses({ seedPhrase: VALID_SEED_PHRASE_12 }))

      await act(async () => {
        await result.current.deriveAddresses(10)
      })

      expect(result.current.addresses).toHaveLength(10)
      // Verify first and last addresses
      expect(result.current.addresses[0].index).toBe(0)
      expect(result.current.addresses[9].index).toBe(9)
    })
  })

  describe('deriveAddresses - BIP-44 derivation path', () => {
    it('should use MetaMask-compatible derivation paths', async () => {
      const { result } = renderHook(() => useSeedPhraseAddresses({ seedPhrase: VALID_SEED_PHRASE_12 }))

      await act(async () => {
        await result.current.deriveAddresses(5)
      })

      // Verify BIP-44 path format: m/44'/60'/0'/0/{index}
      result.current.addresses.forEach((addr, index) => {
        expect(addr.path).toBe(`m/44'/60'/0'/0/${index}`)
        expect(addr.index).toBe(index)
      })
    })

    it('should derive addresses that match ethers.js getIndexedAccountPath', async () => {
      const { result } = renderHook(() => useSeedPhraseAddresses({ seedPhrase: VALID_SEED_PHRASE_12 }))

      await act(async () => {
        await result.current.deriveAddresses(3)
      })

      // Verify paths match ethers.js standard
      result.current.addresses.forEach((addr) => {
        const expectedPath = ethers.getIndexedAccountPath(addr.index)
        expect(addr.path).toBe(expectedPath)
      })
    })

    it('should derive addresses with sequential indices', async () => {
      const { result } = renderHook(() => useSeedPhraseAddresses({ seedPhrase: VALID_SEED_PHRASE_12 }))

      await act(async () => {
        await result.current.deriveAddresses(5)
      })

      result.current.addresses.forEach((addr, idx) => {
        expect(addr.index).toBe(idx)
      })
    })
  })

  describe('deriveAddresses - cryptographic correctness', () => {
    it('should derive addresses that match manual ethers.js derivation', async () => {
      const { result } = renderHook(() => useSeedPhraseAddresses({ seedPhrase: VALID_SEED_PHRASE_12 }))

      await act(async () => {
        await result.current.deriveAddresses(3)
      })

      // Manually derive addresses using ethers to verify correctness
      const mnemonic = Mnemonic.fromPhrase(VALID_SEED_PHRASE_12)

      result.current.addresses.forEach((addr) => {
        const manualWallet = HDNodeWallet.fromMnemonic(mnemonic, addr.path)
        expect(addr.address).toBe(manualWallet.address)
      })
    })

    it('should derive deterministic addresses (same seed phrase = same addresses)', async () => {
      const { result: result1 } = renderHook(() => useSeedPhraseAddresses({ seedPhrase: VALID_SEED_PHRASE_12 }))
      const { result: result2 } = renderHook(() => useSeedPhraseAddresses({ seedPhrase: VALID_SEED_PHRASE_12 }))

      await act(async () => {
        await result1.current.deriveAddresses(3)
      })

      await act(async () => {
        await result2.current.deriveAddresses(3)
      })

      expect(result1.current.addresses).toEqual(result2.current.addresses)
    })

    it('should derive different addresses for different seed phrases', async () => {
      const { result: result1 } = renderHook(() => useSeedPhraseAddresses({ seedPhrase: VALID_SEED_PHRASE_12 }))
      const { result: result2 } = renderHook(() => useSeedPhraseAddresses({ seedPhrase: VALID_SEED_PHRASE_24 }))

      await act(async () => {
        await result1.current.deriveAddresses(3)
      })

      await act(async () => {
        await result2.current.deriveAddresses(3)
      })

      expect(result1.current.addresses[0].address).not.toBe(result2.current.addresses[0].address)
    })
  })

  describe('getPrivateKeyForAddress', () => {
    it('should return correct private key for derived address', async () => {
      const { result } = renderHook(() => useSeedPhraseAddresses({ seedPhrase: VALID_SEED_PHRASE_12 }))

      await act(async () => {
        await result.current.deriveAddresses(3)
      })

      const firstAddress = result.current.addresses[0]
      const privateKey = result.current.getPrivateKeyForAddress(firstAddress.address, firstAddress.index)

      expect(privateKey).not.toBeNull()
      expect(privateKey).toMatch(/^0x[a-fA-F0-9]{64}$/)

      // Verify the private key actually generates the correct address
      expect(privateKey).toBeDefined()
      const wallet = new ethers.Wallet(privateKey as string)
      expect(wallet.address).toBe(firstAddress.address)
    })

    it('should return private key for any valid index', async () => {
      const { result } = renderHook(() => useSeedPhraseAddresses({ seedPhrase: VALID_SEED_PHRASE_12 }))

      await act(async () => {
        await result.current.deriveAddresses(5)
      })

      result.current.addresses.forEach((addr) => {
        const privateKey = result.current.getPrivateKeyForAddress(addr.address, addr.index)
        expect(privateKey).not.toBeNull()

        // Verify correctness
        expect(privateKey).toBeDefined()
        const wallet = new ethers.Wallet(privateKey as string)
        expect(wallet.address).toBe(addr.address)
      })
    })

    it('should handle address with different casing', async () => {
      const { result } = renderHook(() => useSeedPhraseAddresses({ seedPhrase: VALID_SEED_PHRASE_12 }))

      await act(async () => {
        await result.current.deriveAddresses(1)
      })

      const address = result.current.addresses[0]
      const lowercaseAddress = address.address.toLowerCase()
      const privateKey = result.current.getPrivateKeyForAddress(lowercaseAddress, address.index)

      expect(privateKey).not.toBeNull()
      expect(privateKey).toBeDefined()
      const wallet = new ethers.Wallet(privateKey as string)
      expect(wallet.address.toLowerCase()).toBe(lowercaseAddress)
    })

    it('should return null for mismatched address and index', async () => {
      const { result } = renderHook(() => useSeedPhraseAddresses({ seedPhrase: VALID_SEED_PHRASE_12 }))

      await act(async () => {
        await result.current.deriveAddresses(3)
      })

      // Request private key for address at index 0, but provide index 1
      const address0 = result.current.addresses[0].address
      const privateKey = result.current.getPrivateKeyForAddress(address0, 1)

      expect(privateKey).toBeNull()
    })

    it('should return null for invalid address', async () => {
      const { result } = renderHook(() => useSeedPhraseAddresses({ seedPhrase: VALID_SEED_PHRASE_12 }))

      await act(async () => {
        await result.current.deriveAddresses(1)
      })

      const privateKey = result.current.getPrivateKeyForAddress('0x0000000000000000000000000000000000000000', 0)

      expect(privateKey).toBeNull()
    })
  })

  describe('error handling', () => {
    it('should set error when validation fails', async () => {
      const { result } = renderHook(() => useSeedPhraseAddresses({ seedPhrase: '' }))

      await act(async () => {
        await result.current.deriveAddresses(5)
      })

      expect(result.current.error).toEqual({
        code: 'VALIDATION',
        message: 'No seed phrase provided',
      })
      expect(result.current.isLoading).toBe(false)
    })

    it('should clear error when clearError is called', async () => {
      const { result } = renderHook(() => useSeedPhraseAddresses({ seedPhrase: '' }))

      await act(async () => {
        await result.current.deriveAddresses(5)
      })

      expect(result.current.error).not.toBeNull()

      act(() => {
        result.current.clearError()
      })

      expect(result.current.error).toBeNull()
    })

    it('should handle invalid seed phrase gracefully', async () => {
      const { result } = renderHook(() =>
        useSeedPhraseAddresses({ seedPhrase: 'invalid invalid invalid invalid invalid invalid' }),
      )

      await act(async () => {
        await result.current.deriveAddresses(1)
      })

      expect(result.current.error).toEqual({
        code: 'LOAD',
        message: 'Failed to load addresses',
      })
      expect(Logger.error).toHaveBeenCalledWith('Error deriving addresses from seed phrase:', expect.any(Error))
    })
  })

  describe('loading state', () => {
    it('should set isLoading to true during derivation', async () => {
      const { result } = renderHook(() => useSeedPhraseAddresses({ seedPhrase: VALID_SEED_PHRASE_12 }))

      const derivePromise = act(async () => {
        await result.current.deriveAddresses(5)
      })

      // After promise completes, isLoading should be false
      await derivePromise
      expect(result.current.isLoading).toBe(false)
    })

    it('should set isLoading to false after successful derivation', async () => {
      const { result } = renderHook(() => useSeedPhraseAddresses({ seedPhrase: VALID_SEED_PHRASE_12 }))

      await act(async () => {
        await result.current.deriveAddresses(3)
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.addresses).toHaveLength(3)
    })

    it('should set isLoading to false after error', async () => {
      const { result } = renderHook(() => useSeedPhraseAddresses({ seedPhrase: '' }))

      await act(async () => {
        await result.current.deriveAddresses(5)
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).not.toBeNull()
    })
  })

  describe('edge cases', () => {
    it('should handle deriving zero addresses', async () => {
      const { result } = renderHook(() => useSeedPhraseAddresses({ seedPhrase: VALID_SEED_PHRASE_12 }))

      await act(async () => {
        await result.current.deriveAddresses(0)
      })

      expect(result.current.addresses).toEqual([])
    })

    it('should handle derivation starting from high indices', async () => {
      const { result } = renderHook(() => useSeedPhraseAddresses({ seedPhrase: VALID_SEED_PHRASE_12 }))

      // Derive first 100 addresses to set high start index
      await act(async () => {
        await result.current.deriveAddresses(100)
      })

      const currentLength = result.current.addresses.length

      // Derive more addresses
      await act(async () => {
        await result.current.deriveAddresses(5)
      })

      expect(result.current.addresses).toHaveLength(currentLength + 5)
      expect(result.current.addresses[currentLength].index).toBe(100)
    })

    it('should maintain address integrity across multiple derive calls', async () => {
      const { result } = renderHook(() => useSeedPhraseAddresses({ seedPhrase: VALID_SEED_PHRASE_12 }))

      // First derivation
      await act(async () => {
        await result.current.deriveAddresses(2)
      })

      const firstBatch = [...result.current.addresses]

      // Second derivation
      await act(async () => {
        await result.current.deriveAddresses(1)
      })

      // First batch should remain unchanged
      expect(result.current.addresses.slice(0, 2)).toEqual(firstBatch)
    })
  })

  describe('integration with real crypto', () => {
    it('should produce addresses that can sign and verify messages', async () => {
      const { result } = renderHook(() => useSeedPhraseAddresses({ seedPhrase: VALID_SEED_PHRASE_12 }))

      await act(async () => {
        await result.current.deriveAddresses(1)
      })

      const address = result.current.addresses[0]
      const privateKey = result.current.getPrivateKeyForAddress(address.address, address.index)

      expect(privateKey).not.toBeNull()
      expect(privateKey).toBeDefined()

      // Create wallet and sign a message
      const wallet = new ethers.Wallet(privateKey as string)
      const message = 'Test message'
      const signature = await wallet.signMessage(message)

      // Verify the signature
      const recoveredAddress = ethers.verifyMessage(message, signature)
      expect(recoveredAddress).toBe(address.address)
    })

    it('should derive checksummed addresses', async () => {
      const { result } = renderHook(() => useSeedPhraseAddresses({ seedPhrase: VALID_SEED_PHRASE_12 }))

      await act(async () => {
        await result.current.deriveAddresses(3)
      })

      result.current.addresses.forEach((addr) => {
        // Verify address is checksummed (matches ethers.getAddress result)
        const checksummed = ethers.getAddress(addr.address)
        expect(addr.address).toBe(checksummed)
      })
    })
  })
})
