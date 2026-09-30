import { configureStore } from '@reduxjs/toolkit'
import { faker } from '@faker-js/faker'
import { TokenType } from '@safe-global/store/gateway/types'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { web3API } from './signersBalance'

const mockCreateWeb3ReadOnly = jest.fn()
jest.mock('../services/web3', () => ({
  createWeb3ReadOnly: (...args: unknown[]) => mockCreateWeb3ReadOnly(...args),
}))

const mockErc20Connect = jest.fn()
const mockErc721Connect = jest.fn()
jest.mock('@safe-global/utils/types/contracts', () => ({
  ERC20__factory: { connect: (...args: unknown[]) => mockErc20Connect(...args) },
  ERC721__factory: { connect: (...args: unknown[]) => mockErc721Connect(...args) },
}))

const chain = { chainId: '1' } as Chain

const createStore = () =>
  configureStore({
    reducer: { [web3API.reducerPath]: web3API.reducer },
    middleware: (gdm) => gdm({ serializableCheck: false }).concat(web3API.middleware),
  })

const fetchTokenInfos = (addresses: string[]) =>
  createStore().dispatch(web3API.endpoints.getErc20TokenInfos.initiate({ addresses, chain }))

describe('getErc20TokenInfos', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateWeb3ReadOnly.mockReturnValue({})
  })

  it('resolves ERC-20 metadata keyed by lowercased address', async () => {
    const address = faker.finance.ethereumAddress().toUpperCase().replace('0X', '0x')
    mockErc20Connect.mockReturnValue({ decimals: async () => 6n, symbol: async () => 'USDC' })

    const { data } = await fetchTokenInfos([address])

    expect(data).toEqual({
      [address.toLowerCase()]: { address, decimals: 6, symbol: 'USDC', type: TokenType.ERC20 },
    })
  })

  it('falls back to ERC-721 detection when decimals() reverts', async () => {
    const address = faker.finance.ethereumAddress()
    mockErc20Connect.mockReturnValue({
      decimals: async () => {
        throw new Error('revert')
      },
      symbol: async () => 'ignored',
    })
    mockErc721Connect.mockReturnValue({ supportsInterface: async () => true, symbol: async () => 'NFT' })

    const { data } = await fetchTokenInfos([address])

    expect(data).toEqual({
      [address.toLowerCase()]: { address, decimals: 0, symbol: 'NFT', type: TokenType.ERC721 },
    })
  })

  it('omits contracts that are neither ERC-20 nor ERC-721', async () => {
    const address = faker.finance.ethereumAddress()
    mockErc20Connect.mockReturnValue({
      decimals: async () => {
        throw new Error('revert')
      },
      symbol: async () => 'ignored',
    })
    mockErc721Connect.mockReturnValue({
      supportsInterface: async () => {
        throw new Error('no ERC165')
      },
      symbol: async () => '',
    })

    const { data } = await fetchTokenInfos([address])

    expect(data).toEqual({})
  })

  it('errors when no provider can be created', async () => {
    mockCreateWeb3ReadOnly.mockReturnValue(undefined)

    const result = await fetchTokenInfos([faker.finance.ethereumAddress()])

    expect(result.isError).toBe(true)
  })
})
