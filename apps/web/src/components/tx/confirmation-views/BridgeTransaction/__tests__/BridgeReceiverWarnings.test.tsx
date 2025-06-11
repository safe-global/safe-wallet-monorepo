import { render, waitFor } from '@/tests/test-utils'
import { BridgeReceiverWarnings } from '../BridgeReceiverWarnings'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import * as useSafeInfoHook from '@/hooks/useSafeInfo'
import * as useChainsHook from '@/hooks/useChains'
import * as useSafeCreationDataHook from '@/features/multichain/hooks/useSafeCreationData'
import { type BridgeAndSwapTransactionInfo } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { chainBuilder } from '@/tests/builders/chains'
import { type ReplayedSafeProps } from '@safe-global/utils/features/counterfactual/store/types'
import { type AsyncResult } from '@safe-global/utils/hooks/useAsync'
import * as useSafesGetSafeV1QueryHook from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import * as useAddressBookHook from '@/hooks/useAddressBook'
import { faker } from '@faker-js/faker'

const mockSafeInfo = extendedSafeInfoBuilder().build()
const mockSourceChain = chainBuilder().with({ chainId: '1', chainName: 'Ethereum' }).build()
const mockDestinationChain = chainBuilder().with({ chainId: '100', chainName: 'Gnosis Chain' }).build()
const mockUnsupportedChain = chainBuilder().with({ chainId: '999', chainName: 'Unsupported Chain' }).build()

const mockTxInfo: BridgeAndSwapTransactionInfo = {
  type: 'SwapAndBridge',
  humanDescription: null,
  fromToken: {
    address: '0x0000000000000000000000000000000000000000',
    name: 'Ether',
    symbol: 'ETH',
    decimals: 18,
    logoUri: '',
    trusted: true,
  },
  recipient: { value: mockSafeInfo.address.value },
  explorerUrl: null,
  status: 'PENDING',
  substatus: 'WAIT_SOURCE_CONFIRMATIONS',
  fees: null,
  fromAmount: '1000000000000000000',
  toChain: mockDestinationChain.chainId,
  toToken: null,
  toAmount: null,
}

