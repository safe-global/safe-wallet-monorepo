import { useEffect, useCallback, useReducer, useRef } from 'react'

import { ledgerDMKService } from '@/src/services/ledger/ledger-dmk.service'
import { ledgerEthereumService } from '@/src/services/ledger/ledger-ethereum.service'
import logger from '@/src/utils/logger'

interface UseLedgerAddressesParams {
  sessionId?: string
}

type ErrorCode = 'SESSION' | 'LOAD'

type BaseAddress = {
  address: string
  path: string
  index: number
}

type State = {
  addresses: BaseAddress[]
  isLoading: boolean
  error: { code: ErrorCode; message: string } | null
}

type Action =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; payload: BaseAddress[] }
  | { type: 'LOAD_FAILURE'; payload: { code: ErrorCode; message: string } }
  | { type: 'CLEAR_ERROR' }

const initialState: State = {
  addresses: [],
  isLoading: false,
  error: null,
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, isLoading: true, error: null }
    case 'LOAD_SUCCESS': {
      const nextAddresses = [...state.addresses, ...action.payload]
      return { ...state, isLoading: false, addresses: nextAddresses }
    }
    case 'LOAD_FAILURE':
      return { ...state, isLoading: false, error: action.payload }
    case 'CLEAR_ERROR':
      return { ...state, error: null }
    default:
      return state
  }
}

export const useLedgerAddresses = ({ sessionId }: UseLedgerAddressesParams) => {
  const [state, dispatchLocal] = useReducer(reducer, initialState)
  const isLoadingRef = useRef(state.isLoading)

  useEffect(() => {
    isLoadingRef.current = state.isLoading
  }, [state.isLoading])

  const validateSession = useCallback((): boolean => {
    if (!sessionId) {
      dispatchLocal({ type: 'LOAD_FAILURE', payload: { code: 'SESSION', message: 'No device session found' } })
      return false
    }

    const session = ledgerDMKService.getCurrentSession()
    if (!session || session !== sessionId) {
      dispatchLocal({
        type: 'LOAD_FAILURE',
        payload: { code: 'SESSION', message: 'Device session not found or expired' },
      })
      return false
    }

    return true
  }, [sessionId])

  const fetchAddresses = useCallback(
    async (count: number) => {
      if (!validateSession()) {
        return
      }

      // Prevent overlapping loads
      if (isLoadingRef.current) {
        return
      }
      dispatchLocal({ type: 'LOAD_START' })

      try {
        const session = ledgerDMKService.getCurrentSession()
        if (!session) {
          throw new Error('No session available')
        }

        const startIndex = state.addresses.length
        const addresses = await ledgerEthereumService.getEthereumAddresses(session, count, startIndex)
        const base = addresses.map((a) => ({ address: a.address, path: a.path, index: a.index }))
        dispatchLocal({ type: 'LOAD_SUCCESS', payload: base })
      } catch (error) {
        logger.error('Error loading addresses:', error)
        dispatchLocal({ type: 'LOAD_FAILURE', payload: { code: 'LOAD', message: 'Failed to load addresses' } })
      }
    },
    [validateSession, state.addresses.length],
  )

  return {
    addresses: state.addresses,
    isLoading: state.isLoading,
    error: state.error,
    clearError: () => dispatchLocal({ type: 'CLEAR_ERROR' }),
    fetchAddresses,
  }
}
