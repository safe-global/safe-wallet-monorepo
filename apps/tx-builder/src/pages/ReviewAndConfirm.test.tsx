import type { UserEvent } from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { screen, waitFor } from '../test-utils'
import { SET_ADDRESS_METHOD, TEST_CONTRACT, buildBatchFile, renderApp, uploadJson } from '../test/app'
import { SAFE_INFO, fakeSdk } from '../test/sdk'
import { SIMULATION_URL, serveAbi, server } from '../test/server'
import { TenderlySimulatePayload } from '../lib/simulation/types'

jest.mock('@safe-global/safe-apps-react-sdk', () => jest.requireActual('../test/sdk').safeAppsReactSdkFake)

const openReview = async (): Promise<UserEvent> => {
  const user = renderApp()
  await uploadJson(user, buildBatchFile())
  await user.click(await screen.findByRole('button', { name: 'Create Batch' }))
  await screen.findByText('Review and Confirm')
  return user
}

const serveSimulation = (status: boolean) => {
  const payloads: TenderlySimulatePayload[] = []
  server.use(
    http.post(SIMULATION_URL, async ({ request }) => {
      payloads.push((await request.json()) as TenderlySimulatePayload)
      return HttpResponse.json({
        simulation: { id: 'simulation-id', status },
        transaction: { error_message: 'execution reverted', error_info: { address: TEST_CONTRACT } },
      })
    }),
  )
  return payloads
}

const pasteInto = async (user: UserEvent, field: HTMLElement, text: string): Promise<void> => {
  await user.click(field)
  await user.paste(text)
}

const addSetAddressCall = async (user: UserEvent): Promise<void> => {
  await pasteInto(user, await screen.findByLabelText('Enter Address or ENS Name'), TEST_CONTRACT)
  await pasteInto(user, await screen.findByLabelText(/^newValue \(address\)/), SAFE_INFO.owners[0])
  await user.click(screen.getByRole('button', { name: 'Add new transaction' }))
}

describe('Reviewing a batch', () => {
  beforeEach(() => {
    fakeSdk.txs.send.mockClear()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('sends every call of the batch to the Safe and shows the success', async () => {
    const user = await openReview()

    await user.click(screen.getByRole('button', { name: 'Send Batch' }))

    expect(await screen.findByText('Transaction Batch in the queue.')).toBeInTheDocument()
    expect(fakeSdk.txs.send).toHaveBeenCalledWith({ txs: [expect.objectContaining({ to: TEST_CONTRACT })] })
  })

  it('keeps the batch on the review when the Safe does not send it', async () => {
    const logError = jest.spyOn(console, 'error').mockImplementation(() => {})
    fakeSdk.txs.send.mockRejectedValueOnce(new Error('Transaction was rejected'))
    const user = await openReview()

    await user.click(screen.getByRole('button', { name: 'Send Batch' }))

    await waitFor(() => expect(logError).toHaveBeenCalledWith('Error sending transactions:', expect.any(Error)))
    expect(screen.queryByText('Transaction Batch in the queue.')).not.toBeInTheDocument()
    expect(screen.getByText('Review and Confirm')).toBeInTheDocument()
    expect(screen.getByText('testAddressValue')).toBeInTheDocument()
  })

  it('keeps the batch when the user goes back to add another call', async () => {
    serveAbi([{ ...SET_ADDRESS_METHOD, type: 'function', stateMutability: 'nonpayable' }])
    const user = await openReview()

    await user.click(screen.getByRole('link', { name: 'Back to Transaction Creation' }))
    await addSetAddressCall(user)
    await user.click(screen.getByRole('button', { name: 'Create Batch' }))

    await screen.findByText('Review and Confirm')
    expect(screen.getAllByText('testAddressValue')).toHaveLength(2)
  })

  it('clears the batch when the user confirms the cancel', async () => {
    const user = await openReview()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await user.click(screen.getByRole('button', { name: 'Yes, clear' }))

    expect(await screen.findByText('choose a file')).toBeInTheDocument()
  })

  it('keeps the batch when the user goes back from the cancel', async () => {
    const user = await openReview()

    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    await user.click(screen.getByRole('button', { name: 'Back' }))

    expect(screen.getByText('Review and Confirm')).toBeInTheDocument()
    expect(screen.getByText('testAddressValue')).toBeInTheDocument()
  })

  it('simulates the batch as executed by a Safe owner and shows the success', async () => {
    const payloads = serveSimulation(true)
    const user = await openReview()

    await user.click(await screen.findByRole('button', { name: 'Simulate' }))

    expect(await screen.findByText('Success')).toBeInTheDocument()
    expect(payloads[0]).toMatchObject({ network_id: '11155111', from: SAFE_INFO.owners[0], to: SAFE_INFO.safeAddress })
  })

  it('shows why a failed simulation reverted', async () => {
    serveSimulation(false)
    const user = await openReview()

    await user.click(await screen.findByRole('button', { name: 'Simulate' }))

    expect(await screen.findByText('Failed')).toBeInTheDocument()
    expect(screen.getByText('execution reverted')).toBeInTheDocument()
  })
})
