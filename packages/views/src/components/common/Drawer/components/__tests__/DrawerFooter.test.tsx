import { render } from '@/tests/test-utils'
import { DrawerFooter } from '../DrawerFooter'

describe('DrawerFooter', () => {
  it('matches the snapshot', () => {
    const { container } = render(
      <DrawerFooter>
        <button>Footer action</button>
      </DrawerFooter>,
    )

    expect(container.firstChild).toMatchSnapshot()
  })

  it('keeps actions clear of the device safe area only when asked', () => {
    const { container, rerender } = render(<DrawerFooter>Action</DrawerFooter>)
    expect(container.firstChild).not.toHaveAttribute('style')
    rerender(<DrawerFooter safeArea>Action</DrawerFooter>)
    expect((container.firstChild as HTMLElement).style.paddingBottom).toContain('env(safe-area-inset-bottom)')
  })
})
