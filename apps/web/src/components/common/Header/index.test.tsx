import Header from '@/components/common/Header/index'
import * as useChains from '@/hooks/useChains'
import * as useIsSafeOwner from '@/hooks/useIsSafeOwner'
import * as useProposers from '@/hooks/useProposers'
import * as useSafeAddress from '@/hooks/useSafeAddress'
import * as useSafeTokenEnabled from '@/hooks/useSafeTokenEnabled'
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

jest.mock('@/features/walletconnect', () => ({
  __esModule: true,
  default: function WalletConnect() {
    return <div>WalletConnect</div>
  },
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

describe('Header', () => {
  beforeEach(() => {
    jest.resetAllMocks()
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

  it('renders the WalletConnect component when enableWc is true', () => {
    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(true)

    render(<Header />)
    expect(screen.getByText('WalletConnect')).toBeInTheDocument()
  })

  it('does not render the WalletConnect component when enableWc is false', () => {
    jest.spyOn(useChains, 'useHasFeature').mockReturnValue(false)

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
