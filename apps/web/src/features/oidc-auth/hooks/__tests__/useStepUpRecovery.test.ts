import { faker } from '@faker-js/faker'
import { http, HttpResponse } from 'msw'
import { waitFor } from '@testing-library/react'
import { cgwApi } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { GATEWAY_URL } from '@/config/gateway'
import { getStoreInstance } from '@/store'
import { server } from '@/tests/server'
import { renderHook } from '@/tests/test-utils'
import { settleStepUp } from '../../services/stepUpSession'
import { ELEVATION_REQUIRED_ERROR } from '../../utils/elevation'
import { useStepUpRecovery } from '../useStepUpRecovery'

const spaceId = faker.string.uuid()

const updateSpace = () =>
  getStoreInstance().dispatch(cgwApi.endpoints.spacesUpdateV1.initiate({ id: spaceId, updateSpaceDto: { name: 'A' } }))

describe('useStepUpRecovery', () => {
  beforeEach(() => {
    server.use(
      http.patch(`${GATEWAY_URL}/v1/spaces/${spaceId}`, () =>
        HttpResponse.json({ message: ELEVATION_REQUIRED_ERROR, statusCode: 403 }, { status: 403 }),
      ),
    )
  })

  it('asks for a verification when a request needs elevation', async () => {
    renderHook(() => useStepUpRecovery())

    const request = updateSpace()

    await waitFor(() => expect(getStoreInstance().getState().stepUp.status).toBe('prompt'))
    settleStepUp(getStoreInstance().dispatch, false)
    expect((await request).error).toEqual(expect.objectContaining({ status: 403 }))
  })

  it('stops asking once unmounted', async () => {
    const { unmount } = renderHook(() => useStepUpRecovery())
    unmount()

    const result = await updateSpace()

    expect(result.error).toEqual(expect.objectContaining({ status: 403 }))
    expect(getStoreInstance().getState().stepUp.status).toBe('idle')
  })
})
