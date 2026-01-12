import { JsonRpcProvider, BrowserProvider } from 'ethers'
import {
  getRpcServiceUrl,
  createWeb3ReadOnly,
  createWeb3,
  createSafeAppsWeb3Provider,
  getUserNonce,
  getWeb3ReadOnly,
  setWeb3ReadOnly,
} from './web3'
import { RPC_AUTHENTICATION } from '@safe-global/store/gateway/types'
import type { Chain, RpcUri } from '@safe-global/store/gateway/AUTO_GENERATED/chains'

jest.mock('ethers', () => ({
  JsonRpcProvider: jest.fn().mockImplementation(() => ({
    getTransactionCount: jest.fn(),
  })),
  BrowserProvider: jest.fn().mockImplementation(() => ({})),
}))

jest.mock('@safe-global/utils/config/constants', () => ({
  INFURA_TOKEN: 'test-infura-token',
  SAFE_APPS_INFURA_TOKEN: 'test-safe-apps-infura-token',
}))

describe('web3', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setWeb3ReadOnly(undefined)
  })

  describe('getRpcServiceUrl', () => {
    it('should append token when authentication is API_KEY_PATH', () => {
      const rpcUri: RpcUri = {
        authentication: RPC_AUTHENTICATION.API_KEY_PATH,
        value: 'https://mainnet.infura.io/v3/',
      }

      const result = getRpcServiceUrl(rpcUri)

      expect(result).toBe('https://mainnet.infura.io/v3/test-infura-token')
    })

    it('should return value without token when authentication is not API_KEY_PATH', () => {
      const rpcUri: RpcUri = {
        authentication: RPC_AUTHENTICATION.NO_AUTHENTICATION,
        value: 'https://rpc.ankr.com/eth',
      }

      const result = getRpcServiceUrl(rpcUri)

      expect(result).toBe('https://rpc.ankr.com/eth')
    })
  })

  describe('createWeb3ReadOnly', () => {
    it('should create JsonRpcProvider with chain RPC URL', () => {
      const chain: Chain = {
        chainId: '1',
        rpcUri: {
          authentication: RPC_AUTHENTICATION.NO_AUTHENTICATION,
          value: 'https://rpc.ankr.com/eth',
        },
      } as Chain

      const result = createWeb3ReadOnly(chain)

      expect(JsonRpcProvider).toHaveBeenCalledWith('https://rpc.ankr.com/eth', 1, {
        staticNetwork: true,
        batchMaxCount: 3,
      })
      expect(result).toBeDefined()
    })

    it('should use custom RPC URL when provided', () => {
      const chain: Chain = {
        chainId: '1',
        rpcUri: {
          authentication: RPC_AUTHENTICATION.NO_AUTHENTICATION,
          value: 'https://default-rpc.com',
        },
      } as Chain

      createWeb3ReadOnly(chain, 'https://custom-rpc.com')

      expect(JsonRpcProvider).toHaveBeenCalledWith('https://custom-rpc.com', 1, {
        staticNetwork: true,
        batchMaxCount: 3,
      })
    })

    it('should return undefined when custom RPC is empty string', () => {
      const chain: Chain = {
        chainId: '1',
        rpcUri: {
          authentication: RPC_AUTHENTICATION.NO_AUTHENTICATION,
          value: '',
        },
      } as Chain

      const result = createWeb3ReadOnly(chain, '')

      expect(result).toBeUndefined()
    })
  })

  describe('createWeb3', () => {
    it('should create BrowserProvider with wallet provider', () => {
      const mockWalletProvider = { request: jest.fn() }

      const result = createWeb3(mockWalletProvider)

      expect(BrowserProvider).toHaveBeenCalledWith(mockWalletProvider)
      expect(result).toBeDefined()
    })
  })

  describe('createSafeAppsWeb3Provider', () => {
    it('should create JsonRpcProvider for Safe Apps', () => {
      const chain: Chain = {
        chainId: '1',
        rpcUri: {
          authentication: RPC_AUTHENTICATION.NO_AUTHENTICATION,
          value: 'https://rpc.ankr.com/eth',
        },
      } as Chain

      const result = createSafeAppsWeb3Provider(chain)

      expect(JsonRpcProvider).toHaveBeenCalledWith('https://rpc.ankr.com/eth', undefined, {
        staticNetwork: true,
        batchMaxCount: 3,
      })
      expect(result).toBeDefined()
    })

    it('should use custom RPC URL when provided', () => {
      const chain: Chain = {
        chainId: '1',
        rpcUri: {
          authentication: RPC_AUTHENTICATION.NO_AUTHENTICATION,
          value: 'https://default-rpc.com',
        },
      } as Chain

      createSafeAppsWeb3Provider(chain, 'https://custom-safe-apps-rpc.com')

      expect(JsonRpcProvider).toHaveBeenCalledWith('https://custom-safe-apps-rpc.com', undefined, {
        staticNetwork: true,
        batchMaxCount: 3,
      })
    })

    it('should return undefined when custom RPC is empty string', () => {
      const chain: Chain = {
        chainId: '1',
        rpcUri: {
          authentication: RPC_AUTHENTICATION.NO_AUTHENTICATION,
          value: '',
        },
      } as Chain

      const result = createSafeAppsWeb3Provider(chain, '')

      expect(result).toBeUndefined()
    })
  })

  describe('getUserNonce', () => {
    it('should return -1 when web3 is not set', async () => {
      setWeb3ReadOnly(undefined)

      const result = await getUserNonce('0xUserAddress')

      expect(result).toBe(-1)
    })

    it('should return transaction count from provider', async () => {
      const mockProvider = {
        getTransactionCount: jest.fn().mockResolvedValue(42),
      }
      setWeb3ReadOnly(mockProvider as unknown as JsonRpcProvider)

      const result = await getUserNonce('0xUserAddress')

      expect(mockProvider.getTransactionCount).toHaveBeenCalledWith('0xUserAddress', 'pending')
      expect(result).toBe(42)
    })

    it('should reject when getTransactionCount fails', async () => {
      const mockError = new Error('RPC error')
      const mockProvider = {
        getTransactionCount: jest.fn().mockRejectedValue(mockError),
      }
      setWeb3ReadOnly(mockProvider as unknown as JsonRpcProvider)

      await expect(getUserNonce('0xUserAddress')).rejects.toThrow('RPC error')
    })
  })

  describe('External stores', () => {
    it('should set and get web3ReadOnly', () => {
      const mockProvider = { mock: 'provider' } as unknown as JsonRpcProvider

      setWeb3ReadOnly(mockProvider)

      expect(getWeb3ReadOnly()).toBe(mockProvider)
    })

    it('should return undefined when web3ReadOnly is not set', () => {
      setWeb3ReadOnly(undefined)

      expect(getWeb3ReadOnly()).toBeUndefined()
    })
  })
})
