import { createElement, type ReactNode } from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GeoblockingContext } from '@/components/common/GeoblockingProvider'
import ActionsTray, { TRANSACTION_BUILDER_TOOLTIP } from '../ActionsTray'
import { FEATURES } from '@safe-global/utils/utils/chains'

const mockDispatch = jest.fn()
const mockUseHasFeature = jest.fn()

jest.mock('next/router', () => ({
  useRouter: () => ({ query: { safe: 'eth:0x1' }, pathname: '/' }),
}))

jest.mock('@/hooks/useChains', () => ({
  useHasFeature: (feature: string) => mockUseHasFeature(feature),
}))

jest.mock('@/hooks/safe-apps/useTxBuilderApp', () => ({
  useTxBuilderApp: () => ({ link: { pathname: '/apps/open', query: { appUrl: 'https://tx-builder.example' } } }),
}))

jest.mock('@/hooks/useDarkMode', () => ({
  useDarkMode: () => false,
}))

jest.mock('@/store', () => ({
  useAppDispatch: () => mockDispatch,
}))

jest.mock('@/features/spaces', () => ({
  useCurrentSpaceId: () => '42',
}))

jest.mock('@/components/common/Track', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

jest.mock('@/components/common/QrCodeButton', () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

// CheckWallet is used for the "safe" variant. We bypass it by always passing ok=true.
jest.mock('@/components/common/CheckWallet', () => ({
  __esModule: true,
  default: ({ children }: { children: (ok: boolean) => ReactNode }) => <>{children(true)}</>,
}))

const renderTray = ({
  isBlockedCountry,
  variant = 'space',
  hasNativeSwap = true,
  noAssets = false,
}: {
  isBlockedCountry: boolean
  variant?: 'safe' | 'space'
  hasNativeSwap?: boolean
  noAssets?: boolean
}) => {
  mockUseHasFeature.mockImplementation((feature: string) => (feature === FEATURES.NATIVE_SWAPS ? hasNativeSwap : false))

  return render(
    createElement(
      GeoblockingContext.Provider,
      { value: isBlockedCountry },
      <ActionsTray noAssets={noAssets} variant={variant} />,
    ),
  )
}

describe('ActionsTray geoblocking', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('Send button', () => {
    it('is enabled when the user is not geoblocked', () => {
      renderTray({ isBlockedCountry: false })

      const sendButton = screen.getByRole('button', { name: /send/i })
      expect(sendButton).toBeEnabled()
    })

    it('is disabled and shows not-allowed cursor wrapper when the user is geoblocked', () => {
      const { container } = renderTray({ isBlockedCountry: true })

      const sendButton = screen.getByRole('button', { name: /send/i })
      expect(sendButton).toBeDisabled()

      const wrapper = container.querySelector('span.cursor-not-allowed')
      expect(wrapper).not.toBeNull()
      expect(wrapper).toContainElement(sendButton)
    })

    it('shows the geoblocking tooltip on hover when geoblocked', async () => {
      renderTray({ isBlockedCountry: true })

      const sendButton = screen.getByRole('button', { name: /send/i })
      // Hover the wrapping span (the button itself has pointer-events: none while disabled)
      fireEvent.mouseOver(sendButton.parentElement as HTMLElement)

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toHaveTextContent('Send is not allowed for your country')
      })
    })

    it('is disabled and shows the no-assets tooltip when noAssets is true', async () => {
      const { container } = renderTray({ isBlockedCountry: false, noAssets: true })

      const sendButton = screen.getByRole('button', { name: /send/i })
      expect(sendButton).toBeDisabled()

      const wrapper = container.querySelector('span.cursor-not-allowed')
      expect(wrapper).not.toBeNull()
      expect(wrapper).toContainElement(sendButton)

      fireEvent.mouseOver(sendButton.parentElement as HTMLElement)
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toHaveTextContent('You have no assets or balance on this safe account')
      })
    })

    it('prefers the geoblocking tooltip over the no-assets tooltip when both are true', async () => {
      renderTray({ isBlockedCountry: true, noAssets: true })

      const sendButton = screen.getByRole('button', { name: /send/i })
      fireEvent.mouseOver(sendButton.parentElement as HTMLElement)
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toHaveTextContent('Send is not allowed for your country')
      })
    })
  })

  describe('Swap button', () => {
    it('is not rendered when the chain does not support NATIVE_SWAPS', () => {
      renderTray({ isBlockedCountry: false, hasNativeSwap: false })
      expect(screen.queryByRole('button', { name: /swap/i })).toBeNull()
    })

    it('is enabled when the chain supports NATIVE_SWAPS and the user is not geoblocked', () => {
      renderTray({ isBlockedCountry: false })

      const swapButton = screen.getByRole('button', { name: /swap/i })
      expect(swapButton).toBeEnabled()
    })

    it('is disabled and shows not-allowed cursor wrapper when the user is geoblocked', () => {
      const { container } = renderTray({ isBlockedCountry: true })

      const swapButton = screen.getByRole('button', { name: /swap/i })
      expect(swapButton).toBeDisabled()

      const wrapperForSwap = Array.from(container.querySelectorAll('span.cursor-not-allowed')).find((el) =>
        el.contains(swapButton),
      )
      expect(wrapperForSwap).toBeDefined()
    })

    it('shows the geoblocking tooltip on hover when geoblocked', async () => {
      renderTray({ isBlockedCountry: true })

      const swapButton = screen.getByRole('button', { name: /swap/i })
      fireEvent.mouseOver(swapButton.parentElement as HTMLElement)

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toHaveTextContent('Swap is not allowed for your country')
      })
    })

    it('is disabled and shows the no-assets tooltip when noAssets is true', async () => {
      const { container } = renderTray({ isBlockedCountry: false, noAssets: true })

      const swapButton = screen.getByRole('button', { name: /swap/i })
      expect(swapButton).toBeDisabled()

      const wrapperForSwap = Array.from(container.querySelectorAll('span.cursor-not-allowed')).find((el) =>
        el.contains(swapButton),
      )
      expect(wrapperForSwap).toBeDefined()

      fireEvent.mouseOver(swapButton.parentElement as HTMLElement)
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toHaveTextContent('You have no assets or balance on this safe account')
      })
    })

    it('prefers the geoblocking tooltip over the no-assets tooltip when both are true', async () => {
      renderTray({ isBlockedCountry: true, noAssets: true })

      const swapButton = screen.getByRole('button', { name: /swap/i })
      fireEvent.mouseOver(swapButton.parentElement as HTMLElement)
      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toHaveTextContent('Swap is not allowed for your country')
      })
    })
  })

  describe('Receive button (space variant)', () => {
    it('is enabled when the space has assets and the user is not geoblocked', () => {
      renderTray({ isBlockedCountry: false })

      const receiveButton = screen.getByRole('button', { name: /receive/i })
      expect(receiveButton).toBeEnabled()
    })

    it('is disabled when the space has no assets', () => {
      renderTray({ isBlockedCountry: false, noAssets: true })

      const receiveButton = screen.getByRole('button', { name: /receive/i })
      expect(receiveButton).toBeDisabled()
    })

    it('remains enabled when the user is geoblocked (Receive should stay available)', () => {
      renderTray({ isBlockedCountry: true })

      const receiveButton = screen.getByRole('button', { name: /receive/i })
      expect(receiveButton).toBeEnabled()
    })
  })

  describe('Transaction Builder button (safe / dashboard variant)', () => {
    it('shows a descriptive tooltip on hover when the wallet check passes', async () => {
      const user = userEvent.setup()
      renderTray({ isBlockedCountry: false, variant: 'safe' })

      const buildTxControl = screen.getByRole('link', { name: /transaction builder/i })
      expect(buildTxControl).toBeEnabled()

      const tooltipTrigger = buildTxControl.parentElement
      expect(tooltipTrigger).toBeTruthy()
      await user.hover(tooltipTrigger as HTMLElement)

      await waitFor(() => {
        expect(screen.getByRole('tooltip')).toHaveTextContent(TRANSACTION_BUILDER_TOOLTIP)
      })
    })
  })

  describe('Build transaction button (space variant)', () => {
    it('is enabled when the space has assets and the user is not geoblocked', () => {
      renderTray({ isBlockedCountry: false })

      const buildTxButton = screen.getByRole('button', { name: /transaction builder/i })
      expect(buildTxButton).toBeEnabled()
    })

    it('is disabled when the space has no assets', () => {
      renderTray({ isBlockedCountry: false, noAssets: true })

      const buildTxButton = screen.getByRole('button', { name: /transaction builder/i })
      expect(buildTxButton).toBeDisabled()
    })

    it('remains enabled when the user is geoblocked (Build transaction should stay available)', () => {
      renderTray({ isBlockedCountry: true })

      const buildTxButton = screen.getByRole('button', { name: /transaction builder/i })
      expect(buildTxButton).toBeEnabled()
    })
  })
})
