import { render, screen, fireEvent } from '@/tests/test-utils'
import AccountItemPinButton from '../AccountItemPinButton'
import type { SafeItem } from '@/hooks/safes'

const mockAddress = '0x1234567890123456789012345678901234567890'
const mockChainId = '1'
const mockOwners = [{ value: '0xowner1' }, { value: '0xowner2' }]

const createMockSafeItem = (overrides: Partial<SafeItem> = {}): SafeItem => ({
  address: mockAddress,
  chainId: mockChainId,
  isReadOnly: false,
  isPinned: false,
  lastVisited: 0,
  name: '',
  ...overrides,
})

describe('AccountItemPinButton', () => {
  describe('single chain mode', () => {
    it('should render the bookmark icon when not pinned', () => {
      const safeItem = createMockSafeItem({ isPinned: false })

      render(<AccountItemPinButton safeItem={safeItem} threshold={2} owners={mockOwners} />)

      expect(screen.getByTestId('bookmark-icon')).toBeInTheDocument()
    })

    it('should render the bookmark icon when pinned', () => {
      const safeItem = createMockSafeItem({ isPinned: true })

      render(<AccountItemPinButton safeItem={safeItem} threshold={2} owners={mockOwners} />)

      expect(screen.getByTestId('bookmark-icon')).toBeInTheDocument()
    })

    it('should stop event propagation when clicked', () => {
      const safeItem = createMockSafeItem()

      render(<AccountItemPinButton safeItem={safeItem} threshold={2} owners={mockOwners} />)

      const button = screen.getByTestId('bookmark-icon')
      const clickEvent = new MouseEvent('click', { bubbles: true })
      const stopPropagationSpy = jest.spyOn(clickEvent, 'stopPropagation')
      const preventDefaultSpy = jest.spyOn(clickEvent, 'preventDefault')

      fireEvent(button, clickEvent)

      expect(stopPropagationSpy).toHaveBeenCalled()
      expect(preventDefaultSpy).toHaveBeenCalled()
    })
  })

  describe('multi chain mode', () => {
    it('should render the bookmark icon when none are pinned', () => {
      const safeItems = [
        createMockSafeItem({ chainId: '1', isPinned: false }),
        createMockSafeItem({ chainId: '137', isPinned: false }),
      ]

      render(<AccountItemPinButton safeItems={safeItems} />)

      expect(screen.getByTestId('bookmark-icon')).toBeInTheDocument()
    })

    it('should render the bookmark icon when all are pinned', () => {
      const safeItems = [
        createMockSafeItem({ chainId: '1', isPinned: true }),
        createMockSafeItem({ chainId: '137', isPinned: true }),
      ]

      render(<AccountItemPinButton safeItems={safeItems} />)

      expect(screen.getByTestId('bookmark-icon')).toBeInTheDocument()
    })

    it('should show as pinned when some (but not all) chains are pinned', () => {
      const safeItems = [
        createMockSafeItem({ chainId: '1', isPinned: true }),
        createMockSafeItem({ chainId: '137', isPinned: false }),
        createMockSafeItem({ chainId: '10', isPinned: false }),
      ]

      render(<AccountItemPinButton safeItems={safeItems} />)

      const iconButton = screen.getByTestId('bookmark-icon')
      const svgIcon = iconButton.querySelector('.MuiSvgIcon-colorPrimary')
      expect(svgIcon).toBeInTheDocument()
    })

    it('should stop event propagation when clicked', () => {
      const safeItems = [createMockSafeItem({ chainId: '1' }), createMockSafeItem({ chainId: '137' })]

      render(<AccountItemPinButton safeItems={safeItems} />)

      const button = screen.getByTestId('bookmark-icon')
      const clickEvent = new MouseEvent('click', { bubbles: true })
      const stopPropagationSpy = jest.spyOn(clickEvent, 'stopPropagation')
      const preventDefaultSpy = jest.spyOn(clickEvent, 'preventDefault')

      fireEvent(button, clickEvent)

      expect(stopPropagationSpy).toHaveBeenCalled()
      expect(preventDefaultSpy).toHaveBeenCalled()
    })
  })
})
