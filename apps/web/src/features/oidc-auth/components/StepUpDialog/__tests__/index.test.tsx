import { act, fireEvent, screen } from '@testing-library/react'
import { getStoreInstance } from '@/store'
import { render } from '@/tests/test-utils'
import { navigateTo } from '@/utils/navigation'
import { STEP_UP_CANCELLED, STEP_UP_FAILED_MESSAGE } from '../../../constants'
import { requestStepUp, settleStepUp } from '../../../services/stepUpSession'
import { STEP_UP_CHANNEL } from '../../../utils/stepUp'
import StepUpDialog from '../index'

jest.mock('@/utils/navigation')

/** The store opens its own channel too, so a message goes to the step-up channel by name. */
class FakeChannel {
  static instances: FakeChannel[] = []
  onmessage: ((event: MessageEvent) => void) | null = null

  constructor(public name: string) {
    FakeChannel.instances.push(this)
  }

  postMessage() {}
  addEventListener() {}
  removeEventListener() {}
  close() {}

  static send(data: unknown) {
    const channel = FakeChannel.instances.filter(({ name }) => name === STEP_UP_CHANNEL).at(-1)
    act(() => channel?.onmessage?.({ data } as MessageEvent))
  }
}

/** Renders the dialog and starts a verification the way a rejected request does. */
const openDialog = () => {
  render(<StepUpDialog />)
  let pending: Promise<boolean> = Promise.resolve(false)
  act(() => {
    pending = requestStepUp(getStoreInstance().dispatch)
  })
  return pending
}

describe('StepUpDialog', () => {
  const originalChannel = globalThis.BroadcastChannel

  beforeEach(() => {
    jest.clearAllMocks()
    FakeChannel.instances = []
    globalThis.BroadcastChannel = FakeChannel as unknown as typeof BroadcastChannel
    jest.spyOn(window, 'open').mockReturnValue({} as Window)
  })

  afterEach(() => {
    act(() => settleStepUp(getStoreInstance().dispatch, false))
    jest.restoreAllMocks()
  })

  afterAll(() => {
    globalThis.BroadcastChannel = originalChannel
  })

  it('renders nothing while no request waits for a verification', () => {
    render(<StepUpDialog />)

    expect(screen.queryByTestId('step-up-dialog')).not.toBeInTheDocument()
  })

  it('opens the popup on Verify and resolves true once the popup reports an elevated session', async () => {
    const pending = openDialog()

    fireEvent.click(screen.getByTestId('step-up-verify-button'))
    expect(window.open).toHaveBeenCalledTimes(1)
    expect(screen.getByText(/Complete the verification in the new window/)).toBeInTheDocument()

    FakeChannel.send({ error: null, errorDescription: null })

    await expect(pending).resolves.toBe(true)
    expect(screen.queryByTestId('step-up-dialog')).not.toBeInTheDocument()
  })

  it('resolves false when the user cancels in the dialog', async () => {
    const pending = openDialog()

    fireEvent.click(screen.getByTestId('step-up-cancel-button'))

    await expect(pending).resolves.toBe(false)
    expect(screen.queryByTestId('step-up-dialog')).not.toBeInTheDocument()
  })

  it('resolves false when the user cancels on the Auth0 page', async () => {
    const pending = openDialog()
    fireEvent.click(screen.getByTestId('step-up-verify-button'))

    FakeChannel.send({ error: STEP_UP_CANCELLED.error, errorDescription: STEP_UP_CANCELLED.description })

    await expect(pending).resolves.toBe(false)
  })

  it('keeps the dialog open with a retry when the challenge fails', () => {
    openDialog()
    fireEvent.click(screen.getByTestId('step-up-verify-button'))

    FakeChannel.send({ error: 'server_error', errorDescription: 'boom' })

    expect(screen.getByText(STEP_UP_FAILED_MESSAGE)).toBeInTheDocument()
    expect(screen.getByTestId('step-up-verify-button')).toHaveTextContent('Try again')
  })

  it('offers verification in this tab when the browser blocks the popup', () => {
    jest.spyOn(window, 'open').mockReturnValue(null)
    openDialog()

    fireEvent.click(screen.getByTestId('step-up-verify-button'))
    expect(screen.getByText(/Your browser blocked the verification window/)).toBeInTheDocument()

    fireEvent.click(screen.getByText(/Verify in this tab instead/))
    expect(navigateTo).toHaveBeenCalledWith(expect.stringContaining('elevate=true'))
  })
})
