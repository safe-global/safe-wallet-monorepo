import { faker } from '@faker-js/faker'
import { delay, http, HttpResponse } from 'msw'
import type { AddressInfo, TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { setBaseUrl } from '@safe-global/store/gateway/cgwClient'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { GATEWAY_URL } from '@/config/gateway'
import { server } from '@/tests/server'
import { connectedWalletBuilder } from '@/tests/builders/wallet'
import {
  multisigConfirmationBuilder,
  multisigExecutionDetailsBuilder,
  transactionDetailsBuilder,
} from '@/tests/builders/transactionDetails'
import { fakerChecksummedAddress, renderWithUserEvent, screen, waitFor, within } from '@/tests/test-utils'
import SignersTooltip from '.'

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
const TX_DETAILS_URL = `${GATEWAY_URL}/v1/chains/:chainId/transactions/:id`

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

const respondWith = (...responses: Array<TransactionDetails | 'error' | 'pending'>) => {
  const requests: Request[] = []
  server.use(
    http.get(TX_DETAILS_URL, async ({ request }) => {
      const response = responses[Math.min(requests.length, responses.length - 1)]
      requests.push(request)
      if (response === 'pending') {
        await delay('infinite')
      }
      if (response === 'error' || response === 'pending') {
        return new HttpResponse(null, { status: 500 })
      }
      return HttpResponse.json(response)
    }),
  )
  return requests
}

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
    setBaseUrl(GATEWAY_URL)
    mockUseWallet.mockReturnValue(null)
    mockResolveName.mockReturnValue('')
  })

  it('does not request the transaction details before the tooltip opens', () => {
    const requests = respondWith('pending')

    renderTooltip(1, 2)

    expect(requests).toHaveLength(0)
  })

  it('requests the details of the hovered transaction', async () => {
    const requests = respondWith('pending')
    const { user, trigger, txId } = renderTooltip(1, 2)

    await user.hover(trigger)

    await waitFor(() => expect(requests).toHaveLength(1))
    expect(new URL(requests[0].url).pathname).toBe(`/v1/chains/${CHAIN_ID}/transactions/${txId}`)
  })

  it('shows the header from the summary counts while the details load', async () => {
    respondWith('pending')
    const { user, trigger } = renderTooltip(2, 3)

    await user.hover(trigger)

    expect(await screen.findByText('2 of 3 signed · 1 more needed')).toBeInTheDocument()
    expect(screen.queryByTestId('signer-row')).not.toBeInTheDocument()
  })

  it('shows only the header when the details fail to load', async () => {
    const requests = respondWith('error')
    const { user, trigger } = renderTooltip(2, 3)

    await user.hover(trigger)

    expect(await screen.findByText('2 of 3 signed · 1 more needed')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('list', { busy: true })).not.toBeInTheDocument())
    expect(requests).toHaveLength(1)
    expect(screen.queryByTestId('signer-row')).not.toBeInTheDocument()
  })

  it('lists signed owners first, then unsigned owners', async () => {
    const [ana, jonas, max, lena] = [owner('Ana'), owner('Jonas'), owner('Max'), owner('Lena')]
    respondWith(detailsWith([ana, jonas, max, lena], [max, ana], 3))
    const { user, trigger } = renderTooltip(2, 3)

    await user.hover(trigger)

    expect(await screen.findByText('2 of 3 signed · 1 more from 2 signers')).toBeInTheDocument()
    expect(rowNames()).toEqual(['Ana', 'Max', 'Jonas', 'Lena'])
  })

  it('marks signed and unsigned owners', async () => {
    const [ana, max] = [owner('Ana'), owner('Max')]
    respondWith(detailsWith([ana, max], [ana], 2))
    const { user, trigger } = renderTooltip(1, 2)

    await user.hover(trigger)

    await screen.findByText('Ana')
    const [first, second] = screen.getAllByTestId('signer-row')
    expect(first).toHaveAttribute('data-signed', 'true')
    expect(within(first).getByLabelText('Signed')).toBeInTheDocument()
    expect(second).toHaveAttribute('data-signed', 'false')
    expect(within(second).getByLabelText('Not signed')).toBeInTheDocument()
  })

  it('says the threshold is met once enough owners signed', async () => {
    const [ana, max] = [owner('Ana'), owner('Max')]
    respondWith(detailsWith([ana, max], [ana], 1))
    const { user, trigger } = renderTooltip(1, 1)

    await user.hover(trigger)

    expect(await screen.findByText('1 of 1 signed · threshold met')).toBeInTheDocument()
  })

  it('uses the singular when a single signer is left', async () => {
    const [ana, max] = [owner('Ana'), owner('Max')]
    respondWith(detailsWith([ana, max], [ana], 2))
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
    respondWith(detailsWith([me, contact, known, anonymous], [], 2))
    const { user, trigger } = renderTooltip(0, 2)

    await user.hover(trigger)

    expect(await screen.findByText('0 of 2 signed · 2 more from 4 signers')).toBeInTheDocument()
    expect(rowNames()).toEqual(['You', 'Address book name', 'Gateway known', shortenAddress(anonymous.value)])
  })

  it('requests the details again and shows the new signer when the tooltip reopens', async () => {
    const [ana, max] = [owner('Ana'), owner('Max')]
    const requests = respondWith(detailsWith([ana, max], [ana], 2), detailsWith([ana, max], [ana, max], 2))
    const { user, trigger } = renderTooltip(1, 2)

    await user.hover(trigger)
    expect(await screen.findByText('1 of 2 signed · 1 more from 1 signer')).toBeInTheDocument()
    await user.unhover(trigger)
    await waitFor(() => expect(screen.queryByTestId('signer-row')).not.toBeInTheDocument())

    await user.hover(trigger)

    expect(await screen.findByText('2 of 2 signed · threshold met')).toBeInTheDocument()
    expect(requests).toHaveLength(2)
    expect(within(screen.getAllByTestId('signer-row')[1]).getByLabelText('Signed')).toBeInTheDocument()
  })
})
