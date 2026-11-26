import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import type { PendingImmediateGuardPoliciesDto } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import { TxModalProvider } from '@/components/tx-flow'
import { GATEWAY_URL } from '@/config/gateway'
import useWallet from '@/hooks/wallets/useWallet'
import { server } from '@/tests/server'
import { fakerChecksummedAddress, renderWithUserEvent, screen, waitFor, within } from '@/tests/test-utils'
import {
  multisigConfirmationBuilder,
  multisigExecutionDetailsBuilder,
  transactionDetailsBuilder,
} from '@/tests/builders/transactionDetails'
import {
  buildAllowlistWorkspace,
  erc20TransferConfiguration,
  serveAllowlistRpc,
  serveAllowlistWorkspace,
  signedInState,
  type AllowlistWorkspace,
} from '../mocks/allowlistWorkspace'
import SpacePoliciesPage from '../Page'

jest.mock('@/hooks/wallets/useWallet', () => ({
  __esModule: true,
  default: jest.fn(),
  useSigner: () => null,
  useWalletContext: () => null,
}))

const fullySignedSetup = ({
  safe,
  guardAddress,
}: AllowlistWorkspace): PendingImmediateGuardPoliciesDto & { kind: 'immediate-guard-policies' } => ({
  kind: 'immediate-guard-policies',
  status: 'ready',
  safe: { chainId: safe.chainId, address: safe.address.value },
  guard: guardAddress,
  configurations: [erc20TransferConfiguration(fakerChecksummedAddress(), [fakerChecksummedAddress()])],
  transaction: {
    safeTxHash: faker.string.hexadecimal({ length: 64, casing: 'lower' }),
    nonce: safe.nonce,
    confirmations: safe.threshold,
    confirmationsRequired: safe.threshold,
    proposedAt: Math.floor(Date.now() / 1_000),
    proposer: null,
  },
})

const serveTransaction = (txStatus: TransactionDetails['txStatus'], signatures: number) =>
  server.use(
    http.get(`${GATEWAY_URL}/v1/chains/:chainId/transactions/:id`, ({ params }) =>
      HttpResponse.json(
        transactionDetailsBuilder()
          .with({
            txId: String(params.id),
            txStatus,
            detailedExecutionInfo: multisigExecutionDetailsBuilder()
              .with({ confirmations: Array.from({ length: signatures }, () => multisigConfirmationBuilder().build()) })
              .build(),
          })
          .build(),
      ),
    ),
  )

const renderPage = (workspace: AllowlistWorkspace) => {
  window.history.replaceState(null, '', `/spaces/policies?spaceId=${workspace.spaceId}`)
  return renderWithUserEvent(
    <TxModalProvider>
      <SpacePoliciesPage spaceId={workspace.spaceId} />
    </TxModalProvider>,
    { initialReduxState: signedInState(), routerProps: { query: { spaceId: workspace.spaceId } } },
  )
}

describe('Policies page with an executed allowlist setup', () => {
  let workspace: AllowlistWorkspace

  beforeEach(() => {
    workspace = buildAllowlistWorkspace()
    jest.mocked(useWallet).mockReturnValue(workspace.wallet)
    serveAllowlistRpc(workspace)
  })

  it('should, when the transaction executed while the pending policies still list it, show processing in both the table and its panel', async () => {
    serveAllowlistWorkspace(workspace, { pending: [fullySignedSetup(workspace)] })
    serveTransaction('SUCCESS', workspace.safe.threshold)
    const { user } = renderPage(workspace)
    await user.click(await screen.findByTestId('policy-open-button'))

    const drawer = await screen.findByRole('dialog')

    await waitFor(() => expect(within(drawer).getByTestId('allowlist-status-tags')).toHaveTextContent('Processing'))
    expect(within(drawer).getByTestId('allowlist-status-tags')).toHaveTextContent('Setup')
    expect(screen.getByTestId('policy-cell-status')).toHaveTextContent('Processing')
    expect(within(screen.getByTestId('policy-cell-rule')).getByTestId(/^policy-change-/)).toHaveTextContent('Setup')
  })

  it('should, while the transaction waits for execution, show ready to execute in both the table and its panel', async () => {
    serveAllowlistWorkspace(workspace, { pending: [fullySignedSetup(workspace)] })
    serveTransaction('AWAITING_EXECUTION', workspace.safe.threshold)
    const { user } = renderPage(workspace)
    await user.click(await screen.findByTestId('policy-open-button'))

    const drawer = await screen.findByRole('dialog')

    await waitFor(() => expect(within(drawer).getByRole('button', { name: 'Review transaction' })).toBeEnabled())
    expect(within(drawer).getByTestId('allowlist-status-tags')).toHaveTextContent('Ready to execute')
    expect(screen.getByTestId('policy-cell-status')).toHaveTextContent('Ready to execute')
  })
})
