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
import type { QueueStatus } from '@safe-global/views/features/spaces/components/SpaceQueue/types'
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

let mockLinkedWallets: string[] = []
jest.mock('../../../hooks/useSignerWallets', () => ({
  useSignerWallets: () =>
    new Set(
      [...mockLinkedWallets, mockUseWallet()?.address]
        .filter((address): address is string => Boolean(address))
        .map((address) => address.toLowerCase()),
    ),
}))

jest.mock('@/hooks/useSafeDisplayName', () => ({ useSafeDisplayName: () => 'Treasury' }))

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
      if (response === 'pending') await delay('infinite')
      if (response === 'error' || response === 'pending') return new HttpResponse(null, { status: 500 })
      return HttpResponse.json(response)
    }),
  )
  return requests
}

const SAFE_ADDRESS = fakerChecksummedAddress()

type RenderOptions = { status?: QueueStatus; nonce?: number; nextNonce?: number }

const renderTooltip = (
  submitted: number,
  required: number,
  { status = 'waiting', nonce = 5, nextNonce = 5 }: RenderOptions = {},
) => {
  const txId = faker.string.uuid()
  const view = renderWithUserEvent(
    <SignersTooltip
      chainId={CHAIN_ID}
      txId={txId}
      safeAddress={SAFE_ADDRESS}
      status={status}
      nonce={nonce}
      nextNonce={nextNonce}
      submitted={submitted}
      required={required}
    />,
  )
  return { ...view, txId, trigger: screen.getByRole('button') }
}

const connect = (address: string) =>
  mockUseWallet.mockReturnValue(connectedWalletBuilder().with({ address: address.toLowerCase() }).build())

const gaugeTone = (trigger: HTMLElement) => trigger.querySelector('svg')?.getAttribute('data-tone')

const rowNames = () => screen.getAllByTestId('signer-row').map((row) => row.textContent)

