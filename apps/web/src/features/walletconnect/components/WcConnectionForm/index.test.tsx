import { render, screen, within } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import local from '@/services/local-storage/local'
import { extendedSafeInfoBuilder } from '@/tests/builders/safe'
import WcConnectionForm from '.'

const NO_SAFE_PROMPT = 'Please open one of your Safe accounts to connect to via WalletConnect'

describe('WcConnectionForm', () => {
  it('shows the hints by default and hides them via the info button', async () => {
    local.setItem('wcHints', true)
    render(<WcConnectionForm sessions={[]} uri="" />)

    expect(screen.getByText('How do I connect to a dApp?')).toBeInTheDocument()

    const trigger = document.querySelector('span.infoIcon')
    expect(trigger).not.toBeNull()
    await userEvent.click(within(trigger as HTMLElement).getByRole('button'))

    expect(screen.queryByText('How do I connect to a dApp?')).not.toBeInTheDocument()
  })

  it('asks to open a Safe instead of offering the pairing input when no Safe is open', () => {
    render(<WcConnectionForm sessions={[]} uri="" />)

    expect(screen.getByText(NO_SAFE_PROMPT)).toBeInTheDocument()
    expect(screen.queryByTestId('wc-input')).not.toBeInTheDocument()
  })

  it('offers the pairing input once a Safe is open', () => {
    const safe = extendedSafeInfoBuilder().build()

    render(<WcConnectionForm sessions={[]} uri="" />, {
      initialReduxState: { safeInfo: { data: safe, loaded: true, loading: false } },
    })

    expect(screen.getAllByTestId('wc-input').length).toBeGreaterThan(0)
    expect(screen.queryByText(NO_SAFE_PROMPT)).not.toBeInTheDocument()
  })

  // The tooltip anchors to its trigger element, so the trigger itself must carry the absolute
  // positioning that places the icon in the popup corner — otherwise the tooltip opens where the
  // collapsed trigger sits in normal flow, in the middle of the popup.
  it('positions the tooltip trigger with the info icon', () => {
    render(<WcConnectionForm sessions={[]} uri="" />)

    const trigger = document.querySelector('span.infoIcon')
    expect(trigger).not.toBeNull()
    expect(within(trigger as HTMLElement).getByRole('button')).toBeInTheDocument()
  })
})
