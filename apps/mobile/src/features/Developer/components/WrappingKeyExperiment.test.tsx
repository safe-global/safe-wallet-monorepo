import { act, fireEvent, waitFor } from '@testing-library/react-native'
import { Alert, Platform } from 'react-native'
import { faker } from '@faker-js/faker'
import { render } from '@/src/tests/test-utils'
import type { Signer } from '@/src/store/signersSlice'
import { deletePrivateWrappingKey } from '../deletePrivateWrappingKey'
import { WrappingKeyExperiment } from './WrappingKeyExperiment'

jest.mock('../deletePrivateWrappingKey', () => ({ deletePrivateWrappingKey: jest.fn() }))

const mockDelete = jest.mocked(deletePrivateWrappingKey)
const signer: Signer = { value: faker.finance.ethereumAddress(), name: 'Test signer', type: 'private-key' }
const ledger: Signer = { value: faker.finance.ethereumAddress(), type: 'ledger', derivationPath: "m/44'/60'/0'/0/0" }
const walletConnect: Signer = { value: faker.finance.ethereumAddress(), type: 'walletconnect' }
const initialStore = {
  signers: { [signer.value]: signer, [ledger.value]: ledger, [walletConnect.value]: walletConnect },
}

describe('WrappingKeyExperiment', () => {
  const originalPlatform = Platform.OS
  let alertSpy: jest.SpyInstance<ReturnType<typeof Alert.alert>, Parameters<typeof Alert.alert>>

  beforeEach(() => {
    Platform.OS = 'ios'
    mockDelete.mockReset().mockResolvedValue({ publicKeyCount: 1 })
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined)
  })

  afterEach(() => {
    Platform.OS = originalPlatform
    alertSpy.mockRestore()
  })

  it('offers deletion only for private-key signers and requires confirmation', () => {
    const { getByTestId, queryByTestId } = render(<WrappingKeyExperiment />, { initialStore })
    expect(queryByTestId(`delete-wrapping-key-${ledger.value}`)).toBeNull()
    expect(queryByTestId(`delete-wrapping-key-${walletConnect.value}`)).toBeNull()
    fireEvent.press(getByTestId(`delete-wrapping-key-${signer.value}`))
    expect(alertSpy.mock.calls[0][1]).toContain(signer.value)
    expect(mockDelete).not.toHaveBeenCalled()
    const cancel = alertSpy.mock.calls[0][2]?.find((button) => button.style === 'cancel')
    expect(cancel).toBeDefined()
    cancel?.onPress?.()
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('reports the verified result and keeps the signer available for re-import', async () => {
    const { getByTestId, getByText } = render(<WrappingKeyExperiment />, { initialStore })
    fireEvent.press(getByTestId(`delete-wrapping-key-${signer.value}`))
    await act(async () => {
      await alertSpy.mock.calls[0][2]?.find((button) => button.style === 'destructive')?.onPress?.()
    })
    expect(mockDelete).toHaveBeenCalledWith(signer.value)
    expect(getByText(/1 public key entry\/entries preserved/)).toBeTruthy()
    expect(getByText('Test signer')).toBeTruthy()
    expect(getByText(/without removing it first/)).toBeTruthy()
  })

  it('shows native errors without claiming the experiment succeeded', async () => {
    mockDelete.mockRejectedValueOnce(new Error('Private entry already absent'))
    const { getByTestId, getByText, queryByText } = render(<WrappingKeyExperiment />, { initialStore })
    fireEvent.press(getByTestId(`delete-wrapping-key-${signer.value}`))
    await act(async () => {
      await alertSpy.mock.calls[0][2]?.find((button) => button.style === 'destructive')?.onPress?.()
    })
    expect(getByText(/Private entry already absent/)).toBeTruthy()
    expect(queryByText(/public key entry\/entries preserved/)).toBeNull()
  })

  it('prevents duplicate native deletions while an operation is pending', async () => {
    let finish!: (result: { publicKeyCount: number }) => void
    mockDelete.mockReturnValueOnce(new Promise((resolve) => (finish = resolve)))
    const { getByTestId, getByText } = render(<WrappingKeyExperiment />, { initialStore })
    fireEvent.press(getByTestId(`delete-wrapping-key-${signer.value}`))
    const confirm = alertSpy.mock.calls[0][2]?.find((button) => button.style === 'destructive')?.onPress
    act(() => {
      void confirm?.()
      void confirm?.()
    })
    expect(mockDelete).toHaveBeenCalledTimes(1)
    await act(async () => finish({ publicKeyCount: 2 }))
    await waitFor(() => expect(getByText(/2 public key entry\/entries preserved/)).toBeTruthy())
  })

  it('explains how to prepare an empty signer list', () => {
    const { getByText } = render(<WrappingKeyExperiment />)
    expect(getByText('Import a test private-key signer using the older build first.')).toBeTruthy()
  })

  it('does not expose the experiment on Android', () => {
    Platform.OS = 'android'
    const { queryByText } = render(<WrappingKeyExperiment />, { initialStore })
    expect(queryByText('Signer restore experiment')).toBeNull()
  })
})
