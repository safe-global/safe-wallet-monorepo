import { render, screen } from '@/tests/test-utils'
import type { GuardPolicy } from '@safe-global/views/features/spaces/components/Policies/types'
import { MOCK_SAFES } from '../../mocks/policies'
import GuardPolicyDrawer from '../index'

const GUARD = '0xC83bC185770ac0Da8A970f35695064eEe62e236c'

const multisend = (): GuardPolicy => ({
  id: 'multisend:1',
  type: 'multisend',
  safe: MOCK_SAFES.treasury,
  enforcement: { via: 'guard', guardAddress: GUARD },
  enabled: true,
  status: 'active',
  data: {},
})

const safeManagement = (): GuardPolicy => ({
  id: 'safe-management:1',
  type: 'safe-management',
  safe: MOCK_SAFES.treasury,
  enforcement: { via: 'guard', guardAddress: GUARD },
  enabled: true,
  status: 'active',
  data: { changes: [{ selector: '0x0d582f13', label: 'Add a signer' }], total: 9 },
})

describe('GuardPolicyDrawer', () => {
  it('explains what a multisend policy does', () => {
    render(<GuardPolicyDrawer policy={multisend()} onClose={jest.fn()} />)

    expect(screen.getByText(/same policies it would have faced on its own/i)).toBeInTheDocument()
  })

  it('names every change a Safe management policy keeps allowed', () => {
    render(<GuardPolicyDrawer policy={safeManagement()} onClose={jest.fn()} />)

    expect(screen.getByTestId('safe-management-changes')).toHaveTextContent('Add a signer')
    expect(screen.getByText(/Allowed changes \(1 of 9\)/)).toBeInTheDocument()
  })
})
