import React from 'react'
import { fireEvent } from '@testing-library/react-native'
import { render } from '@/src/tests/test-utils'
import { DisconnectConfirmModal } from '../DisconnectConfirmModal'

// Local mock: gate children on imperative present()/dismiss() (so the closed case renders
// nothing) and skip the backdrop/background, which the global mock can't satisfy here.
jest.mock('@gorhom/bottom-sheet', () => {
  const react = jest.requireActual('react')
  const { View } = jest.requireActual('react-native')
  const BottomSheetModal = react.forwardRef(({ children }: { children: React.ReactNode }, ref: React.Ref<unknown>) => {
    const [open, setOpen] = react.useState(false)
    react.useImperativeHandle(ref, () => ({ present: () => setOpen(true), dismiss: () => setOpen(false) }))
    return open ? <View>{children}</View> : null
  })
  return {
    __esModule: true,
    default: View,
    BottomSheetModal,
    BottomSheetModalProvider: View,
    BottomSheetView: View,
    useBottomSheet: () => ({ close: jest.fn() }),
  }
})

describe('DisconnectConfirmModal', () => {
  it('shows the title, dApp name, and confirms via the Disconnect button', () => {
    const onConfirm = jest.fn()
    const { getByText, getByTestId } = render(
      <DisconnectConfirmModal dapp={{ name: 'Uniswap' }} onConfirm={onConfirm} onClose={jest.fn()} />,
    )

    expect(getByText('Disconnect app?')).toBeTruthy()
    expect(getByText('Uniswap')).toBeTruthy()

    fireEvent.press(getByTestId('disconnect-confirm-button'))
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('stays closed when no dApp is selected', () => {
    const { queryByTestId } = render(<DisconnectConfirmModal dapp={null} onConfirm={jest.fn()} onClose={jest.fn()} />)
    expect(queryByTestId('disconnect-confirm-modal')).toBeNull()
  })

  it('shows the busy label on the confirm action while disconnecting', () => {
    const { getByText, queryByText } = render(
      <DisconnectConfirmModal dapp={{ name: 'Uniswap' }} isBusy onConfirm={jest.fn()} onClose={jest.fn()} />,
    )
    expect(getByText('Disconnecting')).toBeTruthy()
    expect(queryByText('Disconnect')).toBeNull()
  })
})
