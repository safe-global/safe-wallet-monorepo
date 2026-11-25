import type { ReactNode } from 'react'
import { faker } from '@faker-js/faker'
import { OperationType } from '@safe-global/types-kit'
import { act, renderHook, waitFor } from '@/tests/test-utils'
import { TxFlowContext, initialContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import type { SubmitCallback } from '@/components/tx-flow/TxFlow'
import { useSaveAllowlistConfiguration } from '../useSaveAllowlistConfiguration'
import { useSaveBeforeSubmit } from '../useSaveBeforeSubmit'

jest.mock('../useSaveAllowlistConfiguration', () => ({ useSaveAllowlistConfiguration: jest.fn() }))

const request = () => ({
  root: faker.string.hexadecimal({ length: 64, casing: 'lower' }),
  configurations: [
    {
      target: faker.finance.ethereumAddress(),
      selector: '0xa9059cbb',
      operation: OperationType.Call,
      policy: faker.finance.ethereumAddress(),
      data: '0x',
    },
  ],
})

const wrapper = ({ children }: { children: ReactNode }) => (
  <TxFlowContext.Provider
    value={{ ...initialContext, setIsSubmitLoading: jest.fn(), setIsSubmitDisabled: jest.fn() } as TxFlowContextType}
  >
    {children}
  </TxFlowContext.Provider>
)

describe('useSaveBeforeSubmit', () => {
  it('should save every request and then continue to sign, when all saves succeed', async () => {
    const save = jest.fn().mockResolvedValue(true)
    jest.mocked(useSaveAllowlistConfiguration).mockReturnValue({ save, isSaving: false })
    const onSubmit: SubmitCallback = jest.fn()
    const deletion = request()
    const cleanup = request()
    const { result } = renderHook(() => useSaveBeforeSubmit([deletion, cleanup], onSubmit), { wrapper })

    await act(async () => {
      result.current()
    })

    await waitFor(() => expect(onSubmit).toHaveBeenCalledTimes(1))
    expect(save).toHaveBeenCalledWith(deletion)
    expect(save).toHaveBeenCalledWith(cleanup)
  })

  it('should not continue to sign, when one of the saves fails', async () => {
    const save = jest.fn().mockResolvedValueOnce(true).mockResolvedValueOnce(false)
    jest.mocked(useSaveAllowlistConfiguration).mockReturnValue({ save, isSaving: false })
    const onSubmit: SubmitCallback = jest.fn()
    const requests = [request(), request()]
    const { result } = renderHook(() => useSaveBeforeSubmit(requests, onSubmit), { wrapper })

    await act(async () => {
      result.current()
    })

    await waitFor(() => expect(save).toHaveBeenCalledTimes(2))
    expect(onSubmit).not.toHaveBeenCalled()
  })
})
