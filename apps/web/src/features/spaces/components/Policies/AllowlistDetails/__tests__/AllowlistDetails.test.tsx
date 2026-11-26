import type { ReactElement } from 'react'
import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import { GATEWAY_URL } from '@/config/gateway'
import { server } from '@/tests/server'
import { renderWithUserEvent, screen, waitFor } from '@/tests/test-utils'
import { TxModalContext } from '@/components/tx-flow'
import type { PolicyConfiguration } from '@/features/policy-guard/public/types'
import { mockActiveAllowlist, mockAllowlistAwaitingGuardRemoval } from '../../../../public/utils/allowlistPolicies'
import EditRecipientAllowlistFlow from '../../RecipientAllowlistFlow/EditFlow'
import RemoveGuardFlow from '../../RemoveGuardFlow'
import AllowlistDetails from '..'

jest.mock('../hooks/useAllowlistDetails', () => ({ useAllowlistDetails: () => ({}) }))
jest.mock('../../RecipientAllowlistFlow/EditFlow', () => ({ __esModule: true, default: () => null }))
jest.mock('../../RemoveGuardFlow', () => ({ __esModule: true, default: () => null }))
jest.mock('../../AllowlistDrawer/AllowlistDrawer', () => ({
  __esModule: true,
  default: ({
    onEdit,
    onRemoveGuard,
    onDiscard,
  }: {
    onEdit?: () => void
    onRemoveGuard?: () => void
    onDiscard?: () => void
  }) => (
    <>
      <button type="button" onClick={onEdit}>
        Edit
      </button>
      <button type="button" onClick={onRemoveGuard}>
        Remove guard
      </button>
      <button type="button" onClick={onDiscard} disabled={!onDiscard}>
        Discard
      </button>
    </>
  ),
}))

const SPACE_ID = '11111111-1111-1111-1111-111111111111'
const DAY = 86_400

const cleanupConfiguration = (safeAddress: string): PolicyConfiguration => ({
  target: safeAddress,
  selector: '0xe19a9dd9',
  operation: 0,
  policy: '0x0000000000000000000000000000000000000000',
  data: '0x',
})

describe('AllowlistDetails', () => {
  it('should open the edit flow for the allowlist, when Edit is clicked', async () => {
    const setTxFlow = jest.fn()
    const policy = mockActiveAllowlist()
    const { user } = renderWithUserEvent(
      <TxModalContext.Provider value={{ txFlow: undefined, setTxFlow, setFullWidth: jest.fn() }}>
        <AllowlistDetails policy={policy} policies={[]} onClose={jest.fn()} />
      </TxModalContext.Provider>,
    )

    await user.click(screen.getByRole('button', { name: 'Edit' }))

    const flow = setTxFlow.mock.calls[0][0] as ReactElement<{ policy: unknown }>
    expect(flow.type).toBe(EditRecipientAllowlistFlow)
    expect(flow.props.policy).toBe(policy)
  })

  it("should, when the removal's cleanup root can be applied, hand its configurations to the guard removal", async () => {
    const setTxFlow = jest.fn()
    const policy = mockAllowlistAwaitingGuardRemoval()
    const configurations = [cleanupConfiguration(policy.safe.address)]
    const nowSeconds = Math.floor(Date.now() / 1_000)
    const { user } = renderWithUserEvent(
      <TxModalContext.Provider value={{ txFlow: undefined, setTxFlow, setFullWidth: jest.fn() }}>
        <AllowlistDetails
          policy={policy}
          policies={[]}
          onClose={jest.fn()}
          guardRemovalCleanup={{ configurations, readyAt: nowSeconds - 60, expiresAt: nowSeconds + 3_600 }}
        />
      </TxModalContext.Provider>,
    )

    await user.click(screen.getByRole('button', { name: 'Remove guard' }))

    const flow = setTxFlow.mock.calls[0][0] as ReactElement<{ cleanupConfigurations?: PolicyConfiguration[] }>
    expect(flow.type).toBe(RemoveGuardFlow)
    expect(flow.props.cleanupConfigurations).toBe(configurations)
  })

  it("should, when the removal's cleanup root has expired, start the guard removal without it", async () => {
    const setTxFlow = jest.fn()
    const policy = mockAllowlistAwaitingGuardRemoval()
    const nowSeconds = Math.floor(Date.now() / 1_000)
    const { user } = renderWithUserEvent(
      <TxModalContext.Provider value={{ txFlow: undefined, setTxFlow, setFullWidth: jest.fn() }}>
        <AllowlistDetails
          policy={policy}
          policies={[]}
          onClose={jest.fn()}
          guardRemovalCleanup={{
            configurations: [cleanupConfiguration(policy.safe.address)],
            readyAt: nowSeconds - 8 * DAY,
            expiresAt: nowSeconds - 60,
          }}
        />
      </TxModalContext.Provider>,
    )

    await user.click(screen.getByRole('button', { name: 'Remove guard' }))

    const flow = setTxFlow.mock.calls[0][0] as ReactElement<{ cleanupConfigurations?: PolicyConfiguration[] }>
    expect(flow.type).toBe(RemoveGuardFlow)
    expect(flow.props.cleanupConfigurations).toBeUndefined()
  })

  it('should, when Discard is clicked on an expired edit, delete its stored request in CGW', async () => {
    const root = faker.string.hexadecimal({ length: 64, casing: 'lower' })
    const nowSeconds = Math.floor(Date.now() / 1_000)
    const policy = {
      ...mockActiveAllowlist(),
      scheduledChange: { operation: 'update', appliesAt: nowSeconds - 8 * DAY, expiresAt: nowSeconds - DAY, root },
    } as const
    const deleted = jest.fn()
    server.use(
      http.delete(
        `${GATEWAY_URL}/v1/spaces/:spaceId/chains/:chainId/safes/:safeAddress/policies/requests/:root`,
        ({ params }) => {
          deleted(params)
          return new HttpResponse(null, { status: 204 })
        },
      ),
    )
    const { user } = renderWithUserEvent(
      <TxModalContext.Provider value={{ txFlow: undefined, setTxFlow: jest.fn(), setFullWidth: jest.fn() }}>
        <AllowlistDetails policy={policy} policies={[]} onClose={jest.fn()} />
      </TxModalContext.Provider>,
      { routerProps: { query: { spaceId: SPACE_ID } } },
    )

    await user.click(screen.getByRole('button', { name: 'Discard' }))

    await waitFor(() =>
      expect(deleted).toHaveBeenCalledWith({
        spaceId: SPACE_ID,
        chainId: policy.safe.chainId,
        safeAddress: policy.safe.address,
        root,
      }),
    )
  })
})
