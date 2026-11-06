import { fireEvent, render, screen } from '@/tests/test-utils'
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
    it('starts open and toggles from the title', () => {
      render(
        <DrawerSection collapsible title="Summary">
          Section content
        </DrawerSection>,
      )

      const toggle = screen.getByRole('button', { name: /Summary/ })
      expect(toggle).toHaveAttribute('aria-expanded', 'true')
      expect(screen.getByText('Section content')).toBeVisible()

      fireEvent.click(toggle)
      expect(toggle).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByText('Section content')).not.toBeInTheDocument()
    })

    it('can start collapsed', () => {
      render(
        <DrawerSection collapsible defaultOpen={false} title="Transaction data">
          Section content
        </DrawerSection>,
      )

      expect(screen.getByRole('button', { name: /Transaction data/ })).toHaveAttribute('aria-expanded', 'false')
      expect(screen.queryByText('Section content')).not.toBeInTheDocument()
    })

    it('reports changes when controlled', () => {
      const onOpenChange = jest.fn()
      render(
        <DrawerSection collapsible open={false} onOpenChange={onOpenChange} title="Security">
          Section content
        </DrawerSection>,
      )

      fireEvent.click(screen.getByRole('button', { name: /Security/ }))
      expect(onOpenChange).toHaveBeenCalledWith(true, expect.anything())
    })

    it('keeps the trailing node outside the toggle', () => {
      render(
        <DrawerSection collapsible title="Runs after" rightNode="1 earlier">
          Section content
        </DrawerSection>,
      )

      expect(screen.getByRole('button', { name: /Runs after/ })).not.toContainElement(screen.getByText('1 earlier'))
    })
  })
})
