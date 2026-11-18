import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ExpandableList, ExpandableListGroup, ExpandableListItem } from './expandable-list'

const renderList = () =>
  render(
    <ExpandableList>
      <ExpandableListGroup header={<span>Needs attention · 2</span>}>
        <ExpandableListItem
          value="recovery"
          tone="warning"
          leading={<span data-testid="icon" />}
          title="No recovery set up"
          description="Add a recovery method."
        >
          Recovery keeps the Treasury reachable.
        </ExpandableListItem>
        <ExpandableListItem value="guard" title="Guard enabled" trailing={<button>View 2</button>} />
      </ExpandableListGroup>
    </ExpandableList>,
  )

describe('ExpandableList', () => {
  it('renders the group header and its rows', () => {
    renderList()

    expect(screen.getByText('Needs attention · 2')).toBeInTheDocument()
    expect(screen.getByText('No recovery set up')).toHaveAttribute('title', 'No recovery set up')
    expect(screen.getByTestId('icon')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'View 2' })).toBeInTheDocument()
  })

  it('opens and closes a row with its body and description', async () => {
    renderList()
    const trigger = screen.getByRole('button', { name: 'No recovery set up' })

    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('Add a recovery method.')).not.toBeInTheDocument()

    await userEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'true')
    expect(screen.getByText('Add a recovery method.')).toBeInTheDocument()
    expect(screen.getByText('Recovery keeps the Treasury reachable.')).toBeInTheDocument()

    await userEvent.click(trigger)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
  })

  it('opens from the keyboard', async () => {
    renderList()
    const trigger = screen.getByRole('button', { name: 'No recovery set up' })

    trigger.focus()
    await userEvent.keyboard('{Enter}')

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
  })

  it('keeps several rows open by default and one with multiple={false}', async () => {
    const list = (multiple?: boolean) => (
      <ExpandableList multiple={multiple}>
        <ExpandableListItem value="a" title="First">
          Body A
        </ExpandableListItem>
        <ExpandableListItem value="b" title="Second">
          Body B
        </ExpandableListItem>
      </ExpandableList>
    )
    const { rerender } = render(list())

    await userEvent.click(screen.getByRole('button', { name: 'First' }))
    await userEvent.click(screen.getByRole('button', { name: 'Second' }))
    expect(screen.getByText('Body A')).toBeInTheDocument()
    expect(screen.getByText('Body B')).toBeInTheDocument()

    rerender(list(false))
    await userEvent.click(screen.getByRole('button', { name: 'First' }))
    expect(screen.getByRole('button', { name: 'Second' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('renders a row without a body as static, without a chevron', () => {
    renderList()

    expect(screen.queryByRole('button', { name: 'Guard enabled' })).not.toBeInTheDocument()
    expect(screen.getByText('Guard enabled').closest('[data-slot="expandable-list-item"]')).not.toHaveAttribute(
      'data-open',
    )
  })

  it('paints the tone bar from the tone token, and none without a tone', () => {
    const { container } = renderList()

    const bars = container.querySelectorAll('[data-slot="expandable-list-tone"]')
    expect(bars).toHaveLength(1)
    expect(bars[0]).toHaveClass('bg-tone-warning')
  })

  it('opens from a click on the row padding', async () => {
    renderList()
    const trigger = screen.getByRole('button', { name: 'No recovery set up' })

    await userEvent.click(trigger.closest('[data-slot="expandable-list-item"]')!.firstElementChild!)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
  })

  it('keeps a trailing control outside the trigger: its own click, not part of the row name', async () => {
    const onView = jest.fn()
    render(
      <ExpandableList>
        <ExpandableListItem
          value="modules"
          title="2 modules enabled"
          trailing={<button onClick={onView}>View 2</button>}
        >
          Allowance module
        </ExpandableListItem>
      </ExpandableList>,
    )
    const trigger = screen.getByRole('button', { name: '2 modules enabled' })

    await userEvent.click(screen.getByRole('button', { name: 'View 2' }))

    expect(onView).toHaveBeenCalledTimes(1)
    expect(trigger).toHaveAttribute('aria-expanded', 'false')
    expect(trigger).not.toContainElement(screen.getByRole('button', { name: 'View 2' }))
  })

  it('opens from a click on the chevron', async () => {
    const { container } = renderList()
    const trigger = screen.getByRole('button', { name: 'No recovery set up' })

    await userEvent.click(container.querySelector('[data-slot="expandable-list-item"] svg.lucide-chevron-down')!)

    expect(trigger).toHaveAttribute('aria-expanded', 'true')
  })
})
