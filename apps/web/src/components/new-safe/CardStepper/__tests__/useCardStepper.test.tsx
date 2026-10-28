import { faker } from '@faker-js/faker'
import { act, renderHook } from '@/tests/test-utils'
import type { NamedAddress } from '@/components/new-safe/create/types'
import { useCardStepper } from '../useCardStepper'

jest.mock('@/services/analytics')

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
