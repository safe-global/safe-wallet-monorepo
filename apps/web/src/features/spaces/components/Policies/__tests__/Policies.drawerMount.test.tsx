import { renderWithUserEvent, screen } from '@/tests/test-utils'
import { mockPolicies } from '../mocks/policies'
import Policies from '../index'

const mockMountSpy = jest.fn()
const mockUnmountSpy = jest.fn()

// A hand-rolled class stub (not the real Sheet/Dialog) so componentDidMount/WillUnmount can prove
// whether the *React* component instance is kept alive across a close, independent of jsdom's
// inability to observe the CSS exit animation on the real Sheet content (see final-fix-report.md).
jest.mock('../SpendingLimitDrawer', () => {
  const ReactModule = require('react')

  class SpendingLimitDrawer extends ReactModule.Component<{ open: boolean; onClose: () => void }> {
    componentDidMount() {
      mockMountSpy()
    }
    componentWillUnmount() {
      mockUnmountSpy()
    }
    render() {
      const { open, onClose } = this.props
      return ReactModule.createElement(
        'div',
        { 'data-testid': 'mock-spending-limit-drawer', 'data-open': open },
        ReactModule.createElement('button', { onClick: onClose }, 'Close mock drawer'),
      )
    }
  }

  return { __esModule: true, SpendingLimitDrawer }
})

describe('Policies keeps the spending limit drawer mounted while it closes', () => {
  beforeEach(() => {
    mockMountSpy.mockClear()
    mockUnmountSpy.mockClear()
  })

  it('does not unmount the drawer component when it closes, only toggles `open`', async () => {
    const { user } = renderWithUserEvent(<Policies policies={mockPolicies()} />)

    await user.click(screen.getAllByText('Spending limit')[0])

    expect(await screen.findByTestId('mock-spending-limit-drawer')).toHaveAttribute('data-open', 'true')
    expect(mockMountSpy).toHaveBeenCalledTimes(1)

    await user.click(screen.getByRole('button', { name: 'Close mock drawer' }))

    expect(mockUnmountSpy).not.toHaveBeenCalled()
    expect(screen.getByTestId('mock-spending-limit-drawer')).toHaveAttribute('data-open', 'false')
  })
})