describe('BridgeReceiverWarnings', () => {
  beforeEach(() => {
    jest.spyOn(useSafeInfoHook, 'default').mockImplementation(() => ({
      safe: mockSafeInfo,
      safeAddress: mockSafeInfo.address.value,
      safeError: undefined,
      safeLoading: false,
      safeLoaded: true,
    }))

    jest.spyOn(useChainsHook, 'default').mockImplementation(() => ({
      configs: [mockSourceChain, mockDestinationChain],
      error: undefined,
      loading: false,
    }))

    jest
      .spyOn(useSafeCreationDataHook, 'useSafeCreationData')
      .mockImplementation(() => [undefined, undefined, false] as AsyncResult<ReplayedSafeProps>)

    jest.spyOn(useSafesGetSafeV1QueryHook, 'useSafesGetSafeV1Query').mockImplementation(() => ({
      data: undefined,
      error: undefined,
      isLoading: false,
      isError: false,
      isSuccess: false,
      isFetching: false,
      refetch: jest.fn(),
    }))

    jest.spyOn(useAddressBookHook, 'default').mockImplementation(() => ({}))
  })

  it('should not show warning when bridging to same address with same setup', async () => {
    jest.spyOn(useSafesGetSafeV1QueryHook, 'useSafesGetSafeV1Query').mockImplementation(() => ({
      data: {
        ...mockSafeInfo,
        owners: mockSafeInfo.owners,
        threshold: mockSafeInfo.threshold,
      },
      error: undefined,
      isLoading: false,
      isError: false,
      isSuccess: true,
      isFetching: false,
      refetch: jest.fn(),
    }))

    const { container } = render(<BridgeReceiverWarnings txInfo={mockTxInfo} />)
    await waitFor(() => {
      expect(container).toBeEmptyDOMElement()
    })
  })

  it('should show warning when bridging to same address with different setup', async () => {
    jest
      .spyOn(useSafeCreationDataHook, 'useSafeCreationData')
      .mockImplementation(() => [undefined, undefined, false] as AsyncResult<ReplayedSafeProps>)

    jest.spyOn(useSafesGetSafeV1QueryHook, 'useSafesGetSafeV1Query').mockImplementation(() => ({
      data: {
        ...mockSafeInfo,
        owners: [{ value: faker.finance.ethereumAddress() }],
        threshold: 1,
      },
      error: undefined,
      isLoading: false,
      isError: false,
      isSuccess: true,
      isFetching: false,
      refetch: jest.fn(),
    }))

    const { getByText } = render(<BridgeReceiverWarnings txInfo={mockTxInfo} />)
    await waitFor(() => {
      expect(getByText('Different Safe setup on target chain')).toBeInTheDocument()
      expect(
        getByText(
          'Your Safe exists on the target chain but with a different configuration. Review carefully before proceeding. Funds sent may be inaccessible if the setup is incorrect.',
        ),
      ).toBeInTheDocument()
    })
  })

  it('should show error when Safe does not support adding networks', async () => {
    jest
      .spyOn(useSafeCreationDataHook, 'useSafeCreationData')
      .mockImplementation(() => [undefined, new Error('Not supported'), false] as AsyncResult<ReplayedSafeProps>)

    const { getByText } = render(<BridgeReceiverWarnings txInfo={mockTxInfo} />)
    await waitFor(() => {
      expect(getByText('Incompatible Safe version')).toBeInTheDocument()
      expect(
        getByText(
          'This Safe account cannot add new networks. You will not be able to claim ownership of the same address on other networks. Funds sent may be inaccessible.',
        ),
      ).toBeInTheDocument()
    })
  })

  it('should show warning when Safe is not deployed on destination chain', async () => {
    jest.spyOn(useSafeCreationDataHook, 'useSafeCreationData').mockImplementation(
      () =>
        [
          {
            factoryAddress: faker.finance.ethereumAddress(),
            safeVersion: '1.3.0',
            masterCopy: faker.finance.ethereumAddress(),
            safeAccountConfig: {
              owners: [mockSafeInfo.owners[0].value],
              threshold: mockSafeInfo.threshold,
              fallbackHandler: faker.finance.ethereumAddress(),
              to: faker.finance.ethereumAddress(),
              data: faker.finance.ethereumAddress(),
              paymentReceiver: faker.finance.ethereumAddress(),
            },
            saltNonce: '0',
          },
          undefined,
          false,
        ] as AsyncResult<ReplayedSafeProps>,
    )

    jest.spyOn(useSafesGetSafeV1QueryHook, 'useSafesGetSafeV1Query').mockImplementation(() => ({
      data: undefined,
      error: undefined,
      isLoading: false,
      isError: false,
      isSuccess: true,
      isFetching: false,
      refetch: jest.fn(),
    }))

    const { getByText } = render(<BridgeReceiverWarnings txInfo={mockTxInfo} />)
    await waitFor(() => {
      expect(getByText('No ownership on target chain')).toBeInTheDocument()
      expect(
        getByText(
          'This Safe account is not activated on the target chain. First, create the Safe, execute a test transaction, and then proceed with bridging. Funds sent may be inaccessible.',
        ),
      ).toBeInTheDocument()
    })
  })

  it('should show warning when bridging to different address not in address book', async () => {
    const differentAddressTxInfo = {
      ...mockTxInfo,
      recipient: { value: '0x0000000000000000000000000000000000000001' },
    }

    const { getByText } = render(<BridgeReceiverWarnings txInfo={differentAddressTxInfo} />)
    await waitFor(() => {
      expect(getByText('Unknown address')).toBeInTheDocument()
      expect(
        getByText(
          'The receiver is not a Safe you own or a known recipient in your address book. If this address is incorrect, your funds could be lost permanently.',
        ),
      ).toBeInTheDocument()
    })
  })

  it('should not show warning when bridging to different address in address book', async () => {
    const differentAddressTxInfo = {
      ...mockTxInfo,
      recipient: { value: '0x0000000000000000000000000000000000000001' },
    }

    jest.spyOn(useAddressBookHook, 'default').mockImplementation((chainId) => {
      if (chainId === mockDestinationChain.chainId) {
        return {
          [differentAddressTxInfo.recipient.value]: 'Test Address',
        }
      }
      return {}
    })

    const { container } = render(<BridgeReceiverWarnings txInfo={differentAddressTxInfo} />)
    await waitFor(() => {
      expect(container).toBeEmptyDOMElement()
    })
  })

  it('should show error when bridging to unsupported chain', async () => {
    const unsupportedChainTxInfo = {
      ...mockTxInfo,
      toChain: mockUnsupportedChain.chainId,
    }

    const { getByText } = render(<BridgeReceiverWarnings txInfo={unsupportedChainTxInfo} />)
    await waitFor(() => {
      expect(getByText('The target network is not supported')).toBeInTheDocument()
      expect(
        getByText(
          'app.safe.global does not support the network. Unless you have a wallet deployed there, we recommend not to bridge. Funds sent may be inaccessible.',
        ),
      ).toBeInTheDocument()
    })
  })
})
