import { render, waitFor, renderHook } from '@/tests/test-utils'
import NamedAddressInfo, { useAddressName } from '.'
import { faker } from '@faker-js/faker'
import type { ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import useSafeAddress from '@/hooks/useSafeAddress'
import { useGetContractQuery } from '@/store/api/gateway'

const mockChainInfo = {
  chainId: '4',
  shortName: 'tst',
  blockExplorerUriTemplate: {
    address: 'https://test.scan.eth/{address}',
    api: 'https://test.scan.eth/',
    txHash: 'https://test.scan.eth/{txHash}',
  },
  features: [],
} as unknown as ChainInfo

jest.mock('@/store/api/gateway', () => ({
  useGetContractQuery: jest.fn(),
  gatewayApi: {
    reducerPath: 'gatewayApi',
    reducer: () => ({}),
    middleware: () => (next: any) => (action: any) => next(action),
  },
}))

jest.mock('@/hooks/useSafeAddress', () => ({
  __esModule: true,
  default: jest.fn(),
}))

const useGetContractQueryMock = useGetContractQuery as jest.Mock
const useSafeAddressMock = useSafeAddress as jest.Mock

const safeAddress = faker.finance.ethereumAddress()

describe('NamedAddressInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useSafeAddressMock.mockReturnValue(safeAddress)
    useGetContractQueryMock.mockReturnValue({})
  })

  it('should not fetch contract info if name / logo is given', async () => {
    const result = render(
      <NamedAddressInfo
        address={faker.finance.ethereumAddress()}
        name="TestAddressName"
        customAvatar="https://img.test.safe.global"
      />,
      {
        initialReduxState: {
          chains: {
            loading: false,
            loaded: true,
            data: [mockChainInfo],
          },
        },
      },
    )

    expect(result.getByText('TestAddressName')).toBeVisible()
    expect(useGetContractQueryMock.mock.calls.every(([, opts]: any) => opts.skip)).toBe(true)
  })

  it('should not fetch contract info if the address is not a valid address', async () => {
    const address = faker.string.hexadecimal({ length: 64 })
    const result = render(<NamedAddressInfo address={address} />)
    expect(result.getByText(shortenAddress(address))).toBeVisible()
    expect(useGetContractQueryMock.mock.calls.every(([, opts]: any) => opts.skip)).toBe(true)
  })

  it('should fetch contract info if name / logo is not given', async () => {
    const address = faker.finance.ethereumAddress()
    useGetContractQueryMock.mockReturnValue({
      data: {
        displayName: 'Resolved Test Name',
        name: 'ResolvedTestName',
        logoUri: 'https://img-resolved.test.safe.global',
      },
    })
    const result = render(<NamedAddressInfo address={address} />, {
      initialReduxState: {
        chains: {
          loading: false,
          loaded: true,
          data: [mockChainInfo],
        },
      },
    })

    await waitFor(() => {
      expect(result.getByText('Resolved Test Name')).toBeVisible()
    })

    expect(useGetContractQueryMock).toHaveBeenCalledWith({ chainId: '4', contractAddress: address }, { skip: false })
  })

  it('should show "This Safe Account" when address matches Safe address', async () => {
    useSafeAddressMock.mockReturnValue(safeAddress)

    const result = render(<NamedAddressInfo address={safeAddress} />, {
      initialReduxState: {
        chains: {
          loading: false,
          loaded: true,
          data: [mockChainInfo],
        },
      },
    })

    expect(result.getByText('This Safe Account')).toBeVisible()
    expect(useGetContractQueryMock.mock.calls.every(([, opts]: any) => opts.skip)).toBe(true)
  })

  it('should not show "This Safe Account" for different addresses', async () => {
    const differentAddress = faker.finance.ethereumAddress()
    useSafeAddressMock.mockReturnValue(safeAddress)

    const result = render(<NamedAddressInfo address={differentAddress} />, {
      initialReduxState: {
        chains: {
          loading: false,
          loaded: true,
          data: [mockChainInfo],
        },
      },
    })

    expect(result.queryByText('This Safe Account')).not.toBeInTheDocument()
  })
})

