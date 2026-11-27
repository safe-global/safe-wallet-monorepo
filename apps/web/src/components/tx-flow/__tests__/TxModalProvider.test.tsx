import { useContext, useEffect } from 'react'
import { fireEvent, render, screen, waitFor } from '@/tests/test-utils'
import userEvent from '@testing-library/user-event'
import { TxModalContext, TxModalProvider } from '..'
import ExternalLink from '@safe-global/views/components/common/ExternalLink'
import { WalletContext } from '@/components/common/WalletProvider/WalletContext'
import { walletContextBuilder } from '@/tests/builders/wallet'
import { TxFlowSafeReporterContext, useTxFlowSafe } from '../safe-scope/txFlowSafe'

jest.mock('@/hooks/useTopbarElevation', () => ({
  useTopbarElevation: jest.fn(),
}))

const FLOW_TEXT = 'Flow content'
const LINK_HREF = '/target'

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

/** Opens a flow containing an internal link, mirroring the success screens that link back into the app. */
const LinkOpener = ({ shouldWarn }: { shouldWarn?: boolean }) => {
  const { setTxFlow } = useContext(TxModalContext)

  return (
    <button
      onClick={() =>
        setTxFlow(
          <>
            <div>{FLOW_TEXT}</div>
            <a href={LINK_HREF}>go</a>
          </>,
          undefined,
          shouldWarn,
        )
      }
    >
      open
    </button>
  )
}

