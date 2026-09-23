import { renderHook } from '@testing-library/react'
import { asActivePolicy, mockProposerPolicy } from '../../../mocks/policies'
import { ProposerStatus } from '../../../ProposerDrawer'
import { getProposerStatus, useProposerDetails } from '../useProposerDetails'

jest.mock('../useActiveProposer', () => ({ useActiveProposer: () => ({ source: 'active' }) }))
jest.mock('../usePendingProposer', () => ({ usePendingProposer: () => ({ source: 'pending' }) }))
jest.mock('../useNotActiveProposer', () => ({ useNotActiveProposer: () => ({ source: 'not-active' }) }))

const enabledPolicy = asActivePolicy(mockProposerPolicy())
const disabledPolicy = asActivePolicy(mockProposerPolicy({ enabled: false }))

describe('getProposerStatus', () => {
  it('should, when the grant is enabled, call the proposer active', () => {
    expect(getProposerStatus(enabledPolicy)).toBe(ProposerStatus.ACTIVE)
  })

  it('should, when the grant is not enabled, call the proposer not activated', () => {
    expect(getProposerStatus(disabledPolicy)).toBe(ProposerStatus.NOT_ACTIVATED)
  })
})

describe('useProposerDetails', () => {
  it('should, when the grant is enabled, return what the active hook built', () => {
    const { result } = renderHook(() =>
      useProposerDetails({ policy: enabledPolicy, proposer: enabledPolicy.data.proposers[0] }),
    )

    expect(result.current).toEqual({ source: 'active' })
  })

  it('should, when the grant is not enabled, return what the not-active hook built', () => {
    const { result } = renderHook(() =>
      useProposerDetails({ policy: disabledPolicy, proposer: disabledPolicy.data.proposers[0] }),
    )

    expect(result.current).toEqual({ source: 'not-active' })
  })
})
