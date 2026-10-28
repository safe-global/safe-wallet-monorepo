import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import { renderWithUserEvent, screen, within } from '@/tests/test-utils'
import { server } from '@/tests/server'
import { mockSafeInfo } from '@/tests/mocks/hooks'
import { createSafeTx } from '@/tests/builders/safeTx'
import { TxInfoProvider } from '@/components/tx-flow/TxInfoProvider'
import * as tenderlyUtils from '@/components/tx/security/tenderly/utils'
import {
  TENDERLY_ORG_NAME,
  TENDERLY_PROJECT_NAME,
  TENDERLY_SIMULATE_ENDPOINT_URL,
} from '@safe-global/utils/config/constants'
import { SafeShieldContent } from '../SafeShieldContent'

jest.mock('@safe-global/utils/config/constants', () => {
  const { faker } = jest.requireActual('@faker-js/faker')
  return {
    ...jest.requireActual('@safe-global/utils/config/constants'),
    TENDERLY_SIMULATE_ENDPOINT_URL: faker.internet.url(),
    TENDERLY_ORG_NAME: faker.lorem.slug(),
    TENDERLY_PROJECT_NAME: faker.lorem.slug(),
  }
})
// Explicit stubs: spreading the real module here pulls a circular import chain into the mock factory.
jest.mock('@/hooks/useChains', () => ({
  useCurrentChain: () => ({ chainId: '137', features: ['TX_SIMULATION'] }),
  useHasFeature: () => true,
  useChain: () => undefined,
}))
jest.mock('@/hooks/useSafeInfo')
jest.mock('../useNestedTransaction', () => ({
  useNestedTransaction: () => ({ isNested: false, isNestedLoading: false }),
}))

const emptyAnalysis: [undefined, undefined, boolean] = [undefined, undefined, false]

const respondWithSimulation = (status: boolean) => {
  const simulationId = faker.string.uuid()
  let respond: () => void = () => {}
  const responded = new Promise<void>((resolve) => {
    respond = resolve
  })

  server.use(
    http.post(TENDERLY_SIMULATE_ENDPOINT_URL, async () => {
      await responded
      return HttpResponse.json({
        simulation: { id: simulationId, status },
        transaction: { call_trace: [] },
        contracts: [],
        generated_access_list: [],
      })
    }),
  )

  return { simulationId, respond }
}

const renderShield = () =>
  renderWithUserEvent(
    <TxInfoProvider>
      <SafeShieldContent
        recipient={emptyAnalysis}
        contract={emptyAnalysis}
        threat={emptyAnalysis}
        deadlock={emptyAnalysis}
        safeTx={createSafeTx()}
        isSafePro={false}
      />
    </TxInfoProvider>,
  )

describe('SafeShieldContent Tenderly simulation without Safe Pro', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    const safe = mockSafeInfo({ chainId: '137' })
    jest.spyOn(tenderlyUtils, 'getSimulationPayload').mockResolvedValue({
      to: safe.address.value,
      input: '0x',
      network_id: safe.chainId,
      from: safe.owners[0].value,
      gas: 0,
      gas_price: '0',
      save: true,
      save_if_fails: true,
    })
  })

  it.each([
    { status: true, result: 'Simulation successful' },
    { status: false, result: 'Simulation failed' },
  ])('runs on click and shows "$result" with a link to the simulation', async ({ status, result }) => {
    const { simulationId, respond } = respondWithSimulation(status)
    const { user } = renderShield()
    const card = screen.getByTestId('tenderly-simulation')

    await user.click(within(card).getByTestId('run-simulation-btn'))

    expect(within(card).getByTestId('run-simulation-btn')).toHaveTextContent('Running...')

    respond()

    expect(await within(card).findByText(result)).toBeInTheDocument()
    expect(within(card).getByText('View').closest('a')).toHaveAttribute(
      'href',
      `https://dashboard.tenderly.co/public/${TENDERLY_ORG_NAME}/${TENDERLY_PROJECT_NAME}/simulator/${simulationId}`,
    )
    expect(within(card).queryByTestId('run-simulation-btn')).not.toBeInTheDocument()
  })
})
