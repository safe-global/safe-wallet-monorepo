import Header from '@/components/common/Header/index'
import * as useIsSafeOwner from '@/hooks/useIsSafeOwner'
import * as useProposers from '@/hooks/useProposers'
import * as useSafeAddress from '@/hooks/useSafeAddress'
import * as useSafeTokenEnabled from '@/hooks/useSafeTokenEnabled'
import * as contracts from '@/features/__core__'
import { render } from '@/tests/test-utils'
import { faker } from '@faker-js/faker'
import { screen, fireEvent } from '@testing-library/react'

jest.mock(
  '@/components/common/SafeTokenWidget',
  () =>
    function SafeTokenWidget() {
      return <div>SafeTokenWidget</div>
    },
)

jest.mock('@/features/__core__', () => ({
  ...jest.requireActual('@/features/__core__'),
  useLoadFeature: jest.fn(),
}))

jest.mock(
  '@/components/common/NetworkSelector',
  () =>
    function NetworkSelector() {
      return <div>NetworkSelector</div>
    },
)

jest.mock('@/hooks/useIsOfficialHost', () => ({
  useIsOfficialHost: () => true,
}))

const mockUseLoadFeature = contracts.useLoadFeature as jest.Mock

describe('Header', () => {
  beforeEach(() => {
    jest.resetAllMocks()
    // Default: WalletConnect disabled - useLoadFeature always returns an object with stubs
    mockUseLoadFeature.mockReturnValue({
      $isDisabled: true,
      $isReady: false,
      WalletConnectWidget: () => null,
    })
  })

  it('renders the menu button when onMenuToggle is provided', () => {
    render(<Header onMenuToggle={jest.fn()} />)
    expect(screen.getByLabelText('menu')).toBeInTheDocument()
  })

  it('does not render the menu button when onMenuToggle is not provided', () => {
    render(<Header />)
    expect(screen.queryByLabelText('menu')).not.toBeInTheDocument()
  })

  it('calls onMenuToggle when menu button is clicked', () => {
    const onMenuToggle = jest.fn()
    render(<Header onMenuToggle={onMenuToggle} />)

    const menuButton = screen.getByLabelText('menu')
    fireEvent.click(menuButton)

    expect(onMenuToggle).toHaveBeenCalled()
  })

  it('renders the SafeTokenWidget when showSafeToken is true', () => {
    jest.spyOn(useSafeTokenEnabled, 'useSafeTokenEnabled').mockReturnValue(true)

    render(<Header />)
    expect(screen.getByText('SafeTokenWidget')).toBeInTheDocument()
  })

  it('does not render the SafeTokenWidget when showSafeToken is false', () => {
    jest.spyOn(useSafeTokenEnabled, 'useSafeTokenEnabled').mockReturnValue(false)

    render(<Header />)
    expect(screen.queryByText('SafeTokenWidget')).not.toBeInTheDocument()
  })

  it('displays the safe logo', () => {
    render(<Header />)
    expect(screen.getAllByAltText('Safe logo')[0]).toBeInTheDocument()
  })

  it('renders the BatchIndicator when showBatchButton is true', () => {
    jest.spyOn(useSafeAddress, 'default').mockReturnValue(faker.finance.ethereumAddress())
    jest.spyOn(useProposers, 'useIsWalletProposer').mockReturnValue(false)
    jest.spyOn(useIsSafeOwner, 'default').mockReturnValue(false)

    render(<Header />)
    expect(screen.getByTitle('Batch')).toBeInTheDocument()
  })

  it('does not render the BatchIndicator when there is no safe address', () => {
    jest.spyOn(useSafeAddress, 'default').mockReturnValue('')

    render(<Header />)
    expect(screen.queryByTitle('Batch')).not.toBeInTheDocument()
  })

  it('does not render the BatchIndicator when connected wallet is a proposer', () => {
    jest.spyOn(useProposers, 'useIsWalletProposer').mockReturnValue(true)

    render(<Header />)
    expect(screen.queryByTitle('Batch')).not.toBeInTheDocument()
  })

  it('renders the WalletConnect component when feature is enabled', () => {
    mockUseLoadFeature.mockReturnValue({
      name: 'walletconnect',
      WalletConnectWidget: () => <div>WalletConnect</div>,
    })

    render(<Header />)
    expect(screen.getByText('WalletConnect')).toBeInTheDocument()
  })

  it('does not render the WalletConnect component when feature is disabled', () => {
    // useLoadFeature returns stub that renders null when disabled (default in beforeEach)
    render(<Header />)
    expect(screen.queryByText('WalletConnect')).not.toBeInTheDocument()
  })

  it('renders the NetworkSelector when safeAddress exists', () => {
    jest.spyOn(useSafeAddress, 'default').mockReturnValue(faker.finance.ethereumAddress())

    render(<Header />)
    expect(screen.getByText('NetworkSelector')).toBeInTheDocument()
  })

  it('does not render the NetworkSelector when safeAddress is falsy', () => {
    jest.spyOn(useSafeAddress, 'default').mockReturnValue('')

    render(<Header />)
    expect(screen.queryByText('NetworkSelector')).not.toBeInTheDocument()
  })
})
