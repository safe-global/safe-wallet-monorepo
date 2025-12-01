import { renderHook, act } from '@/src/tests/test-utils'
import { useImportPrivateKey } from '../useImportPrivateKey'
import { ethers } from 'ethers'
import Clipboard from '@react-native-clipboard/clipboard'
import Logger from '@/src/utils/logger'
import { storePrivateKey } from '@/src/hooks/useSign/useSign'
import useDelegate from '@/src/hooks/useDelegate'

jest.mock('@react-native-clipboard/clipboard')
jest.mock('@/src/hooks/useSign/useSign')
jest.mock('@/src/hooks/useDelegate')
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}))

const mockClipboard = Clipboard as jest.Mocked<typeof Clipboard>
const mockStorePrivateKey = storePrivateKey as jest.MockedFunction<typeof storePrivateKey>
const mockUseDelegate = useDelegate as jest.MockedFunction<typeof useDelegate>

const { useRouter } = require('expo-router')

describe('useImportPrivateKey', () => {
  const mockRouter = {
    push: jest.fn(),
  }

  const mockCreateDelegate = jest.fn()

  // Real test private keys from hardhat/foundry
  const VALID_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'
  const EXPECTED_ADDRESS = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
  const VALID_SEED_PHRASE = 'test test test test test test test test test test test junk'

  beforeEach(() => {
    jest.clearAllMocks()

    useRouter.mockReturnValue(mockRouter)

    mockUseDelegate.mockReturnValue({
      createDelegate: mockCreateDelegate,
      isLoading: false,
      error: null,
    })

    mockClipboard.getString.mockResolvedValue('')
  })

  describe('initial state', () => {
    it('should initialize with empty state', () => {
      const { result } = renderHook(() => useImportPrivateKey())

      expect(result.current.input).toBe('')
      expect(result.current.inputType).toBe('unknown')
      expect(result.current.wallet).toBeUndefined()
      expect(result.current.error).toBeUndefined()
    })
  })

  describe('handleInputChange - private key validation', () => {
    it('should accept valid private key and derive correct address', () => {
      const { result } = renderHook(() => useImportPrivateKey())

      act(() => {
        result.current.handleInputChange(VALID_PRIVATE_KEY)
      })

      expect(result.current.input).toBe(VALID_PRIVATE_KEY)
      expect(result.current.inputType).toBe('private-key')
      expect(result.current.wallet).toBeInstanceOf(ethers.Wallet)
      expect(result.current.wallet?.address).toBe(EXPECTED_ADDRESS)
      expect(result.current.error).toBeUndefined()
    })

    it('should accept valid private key without 0x prefix', () => {
      const { result } = renderHook(() => useImportPrivateKey())
      const keyWithoutPrefix = VALID_PRIVATE_KEY.slice(2)

      act(() => {
        result.current.handleInputChange(keyWithoutPrefix)
      })

      expect(result.current.inputType).toBe('private-key')
      expect(result.current.wallet).toBeInstanceOf(ethers.Wallet)
      expect(result.current.wallet?.address).toBe(EXPECTED_ADDRESS)
      expect(result.current.error).toBeUndefined()
    })

    it('should reject private key with invalid length', () => {
      const { result } = renderHook(() => useImportPrivateKey())
      const shortKey = '0x1234567890abcdef'

      act(() => {
        result.current.handleInputChange(shortKey)
      })

      expect(result.current.inputType).toBe('unknown')
      expect(result.current.wallet).toBeUndefined()
      expect(result.current.error).toBe('Invalid private key or seed phrase.')
    })

    it('should reject private key with invalid characters', () => {
      const { result } = renderHook(() => useImportPrivateKey())
      const invalidKey = '0xZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZZ'

      act(() => {
        result.current.handleInputChange(invalidKey)
      })

      expect(result.current.inputType).toBe('unknown')
      expect(result.current.wallet).toBeUndefined()
      expect(result.current.error).toBe('Invalid private key or seed phrase.')
    })

    it('should reject completely invalid private key', () => {
      const { result } = renderHook(() => useImportPrivateKey())

      act(() => {
        result.current.handleInputChange('not-a-private-key')
      })

      expect(result.current.inputType).toBe('unknown')
      expect(result.current.wallet).toBeUndefined()
      expect(result.current.error).toBe('Invalid private key or seed phrase.')
    })
  })

  describe('handleInputChange - seed phrase validation', () => {
    it('should accept valid 12-word seed phrase', () => {
      const { result } = renderHook(() => useImportPrivateKey())

      act(() => {
        result.current.handleInputChange(VALID_SEED_PHRASE)
      })

      expect(result.current.input).toBe(VALID_SEED_PHRASE)
      expect(result.current.inputType).toBe('seed-phrase')
      expect(result.current.wallet).toBeUndefined()
      expect(result.current.error).toBeUndefined()
    })

    it('should accept valid 24-word seed phrase', () => {
      const { result } = renderHook(() => useImportPrivateKey())
      const phrase24 =
        'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon art'

      act(() => {
        result.current.handleInputChange(phrase24)
      })

      expect(result.current.inputType).toBe('seed-phrase')
      expect(result.current.wallet).toBeUndefined()
      expect(result.current.error).toBeUndefined()
    })

    it('should reject seed phrase with wrong word count', () => {
      const { result } = renderHook(() => useImportPrivateKey())
      const invalidPhrase = 'test test test test test'

      act(() => {
        result.current.handleInputChange(invalidPhrase)
      })

      expect(result.current.inputType).toBe('unknown')
      expect(result.current.wallet).toBeUndefined()
      expect(result.current.error).toBe('Invalid private key or seed phrase.')
    })

    it('should reject seed phrase with invalid words', () => {
      const { result } = renderHook(() => useImportPrivateKey())
      const invalidPhrase =
        'invalid invalid invalid invalid invalid invalid invalid invalid invalid invalid invalid invalid'

      act(() => {
        result.current.handleInputChange(invalidPhrase)
      })

      expect(result.current.inputType).toBe('unknown')
      expect(result.current.wallet).toBeUndefined()
      expect(result.current.error).toBe('Invalid private key or seed phrase.')
    })

    it('should handle seed phrase with leading/trailing whitespace', () => {
      const { result } = renderHook(() => useImportPrivateKey())
      const phraseWithSpaces = `  ${VALID_SEED_PHRASE}  `

      act(() => {
        result.current.handleInputChange(phraseWithSpaces)
      })

      expect(result.current.inputType).toBe('seed-phrase')
      expect(result.current.wallet).toBeUndefined()
      expect(result.current.error).toBeUndefined()
    })
  })

  describe('handleInputChange - edge cases', () => {
    it('should handle empty input', () => {
      const { result } = renderHook(() => useImportPrivateKey())

      act(() => {
        result.current.handleInputChange('')
      })

      expect(result.current.input).toBe('')
      expect(result.current.inputType).toBe('unknown')
      expect(result.current.wallet).toBeUndefined()
      expect(result.current.error).toBeUndefined()
    })

    it('should clear error when input becomes valid', () => {
      const { result } = renderHook(() => useImportPrivateKey())

      act(() => {
        result.current.handleInputChange('invalid')
      })
      expect(result.current.error).toBe('Invalid private key or seed phrase.')

      act(() => {
        result.current.handleInputChange(VALID_PRIVATE_KEY)
      })
      expect(result.current.error).toBeUndefined()
    })

    it('should clear error when input becomes empty', () => {
      const { result } = renderHook(() => useImportPrivateKey())

      act(() => {
        result.current.handleInputChange('invalid')
      })
      expect(result.current.error).toBe('Invalid private key or seed phrase.')

      act(() => {
        result.current.handleInputChange('')
      })
      expect(result.current.error).toBeUndefined()
    })

    it('should handle random text input', () => {
      const { result } = renderHook(() => useImportPrivateKey())

      act(() => {
        result.current.handleInputChange('just some random text')
      })

      expect(result.current.inputType).toBe('unknown')
      expect(result.current.wallet).toBeUndefined()
      expect(result.current.error).toBe('Invalid private key or seed phrase.')
    })

    it('should handle ethereum address as input', () => {
      const { result } = renderHook(() => useImportPrivateKey())

      act(() => {
        result.current.handleInputChange('0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6')
      })

      expect(result.current.inputType).toBe('unknown')
      expect(result.current.wallet).toBeUndefined()
      expect(result.current.error).toBe('Invalid private key or seed phrase.')
    })
  })

  describe('handleImport - private key flow', () => {
    it('should successfully import private key and navigate', async () => {
      const { result } = renderHook(() => useImportPrivateKey())

      mockStorePrivateKey.mockResolvedValue(undefined)
      mockCreateDelegate.mockResolvedValue({ success: true })

      act(() => {
        result.current.handleInputChange(VALID_PRIVATE_KEY)
      })

      await act(async () => {
        await result.current.handleImport()
      })

      expect(mockStorePrivateKey).toHaveBeenCalledWith(EXPECTED_ADDRESS, VALID_PRIVATE_KEY)
      expect(mockCreateDelegate).toHaveBeenCalledWith(VALID_PRIVATE_KEY, null)
      expect(mockRouter.push).toHaveBeenCalledWith({
        pathname: '/import-signers/loading',
        params: {
          address: EXPECTED_ADDRESS,
        },
      })

      expect(result.current.error).toBeUndefined()
    })

    it('should continue import even if delegate creation fails', async () => {
      const { result } = renderHook(() => useImportPrivateKey())

      mockStorePrivateKey.mockResolvedValue(undefined)
      mockCreateDelegate.mockResolvedValue({ success: false, error: 'Network error' })

      act(() => {
        result.current.handleInputChange(VALID_PRIVATE_KEY)
      })

      await act(async () => {
        await result.current.handleImport()
      })

      expect(mockStorePrivateKey).toHaveBeenCalled()
      expect(Logger.error).toHaveBeenCalledWith('Failed to create delegate during private key import', 'Network error')
      expect(mockRouter.push).toHaveBeenCalled()
    })

    it('should continue import even if delegate creation throws', async () => {
      const { result } = renderHook(() => useImportPrivateKey())

      mockStorePrivateKey.mockResolvedValue(undefined)
      mockCreateDelegate.mockRejectedValue(new Error('Network timeout'))

      act(() => {
        result.current.handleInputChange(VALID_PRIVATE_KEY)
      })

      await act(async () => {
        await result.current.handleImport()
      })

      expect(Logger.error).toHaveBeenCalledWith('Error creating delegate during private key import', expect.any(Error))
      expect(mockRouter.push).toHaveBeenCalled()
    })

    it('should fail import if storage fails', async () => {
      const { result } = renderHook(() => useImportPrivateKey())

      mockStorePrivateKey.mockRejectedValue(new Error('Storage unavailable'))

      act(() => {
        result.current.handleInputChange(VALID_PRIVATE_KEY)
      })

      await act(async () => {
        await result.current.handleImport()
      })

      expect(result.current.error).toBe('Storage unavailable')
      expect(mockRouter.push).not.toHaveBeenCalled()
    })

    it('should not import if input is invalid', async () => {
      const { result } = renderHook(() => useImportPrivateKey())

      act(() => {
        result.current.handleInputChange('invalid-input')
      })

      await act(async () => {
        await result.current.handleImport()
      })

      expect(result.current.error).toBe('Invalid private key or seed phrase.')
      expect(mockStorePrivateKey).not.toHaveBeenCalled()
      expect(mockRouter.push).not.toHaveBeenCalled()
    })
  })

  describe('handleImport - seed phrase flow', () => {
    it('should navigate to address selection for seed phrase', async () => {
      const { result } = renderHook(() => useImportPrivateKey())

      act(() => {
        result.current.handleInputChange(VALID_SEED_PHRASE)
      })

      await act(async () => {
        await result.current.handleImport()
      })

      expect(mockRouter.push).toHaveBeenCalledWith({
        pathname: '/import-signers/seed-phrase-addresses',
        params: {
          seedPhrase: VALID_SEED_PHRASE,
        },
      })

      expect(mockStorePrivateKey).not.toHaveBeenCalled()
      expect(mockCreateDelegate).not.toHaveBeenCalled()
    })
  })

  describe('onInputPaste', () => {
    it('should paste and validate private key from clipboard', async () => {
      const { result } = renderHook(() => useImportPrivateKey())

      mockClipboard.getString.mockResolvedValue(VALID_PRIVATE_KEY)

      await act(async () => {
        await result.current.onInputPaste()
      })

      expect(mockClipboard.getString).toHaveBeenCalled()
      expect(result.current.input).toBe(VALID_PRIVATE_KEY)
      expect(result.current.inputType).toBe('private-key')
      expect(result.current.wallet?.address).toBe(EXPECTED_ADDRESS)
    })

    it('should paste and validate seed phrase from clipboard', async () => {
      const { result } = renderHook(() => useImportPrivateKey())

      mockClipboard.getString.mockResolvedValue(VALID_SEED_PHRASE)

      await act(async () => {
        await result.current.onInputPaste()
      })

      expect(result.current.input).toBe(VALID_SEED_PHRASE)
      expect(result.current.inputType).toBe('seed-phrase')
    })

    it('should trim whitespace from pasted content', async () => {
      const { result } = renderHook(() => useImportPrivateKey())

      mockClipboard.getString.mockResolvedValue(`  ${VALID_PRIVATE_KEY}  `)

      await act(async () => {
        await result.current.onInputPaste()
      })

      expect(result.current.input).toBe(VALID_PRIVATE_KEY)
      expect(result.current.inputType).toBe('private-key')
    })

    it('should handle empty clipboard', async () => {
      const { result } = renderHook(() => useImportPrivateKey())

      mockClipboard.getString.mockResolvedValue('')

      await act(async () => {
        await result.current.onInputPaste()
      })

      expect(result.current.input).toBe('')
      expect(result.current.inputType).toBe('unknown')
      expect(result.current.error).toBeUndefined()
    })

    it('should handle invalid clipboard content', async () => {
      const { result } = renderHook(() => useImportPrivateKey())

      mockClipboard.getString.mockResolvedValue('invalid clipboard content')

      await act(async () => {
        await result.current.onInputPaste()
      })

      expect(result.current.inputType).toBe('unknown')
      expect(result.current.error).toBe('Invalid private key or seed phrase.')
    })
  })
})
