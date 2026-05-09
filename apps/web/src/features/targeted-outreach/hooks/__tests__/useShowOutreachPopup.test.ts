import { renderHook } from '@testing-library/react'
import useShowOutreachPopup from '../useShowOutreachPopup'
import * as useIsSafeOwner from '@/hooks/useIsSafeOwner'
import * as store from '@/store'
import { HOUR_IN_MS } from '../../constants'
import { faker } from '@faker-js/faker'

jest.mock('@/hooks/useIsSafeOwner')
jest.mock('@/store')

beforeEach(() => {
  jest.mock('@/hooks/useSafeAddress', () => ({
    default: jest.fn(() => faker.finance.ethereumAddress()),
  }))
})

afterEach(() => {
  jest.resetAllMocks()
})

describe('useShowOutreachPopup', () => {
  it('should return false when the cookie banner is open', async () => {
    jest.spyOn(useIsSafeOwner, 'default').mockReturnValueOnce(true)
    jest.spyOn(store, 'useAppSelector').mockReturnValueOnce({ open: true }) // mock cookie banner state

    const submission = {
      outreachId: 1,
      targetedSafeId: 1,
      signerAddress: faker.finance.ethereumAddress(),
      completionDate: null,
    }

    const { result } = renderHook(() => useShowOutreachPopup(false, undefined, submission))
    expect(result.current).toEqual(false)
  })

  it('should return false for targeted safes that are already marked as completed', async () => {
    jest.spyOn(useIsSafeOwner, 'default').mockReturnValueOnce(true)
    jest.spyOn(store, 'useAppSelector').mockReturnValueOnce({ open: false })

    const submission = {
      outreachId: 1,
      targetedSafeId: 1,
      signerAddress: faker.finance.ethereumAddress(),
      completionDate: faker.date.recent().getTime().toString(),
    }
    const { result } = renderHook(() => useShowOutreachPopup(false, undefined, submission))
    expect(result.current).toEqual(false)
  })

  it('should return false for non targeted safes', async () => {
    jest.spyOn(useIsSafeOwner, 'default').mockReturnValueOnce(true)
    jest.spyOn(store, 'useAppSelector').mockReturnValueOnce({ open: false })

    const submission = undefined

    const { result } = renderHook(() => useShowOutreachPopup(false, undefined, submission))
    expect(result.current).toEqual(false)
  })

  it('should return true for signers of targeted safes', async () => {
    jest.spyOn(useIsSafeOwner, 'default').mockReturnValueOnce(true)
    jest.spyOn(store, 'useAppSelector').mockReturnValueOnce({ open: false })

    const submission = {
      outreachId: 1,
      targetedSafeId: 1,
      signerAddress: faker.finance.ethereumAddress(),
      completionDate: null,
    }

    const { result } = renderHook(() => useShowOutreachPopup(false, undefined, submission))
    expect(result.current).toEqual(true)
  })

  it('should return false if a targeted user has previously closed the popup', async () => {
    jest.spyOn(useIsSafeOwner, 'default').mockReturnValueOnce(true)
    jest.spyOn(store, 'useAppSelector').mockReturnValueOnce({ open: false })

    const submission = {
      outreachId: 1,
      targetedSafeId: 1,
      signerAddress: faker.finance.ethereumAddress(),
      completionDate: null,
    }

    const { result } = renderHook(() => useShowOutreachPopup(true, undefined, submission))
    expect(result.current).toEqual(false)
  })

  it('should return false if the user has chosen ask me later within the same session and before the maximum delay', async () => {
    jest.spyOn(useIsSafeOwner, 'default').mockReturnValueOnce(true)
    jest.spyOn(store, 'useAppSelector').mockReturnValueOnce({ open: false })

    const submission = {
      outreachId: 1,
      targetedSafeId: 1,
      signerAddress: faker.finance.ethereumAddress(),
      completionDate: null,
    }

    const { result } = renderHook(() => useShowOutreachPopup(false, Date.now() - HOUR_IN_MS * 2, submission))
    expect(result.current).toEqual(false)
  })

  it('should return true if the user has chosen ask me later within the same session but after the maximum delay of 24 hours', async () => {
    jest.spyOn(useIsSafeOwner, 'default').mockReturnValueOnce(true)
    jest.spyOn(store, 'useAppSelector').mockReturnValueOnce({ open: false })

    const submission = {
      outreachId: 1,
      targetedSafeId: 1,
      signerAddress: faker.finance.ethereumAddress(),
      completionDate: null,
    }

    const { result } = renderHook(() => useShowOutreachPopup(false, Date.now() - HOUR_IN_MS * 25, submission))
    expect(result.current).toEqual(true)
  })
})
