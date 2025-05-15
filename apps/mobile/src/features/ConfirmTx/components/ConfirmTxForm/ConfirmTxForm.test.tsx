import React from 'react'
import { render } from '@testing-library/react-native'
import { View, Text } from 'react-native'
import { ConfirmTxForm } from './ConfirmTxForm'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { AlreadySigned } from '../confirmation-views/AlreadySigned'
import { CanNotSign } from '../CanNotSign'
import { ExecuteForm } from '../ExecuteForm'
import { SignForm } from '../SignForm'

// Mock the hooks and components
jest.mock('@/src/store/hooks/activeSafe')
jest.mock('../confirmation-views/AlreadySigned')
jest.mock('../CanNotSign')
jest.mock('../ExecuteForm')
jest.mock('../SignForm')

describe('ConfirmTxForm', () => {
  const mockActiveSafe = {
    address: '0x123',
    chainId: '1',
  }

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks()

    // Mock the useDefinedActiveSafe hook
    ;(useDefinedActiveSafe as jest.Mock).mockReturnValue(mockActiveSafe)

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
    activeSigner: { value: '0x456' },
    isExpired: false,
    txId: 'tx123',
    hasSigned: false,
    canSign: true,
  }

  it('renders AlreadySigned when hasSigned is true', () => {
    const props = { ...defaultProps, hasSigned: true }
    const { getByText } = render(<ConfirmTxForm {...props} />)

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
    const props = { ...defaultProps, canSign: false }
    const { getByText } = render(<ConfirmTxForm {...props} />)

    expect(getByText('CanNotSign')).toBeTruthy()
    expect(CanNotSign).toHaveBeenCalledWith(
      expect.objectContaining({
        address: '0x456',
        txId: 'tx123',
      }),
      undefined,
    )
  })

  it('renders ExecuteForm when hasEnoughConfirmations is true', () => {
    const props = { ...defaultProps, hasEnoughConfirmations: true }
    const { getByText } = render(<ConfirmTxForm {...props} />)

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
    const props = { ...defaultProps }
    const { getByText } = render(<ConfirmTxForm {...props} />)

    expect(getByText('SignForm')).toBeTruthy()
    expect(SignForm).toHaveBeenCalledWith(
      expect.objectContaining({
        txId: 'tx123',
        address: '0x456',
      }),
      undefined,
    )
  })

  it('renders null when no conditions are met', () => {
    const props = {
      ...defaultProps,
      activeSigner: undefined,
      isExpired: true,
    }
    const { toJSON } = render(<ConfirmTxForm {...props} />)

    expect(toJSON()).toBeNull()
  })

  it('handles undefined activeSigner in CanNotSign', () => {
    const props = {
      ...defaultProps,
      canSign: false,
      activeSigner: undefined,
    }
    const { getByText } = render(<ConfirmTxForm {...props} />)

    expect(getByText('CanNotSign')).toBeTruthy()
    expect(CanNotSign).toHaveBeenCalledWith(
      expect.objectContaining({
        address: undefined,
        txId: 'tx123',
      }),
      undefined,
    )
  })
})
