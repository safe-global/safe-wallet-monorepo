import React from 'react'
import { render, screen, fireEvent, waitFor } from '@/src/tests/test-utils'
import { ConnectSignerError } from '../ConnectSignerError'

const mockDismissAll = jest.fn()
const mockDismissTo = jest.fn()

jest.mock('expo-router', () => ({
  useRouter: () => ({
    dismissAll: mockDismissAll,
    dismissTo: mockDismissTo,
  }),
  useLocalSearchParams: () => ({
    address: '0xabc123',
    walletIcon: 'https://example.com/icon.png',
  }),
}))

jest.mock('@/src/features/WalletConnect/components/WalletConnectBadge', () => ({
  WalletConnectBadge: () => null,
}))

const mockSelectPendingSafe = jest.fn()

jest.mock('@/src/store/hooks', () => ({
  ...jest.requireActual('@/src/store/hooks'),
  useAppSelector: (selector: unknown) => {
    if (selector === require('@/src/store/signerImportFlowSlice').selectPendingSafe) {
      return mockSelectPendingSafe()
    }
    return undefined
  },
}))

describe('ConnectSignerError', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockSelectPendingSafe.mockReturnValue(null)
  })

  it('renders error message and done button', () => {
    render(<ConnectSignerError />)

    expect(screen.getByText("Can't sign with this wallet")).toBeTruthy()
    expect(screen.getByText("This wallet isn't a signer on this Safe.")).toBeTruthy()
    expect(screen.getByText('Connect a different wallet.')).toBeTruthy()
    expect(screen.getByTestId('connect-signer-error-done')).toBeTruthy()
  })

  it('navigates to signers on done press when no pending safe', async () => {
    render(<ConnectSignerError />)

    fireEvent.press(screen.getByTestId('connect-signer-error-done'))

    await waitFor(() => {
      expect(mockDismissAll).toHaveBeenCalledTimes(1)
      expect(mockDismissTo).toHaveBeenCalledWith('/signers')
    })
  })

  it('navigates to import-accounts signers when pending safe exists', async () => {
    mockSelectPendingSafe.mockReturnValue({ address: '0x123', name: 'My Safe' })

    render(<ConnectSignerError />)

    fireEvent.press(screen.getByTestId('connect-signer-error-done'))

    await waitFor(() => {
      expect(mockDismissAll).toHaveBeenCalledTimes(1)
      expect(mockDismissTo).toHaveBeenCalledWith({
        pathname: '/(import-accounts)/signers',
        params: { safeAddress: '0x123', safeName: 'My Safe' },
      })
    })
  })
})
