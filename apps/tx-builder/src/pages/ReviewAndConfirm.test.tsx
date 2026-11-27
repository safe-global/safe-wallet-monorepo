import type { UserEvent } from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { screen } from '../test-utils'
import { TEST_CONTRACT, buildBatchFile, renderApp, uploadJson } from '../test/app'
import { SAFE_INFO } from '../test/sdk'
import { SIMULATION_URL, server } from '../test/server'
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

describe('Reviewing a batch', () => {
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
