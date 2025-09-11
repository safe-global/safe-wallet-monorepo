import { render } from '@/tests/test-utils'
import TransferTxInfo from '.'
import {
  TransactionInfoType,
  TransactionStatus,
  TransactionTokenType,
  TransferDirection,
} from '@safe-global/safe-gateway-typescript-sdk'
import { faker } from '@faker-js/faker'
import { parseUnits } from 'ethers'
import { chainBuilder } from '@/tests/builders/chains'

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

describe('TransferTxInfo', () => {
  describe('should render non-malicious', () => {
    it('outgoing tx', () => {
      const recipient = faker.finance.ethereumAddress()
      const sender = faker.finance.ethereumAddress()
      const tokenAddress = faker.finance.ethereumAddress()

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
      expect(result.queryByLabelText('This token isn’t verified on major token lists', { exact: false })).toBeNull()
    })

    it('incoming tx', () => {
      const recipient = faker.finance.ethereumAddress()
      const sender = faker.finance.ethereumAddress()
      const tokenAddress = faker.finance.ethereumAddress()

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
      const recipient = faker.finance.ethereumAddress()
      const sender = faker.finance.ethereumAddress()
      const tokenAddress = faker.finance.ethereumAddress()

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
      const recipient = faker.finance.ethereumAddress()
      const sender = faker.finance.ethereumAddress()
      const tokenAddress = faker.finance.ethereumAddress()

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
      const recipient = faker.finance.ethereumAddress()
      const sender = faker.finance.ethereumAddress()
      const tokenAddress = faker.finance.ethereumAddress()

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
      const recipient = faker.finance.ethereumAddress()
      const sender = faker.finance.ethereumAddress()
      const tokenAddress = faker.finance.ethereumAddress()

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
      const recipient = faker.finance.ethereumAddress()
      const sender = faker.finance.ethereumAddress()
      const tokenAddress = faker.finance.ethereumAddress()

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
      expect(result.queryByLabelText('This token isn’t verified on major token lists', { exact: false })).toBeNull()
    })
  })
})
