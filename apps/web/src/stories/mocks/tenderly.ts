import { delay, http, HttpResponse } from 'msw'

/** Synthetic success for the dummy Storybook service; the real simulation hook still builds the payload. */
export const storybookSimulationHandler = http.post(
  'https://simulation.storybook.invalid/api/v1/account/storybook/project/wallet/simulate',
  async () => {
    await delay(250)
    return HttpResponse.json({
      simulation: { id: 'storybook-simulation', status: true },
      transaction: { call_trace: [] },
      contracts: [],
      generated_access_list: [],
    })
  },
)
