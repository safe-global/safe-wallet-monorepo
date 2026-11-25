import type { ReactNode } from 'react'
import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { EditModeProvider } from '@safe-global/views/features/spaces/components/Policies/SpendingLimitFlow/EditFlow/EditModeContext'
import { render, screen } from '@/tests/test-utils'
import { createDefaultAllowlistValues } from '../../types'
import type { HeldTokenAddresses } from '../../hooks/useHeldTokenAddresses'
import RecipientAllowlistForm from '../RecipientAllowlistForm'

jest.mock('../TokensSection', () => ({
  __esModule: true,
  default: () => <div data-testid="tokens-section" />,
}))
jest.mock('../RecipientsSection', () => ({
  __esModule: true,
  default: () => <div data-testid="recipients-section" />,
}))

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
    account={hasAccount ? ACCOUNT : undefined}
    showSections={showSections}
  >
    {children}
  </RecipientAllowlistForm>
)

describe('RecipientAllowlistForm', () => {
  it('renders both sections and no summary when creating an allowlist', () => {
    render(<Form />)

    expect(screen.getByTestId('tokens-section')).toBeInTheDocument()
    expect(screen.getByTestId('recipients-section')).toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('renders both sections and no summary before a Safe is picked', () => {
    render(<Form hasAccount={false} />)

    expect(screen.getByTestId('tokens-section')).toBeInTheDocument()
    expect(screen.getByTestId('recipients-section')).toBeInTheDocument()
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

  it('hides the edit summary and the sections when blocked with an account', () => {
    render(
      <EditModeProvider>
        <Form showSections={false} />
      </EditModeProvider>,
    )

    expect(screen.queryByRole('status')).not.toBeInTheDocument()
    expect(screen.queryByTestId('tokens-section')).not.toBeInTheDocument()
    expect(screen.queryByTestId('recipients-section')).not.toBeInTheDocument()
  })

  it('renders its children between the edit summary and the sections', () => {
    render(
      <EditModeProvider>
        <Form>
          <div data-testid="account-field" />
        </Form>
      </EditModeProvider>,
    )

    const summary = screen.getByRole('status')
    const field = screen.getByTestId('account-field')
    const sections = screen.getByTestId('tokens-section')
    expect(summary.compareDocumentPosition(field) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(field.compareDocumentPosition(sections) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })
})
