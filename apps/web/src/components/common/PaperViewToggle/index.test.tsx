import { render, screen } from '@/tests/test-utils'
import { faker } from '@faker-js/faker'
import { PaperViewToggle } from '.'

describe('PaperViewToggle', () => {
  const views = [
    { title: faker.word.noun(), content: <div data-testid="first-view" /> },
    { title: faker.word.noun(), content: <div data-testid="second-view" /> },
  ]

  it('renders the tabs inside the panel by default', () => {
    render(<PaperViewToggle>{views}</PaperViewToggle>)

    const group = screen.getByRole('group')
    const panel = screen.getByTestId('first-view').parentElement

    expect(screen.queryByTestId('paper-view-toggle-outside')).not.toBeInTheDocument()
    expect(panel).toContainElement(group)
  })

  it('renders the tabs above and outside the panel when tabsOutside is set', () => {
    render(<PaperViewToggle tabsOutside>{views}</PaperViewToggle>)

    const group = screen.getByRole('group')
    const view = screen.getByTestId('first-view')

    expect(screen.getByTestId('paper-view-toggle-outside')).toContainElement(group)
    expect(group.compareDocumentPosition(view) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(group.parentElement).not.toHaveClass('bg-[var(--color-background-main)]')
    expect(group.parentElement).not.toHaveClass('flex')
  })
})
