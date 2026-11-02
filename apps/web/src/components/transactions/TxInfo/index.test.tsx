import { faker } from '@faker-js/faker'
import type {
  CreationTransactionInfo,
  Erc20Transfer,
  Erc721Transfer,
  MultiSendTransactionInfo,
  SettingsChangeTransaction,
  TransferTransactionInfo,
} from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { render, screen } from '@/tests/test-utils'
import { chainBuilder } from '@/tests/builders/chains'
import { txInfoBuilder } from '@/tests/builders/safeTx'
import * as useChains from '@/hooks/useChains'
import TxInfo, { TransferTx } from '.'

const TOKEN_PLACEHOLDER = '/images/common/token-placeholder.svg'
const NFT_PLACEHOLDER = '/images/common/nft-placeholder.png'

const incoming = (transferInfo: TransferTransactionInfo['transferInfo']): TransferTransactionInfo => ({
  type: 'Transfer',
  sender: { value: faker.finance.ethereumAddress() },
  recipient: { value: faker.finance.ethereumAddress() },
  direction: 'INCOMING',
  transferInfo,
})

const erc20 = (overrides: Partial<Erc20Transfer>): Erc20Transfer => ({
  type: 'ERC20',
  tokenAddress: faker.finance.ethereumAddress(),
  value: '1000000000000000000000',
  tokenSymbol: 'QTRUST',
  decimals: 18,
  logoUri: faker.image.url(),
  imitation: false,
  ...overrides,
})

const erc721 = (overrides: Partial<Erc721Transfer>): Erc721Transfer => ({
  type: 'ERC721',
  tokenAddress: faker.finance.ethereumAddress(),
  tokenId: '6188',
  tokenSymbol: 'FLOWER',
  logoUri: faker.image.url(),
  ...overrides,
})

const tokenIcon = (symbol: string) => screen.getByTitle(symbol)

describe('TransferTx', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('shows an ERC-20 amount with its logo and the placeholder as fallback', () => {
    const transfer = erc20({})

    render(<TransferTx info={incoming(transfer)} />)

    expect(screen.getByText('1,000 QTRUST')).toBeInTheDocument()
    const icon = tokenIcon('QTRUST')
    expect(icon.getAttribute('srcdoc')).toContain(`src="${transfer.logoUri}"`)
    expect(icon.getAttribute('srcdoc')).toContain(TOKEN_PLACEHOLDER)
  })

  it('keeps a symbol with "$" and spaces as the label of the amount and the icon', () => {
    render(<TransferTx info={incoming(erc20({ value: '9283', decimals: 0, tokenSymbol: '$ ETH35.com' }))} />)

    expect(screen.getByText('9,283 $ ETH35.com')).toBeInTheDocument()
    expect(tokenIcon('$ ETH35.com')).toBeInTheDocument()
  })

  it('shows an ERC-20 amount without an icon when the token has no logo', () => {
    render(<TransferTx info={incoming(erc20({ logoUri: null }))} />)

    expect(screen.getByText('1,000 QTRUST')).toBeInTheDocument()
    expect(screen.queryByTitle('QTRUST')).not.toBeInTheDocument()
  })

  it('shows a native amount in the currency of the chain', () => {
    const chain = chainBuilder()
      .with({ nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18, logoUri: faker.image.url() } })
      .build()
    jest.spyOn(useChains, 'useCurrentChain').mockReturnValue(chain)

    render(<TransferTx info={incoming({ type: 'NATIVE_COIN', value: '18000000000000000' })} />)

    expect(screen.getByText('0.018 ETH')).toBeInTheDocument()
    expect(tokenIcon('ETH')).toBeInTheDocument()
  })

  it('shows one ERC-721 token with its ID and the NFT placeholder as fallback', () => {
    render(<TransferTx info={incoming(erc721({}))} />)

    expect(screen.getByText('1 FLOWER #6188')).toBeInTheDocument()
    expect(tokenIcon('FLOWER #6188').getAttribute('srcdoc')).toContain(NFT_PLACEHOLDER)
  })
})

describe('TxInfo', () => {
  const multiSend = (actionCount: number): MultiSendTransactionInfo => ({
    type: 'Custom',
    to: { value: faker.finance.ethereumAddress() },
    dataSize: '0',
    isCancellation: false,
    methodName: 'multiSend',
    actionCount,
  })

  it.each([
    [3, '3 actions'],
    [1, '1 action'],
  ])('shows a batch of %i as "%s"', (actionCount, label) => {
    render(<TxInfo info={multiSend(actionCount)} />)

    expect(screen.getByText(label)).toBeInTheDocument()
  })

  it('shows the method name of a contract call', () => {
    render(
      <TxInfo
        info={txInfoBuilder()
          .with({ methodName: 'approve', to: { value: faker.finance.ethereumAddress() } })
          .build()}
      />,
    )

    expect(screen.getByText('approve')).toBeInTheDocument()
  })

  it('shows the shortened creator of a Safe creation', () => {
    const creator = faker.finance.ethereumAddress()
    const creation: CreationTransactionInfo = {
      type: 'Creation',
      creator: { value: creator },
      transactionHash: faker.string.hexadecimal({ length: 64 }),
    }

    render(<TxInfo info={creation} />)

    expect(screen.getByText(`Created by ${creator.slice(0, 6)}...${creator.slice(-4)}`)).toBeInTheDocument()
  })

  it('shows the module name when a module is enabled', () => {
    const enableModule: SettingsChangeTransaction = {
      type: 'SettingsChange',
      dataDecoded: { method: 'enableModule', parameters: [] },
      settingsInfo: {
        type: 'ENABLE_MODULE',
        module: { value: faker.finance.ethereumAddress(), name: 'Allowance module' },
      },
    }

    render(<TxInfo info={enableModule} />)

    expect(screen.getByText('Allowance module')).toBeInTheDocument()
  })
})
