import { useContext } from 'react'
import { render, screen, waitFor } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import { TxModalContext, TxModalProvider } from '..'

jest.mock('@/hooks/useTopbarElevation', () => ({
  useTopbarElevation: jest.fn(),
}))

const FLOW_TEXT = 'Flow content'

/** Opens a flow via the context, mirroring how real call sites do it. */
const Opener = ({ shouldWarn }: { shouldWarn?: boolean }) => {
  const { setTxFlow } = useContext(TxModalContext)

  return <button onClick={() => setTxFlow(<div>{FLOW_TEXT}</div>, undefined, shouldWarn)}>open</button>
}

const renderProvider = (shouldWarn?: boolean) =>
  render(
    <TxModalProvider>
      <Opener shouldWarn={shouldWarn} />
    </TxModalProvider>,
  )

const openFlow = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: 'open' }))
  await waitFor(() => expect(screen.getByText(FLOW_TEXT)).toBeInTheDocument())
}

const clickClose = (user: ReturnType<typeof userEvent.setup>) =>
  user.click(screen.getByRole('button', { name: 'close' }))

describe('TxModalProvider close gate', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('closes straight away when the flow opted out of the warning', async () => {
    const user = userEvent.setup()
    renderProvider(false)
    await openFlow(user)

    await clickClose(user)

    await waitFor(() => expect(screen.queryByText(FLOW_TEXT)).not.toBeInTheDocument())
    expect(screen.queryByText('Discard this transaction?')).not.toBeInTheDocument()
  })

  it('asks before discarding when the flow has unsaved progress', async () => {
    const user = userEvent.setup()
    renderProvider()
    await openFlow(user)

    await clickClose(user)

    // The flow must survive until the user answers — the old native confirm bailed out silently
    // whenever the browser suppressed it.
    expect(await screen.findByText('Discard this transaction?')).toBeInTheDocument()
    expect(screen.getByText(FLOW_TEXT)).toBeInTheDocument()
  })

  it('keeps the flow open when the discard is declined', async () => {
    const user = userEvent.setup()
    renderProvider()
    await openFlow(user)
    await clickClose(user)
    await screen.findByText('Discard this transaction?')

    await user.click(screen.getByRole('button', { name: 'Keep editing' }))

    await waitFor(() => expect(screen.queryByText('Discard this transaction?')).not.toBeInTheDocument())
    expect(screen.getByText(FLOW_TEXT)).toBeInTheDocument()
  })

  it('closes the flow when the discard is confirmed', async () => {
    const user = userEvent.setup()
    renderProvider()
    await openFlow(user)
    await clickClose(user)
    await screen.findByText('Discard this transaction?')

    await user.click(screen.getByRole('button', { name: 'Discard' }))

    await waitFor(() => expect(screen.queryByText(FLOW_TEXT)).not.toBeInTheDocument())
  })

  it('runs the flow onClose callback only once the discard is confirmed', async () => {
    const user = userEvent.setup()
    const onClose = jest.fn()

    const CallbackOpener = () => {
      const { setTxFlow } = useContext(TxModalContext)
      return <button onClick={() => setTxFlow(<div>{FLOW_TEXT}</div>, onClose)}>open</button>
    }

    render(
      <TxModalProvider>
        <CallbackOpener />
      </TxModalProvider>,
    )

    await openFlow(user)
    await clickClose(user)
    await screen.findByText('Discard this transaction?')
    expect(onClose).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'Discard' }))

    await waitFor(() => expect(onClose).toHaveBeenCalledTimes(1))
  })
})
