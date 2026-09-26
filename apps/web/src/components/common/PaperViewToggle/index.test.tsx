import { fireEvent, render, screen } from '@/tests/test-utils'
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

    expect(screen.queryByTestId('paper-view-toggle-outlined')).not.toBeInTheDocument()
    expect(panel).toContainElement(group)
  })

  it('renders the tabs and the active view inside an outlined panel when outlined is set', () => {
    render(<PaperViewToggle outlined>{views}</PaperViewToggle>)

    const panel = screen.getByTestId('paper-view-toggle-outlined')

    expect(screen.queryByRole('group')).not.toBeInTheDocument()
    expect(panel).toContainElement(screen.getByRole('tablist'))
    expect(panel).toContainElement(screen.getByTestId('first-view'))
    expect(screen.queryByTestId('second-view')).not.toBeInTheDocument()
  })

  it('switches the view when another tab is selected in the outlined panel', () => {
    render(<PaperViewToggle outlined>{views}</PaperViewToggle>)

    fireEvent.click(screen.getAllByRole('tab')[1])

    expect(screen.getByTestId('second-view')).toBeInTheDocument()
    expect(screen.queryByTestId('first-view')).not.toBeInTheDocument()
  })
})
