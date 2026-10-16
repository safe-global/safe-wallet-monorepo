import { render, screen } from '@/tests/test-utils'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { EDIT_POLICY_LABEL } from '@safe-global/views/features/spaces/components/Policies/GuardPolicyFlow/constants'
import type { GuardPolicy } from '@safe-global/views/features/spaces/components/Policies/types'
import { MOCK_ADDRESSES, MOCK_SAFES } from '../../mocks/policies'
import GuardPolicyDrawer from '../index'

const ETH = { address: ZERO_ADDRESS, symbol: 'ETH', decimals: 18, logoUri: null }

const allowlist = (): GuardPolicy => ({
  id: 'token-allowlist:1',
  type: 'token-allowlist',
  safe: MOCK_SAFES.treasury,
  enforcement: { via: 'guard' },
  enabled: true,
  status: 'active',
  data: { token: ETH, recipients: [{ address: MOCK_ADDRESSES.bob, permission: 'ALWAYS' }] },
})

const multisend = (): GuardPolicy => ({
  id: 'multisend:1',
  type: 'multisend',
  safe: MOCK_SAFES.treasury,
  enforcement: { via: 'guard' },
  enabled: true,
  status: 'active',
  data: {},
})

const safeManagement = (): GuardPolicy => ({
  id: 'safe-management:1',
  type: 'safe-management',
  safe: MOCK_SAFES.treasury,
  enforcement: { via: 'guard' },
  enabled: true,
  status: 'active',
  data: { changes: [{ selector: '0x0d582f13', label: 'Add a signer' }], total: 9 },
})

describe('GuardPolicyDrawer', () => {
  it('lists the recipients an allowlist permits', () => {
    render(<GuardPolicyDrawer policy={allowlist()} onClose={jest.fn()} />)

    expect(screen.getByTestId('allowlist-recipients')).toBeInTheDocument()
    expect(screen.getByText('Allowed recipients (1)')).toBeInTheDocument()
  })

  it('offers Edit on an allowlist', () => {
    const onEdit = jest.fn()
    render(<GuardPolicyDrawer policy={allowlist()} onClose={jest.fn()} onEdit={onEdit} />)

    expect(screen.getByRole('button', { name: EDIT_POLICY_LABEL })).toBeInTheDocument()
  })

  // The other guard policies carry nothing a user could change.
  it.each([
    ['a multisend policy', multisend()],
    ['a Safe management policy', safeManagement()],
  ])('offers no Edit on %s', (_label, policy) => {
    render(<GuardPolicyDrawer policy={policy} onClose={jest.fn()} onEdit={jest.fn()} />)

    expect(screen.queryByRole('button', { name: EDIT_POLICY_LABEL })).not.toBeInTheDocument()
  })

  it('offers no Edit when the caller supplies no handler', () => {
    render(<GuardPolicyDrawer policy={allowlist()} onClose={jest.fn()} />)

    expect(screen.queryByRole('button', { name: EDIT_POLICY_LABEL })).not.toBeInTheDocument()
  })

  it('says when an allowlist permits nobody', () => {
    const policy = { ...allowlist(), data: { token: ETH, recipients: [] } } as GuardPolicy
    render(<GuardPolicyDrawer policy={policy} onClose={jest.fn()} />)

    expect(screen.getByText(/transfers of this token are blocked/i)).toBeInTheDocument()
  })

  it('names every change a Safe management policy keeps allowed', () => {
    render(<GuardPolicyDrawer policy={safeManagement()} onClose={jest.fn()} />)

    expect(screen.getByTestId('safe-management-changes')).toHaveTextContent('Add a signer')
    expect(screen.getByText(/Allowed changes \(1 of 9\)/)).toBeInTheDocument()
  })
})
