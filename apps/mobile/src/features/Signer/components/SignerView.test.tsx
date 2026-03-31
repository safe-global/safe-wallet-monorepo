import React from 'react'
import { render, screen, fireEvent } from '@/src/tests/test-utils'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { faker } from '@faker-js/faker'
import { SignerView } from './SignerView'
import { formSchema } from '@/src/features/Signer/schema'
import type { FormValues } from '@/src/features/Signer/types'

const mockUseWalletConnectStatus = jest.fn()

jest.mock('@/src/features/WalletConnect/hooks/useWalletConnectStatus', () => ({
  useWalletConnectStatus: (...args: unknown[]) => mockUseWalletConnectStatus(...args),
}))

jest.mock('@/src/features/WalletConnect/components/WalletConnectBadge', () => ({
  WalletConnectBadge: () => null,
}))

jest.mock('@/src/components/SignerTypeBadge', () => ({
  SignerTypeBadge: () => null,
}))

const signerAddress = faker.finance.ethereumAddress()

function SignerViewWithForm(
  props: Omit<React.ComponentProps<typeof SignerView>, 'control' | 'errors' | 'dirtyFields'>,
) {
  const {
    control,
    formState: { errors, dirtyFields },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: props.name },
  })

  return <SignerView {...props} control={control} errors={errors} dirtyFields={dirtyFields} />
}

const defaultProps = {
  signerAddress,
  onPressExplorer: jest.fn(),
  onPressEdit: jest.fn(),
  editMode: false,
  name: 'Test Signer',
  hasPrivateKey: false,
  isLedgerSigner: false,
  isWcSigner: false,
}

describe('SignerView WalletConnect interactions', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseWalletConnectStatus.mockReturnValue(false)
  })

  it('shows reconnect and remove buttons for disconnected WC signer', () => {
    const onReconnectWallet = jest.fn()
    const onRemoveWcSigner = jest.fn()
    mockUseWalletConnectStatus.mockReturnValue(false)

    render(
      <SignerViewWithForm
        {...defaultProps}
        isWcSigner={true}
        onReconnectWallet={onReconnectWallet}
        onRemoveWcSigner={onRemoveWcSigner}
      />,
    )

    expect(screen.getByTestId('reconnect-wallet-button')).toBeOnTheScreen()
    expect(screen.getByTestId('remove-wc-signer-button')).toBeOnTheScreen()
  })

  it('hides reconnect button when WC signer is connected', () => {
    const onReconnectWallet = jest.fn()
    const onRemoveWcSigner = jest.fn()
    mockUseWalletConnectStatus.mockReturnValue(true)

    render(
      <SignerViewWithForm
        {...defaultProps}
        isWcSigner={true}
        onReconnectWallet={onReconnectWallet}
        onRemoveWcSigner={onRemoveWcSigner}
      />,
    )

    expect(screen.queryByTestId('reconnect-wallet-button')).not.toBeOnTheScreen()
    expect(screen.getByTestId('remove-wc-signer-button')).toBeOnTheScreen()
  })

  it('calls onReconnectWallet when reconnect button is pressed', () => {
    const onReconnectWallet = jest.fn()
    mockUseWalletConnectStatus.mockReturnValue(false)

    render(
      <SignerViewWithForm
        {...defaultProps}
        isWcSigner={true}
        onReconnectWallet={onReconnectWallet}
        onRemoveWcSigner={jest.fn()}
      />,
    )

    fireEvent.press(screen.getByTestId('reconnect-wallet-button'))
    expect(onReconnectWallet).toHaveBeenCalledTimes(1)
  })

  it('calls onRemoveWcSigner when remove button is pressed', () => {
    const onRemoveWcSigner = jest.fn()
    mockUseWalletConnectStatus.mockReturnValue(false)

    render(
      <SignerViewWithForm
        {...defaultProps}
        isWcSigner={true}
        onReconnectWallet={jest.fn()}
        onRemoveWcSigner={onRemoveWcSigner}
      />,
    )

    fireEvent.press(screen.getByTestId('remove-wc-signer-button'))
    expect(onRemoveWcSigner).toHaveBeenCalledTimes(1)
  })

  it('does not show WC buttons for non-WC signer', () => {
    render(<SignerViewWithForm {...defaultProps} isWcSigner={false} />)

    expect(screen.queryByTestId('reconnect-wallet-button')).not.toBeOnTheScreen()
    expect(screen.queryByTestId('remove-wc-signer-button')).not.toBeOnTheScreen()
  })
})
