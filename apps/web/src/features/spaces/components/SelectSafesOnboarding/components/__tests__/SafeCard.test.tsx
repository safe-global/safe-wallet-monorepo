import { FormProvider, useForm } from 'react-hook-form'
import { render, screen, fireEvent } from '@/tests/test-utils'
import type { SafeItem, MultiChainSafeItem } from '@/hooks/safes'
import type { AddAccountsFormValues } from '@/features/spaces/components/AddAccounts/index'
import SafeCard from '../SafeCard'

// Mock heavy child dependencies
jest.mock('../../hooks/useSafeCardData', () => ({
  __esModule: true,
  default: () => ({
    name: 'Test Safe',
    fiatValue: '1000',
    threshold: 2,
    ownersCount: 3,
    elementRef: undefined,
  }),
}))

jest.mock('@/components/common/Identicon', () => ({
  __esModule: true,
  default: ({ address }: { address: string }) => <div data-testid={`identicon-${address}`} />,
}))

jest.mock('../FiatBalance', () => ({
  __esModule: true,
  default: ({ value }: { value: string | number | undefined }) => <span data-testid="fiat-balance">{value}</span>,
}))

jest.mock('../ThresholdBadge', () => ({
  __esModule: true,
  default: ({ threshold, owners }: { threshold: number; owners: number }) => (
    <span data-testid="threshold-badge">
      {threshold}/{owners}
    </span>
  ),
}))

jest.mock('@/features/myAccounts/components/AccountItem', () => ({
  AccountItem: {
    ChainBadge: ({ safes }: { safes: SafeItem[] }) => <span data-testid="chain-badge">{safes.length} chains</span>,
  },
}))

const buildSafe = (address: string, chainId = '1'): SafeItem =>
  ({ address, chainId, isPinned: false, isReadOnly: false, lastVisited: 0, name: undefined }) as SafeItem

const buildMultiChain = (address: string, chainIds: string[]): MultiChainSafeItem =>
  ({ address, safes: chainIds.map((cid) => buildSafe(address, cid)) }) as MultiChainSafeItem

const FormWrapper = ({
  children,
  defaultValues = {},
}: {
  children: React.ReactNode
  defaultValues?: Partial<AddAccountsFormValues>
}) => {
  const methods = useForm<AddAccountsFormValues>({
    defaultValues: { selectedSafes: {}, ...defaultValues },
  })
  return <FormProvider {...methods}>{children}</FormProvider>
}

describe('SafeCard', () => {
  it('renders safe name and address', () => {
    render(
      <FormWrapper>
        <SafeCard safe={buildSafe('0xabc123')} />
      </FormWrapper>,
    )

    expect(screen.getByText('Test Safe')).toBeInTheDocument()
    expect(screen.getByTestId('fiat-balance')).toHaveTextContent('1000')
    expect(screen.getByTestId('threshold-badge')).toHaveTextContent('2/3')
  })

  it('shows shortened address as subtitle', () => {
    const address = '0xabc1234567890def'
    render(
      <FormWrapper>
        <SafeCard safe={buildSafe(address)} />
      </FormWrapper>,
    )

    expect(screen.getByText('0xabc1...0def')).toBeInTheDocument()
  })

  it('bolds first and last 4 chars of address when isSimilar', () => {
    const address = '0xABCDEF1234567890abcdef'
    const { container } = render(
      <FormWrapper>
        <SafeCard safe={buildSafe(address)} isSimilar />
      </FormWrapper>,
    )

    const boldElements = container.querySelectorAll('b')
    expect(boldElements).toHaveLength(2)
    expect(boldElements[0].textContent).toBe(address.slice(2, 6))
    expect(boldElements[1].textContent).toBe(address.slice(-4))
  })

  it('does not bold address when not similar', () => {
    const { container } = render(
      <FormWrapper>
        <SafeCard safe={buildSafe('0xabc123')} />
      </FormWrapper>,
    )

    expect(container.querySelectorAll('b')).toHaveLength(0)
  })

  it('does not show similarity badge when isSimilar is false', () => {
    render(
      <FormWrapper>
        <SafeCard safe={buildSafe('0xabc123')} />
      </FormWrapper>,
    )

    expect(screen.queryByText('High similarity')).not.toBeInTheDocument()
  })

  it('shows similarity badge when isSimilar is true', () => {
    render(
      <FormWrapper>
        <SafeCard safe={buildSafe('0xabc123')} isSimilar />
      </FormWrapper>,
    )

    expect(screen.getByText('High similarity')).toBeInTheDocument()
  })

  it('toggles single-chain safe checkbox on click', () => {
    render(
      <FormWrapper>
        <SafeCard safe={buildSafe('0xabc123')} />
      </FormWrapper>,
    )

    const checkboxes = screen.getAllByRole('checkbox')
    const cardButton = checkboxes.find((el) => el.tagName === 'BUTTON')!
    fireEvent.click(cardButton)

    expect(cardButton).toHaveAttribute('aria-checked', 'true')
  })

  it('renders multi-chain safe with chain badge', () => {
    render(
      <FormWrapper>
        <SafeCard safe={buildMultiChain('0xmulti', ['1', '137'])} />
      </FormWrapper>,
    )

    expect(screen.getByTestId('chain-badge')).toHaveTextContent('2 chains')
  })

  it('toggles all sub-safes for multi-chain safe on click', () => {
    render(
      <FormWrapper>
        <SafeCard safe={buildMultiChain('0xmulti', ['1', '137'])} />
      </FormWrapper>,
    )

    const checkboxes = screen.getAllByRole('checkbox')
    const cardButton = checkboxes.find((el) => el.tagName === 'BUTTON')!
    fireEvent.click(cardButton)

    expect(cardButton).toHaveAttribute('aria-checked', 'true')
  })
})
