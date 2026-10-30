import type { ReactElement } from 'react'
import { renderWithUserEvent, screen } from '@/tests/test-utils'
import { TxModalContext } from '@/components/tx-flow'
import { mockActiveAllowlist } from '../../mocks/allowlistPolicies'
import EditRecipientAllowlistFlow from '../../RecipientAllowlistFlow/EditFlow'
import AllowlistDetails from '..'

jest.mock('../hooks/useAllowlistDetails', () => ({ useAllowlistDetails: () => ({}) }))
jest.mock('../../RecipientAllowlistFlow/EditFlow', () => ({ __esModule: true, default: () => null }))
jest.mock('../../AllowlistDrawer', () => ({
  AllowlistDrawer: ({ onEdit }: { onEdit?: () => void }) => (
    <button type="button" onClick={onEdit}>
      Edit
    </button>
  ),
}))

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
})