describe('SignersTooltip', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setBaseUrl(GATEWAY_URL)
    mockUseWallet.mockReturnValue(null)
    mockLinkedWallets = []
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
  describe('status', () => {
    it.each<[QueueStatus, string]>([
      ['sign', 'success'],
      ['execute', 'success'],
      ['waiting', 'warning'],
      ['blocked', 'warning'],
    ])('colours the gauge of a "%s" row %s', (status, tone) => {
      respondWith('pending')
      const { trigger } = renderTooltip(1, 2, { status })

      expect(gaugeTone(trigger)).toBe(tone)
    })

    it.each<[QueueStatus, number, string]>([
      ['sign', 0, 'Ready to sign. 0 of 2 signatures'],
      ['execute', 2, 'Ready to execute. 2 of 2 signatures'],
      ['waiting', 1, 'Waiting on others. 1 of 2 signatures'],
      ['blocked', 2, 'Blocked by #4. 2 of 2 signatures'],
    ])('names a "%s" gauge by its status and count', (status, submitted, label) => {
      respondWith('pending')
      renderTooltip(submitted, 2, { status, nonce: 6, nextNonce: 4 })

      expect(screen.getByRole('button', { name: label })).toBeInTheDocument()
    })

    it('uses the singular for a single required signature', () => {
      respondWith('pending')
      renderTooltip(0, 1, { status: 'sign' })

      expect(screen.getByRole('button', { name: 'Ready to sign. 0 of 1 signature' })).toBeInTheDocument()
    })

    it('opens on keyboard focus', async () => {
      respondWith('pending')
      const { user, trigger } = renderTooltip(0, 2, { status: 'sign' })

      await user.tab()

      expect(trigger).toHaveFocus()
      expect(await screen.findByText('Needs your signature. Sign it.')).toBeInTheDocument()
    })

    it.each<[string, QueueStatus, number, RenderOptions, string, string]>([
      ['the user can sign', 'sign', 0, {}, 'Ready to sign', 'Needs your signature. Sign it.'],
      ['the user signs last', 'sign', 1, {}, 'Ready to sign', 'Yours is the last signature needed.'],
      [
        'the user can sign ahead',
        'sign',
        0,
        { nonce: 7, nextNonce: 5 },
        'Ready to sign',
        'Executes after #5. You can sign this now.',
      ],
      ['it can execute', 'execute', 2, {}, 'Ready to execute', 'Fully signed and next in line. Execute it.'],
      ['it is blocked', 'blocked', 2, { nonce: 7, nextNonce: 5 }, 'Blocked by #5', 'Fully signed. Executes after #5.'],
      ['it waits on others', 'waiting', 1, {}, 'Waiting on others', 'Waiting on 1 more signature.'],
    ])('shows the title and the next step when %s', async (_, status, submitted, options, title, hint) => {
      respondWith('pending')
      const { user, trigger } = renderTooltip(submitted, 2, { status, ...options })

      await user.hover(trigger)

      expect(await screen.findByText(title)).toBeInTheDocument()
      expect(screen.getByText(hint)).toBeInTheDocument()
    })

    it('names who it waits on once the details load', async () => {
      const [ana, max, lena] = [owner('Ana'), owner('Max'), owner('Lena')]
      respondWith(detailsWith([ana, max, lena], [lena], 2))
      const { user, trigger } = renderTooltip(1, 2)

      await user.hover(trigger)

      expect(await screen.findByText('Waiting on 1 more from Ana and Max.')).toBeInTheDocument()
    })

    it('lists the user first, signed or not', async () => {
      const [ana, max, me] = [owner('Ana'), owner('Max'), owner('Me')]
      connect(me.value)
      respondWith(detailsWith([ana, max, me], [max], 2))
      const { user, trigger } = renderTooltip(1, 2, { status: 'sign' })

      await user.hover(trigger)

      await screen.findByText('You')
      expect(rowNames()).toEqual(['You', 'Max', 'Ana'])
    })

    it('says fully signed rather than waiting on no one', async () => {
      const [ana, max] = [owner('Ana'), owner('Max')]
      respondWith(detailsWith([ana, max], [ana, max], 2))
      const { user, trigger } = renderTooltip(1, 2)

      await user.hover(trigger)

      expect(await screen.findByText('Fully signed.')).toBeInTheDocument()
      expect(screen.queryByText(/Waiting on 0/)).not.toBeInTheDocument()
    })

    it('names only the connected wallet "You", first, and marks the other linked wallets with their address', async () => {
      const [ana, me, linked] = [owner('Ana'), owner('Me'), owner('Linked')]
      connect(me.value)
      mockLinkedWallets = [linked.value]
      respondWith(detailsWith([ana, linked, me], [ana], 2))
      const { user, trigger } = renderTooltip(1, 2, { status: 'sign' })

      await user.hover(trigger)

      await screen.findByText('You')
      expect(rowNames()).toEqual(['You', 'You · ' + shortenAddress(linked.value), 'Ana'])
    })

    it("says when the user isn't a signer of the Safe", async () => {
      const [ana, max] = [owner('Ana'), owner('Max')]
      connect(fakerChecksummedAddress())
      respondWith(detailsWith([ana, max], [ana], 2))
      const { user, trigger } = renderTooltip(1, 2)

      await user.hover(trigger)

      expect(await screen.findByText("You aren't a signer of Treasury.")).toBeInTheDocument()
    })

    it('says nothing about being a signer without a wallet', async () => {
      const [ana, max] = [owner('Ana'), owner('Max')]
      respondWith(detailsWith([ana, max], [ana], 2))
      const { user, trigger } = renderTooltip(1, 2)

      await user.hover(trigger)

      await screen.findByText('Ana')
      expect(screen.queryByText(/aren't a signer/)).not.toBeInTheDocument()
    })

    it('shows six signers and counts the rest', async () => {
      const owners = Array.from({ length: 8 }, (_, i) => owner(`Owner ${i + 1}`))
      respondWith(detailsWith(owners, [], 2))
      const { user, trigger } = renderTooltip(0, 2)

      await user.hover(trigger)

      expect(await screen.findByText('+2 more')).toBeInTheDocument()
      expect(rowNames()).toHaveLength(6)
    })

    it('lets the pointer pass through the open tooltip to the next row', async () => {
      respondWith('pending')
      const { user, trigger } = renderTooltip(0, 2, { status: 'sign' })

      await user.hover(trigger)
      const popup = await screen.findByText('Ready to sign')

      expect(popup.closest('[role="presentation"]')).toHaveStyle({ pointerEvents: 'none' })
      await user.unhover(trigger)
      await waitFor(() => expect(screen.queryByText('Ready to sign')).not.toBeInTheDocument())
    })
  })
})
