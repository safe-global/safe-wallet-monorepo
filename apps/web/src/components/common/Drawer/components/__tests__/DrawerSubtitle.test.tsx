import { render } from '@/tests/test-utils'
import { DrawerSubtitle } from '../DrawerSubtitle'

describe('DrawerSubtitle', () => {
  it('matches the snapshot', () => {
    const { container } = render(<DrawerSubtitle>Last updated 2 minutes ago</DrawerSubtitle>)

    expect(container.firstChild).toMatchSnapshot()
  })
})
