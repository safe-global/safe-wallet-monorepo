import { render, screen, fireEvent } from '@/tests/test-utils'
import { DrawerSection } from '../DrawerSection'

describe('DrawerSection', () => {
  it('renders its title and content', () => {
    render(<DrawerSection title="Pending signatures">Section content</DrawerSection>)

    expect(screen.getByText('Pending signatures')).toBeInTheDocument()
    expect(screen.getByText('Section content')).toBeInTheDocument()
  })

  it('renders the trailing node next to the title', () => {
    render(
      <DrawerSection title="Pending signatures" rightNode="Expires in 1h 33 min">
        Section content
      </DrawerSection>,
    )

    expect(screen.getByText('Expires in 1h 33 min')).toBeInTheDocument()
    expect(screen.getByText('Pending signatures').parentElement).toContainElement(
      screen.getByText('Expires in 1h 33 min'),
    )
  })

  it('omits the trailing node when none is given', () => {
    render(<DrawerSection title="Details">Section content</DrawerSection>)

    expect(screen.getByText('Details').parentElement?.childElementCount).toBe(1)
  })

  it('renders a falsy trailing node rather than treating it as absent', () => {
    render(
      <DrawerSection title="Signatures" rightNode={0}>
        Section content
      </DrawerSection>,
    )

    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('accepts a non-text title', () => {
    render(<DrawerSection title={<span data-testid="title-node">Custom title</span>}>Section content</DrawerSection>)

    expect(screen.getByTestId('title-node')).toBeInTheDocument()
  })

  describe('collapsible', () => {
    it('starts open and hides its content when the title is pressed', () => {
      render(
        <DrawerSection title="Summary" collapsible>
          Section content
        </DrawerSection>,
      )

      const toggle = screen.getByRole('button', { name: 'Summary' })

      expect(toggle).toHaveAttribute('aria-expanded', 'true')

      fireEvent.click(toggle)

      expect(toggle).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByText('Section content')).not.toBeInTheDocument()
    })

    it('can start closed', () => {
      render(
        <DrawerSection title="Transaction data" collapsible defaultOpen={false}>
          Section content
        </DrawerSection>,
      )

      expect(screen.getByRole('button', { name: 'Transaction data' })).toHaveAttribute('aria-expanded', 'false')
    })

    it('follows a controlled open state and reports toggles', () => {
      const onOpenChange = jest.fn()
      const { rerender } = render(
        <DrawerSection title="Summary" collapsible open={false} onOpenChange={onOpenChange}>
          Section content
        </DrawerSection>,
      )

      fireEvent.click(screen.getByRole('button', { name: 'Summary' }))

      expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything())
      expect(screen.queryByText('Section content')).not.toBeInTheDocument()

      rerender(
        <DrawerSection title="Summary" collapsible open onOpenChange={onOpenChange}>
          Section content
        </DrawerSection>,
      )

      expect(screen.getByText('Section content')).toBeInTheDocument()
    })

    it('keeps the trailing node outside the toggle', () => {
      render(
        <DrawerSection title="Summary" rightNode="2 of 3" collapsible>
          Section content
        </DrawerSection>,
      )

      expect(screen.getByRole('button', { name: 'Summary' })).not.toContainElement(screen.getByText('2 of 3'))
    })
  })
})
