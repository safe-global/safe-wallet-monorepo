import { render, screen, fireEvent } from '@/tests/test-utils'
import { ActionRequiredPanel } from './ActionRequiredPanel'

const warning = <div>Warning</div>
const getExpand = () => screen.queryByLabelText('Expand action required panel')
const getCollapse = () => screen.queryByLabelText('Collapse action required panel')

describe('ActionRequiredPanel defaultExpanded', () => {
  it('starts collapsed when defaultExpanded is false', () => {
    render(<ActionRequiredPanel defaultExpanded={false}>{warning}</ActionRequiredPanel>)
    expect(getExpand()).toBeInTheDocument()
  })

  it('opens automatically when defaultExpanded is true', async () => {
    render(<ActionRequiredPanel defaultExpanded>{warning}</ActionRequiredPanel>)
    expect(await screen.findByLabelText('Collapse action required panel')).toBeInTheDocument()
  })

  it('respects a user collapse even though defaultExpanded stays true', async () => {
    render(<ActionRequiredPanel defaultExpanded>{warning}</ActionRequiredPanel>)

    // Auto-opened, then the user collapses it.
    const collapse = await screen.findByLabelText('Collapse action required panel')
    fireEvent.click(collapse)

    expect(getExpand()).toBeInTheDocument()
    // It must not re-open on subsequent renders while defaultExpanded is still true.
    expect(getCollapse()).not.toBeInTheDocument()
  })

  it('stays hidden when defaultExpanded is true but there are no warnings', () => {
    render(<ActionRequiredPanel defaultExpanded>{null}</ActionRequiredPanel>)
    const panel = screen.getByTestId('action-required-panel')
    // The panel hides itself via the Tailwind `hidden` utility; jsdom does not apply
    // Tailwind styles, so assert on the class instead of computed visibility.
    expect(panel).toHaveClass('hidden')
  })
})
