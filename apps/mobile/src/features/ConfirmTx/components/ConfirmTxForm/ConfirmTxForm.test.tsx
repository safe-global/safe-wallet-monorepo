import React from 'react'
import { render } from '@testing-library/react-native'
import { View, Text } from 'react-native'
import { ConfirmTxForm } from './ConfirmTxForm'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { AlreadySigned } from '../confirmation-views/AlreadySigned'
import { CanNotSign } from '../CanNotSign'
import { ExecuteForm } from '../ExecuteForm'
import { SignForm } from '../SignForm'
import { useTransactionSigner } from '../../hooks/useTransactionSigner'

// Mock the hooks and components
jest.mock('@/src/store/hooks/activeSafe')
jest.mock('../../hooks/useTransactionSigner')
jest.mock('../confirmation-views/AlreadySigned')
jest.mock('../CanNotSign')
jest.mock('../ExecuteForm')
jest.mock('../SignForm')

describe('ConfirmTxForm', () => {
  const mockActiveSafe = {
    address: '0x123',
    chainId: '1',
  }

  const mockSignerState = {
    activeSigner: { value: '0x456' },
    hasSigned: false,
    canSign: true,
  }

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()

    // Mock the useDefinedActiveSafe hook
    ;(useDefinedActiveSafe as jest.Mock).mockReturnValue(mockActiveSafe)

    // Mock the useTransactionSigner hook
    ;(useTransactionSigner as jest.Mock).mockReturnValue({
      signerState: mockSignerState,
    })

    // Mock the components to return React Native components
    ;(AlreadySigned as jest.Mock).mockReturnValue(
      <View>
        <Text>AlreadySigned</Text>
      </View>,
    )
    ;(CanNotSign as jest.Mock).mockReturnValue(
      <View>
        <Text>CanNotSign</Text>
      </View>,
    )
    ;(ExecuteForm as jest.Mock).mockReturnValue(
      <View>
        <Text>ExecuteForm</Text>
      </View>,
    )
    ;(SignForm as jest.Mock).mockReturnValue(
      <View>
        <Text>SignForm</Text>
      </View>,
    )
  })

  const defaultProps = {
    hasEnoughConfirmations: false,
    isExpired: false,
    txId: 'tx123',
  }

  it('renders AlreadySigned when hasSigned is true', () => {
    ;(useTransactionSigner as jest.Mock).mockReturnValue({
      signerState: { ...mockSignerState, hasSigned: true },
    })

    const { getByText } = render(<ConfirmTxForm {...defaultProps} />)

    expect(getByText('AlreadySigned')).toBeTruthy()
    expect(AlreadySigned).toHaveBeenCalledWith(
      expect.objectContaining({
        txId: 'tx123',
        safeAddress: '0x123',
        chainId: '1',
      }),
      undefined,
    )
  })

  it('renders CanNotSign when canSign is false', () => {
    ;(useTransactionSigner as jest.Mock).mockReturnValue({
      signerState: { ...mockSignerState, canSign: false },
    })

    const { getByText } = render(<ConfirmTxForm {...defaultProps} />)

    expect(getByText('CanNotSign')).toBeTruthy()
  })

  it('renders ExecuteForm when hasEnoughConfirmations is true', () => {
    const { getByText } = render(<ConfirmTxForm {...defaultProps} hasEnoughConfirmations={true} />)

    expect(getByText('ExecuteForm')).toBeTruthy()
    expect(ExecuteForm).toHaveBeenCalledWith(
      expect.objectContaining({
        safeAddress: '0x123',
        chainId: '1',
      }),
      undefined,
    )
  })

  it('renders SignForm when activeSigner exists and not expired', () => {
    const { getByText } = render(<ConfirmTxForm {...defaultProps} />)

    expect(getByText('SignForm')).toBeTruthy()
    expect(SignForm).toHaveBeenCalledWith(
      expect.objectContaining({
        txId: 'tx123',
      }),
      undefined,
    )
  })

  it('renders null when no conditions are met', () => {
    ;(useTransactionSigner as jest.Mock).mockReturnValue({
      signerState: { ...mockSignerState, activeSigner: undefined },
    })

    const { toJSON } = render(<ConfirmTxForm {...defaultProps} isExpired={true} />)

    expect(toJSON()).toBeNull()
  })

  it('handles undefined activeSigner in CanNotSign', () => {
    ;(useTransactionSigner as jest.Mock).mockReturnValue({
      signerState: { ...mockSignerState, canSign: false, activeSigner: undefined },
    })

    const { getByText } = render(<ConfirmTxForm {...defaultProps} />)

    expect(getByText('CanNotSign')).toBeTruthy()
  })
})
