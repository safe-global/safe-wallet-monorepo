import { render } from '@/tests/test-utils'
import { DrawerBody } from '../DrawerBody'

describe('DrawerBody', () => {
  it('matches the snapshot', () => {
    const { container } = render(
      <DrawerBody>
        <p>Body content</p>
      </DrawerBody>,
    )

    expect(container.firstChild).toMatchSnapshot()
  })
})
