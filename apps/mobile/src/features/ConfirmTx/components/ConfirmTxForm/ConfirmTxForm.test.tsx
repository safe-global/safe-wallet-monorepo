import React from 'react'
import { act, render } from '@/src/tests/test-utils'
import { View, Text } from 'react-native'
import type Safe from '@safe-global/protocol-kit'
import { ConfirmTxForm } from './ConfirmTxForm'
import { setSafeSDK } from '@/src/hooks/coreSDK/safeCoreSDK'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { AlreadySigned } from '../confirmation-views/AlreadySigned'
import { CanNotSign } from '../CanNotSign'
import { ExecuteForm } from '../ExecuteForm'
import { SignForm } from '../SignForm'
import { useTransactionSigner } from '../../hooks/useTransactionSigner'
import { CanNotExecute } from '@/src/features/ExecuteTx/components/CanNotExecute'

// Mock the hooks and components
jest.mock('@/src/store/hooks/activeSafe')
jest.mock('../../hooks/useTransactionSigner')
jest.mock('../confirmation-views/AlreadySigned')
jest.mock('../CanNotSign')
jest.mock('@/src/features/ExecuteTx/components/CanNotExecute')
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
    setSafeSDK({} as Safe)

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
    ;(CanNotExecute as jest.Mock).mockReturnValue(
      <View>
        <Text>CanNotExecute</Text>
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
    isPending: false,
    riskAcknowledged: false,
    onRiskAcknowledgedChange: jest.fn(),
  }

  it('renders AlreadySigned when hasSigned is true', () => {
    ;(useTransactionSigner as jest.Mock).mockReturnValue({
      signerState: { ...mockSignerState, hasSigned: true },
    })

    const { getByText } = render(<ConfirmTxForm {...defaultProps} />)

    expect(getByText('AlreadySigned')).toBeTruthy()
    expect(AlreadySigned).toHaveBeenCalled()
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
        txId: 'tx123',
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

  it('renders CanNotExecute when no active signer', () => {
    ;(useTransactionSigner as jest.Mock).mockReturnValue({
      signerState: { ...mockSignerState, activeSigner: undefined },
    })

    const { getByText } = render(<ConfirmTxForm {...defaultProps} isExpired={true} />)

    expect(getByText('CanNotExecute')).toBeTruthy()
  })

  describe('while the Safe SDK is initializing', () => {
    beforeEach(() => {
      setSafeSDK(undefined)
    })

    it('shows the loader instead of SignForm', () => {
      const { getByText, queryByText } = render(<ConfirmTxForm {...defaultProps} />)

      expect(getByText('Initializing Safe SDK...')).toBeTruthy()
      expect(queryByText('SignForm')).toBeNull()
    })

    it('shows the loader instead of ExecuteForm', () => {
      const { getByText, queryByText } = render(<ConfirmTxForm {...defaultProps} hasEnoughConfirmations={true} />)

      expect(getByText('Initializing Safe SDK...')).toBeTruthy()
      expect(queryByText('ExecuteForm')).toBeNull()
    })

    it('still renders AlreadySigned', () => {
      ;(useTransactionSigner as jest.Mock).mockReturnValue({
        signerState: { ...mockSignerState, hasSigned: true },
      })

      const { getByText } = render(<ConfirmTxForm {...defaultProps} />)

      expect(getByText('AlreadySigned')).toBeTruthy()
    })

    it('renders SignForm once the SDK is ready', () => {
      const { getByText, queryByText } = render(<ConfirmTxForm {...defaultProps} />)

      act(() => setSafeSDK({} as Safe))

      expect(getByText('SignForm')).toBeTruthy()
      expect(queryByText('Initializing Safe SDK...')).toBeNull()
    })
  })
})
