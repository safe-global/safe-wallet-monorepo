import {
  TransactionInfoType,
  TransactionStatus,
  TransactionTokenType,
  TransferDirection,
} from '@safe-global/store/gateway/types'
import { render } from '@/tests/test-utils'
import TransferTxInfo from '.'
import { faker } from '@faker-js/faker'
import { parseUnits } from 'ethers'
import { chainBuilder } from '@/tests/builders/chains'
import * as useTransferFiatValueModule from './useTransferFiatValue'

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  useChainId: () => '1',
  useChain: () => chainBuilder().with({ chainId: '1' }).build(),
  useCurrentChain: () => chainBuilder().with({ chainId: '1' }).build(),
  useHasFeature: () => false,
  default: () => ({
    loading: false,
    loaded: true,
    error: undefined,
    configs: [chainBuilder().with({ chainId: '1' }).build()],
  }),
}))

const addr = (): `0x${string}` => faker.finance.ethereumAddress() as `0x${string}`
const useTransferFiatValueSpy = jest.spyOn(useTransferFiatValueModule, 'default')

describe('TransferTxInfo', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useTransferFiatValueSpy.mockReturnValue(null)
  })

  describe('should render non-malicious', () => {
    it('outgoing tx', () => {
      const recipient = addr()
      const sender = addr()
      const tokenAddress = addr()

      const result = render(
        <TransferTxInfo
          imitation={false}
          trusted
          txInfo={{
            direction: TransferDirection.OUTGOING,
            recipient: { value: recipient },
            sender: { value: sender },
            type: TransactionInfoType.TRANSFER,
            transferInfo: {
              tokenAddress,
              trusted: true,
              type: TransactionTokenType.ERC20,
              decimals: 18,
              value: parseUnits('1', 18).toString(),
              tokenName: 'Test',
              tokenSymbol: 'TST',
              imitation: false,
            },
          }}
          txStatus={TransactionStatus.SUCCESS}
        />,
      )

      expect(result.getByText('1 TST')).toBeInTheDocument()
      expect(result.getByText(recipient)).toBeInTheDocument()
      expect(result.queryByText('malicious', { exact: false })).toBeNull()
      expect(
        result.queryByLabelText('This token isn\u2019t verified on major token lists', { exact: false }),
      ).toBeNull()
    })

    it('incoming tx', () => {
      const recipient = addr()
      const sender = addr()
      const tokenAddress = addr()

      const result = render(
        <TransferTxInfo
          imitation={false}
          trusted
          txInfo={{
            direction: TransferDirection.INCOMING,
            recipient: { value: recipient },
            sender: { value: sender },
            type: TransactionInfoType.TRANSFER,
            transferInfo: {
              tokenAddress,
              trusted: true,
              type: TransactionTokenType.ERC20,
              decimals: 18,
              value: parseUnits('12.34', 18).toString(),
              tokenName: 'Test',
              tokenSymbol: 'TST',
              imitation: false,
            },
          }}
          txStatus={TransactionStatus.SUCCESS}
        />,
      )

      expect(result.getByText('12.34 TST')).toBeInTheDocument()
      expect(result.getByText(sender)).toBeInTheDocument()
      expect(result.queryByText('malicious', { exact: false })).toBeNull()
      expect(result.queryByLabelText('This token isn’t verified on major token lists', { exact: false })).toBeNull()
    })
  })

  describe('should render untrusted', () => {
    it('outgoing tx', () => {
      const recipient = addr()
      const sender = addr()
      const tokenAddress = addr()

      const result = render(
        <TransferTxInfo
          imitation={false}
          trusted={false}
          txInfo={{
            direction: TransferDirection.OUTGOING,
            recipient: { value: recipient },
            sender: { value: sender },
            type: TransactionInfoType.TRANSFER,
            transferInfo: {
              tokenAddress,
              trusted: false,
              type: TransactionTokenType.ERC20,
              decimals: 18,
              value: parseUnits('1', 18).toString(),
              tokenName: 'Test',
              tokenSymbol: 'TST',
              imitation: false,
            },
          }}
          txStatus={TransactionStatus.SUCCESS}
        />,
      )

      expect(result.getByText('1 TST')).toBeInTheDocument()
      expect(result.getByText(recipient)).toBeInTheDocument()
      expect(result.queryByText('malicious', { exact: false })).toBeNull()
      expect(
        result.getByLabelText('This token isn’t verified on major token lists', { exact: false }),
      ).toBeInTheDocument()
    })

    it('incoming tx', () => {
      const recipient = addr()
      const sender = addr()
      const tokenAddress = addr()

      const result = render(
        <TransferTxInfo
          imitation={false}
          trusted={false}
          txInfo={{
            direction: TransferDirection.INCOMING,
            recipient: { value: recipient },
            sender: { value: sender },
            type: TransactionInfoType.TRANSFER,
            transferInfo: {
              tokenAddress,
              trusted: true,
              type: TransactionTokenType.ERC20,
              decimals: 18,
              value: parseUnits('12.34', 18).toString(),
              tokenName: 'Test',
              tokenSymbol: 'TST',
              imitation: false,
            },
          }}
          txStatus={TransactionStatus.SUCCESS}
        />,
      )

      expect(result.getByText('12.34 TST')).toBeInTheDocument()
      expect(result.getByText(sender)).toBeInTheDocument()
      expect(result.queryByText('malicious', { exact: false })).toBeNull()
      expect(
        result.queryByLabelText('This token isn’t verified on major token lists', { exact: false }),
      ).toBeInTheDocument()
    })
  })

  describe('should render imitations', () => {
    it('outgoing tx', () => {
      const recipient = addr()
      const sender = addr()
      const tokenAddress = addr()

      const result = render(
        <TransferTxInfo
          imitation
          trusted
          txInfo={{
            direction: TransferDirection.OUTGOING,
            recipient: { value: recipient },
            sender: { value: sender },
            type: TransactionInfoType.TRANSFER,
            transferInfo: {
              tokenAddress,
              trusted: true,
              type: TransactionTokenType.ERC20,
              decimals: 18,
              value: parseUnits('1', 18).toString(),
              tokenName: 'Test',
              tokenSymbol: 'TST',
              imitation: true,
            },
          }}
          txStatus={TransactionStatus.SUCCESS}
        />,
      )

      expect(result.getByText('1 TST')).toBeInTheDocument()
      expect(result.getByText(recipient)).toBeInTheDocument()
      expect(result.getByText('malicious', { exact: false })).toBeInTheDocument()
      expect(result.queryByLabelText('This token isn’t verified on major token lists', { exact: false })).toBeNull()
    })

    it('incoming tx', () => {
      const recipient = addr()
      const sender = addr()
      const tokenAddress = addr()

      const result = render(
        <TransferTxInfo
          imitation
          trusted
          txInfo={{
            direction: TransferDirection.INCOMING,
            recipient: { value: recipient },
            sender: { value: sender },
            type: TransactionInfoType.TRANSFER,
            transferInfo: {
              tokenAddress,
              trusted: true,
              type: TransactionTokenType.ERC20,
              decimals: 18,
              value: parseUnits('12.34', 18).toString(),
              tokenName: 'Test',
              tokenSymbol: 'TST',
              imitation: true,
            },
          }}
          txStatus={TransactionStatus.SUCCESS}
        />,
      )

      expect(result.getByText('12.34 TST')).toBeInTheDocument()
      expect(result.getByText(sender)).toBeInTheDocument()
      expect(result.getByText('malicious', { exact: false })).toBeInTheDocument()
      expect(result.queryByLabelText('This token isn’t verified on major token lists', { exact: false })).toBeNull()
    })

    it('untrusted and imitation tx', () => {
      const recipient = addr()
      const sender = addr()
      const tokenAddress = addr()

      const result = render(
        <TransferTxInfo
          imitation
          trusted={false}
          txInfo={{
            direction: TransferDirection.INCOMING,
            recipient: { value: recipient },
            sender: { value: sender },
            type: TransactionInfoType.TRANSFER,
            transferInfo: {
              tokenAddress,
              trusted: true,
              type: TransactionTokenType.ERC20,
              decimals: 18,
              value: parseUnits('12.34', 18).toString(),
              tokenName: 'Test',
              tokenSymbol: 'TST',
              imitation: true,
            },
          }}
          txStatus={TransactionStatus.SUCCESS}
        />,
      )

      expect(result.getByText('12.34 TST')).toBeInTheDocument()
      expect(result.getByText(sender)).toBeInTheDocument()
      expect(result.getByText('malicious', { exact: false })).toBeInTheDocument()
      expect(result.queryByLabelText("This token isn't verified on major token lists", { exact: false })).toBeNull()
    })
  })

  describe('fiat value display', () => {
    it('should show fiat value when useTransferFiatValue returns a value', () => {
      useTransferFiatValueSpy.mockReturnValue(1000)

      const recipient = addr()
      const sender = addr()
      const tokenAddress = addr()

      const result = render(
        <TransferTxInfo
          imitation={false}
          trusted
          txInfo={{
            direction: TransferDirection.OUTGOING,
            recipient: { value: recipient },
            sender: { value: sender },
            type: TransactionInfoType.TRANSFER,
            transferInfo: {
              tokenAddress,
              trusted: true,
              type: TransactionTokenType.ERC20,
              decimals: 18,
              value: parseUnits('1', 18).toString(),
              tokenName: 'Test',
              tokenSymbol: 'TST',
              imitation: false,
            },
          }}
          txStatus={TransactionStatus.SUCCESS}
        />,
      )

      // FiatValue renders a Tooltip span with aria-label containing formatted currency
      expect(result.getByLabelText('$ 1,000.00')).toBeInTheDocument()
    })

    it('should not show fiat value when useTransferFiatValue returns null', () => {
      useTransferFiatValueSpy.mockReturnValue(null)

      const recipient = addr()
      const sender = addr()
      const tokenAddress = addr()

      const result = render(
        <TransferTxInfo
          imitation={false}
          trusted
          txInfo={{
            direction: TransferDirection.OUTGOING,
            recipient: { value: recipient },
            sender: { value: sender },
            type: TransactionInfoType.TRANSFER,
            transferInfo: {
              tokenAddress,
              trusted: true,
              type: TransactionTokenType.ERC20,
              decimals: 18,
              value: parseUnits('1', 18).toString(),
              tokenName: 'Test',
              tokenSymbol: 'TST',
              imitation: false,
            },
          }}
          txStatus={TransactionStatus.SUCCESS}
        />,
      )

      expect(result.queryByLabelText(/^\$/)).not.toBeInTheDocument()
    })

    it('should show a different fiat value when hook returns a different amount', () => {
      useTransferFiatValueSpy.mockReturnValue(500)

      const recipient = addr()
      const sender = addr()
      const tokenAddress = addr()

      const result = render(
        <TransferTxInfo
          imitation={false}
          trusted
          txInfo={{
            direction: TransferDirection.OUTGOING,
            recipient: { value: recipient },
            sender: { value: sender },
            type: TransactionInfoType.TRANSFER,
            transferInfo: {
              tokenAddress,
              trusted: true,
              type: TransactionTokenType.ERC20,
              decimals: 18,
              value: parseUnits('5', 18).toString(),
              tokenName: 'Test',
              tokenSymbol: 'TST',
              imitation: false,
            },
          }}
          txStatus={TransactionStatus.SUCCESS}
        />,
      )

      expect(result.getByLabelText('$ 500.00')).toBeInTheDocument()
    })
  })
})
