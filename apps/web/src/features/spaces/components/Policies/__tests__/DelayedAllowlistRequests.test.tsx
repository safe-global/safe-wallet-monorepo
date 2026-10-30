import { faker } from '@faker-js/faker'
import { TxModalProvider } from '@/components/tx-flow'
import useWallet from '@/hooks/wallets/useWallet'
import { fakerChecksummedAddress, renderWithUserEvent, screen, waitFor, within } from '@/tests/test-utils'
import { mockErc20TransferDto } from '../mocks/activePolicies'
import {
  buildAllowlistWorkspace,
  delayedGuardRequest,
  serveAllowlistRpc,
  serveAllowlistWorkspace,
  signedInState,
  type AllowlistWorkspace,
} from '../mocks/allowlistWorkspace'
import SpacePoliciesPage from '../Page'

// The connected wallet comes from web3-onboard, which has no network equivalent.
jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: jest.fn(),
  useSigner: () => null,
  useWalletContext: () => null,
}))

const TEN_MINUTES = 600
const HOUR = 3_600
const DAY = 24 * HOUR
const nowSeconds = () => Math.floor(Date.now() / 1000)

const renderPage = (workspace: AllowlistWorkspace) => {
  window.history.replaceState(null, '', `/spaces/policies?spaceId=${workspace.spaceId}`)
  return renderWithUserEvent(
    <TxModalProvider>
      <SpacePoliciesPage spaceId={workspace.spaceId} />
    </TxModalProvider>,
    { initialReduxState: signedInState(), routerProps: { query: { spaceId: workspace.spaceId } } },
  )
}

const openOnlyRow = async ({ user }: ReturnType<typeof renderPage>) => {
  const [openButton, ...others] = await screen.findAllByTestId('policy-open-button')
  expect(others).toHaveLength(0)
  await user.click(openButton)
  return screen.findByRole('dialog')
}

const openRowWithStatus = async ({ user }: ReturnType<typeof renderPage>, status: string) => {
  const statusCell = (await screen.findAllByTestId('policy-cell-status')).find((cell) => cell.textContent === status)
  const row = statusCell?.closest('tr')
  if (!row) throw new Error(`No row with status ${status}`)
  await user.click(within(row).getByTestId('policy-open-button'))
  return screen.findByRole('dialog')
}

const liveAllowlistDto = (workspace: AllowlistWorkspace, recipient: string) =>
  mockErc20TransferDto({
    safe: { chainId: workspace.safe.chainId, address: workspace.safe.address.value },
    data: { tokenAddress: fakerChecksummedAddress(), recipients: [{ account: recipient, permission: 'ALWAYS' }] },
  })

