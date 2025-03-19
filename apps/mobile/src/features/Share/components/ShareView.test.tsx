import React from 'react'
import { render, fireEvent, waitFor } from '@testing-library/react-native'
import { ShareView } from './ShareView'
import Share from 'react-native-share'
import { useCopyAndDispatchToast } from '@/src/hooks/useCopyAndDispatchToast'
import { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import { SafeInfo } from '@/src/types/address'

// Mock react-native-share
jest.mock('react-native-share', () => ({
  open: jest.fn().mockResolvedValue({}),
}))

// Mock the copy hook
jest.mock('@/src/hooks/useCopyAndDispatchToast', () => ({
  useCopyAndDispatchToast: jest.fn(),
}))

// Mock chain names util to return a fixed string
jest.mock('@/src/utils/chains', () => ({
  getAvailableChainsNames: jest.fn(() => 'Ethereum and Polygon'),
}))

jest.mock('@tamagui/toast', () => ({
  ToastViewport: () => null,
}))

const mockCopyAndDispatchToast = jest.fn()

describe('ShareView', () => {
  beforeEach(() => {
    ;(useCopyAndDispatchToast as jest.Mock).mockReturnValue(mockCopyAndDispatchToast)
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  it('renders null when activeSafe is null', () => {
    const { toJSON } = render(<ShareView activeSafe={null} availableChains={[]} />)
    expect(toJSON()).toBeNull()
  })

  it('renders safe address and chain names when activeSafe is provided', () => {
    const activeSafe = { address: '0x123', chainId: '1' } as SafeInfo
    const availableChains = [{ chainName: 'Ethereum' }, { chainName: 'Polygon' }] as Chain[]
    const { getByText } = render(<ShareView activeSafe={activeSafe} availableChains={availableChains} />)
    expect(getByText(activeSafe.address)).toBeTruthy()
    // Check that the chains text is rendered as expected.
    expect(getByText(/Ethereum and Polygon/)).toBeTruthy()
  })

  it('calls Share.open with the correct parameters when share button is pressed', async () => {
    const activeSafe = { address: '0x123', chainId: '1' } as SafeInfo
    const availableChains = [{ chainName: 'Ethereum' }] as Chain[]
    const { getByText } = render(<ShareView activeSafe={activeSafe} availableChains={availableChains} />)
    const shareButton = getByText('Share')
    fireEvent.press(shareButton)
    await waitFor(() => {
      expect(Share.open).toHaveBeenCalledWith({
        title: 'Your safe Address',
        message: activeSafe.address,
      })
    })
  })

  it('calls copyAndDispatchToast with safe address when copy button is pressed', () => {
    const activeSafe = { address: '0x123', chainId: '1' } as SafeInfo
    const availableChains = [{ chainName: 'Ethereum' }] as Chain[]
    const { getByText } = render(<ShareView activeSafe={activeSafe} availableChains={availableChains} />)
    const copyButton = getByText('Copy')
    fireEvent.press(copyButton)
    expect(mockCopyAndDispatchToast).toHaveBeenCalledWith(activeSafe.address)
  })
})
