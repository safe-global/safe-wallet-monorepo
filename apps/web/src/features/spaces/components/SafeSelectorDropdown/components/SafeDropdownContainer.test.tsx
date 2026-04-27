import React, { act } from 'react'
import { render, screen } from '@testing-library/react'
import SafeDropdownContainer from './SafeDropdownContainer'
import type { SafeItemData } from '../types'

// Render SelectContent as a plain div carrying the `data-slot` marker that the
// component's `closest()` lookup relies on, so the scroll-hint effect can find it.
jest.mock('@/components/ui/select', () => ({
  __esModule: true,
  SelectContent: ({ children, className }: { children?: React.ReactNode; className?: string }) => (
    <div data-slot="select-content" data-testid="select-content" className={className}>
      {children}
    </div>
  ),
  SelectItem: ({ children, value }: { children?: React.ReactNode; value?: string }) => (
    <div data-testid="select-item" data-value={value}>
      {children}
    </div>
  ),
}))

jest.mock('./SafeItem', () => ({
  __esModule: true,
  default: ({ name }: { name: string }) => <div data-testid="safe-item">{name}</div>,
}))

jest.mock('./MultiChainSafeItemRow', () => ({
  __esModule: true,
  default: ({ item }: { item: SafeItemData }) => <div data-testid="multi-chain-row">{item.name}</div>,
}))

const createItem = (overrides: Partial<SafeItemData> = {}): SafeItemData => ({
  id: '1:0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  name: 'Safe A',
  address: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
  threshold: 1,
  owners: 2,
  balance: '100',
  chains: [{ chainId: '1', chainName: 'Ethereum', chainLogoUri: null, shortName: 'eth' }],
  ...overrides,
})

const setScrollMetrics = (
  el: HTMLElement,
  { scrollHeight, clientHeight, scrollTop }: { scrollHeight: number; clientHeight: number; scrollTop: number },
) => {
  Object.defineProperty(el, 'scrollHeight', { configurable: true, value: scrollHeight })
  Object.defineProperty(el, 'clientHeight', { configurable: true, value: clientHeight })
  Object.defineProperty(el, 'scrollTop', { configurable: true, writable: true, value: scrollTop })
}

const fireScroll = (el: HTMLElement) => {
  act(() => {
    el.dispatchEvent(new Event('scroll'))
  })
}

describe('SafeDropdownContainer', () => {
  describe('footer', () => {
    it('renders the footer node when provided', () => {
      render(
        <SafeDropdownContainer
          items={[createItem()]}
          onItemSelect={jest.fn()}
          closeDropdown={jest.fn()}
          footer={<div data-testid="footer-node">All Accounts</div>}
        />,
      )

      expect(screen.getByTestId('footer-node')).toBeInTheDocument()
    })

    it('invokes the footer callback with closeDropdown when footer is a function', () => {
      const closeDropdown = jest.fn()
      const footerFn = jest.fn(() => <div data-testid="footer-node">FooterFn</div>)

      render(
        <SafeDropdownContainer
          items={[createItem()]}
          onItemSelect={jest.fn()}
          closeDropdown={closeDropdown}
          footer={footerFn}
        />,
      )

      expect(footerFn).toHaveBeenCalledWith(closeDropdown)
      expect(screen.getByTestId('footer-node')).toBeInTheDocument()
    })

    it('does not render the footer wrapper when no footer prop is passed', () => {
      render(<SafeDropdownContainer items={[createItem()]} onItemSelect={jest.fn()} closeDropdown={jest.fn()} />)

      expect(screen.queryByTestId('scroll-hint')).not.toBeInTheDocument()
    })
  })

  describe('scroll hint', () => {
    it('hides the hint when content does not overflow', () => {
      render(
        <SafeDropdownContainer
          items={[createItem()]}
          onItemSelect={jest.fn()}
          closeDropdown={jest.fn()}
          footer={<div>Footer</div>}
        />,
      )

      const scroller = screen.getByTestId('select-content')
      setScrollMetrics(scroller, { scrollHeight: 200, clientHeight: 320, scrollTop: 0 })
      fireScroll(scroller)

      expect(screen.queryByTestId('scroll-hint')).not.toBeInTheDocument()
    })

    it('shows the hint when content overflows and the user has not scrolled to the bottom', () => {
      render(
        <SafeDropdownContainer
          items={[createItem()]}
          onItemSelect={jest.fn()}
          closeDropdown={jest.fn()}
          footer={<div>Footer</div>}
        />,
      )

      const scroller = screen.getByTestId('select-content')
      setScrollMetrics(scroller, { scrollHeight: 1000, clientHeight: 320, scrollTop: 0 })
      fireScroll(scroller)

      expect(screen.getByTestId('scroll-hint')).toBeInTheDocument()
    })

    it('hides the hint once the user reaches the bottom', () => {
      render(
        <SafeDropdownContainer
          items={[createItem()]}
          onItemSelect={jest.fn()}
          closeDropdown={jest.fn()}
          footer={<div>Footer</div>}
        />,
      )

      const scroller = screen.getByTestId('select-content')
      setScrollMetrics(scroller, { scrollHeight: 1000, clientHeight: 320, scrollTop: 0 })
      fireScroll(scroller)
      expect(screen.getByTestId('scroll-hint')).toBeInTheDocument()

      setScrollMetrics(scroller, { scrollHeight: 1000, clientHeight: 320, scrollTop: 680 })
      fireScroll(scroller)

      expect(screen.queryByTestId('scroll-hint')).not.toBeInTheDocument()
    })
  })
})
