import { useState, type ReactNode } from 'react'
import { faker } from '@faker-js/faker'
import { checksumAddress } from '@safe-global/utils/utils/addresses'
import { ZERO_ADDRESS } from '@safe-global/utils/utils/constants'
import { shortenAddress } from '@safe-global/utils/utils/formatters'
import { render, screen } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import {
  createDefaultAllowlistValues,
  type RecipientAllowlistFormValues,
} from '@safe-global/views/features/spaces/components/Policies/RecipientAllowlistFlow/types'
import useHeldTokenAddresses from '../../hooks/useHeldTokenAddresses'
import RecipientAllowlistForm from '../RecipientAllowlistForm'

jest.mock('../../hooks/useHeldTokenAddresses')
jest.mock('../TokensSection', () => ({
  __esModule: true,
  default: ({
    isCalloutDismissed,
    onDismissCallout,
  }: {
    isCalloutDismissed: boolean
    onDismissCallout: () => void
  }) => (
    <div data-testid="tokens-section">
      <span>{`tokens callout dismissed: ${isCalloutDismissed}`}</span>
      <button onClick={onDismissCallout}>dismiss tokens</button>
    </div>
  ),
}))
jest.mock('../RecipientsSection', () => ({
  __esModule: true,
  default: ({
    values,
    onChange,
    isCalloutDismissed,
    onDismissCallout,
  }: {
    values: RecipientAllowlistFormValues
    onChange: (next: RecipientAllowlistFormValues) => void
    isCalloutDismissed: boolean
    onDismissCallout: () => void
  }) => (
    <div data-testid="recipients-section">
      <span>{`recipients callout dismissed: ${isCalloutDismissed}`}</span>
      <button onClick={onDismissCallout}>dismiss recipients</button>
      <button
        onClick={() => onChange({ ...values, recipients: [{ address: RECIPIENT, name: 'Carol', selected: true }] })}
      >
        select recipient
      </button>
    </div>
  ),
}))

const mockHeld = useHeldTokenAddresses as jest.MockedFunction<typeof useHeldTokenAddresses>

const RECIPIENT = checksumAddress(faker.finance.ethereumAddress())
const SAFE = checksumAddress(faker.finance.ethereumAddress())
const UNKNOWN_TOKEN = checksumAddress(faker.finance.ethereumAddress())
const ACCOUNT = { chainId: '1', address: SAFE, label: 'Treasury' }

const Harness = ({
  initial = createDefaultAllowlistValues(),
  showSections = true,
  hasAccount = true,
  onDismissCallout = jest.fn(),
  children,
}: {
  initial?: RecipientAllowlistFormValues
  showSections?: boolean
  hasAccount?: boolean
  onDismissCallout?: (section: 'tokens' | 'recipients') => void
  children?: ReactNode
}) => {
  const [values, setValues] = useState(initial)
  return (
    <RecipientAllowlistForm
      values={values}
      onChange={setValues}
      account={hasAccount ? ACCOUNT : undefined}
      showSections={showSections}
      dismissedCallouts={{ tokens: true, recipients: false }}
      onDismissCallout={onDismissCallout}
    >
      {children}
    </RecipientAllowlistForm>
  )
}

describe('RecipientAllowlistForm', () => {
  beforeEach(() => {
    mockHeld.mockReturnValue({
      addresses: [ZERO_ADDRESS, UNKNOWN_TOKEN],
      options: [{ address: ZERO_ADDRESS, symbol: 'ETH', name: 'Ether', decimals: 18, group: 'held' }],
      isLoading: false,
      isError: false,
      refetch: jest.fn(),
    })
  })

  it('asks for a selection until a recipient is picked, then names tokens and recipient', async () => {
    render(<Harness />)

    expect(screen.getByText(/select at least one token and one recipient/)).toBeInTheDocument()

    await userEvent.click(screen.getByText('select recipient'))

    expect(
      screen.getByText(`Treasury will only be able to send ETH and ${shortenAddress(UNKNOWN_TOKEN)} to Carol.`),
    ).toBeInTheDocument()
  })

  it('renders both sections when showSections is true', () => {
    render(<Harness />)

    expect(screen.getByTestId('tokens-section')).toBeInTheDocument()
    expect(screen.getByTestId('recipients-section')).toBeInTheDocument()
  })

  it('hides the summary and sections when blocked with an account', () => {
    render(<Harness showSections={false} />)

    expect(screen.queryByTestId('tokens-section')).not.toBeInTheDocument()
    expect(screen.queryByTestId('recipients-section')).not.toBeInTheDocument()
    expect(screen.queryByText(/select at least one token/)).not.toBeInTheDocument()
  })

  it('shows the no-account summary with both sections before a Safe is picked', () => {
    render(<Harness hasAccount={false} />)

    expect(screen.getByText('Pick a Safe account to start.')).toBeInTheDocument()
    expect(screen.getByTestId('tokens-section')).toBeInTheDocument()
    expect(screen.getByTestId('recipients-section')).toBeInTheDocument()
  })

  it('renders its children between the summary and the sections', () => {
    render(
      <Harness>
        <div data-testid="account-field" />
      </Harness>,
    )

    const summary = screen.getByText(/select at least one token/)
    const field = screen.getByTestId('account-field')
    const sections = screen.getByTestId('tokens-section')
    expect(summary.compareDocumentPosition(field) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(field.compareDocumentPosition(sections) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('passes each callout its own dismissed state and reports which one was dismissed', async () => {
    const onDismissCallout = jest.fn()
    render(<Harness onDismissCallout={onDismissCallout} />)

    expect(screen.getByText('tokens callout dismissed: true')).toBeInTheDocument()
    expect(screen.getByText('recipients callout dismissed: false')).toBeInTheDocument()

    await userEvent.click(screen.getByText('dismiss recipients'))
    await userEvent.click(screen.getByText('dismiss tokens'))

    expect(onDismissCallout.mock.calls).toEqual([['recipients'], ['tokens']])
  })
})
