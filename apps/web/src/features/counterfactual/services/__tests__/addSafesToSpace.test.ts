import { addSafesToSpace } from '../addSafesToSpace'
import type { AppDispatch } from '@/store'
import { ELEVATION_REQUIRED_ERROR } from '@/features/oidc-auth/utils/elevation'
import { getGenericErrorWithStatus } from '@/utils/rtkQuery'

const MOCK_SPACE_UUID = '11111111-1111-1111-1111-111111111111'
const spaceInitiate = jest.fn()

jest.mock('@safe-global/store/gateway/AUTO_GENERATED/spaces', () => ({
  cgwApi: {
    endpoints: {
      spaceSafesCreateV1: {
        initiate: (...args: unknown[]) => {
          spaceInitiate(...args)
          return { type: 'space-create-thunk' }
        },
      },
    },
  },
}))

const addWithResponse = (response: { data?: unknown; error?: unknown }) =>
  addSafesToSpace({
    spaceId: MOCK_SPACE_UUID,
    safeAddress: '0xSafe',
    chainIds: ['1', '100'],
    dispatch: jest.fn(() => response) as unknown as AppDispatch,
  })

describe('addSafesToSpace', () => {
  beforeEach(() => jest.clearAllMocks())

  it('adds every network of the Safe in one request', async () => {
    const outcome = await addWithResponse({ data: null })

    expect(spaceInitiate).toHaveBeenCalledTimes(1)
    expect(spaceInitiate).toHaveBeenCalledWith({
      spaceId: MOCK_SPACE_UUID,
      createSpaceSafesDto: {
        safes: [
          { chainId: '1', address: '0xSafe' },
          { chainId: '100', address: '0xSafe' },
        ],
      },
    })
    expect(outcome).toEqual({ status: 'added' })
  })

  it('reports a pending step-up on elevation_required', async () => {
    const outcome = await addWithResponse({
      error: { status: 403, data: { message: ELEVATION_REQUIRED_ERROR, statusCode: 403 } },
    })

    expect(outcome).toEqual({ status: 'stepUpPending' })
  })

  it('fails on a 403 that is not a step-up', async () => {
    const outcome = await addWithResponse({ error: { status: 403, data: { message: 'Not an admin' } } })

    expect(outcome).toEqual({ status: 'failed', error: new Error('Not an admin') })
  })

  it('reports the seat limit with its quota on a 402 QUOTA_EXCEEDED', async () => {
    const outcome = await addWithResponse({ error: { status: 402, data: { code: 'QUOTA_EXCEEDED', quota: 20 } } })

    expect(outcome).toEqual({ status: 'seatLimit', quota: 20 })
  })

  it('reports the seat limit without a quota when the 402 body carries none', async () => {
    const outcome = await addWithResponse({ error: { status: 402, data: { code: 'QUOTA_EXCEEDED' } } })

    expect(outcome).toEqual({ status: 'seatLimit', quota: null })
  })

  it('fails on a 402 that is not a quota error', async () => {
    const outcome = await addWithResponse({ error: { status: 402, data: { message: 'Payment required' } } })

    expect(outcome).toEqual({ status: 'failed', error: new Error('Payment required') })
  })

  it('reports the legacy limit with the backend message on a 400 limit rejection', async () => {
    const message = 'This space only allows a maximum of 40 safe accounts'

    const outcome = await addWithResponse({ error: { status: 400, data: { message } } })

    expect(outcome).toEqual({ status: 'legacyLimit', message })
  })

  it('fails on any other 400', async () => {
    const message = 'Validation failed (uuid is expected)'

    const outcome = await addWithResponse({ error: { status: 400, data: { message } } })

    expect(outcome).toEqual({ status: 'failed', error: new Error(message) })
  })

  it('fails with the generic message on a server error', async () => {
    const outcome = await addWithResponse({ error: { status: 500 } })

    expect(outcome).toEqual({ status: 'failed', error: new Error(getGenericErrorWithStatus(500)) })
  })
})
