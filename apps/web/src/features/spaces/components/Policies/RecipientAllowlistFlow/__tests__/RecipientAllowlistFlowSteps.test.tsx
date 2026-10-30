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

  it('asks to acknowledge that a spending limit on an allowed token will follow the allowlist before the review', async () => {
    const spender = fakerChecksummedAddress()
    serveAllowlistWorkspace(workspace, {
      balances: heldBalances(token),
      active: [spendingLimitOn(workspace, token, spender)],
      contacts: { [spender]: faker.person.firstName() },
    })
    const view = renderFlow(workspace)

    await fillCreateStep(view)

    expect(await screen.findByTestId('recipient-allowlist-existing-policies-step')).toBeInTheDocument()
    expect(stepTitle()).toHaveTextContent('Existing policies')
    expect(await screen.findByText('Follows the allowlist')).toBeInTheDocument()
    expect(screen.getByText("Your spending limit will follow this allowlist's rules.")).toBeInTheDocument()
    expect(screen.getByText('They can only send allowed tokens to allowed recipients.')).toBeInTheDocument()
    expect(screen.queryByText('Will be blocked')).not.toBeInTheDocument()
    const next = screen.getByTestId('next-btn')
    expect(next).toBeDisabled()

    await view.user.click(screen.getByText('I understand how this allowlist changes these spending limits.'))
    expect(next).toBeEnabled()
    await view.user.click(next)

    await waitFor(() => expect(stepTitle()).toHaveTextContent('Confirm policy'))
  })

  it('should list the restricted limit before the blocked one, when only one token is in the allowlist', async () => {
    const leftOut = erc20TokenBuilder().with({ decimals: 6, symbol: 'DAI' }).build()
    serveAllowlistWorkspace(workspace, {
      balances: heldBalances(token),
      active: [
        spendingLimitOn(workspace, leftOut, fakerChecksummedAddress()),
        spendingLimitOn(workspace, token, fakerChecksummedAddress()),
      ],
    })
    const view = renderFlow(workspace)

    await fillCreateStep(view)

    expect(await screen.findByTestId('recipient-allowlist-existing-policies-step')).toBeInTheDocument()
    expect(await screen.findByText('1 spending limit will be blocked by this allowlist.')).toBeInTheDocument()
    const [first, second] = screen.getAllByTestId('spending-limit-impact')
    expect(first).toHaveTextContent('USDC is in this allowlist')
    expect(first).toHaveTextContent('Follows the allowlist')
    expect(second).toHaveTextContent("DAI isn't in this allowlist")
    expect(second).toHaveTextContent('Will be blocked')
  })

  it('should warn on Existing policies, when the Safe only has limits on tokens left out of the allowlist', async () => {
    const leftOut = erc20TokenBuilder().with({ decimals: 6, symbol: 'DAI' }).build()
    serveAllowlistWorkspace(workspace, {
      balances: heldBalances(token),
      active: [spendingLimitOn(workspace, leftOut, fakerChecksummedAddress())],
    })
    const view = renderFlow(workspace)

    await fillCreateStep(view)

    expect(await screen.findByTestId('recipient-allowlist-existing-policies-step')).toBeInTheDocument()
    expect(await screen.findByText('1 spending limit will be blocked by this allowlist.')).toBeInTheDocument()
    expect(screen.getByText('Will be blocked')).toBeInTheDocument()
  })

  it('goes straight to the review when the Safe has no spending limit, and Back returns to the form', async () => {
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