describe('Policies page with delayed allowlist requests', () => {
  let workspace: AllowlistWorkspace

  beforeEach(() => {
    workspace = buildAllowlistWorkspace()
    jest.mocked(useWallet).mockReturnValue(workspace.wallet)
    serveAllowlistRpc(workspace)
  })

  it('says a first allowlist can be applied once the waiting period is over, with apply disabled', async () => {
    serveAllowlistWorkspace(workspace, {
      pending: [
        delayedGuardRequest(workspace, { readyAt: nowSeconds() + TEN_MINUTES, expiresAt: nowSeconds() + 7 * DAY }),
      ],
    })
    const view = renderPage(workspace)

    const drawer = await openOnlyRow(view)

    expect(within(drawer).getByText(/^Your allowlist can be applied in (9|10) minutes$/)).toBeInTheDocument()
    expect(within(drawer).getByText('Waiting period')).toBeInTheDocument()
    expect(within(drawer).getByRole('button', { name: /^Apply in (9|10) minutes$/ })).toBeDisabled()
  })

  it('lets a signer open the apply flow once the delay is over', async () => {
    serveAllowlistWorkspace(workspace, {
      pending: [delayedGuardRequest(workspace, { readyAt: nowSeconds() - HOUR, expiresAt: nowSeconds() + 6 * DAY })],
    })
    const view = renderPage(workspace)

    const drawer = await openOnlyRow(view)
    expect(within(drawer).getByText('Your allowlist is ready to apply')).toBeInTheDocument()
    expect(within(drawer).getByText('Apply window')).toBeInTheDocument()
    const review = await within(drawer).findByRole('button', { name: 'Review transaction' })
    await waitFor(() => expect(review).toBeEnabled())
    expect(within(drawer).getByText('Any signer can start this transaction.')).toBeInTheDocument()
    await view.user.click(review)

    expect(await screen.findByRole('dialog')).toHaveTextContent('Allowlist')
    await waitFor(() => expect(screen.queryByText('Your allowlist is ready to apply')).not.toBeInTheDocument())
  })

  it('reports a request that was never applied in time as expired, offering only to discard it', async () => {
    serveAllowlistWorkspace(workspace, {
      pending: [
        delayedGuardRequest(workspace, {
          status: 'expired',
          readyAt: nowSeconds() - 8 * DAY,
          expiresAt: nowSeconds() - DAY,
        }),
      ],
    })
    const view = renderPage(workspace)

    const drawer = await openOnlyRow(view)

    expect(within(drawer).getByText('Your allowlist expired')).toBeInTheDocument()
    expect(within(drawer).getByText('Request')).toBeInTheDocument()
    expect(within(drawer).getByRole('button', { name: 'Discard' })).toBeInTheDocument()
    expect(within(drawer).queryByRole('button', { name: /Apply|Review transaction/ })).not.toBeInTheDocument()
  })

  it('shows an apply in signing as a pending row whose panel counts the signatures', async () => {
    serveAllowlistWorkspace(workspace, {
      pending: [
        delayedGuardRequest(workspace, {
          status: 'application-in-signing',
          readyAt: nowSeconds() - HOUR,
          expiresAt: nowSeconds() + 6 * DAY,
          transaction: {
            safeTxHash: faker.string.hexadecimal({ length: 64, casing: 'lower' }),
            nonce: 3,
            confirmations: 1,
            confirmationsRequired: 2,
            proposedAt: nowSeconds() - HOUR,
            proposer: workspace.wallet.address,
          },
        }),
      ],
    })
    const view = renderPage(workspace)

    expect(await screen.findByTestId('policy-cell-status')).toHaveTextContent('Pending')
    const drawer = await openOnlyRow(view)

    expect(within(drawer).getByText('Pending signatures')).toBeInTheDocument()
    expect(within(drawer).getByText('1 of 2 signatures')).toBeInTheDocument()
  })

  it("should keep the Safe's allowlist active and list the request as its own pending row, when the Safe already has an allowlist", async () => {
    serveAllowlistWorkspace(workspace, {
      active: [liveAllowlistDto(workspace, fakerChecksummedAddress())],
      pending: [
        delayedGuardRequest(workspace, { readyAt: nowSeconds() + TEN_MINUTES, expiresAt: nowSeconds() + 7 * DAY }),
      ],
    })
    const view = renderPage(workspace)

    const drawer = await openRowWithStatus(view, 'Pending')

    expect(screen.getAllByTestId('policy-cell-status').map((cell) => cell.textContent)).toEqual(
      expect.arrayContaining(['Active', 'Pending']),
    )
    expect(within(drawer).getByText(/^Your changes can be applied in (9|10) minutes$/)).toBeInTheDocument()
    expect(within(drawer).getByRole('button', { name: /^Apply in (9|10) minutes$/ })).toBeDisabled()
  })

  it('should strike through the live recipients on the pending row, when the request removes the allowlist', async () => {
    const recipient = fakerChecksummedAddress()
    serveAllowlistWorkspace(workspace, {
      active: [liveAllowlistDto(workspace, recipient)],
      pending: [
        delayedGuardRequest(workspace, {
          readyAt: nowSeconds() + TEN_MINUTES,
          expiresAt: nowSeconds() + 7 * DAY,
          configurations: [
            {
              target: workspace.safe.address.value,
              selector: '0xe19a9dd9',
              operation: 0,
              policy: fakerChecksummedAddress(),
              data: '0x',
            },
          ],
        }),
      ],
    })
    const view = renderPage(workspace)

    const drawer = await openRowWithStatus(view, 'Pending')
    await view.user.click(within(drawer).getByRole('button', { name: 'Show recipient details' }))
    const [listed, ...others] = within(drawer).getAllByTestId('allowlist-recipient')

    expect(others).toHaveLength(0)
    expect(listed).toHaveTextContent(recipient.slice(0, 6))
    expect(within(listed).getByText('Removed')).toBeInTheDocument()
  })
})
