import type { ReactNode } from 'react'
import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { EditModeProvider } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitFlow/EditFlow/EditModeContext'
import { render, screen } from '@/tests/test-utils'
import { createDefaultAllowlistValues } from '../../types'
import type { HeldTokenAddresses } from '../../hooks/useHeldTokenAddresses'
import RecipientAllowlistForm from '../RecipientAllowlistForm'

const ACCOUNT = { chainId: '1', address: checksumAddress(faker.finance.ethereumAddress()), label: 'Treasury' }
const HELD_TOKENS: HeldTokenAddresses = {
  addresses: [ZERO_ADDRESS],
  options: [{ address: ZERO_ADDRESS, symbol: 'ETH', name: 'Ether', decimals: 18, group: 'held' }],
  isLoading: false,
  isError: false,
  refetch: jest.fn(),
  isPopularLoading: false,
  isPopularError: false,
  refetchPopular: jest.fn(),
  identityKey: '1:0x1',
}

const Form = ({
  showSections = true,
  hasAccount = true,
  children,
}: {
  showSections?: boolean
  hasAccount?: boolean
  children?: ReactNode
}) => (
  <RecipientAllowlistForm
    values={createDefaultAllowlistValues()}
    onChange={jest.fn()}
    heldTokens={HELD_TOKENS}
    spendingLimits={{ tokens: [], isLoading: false, isError: false, refetch: jest.fn() }}
    account={hasAccount ? ACCOUNT : undefined}
    showSections={showSections}
  >
    {children}
  </RecipientAllowlistForm>
)

describe('RecipientAllowlistForm', () => {
  it('renders no summary when creating an allowlist', () => {
    render(<Form />)

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('renders no summary before a Safe is picked', () => {
    render(<Form hasAccount={false} />)

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('shows the edit summary when editing an allowlist', () => {
    render(
      <EditModeProvider>
        <Form />
      </EditModeProvider>,
    )

    expect(screen.getByRole('status')).toHaveTextContent("You're editing the allowlist on Treasury.")
    expect(screen.getByRole('status')).toHaveTextContent(
      'Anything you deselect will be blocked once the change applies.',
    )
  })

  it('hides the edit summary when blocked with an account', () => {
    render(
      <EditModeProvider>
        <Form showSections={false} />
      </EditModeProvider>,
    )

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('renders its children after the edit summary', () => {
    render(
      <EditModeProvider>
        <Form>
          <div data-testid="account-field" />
        </Form>
      </EditModeProvider>,
    )

    const summary = screen.getByRole('status')
    const field = screen.getByTestId('account-field')
    expect(summary.compareDocumentPosition(field) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
