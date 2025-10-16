import { useCallback, useReducer, useRef, useEffect } from 'react'

export interface BaseAddress {
  address: string
  path: string
  index: number
}

interface State<T extends BaseAddress> {
  addresses: T[]
  isLoading: boolean
  error: { code: string; message: string } | null
}

type Action<T extends BaseAddress> =
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; payload: T[] }
  | { type: 'LOAD_FAILURE'; payload: { code: string; message: string } }
  | { type: 'CLEAR_ERROR' }

const initialState = {
  addresses: [],
  isLoading: false,
  error: null,
}

function reducer<T extends BaseAddress>(state: State<T>, action: Action<T>): State<T> {
  switch (action.type) {
    case 'LOAD_START':
      return { ...state, isLoading: true, error: null }

    case 'LOAD_SUCCESS':
      return {
        ...state,
        isLoading: false,
        addresses: [...state.addresses, ...action.payload],
        error: null,
      }

    case 'LOAD_FAILURE':
      return {
        ...state,
        isLoading: false,
        error: action.payload,
      }

    case 'CLEAR_ERROR':
      return { ...state, error: null }

    default:
      return state
  }
}

interface UseAddressesConfig<T extends BaseAddress> {
  fetchAddresses: (count: number, startIndex: number) => Promise<T[]>
  validateInput?: () => { isValid: boolean; error?: { code: string; message: string } }
}

export const useAddresses = <T extends BaseAddress>({ fetchAddresses, validateInput }: UseAddressesConfig<T>) => {
  const [state, dispatchLocal] = useReducer(reducer<T>, initialState)
  const isLoadingRef = useRef(state.isLoading)

  useEffect(() => {
    isLoadingRef.current = state.isLoading
  }, [state.isLoading])

  const loadAddresses = useCallback(
    async (count: number) => {
      // Validate input if validator provided
      if (validateInput) {
        const validation = validateInput()
        if (!validation.isValid && validation.error) {
          dispatchLocal({ type: 'LOAD_FAILURE', payload: validation.error })
          return
        }
      }

      // Prevent overlapping loads
      if (isLoadingRef.current) {
        return
      }

      dispatchLocal({ type: 'LOAD_START' })

      try {
        const startIndex = state.addresses.length
        const addresses = await fetchAddresses(count, startIndex)
        dispatchLocal({ type: 'LOAD_SUCCESS', payload: addresses })
      } catch (error) {
        dispatchLocal({
          type: 'LOAD_FAILURE',
          payload: {
            code: 'LOAD',
            message: 'Failed to load addresses',
          },
        })
        throw error // Re-throw for caller to handle logging
      }
    },
    [fetchAddresses, validateInput, state.addresses.length],
  )

  return {
    addresses: state.addresses,
    isLoading: state.isLoading,
    error: state.error,
    clearError: () => dispatchLocal({ type: 'CLEAR_ERROR' }),
    loadAddresses,
  }
}
