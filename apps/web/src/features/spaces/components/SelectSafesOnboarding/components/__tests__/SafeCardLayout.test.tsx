import { render, screen, fireEvent } from '@/tests/test-utils'
import { SafeCardLayout } from '../SafeCardLayout'
import { safeItemBuilder } from '@/tests/builders/safeItem'
import { chainBuilder } from '@/tests/builders/chains'

const mockChains = [chainBuilder().with({ chainId: '1', shortName: 'eth' }).build()]

jest.mock('@/hooks/useChains', () => ({
  __esModule: true,
  default: () => ({ configs: mockChains }),
  useChain: (chainId: string) => mockChains.find((chain) => chain.chainId === chainId),
}))

const baseProps = {
  checked: false,
  onToggle: jest.fn(),
  name: 'My Safe',
  address: '0x0000000000000000000000000000000000000001',
  safes: [safeItemBuilder().with({ chainId: '1', address: '0x0000000000000000000000000000000000000001' }).build()],
  fiatValue: undefined,
  threshold: 1,
  ownersCount: 1,
}

describe('SafeCardLayout', () => {
  it('renders FiatBalance when the safe is deployed', () => {
    render(<SafeCardLayout {...baseProps} fiatValue="123.45" isUndeployed={false} isActivating={false} />)

    expect(screen.queryByTestId('onboarding-not-activated-icon')).toBeNull()
  })

  it('renders the Inactive warning icon when the safe is undeployed', () => {
    render(<SafeCardLayout {...baseProps} fiatValue={undefined} isUndeployed isActivating={false} />)

    expect(screen.getByTestId('onboarding-not-activated-icon')).toHaveAttribute('aria-label', 'Inactive')
  })

  it('renders the Activating warning icon when activation is in flight', () => {
    render(<SafeCardLayout {...baseProps} fiatValue={undefined} isUndeployed isActivating />)

    expect(screen.getByTestId('onboarding-not-activated-icon')).toHaveAttribute('aria-label', 'Activating')
  })

  it('does not toggle when disabled', () => {
    const onToggle = jest.fn()
    render(<SafeCardLayout {...baseProps} onToggle={onToggle} disabled />)

    const card = screen.getAllByRole('checkbox').find((el) => el.tagName === 'BUTTON') as HTMLButtonElement
    expect(card).toBeDisabled()
    fireEvent.click(card)
    expect(onToggle).not.toHaveBeenCalled()
  })

  it('disables the inner checkbox and does not fire onCheckedChange when disabled', () => {
    const onCheckedChange = jest.fn()
    render(<SafeCardLayout {...baseProps} onToggle={jest.fn()} onCheckedChange={onCheckedChange} disabled />)

    const checkbox = screen.getAllByRole('checkbox').find((el) => el.getAttribute('data-slot') === 'checkbox')!
    expect(checkbox).toHaveAttribute('data-disabled')
    fireEvent.click(checkbox)
    expect(onCheckedChange).not.toHaveBeenCalled()
  })

  it('remains interactive when not disabled', () => {
    const onToggle = jest.fn()
    render(<SafeCardLayout {...baseProps} onToggle={onToggle} />)

    const card = screen.getAllByRole('checkbox').find((el) => el.tagName === 'BUTTON') as HTMLButtonElement
    expect(card).not.toBeDisabled()
    fireEvent.click(card)
    expect(onToggle).toHaveBeenCalled()
  })

  it('copies the address without toggling the card selection', () => {
    const writeText = jest.fn()
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } })
    const onToggle = jest.fn()
    render(<SafeCardLayout {...baseProps} onToggle={onToggle} />)

    fireEvent.click(screen.getByRole('button', { name: 'Copy address' }))

    expect(writeText).toHaveBeenCalledWith(baseProps.address)
    expect(onToggle).not.toHaveBeenCalled()
  })
})