describe('useAddressName', () => {
  const address = faker.finance.ethereumAddress()

  beforeEach(() => {
    jest.clearAllMocks()
    useSafeAddressMock.mockReturnValue(safeAddress)
    useGetContractQueryMock.mockReturnValue({})
  })

  it('should return name and logo from props if provided', async () => {
    const { result } = renderHook(() => useAddressName(address, 'Custom Name', 'custom-avatar.png'))

    expect(result.current).toEqual({
      name: 'Custom Name',
      logoUri: 'custom-avatar.png',
      isUnverifiedContract: false,
    })
    expect(useGetContractQueryMock.mock.calls.every(([, opts]: any) => opts.skip)).toBe(true)
  })

  it('should fetch and return contract info if no name provided', async () => {
    useGetContractQueryMock.mockReturnValue({
      data: {
        displayName: 'Contract Display Name',
        name: 'ContractName',
        logoUri: 'contract-logo.png',
        contractAbi: {},
      },
    })

    const { result } = renderHook(() => useAddressName(address))

    await waitFor(() => {
      expect(result.current).toEqual({
        name: 'Contract Display Name',
        logoUri: 'contract-logo.png',
        isUnverifiedContract: false,
      })
    })

    expect(useGetContractQueryMock).toHaveBeenCalledWith({ chainId: '4', contractAddress: address }, { skip: false })
  })

  it('should mark contract without ABI as unverified', async () => {
    useGetContractQueryMock.mockReturnValue({
      data: {
        displayName: 'Contract Display Name',
        name: 'ContractName',
        logoUri: 'contract-logo.png',
        contractAbi: null,
      },
    })

    const { result } = renderHook(() => useAddressName(address))

    await waitFor(() => {
      expect(result.current).toEqual({
        name: 'Contract Display Name',
        logoUri: 'contract-logo.png',
        isUnverifiedContract: true,
      })
    })
  })

  it('should treat contract lookup errors as verified (not indexed)', async () => {
    useGetContractQueryMock.mockReturnValue({ error: new Error('Contract not found') })

    const { result } = renderHook(() => useAddressName(address))

    await waitFor(() => {
      expect(result.current).toEqual({
        name: undefined,
        logoUri: undefined,
        isUnverifiedContract: false,
      })
    })
  })

  it('should handle undefined address', () => {
    const { result } = renderHook(() => useAddressName(undefined))

    expect(result.current).toEqual({
      name: undefined,
      logoUri: undefined,
      isUnverifiedContract: false,
    })
    expect(useGetContractQueryMock.mock.calls.every(([, opts]: any) => opts.skip)).toBe(true)
  })

  it('should prioritize display name over contract name', async () => {
    useGetContractQueryMock.mockReturnValue({
      data: {
        displayName: 'Display Name',
        name: 'Contract Name',
        logoUri: 'logo.png',
      },
    })

    const { result } = renderHook(() => useAddressName(address))

    await waitFor(() => {
      expect(result.current.name).toBe('Display Name')
    })
  })

  it('should fallback to contract name if display name is not available', async () => {
    useGetContractQueryMock.mockReturnValue({
      data: {
        name: 'Contract Name',
        logoUri: 'logo.png',
      },
    })

    const { result } = renderHook(() => useAddressName(address))

    await waitFor(() => {
      expect(result.current.name).toBe('Contract Name')
    })
  })

  it('should return "This Safe Account" when address matches Safe address', async () => {
    const { result } = renderHook(() => useAddressName(safeAddress))

    expect(result.current).toEqual({
      name: 'This Safe Account',
      logoUri: undefined,
      isUnverifiedContract: false,
    })
  })
})
