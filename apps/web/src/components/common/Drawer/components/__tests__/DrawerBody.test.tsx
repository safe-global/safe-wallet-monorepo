import { render, screen } from '@/tests/test-utils'
import { DrawerBody } from '../DrawerBody'

describe('DrawerBody', () => {
  it('owns the vertical scroll so content cannot paint over a DrawerFooter', () => {
    render(
      <DrawerBody>
        <p>Body content</p>
      </DrawerBody>,
    )

    expect(screen.getByText('Body content').parentElement).toHaveClass('overflow-y-auto', 'min-h-0', 'flex-1')
  })

  it('keeps its horizontal padding rather than the scroll area gutter', () => {
    render(
      <DrawerBody>
        <p>Body content</p>
      </DrawerBody>,
    )

    const body = screen.getByText('Body content').parentElement

    expect(body).toHaveClass('px-6')
    expect(body).not.toHaveClass('pr-1')
  })

  it('matches the snapshot', () => {
    const { container } = render(
      <DrawerBody>
        <p>Body content</p>
      </DrawerBody>,
    )

    expect(container.firstChild).toMatchSnapshot()
  })
})
