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

  it('closes without keeping the entered key when dismissed', () => {
    mockUseStore.mockReturnValue({ isOpen: true, privateKey: '0xdeadbeef' })
    render(<PkModulePopup />)

    screen.getByTestId('modal-dialog-close-btn').click()

    expect(mockSetStore).toHaveBeenCalledWith({ isOpen: false, privateKey: '0xdeadbeef' })
  })
})