describe('TxModalProvider navigation gate', () => {
  const renderWithLink = (push: jest.Mock, shouldWarn?: boolean) =>
    render(
      <TxModalProvider>
        <LinkOpener shouldWarn={shouldWarn} />
      </TxModalProvider>,
      { routerProps: { push } },
    )

  const clickLink = () => fireEvent.mouseDown(screen.getByRole('link', { name: 'go' }))

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('routes exactly once when the flow opted out of the warning', async () => {
    const user = userEvent.setup()
    const push = jest.fn()
    renderWithLink(push, false)
    await openFlow(user)

    clickLink()

    // Both the hook and the discard gate used to route, so this landed twice
    expect(push).toHaveBeenCalledTimes(1)
    expect(push).toHaveBeenCalledWith(LINK_HREF)
    await waitFor(() => expect(screen.queryByText(FLOW_TEXT)).not.toBeInTheDocument())
    expect(screen.queryByText('Discard this transaction?')).not.toBeInTheDocument()
  })

  it('holds the navigation until the discard is confirmed', async () => {
    const user = userEvent.setup()
    const push = jest.fn()
    renderWithLink(push)
    await openFlow(user)

    clickLink()

    expect(push).not.toHaveBeenCalled()
    expect(await screen.findByText('Discard this transaction?')).toBeInTheDocument()
    expect(screen.getByText(FLOW_TEXT)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Discard' }))

    await waitFor(() => expect(push).toHaveBeenCalledTimes(1))
    expect(push).toHaveBeenCalledWith(LINK_HREF)
  })

  it('keeps the flow open and does not route when the discard is declined', async () => {
    const user = userEvent.setup()
    const push = jest.fn()
    renderWithLink(push)
    await openFlow(user)

    clickLink()
    await screen.findByText('Discard this transaction?')

    await user.click(screen.getByRole('button', { name: 'Keep editing' }))

    await waitFor(() => expect(screen.queryByText('Discard this transaction?')).not.toBeInTheDocument())
    expect(screen.getByText(FLOW_TEXT)).toBeInTheDocument()
    expect(push).not.toHaveBeenCalled()
  })
})

it('uses plain outbound arrows only within the transaction dialog', async () => {
  const user = userEvent.setup()
  const ExternalLinkOpener = () => {
    const { setTxFlow } = useContext(TxModalContext)
    return (
      <button
        onClick={() => setTxFlow(<ExternalLink href="https://example.com">Flow link</ExternalLink>, undefined, false)}
      >
        open
      </button>
    )
  }
  render(
    <TxModalProvider>
      <ExternalLinkOpener />
      <ExternalLink href="https://example.com">Page link</ExternalLink>
    </TxModalProvider>,
  )

  await user.click(screen.getByRole('button', { name: 'open' }))

  const flowLink = await screen.findByText('Flow link')
  expect(flowLink.querySelector('.lucide-arrow-up-right')).toBeInTheDocument()
  expect(flowLink.querySelector('.lucide-external-link')).not.toBeInTheDocument()
  expect(screen.getByText('Page link').querySelector('.lucide-external-link')).toBeInTheDocument()
})

describe('TxModalProvider parent Safe nonce', () => {
  const FlowThatEnds = () => {
    const { setTxFlow } = useContext(TxModalContext)
    const walletContext = useContext(WalletContext)
    return (
      <>
        <button onClick={() => walletContext?.setParentSafeNonce(7)}>choose nonce</button>
        <button onClick={() => setTxFlow(undefined)}>add to batch</button>
      </>
    )
  }

  const FlowOpener = () => {
    const { setTxFlow } = useContext(TxModalContext)
    return <button onClick={() => setTxFlow(<FlowThatEnds />, undefined, false)}>open</button>
  }

  it('drops the chosen parent Safe nonce when a flow ends without creating the parent tx', async () => {
    const user = userEvent.setup()
    let nonce: number | undefined
    const walletContext = walletContextBuilder()
      .with({
        setParentSafeNonce: (chosen) => {
          nonce = chosen
        },
        clearParentSafeNonce: () => {
          nonce = undefined
        },
      })
      .build()
    render(
      <WalletContext.Provider value={walletContext}>
        <TxModalProvider>
          <FlowOpener />
        </TxModalProvider>
      </WalletContext.Provider>,
    )
    await user.click(screen.getByRole('button', { name: 'open' }))
    await user.click(await screen.findByRole('button', { name: 'choose nonce' }))
    expect(nonce).toBe(7)

    await user.click(screen.getByRole('button', { name: 'add to batch' }))

    await waitFor(() => expect(screen.queryByRole('button', { name: 'add to batch' })).not.toBeInTheDocument())
    expect(nonce).toBeUndefined()
  })
})

describe('TxModalProvider flow Safe', () => {
  const flowSafe = { chainId: '137', safeAddress: '0x1234567890123456789012345678901234567890' }

  /** Stands in for the flow's SafeScopeProvider: reports its Safe while mounted. */
  const ScopedFlow = () => {
    const report = useContext(TxFlowSafeReporterContext)
    useEffect(() => {
      report?.(flowSafe)
      return () => report?.(undefined)
    }, [report])
    return <div>{FLOW_TEXT}</div>
  }

  const FlowSafeProbe = () => {
    const safe = useTxFlowSafe()
    const { setTxFlow } = useContext(TxModalContext)
    return (
      <>
        <span data-testid="flow-safe">{safe ? `${safe.chainId}:${safe.safeAddress}` : 'none'}</span>
        <button onClick={() => setTxFlow(<ScopedFlow />, undefined, false)}>open scoped</button>
      </>
    )
  }

  it('exposes the Safe reported from inside the flow to the page, and drops it on close', async () => {
    const user = userEvent.setup()
    render(
      <TxModalProvider>
        <FlowSafeProbe />
      </TxModalProvider>,
    )
    expect(screen.getByTestId('flow-safe')).toHaveTextContent('none')

    await user.click(screen.getByRole('button', { name: 'open scoped' }))
    await waitFor(() => expect(screen.getByTestId('flow-safe')).toHaveTextContent(`137:${flowSafe.safeAddress}`))

    await clickClose(user)
    await waitFor(() => expect(screen.getByTestId('flow-safe')).toHaveTextContent('none'))
  })

  it('gives the page no way to report a flow Safe', () => {
    const Reporter = () => (
      <span data-testid="has-reporter">{String(Boolean(useContext(TxFlowSafeReporterContext)))}</span>
    )
    render(
      <TxModalProvider>
        <Reporter />
      </TxModalProvider>,
    )
    expect(screen.getByTestId('has-reporter')).toHaveTextContent('false')
  })
})
