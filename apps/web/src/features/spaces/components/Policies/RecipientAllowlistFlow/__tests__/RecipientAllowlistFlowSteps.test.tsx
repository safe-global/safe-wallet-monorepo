import { faker } from '@faker-js/faker'
import type { Balances, Erc20Token } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import type { ActivePolicyDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import useWallet from '@/hooks/wallets/useWallet'
import { balanceBuilder, erc20TokenBuilder } from '@/tests/builders/balances'
import { fakerChecksummedAddress, renderWithUserEvent, screen, waitFor } from '@/tests/test-utils'
import { mockSpendingLimitDto } from '../../mocks/activePolicies'
import {
  buildAllowlistWorkspace,
  serveAllowlistRpc,
  serveAllowlistWorkspace,
  signedInState,
  type AllowlistWorkspace,
} from '../../mocks/allowlistWorkspace'
import RecipientAllowlistFlow from '..'

// The connected wallet comes from web3-onboard, which has no network equivalent.
jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: jest.fn(),
  useSigner: () => null,
  useWalletContext: () => null,
}))

// Each test drives the whole Create step against the network mocks, which takes a few seconds.
jest.setTimeout(30_000)

const heldBalances = (token: Erc20Token): Balances => ({
  fiatTotal: '0',
  items: [balanceBuilder().with({ tokenInfo: token }).build()],
})

const spendingLimitOn = (workspace: AllowlistWorkspace, token: Erc20Token, spender: string): ActivePolicyDto =>
  mockSpendingLimitDto({
    safe: { chainId: workspace.safe.chainId, address: workspace.safe.address.value },
    data: {
      module: fakerChecksummedAddress(),
      spenders: [
        {
          spender,
          isActive: true,
          allowances: [
            {
              tokenAddress: token.address,
              tokenMetadata: { ...token, trusted: true },
              amount: '500000000',
              spent: '0',
              resetPeriodMinutes: 1_440,
              resetsAtMinute: null,
              resetBoundaryIsExact: true,
              isDelegateActive: true,
              createdAt: Math.floor(faker.date.past().getTime() / 1000),
              updatedAt: Math.floor(faker.date.past().getTime() / 1000),
            },
          ],
        },
      ],
    },
  })

const renderFlow = (workspace: AllowlistWorkspace) => {
  window.history.replaceState(null, '', `/spaces/policies?spaceId=${workspace.spaceId}`)
  return renderWithUserEvent(<RecipientAllowlistFlow />, {
    initialReduxState: signedInState(),
    routerProps: { query: { spaceId: workspace.spaceId } },
  })
}

const stepTitle = () => screen.getByTestId('modal-title')

const fillCreateStep = async ({ user }: ReturnType<typeof renderFlow>) => {
  await user.click(await screen.findByRole('combobox'))
  await user.click(await screen.findByRole('option'))
  const name = await screen.findByRole('textbox', { name: 'Name (optional)' }, { timeout: 10_000 })
  await user.type(name, `${faker.person.firstName()}{Enter}`)
  await user.type(await screen.findByRole('textbox', { name: 'Address or ENS' }), fakerChecksummedAddress())
  const addRecipient = screen.getByRole('button', { name: 'Add recipient' })
  await waitFor(() => expect(addRecipient).toBeEnabled())
  await user.click(addRecipient)

  const next = screen.getByTestId('next-btn')
  await waitFor(() => expect(next).toBeEnabled())
  await user.click(next)
}

describe('RecipientAllowlistFlow steps', () => {
  let workspace: AllowlistWorkspace
  let token: Erc20Token

  beforeEach(() => {
    workspace = buildAllowlistWorkspace()
    token = erc20TokenBuilder().with({ decimals: 6, symbol: 'USDC' }).build()
    jest.mocked(useWallet).mockReturnValue(workspace.wallet)
    serveAllowlistRpc(workspace)
  })

  it('asks to acknowledge a restricted spending limit before the review, naming its spender', async () => {
    const spender = fakerChecksummedAddress()
    const spenderName = faker.person.firstName()
    serveAllowlistWorkspace(workspace, {
      balances: heldBalances(token),
      active: [spendingLimitOn(workspace, token, spender)],
      contacts: { [spender]: spenderName },
    })
    const view = renderFlow(workspace)

    await fillCreateStep(view)

    expect(await screen.findByTestId('recipient-allowlist-existing-policies-step')).toBeInTheDocument()
    expect(stepTitle()).toHaveTextContent('Existing policies')
    expect(
      await screen.findByText(
        `${spenderName} can send USDC to any address today, up to 500/day. Once this allowlist is active, it can only send USDC to the 1 allowed recipient.`,
      ),
    ).toBeInTheDocument()
    const next = screen.getByTestId('next-btn')
    expect(next).toBeDisabled()

    await view.user.click(screen.getByRole('checkbox'))
    expect(next).toBeEnabled()
    await view.user.click(next)

    await waitFor(() => expect(stepTitle()).toHaveTextContent('Confirm policy'))
  })

  it('goes straight to the review when no spending limit is restricted, and Back returns to the form', async () => {
    serveAllowlistWorkspace(workspace, { balances: heldBalances(token) })
    const view = renderFlow(workspace)

    await fillCreateStep(view)

    await waitFor(() => expect(stepTitle()).toHaveTextContent('Confirm policy'))
    expect(screen.queryByTestId('recipient-allowlist-existing-policies-step')).not.toBeInTheDocument()

    await view.user.click(screen.getByTestId('modal-back-btn'))

    expect(await screen.findByTestId('recipient-allowlist-create-step')).toBeInTheDocument()
    expect(stepTitle()).toHaveTextContent('Create new policy')
  })
})
