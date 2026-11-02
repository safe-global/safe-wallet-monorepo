import { faker } from '@faker-js/faker'
import { act, renderHook } from '@/tests/test-utils'
import type { NamedAddress } from '@/components/new-safe/create/types'
import { useCardStepper } from '../useCardStepper'

jest.mock('@/services/analytics')
jest.mock('@/services/analytics/types')
jest.mock('@/services/analytics/events/addressBook')
jest.mock('@/services/analytics/events/addressPoisoning')
jest.mock('@/services/analytics/events/assets')
jest.mock('@/services/analytics/events/createLoadSafe')
jest.mock('@/services/analytics/events/hypernative')
jest.mock('@/services/analytics/events/modals')
jest.mock('@/services/analytics/events/overview')
jest.mock('@/services/analytics/events/safeApps')
jest.mock('@/services/analytics/events/settings')
jest.mock('@/services/analytics/events/txList')
jest.mock('@/services/analytics/events/wallet')
jest.mock('@/services/analytics/events/batching')
jest.mock('@/services/analytics/events/safe-shield')
jest.mock('@/services/analytics/events/safenet')
jest.mock('@/services/analytics/mixpanel-events')

type StepData = { name: string; owners: NamedAddress[] }

const step = { title: '', subtitle: '', render: () => <div /> }

describe('useCardStepper', () => {
  it('keeps the data a step hands back when going to the previous step', () => {
    const signer = { name: 'David', address: faker.finance.ethereumAddress() }
    const { result } = renderHook(() =>
      useCardStepper<StepData>({
        steps: [step, step, step],
        initialData: { name: 'Main', owners: [] },
        onClose: jest.fn(),
      }),
    )

    act(() => result.current.onSubmit({ name: 'Main' }))
    act(() => result.current.onBack({ owners: [signer] }))

    expect(result.current.activeStep).toBe(0)
    expect(result.current.stepData).toEqual({ name: 'Main', owners: [signer] })
  })
})
