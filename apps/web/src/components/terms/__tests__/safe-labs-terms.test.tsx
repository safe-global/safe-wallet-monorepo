import { render, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/router'
import SafeLabsTerms from '../safe-labs-terms'
import * as safeLabsTermsService from '@/services/safe-labs-terms'
import * as securityService from '@/services/safe-labs-terms/security'
import * as headerModule from '@/components/common/Header'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

// Mock the services
jest.mock('@/services/safe-labs-terms', () => ({
  setSafeLabsTermsAccepted: jest.fn(),
}))

jest.mock('@/services/safe-labs-terms/security', () => ({
  getSafeRedirectUrl: jest.fn(),
  isValidAutoConnectParam: jest.fn(),
}))

jest.mock('@/components/common/Header', () => ({
  getLogoLink: jest.fn(),
}))

// Mock Next.js Link component
jest.mock('next/link', () => {
  const MockLink = ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  }
  MockLink.displayName = 'MockLink'
  return MockLink
})

// Mock SVG imports
jest.mock('@/public/images/common/check.svg', () => 'svg')
jest.mock('@/public/images/logo-safe-labs.svg', () => 'svg')

describe('SafeLabsTerms', () => {
  const mockPush = jest.fn()
  const mockRouter = {
    push: mockPush,
    query: {},
    pathname: '/safe-labs-terms',
    asPath: '/safe-labs-terms',
  }

  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks()
    window.localStorage.clear()

    // Setup default mock implementations
    ;(useRouter as jest.Mock).mockReturnValue(mockRouter)
    ;(securityService.getSafeRedirectUrl as jest.Mock).mockReturnValue({
      pathname: '/home',
      query: {},
    })
    ;(securityService.isValidAutoConnectParam as jest.Mock).mockReturnValue(false)
    ;(headerModule.getLogoLink as jest.Mock).mockReturnValue('/')

    Object.defineProperty(window, 'location', {
      value: { href: '' },
      writable: true,
    })
  })

  afterEach(() => {
    window.localStorage.clear()
  })

  describe('Accepting Terms', () => {
    it('should call setSafeLabsTermsAccepted when accepting terms', async () => {
      const { getByText, getByRole } = render(<SafeLabsTerms />)

      // Check the required checkboxes (but NOT requestDataTransfer)
      const termsCheckbox = getByRole('checkbox', { name: /I want to use Safe.*Terms & Conditions/i })
      const liabilityCheckbox = getByRole('checkbox', {
        name: /I acknowledge that Safe Labs GmbH does not assume any liabilities/i,
      })

      fireEvent.click(termsCheckbox)
      fireEvent.click(liabilityCheckbox)

      // Click the accept button
      const acceptButton = getByText(/Accept terms & Continue/i)
      fireEvent.click(acceptButton)

      // Verify setSafeLabsTermsAccepted was called
      await waitFor(() => {
        expect(safeLabsTermsService.setSafeLabsTermsAccepted).toHaveBeenCalledTimes(1)
      })
    })

    it('should use router.push to redirect after accepting terms', async () => {
      const { getByText, getByRole } = render(<SafeLabsTerms />)

      // Check the required checkboxes
      const termsCheckbox = getByRole('checkbox', { name: /I want to use Safe.*Terms & Conditions/i })
      const liabilityCheckbox = getByRole('checkbox', {
        name: /I acknowledge that Safe Labs GmbH does not assume any liabilities/i,
      })

      fireEvent.click(termsCheckbox)
      fireEvent.click(liabilityCheckbox)

      // Click the accept button
      const acceptButton = getByText(/Accept terms & Continue/i)
      fireEvent.click(acceptButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith({
          pathname: '/home',
          query: {},
        })
      })
    })
  })

  describe('Data Transfer Checkbox', () => {
    it('should allow checking the data transfer checkbox', async () => {
      const { getByRole } = render(<SafeLabsTerms />)

      const dataTransferCheckbox = getByRole('checkbox', {
        name: /I request to transfer my personal data/i,
      }) as HTMLInputElement

      expect(dataTransferCheckbox.checked).toBe(false)

      fireEvent.click(dataTransferCheckbox)

      expect(dataTransferCheckbox.checked).toBe(true)
    })

    it('should still redirect after accepting with data transfer checkbox checked', async () => {
      const { getByText, getByRole } = render(<SafeLabsTerms />)

      const termsCheckbox = getByRole('checkbox', { name: /I want to use Safe.*Terms & Conditions/i })
      const liabilityCheckbox = getByRole('checkbox', {
        name: /I acknowledge that Safe Labs GmbH does not assume any liabilities/i,
      })
      const dataTransferCheckbox = getByRole('checkbox', {
        name: /I request to transfer my personal data/i,
      })

      fireEvent.click(termsCheckbox)
      fireEvent.click(liabilityCheckbox)
      fireEvent.click(dataTransferCheckbox)

      const acceptButton = getByText(/Accept terms & Continue/i)
      fireEvent.click(acceptButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith({
          pathname: '/home',
          query: {},
        })
      })

      expect(safeLabsTermsService.setSafeLabsTermsAccepted).toHaveBeenCalledTimes(1)
    })
  })

  describe('Button State', () => {
    it('should disable accept button when terms are not accepted', () => {
      const { getByText } = render(<SafeLabsTerms />)
      const acceptButton = getByText(/Accept terms & Continue/i)

      expect(acceptButton).toBeDisabled()
    })

    it('should enable accept button when both required checkboxes are checked', () => {
      const { getByText, getByRole } = render(<SafeLabsTerms />)

      const termsCheckbox = getByRole('checkbox', { name: /I want to use Safe.*Terms & Conditions/i })
      const liabilityCheckbox = getByRole('checkbox', {
        name: /I acknowledge that Safe Labs GmbH does not assume any liabilities/i,
      })

      fireEvent.click(termsCheckbox)
      fireEvent.click(liabilityCheckbox)

      const acceptButton = getByText(/Accept terms & Continue/i)
      expect(acceptButton).not.toBeDisabled()
    })
  })

  describe('Redirect URL handling', () => {
    it('should handle redirect query parameter', async () => {
      ;(useRouter as jest.Mock).mockReturnValue({
        ...mockRouter,
        query: { redirect: '/balances' },
      })
      ;(securityService.getSafeRedirectUrl as jest.Mock).mockReturnValue({
        pathname: '/balances',
        query: {},
      })

      const { getByText, getByRole } = render(<SafeLabsTerms />)

      const termsCheckbox = getByRole('checkbox', { name: /I want to use Safe.*Terms & Conditions/i })
      const liabilityCheckbox = getByRole('checkbox', {
        name: /I acknowledge that Safe Labs GmbH does not assume any liabilities/i,
      })

      fireEvent.click(termsCheckbox)
      fireEvent.click(liabilityCheckbox)

      const acceptButton = getByText(/Accept terms & Continue/i)
      fireEvent.click(acceptButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith({
          pathname: '/balances',
          query: {},
        })
      })
    })

    it('should handle autoConnect parameter', async () => {
      ;(useRouter as jest.Mock).mockReturnValue({
        ...mockRouter,
        query: { autoConnect: 'true' },
      })
      ;(securityService.isValidAutoConnectParam as jest.Mock).mockReturnValue(true)

      const { getByText, getByRole } = render(<SafeLabsTerms />)

      const termsCheckbox = getByRole('checkbox', { name: /I want to use Safe.*Terms & Conditions/i })
      const liabilityCheckbox = getByRole('checkbox', {
        name: /I acknowledge that Safe Labs GmbH does not assume any liabilities/i,
      })

      fireEvent.click(termsCheckbox)
      fireEvent.click(liabilityCheckbox)

      const acceptButton = getByText(/Accept terms & Continue/i)
      fireEvent.click(acceptButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith({
          pathname: '/home',
          query: {
            autoConnect: 'true',
          },
        })
      })
    })

    it('should handle both redirect and autoConnect parameters', async () => {
      ;(useRouter as jest.Mock).mockReturnValue({
        ...mockRouter,
        query: { redirect: '/balances', autoConnect: 'true' },
      })
      ;(securityService.getSafeRedirectUrl as jest.Mock).mockReturnValue({
        pathname: '/balances',
        query: {},
      })
      ;(securityService.isValidAutoConnectParam as jest.Mock).mockReturnValue(true)

      const { getByText, getByRole } = render(<SafeLabsTerms />)

      const termsCheckbox = getByRole('checkbox', { name: /I want to use Safe.*Terms & Conditions/i })
      const liabilityCheckbox = getByRole('checkbox', {
        name: /I acknowledge that Safe Labs GmbH does not assume any liabilities/i,
      })

      fireEvent.click(termsCheckbox)
      fireEvent.click(liabilityCheckbox)

      const acceptButton = getByText(/Accept terms & Continue/i)
      fireEvent.click(acceptButton)

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith({
          pathname: '/balances',
          query: {
            autoConnect: 'true',
          },
        })
      })
    })
  })
})
