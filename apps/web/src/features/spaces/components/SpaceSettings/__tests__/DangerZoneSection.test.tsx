import { render } from '@testing-library/react'
import { Provider } from 'react-redux'
import { makeStore } from '@/store'
import DangerZoneSection from '../sections/DangerZoneSection'
import type { GetSpaceResponse } from '@safe-global/store/gateway/AUTO_GENERATED/spaces'
import { useIsAdmin, useIsActiveMember, useIsLastActiveAdmin } from '@/features/spaces'
const MOCK_SPACE_UUID = '11111111-1111-1111-1111-111111111111'
const MOCK_SPACE_UUID_ALT = '22222222-2222-2222-2222-222222222222'

jest.mock('@/features/spaces', () => ({
  useIsAdmin: jest.fn(() => false),
  useIsActiveMember: jest.fn(() => false),
  useIsLastActiveAdmin: jest.fn(() => false),
}))

jest.mock('../DeleteSpaceDialog', () => () => null)
jest.mock('../LeaveSpaceDialog', () => () => null)

const renderSection = (space: GetSpaceResponse | undefined) =>
  render(
    <Provider store={makeStore(undefined, { skipBroadcast: true })}>
      <DangerZoneSection space={space} />
    </Provider>,
  )

describe('DangerZoneSection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('passes the viewed space id to useIsAdmin and useIsActiveMember', () => {
    const space: GetSpaceResponse = {
      uuid: MOCK_SPACE_UUID,
      name: 'Other Workspace',
      members: [],
      safeCount: 0,
      memberCount: 0,
    }

    renderSection(space)

    expect(useIsAdmin).toHaveBeenCalledWith(MOCK_SPACE_UUID)
    expect(useIsActiveMember).toHaveBeenCalledWith(MOCK_SPACE_UUID)
  })

  it('passes undefined when the space is not loaded yet', () => {
    renderSection(undefined)

    expect(useIsAdmin).toHaveBeenCalledWith(undefined)
    expect(useIsActiveMember).toHaveBeenCalledWith(undefined)
  })

  it('does not fall back to the last-used space when a different space is viewed', () => {
    const viewedSpace: GetSpaceResponse = {
      uuid: MOCK_SPACE_UUID_ALT,
      name: 'Viewed',
      members: [],
      safeCount: 0,
      memberCount: 0,
    }

    renderSection(viewedSpace)

    expect(useIsAdmin).not.toHaveBeenCalledWith(undefined)
    expect(useIsActiveMember).not.toHaveBeenCalledWith(undefined)
    expect(useIsLastActiveAdmin).toHaveBeenCalled()
  })
})
