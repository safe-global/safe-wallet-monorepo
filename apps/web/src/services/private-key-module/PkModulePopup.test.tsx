import { render, screen } from '@/tests/test-utils'
import PkModulePopup from './PkModulePopup'
import pkStore from './pk-popup-store'

jest.mock('@/hooks/use-mobile', () => ({
  useIsMobile: jest.fn(() => false),
}))

jest.mock('./pk-popup-store', () => ({
  __esModule: true,
  default: {
    useStore: jest.fn(),
    setStore: jest.fn(),
  },
}))

const mockUseStore = jest.mocked(pkStore.useStore)
const mockSetStore = jest.mocked(pkStore.setStore)

describe('PkModulePopup', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseStore.mockReturnValue({ isOpen: true, privateKey: '' })
  })

  /**
   * web3-onboard's connect modal is still on screen when the private key is requested, and it sits
   * at `--onboard-modal-z-index: 1450` with an opaque pointer-capturing scrim. Both the popup and
   * its own scrim have to clear that, or the dialog paints underneath and every click lands on
   * onboard.
   */
  it('stacks the popup above the web3-onboard connect modal', () => {
    render(<PkModulePopup />)

    const popup = screen.getByTestId('modal-view')
    expect(popup).toHaveClass('z-[var(--z-above-onboard)]')
    expect(popup).not.toHaveClass('z-[var(--z-overlay)]')
  })

  it('stacks the popup scrim above the web3-onboard scrim', () => {
    render(<PkModulePopup />)

    const overlay = document.querySelector('[data-slot="dialog-overlay"]')
    expect(overlay).toHaveClass('z-[var(--z-above-onboard)]')
    expect(overlay).not.toHaveClass('z-[var(--z-overlay)]')
  })

  it('closes without keeping the entered key when dismissed', () => {
    mockUseStore.mockReturnValue({ isOpen: true, privateKey: '0xdeadbeef' })
    render(<PkModulePopup />)

    screen.getByTestId('modal-dialog-close-btn').click()

    expect(mockSetStore).toHaveBeenCalledWith({ isOpen: false, privateKey: '0xdeadbeef' })
  })
})
