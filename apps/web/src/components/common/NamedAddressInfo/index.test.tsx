import { render, waitFor, renderHook } from '@/tests/test-utils'
import NamedAddressInfo, { useAddressName } from '.'
import { faker } from '@faker-js/faker'
import { getContract, type ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { useWeb3ReadOnly } from '@/hooks/wallets/web3'
import useSafeAddress from '@/hooks/useSafeAddress'

const mockChainInfo = {
  chainId: '4',
  shortName: 'tst',
  blockExplorerUriTemplate: {
    address: 'https://test.scan.eth/{address}',
    api: 'https://test.scan.eth/',
    txHash: 'https://test.scan.eth/{txHash}',
  },
} as ChainInfo

jest.mock('@safe-global/safe-gateway-typescript-sdk', () => ({
  ...jest.requireActual('@safe-global/safe-gateway-typescript-sdk'),
  getContract: jest.fn(),
  __esModule: true,
}))

jest.mock('@/hooks/wallets/web3', () => ({
  useWeb3ReadOnly: jest.fn(),
}))

jest.mock('@/hooks/useSafeAddress', () => ({
  __esModule: true,
  default: jest.fn(),
}))

const mockWeb3ReadOnly = useWeb3ReadOnly as jest.Mock
const getContractMock = getContract as jest.Mock
const useSafeAddressMock = useSafeAddress as jest.Mock

const safeAddress = faker.finance.ethereumAddress()

describe('NamedAddressInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useSafeAddressMock.mockReturnValue(safeAddress)
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
            data: [mockChainInfo],
          },
        },
      },
    )

    expect(result.getByText('TestAddressName')).toBeVisible()
    expect(getContractMock).not.toHaveBeenCalled()
  })

  it('should fetch contract info if name / logo is not given', async () => {
    const address = faker.finance.ethereumAddress()
    getContractMock.mockResolvedValue({
      displayName: 'Resolved Test Name',
      name: 'ResolvedTestName',
      logoUri: 'https://img-resolved.test.safe.global',
    })
    const result = render(<NamedAddressInfo address={address} />, {
      initialReduxState: {
        chains: {
          loading: false,
          data: [mockChainInfo],
        },
      },
    })

    await waitFor(() => {
      expect(result.getByText('Resolved Test Name')).toBeVisible()
    })

    expect(getContractMock).toHaveBeenCalledWith('4', address)
  })

  it('should show "This Safe Account" when address matches Safe address', async () => {
    useSafeAddressMock.mockReturnValue(safeAddress)

    const result = render(<NamedAddressInfo address={safeAddress} />, {
      initialReduxState: {
        chains: {
          loading: false,
          data: [mockChainInfo],
        },
      },
    })

    expect(result.getByText('This Safe Account')).toBeVisible()
    expect(getContractMock).not.toHaveBeenCalled()
  })

  it('should not show "This Safe Account" for different addresses', async () => {
    const differentAddress = faker.finance.ethereumAddress()
    useSafeAddressMock.mockReturnValue(safeAddress)

    const result = render(<NamedAddressInfo address={differentAddress} />, {
      initialReduxState: {
        chains: {
          loading: false,
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
    mockWeb3ReadOnly.mockReturnValue({
      getCode: jest.fn().mockResolvedValue('0x'),
    })
    useSafeAddressMock.mockReturnValue(safeAddress)
  })

  it('should return name and logo from props if provided', async () => {
    const { result } = renderHook(() => useAddressName(address, 'Custom Name', 'custom-avatar.png'))

    expect(result.current).toEqual({
      name: 'Custom Name',
      logoUri: 'custom-avatar.png',
      isUnverifiedContract: false,
    })
    expect(getContractMock).not.toHaveBeenCalled()
  })

  it('should fetch and return contract info if no name provided', async () => {
    getContractMock.mockResolvedValue({
      displayName: 'Contract Display Name',
      name: 'ContractName',
      logoUri: 'contract-logo.png',
    })

    const { result } = renderHook(() => useAddressName(address))

    await waitFor(() => {
      expect(result.current).toEqual({
        name: 'Contract Display Name',
        logoUri: 'contract-logo.png',
        isUnverifiedContract: false,
      })
    })

    expect(getContractMock).toHaveBeenCalledWith('4', address)
  })

  it('should handle unverified contracts', async () => {
    getContractMock.mockRejectedValue(new Error('Contract not found'))
    mockWeb3ReadOnly.mockReturnValue({
      getCode: jest.fn().mockResolvedValue('0x123'), // Non-empty bytecode indicates a contract
    })

    const { result } = renderHook(() => useAddressName(address))

    await waitFor(() => {
      expect(result.current).toEqual({
        name: 'Unverified contract',
        logoUri: undefined,
        isUnverifiedContract: true,
      })
    })
  })

  it('should handle EOA addresses (not contracts)', async () => {
    getContractMock.mockRejectedValue(new Error('Contract not found'))
    mockWeb3ReadOnly.mockReturnValue({
      getCode: jest.fn().mockResolvedValue('0x'), // Empty bytecode indicates EOA
    })

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
    expect(getContractMock).not.toHaveBeenCalled()
  })

  it('should prioritize display name over contract name', async () => {
    getContractMock.mockResolvedValue({
      displayName: 'Display Name',
      name: 'Contract Name',
      logoUri: 'logo.png',
    })

    const { result } = renderHook(() => useAddressName(address))

    await waitFor(() => {
      expect(result.current.name).toBe('Display Name')
    })
  })

  it('should fallback to contract name if display name is not available', async () => {
    getContractMock.mockResolvedValue({
      name: 'Contract Name',
      logoUri: 'logo.png',
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
