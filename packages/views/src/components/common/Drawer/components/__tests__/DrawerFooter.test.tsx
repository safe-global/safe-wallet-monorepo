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
})
