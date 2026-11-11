import { faker } from '@faker-js/faker'
import type { AddressInfo, TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { connectedWalletBuilder } from '@/tests/builders/wallet'
import {
  multisigConfirmationBuilder,
  multisigExecutionDetailsBuilder,
  transactionDetailsBuilder,
} from '@/tests/builders/transactionDetails'
import { fakerChecksummedAddress, renderWithUserEvent, screen, within } from '@/tests/test-utils'
import SignersTooltip from '.'

type QueryResult = { data?: TransactionDetails; isLoading: boolean; isError: boolean }

const mockUseQuery = jest.fn<QueryResult, [{ chainId: string; id: string }]>()
jest.mock('@safe-global/store/gateway/AUTO_GENERATED/transactions', () => ({
  useTransactionsGetTransactionByIdV1Query: (args: { chainId: string; id: string }) => mockUseQuery(args),
}))

const mockUseWallet = jest.fn()
jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: () => mockUseWallet(),
}))

const mockResolveName = jest.fn<string, [string, string | undefined]>()
jest.mock('@/hooks/useAllAddressBooks', () => ({
  useSafeNameResolver: () => mockResolveName,
}))

const CHAIN_ID = '1'

const owner = (name: string | null = faker.person.firstName()): AddressInfo => ({
  value: fakerChecksummedAddress(),
  name,
})

const detailsWith = (signers: AddressInfo[], signed: AddressInfo[], confirmationsRequired: number) =>
  transactionDetailsBuilder()
    .with({
      detailedExecutionInfo: multisigExecutionDetailsBuilder()
        .with({
          signers,
          confirmationsRequired,
          confirmations: signed.map((signer) => multisigConfirmationBuilder().with({ signer }).build()),
        })
        .build(),
    })
    .build()

const renderTooltip = (submitted: number, required: number) => {
  const txId = faker.string.uuid()
  const view = renderWithUserEvent(
    <SignersTooltip chainId={CHAIN_ID} txId={txId} submitted={submitted} required={required}>
      <span>
        {submitted}/{required}
      </span>
    </SignersTooltip>,
  )
  return { ...view, txId, trigger: screen.getByText(`${submitted}/${required}`) }
}

const rowNames = () => screen.getAllByTestId('signer-row').map((row) => row.textContent)

describe('SignersTooltip', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseWallet.mockReturnValue(null)
    mockResolveName.mockReturnValue('')
  })

  it('does not fetch the transaction details until the tooltip opens', async () => {
    mockUseQuery.mockReturnValue({ isLoading: true, isError: false })
    const { user, trigger, txId } = renderTooltip(1, 2)

    expect(mockUseQuery).not.toHaveBeenCalled()

    await user.hover(trigger)

    expect(await screen.findByText('1 of 2 signed · 1 more needed')).toBeInTheDocument()
    expect(mockUseQuery).toHaveBeenCalledWith({ chainId: CHAIN_ID, id: txId })
  })

  it('shows the header from the summary counts while the details load', async () => {
    mockUseQuery.mockReturnValue({ isLoading: true, isError: false })
    const { user, trigger } = renderTooltip(2, 3)

    await user.hover(trigger)

    expect(await screen.findByText('2 of 3 signed · 1 more needed')).toBeInTheDocument()
    expect(screen.queryByTestId('signer-row')).not.toBeInTheDocument()
  })

  it('shows only the header when the details fail to load', async () => {
    mockUseQuery.mockReturnValue({ isLoading: false, isError: true })
    const { user, trigger } = renderTooltip(2, 3)

    await user.hover(trigger)

    expect(await screen.findByText('2 of 3 signed · 1 more needed')).toBeInTheDocument()
    expect(screen.queryByTestId('signer-row')).not.toBeInTheDocument()
  })

  it('lists signed owners first with a check mark and unsigned owners muted', async () => {
    const [ana, jonas, max, lena] = [owner('Ana'), owner('Jonas'), owner('Max'), owner('Lena')]
    mockUseQuery.mockReturnValue({
      data: detailsWith([ana, jonas, max, lena], [max, ana], 3),
      isLoading: false,
      isError: false,
    })
    const { user, trigger } = renderTooltip(2, 3)

    await user.hover(trigger)

    expect(await screen.findByText('2 of 3 signed · 1 more from 2 signers')).toBeInTheDocument()
    expect(rowNames()).toEqual(['Ana', 'Max', 'Jonas', 'Lena'])

    const [first, , third] = screen.getAllByTestId('signer-row')
    expect(first).toHaveAttribute('data-signed', 'true')
    expect(within(first).getByLabelText('Signed')).toBeInTheDocument()
    expect(third).toHaveAttribute('data-signed', 'false')
    expect(within(third).getByLabelText('Not signed')).toBeInTheDocument()
  })

  it('says the threshold is met once enough owners signed', async () => {
    const [ana, max] = [owner('Ana'), owner('Max')]
    mockUseQuery.mockReturnValue({ data: detailsWith([ana, max], [ana], 1), isLoading: false, isError: false })
    const { user, trigger } = renderTooltip(1, 1)

    await user.hover(trigger)

    expect(await screen.findByText('1 of 1 signed · threshold met')).toBeInTheDocument()
  })

  it('uses the singular when a single signer is left', async () => {
    const [ana, max] = [owner('Ana'), owner('Max')]
    mockUseQuery.mockReturnValue({ data: detailsWith([ana, max], [ana], 2), isLoading: false, isError: false })
    const { user, trigger } = renderTooltip(1, 2)

    await user.hover(trigger)

    expect(await screen.findByText('1 of 2 signed · 1 more from 1 signer')).toBeInTheDocument()
  })

  it('names the connected wallet "You", then address book, AddressInfo and shortened address', async () => {
    const me = owner('Me in the gateway')
    const contact = owner('Gateway name')
    const known = owner('Gateway known')
    const anonymous = owner(null)
    mockUseWallet.mockReturnValue(connectedWalletBuilder().with({ address: me.value.toLowerCase() }).build())
    mockResolveName.mockImplementation((address) => (address === contact.value ? 'Address book name' : ''))
    mockUseQuery.mockReturnValue({
      data: detailsWith([me, contact, known, anonymous], [], 2),
      isLoading: false,
      isError: false,
    })
    const { user, trigger } = renderTooltip(0, 2)

    await user.hover(trigger)

    expect(await screen.findByText('0 of 2 signed · 2 more from 4 signers')).toBeInTheDocument()
    expect(rowNames()).toEqual(['You', 'Address book name', 'Gateway known', shortenAddress(anonymous.value)])
    expect(mockResolveName).toHaveBeenCalledWith(contact.value, CHAIN_ID)
  })
})
