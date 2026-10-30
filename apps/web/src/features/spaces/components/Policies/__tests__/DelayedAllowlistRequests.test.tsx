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

  it("folds a request on a Safe with an active allowlist into that Safe's row as a scheduled change", async () => {
    const safe = { chainId: workspace.safe.chainId, address: workspace.safe.address.value }
    serveAllowlistWorkspace(workspace, {
      active: [
        mockErc20TransferDto({
          safe,
          data: {
            tokenAddress: fakerChecksummedAddress(),
            recipients: [{ account: fakerChecksummedAddress(), permission: 'ALWAYS' }],
          },
        }),
      ],
      pending: [
        delayedGuardRequest(workspace, { readyAt: nowSeconds() + TEN_MINUTES, expiresAt: nowSeconds() + 7 * DAY }),
      ],
    })
    const view = renderPage(workspace)

    const drawer = await openOnlyRow(view)

    expect(within(drawer).getByText(/^Your changes can be applied in (9|10) minutes$/)).toBeInTheDocument()
    expect(within(drawer).getByText('Waiting period')).toBeInTheDocument()
    expect(within(drawer).getByRole('button', { name: /^Apply in (9|10) minutes$/ })).toBeDisabled()
  })
})
