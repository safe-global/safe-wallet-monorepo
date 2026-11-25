import { renderHook } from '@/tests/test-utils'
import { useDialogOnScreen, useIsDialogOnScreen } from '../useDialogOnScreen'

const renderDialog = (isOnScreen: boolean) =>
  renderHook(({ isOnScreen }) => useDialogOnScreen(isOnScreen), { initialProps: { isOnScreen } })

describe('useDialogOnScreen', () => {
  it('reports no dialog on screen when none registered', () => {
    const { result } = renderHook(() => useIsDialogOnScreen())

    expect(result.current).toBe(false)
  })

  it('ignores a dialog that is mounted but not on screen', () => {
    renderDialog(false)

    const { result } = renderHook(() => useIsDialogOnScreen())

    expect(result.current).toBe(false)
  })

  it('reports a dialog on screen until the last of several dialogs leaves', () => {
    const { result } = renderHook(() => useIsDialogOnScreen())
    const closing = renderDialog(true)
    const unmounting = renderDialog(true)

    closing.rerender({ isOnScreen: false })
    expect(result.current).toBe(true)

    unmounting.unmount()
    expect(result.current).toBe(false)
  })
})
