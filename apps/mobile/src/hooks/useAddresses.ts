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
  | { type: 'CLEAR_ADDRESSES' }

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

    case 'CLEAR_ADDRESSES':
      return { ...initialState }

    default:
      return state
  }
}

interface UseAddressesConfig<T extends BaseAddress, TExtra extends unknown[] = []> {
  fetchAddresses: (count: number, startIndex: number, ...args: TExtra) => Promise<T[]>
  validateInput?: () => { isValid: boolean; error?: { code: string; message: string } }
}

export const useAddresses = <T extends BaseAddress, TExtra extends unknown[] = []>({
  fetchAddresses,
  validateInput,
}: UseAddressesConfig<T, TExtra>) => {
  const [state, dispatchLocal] = useReducer(reducer<T>, initialState)
  const isLoadingRef = useRef(state.isLoading)

  useEffect(() => {
    isLoadingRef.current = state.isLoading
  }, [state.isLoading])

  const loadAddresses = useCallback(
    async (count: number, explicitStartIndex?: number, ...extraArgs: TExtra) => {
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
        const startIndex = explicitStartIndex ?? state.addresses.length
        const addresses = await fetchAddresses(count, startIndex, ...extraArgs)
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
    clearAddresses: () => dispatchLocal({ type: 'CLEAR_ADDRESSES' }),
  }
}
