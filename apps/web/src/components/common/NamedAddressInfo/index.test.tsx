import { render, waitFor } from '@/tests/test-utils'
import NamedAddressInfo from '.'
import { faker } from '@faker-js/faker'
import { getContract, type ChainInfo } from '@safe-global/safe-gateway-typescript-sdk'
import { shortenAddress } from '@safe-global/utils/utils/formatters'

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

describe('NamedAddressInfo', () => {
  const getContractMock = getContract as jest.Mock
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

  it('should not fetch contract info if the address is not a valid address', async () => {
    const address = faker.string.hexadecimal({ length: 64 })
    const result = render(<NamedAddressInfo address={address} />)
    expect(result.getByText(shortenAddress(address))).toBeVisible()
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
})
