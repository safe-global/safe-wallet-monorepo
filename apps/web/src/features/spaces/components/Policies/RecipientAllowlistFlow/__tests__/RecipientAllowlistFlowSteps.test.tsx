import { faker } from '@faker-js/faker'
import type { Balances, Erc20Token } from '@safe-global/store/gateway/AUTO_GENERATED/balances'
import type { ActivePolicyDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import useWallet from '@/hooks/wallets/useWallet'
import { balanceBuilder, erc20TokenBuilder } from '@/tests/builders/balances'
import { fakerChecksummedAddress, renderWithUserEvent, screen, waitFor, within } from '@/tests/test-utils'
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

const enabledField = (name: string) =>
  waitFor(
    () => {
      const field = screen.getByRole('combobox', { name })
      expect(field).toBeEnabled()
      return field
    },
    { timeout: 10_000 },
  )

const fillCreateStep = async ({ user }: ReturnType<typeof renderFlow>) => {
  await user.click(await screen.findByTestId('safe-account-selector'))
  await user.click(await screen.findByRole('option'))
  await user.click(await enabledField('Search tokens by name or address'))
  await user.click(await screen.findByRole('option', { name: /USDC/ }, { timeout: 10_000 }))
  await user.click(await enabledField('Search contacts or paste an address'))
  await user.paste(fakerChecksummedAddress())
  await user.click(await screen.findByRole('option', { name: /New recipient/ }))

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

  it('should, when the Safe has a spending limit, suggest its token first in the token search with a mark', async () => {
    const limited = erc20TokenBuilder().with({ decimals: 18, symbol: 'DAI' }).build()
    serveAllowlistWorkspace(workspace, {
      balances: heldBalances(token),
      active: [spendingLimitOn(workspace, limited, fakerChecksummedAddress())],
    })
    const { user } = renderFlow(workspace)

    await user.click(await screen.findByTestId('safe-account-selector'))
    await user.click(await screen.findByRole('option'))
    await user.click(await enabledField('Search tokens by name or address'))

    await waitFor(() => expect(screen.getAllByRole('option')[0]).toHaveTextContent('DAI'), { timeout: 10_000 })
    expect(within(screen.getAllByRole('option')[0]).getByTestId('spending-limit-token-mark')).toBeInTheDocument()
    expect(screen.getByText('In spending limits')).toBeInTheDocument()
  })

  it('should, when the Safe has a spending limit on a token left out, go from the form straight to the review', async () => {
    const leftOut = erc20TokenBuilder().with({ decimals: 6, symbol: 'DAI' }).build()
    serveAllowlistWorkspace(workspace, {
      balances: heldBalances(token),
      active: [spendingLimitOn(workspace, leftOut, fakerChecksummedAddress())],
    })
    const view = renderFlow(workspace)

    await fillCreateStep(view)

    await waitFor(() => expect(stepTitle()).toHaveTextContent('Confirm policy'))
  })

  it('goes straight to the review when the Safe has no spending limit, and Back returns to the form', async () => {
    serveAllowlistWorkspace(workspace, { balances: heldBalances(token) })
    const view = renderFlow(workspace)

    await fillCreateStep(view)

    await waitFor(() => expect(stepTitle()).toHaveTextContent('Confirm policy'))

    await view.user.click(screen.getByTestId('modal-back-btn'))

    expect(await screen.findByTestId('recipient-allowlist-create-step')).toBeInTheDocument()
    expect(stepTitle()).toHaveTextContent('Create new policy')
  })
})
