import { render, fireEvent, waitFor } from '@testing-library/react'
import { useRouter } from 'next/router'
import SafeLabsTerms from '../safe-labs-terms'
import * as safeLabsTermsService from '@/services/safe-labs-terms'
import * as securityService from '@/services/safe-labs-terms/security'
import * as headerModule from '@/components/common/Header'
import { LS_NAMESPACE } from '@/config/constants'

// Mock Next.js router
jest.mock('next/router', () => ({
  useRouter: jest.fn(),
}))

// Mock the services
jest.mock('@/services/safe-labs-terms', () => ({
  setSafeLabsTermsAccepted: jest.fn(),
  clearUserData: jest.fn(),
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

  describe('Data Transfer Not Requested', () => {
    it('should clear localStorage when user does NOT check requestDataTransfer', async () => {
      // Setup - Add some data to localStorage
      window.localStorage.setItem(`${LS_NAMESPACE}addressBook`, JSON.stringify({ test: 'data1' }))
      window.localStorage.setItem(`${LS_NAMESPACE}addedSafes`, JSON.stringify({ test: 'data2' }))
      window.localStorage.setItem(`${LS_NAMESPACE}settings`, JSON.stringify({ test: 'data3' }))

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

      // Verify clearUserData was called
      await waitFor(() => {
        expect(safeLabsTermsService.clearUserData).toHaveBeenCalledTimes(1)
      })

      // Verify setSafeLabsTermsAccepted was called
      expect(safeLabsTermsService.setSafeLabsTermsAccepted).toHaveBeenCalledTimes(1)
    })

    it('should call clearUserData before setSafeLabsTermsAccepted', async () => {
      const callOrder: string[] = []

      ;(safeLabsTermsService.clearUserData as jest.Mock).mockImplementation(() => {
        callOrder.push('clearUserData')
      })
      ;(safeLabsTermsService.setSafeLabsTermsAccepted as jest.Mock).mockImplementation(() => {
        callOrder.push('setSafeLabsTermsAccepted')
      })

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
        expect(callOrder).toEqual(['clearUserData', 'setSafeLabsTermsAccepted'])
      })
    })

    it('should redirect with window.location.href when data transfer is not requested', async () => {
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
        expect(window.location.href).toBe('/home')
      })

      expect(mockPush).not.toHaveBeenCalled()
    })
  })

  describe('Data Transfer Requested', () => {
    it('should NOT clear localStorage when user checks requestDataTransfer', async () => {
      window.localStorage.setItem(`${LS_NAMESPACE}addressBook`, JSON.stringify({ test: 'data1' }))
      window.localStorage.setItem(`${LS_NAMESPACE}addedSafes`, JSON.stringify({ test: 'data2' }))
      window.localStorage.setItem(`${LS_NAMESPACE}settings`, JSON.stringify({ test: 'data3' }))

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
        expect(safeLabsTermsService.clearUserData).not.toHaveBeenCalled()
      })

      expect(safeLabsTermsService.setSafeLabsTermsAccepted).toHaveBeenCalledTimes(1)
    })

    it('should use router.push when data transfer is requested', async () => {
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

      expect(window.location.href).toBe('')
    })

    it('should preserve localStorage data when data transfer is requested', async () => {
      const addressBookData = JSON.stringify({ test: 'data1' })
      const addedSafesData = JSON.stringify({ test: 'data2' })
      const settingsData = JSON.stringify({ test: 'data3' })

      window.localStorage.setItem(`${LS_NAMESPACE}addressBook`, addressBookData)
      window.localStorage.setItem(`${LS_NAMESPACE}addedSafes`, addedSafesData)
      window.localStorage.setItem(`${LS_NAMESPACE}settings`, settingsData)

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
        expect(mockPush).toHaveBeenCalled()
      })

      expect(window.localStorage.getItem(`${LS_NAMESPACE}addressBook`)).toBe(addressBookData)
      expect(window.localStorage.getItem(`${LS_NAMESPACE}addedSafes`)).toBe(addedSafesData)
      expect(window.localStorage.getItem(`${LS_NAMESPACE}settings`)).toBe(settingsData)
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
        expect(window.location.href).toBe('/balances')
      })
    })

    it('should handle autoConnect parameter when data transfer is not requested', async () => {
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
        expect(window.location.href).toBe('/home?autoConnect=true')
      })
    })

    it('should handle autoConnect parameter when data transfer is requested', async () => {
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
          query: {
            autoConnect: 'true',
          },
        })
      })
    })
  })
})
