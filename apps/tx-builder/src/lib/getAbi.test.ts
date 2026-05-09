import axios from 'axios'
import getAbi from './getAbi'
import { ChainInfo } from '@safe-global/safe-apps-sdk'

jest.mock('axios')
const mockedAxios = axios as jest.Mocked<typeof axios>

const mockChainInfo: ChainInfo = {
  chainName: 'Ethereum',
  chainId: '1',
  shortName: 'eth',
  nativeCurrency: {
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
    logoUri: '',
  },
  blockExplorerUriTemplate: {
    address: '',
    txHash: '',
    api: '',
  },
}

const mockAbi = [
  {
    inputs: [{ name: 'to', type: 'address' }],
    name: 'transfer',
    payable: false,
  },
]

describe('getAbi', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Sourcify v2 API', () => {
    it('should return ABI from Sourcify with exact_match status', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          abi: mockAbi,
          match: 'exact_match',
          chainId: '1',
          address: '0x123',
        },
      })

      const result = await getAbi('0x123', mockChainInfo)

      expect(result).toEqual(mockAbi)
      expect(mockedAxios.get).toHaveBeenCalledWith('https://sourcify.dev/server/v2/contract/1/0x123?fields=abi', {
        timeout: 10000,
      })
    })

    it('should return ABI from Sourcify with match status (partial match)', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          abi: mockAbi,
          match: 'match',
          chainId: '1',
          address: '0x123',
        },
      })

      const result = await getAbi('0x123', mockChainInfo)

      expect(result).toEqual(mockAbi)
    })

    it('should return ABI even when match is null', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          abi: mockAbi,
          match: null,
          chainId: '1',
          address: '0x123',
        },
      })

      const result = await getAbi('0x123', mockChainInfo)

      expect(result).toEqual(mockAbi)
    })

    it('should return empty array when ABI is empty', async () => {
      mockedAxios.get.mockResolvedValueOnce({
        data: {
          abi: [],
          match: 'exact_match',
          chainId: '1',
          address: '0x123',
        },
      })

      const result = await getAbi('0x123', mockChainInfo)

      expect(result).toEqual([])
    })
  })

  describe('fallback to Gateway', () => {
    it('should fallback to Gateway when Sourcify returns 404', async () => {
      mockedAxios.get.mockRejectedValueOnce({ response: { status: 404 } }).mockResolvedValueOnce({
        data: {
          contractAbi: { abi: mockAbi },
        },
      })

      const result = await getAbi('0x123', mockChainInfo)

      expect(result).toEqual(mockAbi)
      expect(mockedAxios.get).toHaveBeenCalledTimes(2)
      expect(mockedAxios.get).toHaveBeenLastCalledWith('https://safe-client.safe.global/v1/chains/1/contracts/0x123', {
        timeout: 10000,
      })
    })

    it('should fallback to Gateway when Sourcify returns 500', async () => {
      mockedAxios.get.mockRejectedValueOnce({ response: { status: 500 } }).mockResolvedValueOnce({
        data: {
          contractAbi: { abi: mockAbi },
        },
      })

      const result = await getAbi('0x123', mockChainInfo)

      expect(result).toEqual(mockAbi)
      expect(mockedAxios.get).toHaveBeenCalledTimes(2)
    })

    it('should fallback to Gateway when Sourcify times out', async () => {
      mockedAxios.get.mockRejectedValueOnce(new Error('timeout')).mockResolvedValueOnce({
        data: {
          contractAbi: { abi: mockAbi },
        },
      })

      const result = await getAbi('0x123', mockChainInfo)

      expect(result).toEqual(mockAbi)
      expect(mockedAxios.get).toHaveBeenCalledTimes(2)
    })

    it('should fallback when Sourcify response has no ABI field', async () => {
      mockedAxios.get
        .mockResolvedValueOnce({
          data: {
            match: 'exact_match',
            chainId: '1',
            address: '0x123',
          },
        })
        .mockResolvedValueOnce({
          data: {
            contractAbi: { abi: mockAbi },
          },
        })

      const result = await getAbi('0x123', mockChainInfo)

      expect(result).toEqual(mockAbi)
      expect(mockedAxios.get).toHaveBeenCalledTimes(2)
    })
  })

  describe('both providers fail', () => {
    it('should return null when both Sourcify and Gateway fail', async () => {
      mockedAxios.get
        .mockRejectedValueOnce({ response: { status: 404 } })
        .mockRejectedValueOnce({ response: { status: 404 } })

      const result = await getAbi('0x123', mockChainInfo)

      expect(result).toBeNull()
      expect(mockedAxios.get).toHaveBeenCalledTimes(2)
    })

    it('should return null when Gateway has no contractAbi', async () => {
      mockedAxios.get.mockRejectedValueOnce({ response: { status: 404 } }).mockResolvedValueOnce({
        data: {
          name: 'Some Contract',
        },
      })

      const result = await getAbi('0x123', mockChainInfo)

      expect(result).toBeNull()
    })
  })
})
