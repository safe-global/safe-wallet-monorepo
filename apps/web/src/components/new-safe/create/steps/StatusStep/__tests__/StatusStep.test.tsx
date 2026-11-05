import { render, waitFor } from '@testing-library/react'
import { faker } from '@faker-js/faker'
import { CreateSafeStatus } from '../index'
import type { StepRenderProps } from '@/components/new-safe/CardStepper/useCardStepper'
import type { NewSafeFormData } from '@/components/new-safe/create'

const mockPush = jest.fn()
const mockAddNewSafeToUrlSpace = jest.fn()
const listeners = new Map<string, () => void>()

const safeAddress = faker.finance.ethereumAddress()
const spaceId = faker.string.uuid()

jest.mock('next/router', () => ({ useRouter: () => ({ push: mockPush, query: {} }) }))

jest.mock('@/features/spaces', () => ({
  useAddNewSafeToUrlSpace: () => mockAddNewSafeToUrlSpace,
}))

jest.mock('@/features/counterfactual', () => ({
  safeCreationPendingStatuses: { SUCCESS: null },
}))

jest.mock('@/features/counterfactual/services', () => ({
  ...jest.requireActual('@/features/counterfactual/services/safeCreationEvents'),
  isPredictedSafeProps: () => false,
  safeCreationSubscribe: (event: string, listener: () => void) => {
    listeners.set(event, listener)
    return () => listeners.delete(event)
  },
}))

jest.mock('@/hooks/useChains', () => ({
  useCurrentChain: () => ({ chainId: '137', shortName: 'matic' }),
}))

jest.mock('../useUndeployedSafe', () => ({
  __esModule: true,
  default: () => [safeAddress, undefined],
}))

jest.mock('../StatusMessage', () => ({ __esModule: true, default: () => null }))

jest.mock('@/components/common/Notifications/useCounter', () => ({ useCounter: () => undefined }))

const props = { setStep: jest.fn() } as unknown as StepRenderProps<NewSafeFormData>

const deploy = async () => {
  render(<CreateSafeStatus {...props} />)
  await waitFor(() => expect(listeners.has('SUCCESS')).toBe(true))
  listeners.get('SUCCESS')?.()
  await waitFor(() => expect(mockAddNewSafeToUrlSpace).toHaveBeenCalled())
}

describe('CreateSafeStatus', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    listeners.clear()
  })

  it('should, once deployed, add the Safe to the Workspace and go to its home in that Workspace', async () => {
    mockAddNewSafeToUrlSpace.mockResolvedValue(spaceId)

    await deploy()

    expect(mockAddNewSafeToUrlSpace).toHaveBeenCalledWith('137', safeAddress)
    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith({ pathname: '/home', query: { safe: `matic:${safeAddress}`, spaceId } }),
    )
  })

  it('should, when the Safe stays outside the Workspace, go to its home without a Workspace', async () => {
    mockAddNewSafeToUrlSpace.mockResolvedValue(null)

    await deploy()

    await waitFor(() =>
      expect(mockPush).toHaveBeenCalledWith({ pathname: '/home', query: { safe: `matic:${safeAddress}` } }),
    )
  })
})
